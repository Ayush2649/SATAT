"use client";

import React from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(28,25,23,0.07)] bg-[#F6F3EC]">
      <div className="w-full max-w-[1360px] xl:max-w-[1480px] mx-auto px-6 md:px-12 lg:px-16 py-8 text-xs text-[#57534E]">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left: Brand identity + inline philosophical lineage note on the exact same row */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 text-xs">
            <Logo size={18} className="rounded shrink-0" />
            <span className="font-serif text-base tracking-tight text-[#1C1917] font-semibold">
              satat.
            </span>
            <span className="text-[#8C857B]">·</span>
            <span className="font-sans text-xs text-[#8C857B] font-semibold">सतत्</span>
            <span className="text-[#8C857B] hidden sm:inline">—</span>
            <span className="text-[11px] text-[#8C857B] leading-relaxed">
              Rooted in सतत् (Satat) — the Sanskrit principle of continuous, unbroken flow.
            </span>
          </div>

          {/* Right: Navigation links */}
          <div className="flex items-center gap-6 font-medium text-xs shrink-0">
            <a href="#rhythm" className="hover:text-[#1C1917] transition-colors">
              Rhythm
            </a>
            <a href="#orbit" className="hover:text-[#1C1917] transition-colors">
              Orbit
            </a>
            <a href="#proof" className="hover:text-[#1C1917] transition-colors">
              Proof
            </a>
            <Link href="/signin" className="hover:text-[#1C1917] transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
