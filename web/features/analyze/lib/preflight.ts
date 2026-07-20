import exifr from "exifr";

import {
  checkMediaFile,
  formatBytes,
  type ValidationMessages,
} from "@/features/analyze/lib/media-source";

/**
 * Client-side preflight.
 *
 * Everything here is a real operation on the real file. The staged progress
 * UI is driven by this pipeline's actual state, so a stage marked complete
 * means that work genuinely finished — no timers, no simulated latency.
 *
 * This deliberately stops short of a verdict. Preflight establishes *what the
 * file is* (identity, dimensions, declared provenance). Deciding whether it
 * looks generated requires the forensic and model analyses in `api/`, which
 * do not exist yet, and inventing a score here would be the one shortcut this
 * product cannot take.
 */

export type StageId =
  "validate" | "read" | "fingerprint" | "decode" | "metadata" | "handoff";

export type StageStatus = "pending" | "active" | "done" | "failed" | "blocked";

export interface Stage {
  id: StageId;
  label: string;
  /** Shown while the stage is active — describes the actual operation. */
  detail: string;
  status: StageStatus;
  /** Wall-clock duration in ms, recorded once the stage settles. */
  durationMs?: number;
  note?: string;
}

export const INITIAL_STAGES: readonly Stage[] = [
  {
    id: "validate",
    label: "Validating media",
    detail: "Checking format, size, and integrity",
    status: "pending",
  },
  {
    id: "read",
    label: "Reading file",
    detail: "Loading bytes into memory",
    status: "pending",
  },
  {
    id: "fingerprint",
    label: "Computing fingerprint",
    detail: "SHA-256 over the raw bytes",
    status: "pending",
  },
  {
    id: "decode",
    label: "Decoding media",
    detail: "Reading intrinsic dimensions and duration",
    status: "pending",
  },
  {
    id: "metadata",
    label: "Inspecting metadata",
    detail: "Parsing EXIF, XMP, and provenance tags",
    status: "pending",
  },
  {
    id: "handoff",
    label: "Forensic analysis",
    detail: "Handing off to the analysis engine",
    status: "pending",
  },
] as const;

export interface MediaFacts {
  name: string;
  sizeBytes: number;
  sizeLabel: string;
  mimeType: string;
  kind: "image" | "video";
  sha256: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  /** Present only when the file actually carried these tags. */
  cameraMake?: string;
  cameraModel?: string;
  software?: string;
  capturedAt?: string;
  hasExif: boolean;
  hasGps: boolean;
  /** Tag count, so the UI can say how much metadata was found without
   *  dumping every field at the user. */
  exifTagCount: number;
}

export class PreflightError extends Error {
  constructor(
    override readonly message: string,
    readonly stage: StageId,
    /** Actionable guidance, shown beneath the message. */
    readonly recovery: string,
  ) {
    super(message);
    this.name = "PreflightError";
  }
}

/** Web Crypto returns a buffer; render it as lowercase hex. */
function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Reads intrinsic dimensions by actually decoding the media.
 *
 * This doubles as a corruption check: a file with a valid extension and a
 * plausible size can still be truncated or malformed, and the decoder is the
 * only thing that reliably knows.
 */
function decodeMedia(
  file: File,
  kind: "image" | "video",
  messages: ValidationMessages,
): Promise<{ width: number; height: number; durationSeconds?: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(url);

    // A decode that never settles would hang the pipeline forever.
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(
        new PreflightError(
          messages.decodeTimeout,
          "decode",
          messages.decodeTimeoutRecovery,
        ),
      );
    }, 15000);

    const fail = () => {
      window.clearTimeout(timeout);
      cleanup();
      reject(
        new PreflightError(
          messages.decodeFailed,
          "decode",
          messages.decodeFailedRecovery,
        ),
      );
    };

    if (kind === "image") {
      const img = new Image();
      img.onload = () => {
        window.clearTimeout(timeout);
        const result = { width: img.naturalWidth, height: img.naturalHeight };
        cleanup();
        if (!result.width || !result.height) return fail();
        resolve(result);
      };
      img.onerror = fail;
      img.src = url;
      return;
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      window.clearTimeout(timeout);
      const width = video.videoWidth;
      const height = video.videoHeight;
      // A live stream reports Infinity, so only include a finite duration.
      // Under `exactOptionalPropertyTypes` the key must be absent rather
      // than present-and-undefined.
      const result = {
        width,
        height,
        ...(Number.isFinite(video.duration) && { durationSeconds: video.duration }),
      };
      cleanup();
      if (!width || !height) return fail();
      resolve(result);
    };
    video.onerror = fail;
    video.src = url;
  });
}

