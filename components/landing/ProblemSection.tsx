"use client";

import React, { useState } from "react";
import { Moon } from "lucide-react";

interface Milestone {
  id: number;
  time: string;
  title: string;
  desc: string;
  pulseColor: string;
  renderMedia: () => React.ReactNode;
  signalPill: React.ReactNode;
}

export default function ProblemSection() {
  const [activeMilestone, setActiveMilestone] = useState<number | null>(null);

  const milestones: Milestone[] = [
    {
      id: 1,
      time: "🌅 DAWN · 7:30 AM",
      title: "Morning check-in",
      desc: "Wake up to a gentle plan that already knows how you slept—recalibrated before your feet touch the floor.",
      pulseColor: "#D97706",
      renderMedia: () => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=120&q=80"
          alt="Bedside morning sunlight"
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=120&q=80";
          }}
        />
      ),
      signalPill: (
        <div className="bg-[#E6F2EC] text-[#2D6A4F] rounded-full px-3 py-1 text-[11px] font-medium inline-flex items-center gap-1.5 mt-2.5 hover:-translate-y-1 transition-all duration-300 shadow-xs hover:shadow-md cursor-default">
          <span className="text-xs">↻</span>
          <span>7h 45m sleep synced → Training readiness 92%</span>
        </div>
      ),
    },
    {
      id: 2,
      time: "🍴 MIDDAY · 1:15 PM",
      title: "Mindful nourishment",
      desc: "Snap a photo of your plate. No stressful barcode scanning, weighing grams, or calorie anxieties.",
      pulseColor: "#2D6A4F",
      renderMedia: () => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=120&q=80"
          alt="Warm protein oatmeal bowl"
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=120&q=80";
          }}
        />
      ),
      signalPill: (
        <div className="bg-[#FEF3C7] text-[#92400E] rounded-full px-3 py-1 text-[11px] font-medium inline-flex items-center gap-1.5 mt-2.5 hover:-translate-y-1 transition-all duration-300 shadow-xs hover:shadow-md cursor-default">
          <span className="text-xs">✦</span>
          <span>Plate photo scanned → 540 kcal · 34g protein logged in 2s</span>
        </div>
      ),
    },
    {
      id: 3,
      time: "✨ DUSK · 6:30 PM",
      title: "Adaptive recalibration",
      desc: "Running late from work? Your 60-minute lift quietly condenses into a focused 35-minute compound session.",
      pulseColor: "#E05A47",
      renderMedia: () => (
        <div className="w-full h-full bg-[#FADCD5] text-[#E05A47] flex items-center justify-center">
          <Moon className="w-4 h-4 fill-current stroke-current" />
        </div>
      ),
      signalPill: (
        <div className="bg-[#FADCD5]/70 text-[#C94A38] rounded-full px-3 py-1 text-[11px] font-medium inline-flex items-center gap-1.5 mt-2.5 hover:-translate-y-1 transition-all duration-300 shadow-xs hover:shadow-md cursor-default">
          <span className="text-xs">⚡</span>
          <span>Upper Body A merged into Thursday → 24-day flow preserved</span>
        </div>
      ),
    },
  ];

  return (
    <section id="rhythm" className="py-16 sm:py-24 px-6 md:px-12 lg:px-16 w-full max-w-[1440px] xl:max-w-[1600px] mx-auto text-center">
      {/* Hidden anchor compatibility for #problem */}
      <div id="problem" className="relative -top-24 pointer-events-none" aria-hidden="true" />

      {/* Centered Header */}
      <div className="mb-10 text-center">
        <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#8C857B] block">
          RHYTHMIC CADENCE
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1C1917] mt-2 mb-0">
          A single day, in seamless motion
        </h2>
      </div>

      {/* Desktop Responsive 3-Column Photo Card Grid (Expanded to max-w-[1600px] with h-56/h-64 images) */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-10 text-left">
        {/* Card 1: 7:30 AM · MORNING CHECK-IN */}
        <div className="bg-[#FCFBF9] rounded-[28px] p-6 lg:p-7 border border-[#1C1917]/[0.06] shadow-xs flex flex-col justify-between hover:shadow-lg transition-all group">
          <div>
            <div className="h-56 lg:h-64 w-full rounded-[20px] overflow-hidden mb-4 bg-[#EFECE4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80"
                alt="Morning check-in desk sunlight"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80";
                }}
              />
            </div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#8C857B] block mb-1">
              7:30 AM · MORNING CHECK-IN
            </span>
            <h3 className="font-serif text-2xl text-[#1C1917] mt-1 mb-2 font-normal">
              Morning check-in
            </h3>
            <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed mb-4">
              Wake up to a gentle plan that already knows how you slept—recalibrated before your feet touch the floor.
            </p>
          </div>
          <div className="mt-auto pt-2">
            <div className="bg-[#F6F3EC] text-[#2D6A4F] rounded-xl px-3.5 py-2.5 text-[11px] sm:text-xs font-semibold inline-flex items-center gap-1.5 w-full hover:-translate-y-1 transition-all duration-300 shadow-xs hover:shadow-md cursor-default">
              <span>↻ 7h 45m sleep synced → Training readiness 92%</span>
            </div>
          </div>
        </div>

        {/* Card 2: 1:15 PM · MINDFUL NOURISHMENT */}
        <div className="bg-[#FCFBF9] rounded-[28px] p-6 lg:p-7 border border-[#1C1917]/[0.06] shadow-xs flex flex-col justify-between hover:shadow-lg transition-all group">
          <div>
            <div className="h-56 lg:h-64 w-full rounded-[20px] overflow-hidden mb-4 bg-[#EFECE4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80"
                alt="Mindful nourishment high-protein bowl"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80";
                }}
              />
            </div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#8C857B] block mb-1">
              1:15 PM · MINDFUL NOURISHMENT
            </span>
            <h3 className="font-serif text-2xl text-[#1C1917] mt-1 mb-2 font-normal">
              Mindful nourishment
            </h3>
            <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed mb-4">
              Snap a photo of your plate. No stressful barcode scanning, weighing grams, or calorie anxieties.
            </p>
          </div>
          <div className="mt-auto pt-2">
            <div className="bg-[#FDF2F0] text-[#E05A47] rounded-xl px-3.5 py-2.5 text-[11px] sm:text-xs font-semibold inline-flex items-center gap-1.5 w-full hover:-translate-y-1 transition-all duration-300 shadow-xs hover:shadow-md cursor-default">
              <span>✦ Plate photo scanned → 640 kcal · 38g protein logged in 3s</span>
            </div>
          </div>
        </div>

        {/* Card 3: 6:30 PM · ADAPTIVE RECALIBRATION */}
        <div className="bg-[#FCFBF9] rounded-[28px] p-6 lg:p-7 border border-[#1C1917]/[0.06] shadow-xs flex flex-col justify-between hover:shadow-lg transition-all group">
          <div>
            <div className="h-56 lg:h-64 w-full rounded-[20px] overflow-hidden mb-4 bg-[#EFECE4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80"
                alt="Adaptive workout dumbbell training"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80";
                }}
              />
            </div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#8C857B] block mb-1">
              6:30 PM · ADAPTIVE RECALIBRATION
            </span>
            <h3 className="font-serif text-2xl text-[#1C1917] mt-1 mb-2 font-normal">
              Adaptive recalibration
            </h3>
            <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed mb-4">
              Running late from work? Your 60-minute lift quietly condenses into a focused 35-minute compound session.
            </p>
          </div>
          <div className="mt-auto pt-2">
            <div className="bg-[#191D1A] text-white rounded-xl px-3.5 py-2.5 text-[11px] sm:text-xs font-semibold inline-flex items-center gap-1.5 w-full hover:-translate-y-1 transition-all duration-300 shadow-xs hover:shadow-md cursor-default">
              <span>⚡ Session condensed → 35m compound focus · Keep dinner as is</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sinusoidal Timeline View (md:hidden) */}
      <div className="md:hidden flex flex-col mt-6 text-left">
        {milestones.map((milestone, idx) => {
          const isActive = activeMilestone === milestone.id;
          return (
            <div
              key={milestone.id}
              className="flex items-stretch gap-4 group cursor-pointer"
              onClick={() => setActiveMilestone(isActive ? null : milestone.id)}
              onMouseEnter={() => setActiveMilestone(milestone.id)}
              onMouseLeave={() => setActiveMilestone(null)}
            >
              {/* Left Rail Column: Mathematically Centered Node + Vertical Spine Beam */}
              <div className="relative flex flex-col items-center shrink-0 w-12">
                {/* Vertical Spine Rail Line centered precisely at left-1/2 -translate-x-1/2 */}
                {idx < milestones.length - 1 && (
                  <div
                    className="absolute top-6 bottom-0 left-1/2 -translate-x-1/2 w-[2.5px] bg-[#1C1917]/10 overflow-hidden rounded-full pointer-events-none"
                    aria-hidden="true"
                  >
                    <div
                      className="absolute inset-0 opacity-45"
                      style={{
                        background:
                          "linear-gradient(180deg, transparent 0%, #2D6A4F 50%, transparent 100%)",
                      }}
                    />
                    <div
                      className="absolute w-full h-8 bg-gradient-to-b from-transparent via-[#2D6A4F] to-transparent animate-timeline-beam"
                      style={{
                        animationDelay: `${idx * 0.8}s`,
                      }}
                    />
                  </div>
                )}

                {/* The Centered Node Wrapper */}
                <div className="relative flex items-center justify-center w-12 h-12 shrink-0 z-10">
                  <span
                    className="absolute w-8 h-8 rounded-full animate-ping opacity-20 pointer-events-none"
                    style={{ backgroundColor: milestone.pulseColor }}
                  />
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-[3px] ring-[#F6F3EC] border-2 border-white shadow-md relative z-10 bg-[#EFECE4] flex items-center justify-center">
                    {milestone.renderMedia()}
                  </div>
                </div>
              </div>

              {/* Right Content Card */}
              <div
                className={`flex-1 mb-4 p-4 rounded-2xl border transition-all duration-300 ${
                  isActive
                    ? "bg-[#FCFBF9] border-[#2D6A4F]/25 shadow-md -translate-y-0.5"
                    : "bg-[#FCFBF9]/80 border-[#1C1917]/[0.05] shadow-xs hover:bg-[#FCFBF9]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-[#8C857B]">
                    {milestone.time}
                  </span>
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: milestone.pulseColor }}
                  />
                </div>
                <h3 className="font-serif text-lg text-[#1C1917] mt-1 mb-1 font-normal">
                  {milestone.title}
                </h3>
                <p className="text-xs text-[#57534E] leading-relaxed m-0 font-normal">
                  {milestone.desc}
                </p>
                {milestone.signalPill}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
