"use client";

import React, { useRef } from "react";
import { signIn } from "next-auth/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/lib/useReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export default function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const prefersReduced = useReducedMotion();

  useGSAP(
    () => {
      if (prefersReduced) return;

      // Header reveal — progressive enhancement, clearProps guarantees clean DOM
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 90%",
          once: true,
        },
        defaults: { ease: "power2.out" },
      });

      tl.fromTo(
        ".cta-eyebrow",
        { y: 14, opacity: 0.3 },
        { y: 0, opacity: 1, duration: 0.4, clearProps: "all" }
      )
        .fromTo(
          ".cta-headline",
          { y: 18, opacity: 0.3 },
          { y: 0, opacity: 1, duration: 0.5, clearProps: "all" },
          "-=0.2"
        )
        .fromTo(
          ".cta-copy",
          { y: 14, opacity: 0.3 },
          { y: 0, opacity: 1, duration: 0.4, clearProps: "all" },
          "-=0.2"
        )
        .fromTo(
          ".cta-button-wrapper",
          { y: 12, opacity: 0.3, scale: 0.98 },
          { y: 0, opacity: 1, scale: 1, duration: 0.4, clearProps: "all" },
          "-=0.2"
        )
        .fromTo(
          ".cta-subtext",
          { opacity: 0.3 },
          { opacity: 1, duration: 0.4, clearProps: "all" },
          "-=0.1"
        );

      // Ambient radial glow breathing — paused when offscreen
      if (glowRef.current && sectionRef.current) {
        const glowTween = gsap.to(glowRef.current, {
          scale: 1.15,
          opacity: 0.35,
          duration: 3.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          onLeave: () => glowTween.pause(),
          onEnterBack: () => glowTween.play(),
          onLeaveBack: () => glowTween.pause(),
          onEnter: () => glowTween.play(),
        });
      }
    },
    { scope: sectionRef, dependencies: [prefersReduced] }
  );

  // Magnetic micro-hover on CTA button
  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (prefersReduced || !buttonRef.current) return;
    if (typeof window !== "undefined" && !window.matchMedia("(pointer: fine)").matches) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);

    gsap.to(buttonRef.current, {
      x: x * 0.2,
      y: y * 0.2,
      duration: 0.25,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const handlePointerLeave = () => {
    if (prefersReduced || !buttonRef.current) return;

    gsap.to(buttonRef.current, {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: "elastic.out(1, 0.4)",
      overwrite: "auto",
    });
  };

  return (
    <section
      ref={sectionRef}
      id="cta"
      aria-label="Get Started with SATAT"
      className="py-18 sm:py-24 px-5 sm:px-6 border-t border-[var(--border)] bg-[var(--background)] relative overflow-hidden"
    >
      {/* Ambient Radial Soft Glow */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full pointer-events-none opacity-25 blur-3xl"
        style={{
          background: "radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Eyebrow */}
        <div className="cta-eyebrow inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--brand-subtle)] border border-[var(--border)] mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" aria-hidden="true" />
          <span className="type-eyebrow text-[var(--brand)]">
            THE INVITATION
          </span>
        </div>

        {/* Headline */}
        <h2 className="cta-headline type-display-l text-[var(--text-primary)] mb-5 font-sans">
          Start becoming more consistent.
        </h2>

        {/* Supporting Copy */}
        <p className="cta-copy type-body-lg text-[var(--text-secondary)] max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed font-normal">
          Your goals don&apos;t need another app.
          <br />
          They need a system.
        </p>

        {/* CTA Button */}
        <div className="cta-button-wrapper flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            ref={buttonRef}
            type="button"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full sm:w-auto btn-primary rounded-full px-9 py-4 text-base font-medium shadow-sm hover:shadow-md transition-shadow flex items-center justify-center gap-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
          >
            <span>Start building consistency</span>
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>

        {/* Clean Sub-Copy */}
        <p className="cta-subtext mt-5 text-xs text-[var(--text-muted)] font-mono">
          Free to use · No credit card required · Instant web access
        </p>
      </div>
    </section>
  );
}
