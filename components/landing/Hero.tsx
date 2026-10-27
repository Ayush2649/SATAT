"use client";

import React from "react";
import HeroProductScene from "./HeroProductScene";

export default function Hero() {
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