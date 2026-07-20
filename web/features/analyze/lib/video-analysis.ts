import { requestAnalysis, type AnalysisResponse } from "@/features/analyze/lib/engine";
import {
  extractFrames,
  DEFAULT_FRAME_COUNT,
  type VideoFrame,
} from "@/features/analyze/lib/video-frames";

/**
 * Video analysis: run the still-image engine over sampled frames.
 *
 * What this deliberately does **not** do is invent a video-level verdict. The
 * engine's aggregation is defined over one image's analyzers; re-implementing
 * it across frames in the client would produce a second, undocumented scoring
 * rule and present it with the same authority as the real one.
 *
 * So each frame keeps its own engine report, and what is added here is only
 * arithmetic the reader can check: how many frames were looked at, the spread
 * of their scores, which frame scored highest, and which one the engine had
 * the most evidence to work with. The detailed report shown is that frame's —
 * a real assessment of a real frame, not an average pretending to be one.
 */

export interface FrameResult {
  time: number;
  previewUrl: string;
  result: AnalysisResponse;
}

export interface VideoAssessment {
  frames: FrameResult[];
  /** Mean of the per-frame scores, weighted by how much evidence each had.
   *  A frame the analyzers could barely read should not pull the average. */
  meanLikelihood: number;
  meanEvidence: number;
  /** The frame that scored highest — what a reviewer should look at first. */
  peak: FrameResult;
  /** The frame with the most surviving evidence: the most trustworthy single
   *  report in the set, and the one shown in full by default. */
  representative: FrameResult;
  /** How many frames landed on a synthetic-leaning verdict. */
  syntheticLeaning: number;
}

export type VideoStage = "extracting" | "analyzing";

export interface VideoProgress {
  stage: VideoStage;
  done: number;
  total: number;
}

/** Frees the object URLs held by a completed assessment. */
export function releaseVideoAssessment(assessment: VideoAssessment | null): void {
  assessment?.frames.forEach((f) => URL.revokeObjectURL(f.previewUrl));
}

function summarise(frames: FrameResult[]): VideoAssessment {
  // Weight by evidence, with a floor so a zero-evidence frame still counts a
  // little rather than vanishing from the mean entirely.
  let weighted = 0;
  let weight = 0;
  let evidence = 0;

  for (const frame of frames) {
    const w = Math.max(0.1, frame.result.assessment.evidence_strength / 100);
    weighted += frame.result.assessment.synthetic_likelihood * w;
    weight += w;
    evidence += frame.result.assessment.evidence_strength;
  }

  const peak = frames.reduce((best, f) =>
    f.result.assessment.synthetic_likelihood > best.result.assessment.synthetic_likelihood
      ? f
      : best,
  );
  const representative = frames.reduce((best, f) =>
    f.result.assessment.evidence_strength > best.result.assessment.evidence_strength
      ? f
      : best,
  );

  return {
    frames,
    meanLikelihood: weight > 0 ? weighted / weight : 50,
    meanEvidence: evidence / frames.length,
    peak,
    representative,
    syntheticLeaning: frames.filter((f) =>
      f.result.assessment.verdict.includes("synthetic"),
    ).length,
  };
}

/**
 * Samples a video and analyses each frame.
 *
 * Frames are analysed one at a time rather than in parallel: the engine is a
 * single local process, and firing nine concurrent requests at it makes the
 * whole run slower while making the progress readout meaningless.
 */
export async function analyzeVideo(
  file: File,
  onProgress: (progress: VideoProgress) => void,
  frameCount: number = DEFAULT_FRAME_COUNT,
): Promise<VideoAssessment> {
  const frames: VideoFrame[] = await extractFrames(file, frameCount, (done, total) =>
    onProgress({ stage: "extracting", done, total }),
  );

  const results: FrameResult[] = [];
  for (const [index, frame] of frames.entries()) {
    onProgress({ stage: "analyzing", done: index, total: frames.length });
    const asFile = new File([frame.blob], `frame-${index + 1}.jpg`, {
      type: "image/jpeg",
    });
    try {
      results.push({
        time: frame.time,
        previewUrl: frame.previewUrl,
        result: await requestAnalysis(asFile),
      });
    } catch {
      // One unreadable frame should not lose the other eight. It is dropped
      // and the count shown to the user reflects what actually succeeded.
      URL.revokeObjectURL(frame.previewUrl);
    }
  }

  onProgress({ stage: "analyzing", done: results.length, total: frames.length });

  if (results.length === 0) {
    throw new Error("no-frames-analyzed");
  }

  return summarise(results);
}
