"use client";

import { Container, Section } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { useLocale } from "@/components/providers/locale-provider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "@/features/landing/components/section-heading";

/**
 * The answers are deliberately candid, including about what the tool cannot
 * do. A verification product that oversells its accuracy in its own FAQ has
 * already failed the standard it asks users to hold media to. Copy is the
 * dictionary's source of truth.
 */
export function Faq() {
  const { t } = useLocale();

  const faqs = [
    { q: t.faq.q1, a: t.faq.a1 },
    { q: t.faq.q2, a: t.faq.a2 },
    { q: t.faq.q3, a: t.faq.a3 },
    { q: t.faq.q4, a: t.faq.a4 },
    { q: t.faq.q5, a: t.faq.a5 },
    { q: t.faq.q6, a: t.faq.a6 },
  ];

  return (
    <Section id="faq" spacing="lg">
      <Container width="prose">
        <SectionHeading
          eyebrow={t.faq.eyebrow}
          title={t.faq.title}
          description={t.faq.description}
        />

        <Reveal delay={0.05} className="mt-14">
          {/* `collapsible` lets the open item close again — without it, once a
              user opens one panel they can never return to a clean list. */}
          <Accordion type="single" collapsible className="border-t border-line">
            {faqs.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </Container>
    </Section>
  );
}
