"use client";

import React from "react";

/**
 * Editorial Full-Width 12-Column Responsive Page Skeletons
 * Adheres to SATAT Design Tokens:
 * Light: `#E6E1D6` (Warm Stone Shimmer), `#FCFBF9` (Alabaster Card Surface)
 * Dark:  `#161C18` (Nocturnal Shimmer), `#141916` (Elevated Charcoal Moss Surface)
 */

const shimmerBlock = "bg-[#E6E1D6] dark:bg-[#161C18] border border-transparent dark:border-white/[0.05]";
const cardSurface = "bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.06] dark:border-white/[0.07] shadow-xs";
const darkCardSurface = "bg-[#191D1A] dark:bg-[#121614] text-[#FCFBF9] border border-transparent dark:border-white/[0.08] shadow-md";

/* ──────────────────────────────────────────────────────────────────────────
   1. TODAY PAGE SKELETON (12-Column Studio Bento Architecture)
   ────────────────────────────────────────────────────────────────────────── */
export function TodayPageSkeleton() {
  return (
    <div className="w-full max-w-none space-y-6 pb-24 animate-pulse select-none" aria-label="Loading Today">
      {/* ── MOBILE FLOW (< 1024px) ── */}
      <div className="lg:hidden space-y-5 max-w-md mx-auto">
        {/* Greeting Bar & Dynamic Streak */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="space-y-2">
            <div className={`h-3.5 w-28 rounded-full ${shimmerBlock}`} />
            <div className={`h-8 sm:h-9 w-56 rounded-xl ${shimmerBlock}`} />
          </div>
          <div className={`h-8 w-24 rounded-full shrink-0 ${shimmerBlock}`} />
        </div>

        {/* 7-Day Week Capsule Strip */}
        <div className="grid grid-cols-7 gap-2 py-1">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className={`h-20 rounded-2xl ${shimmerBlock}`} />
          ))}
        </div>

        {/* 2 Bento Cards */}
        <div className="space-y-4">
          <div className={`h-48 rounded-3xl p-6 ${shimmerBlock}`} />
          <div className={`h-36 rounded-3xl p-5 ${shimmerBlock}`} />
        </div>

        {/* Momentum Card */}
        <div className={`rounded-3xl p-6 space-y-4 ${cardSurface}`}>
          <div className={`h-4 w-36 rounded ${shimmerBlock}`} />
          <div className={`h-36 w-full rounded-2xl ${shimmerBlock}`} />
        </div>
      </div>

      {/* ── DESKTOP STUDIO FLOW (lg: 1024px+) ── */}
      <div className="hidden lg:grid grid-cols-12 gap-6 items-start w-full">
        {/* Left 8 Columns */}
        <div className="col-span-8 space-y-6">
          {/* Top Greeting Card with 7-Day Strip */}
          <div className={`rounded-[28px] p-6 space-y-4 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <div className={`h-3.5 w-44 rounded-full ${shimmerBlock}`} />
              <div className={`h-7 w-28 rounded-full ${shimmerBlock}`} />
            </div>
            <div className="flex items-center justify-between gap-6 pt-2">
              <div className="space-y-2 flex-1">
                <div className={`h-9 w-72 rounded-xl ${shimmerBlock}`} />
                <div className={`h-3.5 w-96 rounded-full ${shimmerBlock}`} />
              </div>
              <div className="grid grid-cols-7 gap-2 w-[380px] shrink-0">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className={`h-16 rounded-[20px] ${shimmerBlock}`} />
                ))}
              </div>
            </div>
          </div>

          {/* 2-Column Hero Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`h-52 rounded-[28px] p-6 ${darkCardSurface}`}>
              <div className={`h-4 w-32 rounded-full ${shimmerBlock} mb-4`} />
              <div className={`h-7 w-48 rounded-xl ${shimmerBlock} mb-2`} />
              <div className={`h-3 w-56 rounded-full ${shimmerBlock}`} />
            </div>
            <div className={`h-52 rounded-[28px] p-6 ${cardSurface}`}>
              <div className={`h-4 w-32 rounded-full ${shimmerBlock} mb-4`} />
              <div className={`h-7 w-40 rounded-xl ${shimmerBlock} mb-2`} />
              <div className={`h-3 w-48 rounded-full ${shimmerBlock}`} />
            </div>
          </div>

          {/* Weekly Momentum Spline Chart Card */}
          <div className={`rounded-[28px] p-6 space-y-4 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <div className={`h-5 w-40 rounded-xl ${shimmerBlock}`} />
              <div className={`h-7 w-28 rounded-full ${shimmerBlock}`} />
            </div>
            <div className={`h-40 w-full rounded-2xl ${shimmerBlock}`} />
          </div>

          {/* Habit Compounding Card */}
          <div className={`rounded-[28px] p-6 space-y-4 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <div className={`h-5 w-48 rounded-xl ${shimmerBlock}`} />
              <div className={`h-6 w-24 rounded-full ${shimmerBlock}`} />
            </div>
            <div className={`h-36 w-full rounded-2xl ${shimmerBlock}`} />
          </div>
        </div>

        {/* Right 4 Columns */}
        <div className="col-span-4 space-y-6">
          {/* Daily Non-Negotiable Rituals Card */}
          <div className={`rounded-[28px] p-5 space-y-4 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <div className={`h-4 w-36 rounded-full ${shimmerBlock}`} />
              <div className={`h-4 w-12 rounded-full ${shimmerBlock}`} />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-20 rounded-2xl ${shimmerBlock}`} />
              ))}
            </div>
          </div>

          {/* Daily Cognitive Focus Card */}
          <div className={`rounded-[28px] p-5 space-y-3 ${darkCardSurface}`}>
            <div className={`h-4 w-32 rounded-full ${shimmerBlock}`} />
            <div className={`h-6 w-44 rounded-xl ${shimmerBlock}`} />
            <div className={`h-24 rounded-2xl ${shimmerBlock}`} />
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
    <div className="w-full max-w-none space-y-6 pb-24 animate-pulse select-none" aria-label="Loading Plan">
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
    <div className="w-full max-w-none space-y-6 pb-24 animate-pulse select-none" aria-label="Loading Train">
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
    <div className="w-full max-w-none space-y-6 pb-24 animate-pulse select-none" aria-label="Loading Fuel">
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
