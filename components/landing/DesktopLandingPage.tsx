"use client";

import React from "react";
import LandingNav from "./LandingNav";
import Hero from "./Hero";
import ProblemSection from "./ProblemSection";
import OrbitSection from "./OrbitSection";
import ProgressSection from "./ProgressSection";
import FinalCTA from "./FinalCTA";
import Footer from "./Footer";

export default function DesktopLandingPage() {
  return (
    <div className="w-full">
      {/* 1. Floating Widescreen Capsule Header */}
      <LandingNav />

      {/* 2. Hero: Centered display headline + full-bleed 1560px athlete visual card */}
      <Hero />

      {/* 3. ProblemSection: 3-column photo studio cards + live signal badges */}
      <ProblemSection />

      {/* 4. OrbitSection: Widescreen living botanical orb with hover lift */}
      <OrbitSection />

      {/* 5. ProgressSection: Interactive 28-day streak tabs (Day 7, 14, 28) */}
      <ProgressSection />

      {/* 6. FinalCTA: Full-bleed dark botanical card */}
      <FinalCTA />

      {/* 7. Grounded Footer: Single horizontal line with inline Sanskrit lineage note */}
      <Footer />
    </div>
  );
}

