/**
 * Product-level constants. Anything that appears in more than one place —
 * the tagline, the author credit, the canonical URL — lives here so it can
 * never drift between the header, the footer, and the page metadata.
 */
export const SITE = {
  name: "VeriSight",
  tagline: "Verify Reality. Reveal the Truth.",
  description:
    "Analyze images and videos using AI-assisted digital forensic techniques to estimate authenticity with transparent confidence scoring.",
  author: "Abdulrahman Al-Anazi",
  authorRole: "Founder & Creator",
  url: "https://verisight.app",
  locale: "en_US",
} as const;

/**
 * The five verdict bands.
 *
 * The product must never assert that media *is* authentic or *is* generated,
 * so the result is a position on a spectrum rather than a binary. Each band
 * pairs a colour token with an icon name and a label: colour alone never
 * carries the meaning (WCAG 1.4.1), and the wording stays hedged by design.
 *
 * `inconclusive` is intentionally neutral in both colour and copy. When the
 * signals genuinely disagree, saying so is the correct answer — not a
 * degraded one.
 */
export const VERDICT_BANDS = [
  {
    id: "authentic",
    label: "Likely Authentic",
    icon: "ShieldCheck",
    description: "Signals are broadly consistent with camera-captured media.",
  },
  {
    id: "leaning-authentic",
    label: "Leaning Authentic",
    icon: "ShieldQuestion",
    description: "Most signals favour authenticity, with some uncertainty.",
  },
  {
    id: "inconclusive",
    label: "Inconclusive",
    icon: "CircleDashed",
    description: "Signals conflict or are too weak to support a conclusion.",
  },
  {
    id: "leaning-synthetic",
    label: "Leaning Synthetic",
    icon: "ShieldAlert",
    description: "Several indicators associated with generated media are present.",
  },
  {
    id: "synthetic",
    label: "Likely Synthetic",
    icon: "ShieldX",
    description: "Multiple strong indicators of AI generation were detected.",
  },
] as const;

export type VerdictId = (typeof VERDICT_BANDS)[number]["id"];
