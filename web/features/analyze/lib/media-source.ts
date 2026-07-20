/**
 * Media source validation.
 *
 * Phase 2 covers the *input* contract only: what the platform will accept and
 * how it tells the user when it cannot. No analysis happens here.
 *
 * The rule from the brief that shapes this file: an unsupported input must
 * never fail silently. Every rejection returns a reason the user can act on.
 *
 * The reason strings are passed in rather than hard-coded, so this validator
 * stays locale-agnostic and the copy lives in one place with the rest of the
 * dictionary.
 */

import type { Dictionary } from "@/lib/i18n/dictionaries/en";

/** The `validation` slice of the dictionary — the messages this file needs. */
export type ValidationMessages = Dictionary["validation"];

export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export const ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES] as const;

/** Accept attribute for the file picker. Extensions are included alongside
 *  MIME types because some platforms report an empty `type` for .mov. */
export const FILE_ACCEPT = ".png,.jpg,.jpeg,.webp,.mp4,.mov,.webm,image/*,video/*";

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 MB

/**
 * What a link can and cannot reach.
 *
 * A **direct link to an image file** is fetched server-side (see
 * `remote-fetch`) and analysed exactly like an upload — same preflight, same
 * engine, same report.
 *
 * A **post page** on a platform is not. Reading one means scraping HTML that
 * changes without notice, and most platforms block automated access outright;
 * a feature that works until the next deploy is worse than an honest refusal.
 * YouTube is the one exception, and only partly: its cover image lives at a
 * stable public URL, so that image can be analysed — the video cannot, and the
 * UI says which of the two it is about to look at.
 *
 * **Video** is refused everywhere. The engine measures still frames; giving it
 * a clip would need frame extraction and temporal aggregation that do not
 * exist yet.
 */

/**
 * Platforms whose links the input can *recognise*.
 *
 * Recognition is genuinely useful: it lets the field tell a user their link
 * was understood and exactly what can be done with it — fetched (YouTube's
 * cover image), or refused with a reason (post pages, video).
 *
 * `kind` records what a link from each platform actually yields, because the
 * engine handles images only.
 */
export const SUPPORTED_PLATFORMS = [
  { id: "x", label: "X", hosts: ["x.com", "twitter.com", "t.co"], kind: "mixed" },
  {
    id: "instagram",
    label: "Instagram",
    hosts: ["instagram.com", "cdninstagram.com"],
    kind: "mixed",
  },
  { id: "tiktok", label: "TikTok", hosts: ["tiktok.com"], kind: "video" },
  {
    id: "facebook",
    label: "Facebook",
    hosts: ["facebook.com", "fb.watch"],
    kind: "mixed",
  },
  {
    id: "threads",
    label: "Threads",
    hosts: ["threads.net", "threads.com"],
    kind: "mixed",
  },
  { id: "reddit", label: "Reddit", hosts: ["reddit.com", "redd.it"], kind: "mixed" },
  { id: "youtube", label: "YouTube", hosts: ["youtube.com", "youtu.be"], kind: "video" },
  { id: "vimeo", label: "Vimeo", hosts: ["vimeo.com"], kind: "video" },
  { id: "imgur", label: "Imgur", hosts: ["imgur.com"], kind: "image" },
  { id: "telegram", label: "Telegram", hosts: ["t.me", "telegram.me"], kind: "mixed" },
  {
    id: "discord",
    label: "Discord",
    hosts: ["cdn.discordapp.com"],
    kind: "mixed",
  },
] as const;

export type PlatformId = (typeof SUPPORTED_PLATFORMS)[number]["id"];

export type Platform = (typeof SUPPORTED_PLATFORMS)[number];

export type UrlCheck =
  | { status: "empty" }
  | { status: "invalid"; message: string }
  | { status: "insecure"; message: string }
  /** Direct link to a still image — fetched and analysed like an upload. */
  | { status: "image"; hostname: string; fetchUrl: string }
  /** YouTube — only the cover image is reachable, never the video itself. */
  | { status: "thumbnail"; label: string; fetchUrl: string }
  /** Direct link to a video file — the engine reads stills only. */
  | { status: "videoFile"; hostname: string }
  /** A recognised post page: understood, but not fetchable. */
  | { status: "platform"; platform: Platform }
  | { status: "unsupported"; hostname: string; message: string };

/** The URL to fetch when the check produced something analysable. */
export function analysableUrl(check: UrlCheck): string | null {
  return check.status === "image" || check.status === "thumbnail" ? check.fetchUrl : null;
}

