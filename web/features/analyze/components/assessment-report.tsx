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
  const { assessment } = result;
  const presentation = VERDICT_PRESENTATION[assessment.verdict];
  const VerdictIcon = ICONS[presentation.icon as keyof typeof ICONS];

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <Card variant="raised" padding="none" className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
            <div className="flex items-center gap-3">
              <Badge variant="neutral" size="sm">
                Engine v{result.engine_version}
              </Badge>
              <span className="font-mono text-caption text-ink-faint">
                {result.processing_ms}ms · {assessment.findings.length} analyzers
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
                label="Indicative synthetic score"
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
                    Indicative score
                  </span>
                </div>
              </CircularProgress>

              <div
                className="flex items-center gap-2"
                style={{ color: `var(${presentation.token})` }}
              >
                <VerdictIcon className="size-5 shrink-0" aria-hidden="true" />
                <span className="text-body font-medium">{presentation.label}</span>
              </div>

              <div className="w-full max-w-56">
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="text-caption text-ink-faint">Evidence</span>
                  <span className="tabular text-caption text-ink-muted">
                    {Math.round(assessment.evidence_strength)}%
                  </span>
                </div>
                <Progress
                  value={assessment.evidence_strength}
                  size="sm"
                  tone={assessment.evidence_strength < 40 ? "warning" : "accent"}
                  aria-label="How much usable evidence was available"
                />
                <p className="mt-2 text-caption text-ink-faint">
                  {assessment.evidence_strength < 40
                    ? "Most analyzers found little to work with."
                    : "Several analyzers contributed measurements."}
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
                <p className="text-body-sm text-ink-muted">{assessment.summary}</p>
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
            What this cannot tell you
          </h3>
          <ul className="mt-4 flex flex-col gap-2.5">
            {assessment.limitations.map((limitation) => (
              <li key={limitation} className="flex gap-2.5 text-body-sm text-ink-muted">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1 shrink-0 rounded-full bg-ink-faint"
                />
                {limitation}
              </li>
            ))}
          </ul>
        </Card>
      </Reveal>
    </div>
  );
}

function UncalibratedNotice() {
  return (
    <div className="flex gap-3 rounded-xl border border-warning/30 bg-warning-subtle p-4">
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <p className="text-body-sm font-medium text-ink">This score is not calibrated</p>
        <p className="text-caption text-ink-muted">
          It is a weighted combination of forensic heuristics, not a probability. The
          weights have not yet been validated against a labelled dataset, so treat the
          score as a pointer toward the evidence below rather than as a measurement in its
          own right.
        </p>
      </div>
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const [showDetail, setShowDetail] = useState(false);
  const direction = DIRECTION_PRESENTATION[finding.direction];
  const measurements = Object.entries(finding.measurements).filter(
    ([, value]) => value !== null && value !== undefined,
  );

  return (
    <Card variant="surface" padding="lg" className="flex h-full flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-h4 text-ink">{finding.label}</h3>
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-2.5 py-1"
          style={{ color: `var(${direction.token})` }}
        >
          <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
          <span className="text-micro font-medium">{direction.label}</span>
        </span>
      </div>

      <p className="text-body-sm text-ink-muted">{finding.summary}</p>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-caption text-ink-faint">Signal strength</span>
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
          aria-label={`${finding.label} signal strength`}
        />
      </div>

      {finding.caveat && (
        <p className="rounded-lg bg-surface-inset p-3 text-caption text-ink-faint">
          {finding.caveat}
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
            {showDetail ? "Hide" : "Show"} raw measurements
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
