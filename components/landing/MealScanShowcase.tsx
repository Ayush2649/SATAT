"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, Check } from "lucide-react";

// ============================================================================
// SATAT SNAP — scroll-scrubbed meal-scan showcase (HealthifySnap interaction)
//
// How it works
//  • <section id="snap"> is (stage height × (1 + RUNWAY_MULTIPLIER)) tall.
//  • Inside it, ONE `position: sticky` stage is pinned at HEADER_OFFSET_PX and
//    hard-clipped (overflow-hidden) to `100svh − HEADER_OFFSET_PX`, so nothing
//    can ever be drawn under the floating header.
//  • A single scroll-progress value (0 → 1) drives every transform through the
//    pure function `computeSnapFrame()`. No timers, no one-shot triggers, so the
//    whole thing is 100 % scrubbed and reversible.
//  • Styles are written straight to the DOM from a rAF-throttled scroll
//    listener (no React re-render per frame). Only `transform` / `opacity`
//    are animated.
//
// IMPORTANT: `position: sticky` stops working if ANY ancestor has
// `overflow: hidden | auto | scroll` on either axis. app/page.tsx must use
// `overflow-x-clip` (not `overflow-x-hidden`) on <main>.
// ============================================================================
export const SNAP_CONSTANTS = {
  // 16px (top-4) + ~52px pill header + 12px breathing room
  HEADER_OFFSET_PX: 80,

  // Scroll runway after the stage pins, as a multiple of the stage height
  RUNWAY_MULTIPLIER: 3.2,

  // Phone mockup (mobile, calibrated for iPhone 17 Pro Max proportions)
  MOBILE_PHONE_WIDTH_PX: 312,
  MOBILE_PHONE_HEIGHT_PX: 600,
  CAPTION_HEIGHT_PX: 46,
  UNIT_GAP_PX: 8,

  // Card geometry, measured from the top of the phone
  CARD1_TOP_PX: 260,
  CARD1_WIDTH_PX: 326,
  CARD1_NUDGE_PX: 36,
  CARD2_TOP_PX: 396,
  CARD2_WIDTH_PX: 302,

  // Scroll progress milestones
  // 0.00-0.20  A    intro scrolls away 1:1 with the page, phone rises from the bottom edge
  // 0.20-0.42  B    step 1 holds   (phone centred, caption 1)
  // 0.42-0.58  B→C  card 1 rises, caption 1 → 2 cross-slide
  // 0.58-0.74  C    step 2 holds   (card 1 settled, caption 2)
  // 0.74-0.90  C→D  card 2 rises, card 1 nudges up, caption 2 → 3 cross-slide
  // 0.90-0.97  D    step 3 holds   (stacked state, caption 3)
  // 0.97-1.00  release (stage unpins, next section follows immediately)
  PROGRESS: {
    PHONE_ENTER_START: 0.0,
    PHONE_ENTER_END: 0.2,
    STEP1_START: 0.2,
    STEP1_END: 0.42,
    CARD1_ENTER_START: 0.42,
    CARD1_ENTER_END: 0.58,
    STEP2_START: 0.58,
    STEP2_END: 0.74,
    CARD2_ENTER_START: 0.74,
    CARD2_ENTER_END: 0.9,
    STEP3_START: 0.9,
    STEP3_END: 0.97,
    RELEASE: 0.97,
  },
} as const;

const P = SNAP_CONSTANTS.PROGRESS;
const C = SNAP_CONSTANTS;

// Unit = phone + gap + caption box (the thing that is centred in the stage)
const UNIT_HEIGHT_PX = C.MOBILE_PHONE_HEIGHT_PX + C.UNIT_GAP_PX + C.CAPTION_HEIGHT_PX;
// Min free space we want above and below the unit before it is scaled down
const STAGE_PADDING_PX = 24;
// SSR / first-paint stage height (852 − 80 = 772 → iPhone 14/15 Pro at 393 × 852)
const DEFAULT_STAGE_HEIGHT_PX = 772;
const DESKTOP_QUERY = "(min-width: 1024px)";

function clamp(v: number, min = 0, max = 1): number {
  return Math.min(Math.max(v, min), max);
}

