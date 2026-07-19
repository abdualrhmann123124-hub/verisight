/**
 * Media source validation.
 *
 * Phase 2 covers the *input* contract only: what the platform will accept and
 * how it tells the user when it cannot. No analysis happens here.
 *
 * The rule from the brief that shapes this file: an unsupported input must
 * never fail silently. Every rejection returns a reason the user can act on.
 */

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
 * Platforms whose public media URLs the analyzer will attempt to resolve.
 *
 * `note` is shown when a link from that platform cannot be fetched. These are
 * honest, specific limitations rather than a generic failure — a user whose
 * private Instagram link fails deserves to know it failed because it is
 * private, not because "something went wrong".
 */
export const SUPPORTED_PLATFORMS = [
  { id: "x", label: "X", hosts: ["x.com", "twitter.com", "t.co"] },
  {
    id: "instagram",
    label: "Instagram",
    hosts: ["instagram.com", "cdninstagram.com"],
    note: "Only public posts can be fetched.",
  },
  { id: "tiktok", label: "TikTok", hosts: ["tiktok.com"] },
  {
    id: "facebook",
    label: "Facebook",
    hosts: ["facebook.com", "fb.watch"],
    note: "Only public posts can be fetched.",
  },
  { id: "threads", label: "Threads", hosts: ["threads.net", "threads.com"] },
  { id: "reddit", label: "Reddit", hosts: ["reddit.com", "redd.it"] },
  { id: "youtube", label: "YouTube", hosts: ["youtube.com", "youtu.be"] },
  { id: "vimeo", label: "Vimeo", hosts: ["vimeo.com"] },
  { id: "imgur", label: "Imgur", hosts: ["imgur.com"] },
  { id: "telegram", label: "Telegram", hosts: ["t.me", "telegram.me"] },
  { id: "discord", label: "Discord", hosts: ["cdn.discordapp.com"] },
] as const;

export type PlatformId = (typeof SUPPORTED_PLATFORMS)[number]["id"];

export type UrlCheck =
  | { status: "empty" }
  | { status: "invalid"; message: string }
  | { status: "insecure"; message: string }
  | { status: "platform"; platform: (typeof SUPPORTED_PLATFORMS)[number] }
  | { status: "direct"; hostname: string }
  | { status: "unsupported"; hostname: string; message: string };

/** Matches a URL ending in a media extension, ignoring any query string. */
const DIRECT_MEDIA_PATTERN = /\.(png|jpe?g|webp|gif|mp4|mov|webm|m4v)$/i;

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
export function checkMediaUrl(raw: string): UrlCheck {
  const value = raw.trim();
  if (!value) return { status: "empty" };

  let url: URL;
  try {
    // Accept a bare host by assuming https, which is what a user pasting
    // "imgur.com/abc" means.
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return { status: "invalid", message: "That does not look like a valid URL." };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return {
      status: "invalid",
      message: "Only http and https links are supported.",
    };
  }

  const hostname = url.hostname.replace(/^www\./, "");

  // Checked before the protocol warning: telling someone their nonsense
  // string should use https would be actively confusing.
  if (!HOSTNAME_PATTERN.test(hostname)) {
    return { status: "invalid", message: "That does not look like a valid URL." };
  }

  if (url.protocol === "http:") {
    return {
      status: "insecure",
      message: "Use an https link — plain http downloads can be tampered with.",
    };
  }

  const platform = SUPPORTED_PLATFORMS.find((p) =>
    p.hosts.some((h) => hostname === h || hostname.endsWith(`.${h}`)),
  );
  if (platform) return { status: "platform", platform };

  if (DIRECT_MEDIA_PATTERN.test(url.pathname)) {
    return { status: "direct", hostname };
  }

  return {
    status: "unsupported",
    hostname,
    message: `${hostname} is not a recognised source. Paste a direct link to an image or video file instead.`,
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
export function checkMediaFile(file: File): FileCheck {
  const name = file.name.toLowerCase();
  const isImage =
    (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type) ||
    /\.(png|jpe?g|webp)$/.test(name);
  const isVideo =
    (ACCEPTED_VIDEO_TYPES as readonly string[]).includes(file.type) ||
    /\.(mp4|mov|webm)$/.test(name);

  if (!isImage && !isVideo) {
    return {
      status: "error",
      message: "Unsupported format. Use PNG, JPG, WEBP, MP4, MOV, or WEBM.",
    };
  }

  if (file.size === 0) {
    return { status: "error", message: "That file is empty or unreadable." };
  }

  const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    return {
      status: "error",
      message: `That file is ${formatBytes(file.size)}. The limit is ${formatBytes(limit)}.`,
    };
  }

  return { status: "ok", kind: isVideo ? "video" : "image" };
}
