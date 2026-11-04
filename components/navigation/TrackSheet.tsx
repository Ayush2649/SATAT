"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Utensils, Dumbbell, CheckSquare, X } from "lucide-react";
import { Orbit3DCore } from "@/components/orbit/Orbit3DCore";

interface TrackSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TrackSheet({ isOpen, onClose }: TrackSheetProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  const handleAction = (route: string) => {
    onClose();
    router.push(route);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        data-backdrop="true"
        className="fixed inset-0 backdrop-blur-md transition-opacity"
        style={{ backgroundColor: "rgba(10, 13, 11, 0.58)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Content */}
      <div
        className="relative w-full sm:max-w-md bg-[#191D1A] text-[#FCFBF9] rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 z-10 shadow-2xl border border-white/[0.08] animate-slide-up"
        role="dialog"
        aria-label="Quick Track Actions"
      >
        {/* Mobile handle indicator */}
        <div className="w-10 h-1 rounded-full mx-auto mb-4 bg-white/20 sm:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#E05A47]">
                SATAT INSTANT CAPTURE
              </span>
              <span className="text-[10px] text-stone-400 font-semibold bg-white/[0.06] px-2 py-0.5 rounded-full">
                4 Quick Paths
              </span>
            </div>
            <h2 className="font-serif italic text-2xl sm:text-3xl text-white mt-1 leading-tight">
              What are we logging right now?
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close track sheet"
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2x2 Action Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {/* 1. Scan Meal Plate */}
          <button
            onClick={() => handleAction("/dashboard/diet?action=scan")}
            className="group relative h-32 rounded-2xl overflow-hidden p-3 text-left border border-white/[0.08] flex flex-col justify-between transition-transform active:scale-[0.98] cursor-pointer"
          >
            <img
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=75"
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:opacity-45 group-hover:scale-105 transition-all duration-300 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141715] via-[#141715]/60 to-transparent pointer-events-none" />
            <div className="relative z-10 w-7 h-7 rounded-lg bg-white/[0.12] backdrop-blur-xs flex items-center justify-center text-white">
              <Utensils className="w-3.5 h-3.5" />
            </div>
            <div className="relative z-10">
              <p className="font-bold text-xs text-white leading-tight">Scan Meal Plate</p>
              <p className="text-[10px] text-stone-300 mt-0.5">Instant AI Vision · Fuel</p>
            </div>
          </button>

          {/* 2. Start Workout */}
          <button
            onClick={() => handleAction("/dashboard/workout")}
            className="group relative h-32 rounded-2xl overflow-hidden p-3 text-left border border-white/[0.08] flex flex-col justify-between transition-transform active:scale-[0.98] cursor-pointer"
          >
            <img
              src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=300&q=75"
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:opacity-45 group-hover:scale-105 transition-all duration-300 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141715] via-[#141715]/60 to-transparent pointer-events-none" />
            <div className="relative z-10 w-7 h-7 rounded-lg bg-[#2D6A4F]/60 backdrop-blur-xs flex items-center justify-center text-[#6EE7B7]">
              <Dumbbell className="w-3.5 h-3.5" />
            </div>
            <div className="relative z-10">
              <p className="font-bold text-xs text-white leading-tight">Start Workout</p>
              <p className="text-[10px] text-stone-300 mt-0.5">Training Studio · Train</p>
            </div>
          </button>

          {/* 3. Deep Work Task */}
          <button
            onClick={() => handleAction("/dashboard/tasks?action=new")}
            className="group relative h-32 rounded-2xl overflow-hidden p-3 text-left border border-white/[0.08] flex flex-col justify-between transition-transform active:scale-[0.98] cursor-pointer"
          >
            <img
              src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=300&q=75"
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:opacity-45 group-hover:scale-105 transition-all duration-300 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141715] via-[#141715]/60 to-transparent pointer-events-none" />
            <div className="relative z-10 w-7 h-7 rounded-lg bg-[#E05A47]/40 backdrop-blur-xs flex items-center justify-center text-[#FADCD5]">
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
            <div className="relative z-10">
              <p className="font-bold text-xs text-white leading-tight">Deep Work Task</p>
              <p className="text-[10px] text-stone-300 mt-0.5">Execution Studio · Plan</p>
            </div>
          </button>

          {/* 4. Ask Orbit AI */}
          <button
            onClick={() => handleAction("/dashboard/orbit")}
            className="group relative h-32 rounded-2xl overflow-hidden p-3 text-left border border-[#34D399]/30 hover:border-[#34D399]/50 flex flex-col justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-lg"
          >
            {/* Real high-contrast atmospheric deep-space / neural photograph */}
            <img
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80"
              alt=""
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80";
              }}
              className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:scale-105 transition-transform duration-500 pointer-events-none"
            />
            {/* Dark botanical gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D1310] via-[#121C17]/75 to-[#192820]/40 pointer-events-none" />

            {/* Top-Left Badge: Live animated 3D Orbit3DCore in sleek rounded-xl dark container */}
            <div className="relative z-10 w-9 h-9 rounded-xl bg-[#191D1A]/90 border border-[#34D399]/30 flex items-center justify-center shadow-md shrink-0">
              <Orbit3DCore size="sm" state="idle" />
            </div>

            {/* Bottom text */}
            <div className="relative z-10">
              <p className="font-bold text-sm text-white leading-tight">Ask Orbit AI</p>
              <p className="text-[11px] text-[#6EE7B7] mt-0.5">Unified Copilot · Orbit</p>
            </div>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
