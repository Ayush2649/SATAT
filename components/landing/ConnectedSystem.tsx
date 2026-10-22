"use client";

import React, { useState, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/lib/useReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface SystemPhase {
  id: string;
  number: string;
  title: string;
  action: string;
  outcome: string;
  connection: string;
}

const PHASES: SystemPhase[] = [
  {
    id: "goals",
    number: "01",
    title: "Goals",
    action: "Direction without anxiety",
    outcome: "Clear body composition, strength, and life milestones.",
    connection: "Feeds your weekly routines",
  },
  {
    id: "routines",
    number: "02",
    title: "Routines",
    action: "Habits that fit reality",
    outcome: "Mobility, hydration, and daily timeblocks that protect momentum.",
    connection: "Prepares your training window",
  },
  {
    id: "training",
    number: "03",
    title: "Training",
    action: "Progressive, structured work",
    outcome: "Compound lift telemetry, RPE tracking, and automatic volume curves.",
    connection: "Signals nutrition caloric demand",
  },
  {
    id: "nutrition",
    number: "04",
    title: "Nutrition",
    action: "Deterministic fuel matching",
    outcome: "Protein targets and calorie balances calculated against real expenditure.",
    connection: "Determines tonight's recovery quality",
  },
  {
    id: "recovery",
    number: "05",
    title: "Recovery",
    action: "Restitution of baseline",
    outcome: "Sleep duration, resting heart rate, and fatigue monitoring.",
    connection: "Synthesizes trajectory updates",
  },
  {
    id: "progress",
    number: "06",
    title: "Progress",
    action: "Continuous upward spiral",
    outcome: "Consistency streaks, weekly capacity, and adaptive baseline adjustments.",
    connection: "Refines tomorrow's starting plan",
  },
];

export default function ConnectedSystem() {
  const [activePhase, setActivePhase] = useState<string>("training");
  const sectionRef = useRef<HTMLElement>(null);
  const cardsGridRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  useGSAP(
    () => {
      if (prefersReduced) return;

      // Safe progressive entrance: content is visible by default in CSS.
      // Animation enhances the entrance with clearProps: "all" to prevent lingering inline styles.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 90%",
          once: true,
        },
        defaults: { ease: "power2.out" },
      });

      tl.fromTo(
        ".system-header",
        { opacity: 0.3, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, clearProps: "all" }
      )
        .fromTo(
          ".continuity-flow-bar",
          { opacity: 0.3, y: 12 },
          { opacity: 1, y: 0, duration: 0.4, clearProps: "all" },
          "-=0.2"
        )
        .fromTo(
          ".system-phase-card",
          { opacity: 0.3, y: 16 },
          { opacity: 1, y: 0, stagger: 0.04, duration: 0.5, clearProps: "all" },
          "-=0.2"
        );
    },
    { scope: sectionRef, dependencies: [prefersReduced] }
  );

  const handleKeyDown = (e: React.KeyboardEvent, phaseId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setActivePhase(phaseId);
    }
  };

  return (
    <section
      ref={sectionRef}
      id="system"
      aria-label="One Connected System"
      className="py-16 sm:py-24 px-5 sm:px-6 border-t border-[var(--border)] bg-[var(--background)] relative overflow-hidden"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="system-header max-w-3xl mx-auto text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-subtle)] border border-[var(--border)] mb-4">
            <span className="type-eyebrow text-[var(--brand)]">
              THE UNBROKEN THREAD (सतत)
            </span>
          </div>

          <h2 className="type-display-l text-[var(--text-primary)]">
            Everything works better
            <br />
            <span className="text-[var(--brand)]">when it works together.</span>
          </h2>

          <p className="type-body-lg text-[var(--text-secondary)] mt-4 max-w-xl mx-auto">
            Instead of managing five separate silos, SATAT connects the complete cycle of human improvement 
            into a self-reinforcing continuous loop.
          </p>
        </div>

        {/* Continuity Flow Visualization Bar — Positioned directly above cards for continuous visual connection */}
        <div
          role="navigation"
          aria-label="System loop navigation"
          className="continuity-flow-bar mb-8 p-3.5 sm:p-4 rounded-[20px] bg-[var(--surface)] border border-[var(--border)] flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-mono text-[var(--text-secondary)] shadow-xs"
        >
          {PHASES.map((p, idx) => (
            <React.Fragment key={p.id}>
              <button
                type="button"
                onClick={() => setActivePhase(p.id)}
                className={`cursor-pointer px-3.5 py-1.5 rounded-full transition-all duration-200 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] ${
                  activePhase === p.id
                    ? "bg-[var(--brand)] text-white font-bold shadow-xs scale-105"
                    : "hover:bg-[var(--surface-subtle)] text-[var(--text-primary)]"
                }`}
              >
                {p.title}
              </button>
              {idx < PHASES.length - 1 && (
                <span className="text-[var(--brand)] select-none" aria-hidden="true">→</span>
              )}
            </React.Fragment>
          ))}
          <span className="text-[var(--brand)] select-none font-semibold ml-1" aria-label="Cycle repeats continuously">
            ↺ repeat
          </span>
        </div>

        {/* 6 Connected Phases Grid */}
        <div
          ref={cardsGridRef}
          role="region"
          aria-label="Interactive System Phases"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {PHASES.map((phase) => {
            const isActive = activePhase === phase.id;

            return (
              <div
                key={phase.id}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                onClick={() => setActivePhase(phase.id)}
                onKeyDown={(e) => handleKeyDown(e, phase.id)}
                className={`system-phase-card group p-6 rounded-[24px] bg-[var(--surface)] border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] ${
                  isActive
                    ? "border-[var(--brand)] shadow-[var(--shadow-md)] ring-1 ring-[var(--brand)] bg-[var(--surface-elevated)]"
                    : "border-[var(--border)] shadow-xs hover:border-[var(--border-strong)]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--surface-subtle)] text-[var(--brand)] transition-colors group-hover:bg-[var(--brand-subtle)]">
                      {phase.number}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--text-muted)] group-hover:text-[var(--brand)] transition-colors">
                      {phase.action}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
                    {phase.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    {phase.outcome}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)] font-mono text-[11px] group-hover:text-[var(--brand)] transition-colors">
                    → {phase.connection}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      isActive ? "bg-[var(--brand)] scale-125" : "bg-[var(--border-strong)] group-hover:bg-[var(--brand)]"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
