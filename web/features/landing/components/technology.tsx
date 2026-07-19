import { Aperture, Binary, Fingerprint, Grid2x2, Layers3, Waves } from "lucide-react";

import { Container, Section } from "@/components/layout/container";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/features/landing/components/section-heading";

/**
 * The techniques are described in plain language and without overclaiming.
 * Each entry names what is actually measured — these map one-to-one onto
 * analyzer modules built in Phase 4, so nothing here promises a capability
 * the engine will not have.
 */
const TECHNIQUES = [
  {
    icon: Fingerprint,
    title: "Metadata & provenance",
    body: "Reads EXIF, XMP, and C2PA Content Credentials. Some generators sign their output; where that signature exists it is strong evidence.",
  },
  {
    icon: Grid2x2,
    title: "Compression analysis",
    body: "Inspects JPEG quantization tables and error levels for traces of re-encoding, editing, or a non-camera origin.",
  },
  {
    icon: Waves,
    title: "Frequency domain",
    body: "Generative models often leave periodic artefacts from upsampling. A frequency transform can surface patterns invisible to the eye.",
  },
  {
    icon: Aperture,
    title: "Sensor noise",
    body: "Camera sensors impose a characteristic noise pattern. Its absence or inconsistency across a frame is a meaningful signal.",
  },
  {
    icon: Layers3,
    title: "Texture & edge coherence",
    body: "Checks for repeated texture patches and edge behaviour that does not match how lenses and optics actually render detail.",
  },
  {
    icon: Binary,
    title: "Learned classification",
    body: "A trained model contributes its own estimate. It is one input among several — never the sole basis for the result.",
  },
] as const;

export function Technology() {
  return (
    <Section id="technology" spacing="lg" className="bg-surface/30">
      <Container>
        <SectionHeading
          eyebrow="Technology"
          title="Multiple signals, weighed together"
          description="No single technique is reliable alone. Each contributes evidence, and disagreement between them is reported rather than hidden."
        />

        <Stagger className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TECHNIQUES.map(({ icon: Icon, title, body }) => (
            <StaggerItem key={title}>
              <Card variant="surface" padding="lg" className="h-full">
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
