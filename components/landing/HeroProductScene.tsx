// components/landing/HeroProductScene.tsx
"use client";

import React from "react";

export default function HeroProductScene() {
  return (
    <div className="relative w-full max-w-md mx-auto mt-6 mb-4 select-none">
      {/* 1. Floating Tilted Dark Botanical Pill (Top-Right) */}
      <div className="relative z-30 flex justify-end pr-1 -mb-3.5">
        <div className="-rotate-2 bg-[#191D1A] text-[#FCFBF9] rounded-full px-4 py-2 text-[11px] sm:text-xs shadow-[0_12px_28px_rgba(25,29,26,0.28)] border border-white/10 inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E05A47] shrink-0 animate-pulse" />
          <span className="tracking-tight">
            <strong className="font-semibold text-white">Upper Body</strong>{" "}
            <span className="text-stone-300">moved to 6PM · Sleep was light</span>
          </span>
        </div>
      </div>

      {/* 2. Primary Upper-Body Strength Photo Card (Full Width, Warm Editorial Grade) */}
      <div className="relative z-10 w-full rounded-[28px] overflow-hidden aspect-[4/4.3] shadow-[0_18px_40px_-12px_rgba(28,25,23,0.14)] bg-[#191D1A]">
        <img
          src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1000&q=85"
          alt="Upper body dumbbell strength training session"
          className="w-full h-full object-cover object-center contrast-[1.02] saturate-[0.95]"
        />
        {/* Warm sunlit editorial gradient vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(25,29,26,0.10) 0%, transparent 45%, rgba(25,29,26,0.45) 100%)",
          }}
        />
      </div>

      {/* 3. Overlapping Alabaster Card Properly Containing the Curved-Arch Oatmeal Photo */}
      <div className="relative z-20 -mt-28 sm:-mt-32 ml-auto w-[92%] bg-[#FCFBF9] p-2.5 sm:p-3 rounded-[28px] shadow-[0_22px_50px_-12px_rgba(28,25,23,0.18)] border border-[#1C1917]/[0.06]">
        <div className="relative w-full h-[185px] sm:h-[210px] rounded-l-[92px] rounded-r-[20px] overflow-hidden bg-[#EFECE4]">
          <img
            src="https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=900&q=85"
            alt="Warm protein oatmeal bowl with fresh berries and nuts"
            className="w-full h-full object-cover object-center"
          />

          {/* Subtle bottom gradient for badge legibility */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
            style={{
              background: "linear-gradient(to top, rgba(25,29,26,0.55), transparent)",
            }}
          />

          {/* Floating Telemetry Pill Inside the Oatmeal Card */}
          <div className="absolute bottom-2.5 right-2.5 bg-[#191D1A]/90 backdrop-blur-md text-[#FCFBF9] rounded-full px-3.5 py-1.5 text-[10px] sm:text-[11px] shadow-md flex items-center gap-2 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7] shrink-0" />
            <span className="font-semibold">Oatmeal &amp; Whey</span>
            <span className="text-[#6EE7B7] font-mono">420 kcal · 34g P</span>
          </div>
        </div>
      </div>
    </div>
  );
}