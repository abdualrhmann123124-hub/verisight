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
import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DURATION, EASE_OUT_EXPO, SPRING_LAYOUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { MediaFactsPanel, MediaPreview } from "@/features/analyze/components/media-facts";
import { AssessmentReport } from "@/features/analyze/components/assessment-report";
import { StageProgress } from "@/features/analyze/components/stage-progress";
import { FILE_ACCEPT } from "@/features/analyze/lib/media-source";
import { takePendingFile } from "@/features/analyze/lib/pending-file";
import {
  EngineRejectedError,
  EngineUnavailableError,
  requestAnalysis,
  type AnalysisResponse,
} from "@/features/analyze/lib/engine";
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
 * Two stages, deliberately separated. Preflight runs in the browser and
 * establishes what the file *is* — hash, dimensions, embedded metadata — and
 * never leaves the device. The forensic analyzers then run in `api/`, which
 * needs the bytes.
 *
 * If the engine is unreachable the handoff stage resolves to `blocked` with
 * an actionable message and the preflight facts are still shown, because they
 * are real and independently useful. No score is displayed in that case: for
 * a product whose premise is not overstating what it knows, a placeholder
 * number would undermine everything else in the build.
 */
export function AnalyzeWorkspace() {
  const { t } = useLocale();
  const [phase, setPhase] = useState<Phase>("idle");
  const [stages, setStages] = useState<readonly Stage[]>(INITIAL_STAGES);
  const [facts, setFacts] = useState<MediaFacts | null>(null);
  const [assessment, setAssessment] = useState<AnalysisResponse | null>(null);
  const [engineNote, setEngineNote] = useState<string | null>(null);
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
    setAssessment(null);
    setEngineNote(null);
    setFailure(null);
  }, []);

  const analyze = useCallback(
    async (file: File) => {
      setPhase("running");
      setStages(INITIAL_STAGES);
      setFacts(null);
      setAssessment(null);
      setEngineNote(null);
      setFailure(null);
      setObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });

      try {
        const result = await runPreflight(
          file,
          {
            onStageChange: (id, status, durationMs) => patchStage(id, status, durationMs),
          },
          t.validation,
        );
        setFacts(result);

        // Hand off to the analysis engine. If it is not running, the stage
        // resolves to `blocked` with an actionable message rather than
        // failing the whole run — the preflight facts above are still valid
        // and worth showing.
        patchStage("handoff", "active");
        const startedAt = performance.now();
        try {
          const analysis = await requestAnalysis(file);
          setAssessment(analysis);
          patchStage(
            "handoff",
            "done",
            Math.round(performance.now() - startedAt),
            `${analysis.assessment.findings.length} analyzers reported`,
          );
        } catch (engineError) {
          const blockedNote =
            engineError instanceof EngineUnavailableError
              ? "Engine offline — run `npm run api` to enable full analysis."
              : engineError instanceof EngineRejectedError
                ? engineError.message
                : "The engine could not analyze this file.";
          patchStage("handoff", "blocked", undefined, blockedNote);
          setEngineNote(blockedNote);
        }
        setPhase("complete");
      } catch (error) {
        const failureInfo =
          error instanceof PreflightError
            ? { message: error.message, recovery: error.recovery }
            : {
                message: t.validation.generic,
                recovery: t.validation.genericRecovery,
              };
        setFailure(failureInfo);
        if (error instanceof PreflightError) {
          patchStage(error.stage, "failed", undefined, error.message);
        }
        setPhase("error");
      }
    },
    [patchStage, t],
  );

  // Pick up a file chosen on the landing page and start immediately, so the
  // user is not asked to select the same file twice after navigating here.
  //
  // The analysis is scheduled rather than called inline: starting it in the
  // effect body would set state synchronously during commit and cascade a
  // second render before the first has painted, so the workspace would appear
  // already mid-run instead of visibly starting. A microtask lets the idle
  // layout paint first, then the pipeline takes over.
  //
  // `takePendingFile` clears as it reads, so this cannot re-run an analysis
  // nobody asked for if the user navigates back here later.
  useEffect(() => {
    const handedOver = takePendingFile();
    if (!handedOver) return;
    queueMicrotask(() => void analyze(handedOver));
  }, [analyze]);

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
            {t.workspace.backHome}
          </Link>
          <h1 className="font-display text-h1 text-ink">{t.workspace.title}</h1>
        </div>
        {showWorkspace && (
          <Button variant="secondary" leadingIcon={<RotateCcw />} onClick={reset}>
            {t.workspace.startOver}
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
                {dragging ? t.workspace.dropTitleActive : t.workspace.dropTitle}
              </h2>
              <p className="mt-2 max-w-md text-body-sm text-ink-muted">
                {t.workspace.dropSubtitle}
              </p>

              <Button
                size="lg"
                className="mt-8"
                leadingIcon={<Sparkles />}
                onClick={() => fileInputRef.current?.click()}
              >
                {t.workspace.chooseFile}
              </Button>
              <p className="mt-4 text-caption text-ink-faint">{t.workspace.limits}</p>
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
                      {t.workspace.analysisStopped}
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
                        {t.workspace.chooseAnother}
                      </Button>
                      <Button variant="ghost" onClick={reset}>
                        {t.workspace.startOver}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {phase === "complete" && assessment && (
                <AssessmentReport result={assessment} />
              )}

              {phase === "complete" && !assessment && (
                <Reveal>
                  <Card variant="surface" padding="lg" className="edge-highlight">
                    <div className="flex flex-col gap-4">
                      <Badge variant="warning" size="lg" icon={<FlaskConical />}>
                        {t.workspace.assessmentUnavailable}
                      </Badge>
                      <h2 className="font-display text-h3 text-ink">
                        {t.workspace.engineUnavailableTitle}
                      </h2>
                      <p className="max-w-prose text-body text-ink-muted">
                        {t.workspace.engineUnavailableBody}
                      </p>
                      {engineNote && (
                        <div className="flex gap-3 rounded-xl bg-surface-inset p-4">
                          <ShieldQuestion
                            className="mt-0.5 size-4 shrink-0 text-warning"
                            aria-hidden="true"
                          />
                          <p className="text-body-sm text-ink-muted">{engineNote}</p>
                        </div>
                      )}
                      <p className="text-caption text-ink-faint">
                        {t.workspace.engineUnavailableNote}
                      </p>
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
