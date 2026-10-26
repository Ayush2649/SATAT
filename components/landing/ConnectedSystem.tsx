"use client";

import React, { useState } from "react";

interface SystemPhase {
  id: string;
  number: string;
  title: string;
  sub: string;
  action: string;
  outcome: string;
  connection: string;
  accent: string;
}

const PHASES: SystemPhase[] = [
  {
    id: "intent",
    number: "01",
    title: "Intent",
    sub: "Goals",
    action: "Direction without anxiety",
    outcome: "Clear body composition, strength, and life milestones grounded in who you want to become.",
    connection: "Guides daily cadence",
    accent: "#E05A47",
  },
  {
    id: "cadence",
    number: "02",
    title: "Cadence",
    sub: "Routines",
    action: "Habits that fit reality",
    outcome: "Mobility, hydration, and timeblocks that protect your rhythm when schedules get hectic.",
    connection: "Opens the training window",
    accent: "#2D6A4F",
  },
  {
    id: "movement",
    number: "03",
    title: "Movement",
    sub: "Training",
    action: "Progressive physical craft",
    outcome: "Compound lift progressions, mindful effort, and automatic volume curves tailored to energy.",
    connection: "Signals fueling demand",
    accent: "#E05A47",
  },
  {
    id: "fueling",
    number: "04",
    title: "Fueling",
    sub: "Nutrition",
    action: "Mindful nourishment",
    outcome: "Protein targets and calorie balances automatically synchronized with your actual exertion.",
    connection: "Nourishes tonight's restoration",
    accent: "#D97706",
  },
  {
    id: "restoration",
    number: "05",
    title: "Restoration",
    sub: "Recovery",
    action: "Reclaiming baseline",
    outcome: "Gentle sleep monitoring, resting fatigue tracking, and nervous system replenishment.",
    connection: "Synthesizes tomorrow's readiness",
    accent: "#2D6A4F",
  },
  {
    id: "momentum",
    number: "06",
    title: "Momentum",
    sub: "Progress",
    action: "The continuous loop",
    outcome: "Visible 28-day consistency ribbons, capacity growth, and sustainable habits for life.",
    connection: "Refines long-term intent",
    accent: "#E05A47",
  },
];

export default function ConnectedSystem() {
  const [activePhase, setActivePhase] = useState<string>("movement");

  return (
    <section id="system" className="py-24 sm:py-32 px-5 sm:px-6 border-t border-[rgba(28,25,23,0.07)] bg-[#F6F3EC]">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FCFBF9] border border-[rgba(28,25,23,0.07)] mb-4 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
            <span className="font-mono text-xs font-semibold tracking-wider text-[#2D6A4F] uppercase">
              THE UNBROKEN THREAD (सतत)
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-display font-bold text-[#1C1917] tracking-tight leading-tight">
            Everything works better
            <br />
            <span className="font-serif italic font-normal text-[#E05A47]">
              when it works together.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#57534E] mt-5 max-w-xl mx-auto leading-relaxed">
            Instead of managing five disconnected silos, SATAT connects the complete cycle of human wellness
            into a quiet, self-reinforcing continuous loop.
          </p>
        </div>

        {/* 6 Connected Phases Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {PHASES.map((phase) => {
            const isActive = activePhase === phase.id;

            return (
              <div
                key={phase.id}
                onClick={() => setActivePhase(phase.id)}
                className={`group p-6 sm:p-7 rounded-[26px] transition-all duration-300 cursor-pointer flex flex-col justify-between select-none ${
                  isActive
                    ? "bg-[#191D1A] text-white shadow-[0_20px_45px_-10px_rgba(25,29,26,0.35)] border border-[#191D1A]"
                    : "bg-[#FCFBF9] text-[#1C1917] border border-[rgba(28,25,23,0.07)] shadow-[0_14px_34px_-12px_rgba(28,25,23,0.06)] hover:border-[rgba(28,25,23,0.15)]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/10 text-[#FCFBF9]"
                          : "bg-[#EFECE4] text-[#1C1917]"
                      }`}
                    >
                      {phase.number}
                    </span>
                    <span
                      className={`text-[11px] font-mono tracking-wide ${
                        isActive ? "text-[#8C857B]" : "text-[#8C857B]"
                      }`}
                    >
                      {phase.action}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <h3
                      className={`text-xl font-display font-bold tracking-tight ${
                        isActive ? "text-[#FCFBF9]" : "text-[#1C1917]"
                      }`}
                    >
                      {phase.title}
                    </h3>
                    <span
                      className={`text-xs font-mono ${
                        isActive ? "text-[#8C857B]" : "text-[#8C857B]"
                      }`}
                    >
                      ({phase.sub})
                    </span>
                  </div>

                  <p
                    className={`text-xs sm:text-sm leading-relaxed ${
                      isActive ? "text-[#EFECE4]/85" : "text-[#57534E]"
                    }`}
                  >
                    {phase.outcome}
                  </p>
                </div>

                <div
                  className={`mt-6 pt-4 border-t flex items-center justify-between text-xs ${
                    isActive
                      ? "border-white/10 text-[#EFECE4]/70"
                      : "border-[rgba(28,25,23,0.05)] text-[#8C857B]"
                  }`}
                >
                  <span className="font-mono text-[11px]">→ {phase.connection}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? "bg-[#E05A47] animate-pulse" : "bg-[#2D6A4F]"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Continuous Flow Loop Ribbon */}
        <div className="mt-10 sm:mt-12 p-5 sm:p-6 rounded-[24px] bg-[#FCFBF9] border border-[rgba(28,25,23,0.08)] shadow-xs flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-mono text-[#57534E]">
          {PHASES.map((p, idx) => (
            <React.Fragment key={p.id}>
              <button
                type="button"
                onClick={() => setActivePhase(p.id)}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  activePhase === p.id
                    ? "bg-[#191D1A] text-white font-bold shadow-xs"
                    : "hover:bg-[#EFECE4] text-[#1C1917]"
                }`}
              >
                {p.title}
              </button>
              {idx < PHASES.length - 1 && (
                <span className="text-[#E05A47] select-none font-semibold">→</span>
              )}
            </React.Fragment>
          ))}
          <span className="text-[#2D6A4F] select-none font-semibold ml-1">↺ continuous</span>
        </div>
      </div>
    </section>
  );
}
