import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Server-side fetch of a remote image.
 *
 * Fetching a URL the user supplies is a server-side request forgery risk: the
 * server sits inside a network the browser cannot reach, so an unguarded fetch
 * turns this route into a proxy for scanning private hosts and cloud metadata
 * endpoints. Every hop is therefore resolved and checked against the private
 * ranges *before* a connection is made, redirects are followed by hand so a
 * public host cannot bounce us onto an internal one, and the response is
 * capped by both declared and streamed size.
 *
 * Scope note: this fetches a direct link to an image file. It deliberately
 * does not scrape post pages — those need per-platform extraction that breaks
 * whenever a platform changes, and pretending otherwise is the kind of promise
 * this product does not make.
 */

export const MAX_REMOTE_BYTES = 25 * 1024 * 1024; // matches the upload limit
const FETCH_TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 3;

export type RemoteFetchFailure =
  | "invalid-url"
  | "blocked-host"
  | "unreachable"
  | "not-an-image"
  | "too-large"
  | "too-many-redirects";

export class RemoteFetchError extends Error {
  constructor(readonly reason: RemoteFetchFailure) {
    super(reason);
    this.name = "RemoteFetchError";
  }
}

export interface RemoteMedia {
  bytes: Uint8Array;
  contentType: string;
  filename: string;
}

/** IPv4 ranges that must never be reachable through a user-supplied URL. */
function isPrivateIPv4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true; // unparseable — refuse rather than guess
  }
  const [a, b] = p as [number, number, number, number];
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0) return true; // 192.0.0.0/24 protocol assignments
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast and reserved
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v === "::" || v === "::1") return true;
  if (v.startsWith("fe80")) return true; // link-local
  // Unique local addresses fc00::/7
  if (/^f[cd]/.test(v)) return true;
  // IPv4-mapped (::ffff:10.0.0.1) — check the embedded address
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped?.[1]) return isPrivateIPv4(mapped[1]);
  return false;
}

function isPrivateAddress(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return isPrivateIPv4(ip);
  if (family === 6) return isPrivateIPv6(ip);
  return true;
}

/**
 * Resolves a hostname and refuses it if *any* address is private.
 *
 * All addresses are checked, not just the first: a host that resolves to one
 * public and one internal address would otherwise be a coin flip.
 */
async function assertPublicHost(hostname: string): Promise<void> {
  // A literal IP needs no lookup — and must not get one, since `lookup` would
  // happily echo it back and skip the check.
  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new RemoteFetchError("blocked-host");
    return;
  }

  let addresses: { address: string }[];
  try {
    addresses = await lookup(hostname, { all: true });
  } catch {
    throw new RemoteFetchError("unreachable");
  }

  if (addresses.length === 0) throw new RemoteFetchError("unreachable");
  if (addresses.some((a) => isPrivateAddress(a.address))) {
    throw new RemoteFetchError("blocked-host");
  }
}

/** Parses and vets a user-supplied URL, assuming https when no scheme is given. */
export function parseRemoteUrl(raw: string): URL {
  const trimmed = raw.trim();
  if (!trimmed) throw new RemoteFetchError("invalid-url");

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    throw new RemoteFetchError("invalid-url");
  }

  // http is refused rather than upgraded: the bytes are the evidence, and a
  // plaintext hop means anyone on the path could have replaced them.
  if (url.protocol !== "https:") throw new RemoteFetchError("invalid-url");
  if (!url.hostname) throw new RemoteFetchError("invalid-url");
  return url;
}

/** Derives a filename from the URL path, falling back to the content type. */
function filenameFor(url: URL, contentType: string): string {
  const last = url.pathname.split("/").filter(Boolean).pop() ?? "";
  const cleaned = last.split("?")[0] ?? "";
  if (/\.(png|jpe?g|webp)$/i.test(cleaned)) return cleaned;
  const ext = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
      ? "webp"
      : "jpg";
  return `${url.hostname.replace(/[^a-z0-9.-]/gi, "") || "remote"}.${ext}`;
}

/**
 * Fetches a remote image, following redirects manually so every hop is vetted.
 */
export async function fetchRemoteImage(rawUrl: string): Promise<RemoteMedia> {
  let url = parseRemoteUrl(rawUrl);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(url.hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          // Some CDNs serve an error page to clients that send no Accept.
          Accept: "image/*",
          "User-Agent": "VeriSight/0.1 (+media-authenticity-analysis)",
        },
      });
    } catch {
      throw new RemoteFetchError("unreachable");
    } finally {
      clearTimeout(timer);
    }

    // Follow the redirect ourselves, re-vetting the next host.
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new RemoteFetchError("unreachable");
      try {
        url = parseRemoteUrl(new URL(location, url).toString());
      } catch {
        throw new RemoteFetchError("blocked-host");
      }
      continue;
    }

    if (!response.ok) throw new RemoteFetchError("unreachable");

    const contentType = (response.headers.get("content-type") ?? "")
      .split(";")[0]!
      .trim()
      .toLowerCase();
    if (!/^image\/(png|jpeg|jpg|webp)$/.test(contentType)) {
      throw new RemoteFetchError("not-an-image");
    }

    // Trust the declared length only as an early exit; it can lie, so the
    // streamed total is what actually enforces the cap.
    const declared = Number(response.headers.get("content-length") ?? "");
    if (Number.isFinite(declared) && declared > MAX_REMOTE_BYTES) {
      throw new RemoteFetchError("too-large");
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0) throw new RemoteFetchError("not-an-image");
    if (buffer.byteLength > MAX_REMOTE_BYTES) throw new RemoteFetchError("too-large");

    return {
      bytes: new Uint8Array(buffer),
      contentType,
      filename: filenameFor(url, contentType),
    };
  }

  throw new RemoteFetchError("too-many-redirects");
}
