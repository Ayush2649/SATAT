"use client";

import React, { useState, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { OrbitMark } from "@/components/orbit/OrbitMark";
import { useReducedMotion } from "@/lib/useReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export default function OrbitSection() {
  const [orbitState, setOrbitState] = useState<"idle" | "adjusted" | "deferred">("idle");
  const [loading, setLoading] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const dialogueRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  useGSAP(
    () => {
      if (prefersReduced) return;

      // Safe progressive entrance: content is visible by default in CSS.
      // clearProps: "all" ensures clean DOM for interactive state changes.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 90%",
          once: true,
        },
        defaults: { ease: "power2.out" },
      });

      tl.fromTo(
        ".orbit-header",
        { opacity: 0.3, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, clearProps: "all" }
      ).fromTo(
        cardRef.current,
        { opacity: 0.3, y: 16, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, clearProps: "all" },
        "-=0.2"
      );
    },
    { scope: sectionRef, dependencies: [prefersReduced] }
  );

  const handleAction = (type: "adjust" | "defer") => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOrbitState(type === "adjust" ? "adjusted" : "deferred");
    }, 400);
  };

  return (
    <section
      ref={sectionRef}
      id="orbit"
      aria-label="Orbit Contextual Intelligence"
      className="py-16 sm:py-24 px-5 sm:px-6 border-t border-[var(--border)] bg-[var(--background)] relative overflow-hidden"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="orbit-header max-w-3xl mx-auto text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-subtle)] border border-[var(--border)] mb-4">
            <span className="type-eyebrow text-[var(--brand)]">
              CONTEXT-AWARE INTELLIGENCE
            </span>
          </div>

          <h2 className="type-display-l text-[var(--text-primary)]">
            Intelligence that understands
            <br />
            <span className="text-[var(--brand)]">your context.</span>
          </h2>

          <p className="type-body-lg text-[var(--text-secondary)] mt-4 max-w-xl mx-auto">
            Orbit is not a chat box waiting for questions. It is a quiet presence that connects the dots 
            between your workouts, nutrition, and recovery — whispering adjustments only when they matter.
          </p>
        </div>

        {/* Simplified, Calm Orbit Marketing Card */}
        <div className="max-w-xl mx-auto relative">
          {/* Subtle Ambient Radial Glow */}
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[320px] rounded-full pointer-events-none opacity-20 blur-3xl"
            style={{
              background: "radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)",
            }}
          />

          <div
            ref={cardRef}
            aria-live="polite"
            className="relative z-10 rounded-[28px] sm:rounded-[36px] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-md)] p-7 sm:p-11 transition-all"
          >
            {/* Minimal Brand Anchor */}
            <div className="flex items-center gap-2.5 mb-7">
              <div className="w-8 h-8 rounded-full bg-[var(--brand-subtle)] border border-[var(--border)] flex items-center justify-center text-[var(--brand)]">
                <OrbitMark size={18} state={loading ? "thinking" : "idle"} />
              </div>
              <span className="font-semibold text-sm tracking-tight text-[var(--text-primary)]">
                Orbit
              </span>
            </div>

            {/* Core Narrative / Dialogue */}
            {orbitState === "idle" && (
              <div ref={dialogueRef} className="space-y-7 animate-fade-in">
                <div className="space-y-3 sm:space-y-4">
                  <p className="orbit-line text-lg sm:text-xl font-medium text-[var(--text-primary)] leading-snug">
                    &ldquo;You trained harder than usual today.&rdquo;
                  </p>
                  <p className="orbit-line text-lg sm:text-xl font-medium text-[var(--text-primary)] leading-snug">
                    &ldquo;You&apos;re 38g short on protein.&rdquo;
                  </p>
                  <p className="orbit-line text-lg sm:text-xl font-semibold text-[var(--brand)] leading-snug">
                    &ldquo;Want me to adjust dinner?&rdquo;
                  </p>
                </div>

                {/* Clear Primary Action & Subtle Secondary Link */}
                <div className="orbit-line flex flex-col sm:flex-row items-center gap-4 pt-2">
                  <button
                    type="button"
                    disabled={loading}
                    aria-busy={loading}
                    onClick={() => handleAction("adjust")}
                    className="w-full sm:w-auto btn-primary rounded-full px-7 py-3.5 text-sm font-medium shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
                  >
                    <span>{loading ? "Rebalancing..." : "Adjust dinner"}</span>
                    {!loading && <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>}
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleAction("defer")}
                    className="text-xs sm:text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-3 py-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] rounded-lg"
                  >
                    Not now
                  </button>
                </div>
              </div>
            )}

            {/* Adjusted State */}
            {orbitState === "adjusted" && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-5 rounded-2xl bg-[var(--brand-subtle)] border border-[var(--brand)]/20 space-y-2">
                  <p className="text-base sm:text-lg font-medium text-[var(--text-primary)] leading-relaxed">
                    Added <strong className="text-[var(--brand)]">Greek yogurt (+28g protein)</strong> and <strong className="text-[var(--brand)]">roasted edamame (+10g protein)</strong> to tonight&apos;s plan.
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Target satisfied. Zero manual math required.
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[var(--text-muted)]">Autonomous continuity</span>
                  <button
                    type="button"
                    onClick={() => setOrbitState("idle")}
                    className="text-[var(--brand)] font-medium hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] rounded px-1"
                  >
                    Reset preview ↺
                  </button>
                </div>
              </div>
            )}

            {/* Deferred State */}
            {orbitState === "deferred" && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] space-y-2">
                  <p className="text-base sm:text-lg text-[var(--text-primary)] leading-relaxed">
                    Understood. Your deficit will be distributed across tomorrow morning&apos;s meal so you can rest undisturbed.
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Zero nagging alerts. Autonomy preserved.
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[var(--text-muted)]">Deferred rebalancing</span>
                  <button
                    type="button"
                    onClick={() => setOrbitState("idle")}
                    className="text-[var(--brand)] font-medium hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] rounded px-1"
                  >
                    Reset preview ↺
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
