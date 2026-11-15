"use client";

import React from "react";
import MobileLandingNav from "./MobileLandingNav";
import MobileHero from "./MobileHero";
import MobileProblemSection from "./MobileProblemSection";
import MealScanShowcase from "../MealScanShowcase";
import MobileOrbitSection from "./MobileOrbitSection";
import MobileProgressSection from "./MobileProgressSection";
import MobileFinalCTA from "./MobileFinalCTA";
import MobileFooter from "./MobileFooter";

export default function MobileLandingPage() {
  return (
    <div className="w-full">
      {/* 1. Floating Capsule Header */}
      <MobileLandingNav />

      {/* 2. Hero: Headline + Product Scene */}
      <MobileHero />

      {/* 3. ProblemSection: Interactive 4-stage user day timeline */}
      <MobileProblemSection />

      {/* 4. MealScanShowcase: HealthifySnap-style plate scan showcase */}
      <MealScanShowcase />

      {/* 5. OrbitSection: 3D Multi-Axis Gyroscope + Floating Prompt Cloud */}
      <MobileOrbitSection />

      {/* 6. ProgressSection: Continuous Proof */}
      <MobileProgressSection />

      {/* 7. FinalCTA */}
      <MobileFinalCTA />

      {/* 8. Grounded Footer */}
      <MobileFooter />
    </div>
  );
}
