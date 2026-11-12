"use client";

import React from "react";
import Link from "next/link";
import { useLandingAuth } from "@/hooks/useLandingAuth";
import Logo from "@/components/Logo";

export default function Footer() {
  const { handleStartOrSignIn } = useLandingAuth();
  return (
    <footer className="border-t border-[rgba(28,25,23,0.07)] dark:border-white/10 bg-[#F6F3EC] dark:bg-[#0A0D0B] transition-colors">
      <div className="w-full max-w-[1360px] xl:max-w-[1480px] mx-auto px-6 md:px-12 lg:px-16 py-8 text-xs text-[#57534E] dark:text-[#9CA39E]">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left: Brand identity + inline philosophical lineage note on the exact same row */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 text-xs">
            <Logo size={18} className="rounded shrink-0" />
            <span className="font-serif text-base tracking-tight text-[#1C1917] dark:text-[#F4F1EA] font-semibold">
              satat.
            </span>
            <span className="text-[#8C857B] dark:text-[#6E7872]">·</span>
            <span className="font-sans text-xs text-[#8C857B] dark:text-[#6E7872] font-semibold">सतत्</span>
            <span className="text-[#8C857B] dark:text-[#6E7872] hidden sm:inline">—</span>
            <span className="text-[11px] text-[#8C857B] dark:text-[#9CA39E] leading-relaxed">
              Rooted in सतत् (Satat) — the Sanskrit principle of continuous, unbroken flow.
            </span>
          </div>

          {/* Right: Navigation links */}
          <div className="flex items-center gap-6 font-medium text-xs shrink-0">
            <a href="#rhythm" className="hover:text-[#1C1917] dark:hover:text-[#F4F1EA] transition-colors">
              Timeline
            </a>
            <a href="#snap" className="hover:text-[#1C1917] dark:hover:text-[#F4F1EA] transition-colors">
              AI Snap
            </a>
            <a href="#orbit" className="hover:text-[#1C1917] dark:hover:text-[#F4F1EA] transition-colors">
              Orbit
            </a>
            <a href="#proof" className="hover:text-[#1C1917] dark:hover:text-[#F4F1EA] transition-colors">
              Proof
            </a>
            <button
              type="button"
              onClick={() => handleStartOrSignIn("/dashboard")}
              className="hover:text-[#1C1917] dark:hover:text-[#F4F1EA] transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs font-medium"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
