"use client";

import React, { useState } from "react";

type ScenarioKey = "day7" | "day16" | "day28";

interface ScenarioConfig {
  key: ScenarioKey;
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
    label: "Day 7 · Start",
    badge: "Initial Cadence",
    explanation: "First 7 days: establishing rhythm with gentle habit anchors and zero stress.",
    activeDay: 7,
    completedDays: [1, 2, 3, 4, 5, 6],
    adaptiveDays: [],
  },
  {
    key: "day16",
    label: "Day 16 · Healed",
    badge: "Auto-Bridged Gap",
    explanation: "48h fever/travel: SATAT auto-bridges the gap in warm amber. Sets recalibrated, momentum preserved.",
    activeDay: 16,
    completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14, 15],
    adaptiveDays: [11, 12],
  },
  {
    key: "day28",
    label: "Day 28 · Flow",
    badge: "Full Cycle Compounded",
    explanation: "28-day cycle: 26 active sessions, 2 adaptive healings, +12.4% measured capacity.",
    activeDay: 28,
    completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
    adaptiveDays: [11, 12],
  },
];

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

const CALENDAR_DAYS_21 = [
  { day: 1, type: "done" },
  { day: 2, type: "done" },
  { day: 3, type: "done" },
  { day: 4, type: "done" },
  { day: 5, type: "done" },
  { day: 6, type: "done" },
  { day: 7, type: "done" },
  { day: 8, type: "done" },
  { day: 9, type: "rest", label: "Rested" },
  { day: 10, type: "rest", label: "Rested" },
  { day: 11, type: "done" },
  { day: 12, type: "done" },
  { day: 13, type: "done" },
  { day: 14, type: "today", label: "Today" },
  { day: 15, type: "future" },
  { day: 16, type: "future" },
  { day: 17, type: "rest", label: "Rested" },
  { day: 18, type: "rest", label: "Rested" },
  { day: 19, type: "future" },
  { day: 20, type: "future" },
  { day: 21, type: "future" },
];

