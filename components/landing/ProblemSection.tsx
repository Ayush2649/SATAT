"use client";

import React, { useState } from "react";

interface TimelineStage {
  id: number;
  time: string;
  shortTime: string;
  title: string;
  subtitle: string;
  desc: string;
  telemetry: string;
  badgeClass: string;
  photo: string;
}

const STAGES: TimelineStage[] = [
  {
    id: 1,
    time: "07:30 AM · DAWN CHECK-IN",
    shortTime: "07:30 AM",
    title: "Morning Readiness & Plan Sync",
    subtitle: "Circadian Rhythm Calibration",
    desc: "Wake up to a gentle plan already calibrated to your 7h 45m sleep score. Deep work is locked into your 10:00 AM peak dopamine window.",
    telemetry: "✓ 7h 45m Sleep Synced · 92% Readiness",
    badgeClass: "bg-[#2D6A4F]/15 dark:bg-[#2D6A4F]/25 text-[#2D6A4F] dark:text-[#6EE7B7] border border-[#34D399]/25",
    photo: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    time: "01:15 PM · MIDDAY FUEL",
    shortTime: "01:15 PM",
    title: "Zero-Anxiety Plate Recognition",
    subtitle: "Instant Macro Telemetry",
    desc: "Point your camera at your lunch thali or rice bowl. Macros, protein gaps, and glycemic load are logged in 2 seconds flat.",
    telemetry: "✦ 640 kcal · 42g Protein Logged in 2s",
    badgeClass: "bg-[#F59E0B]/15 text-[#D97706] dark:text-[#FBBF24] border border-[#F59E0B]/25",
    photo: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    time: "06:30 PM · DUSK RECALIBRATION",
    shortTime: "06:30 PM",
    title: "Adaptive Hypertrophy Session",
    subtitle: "Autonomous Time Condensation",
    desc: "Late team call ran over? Instead of a broken streak, SATAT condenses your 60-minute Upper Body lift into a high-density 35-minute compound session.",
    telemetry: "⚡ Upper Body A Condensed → 35m Compound Focus",
    badgeClass: "bg-[#E05A47]/15 text-[#C84331] dark:text-[#F87171] border border-[#E05A47]/25",
    photo: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    time: "10:15 PM · NOCTURNAL RECOVERY",
    shortTime: "10:15 PM",
    title: "Protein Window & Cortisol Downshift",
    subtitle: "Restorative Biological Priming",
    desc: "Orbit notices a 28g protein gap before bed and suggests a light bowl of Greek yogurt & berries while priming your tomorrow split.",
    telemetry: "☾ 135g Protein Target Closed · 24-Day Flow Intact",
    badgeClass: "bg-[#1E2621] text-[#6EE7B7] border border-[#34D399]/30",
    photo: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80",
  },
];

