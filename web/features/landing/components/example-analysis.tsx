"use client";

import { CircleDashed, Info, ShieldAlert, ShieldCheck } from "lucide-react";

import { Container, Section } from "@/components/layout/container";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CircularProgress, Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { SectionHeading } from "@/features/landing/components/section-heading";

/**
 * Illustrative report preview.
 *
 * Every number here is invented, and the section says so in three places: a
 * badge, a sentence in the description, and a note beneath the card. The brief
 * allows sample data only when clearly labelled, and for a product whose whole
 * value is not overstating confidence, an unlabelled mock-up would be the most
 * damaging possible shortcut.
 */
const SAMPLE_FINDINGS = [
  {
    label: "Metadata",
    tone: "warning" as const,
    confidence: 72,
    note: "No camera signature; software tag indicates re-export.",
  },
  {
    label: "Frequency",
    tone: "danger" as const,
    confidence: 88,
    note: "Periodic artefacts consistent with generative upsampling.",
  },
  {
    label: "Sensor noise",
    tone: "danger" as const,
    confidence: 81,
    note: "Noise pattern is uniform where it should vary.",
  },
  {
    label: "Lighting",
    tone: "success" as const,
    confidence: 64,
    note: "Light direction is physically consistent across subjects.",
  },
];

const TONE_BAR = {
  success: "success",
  warning: "warning",
  danger: "danger",
} as const;

export function ExampleAnalysis() {
  return (
    <Section id="example" spacing="lg">
      <Container>
        <SectionHeading
          eyebrow="Example"
          title="What a report looks like"
          description="A worked illustration of the report format. The figures below are sample values chosen to demonstrate the layout — they are not the result of a real analysis."
        />

        <Reveal delay={0.05} className="mt-14">
          <Card variant="raised" padding="none" className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
              <div className="flex items-center gap-3">
                <Badge variant="warning" dot>
                  Illustrative sample
                </Badge>
                <span className="font-mono text-caption text-ink-faint">
                  press-photo-2024.jpg
                </span>
              </div>
              <span className="text-caption text-ink-faint">
                Processed in 4.2s · 9 analyzers
              </span>
            </div>

            <div className="grid gap-10 p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:gap-14">
              <div className="flex flex-col items-center gap-5">
                <CircularProgress
                  value={78}
                  size={196}
                  label="Example AI generation likelihood"
                  color="var(--verdict-leaning-synthetic)"
                >
                  <div className="flex flex-col items-center">
                    <AnimatedNumber
                      value={78}
                      suffix="%"
                      className="font-display text-display-lg text-ink"
                    />
                    <span className="mt-1 text-caption text-ink-muted">
                      AI likelihood
                    </span>
                  </div>
                </CircularProgress>

                <div
                  className="flex items-center gap-2"
                  style={{ color: "var(--verdict-leaning-synthetic)" }}
                >
                  <ShieldAlert className="size-4.5" aria-hidden="true" />
                  <span className="text-body font-medium">Leaning Synthetic</span>
                </div>

                <div className="flex gap-6 text-center">
                  <div className="flex flex-col">
                    <span className="text-caption text-ink-faint">Confidence</span>
                    <span className="text-body-sm font-medium text-ink">Moderate</span>
                  </div>
                  <Separator orientation="vertical" className="h-auto" />
                  <div className="flex flex-col">
                    <span className="text-caption text-ink-faint">Reliability</span>
                    <span className="text-body-sm font-medium text-ink">Good</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex gap-3 rounded-xl bg-surface-inset p-4">
                  <Info
                    className="mt-0.5 size-4 shrink-0 text-ink-faint"
                    aria-hidden="true"
                  />
                  <p className="text-body-sm text-ink-muted">
                    Several indicators associated with generated media are present, most
                    notably in the frequency and sensor-noise analyses. Lighting remains
                    physically consistent, which argues against generation. This is a
                    confidence estimate, not proof.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  {SAMPLE_FINDINGS.map((finding) => (
                    <div key={finding.label} className="flex flex-col gap-2">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-body-sm font-medium text-ink">
                          {finding.label}
                        </span>
                        <span className="tabular text-caption text-ink-faint">
                          {finding.confidence}%
                        </span>
                      </div>
                      <Progress
                        value={finding.confidence}
                        tone={TONE_BAR[finding.tone]}
                        size="sm"
                        aria-label={`${finding.label} — example confidence`}
                      />
                      <p className="text-caption text-ink-faint">{finding.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 border-t border-line bg-surface-inset px-6 py-4">
              <CircleDashed
                className="mt-0.5 size-3.5 shrink-0 text-ink-faint"
                aria-hidden="true"
              />
              <p className="text-caption text-ink-faint">
                Sample data for layout demonstration only. No media was analyzed to
                produce these figures.
              </p>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.1} className="mt-12">
          <div className="flex flex-col items-center gap-4">
            <p className="text-caption tracking-wide text-ink-faint uppercase">
              Results are reported on a spectrum
            </p>
            <ul className="flex flex-wrap items-center justify-center gap-2">
              {[
                { id: "authentic", label: "Likely Authentic", Icon: ShieldCheck },
                {
                  id: "leaning-authentic",
                  label: "Leaning Authentic",
                  Icon: ShieldCheck,
                },
                { id: "inconclusive", label: "Inconclusive", Icon: CircleDashed },
                {
                  id: "leaning-synthetic",
                  label: "Leaning Synthetic",
                  Icon: ShieldAlert,
                },
                { id: "synthetic", label: "Likely Synthetic", Icon: ShieldAlert },
              ].map(({ id, label, Icon }) => (
                <li
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5"
                  style={{ color: `var(--verdict-${id})` }}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  <span className="text-caption font-medium">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
