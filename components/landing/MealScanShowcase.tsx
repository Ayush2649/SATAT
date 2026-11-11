"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Orbit3DCore } from "@/components/orbit/Orbit3DCore";
import { Camera, Check } from "lucide-react";

export default function MealScanShowcase() {
  const [step, setStep] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Auto-advance showcase every 4 seconds unless hovered/interacting
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <section
      id="snap"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="py-16 sm:py-24 px-4 sm:px-8 w-full max-w-[1400px] mx-auto overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Column (5 Cols) */}
        <div className="lg:col-span-5 text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E6F2EC] dark:bg-[#132A1F] border border-[#34D399]/25">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] dark:bg-[#34D399]" />
            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase text-[#2D6A4F] dark:text-[#6EE7B7]">
              SATAT AI VISION · ZERO BARCODE ANXIETY
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl text-[#1C1917] dark:text-[#F4F1EA] leading-[1.1]">
            Track your food with just a snap.
          </h2>

          <p className="text-sm sm:text-base text-[#57534E] dark:text-[#9CA39E] leading-relaxed">
            Snap your meal for instant Indian &amp; global macro breakdowns and real-time biological adjustments from Orbit.
          </p>

          {/* 3 Interactive Step Indicators */}
          <div className="space-y-3 pt-2">
            {[
              {
                num: 0,
                pill: "1. Snap Plate",
                label: "Snap a photo of your meal.",
                sub: "Zero barcode scanning, gram weighing, or guessing.",
              },
              {
                num: 1,
                pill: "2. Instant Macros",
                label: "SATAT identifies every dish & macro in 3 seconds.",
                sub: "Accurate Indian & international recipes with glycemic index.",
              },
              {
                num: 2,
                pill: "3. Orbit Action",
                label: "Orbit gives you instant actionable cadence advice.",
                sub: "Glucose damping, protein targets, and schedule syncing.",
              },
            ].map((item) => {
              const isCurrent = step === item.num;
              return (
                <button
                  key={item.num}
                  type="button"
                  onClick={() => setStep(item.num)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer border ${
                    isCurrent
                      ? "bg-[#FCFBF9] dark:bg-[#18211C] border-[#2D6A4F] dark:border-[#34D399]/40 shadow-sm"
                      : "bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isCurrent
                          ? "bg-[#2D6A4F] text-white"
                          : "bg-[#EFECE4] dark:bg-[#1C221E] text-[#57534E] dark:text-[#9CA39E]"
                      }`}
                    >
                      {item.pill}
                    </span>
                    <h4 className="text-sm font-bold text-[#1C1917] dark:text-[#F4F1EA]">
                      {item.label}
                    </h4>
                  </div>
                  <p className="text-xs text-[#57534E] dark:text-[#9CA39E] mt-1 pl-1">
                    {item.sub}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <Link
              href="/onboarding"
              className="bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full px-7 py-3.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all active:scale-95 inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Try AI Plate Scanner</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Right Column (7 Cols): iPhone Frame Mockup + Docking Cards */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative min-h-[560px]">
          {/* Main Smartphone Shell */}
          <div className="w-[290px] sm:w-[320px] h-[540px] rounded-[44px] border-[8px] border-[#1C1917] dark:border-[#26302B] bg-[#0A0D0B] shadow-2xl overflow-hidden relative flex flex-col justify-between">
            {/* Top Notch / Dynamic Island */}
            <div className="absolute top-2 inset-x-0 mx-auto w-24 h-4 bg-black rounded-full z-30" />

            {/* Food Photo Canvas */}
            <div className="absolute inset-0 z-10 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80"
                alt="Nutrient-dense Indian rice and bowl meal plate"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
            </div>

            {/* Stage 1: Scanning Viewfinder Corner Brackets */}
            <div className="relative z-20 m-6 flex-1 flex flex-col justify-between pointer-events-none">
              <div className="flex justify-between items-start">
                <div className="w-8 h-8 border-t-2 border-l-2 border-[#34D399]" />
                <div className="w-8 h-8 border-t-2 border-r-2 border-[#34D399]" />
              </div>

              {/* Scanning Laser Beam */}
              {step === 0 && (
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#34D399] to-transparent shadow-[0_0_12px_#34D399] animate-[timelineBeam_2s_ease-in-out_infinite]" />
              )}

              <div className="flex justify-between items-end">
                <div className="w-8 h-8 border-b-2 border-l-2 border-[#34D399]" />
                <div className="w-8 h-8 border-b-2 border-r-2 border-[#34D399]" />
              </div>
            </div>

            {/* Camera Bottom Bar */}
            <div className="relative z-20 pb-5 px-6 flex flex-col items-center gap-3">
              <div className="flex items-center gap-3 text-[9px] font-mono font-bold tracking-widest text-white/70 uppercase">
                <span>MACRO</span>
                <span className="text-[#34D399]">● VISION</span>
                <span>PLATE</span>
                <span>SNAP</span>
              </div>
              <button
                type="button"
                onClick={() => setStep((prev) => (prev + 1) % 3)}
                className="w-14 h-14 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                aria-label="Capture meal photo"
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1C1917]">
                  <Camera className="w-5 h-5" />
                </div>
              </button>
            </div>
          </div>

          {/* Floating Stage 2: Crisp Macro Breakdown Card */}
          <div
            className={`w-[310px] sm:w-[350px] bg-[#FCFBF9]/95 dark:bg-[#141916]/95 backdrop-blur-xl border border-[#1C1917]/10 dark:border-white/15 rounded-3xl p-4 shadow-2xl transition-all duration-500 z-30 ${
              step >= 1
                ? "opacity-100 translate-y-0 relative mt-4 lg:absolute lg:top-12 lg:-right-4"
                : "opacity-0 pointer-events-none translate-y-4 hidden lg:block lg:absolute lg:top-12 lg:-right-4"
            }`}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[#1C1917]/[0.08] dark:border-white/10">
              <div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#6EE7B7]">
                  MEAL IDENTIFIED
                </span>
                <h4 className="font-serif font-bold text-sm text-[#1C1917] dark:text-[#F4F1EA]">
                  High-Protein Rice &amp; Paneer Bowl
                </h4>
              </div>
              <span className="text-base font-bold text-[#E05A47]">
                640 kcal
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              {[
                { name: "Grilled Paneer (150g)", val: "310 kcal · 28g P" },
                { name: "Steamed Basmati & Dal", val: "240 kcal · 11g P" },
                { name: "Avocado & Greens", val: "90 kcal · 3g P" },
              ].map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-1 border-b border-black/[0.04] dark:border-white/[0.04] last:border-none"
                >
                  <span className="text-[#57534E] dark:text-[#9CA39E] font-medium">
                    {row.name}
                  </span>
                  <span className="text-[#1C1917] dark:text-[#F4F1EA] font-semibold flex items-center gap-1">
                    {row.val} <Check className="w-3 h-3 text-[#2D6A4F] dark:text-[#34D399]" />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating Stage 3: Orbit AI Action Card */}
          <div
            className={`w-[310px] sm:w-[350px] bg-[#18221C] text-[#F4F1EA] border border-[#34D399]/35 rounded-3xl p-4 shadow-2xl transition-all duration-500 z-30 ${
              step === 2
                ? "opacity-100 translate-y-0 relative mt-3 lg:absolute lg:bottom-12 lg:-right-8"
                : "opacity-0 pointer-events-none translate-y-4 hidden lg:block lg:absolute lg:bottom-12 lg:-right-8"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Orbit3DCore size="sm" showRadar={false} />
              <span className="text-xs font-bold text-[#6EE7B7]">
                ✦ Orbit Cadence Insight
              </span>
            </div>
            <p className="text-xs text-[#E6F4ED] leading-relaxed">
              &ldquo;This meal hits 42g of protein cleanly. Since white rice can spike afternoon glucose, take a 10-min walk before your 3 PM Deep Work block.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
