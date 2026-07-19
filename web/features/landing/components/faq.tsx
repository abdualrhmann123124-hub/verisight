import { Container, Section } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
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
 * already failed the standard it asks users to hold media to.
 */
const FAQS = [
  {
    q: "Can VeriSight prove an image is AI-generated?",
    a: "No, and it will never claim to. Detection of generated media is an open research problem, and no tool — including this one — can offer proof. VeriSight reports a likelihood with the evidence behind it, so you can judge how much weight the assessment deserves.",
  },
  {
    q: "How accurate is it?",
    a: "Accuracy depends heavily on the media. High-resolution, unmodified files carry far more usable signal than a screenshot that has been re-compressed and resized by three platforms. Rather than publish a single headline accuracy figure that would not hold across those cases, each report states its own reliability.",
  },
  {
    q: "Why does it sometimes say 'inconclusive'?",
    a: "Because that is sometimes the honest answer. When signals conflict, or the media has been compressed enough to destroy the evidence, forcing a verdict would be misleading. An inconclusive result means the analysis ran correctly and did not find enough to support a conclusion.",
  },
  {
    q: "What happens to the media I upload?",
    a: "It is processed to produce your report and nothing else. Media is not published, shared, sold, or used as training data.",
  },
  {
    q: "Why did my link fail?",
    a: "The most common reason is that the content is private or requires a login — most platforms block automated access to non-public posts. Links to a post page rather than the media file itself can also fail. Downloading the file and uploading it directly usually works.",
  },
  {
    q: "Does editing a photo make it look AI-generated?",
    a: "It can affect several signals. Cropping, filters, and re-exporting all leave traces that overlap with the traces generation leaves. This is why no single indicator decides the outcome, and why the report shows which signals fired rather than only a final number.",
  },
] as const;

export function Faq() {
  return (
    <Section id="faq" spacing="lg">
      <Container width="prose">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions worth asking"
          description="Including the ones about what this tool cannot do."
        />

        <Reveal delay={0.05} className="mt-14">
          {/* `collapsible` lets the open item close again — without it, once a
              user opens one panel they can never return to a clean list. */}
          <Accordion type="single" collapsible className="border-t border-line">
            {FAQS.map((item, index) => (
              <AccordionItem key={item.q} value={`item-${index}`}>
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
