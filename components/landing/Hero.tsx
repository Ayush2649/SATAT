"use client";

import React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import HeroProductScene from "./HeroProductScene";

export default function Hero() {
  return (
    <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 px-6 md:px-12 lg:px-16 overflow-hidden w-full max-w-[1440px] xl:max-w-[1600px] mx-auto">
      {/* Centered Editorial Hook & Actions */}
      <div className="max-w-[960px] mx-auto text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFECE4] dark:bg-[#1C221E] border border-stone-300/60 dark:border-white/10 mb-3 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] dark:bg-[#34D399]" />
          <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase text-[#57534E] dark:text-[#9CA39E]">
            A GENTLER WAY TO STAY CONTINUOUS
          </span>
        </div>

        {/* Display Headline */}
        <h1 className="font-serif font-normal text-[38px] sm:text-5xl lg:text-[62px] leading-[1.1] tracking-tight text-[#1C1917] dark:text-[#F4F1EA] mt-3 max-w-none mx-auto text-center">
          <span className="block md:whitespace-nowrap">Your body doesn&apos;t live in</span>{" "}
          <span className="block italic text-[#E05A47]">five separate apps.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-[#57534E] dark:text-[#9CA39E] mt-4 max-w-none md:whitespace-nowrap mx-auto leading-relaxed font-normal">
          Workouts, meals, and daily plans that quietly adjust to real life.
        </p>

        {/* Actions Row (Desktop & Mobile) with Two Distinct Separated Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          {/* Button 1: Start free -> routes to onboarding */}
          <Link
            href="/onboarding"
            className="w-full sm:w-auto min-w-[210px] py-3.5 px-7 rounded-full bg-[#E05A47] hover:bg-[#C94A38] text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Start free</span>
            <span>&rarr;</span>
          </Link>

          {/* Button 2: Sign in with Google with official 4-color logo */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full sm:w-auto min-w-[210px] py-3.5 px-7 rounded-full bg-[#FCFBF9] dark:bg-[#161D19] hover:bg-[#EFECE4] dark:hover:bg-[#1E2722] text-[#1C1917] dark:text-[#F4F1EA] border border-[#1C1917]/15 dark:border-white/15 font-semibold text-sm shadow-sm flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.28-2.09 3.66-5.17 3.66-9.14z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.59H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.41l4.04-3.13z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.59l4.04 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>

      {/* Widescreen Hero Visual Card on Desktop (Expanded to max-w-[1560px] aspect-[16/9] lg:aspect-[21/9]) */}
      <div className="hidden sm:block mt-10 sm:mt-12 w-full max-w-[1440px] xl:max-w-[1560px] mx-auto relative rounded-[32px] overflow-hidden shadow-2xl border border-[#1C1917]/[0.08] dark:border-white/[0.08] aspect-[16/9] lg:aspect-[21/9] max-h-[680px] bg-[#191D1A]">
        {/* Full-bleed atmospheric gym/training photograph */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1600&q=85"
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
        <div className="absolute top-5 right-5 sm:top-7 sm:right-7 -rotate-2 bg-[#191D1A]/90 dark:bg-[#121614]/95 backdrop-blur-md text-white rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium flex items-center gap-2 shadow-2xl border border-white/10 animate-[satatFloatSlow_4.2s_ease-in-out_infinite] hover:scale-105 transition-transform cursor-default">
          <span className="w-2 h-2 rounded-full bg-[#6EE7B7]" />
          <span>
            <strong className="font-semibold text-white">Upper Body</strong>{" "}
            <span className="text-stone-300">moved to 6PM · Sleep was light</span>
          </span>
        </div>

        {/* Bottom-Right Floating Alabaster Meal Card with Physical Delayed Floating Animation */}
        <div className="absolute bottom-5 right-5 sm:bottom-7 sm:right-7 bg-[#FCFBF9] dark:bg-[#141916] rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-[#1C1917]/[0.08] dark:border-white/[0.10] flex items-center gap-3 text-left animate-[satatFloatDelayed_5s_ease-in-out_0.8s_infinite] hover:scale-105 transition-transform cursor-default">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=400&q=80"
            alt="Warm protein oatmeal bowl"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl rounded-l-[92px] object-cover"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E05A47]" />
              <span className="text-xs sm:text-sm font-bold text-[#1C1917] dark:text-[#F4F1EA]">Oatmeal &amp; Whey</span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#57534E] dark:text-[#9CA39E] font-mono mt-0.5">
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
