"use client";

import React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import HeroProductScene from "../HeroProductScene";

export default function MobileHero() {
  return (
    <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 px-6 lg:px-12 overflow-hidden">
      <div className="max-w-md lg:max-w-[1280px] mx-auto lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center text-left">
        {/* Left 6 Columns on Desktop */}
        <div className="lg:col-span-6">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFECE4] dark:bg-[#1C221E] border border-stone-300/60 dark:border-white/10 mb-5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] dark:bg-[#34D399]" />
            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.14em] uppercase text-[#2D6A4F] dark:text-[#6EE7B7]">
              A GENTLER WAY TO STAY CONTINUOUS
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-serif font-normal text-[38px] sm:text-5xl lg:text-[62px] leading-[1.1] tracking-tight text-[#1C1917] dark:text-[#F4F1EA]">
            <span className="block sm:inline md:whitespace-nowrap">Your body </span>
            <span className="block sm:inline md:whitespace-nowrap">doesn&apos;t live in</span>{" "}
            <span className="block italic text-[#E05A47]">five separate apps.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-[#57534E] dark:text-[#9CA39E] mt-4 mb-8 max-w-lg md:whitespace-nowrap leading-relaxed font-normal">
            Workouts, meals, and daily plans that quietly adjust to real life.
          </p>

          {/* Action Row with Separated Start Free and Google OAuth Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/onboarding"
              className="bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full px-7 py-3.5 text-sm font-semibold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start free</span>
              <span>&rarr;</span>
            </Link>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="bg-[#FCFBF9] dark:bg-[#161D19] hover:bg-[#EFECE4] dark:hover:bg-[#1E2722] text-[#1C1917] dark:text-[#F4F1EA] border border-[#1C1917]/15 dark:border-white/15 rounded-full px-6 py-3.5 text-sm font-semibold shadow-2xs transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-95"
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

          {/* Trust points */}
          <p className="text-xs text-[#8C857B] dark:text-[#9CA39E] mt-5 font-medium">
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
