"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Sparkles, Check } from "lucide-react";

// ============================================================================
// SATAT SNAP — HEALTHIFYSNAP SCROLL INTERACTION CONSTANTS & CONFIGURATION
// (All assumed values documented per Section 0, Rule 4)
// ============================================================================
export const SNAP_CONSTANTS = {
  // Height offset from top of viewport for sticky stage to clear the floating header
  // Assumed: 80px (16px top offset + ~52px pill header height + 12px breathing room)
  HEADER_OFFSET_PX: 80,

  // Total scroll runway multiplier relative to (100svh - HEADER_OFFSET_PX)
  // Assumed: 3.2x so the stage completes 3 steps and releases smoothly into the next section with < 40px gap
  RUNWAY_MULTIPLIER: 3.2,

  // Target mobile phone dimensions (calibrated for 393 x 852 viewport)
  // Assumed: 280px width, 440px height so phone (440px) + gap (16px) + caption (56px) = 512px,
  // perfectly fitting inside (852 - 80 = 772px) available clip height with ~130px margins
  MOBILE_PHONE_WIDTH_PX: 280,
  MOBILE_PHONE_HEIGHT_PX: 440,

  // Scroll Progress Timeline Milestones:
  // 0.00 - 0.20: Stage A -> B (Intro exits up, Phone rises from bottom of clip region)
  // 0.20 - 0.42: Stage B (Step 1 Pinned: Phone centered, Caption 1 holds)
  // 0.42 - 0.58: Stage B -> C (Card 1 rises, Caption 1 & 2 overlap cross-slide)
  // 0.58 - 0.74: Stage C (Step 2 Pinned: Card 1 covers lower half of phone, Caption 2 holds)
  // 0.74 - 0.90: Stage C -> D (Card 2 rises, Card 1 nudges up -34px, Caption 2 & 3 overlap cross-slide)
  // 0.90 - 0.97: Stage D (Step 3 Pinned: Phone + Card 1 + Card 2 stacked, Caption 3 holds)
  // 0.97 - 1.00: Release runway (Sticky unpins smoothly into #orbit with < 40px dead space)
  PROGRESS: {
    PHONE_ENTER_START: 0.02,
    PHONE_ENTER_END: 0.20,
    STEP1_START: 0.20,
    STEP1_END: 0.42,
    CARD1_ENTER_START: 0.42,
    CARD1_ENTER_END: 0.58,
    STEP2_START: 0.58,
    STEP2_END: 0.74,
    CARD2_ENTER_START: 0.74,
    CARD2_ENTER_END: 0.90,
    STEP3_START: 0.90,
    STEP3_END: 0.97,
    RELEASE: 0.97,
  },
} as const;

function clamp(val: number, min = 0, max = 1): number {
  return Math.min(Math.max(val, min), max);
}

function progressSegment(progress: number, start: number, end: number): number {
  return clamp((progress - start) / (end - start));
}

