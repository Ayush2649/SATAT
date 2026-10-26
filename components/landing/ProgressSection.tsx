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

export default function ProgressSection() {
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<ScenarioKey>("day16");
  const activeScenario = SCENARIOS.find((s) => s.key === selectedScenarioKey) || SCENARIOS[1];

  return (
    <section id="progress" className="py-12 sm:py-16 px-5 sm:px-6 text-left max-w-md sm:max-w-lg mx-auto">
      {/* Header with authentic Sanskrit spelling सतत् */}
      <div className="mb-8">
        <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#2D6A4F] block">
          LIVING EVIDENCE · सतत्
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl text-[#1C1917] mt-1 mb-2 leading-tight">
          Why continuous beats <span className="italic text-[#E05A47]">perfect.</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
          Other apps punish you with a broken streak when real life happens. Satat bends with your week so your momentum compounds.
        </p>
      </div>

      {/* 28-Day Organic Rhythm Matrix Card */}
      <div className="bg-[#FCFBF9] rounded-[28px] p-6 shadow-sm border border-[#1C1917]/[0.06]">
        {/* Scenario Switcher Tabs: Crisp 3-Column Single-Line Grid */}
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

        {/* 28 Organic Tactile Pebbles (4 rows x 7 days) */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: 28 }, (_, index) => {
            const dayNumber = index + 1;
            const isCompleted = activeScenario.completedDays.includes(dayNumber);
            const isAdaptive = activeScenario.adaptiveDays.includes(dayNumber);
            const isActive = activeScenario.activeDay === dayNumber;

            if (isActive) {
              return (
                <div
                  key={dayNumber}
                  title={`Day ${dayNumber}: Active today`}
                  className="rounded-xl h-8 flex items-center justify-center text-[10px] sm:text-xs font-mono font-bold bg-[#E05A47] text-white ring-2 ring-[#E05A47]/30 animate-pulse shadow-sm cursor-default"
                >
                  {dayNumber}
                </div>
              );
            }

            if (isAdaptive) {
              return (
                <div
                  key={dayNumber}
                  title={`Day ${dayNumber}: Adaptive rest & recovery`}
                  className="rounded-xl h-8 flex items-center justify-center gap-0.5 text-[10px] sm:text-[11px] font-mono font-medium bg-[#FEF3C7] border border-[#D97706]/40 text-[#92400E] shadow-xs cursor-default"
                >
                  <span className="text-[10px]">↻</span>
                  <span>{dayNumber}</span>
                </div>
              );
            }

            if (isCompleted) {
              return (
                <div
                  key={dayNumber}
                  title={`Day ${dayNumber}: Completed`}
                  className="rounded-xl h-8 flex items-center justify-center text-[10px] sm:text-xs font-mono font-medium bg-[#2D6A4F] text-white shadow-xs cursor-default transition-all duration-200"
                >
                  {dayNumber}
                </div>
              );
            }

            return (
              <div
                key={dayNumber}
                title={`Day ${dayNumber}: Upcoming`}
                className="rounded-xl h-8 flex items-center justify-center text-[10px] sm:text-xs font-mono bg-[#EFECE4]/60 text-[#8C857B] border border-stone-200/50 cursor-default"
              >
                {dayNumber}
              </div>
            );
          })}
        </div>

        {/* Scenario Explanation */}
        <div className="mt-4 p-3 rounded-2xl bg-[#F6F3EC]/80 border border-stone-200/60 flex items-start gap-2">
          <span className="text-[#2D6A4F] text-xs mt-0.5 font-bold">●</span>
          <p className="text-[11px] text-[#57534E] leading-relaxed">
            {activeScenario.explanation}
          </p>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-4 text-[10px] font-mono text-[#8C857B]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" /> Done
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#D97706]" /> Adaptive Rest
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#E05A47]" /> Today
          </span>
        </div>

        {/* Dynamic Comparison Strip below the matrix */}
        <div className="mt-5 pt-4 border-t border-[rgba(28,25,23,0.06)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
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
