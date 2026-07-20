"use client";

import { Lock, ShieldQuestion, TriangleAlert } from "lucide-react";

import { Container, Section } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { useLocale } from "@/components/providers/locale-provider";
import { Card } from "@/components/ui/card";

/**
 * About, limitations, and privacy.
 *
 * Every sentence here is already stated somewhere in the product — the FAQ,
 * the report's caveats, the footer note. That is deliberate: this page
 * collects them rather than inventing a second, softer set of claims for the
 * page people read *before* they trust the tool.
 */
export function AboutContent() {
  const { t } = useLocale();

  const limitations = [
    t.limits["open-problem"],
    t.limits.compression,
    t.limits.metadata,
    t.limits.uncalibrated,
  ];

  return (
    <Section spacing="lg">
      <Container width="prose">
        <Reveal>
          <p className="text-caption font-medium tracking-widest text-accent uppercase">
            {t.footer.about}
          </p>
          <h1 className="mt-4 font-display text-h1 text-ink sm:text-display-lg">
            {t.why.title}
          </h1>
          <p className="mt-5 text-body-lg text-ink-muted">{t.footer.tagline}</p>
        </Reveal>

        <Reveal delay={0.05} className="mt-10">
          <Card variant="surface" padding="lg" className="lift">
            <h2 className="flex items-center gap-2 font-display text-h4 text-ink">
              <ShieldQuestion className="size-4.5 text-accent" aria-hidden="true" />
              {t.faq.q1}
            </h2>
            <p className="mt-3 text-body-sm text-ink-muted">{t.faq.a1}</p>
          </Card>
        </Reveal>

        {/* Anchor target for the footer's Limitations link. */}
        <Reveal delay={0.05} className="mt-12" id="limitations">
          <h2 className="flex items-center gap-2 font-display text-h3 text-ink">
            <TriangleAlert className="size-5 text-warning" aria-hidden="true" />
            {t.footer.limitations}
          </h2>
          <p className="mt-3 text-body text-ink-muted">{t.report.notCalibratedBody}</p>
          <ul className="mt-5 flex flex-col gap-3">
            {limitations.map((line) => (
              <li key={line} className="flex gap-2.5 text-body-sm text-ink-muted">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1 shrink-0 rounded-full bg-ink-faint"
                />
                {line}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Anchor target for the footer's Privacy link. */}
        <Reveal delay={0.05} className="mt-12" id="privacy">
          <h2 className="flex items-center gap-2 font-display text-h3 text-ink">
            <Lock className="size-5 text-accent" aria-hidden="true" />
            {t.footer.privacy}
          </h2>
          <p className="mt-3 text-body text-ink-muted">{t.why.privacyBody}</p>
          <p className="mt-3 text-body-sm text-ink-muted">{t.faq.a4}</p>
        </Reveal>
      </Container>
    </Section>
  );
}