/** Direct links, matched on the path so a query string does not defeat them. */
const DIRECT_IMAGE_PATTERN = /\.(png|jpe?g|webp)$/i;
const DIRECT_VIDEO_PATTERN = /\.(gif|mp4|mov|webm|m4v)$/i;

/**
 * YouTube's cover image, which — unlike a post page — sits at a stable public
 * URL. `hqdefault` is used rather than `maxresdefault` because it exists for
 * every video, and a link that sometimes 404s is not worth the extra pixels.
 */
function youtubeCoverImage(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  let id: string | null = null;

  if (host === "youtu.be") {
    id = (url.pathname.split("/").filter(Boolean)[0] ?? null) as string | null;
  } else if (host === "youtube.com" || host.endsWith(".youtube.com")) {
    id =
      url.pathname === "/watch"
        ? url.searchParams.get("v")
        : (url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] ?? null);
  }

  return id && /^[\w-]{6,20}$/.test(id)
    ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    : null;
}

/**
 * A plausible public hostname: dot-separated labels of alphanumerics and
 * hyphens, ending in a 2+ character TLD.
 *
 * This check is necessary because `new URL()` is far more permissive than it
 * looks — it accepts free text by percent-encoding it, so `"not a url"`
 * parses successfully and yields a "hostname" of `not%20a%20url`. Without
 * this guard, obvious nonsense is misreported as an unrecognised *source*,
 * and the user is shown percent-encoding they never typed.
 */
const HOSTNAME_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;

/**
 * Classifies a pasted URL without fetching it.
 *
 * Runs on every keystroke to drive the input's live feedback, so it stays
 * purely syntactic — no network, no allocation beyond the parse.
 */
export function checkMediaUrl(raw: string, msg: ValidationMessages): UrlCheck {
  const value = raw.trim();
  if (!value) return { status: "empty" };

  let url: URL;
  try {
    // Accept a bare host by assuming https, which is what a user pasting
    // "imgur.com/abc" means.
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return { status: "invalid", message: msg.urlMalformed };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { status: "invalid", message: msg.urlProtocol };
  }

  const hostname = url.hostname.replace(/^www\./, "");

  // Checked before the protocol warning: telling someone their nonsense
  // string should use https would be actively confusing.
  if (!HOSTNAME_PATTERN.test(hostname)) {
    return { status: "invalid", message: msg.urlMalformed };
  }

  if (url.protocol === "http:") {
    return { status: "insecure", message: msg.urlInsecure };
  }

  const platform = SUPPORTED_PLATFORMS.find((p) =>
    p.hosts.some((h) => hostname === h || hostname.endsWith(`.${h}`)),
  );
  if (platform) {
    // YouTube's cover image is publicly addressable, so that much is real.
    const cover = youtubeCoverImage(url);
    if (cover) return { status: "thumbnail", label: platform.label, fetchUrl: cover };
    return { status: "platform", platform };
  }

  if (DIRECT_IMAGE_PATTERN.test(url.pathname)) {
    return { status: "image", hostname, fetchUrl: url.toString() };
  }

  if (DIRECT_VIDEO_PATTERN.test(url.pathname)) {
    return { status: "videoFile", hostname };
  }

  return {
    status: "unsupported",
    hostname,
    message: msg.urlUnsupported.replace("{host}", hostname),
  };
}

export type FileCheck =
  { status: "ok"; kind: "image" | "video" } | { status: "error"; message: string };

/** Formats bytes for a user-facing message. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validates a dropped or picked file.
 *
 * Type is checked by MIME with an extension fallback: some browsers and
 * operating systems report an empty `type` for .mov and .webm, and rejecting
 * a valid file because the OS was vague is not the user's fault to absorb.
 *
 * This is a UX guard, not a security control. A client-side MIME string is
 * trivially spoofed, so the server re-validates by inspecting actual file
 * headers before anything is decoded (Phase 4).
 */
export function checkMediaFile(file: File, msg: ValidationMessages): FileCheck {
  const name = file.name.toLowerCase();
  const isImage =
    (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type) ||
    /\.(png|jpe?g|webp)$/.test(name);
  const isVideo =
    (ACCEPTED_VIDEO_TYPES as readonly string[]).includes(file.type) ||
    /\.(mp4|mov|webm)$/.test(name);

  if (!isImage && !isVideo) {
    return { status: "error", message: msg.fileFormat };
  }

  if (file.size === 0) {
    return { status: "error", message: msg.fileEmpty };
  }

  const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    return {
      status: "error",
      message: msg.fileTooLarge
        .replace("{size}", formatBytes(file.size))
        .replace("{limit}", formatBytes(limit)),
    };
  }

  return { status: "ok", kind: isVideo ? "video" : "image" };
}
