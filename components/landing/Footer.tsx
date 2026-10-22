"use client";

import React from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer
      role="contentinfo"
      aria-label="Site Footer"
      className="border-t border-[var(--border)] py-10 sm:py-12 px-5 sm:px-6 bg-[var(--surface-subtle)] text-xs text-[var(--text-muted)]"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand & Core Positioning */}
        <div className="flex items-center gap-3">
          <Logo size={22} className="rounded-md" />
          <span className="font-display font-bold text-sm tracking-tight text-[var(--text-primary)]">
            SATAT
          </span>
          <span className="text-[var(--border-strong)]" aria-hidden="true">·</span>
          <span className="text-xs text-[var(--text-secondary)]">
            Progress, made continuous.
          </span>
        </div>

        {/* Minimal Meaningful Public Links */}
        <div className="flex items-center gap-6 text-xs text-[var(--text-secondary)]">
          <a href="#system" className="hover:text-[var(--text-primary)] transition-colors focus-visible:rounded py-1">
            System
          </a>
          <a href="#adaptation" className="hover:text-[var(--text-primary)] transition-colors focus-visible:rounded py-1">
            Adaptation
          </a>
          <a href="#orbit" className="hover:text-[var(--text-primary)] transition-colors focus-visible:rounded py-1">
            Orbit
          </a>
          <Link href="/signin" className="hover:text-[var(--text-primary)] transition-colors focus-visible:rounded py-1">
            Sign In
          </Link>
        </div>

        {/* Quiet Legal & Year */}
        <div className="text-[11px] font-mono text-[var(--text-muted)]">
          © {new Date().getFullYear()} SATAT · Continuous Human Improvement
        </div>
      </div>
    </footer>
  );
}
