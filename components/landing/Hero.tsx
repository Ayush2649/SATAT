"use client";

import React, { useRef } from "react";
import { signIn } from "next-auth/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import HeroProductScene from "./HeroProductScene";
import { useReducedMotion } from "@/lib/useReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();

  useGSAP(
    () => {
      if (prefersReduced) return;

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.fromTo(
        ".hero-badge",
        { opacity: 0.3, y: 12, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, clearProps: "all" }
      )
        .fromTo(
          ".hero-headline",
          { opacity: 0.3, y: 18 },
          { opacity: 1, y: 0, duration: 0.6, clearProps: "all" },
          "-=0.3"
        )
        .fromTo(
          ".hero-subcopy",
          { opacity: 0.3, y: 14 },
          { opacity: 1, y: 0, duration: 0.5, clearProps: "all" },
          "-=0.3"
        )
        .fromTo(
          ".hero-cta",
          { opacity: 0.3, y: 12 },
          { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, clearProps: "all" },
          "-=0.3"
        )
        .fromTo(
          ".hero-reassurance",
          { opacity: 0.3, y: 8 },
          { opacity: 1, y: 0, stagger: 0.05, duration: 0.4, clearProps: "all" },
          "-=0.2"
        );
    },
    { scope: containerRef, dependencies: [prefersReduced] }
  );

  return (
    <section
      ref={containerRef}
      id="hero"
      aria-label="SATAT Overview"
      className="relative pt-24 sm:pt-32 pb-14 sm:pb-20 px-5 sm:px-6 overflow-hidden"
    >
      <div className="max-w-5xl mx-auto text-center">
        {/* Eyebrow Label */}
        <div className="hero-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--brand-subtle)] border border-[var(--border)] mb-6 sm:mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" aria-hidden="true" />
          <span className="type-eyebrow text-[var(--brand)] tracking-[0.16em]">
            YOUR LIFE. ONE SYSTEM.
          </span>
        </div>

        {/* Editorial Headline */}
        <h1 className="hero-headline type-display-xl text-[var(--text-primary)] mb-6 sm:mb-8 font-sans">
          Progress,
          <br />
          <span className="text-[var(--brand)]">made continuous.</span>
        </h1>

        {/* Supporting Copy */}
        <p className="hero-subcopy type-body-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-normal">
          Satat connects your goals, routines, training, nutrition and progress into one intelligent system — so you can build consistency and keep becoming better.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="hero-cta w-full sm:w-auto btn-primary rounded-full px-8 py-4 text-base font-medium shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Start building consistency</span>
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </button>

          <a
            href="#problem"
            className="hero-cta w-full sm:w-auto btn-secondary rounded-full px-7 py-4 text-base font-medium transition-all flex items-center justify-center gap-2"
          >
            <span>See how it works</span>
            <span aria-hidden="true" className="text-xs text-[var(--text-muted)]">↓</span>
          </a>
        </div>

        {/* Minimal Reassurance */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--text-muted)]">
          <span className="hero-reassurance flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            No fragmented apps
          </span>
          <span className="hero-reassurance w-1 h-1 rounded-full bg-[var(--border-strong)]" aria-hidden="true" />
          <span className="hero-reassurance flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Adaptive daily guidance
          </span>
          <span className="hero-reassurance w-1 h-1 rounded-full bg-[var(--border-strong)]" aria-hidden="true" />
          <span className="hero-reassurance flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Free to use · No credit card
          </span>
        </div>

        {/* Polished Product Visualization */}
        <HeroProductScene />
      </div>
    </section>
  );
}
