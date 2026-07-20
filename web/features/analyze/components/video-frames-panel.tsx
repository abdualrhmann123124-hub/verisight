"use client";

import { Film, Info } from "lucide-react";

import { fill, useLocale } from "@/components/providers/locale-provider";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { VERDICT_PRESENTATION } from "@/features/analyze/lib/engine";
import type { FrameResult, VideoAssessment } from "@/features/analyze/lib/video-analysis";

/** mm:ss for a position inside the clip. */
function stamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * The frame strip for a video analysis.
 *
 * Each thumbnail is a frame the engine actually scored, tinted by its own
 * verdict, and selecting one swaps the detailed report below to that frame's
 * assessment. That is the honest shape for this: there is no video-level
 * verdict to show, because the engine never saw a video — it saw nine stills.
 *
 * The compression note is not dismissible and sits directly under the
 * numbers, because it is the difference between reading "23%" as "this clip is
 * probably real" and reading it as "most of the evidence was destroyed before
 * we got here".
 */
export function VideoFramesPanel({
  assessment,
  selected,
  onSelect,
}: {
  assessment: VideoAssessment;
  selected: FrameResult;
  onSelect: (frame: FrameResult) => void;
}) {
  const { t } = useLocale();

  return (
    <Card variant="surface" padding="lg" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-h4 text-ink">
          <Film className="size-4.5 text-accent" aria-hidden="true" />
          {t.video.title}
        </h2>
        <span className="text-caption text-ink-faint">
          {fill(t.video.framesAnalyzed, { count: assessment.frames.length })}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat
          label={t.video.meanScore}
          value={`${Math.round(assessment.meanLikelihood)}%`}
        />
        <Stat
          label={t.video.peakScore}
          value={`${Math.round(assessment.peak.result.assessment.synthetic_likelihood)}%`}
          note={fill(t.video.atTime, { time: stamp(assessment.peak.time) })}
        />
        <Stat
          label={t.report.evidence}
          value={`${Math.round(assessment.meanEvidence)}%`}
        />
      </div>

      <p className="text-caption text-ink-muted">
        {fill(t.video.leaningCount, {
          count: assessment.syntheticLeaning,
          total: assessment.frames.length,
        })}
      </p>

      {/* Horizontal scroll rather than wrapping: the strip reads as a
          timeline, and rewrapping it into rows destroys that. */}
      <ul className="flex gap-3 overflow-x-auto pb-2">
        {assessment.frames.map((frame, index) => {
          const presentation = VERDICT_PRESENTATION[frame.result.assessment.verdict];
          const isSelected = frame === selected;
          return (
            <li key={frame.previewUrl} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(frame)}
                aria-pressed={isSelected}
                aria-label={fill(t.video.selectFrame, { time: stamp(frame.time) })}
                className={cn(
                  "group flex w-28 cursor-pointer flex-col gap-1.5 rounded-lg p-1.5",
                  "transition-colors duration-200",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                  isSelected ? "bg-surface-overlay" : "hover:bg-surface-inset",
                )}
              >
                <span
                  className={cn(
                    "relative block overflow-hidden rounded-md border-2",
                    isSelected ? "border-accent" : "border-transparent",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={frame.previewUrl}
                    alt={fill(t.video.frameLabel, { index: index + 1 })}
                    className="aspect-video w-full object-cover"
                  />
                </span>
                <span className="flex items-baseline justify-between gap-1">
                  <span className="tabular font-mono text-micro text-ink-faint">
                    {stamp(frame.time)}
                  </span>
                  <span
                    className="tabular text-micro font-medium"
                    style={{ color: `var(${presentation.token})` }}
                  >
                    {Math.round(frame.result.assessment.synthetic_likelihood)}%
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex gap-3 rounded-xl bg-surface-inset p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-ink-faint" aria-hidden="true" />
        <p className="text-caption text-ink-muted">{t.video.compressionNote}</p>
      </div>

      <p className="text-caption text-ink-faint">{t.video.showingFrame}</p>
    </Card>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-ink-faint">{label}</span>
      <span className="tabular font-display text-h4 text-ink">{value}</span>
      {note && <span className="text-micro text-ink-faint">{note}</span>}
    </div>
  );
}
