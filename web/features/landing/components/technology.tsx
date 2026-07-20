"use client";

import { Aperture, Fingerprint, Grid2x2, Layers3, Scale, Waves } from "lucide-react";

import { Container, Section } from "@/components/layout/container";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { useLocale } from "@/components/providers/locale-provider";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/features/landing/components/section-heading";

/**
 * The techniques are described in plain language and without overclaiming.
 * Each entry names what is actually measured — these map one-to-one onto
 * analyzer modules in the engine, so nothing here promises a capability it
 * does not have. Titles and bodies come from the dictionary; only the icons
 * are fixed here.
 */
const TECHNIQUE_ICONS = [Fingerprint, Grid2x2, Waves, Aperture, Layers3, Scale] as const;

export function Technology() {
  const { t } = useLocale();

  const techniques = [
    {
      icon: TECHNIQUE_ICONS[0],
      title: t.technology.metadataTitle,
      body: t.technology.metadataBody,
    },
    {
      icon: TECHNIQUE_ICONS[1],
      title: t.technology.compressionTitle,
      body: t.technology.compressionBody,
    },
    {
      icon: TECHNIQUE_ICONS[2],
      title: t.technology.frequencyTitle,
      body: t.technology.frequencyBody,
    },
    {
      icon: TECHNIQUE_ICONS[3],
      title: t.technology.noiseTitle,
      body: t.technology.noiseBody,
    },
    {
      icon: TECHNIQUE_ICONS[4],
      title: t.technology.textureTitle,
      body: t.technology.textureBody,
    },
    {
      icon: TECHNIQUE_ICONS[5],
      title: t.technology.weightingTitle,
      body: t.technology.weightingBody,
    },
  ];

  return (
    <Section id="technology" spacing="lg" className="bg-surface/30">
      <Container>
        <SectionHeading
          eyebrow={t.technology.eyebrow}
          title={t.technology.title}
          description={t.technology.description}
        />

        <Stagger className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {techniques.map(({ icon: Icon, title, body }) => (
            <StaggerItem key={title}>
              <Card variant="surface" padding="lg" className="lift sheen h-full">
                <Icon className="size-5 text-support" aria-hidden="true" />
                <h3 className="mt-5 font-display text-h4 text-ink">{title}</h3>
                <p className="mt-2 text-body-sm text-ink-muted">{body}</p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </Section>
  );
}
