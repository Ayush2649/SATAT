"use client";

import React from "react";
import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import ProblemSection from "@/components/landing/ProblemSection";
import OrbitSection from "@/components/landing/OrbitSection";
import ProgressSection from "@/components/landing/ProgressSection";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export default function ProductionLandingPage() {
  return (
    <main className="min-h-screen bg-[#F6F3EC] text-[#1C1917] selection:bg-[#E05A47]/15 selection:text-[#E05A47] overflow-x-hidden">
      {/* 1. Floating Editorial Header */}
      <LandingNav />

      {/* 2. Hero: Left-aligned serif headline + overlapping physical collage */}
      <Hero />

      {/* 3. ProblemSection: Sinusoidal pulse ribbon + Live System Signals */}
      <ProblemSection />

      {/* 4. OrbitSection: Borderless open-canvas living orb & quote */}
      <OrbitSection />

      {/* 5. ProgressSection: Continuous Proof (28-Day Organic Rhythm Matrix) */}
      <ProgressSection />

      {/* 6. FinalCTA: Single dark botanical card */}
      <FinalCTA />

      {/* 7. Grounded Footer */}
      <Footer />
    </main>
  );
}
