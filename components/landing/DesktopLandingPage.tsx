"use client";

import React from "react";
import LandingNav from "./LandingNav";
import Hero from "./Hero";
import ProblemSection from "./ProblemSection";
import MealScanShowcase from "./MealScanShowcase";
import OrbitSection from "./OrbitSection";
import ProgressSection from "./ProgressSection";
import FinalCTA from "./FinalCTA";
import Footer from "./Footer";

export default function DesktopLandingPage() {
  return (
    <div className="w-full">
      {/* 1. Floating Widescreen Capsule Header */}
      <LandingNav />

      {/* 2. Hero: Centered display headline + full-bleed athlete visual card */}
      <Hero />

      {/* 3. ProblemSection: Interactive 4-stage user day timeline */}
      <ProblemSection />

      {/* 4. MealScanShowcase: HealthifySnap-style scroll-driven meal scanner showcase */}
      <MealScanShowcase />

      {/* 5. OrbitSection: 3D Multi-Axis Gyroscope + Floating Prompt Cloud */}
      <OrbitSection />

      {/* 6. ProgressSection: Interactive 28-day streak with generous spacing and dark mode badges */}
      <ProgressSection />

      {/* 7. FinalCTA: Full-bleed dark botanical card */}
      <FinalCTA />

      {/* 8. Grounded Footer: Single horizontal line with inline Sanskrit lineage note */}
      <Footer />
    </div>
  );
}
