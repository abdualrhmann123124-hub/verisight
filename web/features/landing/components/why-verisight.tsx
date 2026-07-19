import { Eye, GitCompareArrows, Lock, ScrollText } from "lucide-react";

import { Container, Section } from "@/components/layout/container";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { SectionHeading } from "@/features/landing/components/section-heading";

/**
 * Positioning without marketing language.
 *
 * The brief is explicit: be honest, avoid buzzwords. So each point is a
 * concrete property of the system — including the one that admits the tool's
 * own limits, which is the most persuasive item on the list for the audience
 * that matters.
 */
const REASONS = [
  {
    icon: Eye,
    title: "Evidence you can inspect",
    body: "Every score is traceable to a named analysis. You can see which signals fired, which did not, and how strongly each contributed.",
  },
  {
    icon: GitCompareArrows,
    title: "Disagreement is reported",
    body: "When analyses conflict, the report says so and the confidence drops. Conflicting evidence is information, not something to smooth over.",
  },
  {
    icon: ScrollText,
    title: "Calibrated, not absolute",
    body: "Output is a likelihood with a stated reliability. The platform will return 'inconclusive' rather than manufacture a verdict it cannot support.",
  },
  {
    icon: Lock,
    title: "Your media stays yours",
    body: "Uploads are processed for analysis only. Nothing is published, sold, or used as training data.",
  },
] as const;

export function WhyVeriSight() {
  return (
    <Section spacing="lg" className="bg-surface/30">
      <Container>
        <SectionHeading
          eyebrow="Why VeriSight"
          title="Built to be questioned"
          description="Verification tools are only useful if you can check their reasoning. That constraint shaped every part of this platform."
        />

        <Stagger className="mt-16 grid gap-x-12 gap-y-10 sm:grid-cols-2">
          {REASONS.map(({ icon: Icon, title, body }) => (
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
