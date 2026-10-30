"use client";

import React from "react";

/**
 * YouTube-style Warm Stone Shimmer Page Skeletons
 * Adheres to SATAT Design Tokens: `#E6E1D6` (Warm Stone Shimmer), `#FCFBF9` (Alabaster Card Surface)
 */

export function TodayPageSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-24 animate-pulse" aria-label="Loading Today">
      {/* ── Greeting Bar & Dynamic Streak ── */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="space-y-2">
          <div className="h-3.5 w-28 bg-[#E6E1D6] rounded-full" />
          <div className="h-8 sm:h-9 w-56 sm:w-72 bg-[#E6E1D6] rounded-xl" />
        </div>
        <div className="h-8 w-24 sm:w-28 bg-[#E6E1D6] rounded-full shrink-0" />
      </div>

      {/* ── 7-Day Week Capsule Strip ── */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3 py-1">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-20 sm:h-22 bg-[#E6E1D6] rounded-2xl" />
        ))}
      </div>

      {/* ── 2-Column Bento Grid ── */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Hero Card */}
        <div className="col-span-12 lg:col-span-7 h-52 sm:h-60 bg-[#E6E1D6] rounded-3xl p-6" />
        {/* Right Stacked Cards */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <div className="h-24 sm:h-28 bg-[#E6E1D6] rounded-3xl" />
          <div className="h-24 sm:h-28 bg-[#E6E1D6] rounded-3xl" />
        </div>
      </div>

      {/* ── Whisper Callout Strip ── */}
      <div className="h-16 bg-[#E6E1D6] rounded-2xl" />

      {/* ── Feed / Rhythm Timeline Card ── */}
      <div className="bg-[#FCFBF9] border border-[#1C1917]/[0.06] rounded-3xl p-6 space-y-5 shadow-xs">
        {/* Header with Circular Avatar & Stacked Text */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E6E1D6] shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-36 bg-[#E6E1D6] rounded" />
            <div className="h-3 w-24 bg-[#E6E1D6] rounded" />
          </div>
        </div>

        {/* 3 Stacked Bars (YouTube standard: full, 5/6, 2/5) */}
        <div className="space-y-2.5 pt-1">
          <div className="h-4 w-full bg-[#E6E1D6] rounded" />
          <div className="h-4 w-5/6 bg-[#E6E1D6] rounded" />
          <div className="h-4 w-2/5 bg-[#E6E1D6] rounded" />
        </div>
      </div>
    </div>
  );
}

export function PlanPageSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-24 animate-pulse" aria-label="Loading Plan">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="space-y-2">
          <div className="h-8 sm:h-9 w-48 sm:w-60 bg-[#E6E1D6] rounded-xl" />
          <div className="h-4 w-64 sm:w-80 bg-[#E6E1D6] rounded-full" />
        </div>
        <div className="h-10 w-28 bg-[#E6E1D6] rounded-full shrink-0" />
      </div>

      {/* ── Horizontal Workspaces Strip ── */}
      <div className="flex items-center gap-2.5 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-24 sm:w-28 bg-[#E6E1D6] rounded-full shrink-0" />
        ))}
      </div>

      {/* ── Daily Non-Negotiable Rituals Card Skeleton ── */}
      <div className="h-40 bg-[#E6E1D6] rounded-3xl" />

      {/* ── 7-Day Strip ── */}
      <div className="h-14 bg-[#E6E1D6] rounded-2xl" />

      {/* ── 3 Task Rows ── */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-[#E6E1D6] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function TrainPageSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-24 animate-pulse" aria-label="Loading Train">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="space-y-2">
          <div className="h-8 sm:h-9 w-48 sm:w-60 bg-[#E6E1D6] rounded-xl" />
          <div className="h-4 w-56 sm:w-72 bg-[#E6E1D6] rounded-full" />
        </div>
        <div className="h-10 w-28 bg-[#E6E1D6] rounded-full shrink-0" />
      </div>

      {/* ── 3-Tab Pill Switcher ── */}
      <div className="h-11 w-64 bg-[#E6E1D6] rounded-full" />

      {/* ── Hero Split Block with Circular Node ── */}
      <div className="bg-[#FCFBF9] border border-[#1C1917]/[0.06] rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E6E1D6] shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-44 bg-[#E6E1D6] rounded" />
            <div className="h-3.5 w-32 bg-[#E6E1D6] rounded" />
          </div>
        </div>
        <div className="h-32 bg-[#E6E1D6] rounded-2xl" />
      </div>

      {/* ── Exercise Rows ── */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-[#E6E1D6] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function FuelPageSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-24 animate-pulse" aria-label="Loading Fuel">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="space-y-2">
          <div className="h-8 sm:h-9 w-52 sm:w-64 bg-[#E6E1D6] rounded-xl" />
          <div className="h-4 w-60 sm:w-80 bg-[#E6E1D6] rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[#E6E1D6]" />
          <div className="w-9 h-9 rounded-full bg-[#E6E1D6]" />
        </div>
      </div>

      {/* ── Date Navigation Strip ── */}
      <div className="h-14 bg-[#E6E1D6] rounded-2xl" />

      {/* ── Daily Nutrition Summary Hero ── */}
      <div className="h-48 bg-[#E6E1D6] rounded-3xl" />

      {/* ── Meal Plate Scanner Card Launcher ── */}
      <div className="h-24 bg-[#E6E1D6] rounded-2xl" />

      {/* ── 2 Meal Log Rows ── */}
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-[#E6E1D6] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

