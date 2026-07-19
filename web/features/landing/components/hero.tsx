import { ShieldCheck } from "lucide-react";

import { Container } from "@/components/layout/container";
import { AuroraBackground } from "@/components/motion/aurora-background";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { MediaInput } from "@/features/analyze/components/media-input";
import { SUPPORTED_PLATFORMS } from "@/features/analyze/lib/media-source";

/**
 * Hero.
 *
 * The brief's rule: the input box is the visual focus and everything else
 * supports it. So the headline is deliberately short, there is no decorative
 * illustration competing for attention, and the CTA pair sits inside the
 * input rather than beside it — a separate "Analyze Media" button would pull
 * the eye away from the thing the user actually has to interact with.
 */
export function Hero() {
  return (
    <section id="analyze" className="relative overflow-hidden pt-32 pb-20 sm:pt-40">
      <AuroraBackground />

      <Container className="flex flex-col items-center">
        <Reveal>
          <Badge variant="accent" icon={<ShieldCheck />} size="lg">
            Confidence-based media verification
          </Badge>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 className="mt-8 max-w-4xl text-center font-display text-display-lg text-ink sm:text-display-xl lg:text-display-2xl">
            Verify digital media
            <br />
            <span className="text-gradient">before you trust it.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-6 max-w-2xl text-center text-body-lg text-ink-muted">
            Analyze images and videos using AI-assisted digital forensic techniques to
            estimate authenticity — with transparent confidence scoring and evidence you
            can inspect.
          </p>
        </Reveal>

        <Reveal delay={0.15} className="mt-12 w-full max-w-3xl">
          <MediaInput />
        </Reveal>

        <Reveal delay={0.2} className="mt-14 w-full">
          <div className="flex flex-col items-center gap-4">
            <p className="text-caption tracking-wide text-ink-faint uppercase">
              Accepts public links from
            </p>
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {SUPPORTED_PLATFORMS.map((platform) => (
                <li
                  key={platform.id}
                  className="text-body-sm font-medium text-ink-faint transition-colors duration-200 hover:text-ink-muted"
                >
                  {platform.label}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
