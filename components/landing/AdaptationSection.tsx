"use client";

import React, { useState, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/lib/useReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export default function AdaptationSection() {
  const [adapted, setAdapted] = useState<boolean>(true);
  const sectionRef = useRef<HTMLElement>(null);
  const stagesRef = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  useGSAP(
    () => {
      if (prefersReduced) return;

      // Safe progressive entrance: content is visible by default in CSS.
      // clearProps: "all" guarantees no lingering opacity or transform inline styles.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 90%",
          once: true,
        },
        defaults: { ease: "power2.out" },
      });

      tl.fromTo(
        ".adaptation-header",
        { opacity: 0.3, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, clearProps: "all" }
      )
        .fromTo(
          ".adaptation-toggle",
          { opacity: 0.3, y: 12 },
          { opacity: 1, y: 0, duration: 0.4, clearProps: "all" },
          "-=0.2"
        )
        .fromTo(
          ".adaptation-stage",
          { opacity: 0.3, y: 16 },
          { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, clearProps: "all" },
          "-=0.2"
        );
    },
    { scope: sectionRef, dependencies: [prefersReduced] }
  );

  const handleToggle = (state: boolean) => {
    setAdapted(state);
    if (!prefersReduced && step3Ref.current) {
      gsap.fromTo(
        step3Ref.current,
        { scale: 0.98 },
        { scale: 1, duration: 0.3, ease: "power2.out", clearProps: "scale" }
      );
    }
  };

  return (
    <section id="adaptation" className="py-24 sm:py-32 px-5 sm:px-6 border-t border-[rgba(28,25,23,0.07)] bg-[#F6F3EC]">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FCFBF9] border border-[rgba(28,25,23,0.07)] mb-4 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E05A47]" />
            <span className="font-mono text-xs font-semibold tracking-wider text-[#E05A47] uppercase">
              DYNAMIC REBALANCING
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-display font-bold text-[#1C1917] tracking-tight leading-tight">
            Life changes.
            <br />
            <span className="font-serif italic font-normal text-[#E05A47]">
              Your plan should too.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#57534E] mt-5 max-w-xl mx-auto leading-relaxed">
            Traditional fitness apps make you feel guilty when meetings run late.
            SATAT detects real-world disruptions and quietly recalculates so your weekly momentum stays unbroken.
          </p>
        </div>

        {/* Interactive Adaptation Simulation Container */}
        <div className="max-w-4xl mx-auto">
          {/* Toggle Control */}
          <div className="flex justify-center mb-8">
            <div className="p-1.5 rounded-full bg-[#FCFBF9] border border-[rgba(28,25,23,0.08)] shadow-xs flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAdapted(false)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  !adapted
                    ? "bg-[#EFECE4] text-[#1C1917] shadow-xs"
                    : "text-[#8C857B] hover:text-[#1C1917]"
                }`}
              >
                1. Disruption Occurs
              </button>
              <button
                type="button"
                onClick={() => setAdapted(true)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  adapted
                    ? "bg-[#E05A47] text-white shadow-xs"
                    : "text-[#8C857B] hover:text-[#1C1917]"
                }`}
              >
                2. SATAT Adapts Quietly ✨
              </button>
            </div>
          </div>

          {/* Morphing Scenario Surface */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Stage 1: The Schedule */}
            <div className="p-6 rounded-[26px] bg-[#FCFBF9] border border-[rgba(28,25,23,0.07)] shadow-[0_14px_34px_-12px_rgba(28,25,23,0.06)] flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#8C857B]">
                  Step 01 · Intent
                </span>
                <h3 className="text-lg font-display font-bold text-[#1C1917] mt-1 mb-2">
                  Planned Session
                </h3>
                <div className="p-4 rounded-xl bg-[#EFECE4] border border-[rgba(28,25,23,0.06)] space-y-1.5 text-xs">
                  <div className="font-semibold text-[#1C1917]">Upper Body A · 45 min</div>
                  <div className="text-[#57534E]">Scheduled for 18:30</div>
                  <div className="text-[#8C857B]">Target: 3 compound lifts + 2 stability sets</div>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-[rgba(28,25,23,0.06)] text-[11px] font-mono text-[#8C857B]">
                Baseline cadence target
              </div>
            </div>

            {/* Stage 2: Reality */}
            <div className="p-6 rounded-[26px] bg-[#FCFBF9] border border-[rgba(28,25,23,0.07)] shadow-[0_14px_34px_-12px_rgba(28,25,23,0.06)] flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#D97706] font-semibold">
                  Step 02 · Reality
                </span>
                <h3 className="text-lg font-display font-bold text-[#1C1917] mt-1 mb-2">
                  Unplanned Disruption
                </h3>
                <div className="p-4 rounded-xl bg-[#FEF3C7]/40 border border-[#D97706]/20 space-y-1.5 text-xs">
                  <div className="font-semibold text-[#92400E]">Urgent 3-hour team deadline</div>
                  <div className="text-[#57534E]">Workout missed at 18:30</div>
                  <div className="text-[#8C857B]">Mental fatigue high · Sleep window preserved</div>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-[rgba(28,25,23,0.06)] text-[11px] font-mono text-[#D97706] flex items-center justify-between">
                <span>Workout Skipped</span>
                <span>⚡ Real Life</span>
              </div>
            </div>

            {/* Stage 3: Deep Botanical Espresso Active Card */}
            <div
              className={`p-6 rounded-[26px] transition-all duration-300 flex flex-col justify-between ${
                adapted
                  ? "bg-[#191D1A] text-white border border-[#191D1A] shadow-[0_20px_45px_-10px_rgba(25,29,26,0.35)]"
                  : "bg-[#FCFBF9] border border-[rgba(28,25,23,0.07)] opacity-60"
              }`}
            >
              <div>
                <span
                  className={`font-mono text-[10px] uppercase tracking-wider font-semibold ${
                    adapted ? "text-[#E05A47]" : "text-[#8C857B]"
                  }`}
                >
                  Step 03 · Restoration
                </span>
                <h3
                  className={`text-lg font-display font-bold mt-1 mb-2 flex items-center justify-between ${
                    adapted ? "text-[#FCFBF9]" : "text-[#1C1917]"
                  }`}
                >
                  <span>SATAT Dynamic Pivot</span>
                  {adapted && <span className="w-2 h-2 rounded-full bg-[#E05A47] animate-ping" />}
                </h3>

                {adapted ? (
                  <div className="p-4 rounded-xl bg-white/10 border border-white/15 space-y-2 text-xs animate-fade-in">
                    <div className="font-semibold text-[#E05A47] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
                      <span>Tomorrow&apos;s routine rebalanced</span>
                    </div>
                    <div className="text-[#EFECE4]/90 leading-relaxed">
                      Upper Body volume safely merged into Thursday&apos;s pull workout. Tonight&apos;s fueling goal automatically tapered to support sound, restful sleep.
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#EFECE4] text-xs text-[#8C857B]">
                    Toggle &quot;SATAT Adapts Quietly&quot; above to preview automatic rebalancing.
                  </div>
                )}
              </div>

              <div
                className={`mt-5 pt-3 border-t text-[11px] font-mono flex items-center justify-between ${
                  adapted ? "border-white/10 text-[#2D6A4F] font-semibold" : "border-[rgba(28,25,23,0.06)] text-[#8C857B]"
                }`}
              >
                <span className="text-[#40916C]">Streak Protected</span>
                <span className="text-[#FCFBF9]/70 font-normal">Zero Guilt</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
