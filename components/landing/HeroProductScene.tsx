"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/lib/useReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const ROTATING_NAMES = ["Ayush", "Riya", "Arjun", "Sana"];

export default function HeroProductScene() {
  const [nameIndex, setNameIndex] = useState(0);
  const [animPhase, setAnimPhase] = useState<"idle" | "exit" | "enter">("idle");
  const sceneRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGPathElement>(null);
  const prefersReduced = useReducedMotion();

  // Rotating greeting names cycle
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    let exitTimer: NodeJS.Timeout;
    let enterTimer: NodeJS.Timeout;

    const interval = setInterval(() => {
      setAnimPhase("exit");

      exitTimer = setTimeout(() => {
        setNameIndex((prev) => (prev + 1) % ROTATING_NAMES.length);
        setAnimPhase("enter");

        enterTimer = setTimeout(() => {
          setAnimPhase("idle");
        }, 40);
      }, 350);
    }, 2800);

    return () => {
      clearInterval(interval);
      clearTimeout(exitTimer);
      clearTimeout(enterTimer);
    };
  }, []);

  // GSAP Entrance & Ambient Animations
  useGSAP(
    () => {
      if (prefersReduced) return;

      // Phone entrance float
      if (phoneRef.current) {
        gsap.from(phoneRef.current, {
          y: 45,
          opacity: 0.7,
          scale: 0.97,
          duration: 1.1,
          ease: "power3.out",
          delay: 0.3,
        });
      }

      // Consistency ring draw-in animation
      if (ringRef.current) {
        gsap.fromTo(
          ringRef.current,
          { strokeDashoffset: 100 },
          {
            strokeDashoffset: 0,
            duration: 1.4,
            ease: "power2.out",
            delay: 0.6,
          }
        );
      }

      // Ambient radial glow breathing — paused when offscreen to preserve GPU cycles
      if (glowRef.current && sceneRef.current) {
        const glowTween = gsap.to(glowRef.current, {
          scale: 1.08,
          opacity: 0.45,
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        ScrollTrigger.create({
          trigger: sceneRef.current,
          start: "top bottom",
          end: "bottom top",
          onLeave: () => glowTween.pause(),
          onEnterBack: () => glowTween.play(),
          onLeaveBack: () => glowTween.pause(),
          onEnter: () => glowTween.play(),
        });
      }
    },
    { scope: sceneRef, dependencies: [prefersReduced] }
  );

  // 3D Pointer Micro-Tilt Parallax
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReduced || !phoneRef.current || !sceneRef.current) return;
    if (typeof window !== "undefined" && !window.matchMedia("(pointer: fine)").matches) {
      return; // Skip on coarse/touch screens
    }

    const rect = sceneRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

    gsap.to(phoneRef.current, {
      rotateY: x * 7,
      rotateX: -y * 7,
      transformPerspective: 1200,
      transformOrigin: "center center",
      duration: 0.4,
      ease: "power2.out",
      overwrite: "auto",
    });

    if (glowRef.current) {
      gsap.to(glowRef.current, {
        x: x * 25,
        y: y * 25,
        duration: 0.5,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const handlePointerLeave = () => {
    if (prefersReduced || !phoneRef.current) return;

    gsap.to(phoneRef.current, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.8,
      ease: "power3.out",
      overwrite: "auto",
    });

    if (glowRef.current) {
      gsap.to(glowRef.current, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        overwrite: "auto",
      });
    }
  };

  const getGreetingStyle = (): React.CSSProperties => {
    if (animPhase === "exit") {
      return {
        transform: "translateY(-5px)",
        opacity: 0,
        transition: "transform 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 350ms ease-out",
      };
    }
    if (animPhase === "enter") {
      return {
        transform: "translateY(5px)",
        opacity: 0,
        transition: "none",
      };
    }
    return {
      transform: "translateY(0px)",
      opacity: 1,
      transition: "transform 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 350ms ease-out",
    };
  };

  return (
    <div
      ref={sceneRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-hidden="true"
      className="relative w-full max-w-4xl mx-auto mt-10 sm:mt-14 flex items-center justify-center [perspective:1200px]"
    >
      {/* Soft Ambient Radial Behind Phone — restrained to phone silhouette */}
      <div
        ref={glowRef}
        className="absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full pointer-events-none opacity-25 blur-2xl"
        style={{
          background: "radial-gradient(circle, var(--accent-soft) 0%, transparent 65%)",
        }}
      />

      {/* ── Modern Smartphone Frame (~19.5:9 Aspect Ratio) ── */}
      <div
        ref={phoneRef}
        className="relative z-10 w-[310px] sm:w-[340px] aspect-[9/19.2] max-h-[710px] rounded-[48px] sm:rounded-[54px] bg-[#1C201E] p-2.5 sm:p-3 shadow-[0_28px_65px_-15px_rgba(23,61,50,0.22),_0_12px_28px_-6px_rgba(23,26,23,0.12)] border border-[#2D3330] ring-1 ring-white/10 select-none"
      >
        {/* Inner Device Screen */}
        <div className="relative w-full h-full rounded-[38px] sm:rounded-[44px] bg-[var(--background)] overflow-hidden flex flex-col justify-between border border-[var(--border)] text-left">
          {/* Top Hardware Bezel: Dynamic Island & Status Bar */}
          <div className="relative w-full pt-3 px-5 sm:px-6 pb-1.5 shrink-0 flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] select-none">
            {/* Left: Time */}
            <span className="font-semibold tracking-tight text-[var(--text-secondary)]">
              9:41
            </span>

            {/* Center: Believable Modern iPhone Dynamic Island (Independent & Centered) */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2.5 sm:top-3 w-[110px] sm:w-[118px] h-[25px] sm:h-[27px] bg-[#111412] rounded-full flex items-center justify-end pr-2.5 sm:pr-3 gap-1.5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.06)] border border-white/[0.07] pointer-events-none">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1A221E] border border-[#28362F]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#102219]" />
            </div>

            {/* Right: Status cluster (5G + Battery horizontally aligned & vertically centered) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-semibold tracking-wider text-[var(--text-secondary)] leading-none">
                5G
              </span>
              <div className="flex items-center">
                <div className="w-[18px] h-[9px] rounded-[3px] border border-[var(--text-secondary)]/80 p-[1px] flex items-center">
                  <div className="h-full w-2.5 bg-[var(--text-secondary)] rounded-[1.5px]" />
                </div>
                <div className="w-[1px] h-[4px] bg-[var(--text-secondary)]/80 rounded-r-xs" />
              </div>
            </div>
          </div>

          {/* Phone Screen Content (Continuous & Clipped Naturally Near Tab Bar) */}
          <div className="px-3.5 sm:px-4 py-1.5 space-y-2 flex-1 overflow-hidden">
            {/* 1. Compact Editorial Greeting with Animated Name */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] animate-pulse shrink-0" />
                <div className="flex items-center gap-1 text-[13px] sm:text-sm font-semibold tracking-tight text-[var(--text-primary)] font-display overflow-hidden">
                  <span className="shrink-0">Good morning,</span>
                  <span
                    style={getGreetingStyle()}
                    className="inline-block text-[var(--brand)] font-bold will-change-transform will-change-opacity"
                  >
                    {ROTATING_NAMES[nameIndex]}
                  </span>
                </div>
              </div>

              {/* Micro Day Label */}
              <span className="font-mono text-[9px] text-[var(--text-muted)] px-2 py-0.5 rounded-md bg-[var(--surface-subtle)] shrink-0">
                Day 24
              </span>
            </div>

            {/* 2. Consistency Ring Card */}
            <div className="p-2.5 sm:p-3 rounded-[16px] bg-[var(--surface)] border border-[var(--border)] shadow-xs flex items-center gap-3">
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0">
                <svg className="w-10 h-10 sm:w-11 sm:h-11 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[var(--border-subtle)]"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    ref={ringRef}
                    className="text-[var(--brand)]"
                    strokeDasharray="87, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-mono text-[10px] sm:text-[11px] font-bold text-[var(--text-primary)]">
                  87%
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-mono text-[var(--text-muted)] uppercase tracking-wider text-[9px]">
                    Consistency
                  </span>
                  <span className="text-[var(--success)] font-semibold text-[10px]">On Track</span>
                </div>
                <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  24-Day Streak Unbroken
                </div>
              </div>
            </div>

            {/* 3. Today's Focus: Upper Body A */}
            <div className="p-2.5 sm:p-3 rounded-[16px] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                  Today&apos;s Focus
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[var(--brand-subtle)] text-[var(--brand)] font-semibold">
                  45 min
                </span>
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                  Upper Body A
                </div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  Hypertrophy &amp; Scapular Stability
                </div>
              </div>

              {/* Key Movements */}
              <div className="pt-1.5 border-t border-[var(--border-subtle)] space-y-1 text-[10px] text-[var(--text-secondary)]">
                <div className="flex justify-between">
                  <span>Incline DB Press</span>
                  <span className="font-mono text-[var(--text-muted)]">3 × 8-10 · 28kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Chest Supported Row</span>
                  <span className="font-mono text-[var(--text-muted)]">3 × 10-12 · 32kg</span>
                </div>
              </div>
            </div>

            {/* 4. Nutrition Telemetry Card */}
            <div className="p-2.5 sm:p-3 rounded-[16px] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                  Nutrition
                </span>
                <span className="font-mono text-[10px] text-[var(--text-primary)] font-bold">
                  1,840 <span className="text-[var(--text-muted)] font-normal">/ 2,300 kcal</span>
                </span>
              </div>

              {/* Macro Bars */}
              <div className="space-y-1 pt-0.5">
                <div>
                  <div className="flex justify-between text-[9px] text-[var(--text-muted)] mb-0.5">
                    <span>Protein (142g / 180g)</span>
                    <span className="font-mono font-medium">78%</span>
                  </div>
                  <div className="w-full bg-[var(--surface-subtle)] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[var(--brand)] h-full rounded-full" style={{ width: "78%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[9px] text-[var(--text-muted)] mb-0.5">
                    <span>Carbs (195g / 240g)</span>
                    <span className="font-mono font-medium">81%</span>
                  </div>
                  <div className="w-full bg-[var(--surface-subtle)] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[var(--accent)] h-full rounded-full" style={{ width: "81%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Routine Continuity / Daily Anchors */}
            <div className="p-2.5 sm:p-3 rounded-[16px] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                  Routine Continuity
                </span>
                <span className="font-mono text-[9px] text-[var(--brand)] font-semibold">
                  2 / 3 done
                </span>
              </div>

              <div className="space-y-1 pt-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-[8px] font-bold shrink-0">
                      ✓
                    </span>
                    <span className="text-[var(--text-secondary)] line-through">
                      10m Morning Mobility
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-[var(--text-muted)]">07:00</span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-[8px] font-bold shrink-0">
                      ✓
                    </span>
                    <span className="text-[var(--text-secondary)] line-through">
                      3L Hydration Target
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-[var(--text-muted)]">2.4L</span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border border-[var(--border-strong)] flex items-center justify-center text-[8px] shrink-0" />
                    <span className="text-[var(--text-primary)] font-medium">
                      Evening Wind-Down
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-[var(--text-muted)]">21:30</span>
                </div>
              </div>
            </div>

            {/* 6. Compact SATAT Streak Momentum Element (Closes Gap Above Tab Bar) */}
            <div className="p-2.5 sm:p-3 rounded-[16px] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                  Consistency Momentum
                </span>
                <span className="font-mono text-[9px] text-[var(--brand)] font-semibold">
                  +12.4% on-pace
                </span>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <div>
                  <div className="text-xs sm:text-sm font-bold text-[var(--text-primary)] font-mono">
                    24 Day Streak
                  </div>
                  <div className="text-[9px] text-[var(--text-secondary)]">
                    Zero skipped adaptation cycles
                  </div>
                </div>

                {/* Micro 7-Day Rhythm Cadence */}
                <div className="flex items-center gap-1 shrink-0">
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <span className="text-[7px] font-mono text-[var(--text-muted)]">{day}</span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          i <= 4
                            ? "bg-[var(--brand)]"
                            : i === 5
                            ? "bg-[var(--brand)]/80"
                            : "border border-[var(--border-strong)]"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Minimal Bottom Tab Capsule & Home Indicator */}
          <div className="px-5 pb-2.5 pt-2 shrink-0 bg-[var(--surface)] border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-around py-0.5 text-[9px] font-mono text-[var(--text-muted)]">
              <span className="text-[var(--brand)] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />
                Today
              </span>
              <span>Workouts</span>
              <span>Nutrition</span>
              <span>Orbit</span>
            </div>
            {/* iOS Home Bar */}
            <div className="w-24 h-1 bg-[var(--text-muted)]/40 rounded-full mx-auto mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
