"use client";

import {
  ArrowLeft,
  FlaskConical,
  RotateCcw,
  ShieldQuestion,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DURATION, EASE_OUT_EXPO, SPRING_LAYOUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { MediaFactsPanel, MediaPreview } from "@/features/analyze/components/media-facts";
import { StageProgress } from "@/features/analyze/components/stage-progress";
import { FILE_ACCEPT } from "@/features/analyze/lib/media-source";
import {
  INITIAL_STAGES,
  PreflightError,
  runPreflight,
  type MediaFacts,
  type Stage,
  type StageId,
  type StageStatus,
} from "@/features/analyze/lib/preflight";

type Phase = "idle" | "running" | "complete" | "error";

interface Failure {
  message: string;
  recovery: string;
}

/**
 * The analysis workspace.
 *
 * Preflight runs entirely in the browser and does real work — hashing,
 * decoding, metadata parsing. What it deliberately does *not* do is produce a
 * verdict: that requires the forensic and model analyses in `api/`, which do
 * not exist yet.
 *
 * So the final stage resolves to `blocked` with a plain explanation rather
 * than a spinner that never finishes or, worse, a fabricated confidence
 * score. For a product whose entire premise is not overstating what it knows,
 * a convincing fake here would undermine everything else in the build.
 */
export function AnalyzeWorkspace() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [stages, setStages] = useState<readonly Stage[]>(INITIAL_STAGES);
  const [facts, setFacts] = useState<MediaFacts | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  // Blob URLs stay alive for the document's lifetime unless revoked.
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const patchStage = useCallback(
    (id: StageId, status: StageStatus, durationMs?: number, note?: string) => {
      setStages((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status,
                ...(durationMs !== undefined && { durationMs }),
                ...(note !== undefined && { note }),
              }
            : s,
        ),
      );
    },
    [],
  );

  const reset = useCallback(() => {
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPhase("idle");
    setStages(INITIAL_STAGES);
    setFacts(null);
    setFailure(null);
  }, []);

  const analyze = useCallback(
    async (file: File) => {
      setPhase("running");
      setStages(INITIAL_STAGES);
      setFacts(null);
      setFailure(null);
      setObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });

      try {
        const result = await runPreflight(file, {
          onStageChange: (id, status, durationMs) => patchStage(id, status, durationMs),
        });
        setFacts(result);

        // Honest terminal state: the engine that would produce a verdict is
        // not built yet, and the UI says exactly that.
        patchStage(
          "handoff",
          "blocked",
          undefined,
          "Engine not yet available — no assessment produced.",
        );
        setPhase("complete");
      } catch (error) {
        const failureInfo =
          error instanceof PreflightError
            ? { message: error.message, recovery: error.recovery }
            : {
                message: "Something went wrong while reading this file.",
                recovery: "Try again, or use a different file.",
              };
        setFailure(failureInfo);
        if (error instanceof PreflightError) {
          patchStage(error.stage, "failed", undefined, error.message);
        }
        setPhase("error");
      }
    },
    [patchStage],
  );

  const handlePick = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const picked = event.target.files?.[0];
      if (picked) void analyze(picked);
      event.target.value = "";
    },
    [analyze],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      const dropped = event.dataTransfer.files[0];
      if (dropped) void analyze(dropped);
    },
    [analyze],
  );

  const showWorkspace = phase !== "idle";

  return (
    <Container className="py-12">
      {/* One picker for the whole workspace. Rendering an input per branch
          would share a single ref across conditionally-mounted elements —
          it happens to work while the branches are mutually exclusive, and
          breaks silently the moment they are not. */}
      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_ACCEPT}
        onChange={handlePick}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-1.5 rounded-sm text-caption text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back to home
          </Link>
          <h1 className="font-display text-h1 text-ink">Analyze media</h1>
        </div>
        {showWorkspace && (
          <Button variant="secondary" leadingIcon={<RotateCcw />} onClick={reset}>
            Start over
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!showWorkspace ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: DURATION.fast } }}
            transition={{ duration: DURATION.slow, ease: EASE_OUT_EXPO }}
          >
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                dragDepth.current += 1;
                setDragging(true);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => {
                e.preventDefault();
                dragDepth.current -= 1;
                if (dragDepth.current <= 0) setDragging(false);
              }}
              onDrop={handleDrop}
              className={cn(
                "grid place-items-center rounded-2xl border-2 border-dashed p-16 text-center",
                "transition-all duration-300 ease-[var(--ease-out-expo)]",
                dragging
                  ? "border-accent bg-accent-subtle"
                  : "border-line bg-surface/40 hover:border-line-strong",
              )}
            >
              <motion.div
                animate={dragging ? { y: -6, scale: 1.04 } : { y: 0, scale: 1 }}
                transition={SPRING_LAYOUT}
                className={cn(
                  "grid size-16 place-items-center rounded-2xl",
                  dragging
                    ? "bg-accent text-on-accent"
                    : "bg-surface-raised text-ink-faint",
                )}
              >
                <Upload className="size-7" aria-hidden="true" />
              </motion.div>

              <h2 className="mt-6 font-display text-h3 text-ink">
                {dragging ? "Drop to begin" : "Drop a file to analyze"}
              </h2>
              <p className="mt-2 max-w-md text-body-sm text-ink-muted">
                Everything runs in your browser. The file is never uploaded, and nothing
                leaves this device.
              </p>

              <Button
                size="lg"
                className="mt-8"
                leadingIcon={<Sparkles />}
                onClick={() => fileInputRef.current?.click()}
              >
                Choose a file
              </Button>
              <p className="mt-4 text-caption text-ink-faint">
                PNG, JPG, WEBP up to 25 MB · MP4, MOV, WEBM up to 200 MB
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="workspace"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.slow, ease: EASE_OUT_EXPO }}
            className="grid gap-6 lg:grid-cols-[1fr_400px]"
          >
            <div className="flex flex-col gap-6">
              {objectUrl && facts && <MediaPreview facts={facts} objectUrl={objectUrl} />}

              {phase === "error" && failure && (
                <Card
                  variant="surface"
                  padding="lg"
                  className="border-danger/40 bg-danger-subtle"
                >
                  <div className="flex flex-col gap-3">
                    <Badge variant="danger" size="lg" dot>
                      Analysis stopped
                    </Badge>
                    <h2 className="font-display text-h3 text-ink">{failure.message}</h2>
                    <p className="max-w-prose text-body-sm text-ink-muted">
                      {failure.recovery}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3">
                      <Button
                        variant="secondary"
                        leadingIcon={<Upload />}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Choose another file
                      </Button>
                      <Button variant="ghost" onClick={reset}>
                        Start over
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {phase === "complete" && (
                <Reveal>
                  <Card variant="surface" padding="lg" className="edge-highlight">
                    <div className="flex flex-col gap-4">
                      <Badge variant="warning" size="lg" icon={<FlaskConical />}>
                        Assessment unavailable
                      </Badge>
                      <h2 className="font-display text-h3 text-ink">
                        Preflight complete — no verdict yet
                      </h2>
                      <p className="max-w-prose text-body text-ink-muted">
                        Your file was read, fingerprinted, decoded, and its metadata
                        parsed — all locally. Producing an authenticity estimate needs the
                        forensic and model analyses, which are still being built.
                      </p>
                      <div className="flex gap-3 rounded-xl bg-surface-inset p-4">
                        <ShieldQuestion
                          className="mt-0.5 size-4 shrink-0 text-warning"
                          aria-hidden="true"
                        />
                        <p className="text-body-sm text-ink-muted">
                          VeriSight will not show a confidence score until there is a real
                          measurement behind it. A number invented to fill this space
                          would be worse than no number at all.
                        </p>
                      </div>
                    </div>
                  </Card>
                </Reveal>
              )}
            </div>

            <div className="flex flex-col gap-6">
              <Card variant="surface" padding="lg">
                <StageProgress stages={stages} />
              </Card>
              {facts && <MediaFactsPanel facts={facts} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
}
