"use client";

import React from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(28,25,23,0.07)] bg-[#F6F3EC]">
      <div className="max-w-md sm:max-w-4xl mx-auto px-6 pb-12 pt-6 text-xs text-[#57534E]">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[rgba(28,25,23,0.06)]">
          <div className="flex items-center gap-2">
            <Logo size={18} className="rounded" />
            <span className="font-serif text-base tracking-tight text-[#1C1917]">
              satat.
            </span>
            <span className="text-[#8C857B]">·</span>
            <span className="font-sans text-xs text-[#8C857B] font-medium">सतत्</span>
          </div>

          <div className="flex items-center gap-5 font-medium">
            <a href="#problem" className="hover:text-[#1C1917] transition-colors">
              Rhythm
            </a>
            <a href="#orbit" className="hover:text-[#1C1917] transition-colors">
              Orbit
            </a>
            <a href="#progress" className="hover:text-[#1C1917] transition-colors">
              Proof
            </a>
            <Link href="/signin" className="hover:text-[#1C1917] transition-colors">
              Sign in
            </Link>
          </div>
        </div>

        {/* Bottom note */}
        <div className="pt-4 text-center sm:text-left text-[11px] text-[#8C857B] leading-relaxed">
          Rooted in सतत् (Satat) — the Sanskrit principle of continuous, unbroken flow.
        </div>
      </div>
    </footer>
  );
}
