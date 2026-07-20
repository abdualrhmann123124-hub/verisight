/**
 * Frame extraction, in the browser.
 *
 * The engine measures still images. To say anything about a video it has to be
 * given frames, and the obvious way to produce them — ffmpeg on the server —
 * would mean uploading the whole clip and running a second binary. A `<video>`
 * element already contains a decoder, so seeking it and painting to a canvas
 * gets the same frames without either.
 *
 * Sampling is spread across the middle of the clip rather than the whole of
 * it: the first and last moments are routinely a fade, a black frame, or a
 * title card, none of which carry the sensor and compression evidence the
 * analyzers read.
 */

/** Frames beyond this are diminishing returns for a linear cost in analysis. */
export const DEFAULT_FRAME_COUNT = 9;

/** Long edge cap. Frames are evidence, not thumbnails — but a 4K frame costs
 *  upload time for detail the analyzers do not use. */
const MAX_EDGE = 1600;

/** A single seek that never settles would hang the whole run. */
const SEEK_TIMEOUT_MS = 10_000;

export interface VideoFrame {
  /** Position in the clip, seconds. */
  time: number;
  /** JPEG bytes, ready to send to the engine as a file. */
  blob: Blob;
  /** Object URL for display. The caller owns revoking it. */
  previewUrl: string;
}

export class FrameExtractionError extends Error {
  constructor(readonly reason: "decode" | "empty" | "timeout") {
    super(reason);
    this.name = "FrameExtractionError";
  }
}

function waitFor(
  element: HTMLVideoElement,
  event: "loadeddata" | "seeked",
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new FrameExtractionError("timeout"));
    }, SEEK_TIMEOUT_MS);

    const onDone = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new FrameExtractionError("decode"));
    };
    function cleanup() {
      window.clearTimeout(timer);
      element.removeEventListener(event, onDone);
      element.removeEventListener("error", onError);
    }

    element.addEventListener(event, onDone, { once: true });
    element.addEventListener("error", onError, { once: true });
  });
}

/**
 * Evenly spaced sample points across the middle 90% of the clip.
 *
 * Returns times strictly inside the duration — seeking exactly to the end
 * lands past the last decodable frame in several browsers and yields a blank
 * canvas rather than an error.
 */
function samplePoints(duration: number, count: number): number[] {
  const start = duration * 0.05;
  const span = duration * 0.9;
  if (!Number.isFinite(span) || span <= 0) return [0];
  return Array.from({ length: count }, (_, i) =>
    Math.min(duration - 0.05, start + (span * (i + 0.5)) / count),
  );
}

/**
 * Decodes `count` frames from a video file.
 *
 * `onProgress` fires after each frame so the UI can show real progress rather
 * than a spinner that says nothing about how long is left.
 */
export async function extractFrames(
  file: File,
  count: number = DEFAULT_FRAME_COUNT,
  onProgress?: (done: number, total: number) => void,
): Promise<VideoFrame[]> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  // Without this a frame drawn from a cross-origin source taints the canvas
  // and `toBlob` throws. Local blobs are same-origin, but this keeps the
  // function safe if it is ever handed a remote URL.
  video.crossOrigin = "anonymous";
  video.src = url;

  const frames: VideoFrame[] = [];

  try {
    await waitFor(video, "loadeddata");

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) throw new FrameExtractionError("decode");

    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new FrameExtractionError("decode");

    const points = samplePoints(duration, count);

    for (const [index, time] of points.entries()) {
      video.currentTime = time;
      await waitFor(video, "seeked");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        // Quality 0.92: high enough that the re-encode does not erase the
        // compression evidence the analyzers are about to measure.
        canvas.toBlob(resolve, "image/jpeg", 0.92),
      );
      if (!blob) continue;

      frames.push({ time, blob, previewUrl: URL.createObjectURL(blob) });
      onProgress?.(index + 1, points.length);
    }

    if (frames.length === 0) throw new FrameExtractionError("empty");
    return frames;
  } finally {
    // Release the decoder promptly; a detached <video> holding a blob URL
    // keeps the whole file alive in memory.
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
