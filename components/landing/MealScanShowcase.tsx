"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function MealScanShowcase() {
  const snapSectionRef = useRef<HTMLElement>(null);
  const [scrollStep, setScrollStep] = useState<0 | 1 | 2>(0);

  // Sticky scroll listener: calculates continuous normalized progress through 280vh track
  useEffect(() => {
    const handleScroll = () => {
      if (!snapSectionRef.current) return;
      const rect = snapSectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScroll = rect.height - windowHeight;
      if (totalScroll <= 0) return;
      const currentScroll = -rect.top;
      const progress = Math.min(Math.max(currentScroll / totalScroll, 0), 1);
      const step: 0 | 1 | 2 = progress < 0.33 ? 0 : progress < 0.67 ? 1 : 2;
      setScrollStep(step);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      id="snap"
      ref={snapSectionRef}
      className="relative h-[280vh] w-full"
    >
      {/* Inner Sticky Viewport */}
      <div className="sticky top-0 h-screen w-full max-w-[1360px] mx-auto px-6 md:px-12 lg:px-16 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8 lg:gap-16 overflow-hidden">
        {/* Left Column (Ultra-Clean, Zero Step Buttons — Matching HealthifyMe) */}
        <div className="max-w-[460px] text-left">
          {/* 1. Eyebrow */}
          <span className="text-sm font-semibold text-[#2D6A4F] dark:text-[#6EE7B7] mb-2 block">
            SatatSnap
          </span>

          {/* 2. Headline */}
          <h2 className="font-serif text-3xl sm:text-5xl lg:text-[54px] leading-[1.1] font-bold text-[#1C1917] dark:text-[#F4F1EA]">
            Track Your Food With Just a Snap
          </h2>

          {/* 3. Subtitle */}
          <p className="text-sm sm:text-base text-[#57534E] dark:text-[#9CA39E] mt-4 leading-relaxed">
            Snap your meal for instant nutritional details and smart, AI-driven cadence advice from Orbit.
          </p>

          {/* 4. Single Pill CTA Button */}
          <Link
            href="/onboarding"
            className="mt-7 inline-flex items-center justify-center px-7 py-3.5 rounded-full border border-[#1C1917]/25 dark:border-white/25 hover:border-[#E05A47] dark:hover:border-[#E05A47] text-sm font-semibold text-[#1C1917] dark:text-[#F4F1EA] hover:bg-[#E05A47] hover:text-white transition-all cursor-pointer"
          >
            Try Snap with a Photo
          </Link>
        </div>

        {/* Right Column: Sticky Phone Camera Viewfinder + Auto-Popping Overlay Cards + Bottom Caption */}
        <div className="flex flex-col items-center justify-center relative">
          {/* Sleek iPhone Mockup */}
          <div className="w-[270px] sm:w-[300px] h-[480px] sm:h-[530px] rounded-[44px] border-[8px] border-[#1C1917] dark:border-[#26302B] bg-black shadow-2xl relative overflow-visible">
            {/* Inner Phone Screen */}
            <div className="w-full h-full rounded-[36px] overflow-hidden relative bg-black flex flex-col justify-between">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-2 inset-x-0 mx-auto w-24 h-4 bg-black rounded-full z-30" />

              {/* Crisp Overhead Meal Bowl Photo */}
              <div className="absolute inset-0 z-10 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80"
                  alt="Overhead meal bowl photo"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
              </div>

              {/* Viewfinder Corner Brackets */}
              <div
                className={`relative z-20 m-6 flex-1 flex flex-col justify-between pointer-events-none transition-opacity duration-300 ${
                  scrollStep === 0 ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="w-7 h-7 border-t-2 border-l-2 border-white/70" />
                  <div className="w-7 h-7 border-t-2 border-r-2 border-white/70" />
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-7 h-7 border-b-2 border-l-2 border-white/70" />
                  <div className="w-7 h-7 border-b-2 border-r-2 border-white/70" />
                </div>
              </div>

              {/* Camera Bottom Bar: Mode text & White Shutter Button */}
              <div className="relative z-20 pb-4 px-6 flex flex-col items-center gap-2.5">
                <div className="flex items-center gap-3 text-[10px] tracking-widest text-white/70 font-semibold uppercase">
                  <span>VIDEO</span>
                  <span className="text-[#34D399]">PHOTO</span>
                  <span>PORTRAIT</span>
                  <span>PANO</span>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-white p-0.5 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white shadow-inner" />
                </div>
              </div>
            </div>

            {/* Card 1 — Nutrition Breakdown Card */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 w-[310px] sm:w-[340px] z-20 rounded-2xl bg-[#FCFBF9] dark:bg-[#18201C] border border-[#1C1917]/10 dark:border-white/15 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out ${
                scrollStep === 0
                  ? "bottom-10 translate-y-16 opacity-0 pointer-events-none scale-95"
                  : scrollStep === 1
                  ? "bottom-10 translate-y-0 opacity-100 scale-100"
                  : "bottom-[175px] translate-y-0 opacity-100 scale-[0.98]"
              }`}
            >
              {/* Top Row: Thumbnail + Title + Total Cal */}
              <div className="flex items-center gap-3 pb-2.5 border-b border-[#1C1917]/[0.08] dark:border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=120&q=80"
                  alt="Rice & Paneer Bowl"
                  className="w-11 h-11 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif font-bold text-sm text-[#1C1917] dark:text-[#F4F1EA] truncate">
                    Rice &amp; Paneer Bowl
                  </h4>
                  <span className="text-xs font-semibold text-[#57534E] dark:text-[#9CA39E]">
                    454 Cal
                  </span>
                </div>
              </div>

              {/* 3 Clean Ingredient Rows */}
              <div className="divide-y divide-[#1C1917]/[0.06] dark:divide-white/[0.06] mt-3 text-xs">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[#1C1917] dark:text-[#F4F1EA] font-medium">
                    Grilled Paneer
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#57534E] dark:text-[#9CA39E]">
                      1 katori · 242 Cal
                    </span>
                    <span className="text-[#2D6A4F] dark:text-[#34D399] font-bold">
                      ✓
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[#1C1917] dark:text-[#F4F1EA] font-medium">
                    Steamed Basmati Rice
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#57534E] dark:text-[#9CA39E]">
                      0.5 cup · 159 Cal
                    </span>
                    <span className="text-[#2D6A4F] dark:text-[#34D399] font-bold">
                      ✓
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[#1C1917] dark:text-[#F4F1EA] font-medium">
                    Broccoli &amp; Greens
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#57534E] dark:text-[#9CA39E]">
                      0.5 cup · 53 Cal
                    </span>
                    <span className="text-[#2D6A4F] dark:text-[#34D399] font-bold">
                      ✓
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 — Orbit Actionable Insight Card */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 bottom-3 w-[310px] sm:w-[340px] z-30 rounded-2xl bg-[#FCFBF9] dark:bg-[#141C18] border border-[#34D399]/35 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)] transition-all duration-500 ease-out ${
                scrollStep < 2
                  ? "translate-y-16 opacity-0 pointer-events-none scale-95"
                  : "translate-y-0 opacity-100 scale-100"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D6A4F] dark:text-[#34D399] mb-1.5">
                <span>✦ Orbit</span>
              </div>
              <p className="text-xs leading-relaxed text-[#1C1917] dark:text-[#E6F4ED]">
                &ldquo;This meal offers 38g of clean protein. However, white rice can spike afternoon glucose—take a 12-min walk before your 3 PM Deep Work block.&rdquo;
              </p>
            </div>
          </div>

          {/* Dynamic Caption Line Directly Below the Phone */}
          <div className="mt-6 text-center h-8 flex items-center justify-center">
            <p className="text-xs sm:text-sm font-medium text-[#57534E] dark:text-[#9CA39E] transition-opacity duration-300">
              {scrollStep === 0 && "Snap a photo of your meal."}
              {scrollStep === 1 && "SATAT identifies all the foods in your photo & tracks it for you."}
              {scrollStep === 2 && "Orbit AI gives you instant actionable insights to help you improve."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
