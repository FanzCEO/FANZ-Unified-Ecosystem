import Header from "@/components/layout/Header";
import Hero from "@/components/sections/Hero";
import ProblemStrip from "@/components/sections/ProblemStrip";
import HowItWorks from "@/components/sections/HowItWorks";
import FeaturesGrid from "@/components/sections/FeaturesGrid";
import UseCases from "@/components/sections/UseCases";
import SecurityCompliance from "@/components/sections/SecurityCompliance";
import SocialProof from "@/components/sections/SocialProof";
import Pricing from "@/components/sections/Pricing";
import FAQ from "@/components/sections/FAQ";
import CTABand from "@/components/sections/CTABand";
import Footer from "@/components/layout/Footer";
import { useEffect } from "react";

// ... existing code ...
export default function Index() {
  useEffect(() => { document.title = "FanzDefender — Powerful Demand & DMCA Takedowns"; }, []);
  return (
    <main>
      <Header />
      <Hero />
      <ProblemStrip />
      <HowItWorks />
      <FeaturesGrid />
      <UseCases />
      <SecurityCompliance />
      <SocialProof />
      <Pricing />
      <FAQ />
      <CTABand />
      <Footer />
    </main>
  );
}