/**
 * Parses embedded metadata.
 *
 * Absence of EXIF is itself a signal worth surfacing — camera originals
 * almost always carry it, while generated images and re-encoded screenshots
 * frequently do not. It is *weak* evidence on its own, since every major
 * platform strips metadata on upload, and the UI is careful to say so.
 */
async function readMetadata(
  file: File,
): Promise<
  Pick<
    MediaFacts,
    | "cameraMake"
    | "cameraModel"
    | "software"
    | "capturedAt"
    | "hasExif"
    | "hasGps"
    | "exifTagCount"
  >
> {
  try {
    const parsed: Record<string, unknown> | undefined = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      xmp: true,
    });

    if (!parsed) {
      return { hasExif: false, hasGps: false, exifTagCount: 0 };
    }

    const str = (v: unknown) =>
      typeof v === "string" && v.trim() ? v.trim() : undefined;

    const captured =
      parsed["DateTimeOriginal"] ?? parsed["CreateDate"] ?? parsed["ModifyDate"];

    return {
      ...(str(parsed["Make"]) !== undefined && { cameraMake: str(parsed["Make"])! }),
      ...(str(parsed["Model"]) !== undefined && { cameraModel: str(parsed["Model"])! }),
      ...(str(parsed["Software"]) !== undefined && {
        software: str(parsed["Software"])!,
      }),
      ...(captured instanceof Date && { capturedAt: captured.toISOString() }),
      hasExif: Object.keys(parsed).length > 0,
      hasGps: parsed["latitude"] !== undefined && parsed["longitude"] !== undefined,
      exifTagCount: Object.keys(parsed).length,
    };
  } catch {
    // A metadata block that fails to parse is not a fatal error — the file is
    // still analysable. Report "none found" rather than failing the run.
    return { hasExif: false, hasGps: false, exifTagCount: 0 };
  }
}

export interface PreflightCallbacks {
  onStageChange: (id: StageId, status: StageStatus, durationMs?: number) => void;
}

/**
 * Runs the pipeline, reporting each stage as it genuinely starts and finishes.
 *
 * Yields to the event loop between stages so React can paint the progress
 * update — without it the whole pipeline would complete in one frame and the
 * user would see the final state with no sense of what ran.
 */
export async function runPreflight(
  file: File,
  { onStageChange }: PreflightCallbacks,
  messages: ValidationMessages,
): Promise<MediaFacts> {
  /**
   * Lets React paint the "active" state before the work blocks the thread.
   *
   * Two frames — one to commit the render, one to be sure it reached the
   * screen — raced against a timer.
   *
   * The race matters: browsers stop firing `requestAnimationFrame` entirely
   * in a hidden tab, so waiting on frames alone would freeze the pipeline
   * the moment someone switches away and leave it stuck mid-run when they
   * came back. The timeout is the floor that keeps it progressing; whichever
   * settles first wins.
   */
  const paint = () =>
    new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      requestAnimationFrame(() => requestAnimationFrame(finish));
      window.setTimeout(finish, 120);
    });

  const runStage = async <T>(id: StageId, work: () => Promise<T> | T): Promise<T> => {
    onStageChange(id, "active");
    // Yield *before* the clock starts. Timing the paint delay alongside the
    // work would inflate every reported duration — a progress readout that
    // claims to measure real work must not include the cost of displaying
    // itself.
    await paint();

    const started = performance.now();
    try {
      const result = await work();
      onStageChange(id, "done", Math.round(performance.now() - started));
      return result;
    } catch (error) {
      onStageChange(id, "failed", Math.round(performance.now() - started));
      throw error;
    }
  };

  const kind = await runStage("validate", () => {
    const check = checkMediaFile(file, messages);
    if (check.status === "error") {
      throw new PreflightError(check.message, "validate", messages.formatRecovery);
    }
    return check.kind;
  });

  const buffer = await runStage("read", async () => {
    try {
      return await file.arrayBuffer();
    } catch {
      throw new PreflightError(messages.readFailed, "read", messages.readFailedRecovery);
    }
  });

  const sha256 = await runStage("fingerprint", async () => {
    // Identifies the exact bytes analysed, so a report can be tied back to a
    // specific file rather than a filename that anyone can change.
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return toHex(digest);
  });

  const dimensions = await runStage("decode", () => decodeMedia(file, kind, messages));
  const metadata = await runStage("metadata", () => readMetadata(file));

  return {
    name: file.name,
    sizeBytes: file.size,
    sizeLabel: formatBytes(file.size),
    mimeType: file.type || `${kind}/unknown`,
    kind,
    sha256,
    width: dimensions.width,
    height: dimensions.height,
    ...(dimensions.durationSeconds !== undefined && {
      durationSeconds: dimensions.durationSeconds,
    }),
    ...metadata,
  };
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