export default function ProgressSection() {
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<ScenarioKey>("day16");
  const activeScenario = SCENARIOS.find((s) => s.key === selectedScenarioKey) || SCENARIOS[1];

  return (
    <section id="proof" className="py-14 sm:py-20 px-6 max-w-[920px] mx-auto text-center">
      {/* Hidden anchor compatibility for #progress */}
      <div id="progress" className="relative -top-24 pointer-events-none" aria-hidden="true" />

      {/* Header */}
      <div className="mb-8 text-center">
        <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#2D6A4F] block">
          LIVING STREAKS · LIVING EVIDENCE · सतत्
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl text-[#1C1917] mt-2 mb-2 leading-tight">
          Why continuous beats <span className="italic text-[#E05A47]">perfect.</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed max-w-[480px] mx-auto mt-2">
          Other apps punish you with a broken streak when real life happens. Satat bends with your week so your momentum compounds.
        </p>
      </div>

      {/* Desktop Calendar Card (Matching image_23a8c0.jpg) */}
      <div className="hidden md:block bg-[#FCFBF9] rounded-[32px] p-6 sm:p-10 mt-8 border border-[#1C1917]/[0.06] shadow-xs">
        {/* Top Milestone Header Row */}
        <div className="flex items-center justify-between gap-4 max-w-[480px] mx-auto pb-4 border-b border-[#1C1917]/[0.06] text-xs font-semibold">
          <span className="text-[#8C857B]">Day 7 · Start</span>
          <span className="bg-[#191D1A] text-white rounded-full px-4 py-1.5 shadow-xs">
            Day 14 · Rested
          </span>
          <span className="text-[#8C857B]">Day 28 · Flow</span>
        </div>

        {/* 7-Column Grid of Days 1 through 21 */}
        <div className="grid grid-cols-7 gap-3 sm:gap-4 my-8 max-w-[540px] mx-auto">
          {CALENDAR_DAYS_21.map((item) => {
            if (item.type === "done") {
              return (
                <div key={item.day} className="flex flex-col items-center">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {item.day}
                  </div>
                </div>
              );
            }
            if (item.type === "rest") {
              return (
                <div key={item.day} className="flex flex-col items-center">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#A7F3D0]/60 text-[#065F46] flex items-center justify-center text-xs font-bold border border-[#065F46]/20">
                    {item.day}
                  </div>
                  <span className="text-[9px] font-semibold text-[#065F46] mt-1">{item.label}</span>
                </div>
              );
            }
            if (item.type === "today") {
              return (
                <div key={item.day} className="flex flex-col items-center">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#E05A47] text-white flex items-center justify-center text-xs font-bold shadow-md">
                    {item.day}
                  </div>
                  <span className="text-[9px] font-bold text-[#E05A47] mt-1">{item.label}</span>
                </div>
              );
            }
            return (
              <div key={item.day} className="flex flex-col items-center">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#EFECE4] text-[#8C857B] flex items-center justify-center text-xs font-medium">
                  {item.day}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Comparison Bar */}
        <div className="bg-[#F6F3EC] rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="bg-[#FEE2E2] text-[#B91C1C] rounded-full px-4 py-1.5 text-xs font-semibold text-center w-full sm:w-auto">
            Traditional Apps: Streak Reset to 0 ✕
          </div>
          <div className="bg-[#D8F3DC] text-[#1B4332] rounded-full px-4 py-1.5 text-xs font-semibold text-center w-full sm:w-auto">
            Satat Rhythm: 28 Days Unbroken · +18.4% Strength · +12.4% Strength ✓
          </div>
        </div>
      </div>

      {/* Mobile 28-Day Scenario Switcher Card (md:hidden) */}
      <div className="md:hidden bg-[#FCFBF9] rounded-[28px] p-6 shadow-sm border border-[#1C1917]/[0.06] text-left mt-6">
        {/* Scenario Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-[#EFECE4] mb-5">
          {SCENARIOS.map((scenario) => {
            const isSelected = scenario.key === selectedScenarioKey;
            return (
              <button
                key={scenario.key}
                type="button"
                onClick={() => setSelectedScenarioKey(scenario.key)}
                className={`whitespace-nowrap text-[11px] font-semibold py-2 px-2.5 rounded-full transition-all text-center cursor-pointer ${
                  isSelected
                    ? "bg-[#191D1A] text-white shadow-xs"
                    : "text-[#57534E] hover:text-[#1C1917]"
                }`}
              >
                {scenario.label}
              </button>
            );
          })}
        </div>

        {/* Matrix Header Weekdays */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center">
          {WEEKDAYS.map((day, i) => (
            <span key={i} className="text-[10px] font-mono font-medium text-[#8C857B]">
              {day}
            </span>
          ))}
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
                    ? "bg-[#D97706]/15 text-[#92400E] border border-[#D97706]/30 font-medium"
                    : "bg-[#EFECE4] text-[#8C857B]"
                }`}
              >
                <span>{dayNumber}</span>
              </div>
            );
          })}
        </div>

        {/* Dynamic Context Card for Active Scenario */}
        <div className="mt-4 p-3 rounded-2xl bg-[#F6F3EC]/80 border border-[#1C1917]/[0.05] flex items-center justify-between gap-3 text-left">
          <p className="text-[11px] text-[#57534E] leading-relaxed m-0 font-normal">
            {activeScenario.explanation}
          </p>
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F] bg-[#E6F2EC] px-2.5 py-1 rounded-full">
            {activeScenario.badge}
          </span>
        </div>

        {/* Mobile Comparison Bar */}
        <div className="mt-5 pt-4 border-t border-[rgba(28,25,23,0.06)] flex flex-col gap-2">
          <div className="bg-stone-100 text-[#8C857B] rounded-full px-3 py-1.5 text-[11px] font-medium text-center">
            Traditional Apps: Streak Reset to 0 ✕
          </div>
          <div className="bg-[#E6F2EC] text-[#2D6A4F] font-semibold rounded-full px-3 py-1.5 text-[11px] text-center">
            Satat Rhythm: 28 Days Unbroken · +12.4% Strength ✓
          </div>
        </div>
      </div>
    </section>
  );
}
