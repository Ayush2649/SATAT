"use client";

import React from "react";
import HeroProductScene from "./HeroProductScene";

export default function Hero() {
  return (
    <section className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-5 sm:px-6 text-left">
      <div className="max-w-md sm:max-w-lg mx-auto">
        {/* Top Pill */}
        <div className="inline-flex items-center gap-2 bg-[#EFECE4] border border-stone-300/60 rounded-full px-3 py-1 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] shrink-0" />
          <span className="font-mono text-[10px] font-semibold tracking-wider text-[#2D6A4F] uppercase">
            A GENTLER WAY TO STAY CONTINUOUS
          </span>
        </div>

        {/* Headline: Entirely in Instrument Serif, matching Stitch single-line fit on 390px mobile */}
        <h1 className="font-serif font-normal text-[1.95rem] sm:text-5xl leading-[1.12] tracking-tight text-[#1C1917]">
          <span className="block whitespace-nowrap">Your body doesn&apos;t live in</span>
          <span className="block italic text-[#E05A47]">five separate apps.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-[#57534E] mt-3 mb-8 max-w-sm leading-relaxed font-normal">
          Workouts, meals, and daily plans that quietly adjust to real life.
        </p>

        {/* Overlapping Visual Collage */}
        <HeroProductScene />
      </div>
    </section>
  );
}
