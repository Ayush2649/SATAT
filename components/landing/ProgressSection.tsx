"use client";

import React, { useState } from "react";

type ScenarioKey = "day7" | "day16" | "day28";

interface ScenarioConfig {
  key: ScenarioKey;
  milestoneNum: 7 | 14 | 28;
  label: string;
  badge: string;
  explanation: string;
  activeDay: number;
  completedDays: number[];
  adaptiveDays: number[];
}

const SCENARIOS: ScenarioConfig[] = [
  {
    key: "day7",
    milestoneNum: 7,
    label: "Day 7 · Start",
    badge: "Initial Cadence",
    explanation: "First 7 days: establishing rhythm with gentle habit anchors and zero stress.",
    activeDay: 7,
    completedDays: [1, 2, 3, 4, 5, 6],
    adaptiveDays: [],
  },
  {
    key: "day16",
    milestoneNum: 14,
    label: "Day 16 · Healed",
    badge: "Auto-Bridged Gap",
    explanation: "48h fever/travel: SATAT auto-bridges the gap in warm amber. Sets recalibrated, momentum preserved.",
    activeDay: 16,
    completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14, 15],
    adaptiveDays: [11, 12],
  },
  {
    key: "day28",
    milestoneNum: 28,
    label: "Day 28 · Flow",
    badge: "Full Cycle Compounded",
    explanation: "28-day cycle: 26 active sessions, 2 adaptive healings, +18.4% measured capacity.",
    activeDay: 28,
    completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
    adaptiveDays: [11, 12],
  },
];

interface DesktopCalendarDay {
  day: number;
  type: "done" | "rest" | "today" | "future";
  label?: string;
}

function getDesktopCalendarDays(milestone: 7 | 14 | 28): DesktopCalendarDay[] {
  if (milestone === 7) {
    return Array.from({ length: 28 }, (_, i) => {
      const day = i + 1;
      if (day <= 6) return { day, type: "done" };
      if (day === 7) return { day, type: "today", label: "Today" };
      return { day, type: "future" };
    });
  }

  if (milestone === 14) {
    return Array.from({ length: 28 }, (_, i) => {
      const day = i + 1;
      if (day === 9 || day === 10) return { day, type: "rest", label: "Rested" };
      if (day < 14) return { day, type: "done" };
      if (day === 14) return { day, type: "today", label: "Today" };
      return { day, type: "future" };
    });
  }

  // milestone === 28 (Day 28 · Flow)
  const restDays = [9, 10, 17, 18, 24];
  return Array.from({ length: 28 }, (_, i) => {
    const day = i + 1;
    if (restDays.includes(day)) {
      return { day, type: "rest", label: "Rested" };
    }
    if (day === 28) {
      return { day, type: "today", label: "Flow" };
    }
    return { day, type: "done" };
  });
}

