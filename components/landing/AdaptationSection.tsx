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
    <section
      ref={sectionRef}
      id="adaptation"
      aria-label="Dynamic Adaptation"
      className="py-16 sm:py-24 px-5 sm:px-6 border-t border-[var(--border)] bg-[var(--surface-subtle)] relative overflow-hidden"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="adaptation-header max-w-3xl mx-auto text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] mb-4">
            <span className="type-eyebrow text-[var(--brand)]">
              DYNAMIC REBALANCING
            </span>
          </div>

          <h2 className="type-display-l text-[var(--text-primary)]">
            Life changes.
            <br />
            <span className="text-[var(--brand)]">Your plan should too.</span>
          </h2>

          <p className="type-body-lg text-[var(--text-secondary)] mt-4 max-w-xl mx-auto">
            Traditional fitness apps make you feel guilty when life gets in the way. 
            SATAT detects disruptions and quietly recalculates so your weekly momentum stays unbroken.
          </p>
        </div>

        {/* Interactive Adaptation Simulation Container */}
        <div className="max-w-4xl mx-auto">
          {/* Toggle Control */}
          <div className="adaptation-toggle flex justify-center mb-8">
            <div
              role="group"
              aria-label="Adaptation scenario selector"
              className="p-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-xs flex items-center gap-2"
            >
              <button
                type="button"
                aria-pressed={!adapted}
                onClick={() => handleToggle(false)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] ${
                  !adapted
                    ? "bg-[var(--surface-subtle)] text-[var(--text-primary)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                1. Disruption Occurs
              </button>
              <button
                type="button"
                aria-pressed={adapted}
                onClick={() => handleToggle(true)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] ${
                  adapted
                    ? "bg-[var(--brand)] text-white shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                2. SATAT Adapts in Real Time ✨
              </button>
            </div>
          </div>

          {/* Morphing Scenario Surface */}
          <div ref={stagesRef} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Stage 1: The Original Plan */}
            <div className="adaptation-stage p-6 rounded-[24px] bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between transition-all duration-300 hover:shadow-md">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  Step 01 · The Schedule
                </span>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mt-1 mb-2">
                  Planned Session
                </h3>
                <div className="p-3.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-1.5 text-xs">
                  <div className="font-semibold text-[var(--text-primary)]">Upper Body A · 45 min</div>
                  <div className="text-[var(--text-secondary)]">Scheduled for 18:30</div>
                  <div className="text-[var(--text-muted)]">Target: 3 compounds + 2 accessories</div>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)]">
                Initial baseline target
              </div>
            </div>

            {/* Stage 2: The Reality */}
            <div className="adaptation-stage p-6 rounded-[24px] bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between transition-all duration-300 hover:shadow-md">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--warning)]">
                  Step 02 · Reality
                </span>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mt-1 mb-2">
                  Unplanned Disruption
                </h3>
                <div className="p-3.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-1.5 text-xs">
                  <div className="font-semibold text-[var(--warning)]">Urgent 3-hour client sprint</div>
                  <div className="text-[var(--text-secondary)]">Workout missed at 18:30</div>
                  <div className="text-[var(--text-muted)]">Energy drained · Sleep window preserved</div>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--warning)] flex items-center justify-between">
                <span>Workout Skipped</span>
                <span>⚡ Disruption</span>
              </div>
            </div>

            {/* Stage 3: The System Adaptation */}
            <div
              ref={step3Ref}
              className={`adaptation-stage p-6 rounded-[24px] border transition-all duration-300 flex flex-col justify-between ${
                adapted
                  ? "bg-[var(--surface)] border-[var(--brand)] shadow-[var(--shadow-md)] ring-1 ring-[var(--brand)]"
                  : "bg-[var(--surface-subtle)] border-[var(--border)] opacity-60"
              }`}
            >
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--brand)] font-semibold">
                  Step 03 · Autonomous Response
                </span>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mt-1 mb-2 flex items-center justify-between">
                  <span>SATAT Dynamic Pivot</span>
                  {adapted && (
                    <span
                      aria-hidden="true"
                      className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse"
                    />
                  )}
                </h3>

                {adapted ? (
                  <div className="p-3.5 rounded-xl bg-[var(--brand-subtle)] border border-[var(--brand)]/20 space-y-2 text-xs animate-fade-in">
                    <div className="font-semibold text-[var(--brand)]">
                      ✓ Tomorrow&apos;s routine rebalanced
                    </div>
                    <div className="text-[var(--text-primary)] leading-relaxed">
                      Upper Body volume safely merged into Thursday&apos;s pull workout. Tonight&apos;s calorie goal tapered by 350 kcal to protect recovery.
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-1.5 text-xs animate-fade-in">
                    <div className="font-semibold text-[var(--text-muted)]">
                      ⚡ Disruption Detected · Rebalance Ready
                    </div>
                    <div className="text-[var(--text-secondary)] leading-relaxed">
                      Missed 45m Upper Body session. Traditional apps mark this day as failed and break your streak. SATAT recalculates to protect momentum.
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--brand)] flex items-center justify-between">
                <span>Streak Protected</span>
                <span>Zero Guilt</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
