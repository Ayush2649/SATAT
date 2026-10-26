"use client";

import React from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import Logo from "@/components/Logo";

export default function LandingNav() {
  const { data: session } = useSession();

  return (
    <header className="fixed top-3 inset-x-4 z-50 max-w-md md:max-w-4xl mx-auto pointer-events-none transition-all duration-300">
      <nav
        aria-label="Main Navigation"
        className="pointer-events-auto bg-[#FCFBF9]/85 backdrop-blur-md border border-[#1C1917]/[0.08] rounded-full px-4 py-2.5 shadow-sm flex items-center justify-between"
      >
        {/* Left: Brand identity with Logo and font-serif satat. wordmark */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <Logo size={22} className="rounded-md transition-transform duration-200 group-hover:scale-105" priority />
          <span className="font-serif text-xl tracking-tight text-[#1C1917]">
            satat.
          </span>
        </Link>

        {/* Center: Desktop anchor links */}
        <div className="hidden md:flex items-center gap-6 text-xs font-medium text-[#57534E]">
          <a href="#problem" className="hover:text-[#1C1917] transition-colors py-1">
            Rhythm
          </a>
          <a href="#orbit" className="hover:text-[#1C1917] transition-colors py-1">
            Orbit
          </a>
          <a href="#progress" className="hover:text-[#1C1917] transition-colors py-1">
            Proof
          </a>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {session ? (
            <Link
              href="/dashboard"
              className="bg-[#191D1A] hover:bg-[#2A302C] text-white rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm transition-all flex items-center gap-1 active:scale-95"
            >
              <span>Dashboard</span>
              <span className="text-xs">→</span>
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="text-xs font-medium text-[#57534E] hover:text-[#1C1917] px-2.5 py-1 transition-colors rounded-full"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-1"
              >
                <span>Start free</span>
                <span className="text-xs">→</span>
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
