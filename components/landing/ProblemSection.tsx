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
          src="https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=120&q=80"
          alt="Bedside morning sunlight"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ),
      signalPill: (
        <div className="bg-[#E6F2EC] text-[#2D6A4F] rounded-full px-3 py-1 text-[11px] font-medium inline-flex items-center gap-1.5 mt-2.5">
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
          src="https://images.unsplash.com/photo-1495214783159-3503fd1b572d?auto=format&fit=crop&w=120&q=80"
          alt="Warm protein oatmeal bowl"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ),
      signalPill: (
        <div className="bg-[#FEF3C7] text-[#92400E] rounded-full px-3 py-1 text-[11px] font-medium inline-flex items-center gap-1.5 mt-2.5">
          <span className="text-xs">✦</span>
          <span>Plate photo scanned → 540 kcal · 34g protein logged in 2s</span>
        </div>
      ),
    },
    {
      id: 3,
      time: "✨ DUSK · 6:30 PM",
      title: "Adaptive recalibration",
      desc: "Missed your workout for a late team call? Satat gently shifts your sets to Thursday automatically—streak unbroken.",
      pulseColor: "#E05A47",
      renderMedia: () => (
        <div className="w-full h-full bg-[#FADCD5] text-[#E05A47] flex items-center justify-center">
          <Moon className="w-4 h-4 fill-current stroke-current" />
        </div>
      ),
      signalPill: (
        <div className="bg-[#FADCD5]/70 text-[#C94A38] rounded-full px-3 py-1 text-[11px] font-medium inline-flex items-center gap-1.5 mt-2.5">
          <span className="text-xs">⚡</span>
          <span>Upper Body A merged into Thursday → 24-day flow preserved</span>
        </div>
      ),
    },
  ];

  return (
    <section id="problem" className="py-12 sm:py-16 px-5 sm:px-6 text-left">
      <div className="max-w-md sm:max-w-lg mx-auto">
        {/* Header (Left-Aligned) */}
        <div className="mb-8">
          <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#E05A47] block">
            RHYTHMIC CADENCE
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#1C1917] mt-1 mb-0">
            A single day, in seamless motion
          </h2>
        </div>

        {/* Inter-Node Segment Architecture (Zero Dangling Line) */}
        <div className="flex flex-col">
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
                {/* Left Rail Column: Node + Inter-Node Beam */}
                <div className="flex flex-col items-center shrink-0 w-12">
                  {/* The Node */}
                  <div className="w-11 h-11 rounded-full relative flex items-center justify-center shrink-0 z-10">
                    <span
                      className="absolute -inset-1 rounded-full animate-ping opacity-20 pointer-events-none"
                      style={{ backgroundColor: milestone.pulseColor }}
                    />
                    <div className="w-11 h-11 rounded-full overflow-hidden ring-[3px] ring-[#F6F3EC] shadow-md relative z-10 bg-[#EFECE4]">
                      {milestone.renderMedia()}
                    </div>
                  </div>

                  {/* Inter-Node Beam Connector: ONLY rendered between nodes, NEVER below the last node */}
                  {idx < milestones.length - 1 && (
                    <div className="w-[2.5px] flex-1 my-1.5 rounded-full bg-[#1C1917]/10 relative overflow-hidden min-h-[76px]">
                      {/* Static subtle gradient spine */}
                      <div
                        className="absolute inset-0 opacity-45"
                        style={{
                          background:
                            idx === 0
                              ? "linear-gradient(180deg, #D97706 0%, #2D6A4F 100%)"
                              : "linear-gradient(180deg, #2D6A4F 0%, #E05A47 100%)",
                        }}
                      />
                      {/* Animated flowing light beam */}
                      <div
                        className="w-full h-12 rounded-full animate-timeline-beam"
                        style={{
                          background:
                            idx === 0
                              ? "linear-gradient(180deg, transparent 0%, #D97706 50%, #2D6A4F 100%)"
                              : "linear-gradient(180deg, transparent 0%, #2D6A4F 50%, #E05A47 100%)",
                          animationDelay: idx === 0 ? "0s" : "1.1s",
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Right Content Column */}
                <div
                  className={`flex-1 pb-6 transition-all duration-200 rounded-2xl p-2.5 -m-2.5 ${
                    isActive ? "bg-[#FCFBF9] shadow-xs" : "group-hover:bg-[#FCFBF9]/60"
                  }`}
                >
                  <span className="text-[10px] font-mono tracking-widest text-[#8C857B] uppercase block mb-1">
                    {milestone.time}
                  </span>
                  <h3 className="font-sans font-bold text-base text-[#1C1917] mb-1">
                    {milestone.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                    {milestone.desc}
                  </p>
                  {milestone.signalPill}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
