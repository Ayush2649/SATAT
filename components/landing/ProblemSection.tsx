"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/lib/useReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const FRAGMENTED_TOOLS = [
  {
    category: "Goal Tracker",
    app: "Isolated Ambition",
    friction: "Targets set without daily training or schedule awareness.",
  },
  {
    category: "Workout App",
    app: "Blind Volume",
    friction: "Demands heavy lifting regardless of last night's 4h sleep.",
  },
  {
    category: "Diet Logger",
    app: "Passive Calorie Counter",
    friction: "Tracks meals without adjusting when workout intensity spikes.",
  },
  {
    category: "Sleep Ring",
    app: "Anxious Telemetry",
    friction: "Tells you you're tired, but offers no plan to recover.",
  },
  {
    category: "To-Do List",
    app: "Disjointed Tasks",
    friction: "Forces errands and life priorities into an unconnected silo.",
  },
];

export default function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  useGSAP(
    () => {
      if (prefersReduced) return;

      // Safe progressive entrance: content is visible by default in CSS.
      // clearProps: "all" guarantees no lingering transform/opacity inline styles.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 90%",
          once: true,
        },
        defaults: { ease: "power2.out" },
      });

      tl.fromTo(
        ".problem-header",
        { opacity: 0.3, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, clearProps: "all" }
      )
        .fromTo(
          ".fragmented-card",
          { opacity: 0.3, y: 14 },
          { opacity: 1, y: 0, stagger: 0.04, duration: 0.5, clearProps: "all" },
          "-=0.2"
        )
        .fromTo(
          ".synthesis-banner",
          { opacity: 0.3, y: 12 },
          { opacity: 1, y: 0, duration: 0.4, clearProps: "all" },
          "-=0.2"
        );
    },
    { scope: sectionRef, dependencies: [prefersReduced] }
  );

  return (
    <section
      ref={sectionRef}
      id="problem"
      aria-label="The Fragmentation Problem"
      className="py-16 sm:py-24 px-5 sm:px-6 border-t border-[var(--border)] bg-[var(--surface-subtle)] relative overflow-hidden"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="problem-header max-w-3xl mx-auto text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] mb-4">
            <span className="type-eyebrow text-[var(--brand)]">
              THE FRAGMENTATION TRAP
            </span>
          </div>

          <h2 className="type-display-l text-[var(--text-primary)]">
            Your life is connected.
            <br />
            <span className="text-[var(--brand)]">Your tools shouldn&apos;t be separate.</span>
          </h2>

          <p className="type-body-lg text-[var(--text-secondary)] mt-4 max-w-xl mx-auto">
            When you train harder, you need more fuel. When your sleep dips, your workout volume should adjust. 
            Yet five different apps keep treating your body like unrelated spreadsheets.
          </p>
        </div>

        {/* Visual Problem Representation: The Disconnected Reality vs SATAT */}
        <div ref={cardsContainerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {FRAGMENTED_TOOLS.map((tool, idx) => (
            <div
              key={tool.category}
              className="fragmented-card p-5 rounded-[20px] bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between transition-all duration-300 hover:border-[var(--brand)] hover:-translate-y-1 hover:shadow-md"
            >
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  0{idx + 1} · {tool.category}
                </span>
                <h3 className="font-semibold text-sm sm:text-base text-[var(--text-primary)] mt-1 mb-2">
                  {tool.app}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {tool.friction}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--error)] font-mono">
                <span>Disconnected</span>
                <span aria-hidden="true">✕</span>
              </div>
            </div>
          ))}
        </div>

        {/* Synthesis Banner */}
        <div className="synthesis-banner mt-8 p-5 sm:p-6 rounded-[24px] bg-[var(--surface)] border border-[var(--brand)]/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand)] shrink-0 animate-pulse" aria-hidden="true" />
            <p className="text-sm sm:text-base font-medium text-[var(--text-primary)]">
              SATAT eliminates the cognitive tax of copying numbers between apps.
            </p>
          </div>
          <a
            href="#system"
            className="type-eyebrow text-[var(--brand)] shrink-0 font-semibold flex items-center gap-1 group py-1"
          >
            <span>One Unified Architecture</span>
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