export default function ProblemSection() {
  const [activeStageId, setActiveStageId] = useState<number>(1);

  return (
    <section
      id="rhythm"
      className="py-16 sm:py-24 px-4 sm:px-8 w-full max-w-[1400px] mx-auto text-center relative scroll-mt-28"
    >
      {/* Compatibility anchor for #problem */}
      <div id="problem" className="relative -top-24 pointer-events-none" aria-hidden="true" />

      {/* Section Header */}
      <div className="mb-12 sm:mb-16 text-center max-w-none mx-auto">
        <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#E05A47] dark:text-[#FF7A68] block">
          DAILY BIOLOGICAL CADENCE
          <span className="sr-only"> · RHYTHMIC CADENCE</span>
        </span>
        <h2 className="font-serif text-3xl sm:text-5xl text-[#1C1917] dark:text-[#F4F1EA] mt-2 mb-3 leading-tight md:whitespace-nowrap">
          A single day, in seamless motion.
        </h2>
        <p className="text-sm sm:text-base text-[#57534E] dark:text-[#9CA39E] leading-relaxed md:whitespace-nowrap mt-3">
          Follow how SATAT quietly recalibrates your training, nutrition, and focus from dawn to sleep.
        </p>
      </div>

      {/* ── DESKTOP TIMELINE TRACK (hidden md:grid grid-cols-4 gap-6) ── */}
      <div className="hidden md:block relative">
        {/* Continuous Horizontal Connector Spine */}
        <div className="relative mb-8">
          {/* Continuous Track Line centered exactly on the bottom circular dots */}
          <div className="absolute left-[12.5%] right-[12.5%] bottom-[7px] h-[2px] bg-[#1C1917]/15 dark:bg-white/15 z-0">
            <div
              className="h-full bg-[#2D6A4F] dark:bg-[#34D399] transition-all duration-500 rounded-full"
              style={{ width: `${((activeStageId - 1) / 3) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-4 relative z-10">
            {STAGES.map((stage) => {
              const isActive = stage.id === activeStageId;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setActiveStageId(stage.id)}
                  className="flex flex-col items-center group cursor-pointer relative z-10"
                >
                  {/* Top: Time Pill */}
                  <div
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs mb-3 ${
                      isActive
                        ? "bg-[#191D1A] dark:bg-[#FCFBF9] text-white dark:text-[#191D1A] scale-105 shadow-md"
                        : "bg-[#FCFBF9] dark:bg-[#141916] text-[#57534E] dark:text-[#9CA39E] border border-[#1C1917]/10 dark:border-white/10 group-hover:border-[#2D6A4F]"
                    }`}
                  >
                    {stage.shortTime}
                  </div>

                  {/* Bottom: Circular Node Dot with track line running through its center */}
                  <div
                    className={`w-4 h-4 rounded-full border-4 border-[#FCFBF9] dark:border-[#0A0D0B] transition-all relative z-10 ${
                      isActive
                        ? "bg-[#2D6A4F] dark:bg-[#34D399] ring-2 ring-[#2D6A4F]/30 dark:ring-[#34D399]/40 scale-110"
                        : "bg-[#1C1917]/25 dark:bg-white/30 group-hover:bg-[#2D6A4F]"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Responsive Desktop Cards */}
        <div className="grid grid-cols-4 gap-6 text-left">
          {STAGES.map((stage) => {
            const isActive = stage.id === activeStageId;
            return (
              <div
                key={stage.id}
                onClick={() => setActiveStageId(stage.id)}
                className={`bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.07] dark:border-white/[0.08] rounded-[28px] p-5 shadow-xs flex flex-col justify-between transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "ring-2 ring-[#34D399]/50 -translate-y-1.5 shadow-xl bg-[#FCFBF9] dark:bg-[#18211C]"
                    : "hover:-translate-y-1 hover:shadow-md"
                }`}
              >
                <div>
                  <div className="h-44 w-full rounded-2xl overflow-hidden mb-4 bg-[#EFECE4] dark:bg-[#1C2420]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={stage.photo}
                      alt={stage.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  <span className="text-[10px] font-bold tracking-wider uppercase text-[#E05A47] dark:text-[#FF7A68]">
                    {stage.time}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-[#1C1917] dark:text-[#F4F1EA] mt-1 mb-1.5 leading-snug">
                    {stage.title}
                  </h3>
                  <p className="text-xs text-[#57534E] dark:text-[#9CA39E] leading-relaxed">
                    {stage.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1C1917]/[0.06] dark:border-white/[0.06]">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold ${stage.badgeClass}`}
                  >
                    {stage.telemetry}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MOBILE VERTICAL TIMELINE TRACK (md:hidden) ── */}
      <div className="md:hidden space-y-6 text-left relative">
        {/* Continuous Vertical Connecting Spine */}
        <div className="absolute top-8 bottom-8 left-6 w-[2px] bg-[#1C1917]/10 dark:bg-white/10 pointer-events-none" />

        {STAGES.map((stage) => {
          return (
            <div
              key={stage.id}
              className="relative z-10 bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.07] dark:border-white/[0.08] rounded-[26px] p-5 shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold tracking-wider uppercase text-[#E05A47] dark:text-[#FF7A68] bg-[#E05A47]/10 dark:bg-[#E05A47]/20 px-2.5 py-0.5 rounded-full">
                  {stage.time}
                </span>
                <span className="text-xs font-semibold text-[#8C857B] dark:text-[#9CA39E]">
                  Stage {stage.id}/4
                </span>
              </div>

              <div className="h-36 w-full rounded-2xl overflow-hidden mb-3.5 bg-[#EFECE4] dark:bg-[#1C2420]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={stage.photo}
                  alt={stage.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              <h3 className="font-serif text-lg font-bold text-[#1C1917] dark:text-[#F4F1EA] mb-1.5 leading-snug">
                {stage.title}
              </h3>
              <p className="text-xs text-[#57534E] dark:text-[#9CA39E] leading-relaxed mb-4">
                {stage.desc}
              </p>

              <div className="pt-3 border-t border-[#1C1917]/[0.06] dark:border-white/[0.06]">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold w-full justify-center ${stage.badgeClass}`}
                >
                  {stage.telemetry}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
