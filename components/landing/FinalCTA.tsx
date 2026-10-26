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
