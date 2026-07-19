import { FileSearch, Layers, Upload } from "lucide-react";

import { Container, Section } from "@/components/layout/container";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/features/landing/components/section-heading";

const STEPS = [
  {
    icon: Upload,
    step: "01",
    title: "Provide the media",
    body: "Paste a public link or upload an image or video. Files are processed for analysis and are not published anywhere.",
  },
  {
    icon: Layers,
    step: "02",
    title: "Independent analyses run",
    body: "Metadata, compression, noise, frequency, and texture signals are examined separately, so no single indicator decides the outcome.",
  },
  {
    icon: FileSearch,
    step: "03",
    title: "Read the evidence",
    body: "You get a confidence estimate with the findings behind it — including which signals disagreed and how reliable the assessment is.",
  },
] as const;

export function HowItWorks() {
  return (
    <Section id="how-it-works" spacing="lg">
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="Three steps, no guesswork"
          description="Each stage is inspectable. If the platform cannot reach a confident answer, it says so rather than picking one."
        />

        <Stagger className="mt-16 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, step, title, body }) => (
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
            Processing time depends on media size and type. Videos take longer than images
            because frames are sampled and analyzed individually.
          </p>
        </Reveal>
      </Container>
    </Section>
  );
}
