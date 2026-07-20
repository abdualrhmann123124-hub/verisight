import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PageTransition } from "@/components/motion/page-transition";
import { AboutContent } from "@/features/about/components/about-content";

export const metadata: Metadata = {
  title: "About",
  description:
    "What VeriSight measures, what it cannot tell you, and what happens to the media you analyze.",
};

/**
 * The page the footer's Limitations and Privacy links point at.
 *
 * Both were dead links before this existed. For a product whose argument is
 * that it does not overstate itself, a footer promising a limitations page
 * that 404s was the worst possible thing to leave broken.
 */
export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="pt-[var(--header-height)]">
        <PageTransition>
          <AboutContent />
        </PageTransition>
      </main>
      <Footer />
    </>
  );
}
