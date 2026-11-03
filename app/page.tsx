"use client";

import React from "react";
import MobileLandingPage from "@/components/landing/mobile/MobileLandingPage";
import DesktopLandingPage from "@/components/landing/DesktopLandingPage";

export default function ProductionLandingPage() {
  return (
    <main className="min-h-screen bg-[#F6F3EC] text-[#1C1917] selection:bg-[#E05A47]/15 selection:text-[#E05A47] overflow-x-hidden">
      {/* Phone Resolution (< 768px): Exact unmodified origin/main landing experience */}
      <div className="block md:hidden">
        <MobileLandingPage />
      </div>

      {/* Tablet & Desktop Resolution (>= 768px): Expanded widescreen desktop experience */}
      <div className="hidden md:block">
        <DesktopLandingPage />
      </div>
    </main>
  );
}
