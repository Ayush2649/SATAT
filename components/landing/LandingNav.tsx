"use client";

import React from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";

export default function LandingNav() {
  const { data: session } = useSession();

  return (
    <header className="fixed top-4 inset-x-0 z-50 px-4 sm:px-8 pointer-events-none">
      <nav
        aria-label="Main Navigation"
        className="pointer-events-auto max-w-[1440px] mx-auto bg-[#FCFBF9]/88 dark:bg-[#141916]/88 backdrop-blur-xl border border-[#1C1917]/[0.08] dark:border-white/[0.10] rounded-full px-4 sm:px-6 py-2.5 shadow-[0_10px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.55)] flex items-center justify-between"
      >
        {/* Left: Geometric S mark in a rounded circle + satat. */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#191D1A] dark:bg-[#2D6A4F] text-[#FCFBF9] flex items-center justify-center font-serif font-bold text-sm sm:text-base shadow-xs group-hover:scale-105 transition-transform">
            S
          </div>
          <span className="font-serif font-bold text-lg sm:text-xl text-[#1C1917] dark:text-[#F4F1EA]">
            satat.
          </span>
        </Link>

        {/* Center: Desktop anchor links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#57534E] dark:text-[#9CA39E]">
          <a href="#rhythm" className="hover:text-[#1C1917] dark:hover:text-[#F4F1EA] transition-colors py-1">
            Timeline
          </a>
          <a href="#snap" className="hover:text-[#1C1917] dark:hover:text-[#F4F1EA] transition-colors py-1">
            AI Snap
          </a>
          <a href="#orbit" className="hover:text-[#1C1917] dark:hover:text-[#F4F1EA] transition-colors py-1">
            Orbit
          </a>
          <a href="#proof" className="hover:text-[#1C1917] dark:hover:text-[#F4F1EA] transition-colors py-1">
            Proof
          </a>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {session ? (
            <Link
              href="/dashboard"
              className="bg-[#2D6A4F] hover:bg-[#23533D] text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>Dashboard</span>
              <span className="text-xs">→</span>
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-[#1C1917] dark:text-[#F4F1EA] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all cursor-pointer"
              >
                Sign in
              </button>
              <Link
                href="/onboarding"
                className="bg-[#E05A47] hover:bg-[#C94A38] text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all active:scale-95 whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Start free</span>
                <span className="text-xs sm:text-sm">→</span>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
