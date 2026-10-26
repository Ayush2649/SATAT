"use client";

import React from "react";
import { signIn } from "next-auth/react";

export default function FinalCTA() {
  return (
    <section className="py-6 sm:py-8 max-w-md sm:max-w-lg mx-auto">
      {/* Single rounded dark botanical card */}
      <div className="bg-[#191D1A] text-[#FCFBF9] rounded-[32px] p-7 sm:p-10 mx-4 mb-6 text-left shadow-xl relative overflow-hidden">
        {/* Subtle warm terracotta radial glow in top-right corner */}
        <div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none opacity-25 blur-2xl"
          style={{
            background: "radial-gradient(circle, #E05A47 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10">
          {/* Eyebrow (Left-aligned) */}
          <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#E05A47] block mb-3">
            START YOUR PRACTICE
          </span>

          {/* Headline (Left-aligned in Instrument Serif) */}
          <h2 className="font-serif text-3xl sm:text-4xl text-[#FCFBF9] leading-[1.15] tracking-tight">
            Build a body and routine you can{" "}
            <span className="italic text-[#6EE7B7]">actually keep.</span>
          </h2>

          {/* Body copy (Left-aligned) */}
          <p className="text-xs sm:text-sm text-stone-300 mt-3 max-w-sm leading-relaxed font-normal">
            No rigid streaks, no guilt, no isolated numbers. Just your daily life, moving in conscious rhythm.
          </p>

          {/* CTA Button: Full-width Terracotta pill */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full py-4 text-sm font-semibold mt-6 flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <span>Begin in 60 seconds</span>
            <span>→</span>
          </button>

          {/* Footer Line (Inside the bottom of this dark card, centered) */}
          <p className="text-[10px] text-stone-400 text-center mt-5 mb-0 font-mono tracking-tight">
            © satat. mindful physical longevity. all rights reserved.
          </p>
        </div>
      </div>
    </section>
  );
}
