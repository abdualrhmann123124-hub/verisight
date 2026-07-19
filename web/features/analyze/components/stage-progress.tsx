"use client";

import { AlertCircle, Check, CircleDashed, Loader2, MinusCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Progress } from "@/components/ui/progress";
import { DURATION, EASE_OUT_EXPO, SPRING_UI } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Stage, StageStatus } from "@/features/analyze/lib/preflight";

const STATUS_ICON: Record<StageStatus, typeof Check> = {
  pending: CircleDashed,
  active: Loader2,
  done: Check,
  failed: AlertCircle,
  blocked: MinusCircle,
};

const STATUS_COLOR: Record<StageStatus, string> = {
  pending: "text-ink-faint",
  active: "text-accent",
  done: "text-success",
  failed: "text-danger",
  blocked: "text-warning",
};

/**
 * Staged progress readout.
 *
 * Each row reflects a real operation in the preflight pipeline: the stage
 * turns active when that work actually starts and completes when it actually
 * returns, and the elapsed time shown is measured, not scripted. Most stages
 * finish in single-digit milliseconds, which is worth showing honestly — a
 * progress display padded with artificial delay to look substantial is a lie
 * about how long the work took.
 *
 * `blocked` exists for the handoff stage: the analysis engine is not built
 * yet, and a greyed-out row saying so is more honest than a spinner that
 * never resolves or a green tick for work that never ran.
 */
export function StageProgress({
  stages,
  className,
}: {
  stages: readonly Stage[];
  className?: string;
}) {
  const settled = stages.filter(
    (s) => s.status === "done" || s.status === "failed" || s.status === "blocked",
  ).length;
  const percent = Math.round((settled / stages.length) * 100);
  const active = stages.find((s) => s.status === "active");
  const failed = stages.some((s) => s.status === "failed");

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <p
            className="text-body-sm font-medium text-ink"
            // Announces the current stage without interrupting; the list
            // below is decorative repetition for screen readers.
            aria-live="polite"
          >
            {failed
              ? "Analysis stopped"
              : (active?.label ?? (percent === 100 ? "Preflight complete" : "Ready"))}
          </p>
          <span className="tabular text-caption text-ink-faint">{percent}%</span>
        </div>
        <Progress
          value={percent}
          tone={failed ? "danger" : percent === 100 ? "success" : "accent"}
          aria-label="Preflight progress"
        />
      </div>

      <ol className="flex flex-col gap-1">
        {stages.map((stage) => {
          const Icon = STATUS_ICON[stage.status];
          const isIdle = stage.status === "pending";
          return (
            <motion.li
              key={stage.id}
              layout
              transition={SPRING_UI}
              className={cn(
                "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors duration-300",
                stage.status === "active" && "bg-accent-subtle",
                stage.status === "failed" && "bg-danger-subtle",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-4 shrink-0 place-items-center",
                  STATUS_COLOR[stage.status],
                )}
                aria-hidden="true"
              >
                <Icon
                  className={cn("size-4", stage.status === "active" && "animate-spin")}
                />
              </span>

              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span
                  className={cn(
                    "text-body-sm transition-colors duration-300",
                    isIdle ? "text-ink-faint" : "text-ink",
                  )}
                >
                  {stage.label}
                  <span className="sr-only"> — {stage.status}</span>
                </span>

                <AnimatePresence mode="wait" initial={false}>
                  {(stage.status === "active" || stage.note) && (
                    <motion.span
                      key={stage.note ?? stage.detail}
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: DURATION.fast } }}
                      transition={{ duration: DURATION.base, ease: EASE_OUT_EXPO }}
                      className={cn(
                        "text-caption",
                        stage.status === "failed" ? "text-danger" : "text-ink-faint",
                      )}
                    >
                      {stage.note ?? stage.detail}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>

              {stage.durationMs !== undefined && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="tabular mt-0.5 shrink-0 font-mono text-micro text-ink-faint"
                >
                  {stage.durationMs < 1 ? "<1" : stage.durationMs}ms
                </motion.span>
              )}
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
