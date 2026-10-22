"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/lib/useReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export default function ProgressSection() {
  const WEEKS = [
    { label: "W1", count: 5, target: 5, fill: "w-full bg-[var(--brand)]" },
    { label: "W2", count: 4, target: 5, fill: "w-4/5 bg-[var(--brand)]" },
    { label: "W3", count: 5, target: 5, fill: "w-full bg-[var(--brand)]" },
    { label: "W4", count: 5, target: 5, fill: "w-full bg-[var(--brand)]" },
  ];

  const sectionRef = useRef<HTMLElement>(null);
  const ringRef = useRef<SVGPathElement>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
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
        ".progress-header",
        { opacity: 0.3, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, clearProps: "all" }
      ).fromTo(
        cardContainerRef.current,
        { opacity: 0.3, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, clearProps: "all" },
        "-=0.2"
      );

      // Consistency Ring fill animation
      if (ringRef.current) {
        gsap.fromTo(
          ringRef.current,
          { strokeDashoffset: 100 },
          {
            strokeDashoffset: 0,
            duration: 1.3,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      // Weekly Cadence bars stagger expand
      const bars = gsap.utils.toArray<HTMLElement>(".cadence-bar-fill");
      gsap.fromTo(
        bars,
        { scaleX: 0.2 },
        {
          scaleX: 1,
          transformOrigin: "left center",
          stagger: 0.08,
          duration: 0.6,
          ease: "power3.out",
          clearProps: "scaleX",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            once: true,
          },
        }
      );
    },
    { scope: sectionRef, dependencies: [prefersReduced] }
  );

  return (
    <section
      ref={sectionRef}
      id="progress"
      aria-label="Visible Progress"
      className="py-16 sm:py-24 px-5 sm:px-6 border-t border-[var(--border)] bg-[var(--surface-subtle)] relative overflow-hidden"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="progress-header max-w-3xl mx-auto text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] mb-4">
            <span className="type-eyebrow text-[var(--brand)]">
              MOMENTUM VISUALIZATION
            </span>
          </div>

          <h2 className="type-display-l text-[var(--text-primary)]">
            Consistency becomes visible.
          </h2>

          <p className="type-body-lg text-[var(--text-secondary)] mt-3 max-w-xl mx-auto font-medium">
            Not perfection. Progress.
          </p>

          <p className="type-body text-[var(--text-muted)] mt-2 max-w-md mx-auto text-sm">
            Small, compounding habits captured with quiet precision. No noisy badges or gamified fireworks.
          </p>
        </div>

        {/* Progress Visualization Card — Expansive full-width layout eliminating dead space */}
        <div
          ref={cardContainerRef}
          className="w-full max-w-5xl mx-auto p-6 sm:p-8 lg:p-10 rounded-[28px] sm:rounded-[36px] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)]"
        >
          {/* Telemetry Header Strip */}
          <div className="flex flex-wrap items-center justify-between pb-5 mb-6 sm:mb-8 border-b border-[var(--border-subtle)] gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" aria-hidden="true" />
              <span className="font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                Telemetry Log · Rolling 28-Day Window
              </span>
            </div>
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" aria-hidden="true" />
              <span className="text-[var(--success)] font-medium">Trajectory On Track</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center">
            {/* Visual 1: Consistency Ring */}
            <div className="flex flex-col items-center text-center p-3 sm:p-4">
              <div
                className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center mb-4"
                role="img"
                aria-label="87% rolling 28-day adherence score"
              >
                <svg className="w-32 h-32 sm:w-36 sm:h-36 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                  <path
                    className="text-[var(--border-subtle)]"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    ref={ringRef}
                    className="text-[var(--brand)]"
                    strokeDasharray="87, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold font-mono text-[var(--text-primary)]">
                    87%
                  </span>
                  <span className="text-[11px] uppercase font-mono text-[var(--text-muted)] font-medium">
                    Score
                  </span>
                </div>
              </div>
              <h3 className="font-semibold text-base text-[var(--text-primary)]">
                Rolling 28-Day Adherence
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-[200px]">
                Reflects planned vs completed consistency.
              </p>
            </div>

            {/* Visual 2: Weekly Cadence */}
            <div className="cadence-bars-container space-y-4 p-3 sm:p-4 md:border-x md:border-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-[var(--text-primary)]">
                  Weekly Habit Cadence
                </span>
                <span className="font-mono text-xs text-[var(--brand)] font-semibold">
                  19 / 20 target
                </span>
              </div>

              <div className="space-y-3">
                {WEEKS.map((w) => (
                  <div key={w.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs text-[var(--text-muted)] font-mono">
                      <span className="font-semibold text-[var(--text-primary)]">{w.label}</span>
                      <span>{w.count} / {w.target} sessions</span>
                    </div>
                    <div className="w-full bg-[var(--surface-subtle)] h-2 rounded-full overflow-hidden">
                      <div className={`cadence-bar-fill h-full rounded-full ${w.fill}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual 3: Compounding Outcome */}
            <div className="p-3 sm:p-4 space-y-4">
              <div className="progress-stat-card p-4 rounded-2xl bg-[var(--brand-subtle)] border border-[var(--brand)]/15 transition-all hover:shadow-xs">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--brand)] font-semibold">
                  Trajectory Synthesis
                </div>
                <div className="text-2xl font-bold text-[var(--text-primary)] mt-1 font-mono">
                  +12.4%
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">
                  Compound strength capacity over 60 days
                </div>
              </div>

              <div className="progress-stat-card p-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] transition-all hover:shadow-xs">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  Active Momentum
                </div>
                <div className="text-xl font-bold text-[var(--text-primary)] mt-0.5">
                  24 Unbroken Days
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">
                  Zero skipped adaptation cycles
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Metric Anchors — Ties the dashboard into a cohesive OS telemetry surface */}
          <div className="mt-8 pt-5 border-t border-[var(--border-subtle)] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2 rounded-xl bg-[var(--surface-subtle)]/50">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Adherence</div>
              <div className="text-sm font-bold font-mono text-[var(--text-primary)] mt-0.5">87.4%</div>
            </div>
            <div className="p-2 rounded-xl bg-[var(--surface-subtle)]/50">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Target Met</div>
              <div className="text-sm font-bold font-mono text-[var(--text-primary)] mt-0.5">19 / 20</div>
            </div>
            <div className="p-2 rounded-xl bg-[var(--surface-subtle)]/50">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Active Streak</div>
              <div className="text-sm font-bold font-mono text-[var(--text-primary)] mt-0.5">24 Days</div>
            </div>
            <div className="p-2 rounded-xl bg-[var(--surface-subtle)]/50">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Strength Gain</div>
              <div className="text-sm font-bold font-mono text-[var(--brand)] mt-0.5">+12.4%</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