export default function ProgressSection() {
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<ScenarioKey>("day16");
  const [activeMilestone, setActiveMilestone] = useState<7 | 14 | 28>(14);

  const activeScenario = SCENARIOS.find((s) => s.key === selectedScenarioKey) || SCENARIOS[1];
  const calendarDays = getDesktopCalendarDays(activeMilestone);

  const handleSelectScenario = (scenario: ScenarioConfig) => {
    setSelectedScenarioKey(scenario.key);
    setActiveMilestone(scenario.milestoneNum);
  };

  return (
    <section
      id="proof"
      className="py-16 sm:py-24 px-4 sm:px-8 w-full max-w-[1360px] xl:max-w-[1480px] mx-auto text-center"
    >
      {/* Hidden anchor compatibility for #progress */}
      <div id="progress" className="relative -top-24 pointer-events-none" aria-hidden="true" />

      {/* Header */}
      <div className="mb-10 text-center">
        <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#2D6A4F] dark:text-[#6EE7B7] block">
          LIVING STREAKS
          <span className="sr-only"> · LIVING EVIDENCE · सतत्</span>
        </span>
        <h2 className="font-serif text-3xl sm:text-5xl text-[#1C1917] dark:text-[#F4F1EA] mt-2 mb-3 leading-tight">
          Why continuous beats <span className="italic text-[#E05A47]">perfect.</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#57534E] dark:text-[#9CA39E] leading-relaxed max-w-[540px] mx-auto">
          Other apps punish you with a broken streak when real life happens. Satat bends with your week so your momentum compounds.
        </p>
      </div>

      {/* ── DESKTOP 28-DAY CALENDAR CARD ── */}
      <div className="hidden md:block bg-[#FCFBF9] dark:bg-[#141916] rounded-[32px] p-8 sm:p-12 lg:p-14 mt-8 border border-[#1C1917]/[0.06] dark:border-white/[0.08] shadow-xs">
        {/* Generously Spaced Milestone Header Tabs */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:gap-3 bg-[#EFECE4] dark:bg-[#1C221E] p-1.5 sm:p-2 rounded-full max-w-fit mx-auto mb-8 border border-[#1C1917]/[0.06] dark:border-white/[0.08]">
          {SCENARIOS.map((sc) => {
            const isCurrent = activeMilestone === sc.milestoneNum;
            return (
              <button
                key={sc.key}
                type="button"
                onClick={() => handleSelectScenario(sc)}
                className={`px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-[#191D1A] dark:bg-[#FCFBF9] text-white dark:text-[#191D1A] shadow-md"
                    : "text-[#57534E] dark:text-[#9CA39E] hover:text-[#1C1917] dark:hover:text-[#F4F1EA]"
                }`}
              >
                {sc.label}
              </button>
            );
          })}
        </div>

        {/* 7-Column Grid of 28 Days (4 Weeks × 7 Days) */}
        <div className="grid grid-cols-7 gap-2.5 sm:gap-3.5 my-8 max-w-[560px] mx-auto">
          {calendarDays.map((item) => {
            if (item.type === "done") {
              return (
                <div key={item.day} className="flex flex-col items-center">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center text-xs sm:text-sm font-bold shadow-xs transition-transform hover:scale-105">
                    {item.day}
                  </div>
                </div>
              );
            }
            if (item.type === "rest") {
              return (
                <div key={item.day} className="flex flex-col items-center">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#A7F3D0]/60 dark:bg-[#132A1F] text-[#065F46] dark:text-[#6EE7B7] flex items-center justify-center text-xs sm:text-sm font-bold border border-[#065F46]/20 dark:border-[#34D399]/30 transition-transform hover:scale-105">
                    {item.day}
                  </div>
                  <span className="text-[9px] font-semibold text-[#065F46] dark:text-[#6EE7B7] mt-0.5">
                    {item.label}
                  </span>
                </div>
              );
            }
            if (item.type === "today") {
              return (
                <div key={item.day} className="flex flex-col items-center">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E05A47] text-white flex items-center justify-center text-xs sm:text-sm font-bold shadow-md ring-4 ring-[#E05A47]/20 transition-transform hover:scale-105">
                    {item.day}
                  </div>
                  <span className="text-[9px] font-bold text-[#E05A47] mt-0.5">{item.label}</span>
                </div>
              );
            }
            return (
              <div key={item.day} className="flex flex-col items-center">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F6F3EC] dark:bg-[#1C221E] text-[#8C857B] dark:text-[#6E7872] flex items-center justify-center text-xs sm:text-sm font-medium">
                  {item.day}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Comparison Bar in Native Dark/Light Styling */}
        <div className="bg-[#F6F3EC] dark:bg-[#101512] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left max-w-[720px] mx-auto border border-[#1C1917]/[0.05] dark:border-white/[0.06]">
          <div className="bg-[#FEE2E2] dark:bg-[#2A1414] text-[#B91C1C] dark:text-[#FCA5A5] border border-[#EF4444]/25 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-center w-full sm:w-auto shrink-0">
            Traditional Apps: Streak Reset to 0 ✕
          </div>
          <div className="bg-[#D8F3DC] dark:bg-[#132A1F] text-[#1B4332] dark:text-[#6EE7B7] border border-[#34D399]/30 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-center w-full sm:w-auto">
            {activeMilestone === 7 && "Satat Rhythm: Week 1 Baseline Locked · 100% Cadence Sync ✓"}
            {activeMilestone === 14 && "Satat Rhythm: 14 Days Unbroken · Auto-Bridged 2 Rest Days ✓"}
            {activeMilestone === 28 && "Satat Rhythm: 28 Days Unbroken · +18.4% Strength ✓"}
          </div>
        </div>
      </div>

      {/* ── MOBILE 28-DAY CALENDAR CARD (md:hidden) ── */}
      <div className="md:hidden bg-[#FCFBF9] dark:bg-[#141916] rounded-[28px] p-5 shadow-sm border border-[#1C1917]/[0.06] dark:border-white/[0.08] text-left mt-6">
        {/* Generously Spaced Mobile Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-full bg-[#EFECE4] dark:bg-[#1C221E] mb-5 border border-[#1C1917]/[0.06] dark:border-white/[0.08]">
          {SCENARIOS.map((sc) => {
            const isSelected = sc.key === selectedScenarioKey;
            return (
              <button
                key={sc.key}
                type="button"
                onClick={() => handleSelectScenario(sc)}
                className={`whitespace-nowrap text-[11px] font-semibold py-2 px-3 rounded-full transition-all text-center cursor-pointer ${
                  isSelected
                    ? "bg-[#191D1A] dark:bg-[#FCFBF9] text-white dark:text-[#191D1A] shadow-xs"
                    : "text-[#57534E] dark:text-[#9CA39E] hover:text-[#1C1917]"
                }`}
              >
                {sc.label}
              </button>
            );
          })}
        </div>

        {/* 28-Cell Rounded Pebble Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: 28 }).map((_, index) => {
            const dayNumber = index + 1;
            const isCompleted = activeScenario.completedDays.includes(dayNumber);
            const isAdaptive = activeScenario.adaptiveDays.includes(dayNumber);
            const isActive = dayNumber === activeScenario.activeDay;

            return (
              <div
                key={dayNumber}
                className={`aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-xs font-mono transition-all duration-300 relative ${
                  isActive
                    ? "bg-[#E05A47] text-white font-bold ring-2 ring-[#E05A47]/30 shadow-sm scale-105 z-10"
                    : isCompleted
                    ? "bg-[#2D6A4F] text-white font-semibold"
                    : isAdaptive
                    ? "bg-[#A7F3D0]/60 dark:bg-[#132A1F] text-[#065F46] dark:text-[#6EE7B7] border border-[#065F46]/20 dark:border-[#34D399]/30 font-medium"
                    : "bg-[#EFECE4] dark:bg-[#1C221E] text-[#8C857B] dark:text-[#6E7872]"
                }`}
              >
                <span>{dayNumber}</span>
              </div>
            );
          })}
        </div>

        {/* Dynamic Context Card for Active Scenario */}
        <div className="mt-4 p-3 rounded-2xl bg-[#F6F3EC]/80 dark:bg-[#101512] border border-[#1C1917]/[0.05] dark:border-white/[0.06] flex items-center justify-between gap-3 text-left">
          <p className="text-[11px] text-[#57534E] dark:text-[#9CA39E] leading-relaxed m-0 font-normal">
            {activeScenario.explanation}
          </p>
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#6EE7B7] bg-[#E6F2EC] dark:bg-[#132A1F] px-2.5 py-1 rounded-full">
            {activeScenario.badge}
          </span>
        </div>

        {/* Mobile Comparison Bar in Native Dark/Light Styling */}
        <div className="mt-5 pt-4 border-t border-[rgba(28,25,23,0.06)] dark:border-white/10 flex flex-col gap-2">
          <div className="bg-[#FEE2E2] dark:bg-[#2A1414] text-[#B91C1C] dark:text-[#FCA5A5] border border-[#EF4444]/25 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-center">
            Traditional Apps: Streak Reset to 0 ✕
          </div>
          <div className="bg-[#D8F3DC] dark:bg-[#132A1F] text-[#1B4332] dark:text-[#6EE7B7] border border-[#34D399]/30 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-center">
            {activeMilestone === 7 && "Satat Rhythm: Week 1 Baseline Locked · 100% Cadence Sync ✓"}
            {activeMilestone === 14 && "Satat Rhythm: 14 Days Unbroken · Auto-Bridged 2 Rest Days ✓"}
            {activeMilestone === 28 && "Satat Rhythm: 28 Days Unbroken · +18.4% Strength ✓"}
          </div>
        </div>
      </div>
    </section>
  );
}
