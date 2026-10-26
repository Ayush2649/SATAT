// components/landing/OrbitSection.tsx
"use client";

import React, { useState } from "react";
import { OrbitLivingOrb } from "@/components/orbit/OrbitLivingOrb";

export default function OrbitSection() {
  const [status, setStatus] = useState<"idle" | "accepted" | "deferred">("idle");

  return (
    <section
      id="orbit"
      className="py-16 sm:py-24 px-5 sm:px-6 bg-[#F6F3EC] text-center relative overflow-hidden"
    >
      <div className="max-w-md mx-auto flex flex-col items-center">
        {/* Eyebrow */}
        <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#2D6A4F]">
          QUIET GUIDANCE
        </span>

        {/* Title */}
        <h2 className="font-serif font-normal text-2xl sm:text-3xl text-[#1C1917] mt-1.5 mb-8">
          A companion, <span className="italic text-[#E05A47]">not a dashboard</span>
        </h2>

        {/* Living Botanical Orb */}
        <div className="my-2">
          <OrbitLivingOrb
            size="lg"
            mood={status === "accepted" ? "speaking" : "idle"}
          />
        </div>

        {/* Editorial Quote */}
        <blockquote className="font-serif italic text-xl sm:text-2xl text-[#1C1917] leading-relaxed max-w-xs mx-auto mt-7 mb-7">
          &ldquo;You trained heavier than usual today. I added a bowl of Greek
          yogurt to tonight&apos;s dinner so you recover well.&rdquo;
        </blockquote>

        {/* Interactive Action Buttons */}
        <div className="w-full max-w-[260px] space-y-2.5">
          <button
            type="button"
            onClick={() => setStatus("accepted")}
            className="w-full bg-[#2D6A4F] hover:bg-[#23533D] text-white rounded-full py-3.5 px-6 text-xs font-semibold shadow-sm transition-all"
          >
            {status === "accepted" ? "Adjustment applied ✓" : "Accept adjustment ✓"}
          </button>

          <button
            type="button"
            onClick={() => setStatus("deferred")}
            className="block w-full py-1.5 text-xs text-[#57534E] hover:text-[#1C1917] transition-colors"
          >
            {status === "deferred" ? "Kept dinner as is" : "Keep dinner as is"}
          </button>
        </div>

        {status === "accepted" && (
          <p className="mt-3 text-[11px] font-medium text-[#2D6A4F]">
            ✓ +28g protein added to tonight&apos;s dinner target.
          </p>
        )}
      </div>
    </section>
  );
}