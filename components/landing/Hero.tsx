"use client";

import React from "react";
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
    <section className="relative pt-24 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-md mx-auto text-left">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFECE4] border border-stone-300/60 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
          <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.14em] uppercase text-[#2D6A4F]">
            A GENTLER WAY TO STAY CONTINUOUS
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-serif font-normal text-[1.95rem] sm:text-5xl leading-[1.12] tracking-tight text-[#1C1917]">
          <span className="block whitespace-nowrap">Your body doesn&apos;t live in</span>
          <span className="block italic text-[#E05A47]">five separate apps.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-[#57534E] mt-3 mb-6 max-w-sm leading-relaxed">
          Workouts, meals, and daily plans that quietly adjust to real life.
        </p>

        {/* Product Collage */}
        <HeroProductScene />
      </div>
    </section>
  );
}