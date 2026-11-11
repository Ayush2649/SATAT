"use client";

import React from "react";
import MobileLandingPage from "@/components/landing/mobile/MobileLandingPage";
import DesktopLandingPage from "@/components/landing/DesktopLandingPage";

export default function ProductionLandingPage() {
  return (
    <main className="min-h-screen bg-[#F6F3EC] dark:bg-[#0A0D0B] text-[#1C1917] dark:text-[#F4F1EA] selection:bg-[#E05A47]/15 selection:text-[#E05A47] overflow-x-hidden transition-colors">
      {/* Phone Resolution (< 768px) */}
      <div className="block md:hidden">
        <MobileLandingPage />
      </div>

      {/* Tablet & Desktop Resolution (>= 768px) */}
      <div className="hidden md:block">
        <DesktopLandingPage />
      </div>
    </main>
  );
}
