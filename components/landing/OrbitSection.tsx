"use client";

import React from "react";
import Link from "next/link";
import { Orbit3DCore } from "@/components/orbit/Orbit3DCore";
import {
  Sparkles,
  Moon,
  Utensils,
  Dumbbell,
  Zap,
  Check,
  Activity,
} from "lucide-react";

export default function OrbitSection() {
  return (
    <section
      id="orbit"
      className="relative w-full max-w-[1440px] mx-auto min-h-[540px] sm:min-h-[620px] flex flex-col items-center justify-center px-4 py-20 overflow-hidden bg-[#F6F3EC] dark:bg-[#0A0D0B] transition-colors"
    >
      {/* Inline styles for 3D depth-of-field floating animation keyframes */}
      <style>{`
        @keyframes satatFloatSlow {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
        }
        @keyframes satatFloatDelayed {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(12px);
          }
        }
      `}</style>

      {/* Radial Atmospheric Lighting Stage */}
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(45,106,79,0.12)_0%,transparent_70%)] pointer-events-none"
        aria-hidden="true"
      />

      {/* ── DESKTOP & TABLET: SURROUNDING DEPTH-OF-FIELD FLOATING PROMPT CARDS (8 CARDS) ── */}
      <div className="hidden md:block absolute inset-0 pointer-events-none overflow-hidden max-w-[1440px] mx-auto">
        {/* ── 4 CRISP FOREGROUND CARDS (z-10, opacity-95, shadow-lg, satatFloatSlow) ── */}

        {/* 1. Top-Left: [Green Icon] How was my protein intake today? */}
        <div
          style={{ animationDuration: "5s" }}
          className="pointer-events-auto absolute top-10 left-6 xl:left-14 z-10 opacity-95 shadow-lg animate-[satatFloatSlow_5s_ease-in-out_infinite]"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.08] dark:border-white/[0.10] text-xs sm:text-sm font-medium text-[#1C1917] dark:text-[#F4F1EA] whitespace-nowrap shadow-xs hover:border-[#2D6A4F] transition-colors">
            <Sparkles className="w-4 h-4 text-[#2D6A4F] dark:text-[#34D399] shrink-0" />
            <span>How was my protein intake today?</span>
          </div>
        </div>

        {/* 2. Mid-Left: [Coral Icon] How to improve my deep sleep score? */}
        <div
          style={{ animationDuration: "5.4s", animationDelay: "0.6s" }}
          className="pointer-events-auto absolute top-[50%] -translate-y-1/2 left-4 xl:left-10 z-10 opacity-95 shadow-lg animate-[satatFloatSlow_5s_ease-in-out_infinite]"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.08] dark:border-white/[0.10] text-xs sm:text-sm font-medium text-[#1C1917] dark:text-[#F4F1EA] whitespace-nowrap shadow-xs hover:border-[#E05A47] transition-colors">
            <Moon className="w-4 h-4 text-[#E05A47] shrink-0" />
            <span>How to improve my deep sleep score?</span>
          </div>
        </div>

        {/* 3. Top-Right: [Amber Icon] High protein vegetarian dinner ideas? */}
        <div
          style={{ animationDuration: "4.8s", animationDelay: "0.4s" }}
          className="pointer-events-auto absolute top-10 right-6 xl:right-14 z-10 opacity-95 shadow-lg animate-[satatFloatSlow_5s_ease-in-out_infinite]"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.08] dark:border-white/[0.10] text-xs sm:text-sm font-medium text-[#1C1917] dark:text-[#F4F1EA] whitespace-nowrap shadow-xs hover:border-[#F59E0B] transition-colors">
            <Utensils className="w-4 h-4 text-[#F59E0B] shrink-0" />
            <span>High protein vegetarian dinner ideas?</span>
          </div>
        </div>

        {/* 4. Bottom-Right: [Mint Icon] Condense my Upper Body workout to 35m */}
        <div
          style={{ animationDuration: "5.2s", animationDelay: "1s" }}
          className="pointer-events-auto absolute bottom-12 right-6 xl:right-16 z-10 opacity-95 shadow-lg animate-[satatFloatSlow_5s_ease-in-out_infinite]"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.08] dark:border-white/[0.10] text-xs sm:text-sm font-medium text-[#1C1917] dark:text-[#F4F1EA] whitespace-nowrap shadow-xs hover:border-[#34D399] transition-colors">
            <Dumbbell className="w-4 h-4 text-[#2D6A4F] dark:text-[#6EE7B7] shrink-0" />
            <span>Condense my Upper Body workout to 35m</span>
          </div>
        </div>

        {/* ── 4 SOFTLY BLURRED BACKGROUND DEPTH CARDS (z-0, blur-[1.5px], opacity-45, scale-90, satatFloatDelayed) ── */}

        {/* 5. Upper-Center-Left: Workout recovery readiness */}
        <div
          style={{ animationDuration: "6.5s" }}
          className="pointer-events-auto absolute top-20 left-[22%] z-0 blur-[1.5px] opacity-45 scale-90 animate-[satatFloatDelayed_6.5s_ease-in-out_infinite] hover:blur-none hover:opacity-100 hover:scale-100 transition-all duration-300"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.08] dark:border-white/[0.10] text-xs font-medium text-[#1C1917] dark:text-[#F4F1EA] whitespace-nowrap">
            <Zap className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#34D399] shrink-0" />
            <span>Workout recovery readiness</span>
          </div>
        </div>

        {/* 6. Bottom-Left: How to hit 135g protein cleanly? */}
        <div
          style={{ animationDuration: "6.8s", animationDelay: "0.8s" }}
          className="pointer-events-auto absolute bottom-14 left-6 xl:left-20 z-0 blur-[1.5px] opacity-45 scale-90 animate-[satatFloatDelayed_6.5s_ease-in-out_infinite] hover:blur-none hover:opacity-100 hover:scale-100 transition-all duration-300"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.08] dark:border-white/[0.10] text-xs font-medium text-[#1C1917] dark:text-[#F4F1EA] whitespace-nowrap">
            <Check className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#34D399] shrink-0" />
            <span>How to hit 135g protein cleanly?</span>
          </div>
        </div>

        {/* 7. Mid-Right: Shift Deep Work to dopamine peak */}
        <div
          style={{ animationDuration: "6.2s", animationDelay: "0.5s" }}
          className="pointer-events-auto absolute top-[48%] -translate-y-1/2 right-4 xl:right-10 z-0 blur-[1.5px] opacity-45 scale-90 animate-[satatFloatDelayed_6.5s_ease-in-out_infinite] hover:blur-none hover:opacity-100 hover:scale-100 transition-all duration-300"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.08] dark:border-white/[0.10] text-xs font-medium text-[#1C1917] dark:text-[#F4F1EA] whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-[#E05A47] shrink-0" />
            <span>Shift Deep Work to dopamine peak</span>
          </div>
        </div>

        {/* 8. Lower-Center-Right: Analyze my 7-day strength trend */}
        <div
          style={{ animationDuration: "7s", animationDelay: "1.2s" }}
          className="pointer-events-auto absolute bottom-24 right-[22%] z-0 blur-[1.5px] opacity-45 scale-90 animate-[satatFloatDelayed_6.5s_ease-in-out_infinite] hover:blur-none hover:opacity-100 hover:scale-100 transition-all duration-300"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.08] dark:border-white/[0.10] text-xs font-medium text-[#1C1917] dark:text-[#F4F1EA] whitespace-nowrap">
            <Activity className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
            <span>Analyze my 7-day strength trend</span>
          </div>
        </div>
      </div>

      {/* ── MOBILE STREAMING CHIP CLOUD (Top & Bottom Marquee Clouds for Mobile) ── */}
      <div className="md:hidden w-full overflow-x-auto no-scrollbar py-2 mb-6 -mx-4 px-4 flex items-center gap-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.08] dark:border-white/[0.10] text-xs font-medium text-[#1C1917] dark:text-[#F4F1EA] whitespace-nowrap shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#34D399] shrink-0" />
          <span>How was my protein intake today?</span>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.08] dark:border-white/[0.10] text-xs font-medium text-[#1C1917] dark:text-[#F4F1EA] whitespace-nowrap shrink-0">
          <Moon className="w-3.5 h-3.5 text-[#E05A47] shrink-0" />
          <span>How to improve my deep sleep score?</span>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.08] dark:border-white/[0.10] text-xs font-medium text-[#1C1917] dark:text-[#F4F1EA] whitespace-nowrap shrink-0">
          <Utensils className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
          <span>High protein vegetarian dinner ideas?</span>
        </div>
      </div>

      {/* ── CENTER FOCAL STACK (z-20, max-w-[540px] mx-auto) ── */}
      <div className="relative z-20 text-center max-w-[540px] mx-auto flex flex-col items-center">
        {/* Top: 3D Orbit Core */}
        <Orbit3DCore size="lg" state="active" />

        {/* Headline */}
        <h2 className="font-serif text-3xl sm:text-5xl text-[#1C1917] dark:text-[#F4F1EA] mt-5 leading-tight font-normal">
          Try Orbit — Your Personal AI Biological Copilot
        </h2>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-[#57534E] dark:text-[#9CA39E] mt-3 leading-relaxed">
          Cross-synthesizing training strain, nutrition gaps, and focus blocks in real time.
        </p>

        {/* Center CTA Button */}
        <Link
          href="/dashboard/orbit"
          className="mt-7 px-7 py-3.5 rounded-full bg-[#2D6A4F] hover:bg-[#23533D] text-white text-sm font-semibold shadow-lg inline-flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
        >
          <span>Talk to Orbit AI</span>
          <span>→</span>
        </Link>
      </div>

      {/* Mobile Bottom Prompt Cloud */}
      <div className="md:hidden w-full overflow-x-auto no-scrollbar py-2 mt-6 -mx-4 px-4 flex items-center gap-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.08] dark:border-white/[0.10] text-xs font-medium text-[#1C1917] dark:text-[#F4F1EA] whitespace-nowrap shrink-0">
          <Dumbbell className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#6EE7B7] shrink-0" />
          <span>Condense my Upper Body workout to 35m</span>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.08] dark:border-white/[0.10] text-xs font-medium text-[#1C1917] dark:text-[#F4F1EA] whitespace-nowrap shrink-0">
          <Zap className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#34D399] shrink-0" />
          <span>Workout recovery readiness</span>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.08] dark:border-white/[0.10] text-xs font-medium text-[#1C1917] dark:text-[#F4F1EA] whitespace-nowrap shrink-0">
          <Check className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#34D399] shrink-0" />
          <span>How to hit 135g protein cleanly?</span>
        </div>
      </div>
    </section>
  );
}