// Ease-out cubic curve for natural physical momentum
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function MealScanShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState<number>(0);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    let rafId: number | null = null;

    const updateScrollProgress = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScroll = rect.height - windowHeight;
      if (totalScroll <= 0) return;

      const currentScroll = -rect.top;
      const rawProgress = currentScroll / totalScroll;
      const clampedProgress = clamp(rawProgress, 0, 1);
      setProgress(clampedProgress);
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        updateScrollProgress();
        rafId = null;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updateScrollProgress();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mediaQuery.removeEventListener("change", handleMediaChange);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  // ── COMPUTED MOTION VALUES (Driven strictly by continuous scroll progress) ──
  // 1. Mobile Intro (Stage A) translation & opacity
  const introExitT = progressSegment(
    progress,
    SNAP_CONSTANTS.PROGRESS.PHONE_ENTER_START,
    SNAP_CONSTANTS.PROGRESS.PHONE_ENTER_END
  );
  const introTranslateY = -introExitT * 80;
  const introOpacity = 1 - introExitT;

  // 2. Phone entry from bottom of clip region (Stage A -> B)
  const phoneEnterT = easeOutCubic(
    progressSegment(
      progress,
      SNAP_CONSTANTS.PROGRESS.PHONE_ENTER_START,
      SNAP_CONSTANTS.PROGRESS.PHONE_ENTER_END
    )
  );
  // Enters from +320px down to 0px
  const phoneTranslateY = (1 - phoneEnterT) * 320;
  const phoneOpacity = progress < 0.02 ? 0 : clamp(phoneEnterT * 1.5, 0, 1);

  // 3. Card 1: Nutrition Breakdown Card (Stage B -> C rise, Stage C -> D upward nudge)
  const card1EnterT = easeOutCubic(
    progressSegment(
      progress,
      SNAP_CONSTANTS.PROGRESS.CARD1_ENTER_START,
      SNAP_CONSTANTS.PROGRESS.CARD1_ENTER_END
    )
  );
  const card1NudgeT = easeOutCubic(
    progressSegment(
      progress,
      SNAP_CONSTANTS.PROGRESS.CARD2_ENTER_START,
      SNAP_CONSTANTS.PROGRESS.CARD2_ENTER_END
    )
  );
  // Rises from +240px to 0px, then nudges up by -34px to clear room for Card 2
  const card1TranslateY = (1 - card1EnterT) * 240 - card1NudgeT * 34;
  const card1Opacity =
    progress < SNAP_CONSTANTS.PROGRESS.CARD1_ENTER_START
      ? 0
      : clamp(
          (progress - SNAP_CONSTANTS.PROGRESS.CARD1_ENTER_START) / 0.06,
          0,
          1
        );

  // 4. Card 2: Orbit Insight Card (Stage C -> D rise)
  const card2EnterT = easeOutCubic(
    progressSegment(
      progress,
      SNAP_CONSTANTS.PROGRESS.CARD2_ENTER_START,
      SNAP_CONSTANTS.PROGRESS.CARD2_ENTER_END
    )
  );
  const card2TranslateY = (1 - card2EnterT) * 180;
  const card2Opacity =
    progress < SNAP_CONSTANTS.PROGRESS.CARD2_ENTER_START
      ? 0
      : clamp(
          (progress - SNAP_CONSTANTS.PROGRESS.CARD2_ENTER_START) / 0.06,
          0,
          1
        );

  // 5. Captions Cross-Slide (Both visible simultaneously during transition)
  // Caption 1: 0.00 to 0.42 holds (1), 0.42 to 0.58 slides up & out
  const cap1ExitT = progressSegment(
    progress,
    SNAP_CONSTANTS.PROGRESS.CARD1_ENTER_START,
    SNAP_CONSTANTS.PROGRESS.CARD1_ENTER_END
  );
  const cap1TranslateY = -cap1ExitT * 100; // 0% -> -100%
  const cap1Opacity = progress < 0.42 ? 1 : 1 - cap1ExitT;

  // Caption 2: enters 0.42 to 0.58, holds 0.58 to 0.74, slides up & out 0.74 to 0.90
  const cap2EnterT = progressSegment(
    progress,
    SNAP_CONSTANTS.PROGRESS.CARD1_ENTER_START,
    SNAP_CONSTANTS.PROGRESS.CARD1_ENTER_END
  );
  const cap2ExitT = progressSegment(
    progress,
    SNAP_CONSTANTS.PROGRESS.CARD2_ENTER_START,
    SNAP_CONSTANTS.PROGRESS.CARD2_ENTER_END
  );
  let cap2TranslateY = 0;
  let cap2Opacity = 0;
  if (progress < 0.42) {
    cap2TranslateY = 100;
    cap2Opacity = 0;
  } else if (progress <= 0.58) {
    cap2TranslateY = (1 - cap2EnterT) * 100; // 100% -> 0%
    cap2Opacity = cap2EnterT;
  } else if (progress <= 0.74) {
    cap2TranslateY = 0;
    cap2Opacity = 1;
  } else if (progress <= 0.9) {
    cap2TranslateY = -cap2ExitT * 100; // 0% -> -100%
    cap2Opacity = 1 - cap2ExitT;
  } else {
    cap2TranslateY = -100;
    cap2Opacity = 0;
  }

  // Caption 3: enters 0.74 to 0.90, holds 0.90 to 1.00
  const cap3EnterT = progressSegment(
    progress,
    SNAP_CONSTANTS.PROGRESS.CARD2_ENTER_START,
    SNAP_CONSTANTS.PROGRESS.CARD2_ENTER_END
  );
  const cap3TranslateY = progress < 0.74 ? 100 : (1 - cap3EnterT) * 100;
  const cap3Opacity = progress < 0.74 ? 0 : cap3EnterT;

  // Reduced motion: static stacked view
  if (reducedMotion) {
    return (
      <section
        id="snap"
        className="w-full max-w-[1360px] mx-auto px-6 py-16 text-center space-y-12"
      >
        <div className="max-w-xl mx-auto text-left">
          <span className="text-sm font-semibold text-[#2D6A4F] dark:text-[#6EE7B7] mb-2 block">
            SatatSnap
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#1C1917] dark:text-[#F4F1EA] leading-tight">
            Track Your Food With Just a Snap
          </h2>
          <p className="text-sm sm:text-base text-[#57534E] dark:text-[#9CA39E] mt-3">
            Snap your meal for instant nutritional details and smart, AI-driven
            cadence advice from Orbit.
          </p>
        </div>
        <div className="flex flex-col items-center gap-6">
          <div className="w-[280px] h-[440px] rounded-[40px] border-[8px] border-[#1C1917] dark:border-[#26302B] bg-black overflow-hidden relative shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80"
              alt="Food plate"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="w-[310px] rounded-2xl bg-[#FCFBF9] dark:bg-[#18201C] border border-[#1C1917]/10 dark:border-white/15 p-4 shadow-lg text-left">
            <h4 className="font-bold text-sm text-[#1C1917] dark:text-[#F4F1EA]">
              Rice &amp; Paneer Bowl · 454 Cal
            </h4>
            <div className="text-xs text-[#57534E] dark:text-[#9CA39E] mt-2 space-y-1">
              <div>Grilled Paneer · 1 katori · 242 Cal ✓</div>
              <div>Steamed Basmati Rice · 0.5 cup · 159 Cal ✓</div>
              <div>Broccoli &amp; Greens · 0.5 cup · 53 Cal ✓</div>
            </div>
          </div>
          <div className="w-[310px] rounded-2xl bg-[#FCFBF9] dark:bg-[#141C18] border border-[#34D399]/35 p-4 shadow-lg text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D6A4F] dark:text-[#34D399] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Orbit</span>
            </div>
            <p className="text-xs text-[#1C1917] dark:text-[#E6F4ED]">
              Good protein. Your 10:15 PM window is open: add Greek yogurt to
              close the 28g gap.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="snap"
      ref={sectionRef}
      style={{
        // Section height = 100svh + pinned runway (calc(100svh - 80px) * RUNWAY_MULTIPLIER)
        // Releases immediately at progress 1.0 with no dead space
        height: `calc(100svh + (100svh - ${SNAP_CONSTANTS.HEADER_OFFSET_PX}px) * ${SNAP_CONSTANTS.RUNWAY_MULTIPLIER})`,
      }}
      className="relative w-full"
    >
      {/* ── PINNED STAGE (Hard-clipped below floating header, height = 100svh - header offset) ── */}
      <div
        style={{
          top: `${SNAP_CONSTANTS.HEADER_OFFSET_PX}px`,
          height: `calc(100svh - ${SNAP_CONSTANTS.HEADER_OFFSET_PX}px)`,
        }}
        className="sticky w-full overflow-hidden flex flex-col justify-center items-center px-4 sm:px-8 max-w-[1360px] mx-auto"
      >
        {/* ── STAGE A: INTRO (Normal flow entry on mobile, left column on desktop) ── */}
        <div
          style={{
            transform: `translate3d(0, ${introTranslateY}px, 0)`,
            opacity: introOpacity,
            pointerEvents: introOpacity < 0.1 ? "none" : "auto",
          }}
          className={`w-full max-w-[460px] text-left transition-none ${
            progress > 0.25
              ? "hidden lg:block lg:opacity-100 lg:translate-y-0"
              : "block lg:block lg:opacity-100 lg:translate-y-0"
          } ${
            // On desktop, it docks permanently on the left; on mobile, it transitions out
            "lg:absolute lg:left-12 lg:top-1/2 lg:-translate-y-1/2 z-10"
          }`}
        >
          {/* Eyebrow */}
          <span className="text-sm font-semibold text-[#2D6A4F] dark:text-[#6EE7B7] mb-2 block">
            SatatSnap
          </span>

          {/* H2 Headline */}
          <h2 className="font-serif text-3xl sm:text-5xl lg:text-[54px] leading-[1.08] font-bold text-[#1C1917] dark:text-[#F4F1EA]">
            Track Your Food With Just a Snap
          </h2>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[#57534E] dark:text-[#9CA39E] mt-3.5 leading-relaxed font-normal">
            Snap your meal for instant nutritional details and smart, AI-driven cadence advice from Orbit.
          </p>

          {/* Pill CTA Button (rounded rectangle, green border/text, hover effect) */}
          <Link
            href="/onboarding"
            className="mt-6 inline-flex items-center justify-center px-6 py-3 rounded-full border border-[#2D6A4F] dark:border-[#34D399] text-sm font-semibold text-[#2D6A4F] dark:text-[#34D399] bg-[#FCFBF9] dark:bg-[#121714] hover:bg-[#2D6A4F] hover:text-white dark:hover:bg-[#34D399] dark:hover:text-[#0A0D0B] transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            Try Snap with a Photo
          </Link>
        </div>

        {/* ── STAGES B, C, D: PHONE MOCKUP + OVERLAPPING CARDS + CAPTION SWAPPER ── */}
        <div
          style={{
            transform: `translate3d(0, ${phoneTranslateY}px, 0)`,
            opacity: phoneOpacity,
          }}
          className="flex flex-col items-center justify-center relative w-full lg:w-auto lg:ml-auto lg:mr-12 will-change-transform"
        >
          {/* ── PHONE MOCKUP (Horizontally & vertically centered in clip region) ── */}
          <div
            style={{
              width: `${SNAP_CONSTANTS.MOBILE_PHONE_WIDTH_PX}px`,
              height: `${SNAP_CONSTANTS.MOBILE_PHONE_HEIGHT_PX}px`,
            }}
            className="rounded-[40px] sm:rounded-[44px] border-[8px] border-[#1C1917] dark:border-[#26302B] bg-black shadow-[0_24px_64px_rgba(0,0,0,0.55)] relative overflow-hidden flex flex-col justify-between shrink-0"
          >
            {/* Top Dynamic Island / Speaker */}
            <div className="absolute top-2.5 inset-x-0 mx-auto w-20 h-4 bg-black rounded-full z-30" />

            {/* Overhead Food Photo */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80"
                alt="Nutrient-dense meal plate"
                className="w-full h-full object-cover select-none pointer-events-none"
              />
              {/* Subtle top vignette */}
              <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />
            </div>

            {/* Viewfinder Corner Brackets (Only visible during Step 1) */}
            <div
              style={{
                opacity: progress < 0.42 ? 1 : 1 - (progress - 0.42) / 0.1,
              }}
              className="relative z-10 m-5 flex-1 flex flex-col justify-between pointer-events-none transition-opacity"
            >
              <div className="flex justify-between items-start">
                <div className="w-6 h-6 border-t-2 border-l-2 border-white/80" />
                <div className="w-6 h-6 border-t-2 border-r-2 border-white/80" />
              </div>
              <div className="flex justify-between items-end">
                <div className="w-6 h-6 border-b-2 border-l-2 border-white/80" />
                <div className="w-6 h-6 border-b-2 border-r-2 border-white/80" />
              </div>
            </div>

            {/* Bottom Camera Mode Row & White Shutter Button */}
            <div className="relative z-10 pb-4 px-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2.5 text-[9px] tracking-widest text-white/75 font-semibold uppercase select-none">
                <span>VIDEO</span>
                <span className="text-[#34D399] font-bold">PHOTO</span>
                <span>PORTRAIT</span>
                <span>PANO</span>
              </div>
              <div className="w-11 h-11 rounded-full border-2 border-white p-0.5 flex items-center justify-center shadow-md">
                <div className="w-9 h-9 rounded-full bg-white shadow-inner" />
              </div>
            </div>

            {/* Feathered bottom edge: fades into background color */}
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#0A0D0B] via-[#0A0D0B]/70 to-transparent pointer-events-none z-10" />

            {/* ── CARD 1: NUTRITION BREAKDOWN RESULT CARD (Rises in B -> C, covers lower half) ── */}
            <div
              style={{
                transform: `translate3d(0, ${card1TranslateY}px, 0)`,
                opacity: card1Opacity,
                pointerEvents: card1Opacity < 0.1 ? "none" : "auto",
              }}
              className="absolute left-3 right-3 bottom-6 z-20 rounded-2xl bg-[#FCFBF9] dark:bg-[#18201C] border border-[#1C1917]/10 dark:border-white/15 p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] will-change-transform"
            >
              {/* Header: Food Thumbnail + Title + Calorie total */}
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#1C1917]/[0.08] dark:border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=120&q=80"
                  alt="Rice & Paneer Bowl thumbnail"
                  className="w-10 h-10 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif font-bold text-sm text-[#1C1917] dark:text-[#F4F1EA] truncate">
                    Rice &amp; Paneer Bowl
                  </h4>
                  <span className="text-[11px] font-semibold text-[#57534E] dark:text-[#9CA39E]">
                    454 Cal
                  </span>
                </div>
              </div>

              {/* 3 Ingredient Rows with Checkmarks */}
              <div className="divide-y divide-[#1C1917]/[0.06] dark:divide-white/[0.06] mt-2 text-[11px]">
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#1C1917] dark:text-[#F4F1EA] font-medium truncate">
                    Grilled Paneer
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[#57534E] dark:text-[#9CA39E]">
                      1 katori · 242 Cal
                    </span>
                    <Check className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#34D399]" />
                  </div>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#1C1917] dark:text-[#F4F1EA] font-medium truncate">
                    Steamed Basmati Rice
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[#57534E] dark:text-[#9CA39E]">
                      0.5 cup · 159 Cal
                    </span>
                    <Check className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#34D399]" />
                  </div>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#1C1917] dark:text-[#F4F1EA] font-medium truncate">
                    Broccoli &amp; Greens
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[#57534E] dark:text-[#9CA39E]">
                      0.5 cup · 53 Cal
                    </span>
                    <Check className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#34D399]" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── CARD 2: ORBIT ACTIONABLE INSIGHT CARD (Rises in C -> D, stacks over Card 1) ── */}
            <div
              style={{
                transform: `translate3d(0, ${card2TranslateY}px, 0)`,
                opacity: card2Opacity,
                pointerEvents: card2Opacity < 0.1 ? "none" : "auto",
              }}
              className="absolute left-3 right-3 bottom-3 z-30 rounded-2xl bg-[#FCFBF9] dark:bg-[#141C18] border border-[#2D6A4F]/30 dark:border-[#34D399]/40 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.55)] will-change-transform"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D6A4F] dark:text-[#34D399] mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Orbit</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#1C1917] dark:text-[#E6F4ED] font-normal">
                Good protein. Your 10:15 PM window is open: add Greek yogurt to close the 28g gap.
              </p>
            </div>
          </div>

          {/* ── CAPTION SWAPPER (Centered directly under phone, >= 18px, vertical cross-slide) ── */}
          <div className="mt-4 sm:mt-5 h-16 w-full max-w-[340px] sm:max-w-[400px] relative overflow-hidden flex items-center justify-center text-center">
            {/* Caption 1: Step 1 (Snap a photo) */}
            <div
              style={{
                transform: `translate3d(0, ${cap1TranslateY}%, 0)`,
                opacity: cap1Opacity,
                pointerEvents: cap1Opacity < 0.1 ? "none" : "auto",
              }}
              className="absolute inset-0 flex items-center justify-center px-2 will-change-transform"
            >
              <p className="text-lg sm:text-xl font-medium text-[#1C1917] dark:text-[#F4F1EA] leading-snug">
                Snap a photo of your meal.
              </p>
            </div>

            {/* Caption 2: Step 2 (Identifies & tracks) */}
            <div
              style={{
                transform: `translate3d(0, ${cap2TranslateY}%, 0)`,
                opacity: cap2Opacity,
                pointerEvents: cap2Opacity < 0.1 ? "none" : "auto",
              }}
              className="absolute inset-0 flex items-center justify-center px-2 will-change-transform"
            >
              <p className="text-lg sm:text-xl font-medium text-[#1C1917] dark:text-[#F4F1EA] leading-snug">
                SATAT identifies all the foods in your photo &amp; tracks it for you.
              </p>
            </div>

            {/* Caption 3: Step 3 (Orbit insights) */}
            <div
              style={{
                transform: `translate3d(0, ${cap3TranslateY}%, 0)`,
                opacity: cap3Opacity,
                pointerEvents: cap3Opacity < 0.1 ? "none" : "auto",
              }}
              className="absolute inset-0 flex items-center justify-center px-2 will-change-transform"
            >
              <p className="text-lg sm:text-xl font-medium text-[#1C1917] dark:text-[#F4F1EA] leading-snug">
                Orbit gives you instant, actionable insights to help you stay continuous.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
