"use client";

import {
  CircleDashed,
  FlaskConical,
  Info,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  ShieldX,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";

import { AnimatedNumber } from "@/components/motion/animated-number";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { fill, useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CircularProgress, Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  DIRECTION_PRESENTATION,
  VERDICT_PRESENTATION,
  type AnalysisResponse,
  type Finding,
} from "@/features/analyze/lib/engine";

const ICONS = {
  ShieldCheck,
  ShieldQuestion,
  CircleDashed,
  ShieldAlert,
  ShieldX,
} as const;

/**
 * Engine prose, in the reader's language.
 *
 * The engine sends both a stable `code` and an English sentence. We render the
 * dictionary entry for the code and fall back to the engine's English only
 * when the code is unknown — so adding an analyzer outcome degrades to English
 * rather than to a blank space, and a translated build never mixes languages
 * for outcomes it does know.
 */
type Localised = { summary: string; caveat: string };

function useEngineCopy() {
  const { t } = useLocale();

  const outcome = (code: string | null, fallback: Localised): Localised => {
    const entry = code
      ? (t.outcomes as Record<string, Localised | undefined>)[code]
      : undefined;
    return entry ?? fallback;
  };

  const analyzerLabel = (id: string, fallback: string): string =>
    (t.analyzers as Record<string, string | undefined>)[id] ?? fallback;

  const limitation = (code: string | undefined, fallback: string): string =>
    (code ? (t.limits as Record<string, string | undefined>)[code] : undefined) ??
    fallback;

  return { outcome, analyzerLabel, limitation };
}

/**
 * The assessment report.
 *
 * Two presentation rules exist to keep this honest:
 *
 * 1. While `calibrated` is false the headline number is labelled an
 *    "indicative score", never a probability, and the uncalibrated notice is
 *    not dismissible. The engine's weighting is documented heuristics; the
 *    UI must not launder that into something it isn't.
 *
 * 2. Every finding shows its direction as colour + icon + words together, and
 *    its caveat is displayed rather than tucked behind a tooltip. The caveats
 *    are where a user learns that missing metadata means very little.
 */
export function AssessmentReport({ result }: { result: AnalysisResponse }) {
  const { t } = useLocale();
  const { analyzerLabel, limitation } = useEngineCopy();
  const { assessment } = result;
  const presentation = VERDICT_PRESENTATION[assessment.verdict];

  // The overall summary is assembled here rather than taken from the engine so
  // it reads in one language: the shape comes from `summary_code`, the driving
  // analyzer names from the dictionary, and the conflict note is appended the
  // same way the engine appends it.
  const summaryText = (() => {
    const code = assessment.summary_code;
    const table = t.summaries as Record<string, string | undefined>;
    const template = code ? table[code] : undefined;
    if (!template) return assessment.summary;

    let text = template;
    if (code === "leaning-synthetic" || code === "leaning-authentic") {
      const names = assessment.summary_driver_ids.map((id) =>
        analyzerLabel(id, id).toLocaleLowerCase(),
      );
      text = fill(template, {
        drivers: names.length ? names.join("، ") : t.summaries.fallbackDrivers,
      });
    }
    return assessment.conflicted ? text + t.summaries.conflictNote : text;
  })();
  const VerdictIcon = ICONS[presentation.icon as keyof typeof ICONS];

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <Card variant="raised" padding="none" className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
            <div className="flex items-center gap-3">
              <Badge variant="neutral" size="sm">
                {fill(t.report.engineVersion, { version: result.engine_version })}
              </Badge>
              <span className="font-mono text-caption text-ink-faint">
                {result.processing_ms}ms ·{" "}
                {fill(t.report.analyzers, { count: assessment.findings.length })}
              </span>
            </div>
            <span className="text-caption text-ink-faint">
              {result.width} × {result.height}
            </span>
          </div>

          <div className="grid gap-10 p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:gap-12">
            <div className="flex flex-col items-center gap-5">
              <CircularProgress
                value={assessment.synthetic_likelihood}
                size={188}
                label={t.report.indicativeScore}
                color={`var(${presentation.token})`}
              >
                <div className="flex flex-col items-center">
                  <AnimatedNumber
                    value={assessment.synthetic_likelihood}
                    decimals={0}
                    suffix="%"
                    className="font-display text-display-lg text-ink"
                  />
                  <span className="mt-1 max-w-28 text-center text-caption text-ink-muted">
                    {t.report.indicativeScore}
                  </span>
                </div>
              </CircularProgress>

              <div
                className="flex items-center gap-2"
                style={{ color: `var(${presentation.token})` }}
              >
                <VerdictIcon className="size-5 shrink-0" aria-hidden="true" />
                <span className="text-body font-medium">
                  {t.verdict[assessment.verdict]}
                </span>
              </div>

              <div className="w-full max-w-56">
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="text-caption text-ink-faint">{t.report.evidence}</span>
                  <span className="tabular text-caption text-ink-muted">
                    {Math.round(assessment.evidence_strength)}%
                  </span>
                </div>
                <Progress
                  value={assessment.evidence_strength}
                  size="sm"
                  tone={assessment.evidence_strength < 40 ? "warning" : "accent"}
                  aria-label={t.report.evidence}
                />
                <p className="mt-2 text-caption text-ink-faint">
                  {assessment.evidence_strength < 40
                    ? t.report.evidenceLow
                    : t.report.evidenceOk}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {!assessment.calibrated && <UncalibratedNotice />}

              <div className="flex gap-3 rounded-xl bg-surface-inset p-4">
                <Info
                  className="mt-0.5 size-4 shrink-0 text-ink-faint"
                  aria-hidden="true"
                />
                <p className="text-body-sm text-ink-muted">{summaryText}</p>
              </div>
            </div>
          </div>
        </Card>
      </Reveal>

      <Stagger className="grid gap-4 sm:grid-cols-2">
        {assessment.findings.map((finding) => (
          <StaggerItem key={finding.id}>
            <FindingCard finding={finding} />
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal>
        <Card variant="outline" padding="lg">
          <h3 className="flex items-center gap-2 font-display text-h4 text-ink">
            <TriangleAlert className="size-4.5 text-warning" aria-hidden="true" />
            {t.report.limitationsTitle}
          </h3>
          <ul className="mt-4 flex flex-col gap-2.5">
            {assessment.limitations.map((text, index) => (
              <li key={index} className="flex gap-2.5 text-body-sm text-ink-muted">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1 shrink-0 rounded-full bg-ink-faint"
                />
                {limitation(assessment.limitation_codes[index], text)}
              </li>
            ))}
          </ul>
        </Card>
      </Reveal>
    </div>
  );
}

function UncalibratedNotice() {
  const { t } = useLocale();

  return (
    <div className="flex gap-3 rounded-xl border border-warning/30 bg-warning-subtle p-4">
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <p className="text-body-sm font-medium text-ink">{t.report.notCalibratedTitle}</p>
        <p className="text-caption text-ink-muted">{t.report.notCalibratedBody}</p>
      </div>
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const { t } = useLocale();
  const { outcome, analyzerLabel } = useEngineCopy();
  const [showDetail, setShowDetail] = useState(false);
  const direction = DIRECTION_PRESENTATION[finding.direction];

  const label = analyzerLabel(finding.id, finding.label);
  const copy = outcome(finding.code, {
    summary: finding.summary,
    caveat: finding.caveat ?? "",
  });
  const measurements = Object.entries(finding.measurements).filter(
    ([, value]) => value !== null && value !== undefined,
  );

  return (
    <Card variant="surface" padding="lg" className="lift flex h-full flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-h4 text-ink">{label}</h3>
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-2.5 py-1"
          style={{ color: `var(${direction.token})` }}
        >
          <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
          <span className="text-micro font-medium">{t.direction[finding.direction]}</span>
        </span>
      </div>

      <p className="text-body-sm text-ink-muted">{copy.summary}</p>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-caption text-ink-faint">{t.report.signalStrength}</span>
          <span className="tabular text-caption text-ink-muted">
            {Math.round(finding.strength * 100)}%
          </span>
        </div>
        <Progress
          value={finding.strength * 100}
          size="sm"
          tone={
            finding.direction === "synthetic"
              ? "danger"
              : finding.direction === "authentic"
                ? "success"
                : "neutral"
          }
          aria-label={`${label} — ${t.report.signalStrength}`}
        />
      </div>

      {copy.caveat && (
        <p className="rounded-lg bg-surface-inset p-3 text-caption text-ink-faint">
          {copy.caveat}
        </p>
      )}

      {measurements.length > 0 && (
        <>
          <Separator />
          <button
            type="button"
            onClick={() => setShowDetail((v) => !v)}
            aria-expanded={showDetail}
            className={cn(
              "cursor-pointer self-start rounded-sm text-caption text-accent",
              "underline-offset-4 transition-colors hover:underline",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
            )}
          >
            {showDetail ? t.report.hideMeasurements : t.report.showMeasurements}
          </button>
          {showDetail && (
            <dl className="flex flex-col gap-1.5">
              {measurements.map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4">
                  <dt className="font-mono text-micro text-ink-faint">{key}</dt>
                  <dd className="font-mono text-micro break-all text-ink-muted">
                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </>
      )}
    </Card>
  );
}
