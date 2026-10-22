"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import Logo from "@/components/Logo";

const NAV_ITEMS = [
  { href: "#problem", label: "The Problem" },
  { href: "#system", label: "The System" },
  { href: "#adaptation", label: "Adaptation" },
  { href: "#orbit", label: "Orbit" },
  { href: "#progress", label: "Progress" },
];

export default function LandingNav() {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 16);

      // Active section detection
      const sections = ["problem", "system", "adaptation", "orbit", "progress"];
      let current = "";
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 140 && rect.bottom >= 140) {
            current = `#${id}`;
            break;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Skip to Main Content Link for WCAG 2.2 AA Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-[var(--brand)] focus:text-white focus:shadow-md focus:outline-none focus:ring-2 focus:ring-white text-xs font-semibold"
      >
        Skip to main content
      </a>

      <nav
        aria-label="Main Navigation"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled || mobileMenuOpen
            ? "bg-[#0B0E11]/95 backdrop-blur-sm border-b border-[var(--border)]"
            : "bg-[#0B0E11]/85 backdrop-blur-sm border-b border-[var(--border-subtle)]"
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Brand identity */}
          <Link
            href="/"
            aria-label="SATAT Home"
            className="flex items-center gap-2.5 group focus-visible:rounded-lg"
          >
            <Logo size={28} className="rounded-lg transition-transform duration-200 group-hover:scale-105" priority />
            <span className="font-display font-extrabold text-xl sm:text-2xl tracking-tight text-[var(--text-primary)]">
              SATAT
            </span>
          </Link>

          {/* Desktop Navigation Links — Crisp, high-contrast, zero blur smear */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--text-secondary)]">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={activeSection === item.href ? "page" : undefined}
                className={`transition-colors duration-150 py-1 focus-visible:rounded text-sm ${
                  activeSection === item.href
                    ? "text-[var(--brand)] font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Action Area & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {session ? (
              <Link
                href="/dashboard"
                className="btn-primary rounded-full px-5 py-2.5 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Dashboard</span>
                <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                  className="hidden sm:inline-flex text-xs sm:text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-3 py-2 cursor-pointer rounded-lg"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                  className="btn-primary rounded-full px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Start building consistency</span>
                  <span aria-hidden="true" className="text-sm">→</span>
                </button>
              </>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-full bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
            >
              {mobileMenuOpen ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            id="mobile-navigation"
            className="md:hidden border-t border-[var(--border)] bg-[var(--surface)] px-5 py-4 space-y-2 animate-slide-down"
          >
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === item.href
                    ? "bg-[var(--brand-subtle)] text-[var(--brand)] font-semibold"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]"
                }`}
              >
                {item.label}
              </a>
            ))}
            {!session && (
              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signIn("google", { callbackUrl: "/dashboard" });
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Sign in
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
