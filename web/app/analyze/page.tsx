import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { AnalyzeWorkspace } from "@/features/analyze/components/analyze-workspace";

export const metadata: Metadata = {
  title: "Analyze media",
  description:
    "Read a file's fingerprint, dimensions, and embedded metadata locally in your browser.",
};

export default function AnalyzePage() {
  return (
    <>
      <Navbar />
      {/* Clears the fixed header, which sits outside normal flow. */}
      <main id="main" className="pt-[var(--header-height)]">
        <AnalyzeWorkspace />
      </main>
      <Footer />
    </>
  );
}
