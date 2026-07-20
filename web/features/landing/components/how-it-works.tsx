"use client";

import { FileSearch, Layers, Upload } from "lucide-react";

import { Container, Section } from "@/components/layout/container";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { useLocale } from "@/components/providers/locale-provider";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/features/landing/components/section-heading";

// Icons and step numbers are presentation; the copy is the dictionary's.
const STEP_ICONS = [Upload, Layers, FileSearch] as const;

export function HowItWorks() {
  const { t } = useLocale();

  const steps = [
    {
      icon: STEP_ICONS[0],
      step: "01",
      title: t.howItWorks.step1Title,
      body: t.howItWorks.step1Body,
    },
    {
      icon: STEP_ICONS[1],
      step: "02",
      title: t.howItWorks.step2Title,
      body: t.howItWorks.step2Body,
    },
    {
      icon: STEP_ICONS[2],
      step: "03",
      title: t.howItWorks.step3Title,
      body: t.howItWorks.step3Body,
    },
  ];

  return (
    <Section id="how-it-works" spacing="lg">
      <Container>
        <SectionHeading
          eyebrow={t.howItWorks.eyebrow}
          title={t.howItWorks.title}
          description={t.howItWorks.description}
        />

        <Stagger className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, step, title, body }) => (
            <StaggerItem key={step}>
              <Card variant="surface" padding="lg" className="h-full">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-accent-subtle text-accent">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span
                    className="font-mono text-caption text-ink-faint"
                    aria-hidden="true"
                  >
                    {step}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-h4 text-ink">{title}</h3>
                <p className="mt-2 text-body-sm text-ink-muted">{body}</p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.1}>
          <p className="mt-10 text-center text-caption text-ink-faint">
            {t.howItWorks.footnote}
          </p>
        </Reveal>
      </Container>
    </Section>
  );
}
