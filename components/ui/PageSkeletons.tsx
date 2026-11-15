"use client";

import React from "react";

/**
 * Editorial Full-Width 12-Column Responsive Page Skeletons (§ Sprint 7.6 & 7.7)
 * Adheres to SATAT Design Tokens:
 * Light: `#E6E1D6` (Warm Stone Shimmer), `#FCFBF9` (Alabaster Card Surface)
 * Dark:  `#222B26` (Nocturnal Shimmer, upgraded from dark:bg-[#161C18]), `#121714` (Deep Charcoal Espresso Surface)
 */

const shimmerWave =
  "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 dark:before:via-[#34D399]/[0.08] before:to-transparent";

const shimmerBlock = `bg-[#E6E1D6] dark:bg-[#222B26] border border-transparent dark:border-white/[0.04] ${shimmerWave}`;
const shimmerHeroBar = `bg-[#E6E1D6] dark:bg-[#26332C] border border-transparent dark:border-white/[0.04] ${shimmerWave}`;
const cardSurface =
  "bg-[#FCFBF9] dark:bg-[#121714] border border-[#1C1917]/[0.06] dark:border-white/[0.07] rounded-[28px] p-5 shadow-xs";
const darkCardSurface =
  "bg-[#191D1A] dark:bg-[#101412] text-[#FCFBF9] border border-transparent dark:border-white/[0.08] rounded-[28px] p-5 shadow-md";

/* ──────────────────────────────────────────────────────────────────────────
   1. TODAY PAGE SKELETON (12-Column Studio Bento Architecture)
   ────────────────────────────────────────────────────────────────────────── */
