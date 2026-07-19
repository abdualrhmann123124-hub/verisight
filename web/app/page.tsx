import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ExampleAnalysis } from "@/features/landing/components/example-analysis";
import { Faq } from "@/features/landing/components/faq";
import { Hero } from "@/features/landing/components/hero";
import { HowItWorks } from "@/features/landing/components/how-it-works";
import { Technology } from "@/features/landing/components/technology";
import { WhyVeriSight } from "@/features/landing/components/why-verisight";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <HowItWorks />
        <Technology />
        <ExampleAnalysis />
        <WhyVeriSight />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
