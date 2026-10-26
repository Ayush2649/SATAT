"use client";

import React, { useState } from "react";
import { OrbitLivingOrb } from "@/components/orbit/OrbitLivingOrb";

export default function OrbitSection() {
  const [status, setStatus] = useState<"idle" | "accepted" | "deferred">("idle");
  const [loading, setLoading] = useState(false);

  const handleAction = (type: "accept" | "defer") => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStatus(type === "accept" ? "accepted" : "deferred");
    }, 280);
  };

  return (
    <section id="orbit" className="py-12 sm:py-16 px-5 sm:px-6 text-center">
      <div className="max-w-md sm:max-w-lg mx-auto">
        {/* Eyebrow */}
        <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#2D6A4F] block">
          QUIET GUIDANCE
        </span>

        {/* Title in Instrument Serif */}
        <h2 className="font-serif text-2xl sm:text-3xl text-[#1C1917] mt-1.5 mb-8">
          A companion, not a dashboard
        </h2>

        {/* Centered Orb (w-28 h-28 = 112px) */}
        <div className="flex justify-center my-6">
          <div className="w-28 h-28 flex items-center justify-center transition-transform hover:scale-105 duration-300">
            <OrbitLivingOrb
              size={112}
              state={status === "accepted" ? "success" : "idle"}
            />
          </div>
        </div>

        {/* Quote in Instrument Serif italic directly on canvas */}
        <blockquote className="font-serif italic text-xl sm:text-2xl text-[#1C1917] leading-relaxed max-w-xs mx-auto mt-8 mb-7 font-normal">
          &ldquo;You trained heavier than usual today. I added a bowl of Greek yogurt to tonight&apos;s dinner so you recover well.&rdquo;
        </blockquote>

        {/* Buttons */}
        {status === "idle" ? (
          <div className="max-w-[260px] mx-auto space-y-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction("accept")}
              className="w-full bg-[#2D6A4F] hover:bg-[#23533D] text-white rounded-full py-3.5 px-6 text-xs font-semibold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{loading ? "Rebalancing..." : "Accept adjustment ✓"}</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction("defer")}
              className="block mx-auto text-xs text-[#57534E] hover:text-[#1C1917] transition-colors py-1 cursor-pointer"
            >
              Keep dinner as is
            </button>
          </div>
        ) : (
          <div className="max-w-xs mx-auto animate-fade-in text-xs text-[#57534E]">
            {status === "accepted" ? (
              <p className="bg-[#E6F2EC] text-[#2D6A4F] px-4 py-2.5 rounded-full font-semibold">
                ✓ Adjustment confirmed. Recovery target satisfied.
              </p>
            ) : (
              <p className="bg-[#EFECE4] text-[#57534E] px-4 py-2.5 rounded-full font-medium">
                Understood. Caloric balance distributed to tomorrow.
              </p>
            )}
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="mt-3 text-[11px] text-[#E05A47] hover:underline"
            >
              Reset ↺
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
