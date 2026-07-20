"use client";

import { CircleDashed, Info, ShieldAlert, ShieldCheck } from "lucide-react";

import { Container, Section } from "@/components/layout/container";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { Reveal } from "@/components/motion/reveal";
import { useLocale } from "@/components/providers/locale-provider";
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
 * damaging possible shortcut. Numbers and tones are fixed here; every string
 * comes from the dictionary.
 */
const SAMPLE_FINDINGS = [
  { key: "metadata", tone: "warning", confidence: 72 },
  { key: "frequency", tone: "danger", confidence: 88 },
  { key: "noise", tone: "danger", confidence: 81 },
  { key: "lighting", tone: "success", confidence: 64 },
] as const;

const TONE_BAR = {
  success: "success",
  warning: "warning",
  danger: "danger",
} as const;

// The verdict spectrum, low-to-high synthetic likelihood. Labels are read from
// the shared verdict dictionary so they match the real report's wording.
const SPECTRUM = [
  { id: "authentic", Icon: ShieldCheck },
  { id: "leaning-authentic", Icon: ShieldCheck },
  { id: "inconclusive", Icon: CircleDashed },
  { id: "leaning-synthetic", Icon: ShieldAlert },
  { id: "synthetic", Icon: ShieldAlert },
] as const;

export function ExampleAnalysis() {
  const { t } = useLocale();

  const findingText: Record<
    (typeof SAMPLE_FINDINGS)[number]["key"],
    { label: string; note: string }
  > = {
    metadata: { label: t.example.labelMetadata, note: t.example.findingMetadata },
    frequency: { label: t.example.labelFrequency, note: t.example.findingFrequency },
    noise: { label: t.example.labelNoise, note: t.example.findingNoise },
    lighting: { label: t.example.labelLighting, note: t.example.findingLighting },
  };

  return (
    <Section id="example" spacing="lg">
      <Container>
        <SectionHeading
          eyebrow={t.example.eyebrow}
          title={t.example.title}
          description={t.example.description}
        />

        <Reveal delay={0.05} className="mt-14">
          <Card variant="raised" padding="none" className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
              <div className="flex items-center gap-3">
                <Badge variant="warning" dot>
                  {t.example.badge}
                </Badge>
                <span className="font-mono text-caption text-ink-faint">
                  press-photo-2024.jpg
                </span>
              </div>
              <span className="text-caption text-ink-faint">{t.example.processed}</span>
            </div>

            <div className="grid gap-10 p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:gap-14">
              <div className="flex flex-col items-center gap-5">
                <CircularProgress
                  value={78}
                  size={196}
                  label={t.example.likelihood}
                  color="var(--verdict-leaning-synthetic)"
                >
                  <div className="flex flex-col items-center">
                    <AnimatedNumber
                      value={78}
                      suffix="%"
                      className="font-display text-display-lg text-ink"
                    />
                    <span className="mt-1 text-caption text-ink-muted">
                      {t.example.likelihood}
                    </span>
                  </div>
                </CircularProgress>

                <div
                  className="flex items-center gap-2"
                  style={{ color: "var(--verdict-leaning-synthetic)" }}
                >
                  <ShieldAlert className="size-4.5" aria-hidden="true" />
                  <span className="text-body font-medium">
                    {t.verdict["leaning-synthetic"]}
                  </span>
                </div>

                <div className="flex gap-6 text-center">
                  <div className="flex flex-col">
                    <span className="text-caption text-ink-faint">
                      {t.example.confidence}
                    </span>
                    <span className="text-body-sm font-medium text-ink">
                      {t.example.moderate}
                    </span>
                  </div>
                  <Separator orientation="vertical" className="h-auto" />
                  <div className="flex flex-col">
                    <span className="text-caption text-ink-faint">
                      {t.example.reliability}
                    </span>
                    <span className="text-body-sm font-medium text-ink">
                      {t.example.good}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex gap-3 rounded-xl bg-surface-inset p-4">
                  <Info
                    className="mt-0.5 size-4 shrink-0 text-ink-faint"
                    aria-hidden="true"
                  />
                  <p className="text-body-sm text-ink-muted">{t.example.summary}</p>
                </div>

                <div className="flex flex-col gap-4">
                  {SAMPLE_FINDINGS.map((finding) => (
                    <div key={finding.key} className="flex flex-col gap-2">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-body-sm font-medium text-ink">
                          {findingText[finding.key].label}
                        </span>
                        <span className="tabular text-caption text-ink-faint">
                          {finding.confidence}%
                        </span>
                      </div>
                      <Progress
                        value={finding.confidence}
                        tone={TONE_BAR[finding.tone]}
                        size="sm"
                        aria-label={findingText[finding.key].label}
                      />
                      <p className="text-caption text-ink-faint">
                        {findingText[finding.key].note}
                      </p>
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
              <p className="text-caption text-ink-faint">{t.example.disclaimer}</p>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.1} className="mt-12">
          <div className="flex flex-col items-center gap-4">
            <p className="text-caption tracking-wide text-ink-faint uppercase">
              {t.example.spectrumLabel}
            </p>
            <ul className="flex flex-wrap items-center justify-center gap-2">
              {SPECTRUM.map(({ id, Icon }) => (
                <li
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5"
                  style={{ color: `var(--verdict-${id})` }}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  <span className="text-caption font-medium">{t.verdict[id]}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
