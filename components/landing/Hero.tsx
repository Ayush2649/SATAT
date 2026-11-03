"use client";

import React from "react";
import { signIn } from "next-auth/react";
import HeroProductScene from "./HeroProductScene";

export default function Hero() {
  return (
    <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 px-6 md:px-12 lg:px-16 overflow-hidden w-full max-w-[1440px] xl:max-w-[1600px] mx-auto">
      {/* Centered Editorial Hook & Actions */}
      <div className="max-w-[960px] mx-auto text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFECE4] border border-stone-300/60 mb-3 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
          <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase text-[#57534E]">
            A GENTLER WAY TO STAY CONTINUOUS
          </span>
        </div>

        {/* Display Headline */}
        <h1 className="font-serif font-normal text-4xl sm:text-5xl lg:text-[62px] leading-[1.08] tracking-tight text-[#1C1917] mt-3 max-w-[720px] mx-auto">
          <span>Your body doesn&apos;t live in </span>
          <span className="italic text-[#E05A47]">five separate apps.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-[#57534E] mt-4 max-w-[480px] mx-auto leading-relaxed font-normal">
          Workouts, meals, and daily plans that quietly adjust to real life.
        </p>

        {/* Actions Row (Desktop & Mobile) with Large & Prominent CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full px-7 py-3.5 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all inline-flex items-center justify-center gap-2 cursor-pointer min-h-[44px] hover:scale-105"
          >
            <span>Start free</span>
            <span>&rarr;</span>
          </button>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="bg-[#FCFBF9] hover:bg-[#EFECE4] text-[#191D1A] border border-[#1C1917]/10 rounded-full px-7 py-3.5 text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all inline-flex items-center justify-center cursor-pointer min-h-[44px]"
          >
            Sign in with Google
          </button>
        </div>
      </div>

      {/* Widescreen Hero Visual Card on Desktop (Expanded to max-w-[1560px] aspect-[16/9] lg:aspect-[21/9]) */}
      <div className="hidden sm:block mt-10 sm:mt-12 w-full max-w-[1440px] xl:max-w-[1560px] mx-auto relative rounded-[32px] overflow-hidden shadow-2xl border border-[#1C1917]/[0.08] aspect-[16/9] lg:aspect-[21/9] max-h-[680px] bg-[#191D1A]">
        {/* Full-bleed atmospheric gym/training photograph */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1600&q=85"
          alt="Upper body dumbbell strength training session"
          className="w-full h-full object-cover object-center contrast-[1.03]"
        />
        {/* Subtle editorial vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(25,29,26,0.15) 0%, transparent 40%, rgba(25,29,26,0.45) 100%)",
          }}
        />

        {/* Top-Right Floating Dark Pill with Physical Floating Animation */}
        <div className="absolute top-5 right-5 sm:top-7 sm:right-7 -rotate-2 bg-[#191D1A]/90 backdrop-blur-md text-white rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium flex items-center gap-2 shadow-2xl border border-white/10 animate-[satatFloatSlow_4.2s_ease-in-out_infinite] hover:scale-105 transition-transform cursor-default">
          <span className="w-2 h-2 rounded-full bg-[#6EE7B7]" />
          <span>
            <strong className="font-semibold text-white">Upper Body</strong>{" "}
            <span className="text-stone-300">moved to 6PM · Sleep was light</span>
          </span>
        </div>

        {/* Bottom-Right Floating Alabaster Meal Card with Physical Delayed Floating Animation */}
        <div className="absolute bottom-5 right-5 sm:bottom-7 sm:right-7 bg-[#FCFBF9] rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-[#1C1917]/[0.08] flex items-center gap-3 text-left animate-[satatFloatDelayed_5s_ease-in-out_0.8s_infinite] hover:scale-105 transition-transform cursor-default">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=400&q=80"
            alt="Warm protein oatmeal bowl"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl rounded-l-[92px] object-cover"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E05A47]" />
              <span className="text-xs sm:text-sm font-bold text-[#1C1917]">Oatmeal &amp; Whey</span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#57534E] font-mono mt-0.5">
              420 kcal · 34g Protein
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Fallback: Overlapping Physical Collage Scene */}
      <div className="sm:hidden mt-4">
        <HeroProductScene />
      </div>
    </section>
  );
}
