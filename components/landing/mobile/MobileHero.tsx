"use client";

import React from "react";
import { signIn } from "next-auth/react";
import HeroProductScene from "../HeroProductScene";

export default function MobileHero() {
  return (
    <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 px-6 lg:px-12 overflow-hidden">
      <div className="max-w-md lg:max-w-[1280px] mx-auto lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center text-left">
        {/* Left 6 Columns on Desktop */}
        <div className="lg:col-span-6">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFECE4] border border-stone-300/60 mb-5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.14em] uppercase text-[#2D6A4F]">
              A GENTLER WAY TO STAY CONTINUOUS
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-serif font-normal text-4xl sm:text-5xl lg:text-[62px] leading-[1.06] tracking-tight text-[#1C1917]">
            <span className="block">Your body doesn&apos;t live in</span>
            <span className="block italic text-[#E05A47]">five separate apps.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-[#57534E] mt-4 mb-8 max-w-lg leading-relaxed font-normal">
            Workouts, meals, and daily plans that quietly adjust to real life.
          </p>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full px-7 py-3.5 text-sm font-semibold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start free</span>
              <span>&rarr;</span>
            </button>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="bg-white hover:bg-[#EFECE4] text-[#191D1A] border border-[#1C1917]/10 rounded-full px-6 py-3.5 text-sm font-semibold shadow-2xs transition-all flex items-center justify-center cursor-pointer"
            >
              Sign in with Google
            </button>
          </div>

          {/* Trust points */}
          <p className="text-xs text-[#8C857B] mt-5 font-medium">
            &bull; Free core rhythm &bull; Private &amp; secure &bull; Zero credit card required
          </p>
        </div>

        {/* Right 6 Columns on Desktop: Product Collage */}
        <div className="lg:col-span-6 mt-8 lg:mt-0">
          <HeroProductScene />
        </div>
      </div>
    </section>
  );
}

