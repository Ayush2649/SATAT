"use client";

import React from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import Logo from "@/components/Logo";

export default function LandingNav() {
  const { data: session } = useSession();

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-4 pt-4 sm:pt-6 pointer-events-none transition-all duration-300">
      <nav
        aria-label="Main Navigation"
        className="w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] max-w-[1440px] xl:max-w-[1600px] mx-auto pointer-events-auto bg-[#FCFBF9] rounded-full px-6 sm:px-8 py-3.5 shadow-[0_8px_30px_rgba(28,25,23,0.05)] border border-[#1C1917]/[0.06] flex items-center justify-between"
      >
        {/* Left: Brand identity with Logo and font-serif satat. wordmark */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <Logo size={20} className="rounded-md transition-transform duration-200 group-hover:scale-105" priority />
          <span className="font-serif font-bold text-lg text-[#1C1917]">
            satat.
          </span>
        </Link>

        {/* Center: Desktop anchor links */}
        <div className="hidden md:flex items-center gap-8 text-xs font-medium text-[#57534E]">
          <a href="#rhythm" className="hover:text-[#1C1917] transition-colors py-1">
            Rhythm
          </a>
          <a href="#orbit" className="hover:text-[#1C1917] transition-colors py-1">
            Orbit
          </a>
          <a href="#proof" className="hover:text-[#1C1917] transition-colors py-1">
            Proof
          </a>
        </div>

        {/* Right: Actions with prominent large CTA buttons */}
        <div className="flex items-center gap-3">
          {session ? (
            <Link
              href="/dashboard"
              className="bg-[#191D1A] hover:bg-[#2A302C] text-white rounded-full px-6 py-2.5 text-xs sm:text-sm font-semibold shadow-sm transition-all inline-flex items-center justify-center gap-1.5 active:scale-95 min-h-[44px]"
            >
              <span>Dashboard</span>
              <span className="text-xs">→</span>
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#1C1917] hover:bg-[#EFECE4] rounded-full transition-all min-h-[44px] inline-flex items-center justify-center cursor-pointer"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full px-7 py-3 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap min-h-[44px]"
              >
                <span>Start free</span>
                <span className="text-xs sm:text-sm">→</span>
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