export function TodayPageSkeleton() {
  return (
    <div className="w-full max-w-none space-y-6 pb-24 select-none" aria-label="Loading Today">
      {/* ── MOBILE FLOW (< 1024px) ── */}
      <div className="lg:hidden space-y-5 max-w-md mx-auto">
        {/* Greeting Bar & Dynamic Streak */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="space-y-1.5">
            <div className={`h-3 w-28 rounded-full ${shimmerBlock}`} />
            <div className={`h-8 w-52 rounded-xl ${shimmerBlock}`} />
          </div>
          <div className={`h-7 w-20 rounded-full shrink-0 ${shimmerBlock}`} />
        </div>

        {/* 7-Day Week Capsule Strip */}
        <div className="grid grid-cols-7 gap-1.5 py-1">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className={`h-16 w-full min-w-0 rounded-2xl bg-[#E6E1D6] dark:bg-[#1C2420] flex flex-col items-center justify-between py-2 border border-transparent dark:border-white/[0.04] ${shimmerWave}`}
            >
              <div className="w-4 h-1.5 rounded-full bg-black/10 dark:bg-white/10" />
              <div className="w-4 h-3.5 rounded-md bg-black/15 dark:bg-white/15" />
              <div className="w-1.5 h-1.5 rounded-full bg-black/10 dark:bg-white/10" />
            </div>
          ))}
        </div>

        {/* Workout Hero Card */}
        <div className="h-[220px] rounded-[28px] bg-[#EFECE4] dark:bg-[#18211C] border border-[#34D399]/15 p-5 flex flex-col justify-between shadow-xs">
          <div className="space-y-2.5">
            <div className={`h-4 w-28 rounded-full ${shimmerHeroBar}`} />
            <div className={`h-6 w-44 rounded-xl ${shimmerHeroBar}`} />
            <div className={`h-3 w-56 rounded-full ${shimmerHeroBar}`} />
          </div>
          <div className={`h-10 w-36 rounded-full bg-[#E05A47]/30 border border-[#E05A47]/30 ${shimmerWave}`} />
        </div>

        {/* Calorie & Protein Cards */}
        <div className="space-y-3.5">
          <div className={`h-[112px] rounded-[26px] p-4 ${cardSurface} flex items-center justify-between gap-4`}>
            <div className="space-y-2 flex-1 min-w-0">
              <div className={`h-3 w-28 rounded-full ${shimmerBlock}`} />
              <div className={`h-5 w-36 rounded-xl ${shimmerBlock}`} />
              <div className="flex gap-1.5 pt-0.5">
                <div className={`h-3.5 w-10 rounded-md ${shimmerBlock}`} />
                <div className={`h-3.5 w-10 rounded-md ${shimmerBlock}`} />
                <div className={`h-3.5 w-10 rounded-md ${shimmerBlock}`} />
              </div>
            </div>
            <div className={`w-14 h-14 rounded-full border-4 border-[#E6E1D6] dark:border-[#242E28] shrink-0 flex items-center justify-center ${shimmerWave}`}>
              <div className={`h-3 w-5 rounded ${shimmerBlock}`} />
            </div>
          </div>

          <div className={`h-[112px] rounded-[26px] p-4 ${cardSurface} flex flex-col justify-between`}>
            <div className="flex items-center justify-between">
              <div className={`h-3 w-32 rounded-full ${shimmerBlock}`} />
              <div className={`h-4 w-12 rounded-full ${shimmerBlock}`} />
            </div>
            <div className={`h-5 w-36 rounded-xl ${shimmerBlock}`} />
            <div className={`w-full h-2 rounded-full ${shimmerBlock}`} />
            <div className="flex items-center justify-between">
              <div className={`h-2.5 w-20 rounded-full ${shimmerBlock}`} />
              <div className={`h-2.5 w-16 rounded-full ${shimmerBlock}`} />
            </div>
          </div>
        </div>

        {/* Daily Non-Negotiables 2x2 Grid */}
        <div className={`rounded-[26px] p-4 space-y-3 ${cardSurface}`}>
          <div className="flex items-center justify-between">
            <div className={`h-3 w-36 rounded-full ${shimmerBlock}`} />
            <div className={`h-3 w-14 rounded-full ${shimmerBlock}`} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 rounded-[20px] p-3 flex flex-col justify-between bg-[#F6F3EC] dark:bg-[#18201C] border border-[#1C1917]/[0.05] dark:border-white/[0.06]"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-8 h-8 rounded-xl ${shimmerBlock}`} />
                  <div className={`w-3.5 h-3.5 rounded-full ${shimmerBlock}`} />
                </div>
                <div className="space-y-1">
                  <div className={`h-2 w-10 rounded-full ${shimmerBlock}`} />
                  <div className={`h-3 w-18 rounded-md ${shimmerBlock}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rhythm Feed Rows */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-20 rounded-[24px] p-3.5 ${cardSurface} flex items-center justify-between gap-3`}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-12 h-12 rounded-xl shrink-0 ${shimmerBlock}`} />
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className={`h-2.5 w-20 rounded-full ${shimmerBlock}`} />
                  <div className={`h-4 w-36 rounded-lg ${shimmerBlock}`} />
                </div>
              </div>
              <div className={`w-16 h-7 rounded-full shrink-0 ${shimmerBlock}`} />
            </div>
          ))}
        </div>
      </div>

      {/* ── DESKTOP STUDIO FLOW (lg: 1024px+) ── */}
      <div className="hidden lg:grid grid-cols-12 gap-6 items-start w-full">
        {/* ── LEFT 8 COLUMNS: Main Studio Flow ── */}
        <div className="col-span-8 space-y-6">
          {/* Row 1 (Greeting + 7-Day Strip): Unboxed Header Row */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 w-full overflow-hidden pt-1">
            <div className="space-y-2">
              <div className={`w-32 h-3 rounded-full ${shimmerBlock}`} />
              <div className={`w-64 h-9 rounded-xl ${shimmerBlock}`} />
            </div>
            <div className="grid grid-cols-7 gap-2 w-full xl:w-[360px] shrink-0">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className={`h-16 w-full min-w-0 rounded-2xl bg-[#E6E1D6] dark:bg-[#1C2420] flex flex-col items-center justify-between py-2.5 border border-transparent dark:border-white/[0.04] ${shimmerWave}`}
                >
                  <div className="w-5 h-2 rounded-full bg-black/10 dark:bg-white/10" />
                  <div className="w-5 h-4 rounded-md bg-black/15 dark:bg-white/15" />
                  <div className="w-1.5 h-1.5 rounded-full bg-black/10 dark:bg-white/10" />
                </div>
              ))}
            </div>
          </div>

          {/* Row 2 (Hero Split: 2-Column Responsive Bento Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Col: Tall Workout Hero Card skeleton */}
            <div className="h-[250px] rounded-[28px] bg-[#EFECE4] dark:bg-[#18211C] border border-[#34D399]/15 p-6 flex flex-col justify-between relative overflow-hidden shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className={`h-5 w-32 rounded-full ${shimmerHeroBar}`} />
                  <div className={`h-4 w-24 rounded-full ${shimmerHeroBar}`} />
                </div>
                <div className={`h-7 w-48 rounded-xl ${shimmerHeroBar} mt-2`} />
                <div className={`h-3.5 w-60 rounded-full ${shimmerHeroBar}`} />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <div className={`h-4 w-20 rounded-full ${shimmerHeroBar}`} />
                  <div className={`h-4 w-24 rounded-full ${shimmerHeroBar}`} />
                  <div className={`h-4 w-18 rounded-full ${shimmerHeroBar}`} />
                </div>
              </div>
              <div className={`h-11 w-44 rounded-full bg-[#E05A47]/30 border border-[#E05A47]/30 ${shimmerWave}`} />
            </div>

            {/* Right Col: TWO stacked Alabaster card skeletons */}
            <div className="flex flex-col gap-4">
              {/* Top Alabaster Card: DAILY CALORIE BUDGET */}
              <div className={`h-[117px] rounded-[26px] p-5 ${cardSurface} flex items-center justify-between gap-4`}>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className={`h-3 w-28 rounded-full ${shimmerBlock}`} />
                  <div className={`h-6 w-36 rounded-xl ${shimmerBlock}`} />
                  <div className="flex gap-2 pt-1">
                    <div className={`h-4 w-12 rounded-md ${shimmerBlock}`} />
                    <div className={`h-4 w-12 rounded-md ${shimmerBlock}`} />
                    <div className={`h-4 w-12 rounded-md ${shimmerBlock}`} />
                  </div>
                </div>
                <div className={`w-14 h-14 rounded-full border-4 border-[#E6E1D6] dark:border-[#242E28] shrink-0 flex items-center justify-center ${shimmerWave}`}>
                  <div className={`h-3 w-6 rounded-sm ${shimmerBlock}`} />
                </div>
              </div>

              {/* Bottom Alabaster Card: TARGET PROTEIN SYNTHESIS */}
              <div className={`h-[117px] rounded-[26px] p-5 ${cardSurface} flex flex-col justify-between`}>
                <div className="flex items-center justify-between">
                  <div className={`h-3 w-36 rounded-full ${shimmerBlock}`} />
                  <div className={`h-4 w-14 rounded-full ${shimmerBlock}`} />
                </div>
                <div className={`h-5 w-40 rounded-xl ${shimmerBlock}`} />
                <div className={`w-full h-2 rounded-full ${shimmerBlock}`} />
                <div className="flex items-center justify-between">
                  <div className={`h-2.5 w-24 rounded-full ${shimmerBlock}`} />
                  <div className={`h-2.5 w-20 rounded-full ${shimmerBlock}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Row 3 (Today's Rhythm Feed) */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className={`h-3.5 w-32 rounded-full ${shimmerBlock}`} />
                <div className={`h-3 w-64 rounded-full ${shimmerBlock}`} />
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-7 w-20 rounded-full ${shimmerBlock}`} />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`h-20 rounded-[24px] flex items-center justify-between gap-4 p-4 ${cardSurface}`}>
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className={`w-12 h-12 rounded-xl shrink-0 ${shimmerBlock}`} />
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className={`h-3 w-28 rounded-full ${shimmerBlock}`} />
                      <div className={`h-4 w-44 rounded-lg ${shimmerBlock}`} />
                    </div>
                  </div>
                  <div className={`w-16 h-7 rounded-full shrink-0 ${shimmerBlock}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Row 4: Momentum & Habit Compounding */}
          <div className={`rounded-[28px] p-6 space-y-4 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <div className={`h-5 w-40 rounded-xl ${shimmerBlock}`} />
              <div className={`h-7 w-28 rounded-full ${shimmerBlock}`} />
            </div>
            <div className={`h-36 w-full rounded-2xl ${shimmerBlock}`} />
          </div>

          <div className={`rounded-[28px] p-6 space-y-4 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <div className={`h-5 w-48 rounded-xl ${shimmerBlock}`} />
              <div className={`h-6 w-24 rounded-full ${shimmerBlock}`} />
            </div>
            <div className={`h-32 w-full rounded-2xl ${shimmerBlock}`} />
          </div>
        </div>

        {/* ── RIGHT 4 COLUMNS: Sticky Biological Co-pilot Rail ── */}
        <div className="col-span-4 space-y-5 lg:sticky lg:top-20">
          {/* Card 1: Orbit Adaptive Whisper Skeleton */}
          <div className={`rounded-[26px] p-5 space-y-3 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <div className={`h-3 w-32 rounded-full ${shimmerBlock}`} />
              <div className={`h-4 w-16 rounded-full ${shimmerBlock}`} />
            </div>
            <div className="space-y-2 pt-1">
              <div className={`h-4 w-full rounded-md ${shimmerBlock}`} />
              <div className={`h-4 w-11/12 rounded-md ${shimmerBlock}`} />
              <div className={`h-4 w-3/4 rounded-md ${shimmerBlock}`} />
            </div>
            <div className="pt-2 border-t border-[#1C1917]/[0.05] dark:border-white/[0.06] flex items-center justify-between">
              <div className={`h-3 w-36 rounded-full ${shimmerBlock}`} />
              <div className={`h-3 w-24 rounded-full ${shimmerBlock}`} />
            </div>
          </div>

          {/* Card 2: Daily Non-Negotiables 2×2 Grid Skeleton */}
          <div className={`rounded-[26px] p-5 space-y-3.5 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <div className={`h-3 w-36 rounded-full ${shimmerBlock}`} />
              <div className={`h-3 w-16 rounded-full ${shimmerBlock}`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-[20px] p-3 flex flex-col justify-between bg-[#F6F3EC] dark:bg-[#18201C] border border-[#1C1917]/[0.05] dark:border-white/[0.06]"
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-9 h-9 rounded-xl ${shimmerBlock}`} />
                    <div className={`w-4 h-4 rounded-full ${shimmerBlock}`} />
                  </div>
                  <div className="space-y-1">
                    <div className={`h-2 w-12 rounded-full ${shimmerBlock}`} />
                    <div className={`h-3 w-20 rounded-md ${shimmerBlock}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Circadian Telemetry Skeleton */}
          <div className={`rounded-[26px] p-5 space-y-2.5 ${cardSurface}`}>
            <div className="flex items-center justify-between mb-1">
              <div className={`h-3 w-36 rounded-full ${shimmerBlock}`} />
              <div className={`h-4 w-20 rounded-full ${shimmerBlock}`} />
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-xl p-2.5 flex items-center justify-between bg-[#F6F3EC] dark:bg-[#18201C] border border-[#1C1917]/[0.05] dark:border-white/[0.06]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg ${shimmerBlock}`} />
                    <div className="space-y-1">
                      <div className={`h-2.5 w-16 rounded-full ${shimmerBlock}`} />
                      <div className={`h-2 w-24 rounded-full ${shimmerBlock}`} />
                    </div>
                  </div>
                  <div className={`h-3 w-10 rounded-full ${shimmerBlock}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   2. PLAN PAGE SKELETON (Execution Studio 12-Column Architecture)
   ────────────────────────────────────────────────────────────────────────── */
export function PlanPageSkeleton() {
  return (
    <div className="w-full max-w-none space-y-6 pb-24 select-none" aria-label="Loading Plan">
      {/* ── MOBILE FLOW (< 1024px) ── */}
      <div className="lg:hidden space-y-5 max-w-md mx-auto">
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="space-y-2">
            <div className={`h-8 w-48 rounded-xl ${shimmerBlock}`} />
            <div className={`h-3.5 w-60 rounded-full ${shimmerBlock}`} />
          </div>
          <div className={`h-9 w-24 rounded-full ${shimmerBlock}`} />
        </div>
        <div className="flex items-center gap-2 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-8 w-24 rounded-full shrink-0 ${shimmerBlock}`} />
          ))}
        </div>
        <div className={`h-36 rounded-3xl ${shimmerBlock}`} />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-20 rounded-2xl ${shimmerBlock}`} />
          ))}
        </div>
      </div>

      {/* ── DESKTOP STUDIO FLOW (lg: 1024px+) ── */}
      <div className="hidden lg:grid grid-cols-12 gap-6 items-start w-full">
        {/* Left 8 Columns */}
        <div className="col-span-8 space-y-6">
          {/* Header Row */}
          <div className={`rounded-[28px] p-6 space-y-4 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className={`h-3.5 w-36 rounded-full ${shimmerBlock}`} />
                <div className={`h-8 w-60 rounded-xl ${shimmerBlock}`} />
              </div>
              <div className={`h-9 w-32 rounded-full ${shimmerBlock}`} />
            </div>
            {/* Workspaces Pills */}
            <div className="flex items-center gap-2 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-8 w-28 rounded-full ${shimmerBlock}`} />
              ))}
            </div>
          </div>

          {/* Active Tasks Card */}
          <div className={`rounded-[28px] p-6 space-y-4 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <div className={`h-5 w-44 rounded-xl ${shimmerBlock}`} />
              <div className={`h-6 w-20 rounded-full ${shimmerBlock}`} />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-20 rounded-2xl ${shimmerBlock}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Columns */}
        <div className="col-span-4 space-y-6">
          {/* Focus Timer Ring Card */}
          <div className={`rounded-[28px] p-6 text-center space-y-4 ${darkCardSurface}`}>
            <div className={`h-4 w-32 rounded-full mx-auto ${shimmerBlock}`} />
            <div className={`w-44 h-44 rounded-full mx-auto ${shimmerBlock}`} />
            <div className={`h-10 w-full rounded-full ${shimmerBlock}`} />
          </div>

          {/* Daily Non-Negotiables Card */}
          <div className={`rounded-[28px] p-5 space-y-3 ${cardSurface}`}>
            <div className={`h-4 w-36 rounded-full ${shimmerBlock}`} />
            <div className="grid grid-cols-2 gap-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-24 rounded-2xl ${shimmerBlock}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   3. TRAIN PAGE SKELETON (Movement Studio 12-Column Architecture)
   ────────────────────────────────────────────────────────────────────────── */
export function TrainPageSkeleton() {
  return (
    <div className="w-full max-w-none space-y-6 pb-24 select-none" aria-label="Loading Train">
      {/* ── MOBILE FLOW (< 1024px) ── */}
      <div className="lg:hidden space-y-5 max-w-md mx-auto">
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className={`h-8 w-44 rounded-xl ${shimmerBlock}`} />
          <div className={`h-8 w-24 rounded-full ${shimmerBlock}`} />
        </div>
        <div className={`h-10 w-60 rounded-full ${shimmerBlock}`} />
        <div className={`h-48 rounded-3xl ${cardSurface} p-5`} />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-20 rounded-2xl ${shimmerBlock}`} />
          ))}
        </div>
      </div>

      {/* ── DESKTOP STUDIO FLOW (lg: 1024px+) ── */}
      <div className="hidden lg:grid grid-cols-12 gap-6 items-start w-full">
        {/* Left 8 Columns */}
        <div className="col-span-8 space-y-6">
          <div className={`rounded-[28px] p-6 space-y-4 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className={`h-3.5 w-36 rounded-full ${shimmerBlock}`} />
                <div className={`h-8 w-56 rounded-xl ${shimmerBlock}`} />
              </div>
              <div className={`h-9 w-48 rounded-full ${shimmerBlock}`} />
            </div>
            {/* Table Header & Rows */}
            <div className="space-y-3 pt-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-24 rounded-2xl ${shimmerBlock}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Columns */}
        <div className="col-span-4 space-y-6">
          {/* Session Intelligence / Volume Highlight Card */}
          <div className={`rounded-[28px] p-5 space-y-3 ${cardSurface}`}>
            <div className={`h-4 w-36 rounded-full ${shimmerBlock}`} />
            <div className={`h-6 w-44 rounded-xl ${shimmerBlock}`} />
            <div className={`h-28 rounded-2xl ${shimmerBlock}`} />
          </div>

          {/* Split Recommendations Card */}
          <div className={`rounded-[28px] p-5 space-y-3 ${darkCardSurface}`}>
            <div className={`h-4 w-32 rounded-full ${shimmerBlock}`} />
            <div className={`h-24 rounded-2xl ${shimmerBlock}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   4. FUEL PAGE SKELETON (Nutrition Studio 12-Column Architecture)
   ────────────────────────────────────────────────────────────────────────── */
export function FuelPageSkeleton() {
  return (
    <div className="w-full max-w-none space-y-6 pb-24 select-none" aria-label="Loading Fuel">
      {/* ── MOBILE FLOW (< 1024px) ── */}
      <div className="lg:hidden space-y-5 max-w-md mx-auto">
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className={`h-8 w-44 rounded-xl ${shimmerBlock}`} />
          <div className={`h-8 w-24 rounded-full ${shimmerBlock}`} />
        </div>
        <div className={`h-12 rounded-2xl ${shimmerBlock}`} />
        <div className={`h-48 rounded-3xl ${darkCardSurface}`} />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className={`h-24 rounded-2xl ${shimmerBlock}`} />
          ))}
        </div>
      </div>

      {/* ── DESKTOP STUDIO FLOW (lg: 1024px+) ── */}
      <div className="hidden lg:grid grid-cols-12 gap-6 items-start w-full">
        {/* Left 8 Columns */}
        <div className="col-span-8 space-y-6">
          <div className={`rounded-[28px] p-6 space-y-4 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className={`h-3.5 w-36 rounded-full ${shimmerBlock}`} />
                <div className={`h-8 w-52 rounded-xl ${shimmerBlock}`} />
              </div>
              <div className={`h-9 w-40 rounded-full ${shimmerBlock}`} />
            </div>
            {/* Meal Plate Scanner Card */}
            <div className={`h-28 rounded-2xl ${shimmerBlock}`} />
            {/* Meal Items */}
            <div className="space-y-3 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`h-24 rounded-2xl ${shimmerBlock}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Columns */}
        <div className="col-span-4 space-y-6">
          {/* Circadian Fuel Balance Card with Donut Chart Skeleton */}
          <div className={`rounded-[28px] p-6 space-y-4 ${darkCardSurface}`}>
            <div className={`h-4 w-36 rounded-full ${shimmerBlock}`} />
            <div className={`w-40 h-40 rounded-full mx-auto ${shimmerBlock}`} />
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className={`h-12 rounded-xl ${shimmerBlock}`} />
              <div className={`h-12 rounded-xl ${shimmerBlock}`} />
              <div className={`h-12 rounded-xl ${shimmerBlock}`} />
            </div>
          </div>

          {/* Hydration / Micronutrient Target Card */}
          <div className={`rounded-[28px] p-5 space-y-3 ${cardSurface}`}>
            <div className={`h-4 w-32 rounded-full ${shimmerBlock}`} />
            <div className={`h-28 rounded-2xl ${shimmerBlock}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