function progressSegment(progress: number, start: number, end: number): number {
  return clamp((progress - start) / (end - start));
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function smoothStep(t: number): number {
  return t * t * (3 - 2 * t);
}

export interface SnapFrame {
  intro: { transform: string; opacity: string };
  unit: { transform: string };
  card1: { transform: string };
  card2: { transform: string };
  finder: { opacity: string };
  cap1: { transform: string };
  cap2: { transform: string };
  cap3: { transform: string };
}

/**
 * Pure mapping: scroll progress → every transform on screen.
 * (Pure ⇒ scrolling up replays everything backwards by construction.)
 */
export function computeSnapFrame(
  progress: number,
  stageHeight: number,
  runwayPx: number,
  isDesktop: boolean
): SnapFrame {
  // Shrink the unit on very short viewports so it always fits
  const scale = clamp(
    (stageHeight - STAGE_PADDING_PX * 2) / UNIT_HEIGHT_PX,
    0.55,
    1
  );

  // ── Stage A: intro scrolls up 1:1 with the page (exactly like normal flow) ──
  const scrolledPx = progress * runwayPx;
  const introFade = 1 - progressSegment(progress, 0.1, P.PHONE_ENTER_END);
  const intro = isDesktop
    ? { transform: "none", opacity: "1" }
    : {
        transform: `translate3d(0, ${(-scrolledPx).toFixed(2)}px, 0)`,
        opacity: introFade.toFixed(3),
      };

  // ── Phone/unit enters from the bottom edge of the clip region ──
  const enterT = easeOutCubic(
    progressSegment(progress, P.PHONE_ENTER_START, P.PHONE_ENTER_END)
  );
  // distance that places the whole unit just below the clip bottom
  const enterDist = stageHeight / 2 + (UNIT_HEIGHT_PX * scale) / 2 + 12;
  const unitY = (1 - enterT) * enterDist;
  const unit = {
    transform: `translate3d(-50%, calc(-50% + ${unitY.toFixed(2)}px), 0) scale(${scale.toFixed(4)})`,
  };

  // Offset (in unscaled px) that parks a card fully below the clip bottom
  const riseFrom = (cardTop: number) =>
    (stageHeight - (stageHeight / 2 + (cardTop - UNIT_HEIGHT_PX / 2) * scale)) /
      scale +
    16;

  // ── Card 1 rises (B→C), then nudges up (C→D) ──
  const card1T = easeOutCubic(
    progressSegment(progress, P.CARD1_ENTER_START, P.CARD1_ENTER_END)
  );
  const nudgeT = easeOutCubic(
    progressSegment(progress, P.CARD2_ENTER_START, P.CARD2_ENTER_END)
  );
  const card1Y = (1 - card1T) * riseFrom(C.CARD1_TOP_PX) - nudgeT * C.CARD1_NUDGE_PX;

  // ── Card 2 rises (C→D) ──
  const card2T = easeOutCubic(
    progressSegment(progress, P.CARD2_ENTER_START, P.CARD2_ENTER_END)
  );
  const card2Y = (1 - card2T) * riseFrom(C.CARD2_TOP_PX);

  // Viewfinder UI fades out as card 1 covers the lower half of the phone
  const finderOpacity =
    1 - progressSegment(progress, P.CARD1_ENTER_START, P.CARD1_ENTER_START + 0.08);

  // ── Captions: vertical cross-slide inside a clipped box; both are on screen
  //    together while swapping (box is masked top/bottom, so no ghosting) ──
  const s12 = smoothStep(progressSegment(progress, P.CARD1_ENTER_START, P.CARD1_ENTER_END));
  const s23 = smoothStep(progressSegment(progress, P.CARD2_ENTER_START, P.CARD2_ENTER_END));
  const capY = (pct: number) => `translate3d(0, ${pct.toFixed(2)}%, 0)`;

  return {
    intro,
    unit,
    card1: { transform: `translate3d(0, ${card1Y.toFixed(2)}px, 0)` },
    card2: { transform: `translate3d(0, ${card2Y.toFixed(2)}px, 0)` },
    finder: { opacity: finderOpacity.toFixed(3) },
    cap1: { transform: capY(-s12 * 100) },
    cap2: { transform: capY((1 - s12) * 100 - s23 * 100) },
    cap3: { transform: capY((1 - s23) * 100) },
  };
}

function applyFrame(
  frame: SnapFrame,
  els: {
    intro: HTMLElement | null;
    unit: HTMLElement | null;
    card1: HTMLElement | null;
    card2: HTMLElement | null;
    finder: HTMLElement | null;
    cap1: HTMLElement | null;
    cap2: HTMLElement | null;
    cap3: HTMLElement | null;
  }
) {
  if (els.intro) {
    els.intro.style.transform = frame.intro.transform;
    els.intro.style.opacity = frame.intro.opacity;
    els.intro.style.pointerEvents = Number(frame.intro.opacity) < 0.1 ? "none" : "auto";
  }
  if (els.unit) els.unit.style.transform = frame.unit.transform;
  if (els.card1) els.card1.style.transform = frame.card1.transform;
  if (els.card2) els.card2.style.transform = frame.card2.transform;
  if (els.finder) els.finder.style.opacity = frame.finder.opacity;
  if (els.cap1) els.cap1.style.transform = frame.cap1.transform;
  if (els.cap2) els.cap2.style.transform = frame.cap2.transform;
  if (els.cap3) els.cap3.style.transform = frame.cap3.transform;
}

const FOOD_PHOTO =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80";
const FOOD_THUMB =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=120&q=75";

function FoodRow({ detail, children }: { detail: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[#1C1917] dark:text-[#F4F1EA] font-medium truncate">{children}</span>
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        <span className="text-[#57534E] dark:text-[#9CA39E]">{detail}</span>
        <Check className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#34D399]" aria-hidden="true" />
      </div>
    </div>
  );
}

export default function MealScanShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const finderRef = useRef<HTMLDivElement>(null);
  const cap1Ref = useRef<HTMLDivElement>(null);
  const cap2Ref = useRef<HTMLDivElement>(null);
  const cap3Ref = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Honour prefers-reduced-motion (static stacked layout)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Scroll-scrub engine
  useEffect(() => {
    if (reducedMotion) return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    const desktopMq = window.matchMedia(DESKTOP_QUERY);
    let rafId: number | null = null;

    const updateScrollProgress = () => {
      rafId = null;
      const stageHeight = stage.offsetHeight;
      const runwayPx = section.offsetHeight - stageHeight;
      if (runwayPx <= 0) return;
      const rect = section.getBoundingClientRect();
      // Stage pins when section.top reaches HEADER_OFFSET_PX and releases when the
      // section bottom reaches the viewport bottom.
      const scrolled = SNAP_CONSTANTS.HEADER_OFFSET_PX - rect.top;
      const progress = clamp(scrolled / runwayPx);
      applyFrame(computeSnapFrame(progress, stageHeight, runwayPx, desktopMq.matches), {
        intro: introRef.current,
        unit: unitRef.current,
        card1: card1Ref.current,
        card2: card2Ref.current,
        finder: finderRef.current,
        cap1: cap1Ref.current,
        cap2: cap2Ref.current,
        cap3: cap3Ref.current,
      });
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(updateScrollProgress);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    desktopMq.addEventListener("change", onScroll);
    updateScrollProgress();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      desktopMq.removeEventListener("change", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  // First-paint (SSR-safe) frame = progress 0
  const initial = computeSnapFrame(
    0,
    DEFAULT_STAGE_HEIGHT_PX,
    DEFAULT_STAGE_HEIGHT_PX * SNAP_CONSTANTS.RUNWAY_MULTIPLIER,
    false
  );

  // ── Reduced motion: static stacked view ──
  if (reducedMotion) {
    return (
      <section
        id="snap"
        className="w-full max-w-[1360px] mx-auto px-6 py-16 text-center space-y-12 scroll-mt-28"
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
          <div className="w-[312px] h-[600px] rounded-[48px] border-[7px] border-[#1C1917] dark:border-[#26302B] bg-black overflow-hidden relative shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={FOOD_PHOTO}
              alt="Nutrient-dense meal plate"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-lg font-medium text-[#1C1917] dark:text-[#F4F1EA]">
            Snap a photo of your meal.
          </p>
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
          <p className="text-lg font-medium text-[#1C1917] dark:text-[#F4F1EA] max-w-[340px]">
            SATAT identifies all the foods in your photo &amp; tracks it for you.
          </p>
          <div className="w-[310px] rounded-2xl bg-[#FCFBF9] dark:bg-[#141C18] border border-[#34D399]/35 p-4 shadow-lg text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D6A4F] dark:text-[#34D399] mb-1">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Orbit</span>
            </div>
            <p className="text-xs text-[#1C1917] dark:text-[#E6F4ED]">
              Good protein. Your 10:15 PM window is open: add Greek yogurt to
              close the 28g gap.
            </p>
          </div>
          <p className="text-lg font-medium text-[#1C1917] dark:text-[#F4F1EA] max-w-[340px]">
            Orbit gives you instant, actionable insights to help you stay continuous.
          </p>
        </div>
      </section>
    );
  }

  const captionClass =
    "absolute inset-0 flex items-center justify-center px-2 text-center will-change-transform";
  const captionTextClass =
    "text-sm sm:text-base font-medium text-[#1C1917] dark:text-[#F4F1EA] leading-tight";

  return (
    <section
      id="snap"
      ref={sectionRef}
      aria-label="SatatSnap meal scan"
      style={{
        // stage height × (1 + runway multiplier). The stage releases exactly when
        // step 3 has finished, so there is no dead space before #orbit.
        height: `calc((100svh - ${SNAP_CONSTANTS.HEADER_OFFSET_PX}px) * ${1 + SNAP_CONSTANTS.RUNWAY_MULTIPLIER})`,
      }}
      className="relative w-full scroll-mt-28"
    >
      {/* ── PINNED STAGE: hard-clipped below the floating header ── */}
      <div
        ref={stageRef}
        style={{
          top: `${SNAP_CONSTANTS.HEADER_OFFSET_PX}px`,
          height: `calc(100svh - ${SNAP_CONSTANTS.HEADER_OFFSET_PX}px)`,
        }}
        className="sticky w-full max-w-[1360px] mx-auto overflow-hidden"
      >
        {/* ── STAGE A: INTRO (mobile: scrolls away 1:1 · desktop: docked left) ── */}
        <div className="absolute inset-x-5 top-6 sm:inset-x-8 lg:inset-x-auto lg:left-12 lg:top-1/2 lg:-translate-y-1/2 lg:w-[460px] z-10">
          <div
            ref={introRef}
            style={initial.intro}
            className="text-left will-change-transform"
          >
            <span className="text-sm font-semibold text-[#2D6A4F] dark:text-[#6EE7B7] mb-2 block">
              SatatSnap
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-[54px] leading-[1.08] font-bold text-[#1C1917] dark:text-[#F4F1EA]">
              Track Your Food With Just a Snap
            </h2>
            <p className="text-sm sm:text-base text-[#57534E] dark:text-[#9CA39E] mt-3.5 leading-relaxed font-normal">
              Snap your meal for instant nutritional details and smart, AI-driven cadence advice from Orbit.
            </p>
            <Link
              href="/onboarding"
              className="mt-6 inline-flex items-center justify-center px-6 py-3 rounded-full border border-[#2D6A4F] dark:border-[#34D399] text-sm font-semibold text-[#2D6A4F] dark:text-[#34D399] bg-transparent [@media(hover:hover)]:hover:bg-[#2D6A4F] [@media(hover:hover)]:hover:text-white dark:[@media(hover:hover)]:hover:bg-[#34D399] dark:[@media(hover:hover)]:hover:text-[#0A0D0B] transition-colors active:scale-95"
            >
              Try Snap with a Photo
            </Link>
          </div>
        </div>

        {/* ── STAGES B–D: UNIT = phone + cards + caption box, centred in the clip region ── */}
        <div
          ref={unitRef}
          style={initial.unit}
          className="absolute top-1/2 left-1/2 lg:left-[68%] flex flex-col items-center will-change-transform"
        >
          {/* Phone wrapper: overflow VISIBLE so cards can overhang the phone edges */}
          <div
            style={{
              width: `${SNAP_CONSTANTS.MOBILE_PHONE_WIDTH_PX}px`,
              height: `${SNAP_CONSTANTS.MOBILE_PHONE_HEIGHT_PX}px`,
            }}
            className="relative shrink-0"
          >
            {/* Phone body (clipped) */}
            <div className="absolute inset-0 rounded-[48px] border-[7px] border-[#1C1917] dark:border-[#26302B] bg-black shadow-[0_24px_64px_rgba(0,0,0,0.45)] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={FOOD_PHOTO}
                alt="Nutrient-dense meal plate"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
              />
              <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
              {/* Dynamic island */}
              <div className="absolute top-3 inset-x-0 mx-auto w-24 h-5 bg-black rounded-full z-10 flex items-center justify-end pr-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-white/10" />
              </div>

              {/* Camera UI (brackets, mode row, shutter) — fades as card 1 arrives */}
              <div
                ref={finderRef}
                style={initial.finder}
                className="absolute inset-0 pointer-events-none"
              >
                <div className="absolute inset-x-5 top-14 bottom-32 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-t-2 border-l-2 border-white/80" />
                    <div className="w-6 h-6 border-t-2 border-r-2 border-white/80" />
                  </div>
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-b-2 border-l-2 border-white/80" />
                    <div className="w-6 h-6 border-b-2 border-r-2 border-white/80" />
                  </div>
                </div>
                <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black/85 to-transparent" />
                <div className="absolute bottom-4 inset-x-0 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2.5 text-[9px] tracking-widest text-white/75 font-semibold uppercase select-none">
                    <span>VIDEO</span>
                    <span className="text-[#34D399] font-bold">PHOTO</span>
                    <span>PORTRAIT</span>
                    <span>PANO</span>
                  </div>
                  <div className="w-11 h-11 rounded-full border-2 border-white p-0.5 flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── CARD 1: nutrition breakdown (rises B→C, nudges up C→D) ── */}
            <div
              ref={card1Ref}
              style={{
                ...initial.card1,
                top: `${SNAP_CONSTANTS.CARD1_TOP_PX}px`,
                width: `${SNAP_CONSTANTS.CARD1_WIDTH_PX}px`,
                marginLeft: `-${SNAP_CONSTANTS.CARD1_WIDTH_PX / 2}px`,
              }}
              className="absolute left-1/2 z-20 rounded-2xl bg-[#FCFBF9] dark:bg-[#18201C] border border-[#1C1917]/10 dark:border-white/15 px-3.5 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.35)] will-change-transform"
            >
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#1C1917]/[0.08] dark:border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={FOOD_THUMB}
                  alt="Rice & Paneer Bowl thumbnail"
                  loading="lazy"
                  className="w-10 h-10 rounded-xl object-cover shrink-0 bg-[#EFECE4] dark:bg-[#1C2420]"
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
              <div className="divide-y divide-[#1C1917]/[0.06] dark:divide-white/[0.06] mt-1 text-[11px]">
                <FoodRow detail="1 katori · 242 Cal">Grilled Paneer</FoodRow>
                <FoodRow detail="0.5 cup · 159 Cal">Steamed Basmati Rice</FoodRow>
                <FoodRow detail="0.5 cup · 53 Cal">Broccoli &amp; Greens</FoodRow>
              </div>
            </div>

            {/* ── CARD 2: Orbit insight (rises C→D, docks over card 1) ── */}
            <div
              ref={card2Ref}
              style={{
                ...initial.card2,
                top: `${SNAP_CONSTANTS.CARD2_TOP_PX}px`,
                width: `${SNAP_CONSTANTS.CARD2_WIDTH_PX}px`,
                marginLeft: `-${SNAP_CONSTANTS.CARD2_WIDTH_PX / 2}px`,
              }}
              className="absolute left-1/2 z-30 rounded-2xl bg-[#FCFBF9] dark:bg-[#141C18] border border-[#2D6A4F]/30 dark:border-[#34D399]/40 px-3.5 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.4)] will-change-transform"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D6A4F] dark:text-[#34D399] mb-1">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Orbit</span>
              </div>
              <p className="text-[12px] leading-relaxed text-[#1C1917] dark:text-[#E6F4ED] font-normal">
                Good protein. Your 10:15 PM window is open: add Greek yogurt to close the 28g gap.
              </p>
            </div>
          </div>

          {/* ── CAPTION SWAPPER: centred under the phone, vertical cross-slide ── */}
          <div
            style={{
              height: `${SNAP_CONSTANTS.CAPTION_HEIGHT_PX}px`,
              marginTop: `${SNAP_CONSTANTS.UNIT_GAP_PX}px`,
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0, #000 16%, #000 84%, transparent 100%)",
              maskImage:
                "linear-gradient(to bottom, transparent 0, #000 16%, #000 84%, transparent 100%)",
            }}
            className="relative overflow-hidden w-[min(340px,calc(100vw-32px))] sm:w-[420px]"
          >
            <div ref={cap1Ref} style={initial.cap1} className={captionClass}>
              <p className={captionTextClass}>Snap a photo of your meal.</p>
            </div>
            <div ref={cap2Ref} style={initial.cap2} className={captionClass}>
              <p className={captionTextClass}>
                SATAT identifies all the foods in your photo &amp; tracks it for you.
              </p>
            </div>
            <div ref={cap3Ref} style={initial.cap3} className={captionClass}>
              <p className={captionTextClass}>
                Orbit gives you instant, actionable insights to help you stay continuous.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
