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
    <section ref={sectionRef} className="py-12 sm:py-16 px-6 max-w-[920px] mx-auto">
      {/* Single rounded dark botanical card (Matching image_23a8c0.jpg) */}
      <div className="bg-[#191D1A] text-[#FCFBF9] rounded-[32px] p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden">
        {/* Subtle warm terracotta radial glow in top-right corner */}
        <div
          ref={glowRef}
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none opacity-25 blur-2xl"
          style={{
            background: "radial-gradient(circle, #E05A47 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-xl mx-auto">
          {/* Eyebrow (Centered) */}
          <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#6EE7B7] block mb-3.5 cta-eyebrow">
            ● START YOUR PRACTICE
          </span>

          {/* Headline (Centered in Instrument Serif) */}
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#FCFBF9] leading-[1.15] tracking-tight cta-headline">
            Build a body and routine you can{" "}
            <span className="italic text-[#6EE7B7]">actually keep.</span>
          </h2>

          {/* Body copy (Centered) */}
          <p className="text-xs sm:text-sm text-stone-300 mt-4 max-w-md mx-auto leading-relaxed font-normal cta-copy">
            No rigid streaks, no guilt, no isolated numbers. Just your daily life, moving in conscious rhythm.
          </p>

          {/* CTA Button: Centered Terracotta pill */}
          <div className="mt-8 flex justify-center cta-button-wrapper">
            <button
              ref={buttonRef}
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              className="bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <span>Begin in 60 seconds</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
