import { NextResponse } from "next/server";

/**
 * BFF route: proxies an upload to the analysis engine.
 *
 * Sitting between the browser and the engine keeps the engine's address
 * server-side, gives the web layer a place to own limits and rate limiting,
 * and means the browser never needs CORS access to a second origin.
 *
 * The engine is stateless and holds no credentials, so nothing sensitive
 * crosses this boundary — but the size guard belongs here regardless, so an
 * oversized body is rejected before it is forwarded anywhere.
 */

const MAX_BYTES = 25 * 1024 * 1024;
const ENGINE_TIMEOUT_MS = 60_000;

const ACCEPTED = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

/**
 * Where to look for the engine.
 *
 * Resolution order is deliberate:
 *
 *   1. `ANALYSIS_ENGINE_URL` — an explicit override always wins.
 *   2. `.engine.json` — written by `npm run api` with the address that
 *      instance actually bound.
 *   3. The default port, as a last resort.
 *
 * Step 2 exists because probing a port range is not equivalent, even though
 * it looks it. A stale engine left listening on the default port answers a
 * health check perfectly well, so probing can bind to an old process running
 * old code instead of the instance just started — silently serving wrong
 * results, which is the worst possible failure for this product. Reading the
 * address the launcher recorded removes the guess.
 */
const EXPLICIT_URL = process.env["ANALYSIS_ENGINE_URL"];
const DEFAULT_URL = "http://127.0.0.1:8000";
const HANDSHAKE_FILE = ".engine.json";

async function isHealthy(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/health`, {
      signal: AbortSignal.timeout(1500),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Reads the launcher's handshake file, if the engine is running locally. */
async function readHandshakeUrl(): Promise<string | null> {
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    // `process.cwd()` is web/ under `next dev`; the file sits at the repo root.
    const raw = await readFile(join(process.cwd(), "..", HANDSHAKE_FILE), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "url" in parsed &&
      typeof (parsed as { url: unknown }).url === "string"
    ) {
      return (parsed as { url: string }).url;
    }
  } catch {
    // No file, unreadable, or malformed — fall through to the default.
  }
  return null;
}

async function resolveEngineUrl(): Promise<string | null> {
  if (EXPLICIT_URL) {
    return (await isHealthy(EXPLICIT_URL)) ? EXPLICIT_URL : null;
  }

  const handshake = await readHandshakeUrl();
  if (handshake && (await isHealthy(handshake))) return handshake;

  return (await isHealthy(DEFAULT_URL)) ? DEFAULT_URL : null;
}

export async function POST(request: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ detail: "Expected a multipart upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ detail: "No file was provided." }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ detail: "The file is empty." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        detail: `File is ${(file.size / 1_048_576).toFixed(1)} MB; the limit is 25 MB.`,
      },
      { status: 413 },
    );
  }

  // A client-supplied MIME type is a hint, not proof — the engine's decoder
  // is what actually settles whether these bytes are an image. Rejecting an
  // obviously wrong type here just saves a round trip.
  if (file.type && !ACCEPTED.has(file.type)) {
    return NextResponse.json(
      { detail: "Supported formats are PNG, JPEG, and WEBP." },
      { status: 415 },
    );
  }

  const engineUrl = await resolveEngineUrl();
  if (!engineUrl) {
    return NextResponse.json(
      {
        detail:
          "The analysis engine is not running. Start it in a second terminal with: npm run api",
      },
      { status: 503 },
    );
  }

  const upstream = new FormData();
  upstream.append("file", file, file.name);

  // Without a timeout a hung engine would hold the request open until the
  // platform's own limit, which is far longer than a user will wait.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ENGINE_TIMEOUT_MS);

  try {
    const response = await fetch(`${engineUrl}/api/v1/analyze`, {
      method: "POST",
      body: upstream,
      signal: controller.signal,
    });

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const detail =
        typeof payload === "object" &&
        payload !== null &&
        "detail" in payload &&
        typeof (payload as { detail: unknown }).detail === "string"
          ? (payload as { detail: string }).detail
          : "The engine could not analyze this file.";
      return NextResponse.json({ detail }, { status: response.status });
    }

    return NextResponse.json(payload);
  } catch {
    // Covers both the engine being down and the timeout firing. 503 is what
    // the client maps to its "engine unavailable" state, which is a distinct,
    // recoverable condition rather than a rejection of the file.
    return NextResponse.json(
      {
        detail:
          "The analysis engine is not responding. It may not be running — start it with `npm run api`.",
      },
      { status: 503 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

/** Reports whether the engine is reachable, so the UI can say so up front. */
export async function GET(): Promise<Response> {
  const engineUrl = await resolveEngineUrl();
  if (!engineUrl) return NextResponse.json({ available: false }, { status: 200 });

  try {
    const response = await fetch(`${engineUrl}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error("unhealthy");
    return NextResponse.json({
      available: true,
      url: engineUrl,
      ...(await response.json()),
    });
  } catch {
    return NextResponse.json({ available: false }, { status: 200 });
  }
}
