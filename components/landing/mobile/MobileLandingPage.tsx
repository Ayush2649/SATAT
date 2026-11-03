"use client";

import React from "react";
import MobileLandingNav from "./MobileLandingNav";
import MobileHero from "./MobileHero";
import MobileProblemSection from "./MobileProblemSection";
import MobileOrbitSection from "./MobileOrbitSection";
import MobileProgressSection from "./MobileProgressSection";
import MobileFinalCTA from "./MobileFinalCTA";
import MobileFooter from "./MobileFooter";

export default function MobileLandingPage() {
  return (
    <div className="w-full">
      {/* 1. Floating Editorial Header */}
      <MobileLandingNav />

      {/* 2. Hero: Left-aligned serif headline + overlapping physical collage */}
      <MobileHero />

      {/* 3. ProblemSection: Sinusoidal pulse ribbon + Live System Signals */}
      <MobileProblemSection />

      {/* 4. OrbitSection: Borderless open-canvas living orb & quote */}
      <MobileOrbitSection />

      {/* 5. ProgressSection: Continuous Proof (28-Day Organic Rhythm Matrix) */}
      <MobileProgressSection />

      {/* 6. FinalCTA: Single dark botanical card */}
      <MobileFinalCTA />

      {/* 7. Grounded Footer */}
      <MobileFooter />
    </div>
  );
}

