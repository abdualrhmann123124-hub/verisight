"use client";

import { Eye, GitCompareArrows, Lock, ScrollText } from "lucide-react";

import { Container, Section } from "@/components/layout/container";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { useLocale } from "@/components/providers/locale-provider";
import { SectionHeading } from "@/features/landing/components/section-heading";

/**
 * Positioning without marketing language.
 *
 * The brief is explicit: be honest, avoid buzzwords. So each point is a
 * concrete property of the system — including the one that admits the tool's
 * own limits, which is the most persuasive item on the list for the audience
 * that matters. Icons are fixed here; the copy is the dictionary's.
 */
const REASON_ICONS = [Eye, GitCompareArrows, ScrollText, Lock] as const;

export function WhyVeriSight() {
  const { t } = useLocale();

  const reasons = [
    { icon: REASON_ICONS[0], title: t.why.evidenceTitle, body: t.why.evidenceBody },
    {
      icon: REASON_ICONS[1],
      title: t.why.disagreementTitle,
      body: t.why.disagreementBody,
    },
    { icon: REASON_ICONS[2], title: t.why.calibratedTitle, body: t.why.calibratedBody },
    { icon: REASON_ICONS[3], title: t.why.privacyTitle, body: t.why.privacyBody },
  ];

  return (
    <Section spacing="lg" className="bg-surface/30">
      <Container>
        <SectionHeading
          eyebrow={t.why.eyebrow}
          title={t.why.title}
          description={t.why.description}
        />

        <Stagger className="mt-16 grid gap-x-12 gap-y-10 sm:grid-cols-2">
          {reasons.map(({ icon: Icon, title, body }) => (
            <StaggerItem key={title}>
              <div className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-surface text-accent">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="font-display text-h4 text-ink">{title}</h3>
                  <p className="text-body-sm text-ink-muted">{body}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </Section>
  );
}
