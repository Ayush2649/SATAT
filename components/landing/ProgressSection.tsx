"use client";

import React, { useState } from "react";

type ScenarioKey = "day7" | "day14" | "day28";

interface ScenarioConfig {
  key: ScenarioKey;
  milestoneNum: 7 | 14 | 28;
  label: string;
  badge: string;
  explanation: string;
  activeDay: number;
  completedDays: number[];
  adaptiveDays: number[];
  telemetryHeadline: string;
  habitAdherence: string;
  adherencePct: number;
  measuredCapacity: string;
  capacityPct: number;
  restDaysBridged: string;
  restPct: number;
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
    telemetryHeadline: "Baseline Calibrated · 100% Habit Lock",
    habitAdherence: "100%",
    adherencePct: 100,
    measuredCapacity: "+4.2%",
    capacityPct: 35,
    restDaysBridged: "0 Days (Strict Baseline)",
    restPct: 15,
  },
  {
    key: "day14",
    milestoneNum: 14,
    label: "Day 14 · Rested",
    badge: "Auto-Bridged 2 Rest Days",
    explanation: "48h rest / travel: Satat auto-bridges in warm sage. Momentum unbroken, sets recalibrated.",
    activeDay: 14,
    completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13],
    adaptiveDays: [9, 10],
    telemetryHeadline: "Adaptive Recovery · 14 Days Unbroken",
    habitAdherence: "94%",
    adherencePct: 94,
    measuredCapacity: "+11.8%",
    capacityPct: 65,
    restDaysBridged: "2 Days Bridged (Zero Penalty)",
    restPct: 45,
  },
  {
    key: "day28",
    milestoneNum: 28,
    label: "Day 28 · Flow",
    badge: "Full Cycle Compounded",
    explanation: "28-day cycle: 23 active sessions, 5 adaptive rest days, +18.4% measured capacity.",
    activeDay: 28,
    completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 25, 26, 27],
    adaptiveDays: [9, 10, 17, 18, 24],
    telemetryHeadline: "Full Circadian Compounding · Flow State",
    habitAdherence: "96%",
    adherencePct: 96,
    measuredCapacity: "+18.4%",
    capacityPct: 92,
    restDaysBridged: "5 Days Bridged (Adaptive Balance)",
    restPct: 80,
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
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<ScenarioKey>("day14");
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
      className="scroll-mt-28 py-16 sm:py-24 px-4 sm:px-8 w-full max-w-[1360px] xl:max-w-[1480px] mx-auto text-center"
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

      {/* ── DESKTOP 28-DAY CALENDAR CARD (hidden md:block) ── */}
      <div className="hidden md:block bg-[#FCFBF9] dark:bg-[#141916] rounded-[32px] p-8 sm:p-10 lg:p-12 mt-8 border border-[#1C1917]/[0.06] dark:border-white/[0.08] shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center text-left">
          {/* Left 7 Columns: Milestone Switcher, 4x7 Pebble Grid, Legend */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Generously Spaced Milestone Header Tabs */}
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-start gap-2 sm:gap-3 bg-[#EFECE4] dark:bg-[#1C221E] p-1.5 sm:p-2 rounded-full max-w-fit mb-6 border border-[#1C1917]/[0.06] dark:border-white/[0.08]">
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
            <div className="grid grid-cols-7 gap-2.5 sm:gap-3 my-4 max-w-[560px]">
              {calendarDays.map((item) => {
                if (item.type === "done") {
                  return (
                    <div key={item.day} className="flex flex-col items-center">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center text-xs sm:text-sm font-bold shadow-xs transition-transform hover:scale-105">
                        {item.day}
                      </div>
                    </div>
                  );
                }
                if (item.type === "rest") {
                  return (
                    <div key={item.day} className="flex flex-col items-center">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#A7F3D0]/60 dark:bg-[#132A1F] text-[#065F46] dark:text-[#6EE7B7] flex flex-col items-center justify-center font-bold border border-[#065F46]/20 dark:border-[#34D399]/30 transition-transform hover:scale-105">
                        <span className="text-xs sm:text-sm leading-none">{item.day}</span>
                        <span className="text-[8px] font-semibold tracking-tight uppercase leading-none mt-0.5">
                          {item.label}
                        </span>
                      </div>
                    </div>
                  );
                }
                if (item.type === "today") {
                  return (
                    <div key={item.day} className="flex flex-col items-center">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#E05A47] text-white flex flex-col items-center justify-center font-bold shadow-md ring-4 ring-[#E05A47]/20 transition-transform hover:scale-105">
                        <span className="text-xs sm:text-sm leading-none">{item.day}</span>
                        <span className="text-[8px] font-bold tracking-tight uppercase leading-none mt-0.5">
                          {item.label}
                        </span>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={item.day} className="flex flex-col items-center">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#F6F3EC] dark:bg-[#1C221E] text-[#8C857B] dark:text-[#6E7872] flex items-center justify-center text-xs sm:text-sm font-medium">
                      {item.day}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend Row */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-5 mt-2 border-t border-[#1C1917]/[0.06] dark:border-white/[0.08] text-xs text-[#57534E] dark:text-[#9CA39E]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#2D6A4F] inline-block shadow-xs" />
                <span className="font-medium">Completed Session</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#A7F3D0]/80 dark:bg-[#132A1F] border border-[#065F46]/20 dark:border-[#34D399]/40 inline-block" />
                <span className="font-medium">Auto-Rested Bridge</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#E05A47] inline-block shadow-xs" />
                <span className="font-medium">Active Milestone</span>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Live Momentum Telemetry Panel */}
          <div className="lg:col-span-5 bg-[#F6F3EC]/70 dark:bg-[#101512] rounded-[24px] p-6 sm:p-7 border border-[#1C1917]/[0.06] dark:border-white/[0.08] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.16em] uppercase text-[#2D6A4F] dark:text-[#6EE7B7]">
                  LIVE MOMENTUM TELEMETRY · DAY {activeMilestone}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#6EE7B7] bg-[#E6F2EC] dark:bg-[#132A1F] px-2.5 py-0.5 rounded-full border border-[#2D6A4F]/15 dark:border-[#34D399]/20">
                  {activeScenario.badge}
                </span>
              </div>

              <h3 className="font-serif text-xl sm:text-2xl text-[#1C1917] dark:text-[#F4F1EA] mb-2 leading-snug">
                {activeScenario.telemetryHeadline}
              </h3>
              <p className="text-xs sm:text-sm text-[#57534E] dark:text-[#9CA39E] leading-relaxed mb-6">
                {activeScenario.explanation}
              </p>

              {/* 3 Metric Progress Bars */}
              <div className="space-y-4">
                {/* Metric 1 */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className="text-[#57534E] dark:text-[#9CA39E]">Habit Adherence</span>
                    <span className="text-[#1C1917] dark:text-[#F4F1EA] font-mono">{activeScenario.habitAdherence}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E6E1D6] dark:bg-[#1C221E] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#2D6A4F] dark:bg-[#34D399] transition-all duration-500"
                      style={{ width: `${activeScenario.adherencePct}%` }}
                    />
                  </div>
                </div>

                {/* Metric 2 */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className="text-[#57534E] dark:text-[#9CA39E]">Measured Strength / Capacity</span>
                    <span className="text-[#E05A47] font-mono">{activeScenario.measuredCapacity}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E6E1D6] dark:bg-[#1C221E] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#E05A47] transition-all duration-500"
                      style={{ width: `${activeScenario.capacityPct}%` }}
                    />
                  </div>
                </div>

                {/* Metric 3 */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className="text-[#57534E] dark:text-[#9CA39E]">Adaptive Recovery / Rest</span>
                    <span className="text-[#2D6A4F] dark:text-[#6EE7B7] font-mono text-[11px]">{activeScenario.restDaysBridged}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E6E1D6] dark:bg-[#1C221E] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#059669] dark:bg-[#6EE7B7] transition-all duration-500"
                      style={{ width: `${activeScenario.restPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stacked Comparison Badges */}
            <div className="mt-6 pt-5 border-t border-[#1C1917]/[0.06] dark:border-white/[0.08] flex flex-col gap-2.5">
              <div className="bg-[#FEE2E2] dark:bg-[#2A1414] text-[#B91C1C] dark:text-[#FCA5A5] border border-[#EF4444]/25 px-4 py-2.5 rounded-full text-xs font-semibold text-center">
                Traditional Apps: Streak Reset to 0 ✕
              </div>
              <div className="bg-[#D8F3DC] dark:bg-[#132A1F] text-[#1B4332] dark:text-[#6EE7B7] border border-[#34D399]/30 px-4 py-2.5 rounded-full text-xs font-semibold text-center">
                {activeMilestone === 7 && "Satat Rhythm: Week 1 Baseline Locked · 100% Cadence Sync ✓"}
                {activeMilestone === 14 && "Satat Rhythm: 14 Days Unbroken · Auto-Bridged 2 Rest Days ✓"}
                {activeMilestone === 28 && "Satat Rhythm: 28 Days Unbroken · +18.4% Strength ✓"}
              </div>
            </div>
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
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#6EE7B7] bg-[#E6F2EC] dark:bg-[#132A1F] px-2.5 py-1 rounded-full border border-[#2D6A4F]/15 dark:border-[#34D399]/20">
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
