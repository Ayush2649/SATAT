"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useFirebaseAuth } from "@/components/FirebaseAuthProvider";
import { Utensils, Dumbbell, CheckSquare, Scale, X, Loader2, Check } from "lucide-react";
import { logBodyWeight } from "@/lib/firestore";
import { useToast } from "@/components/ui/Toast";

interface TrackSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TrackSheet({ isOpen, onClose }: TrackSheetProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { firebaseUser } = useFirebaseAuth();
  const userId = firebaseUser?.uid ?? (session?.user as any)?.id ?? session?.user?.email ?? "";
  const { toast } = useToast();

  const [weightKg, setWeightKg] = useState("");
  const [loggingWeight, setLoggingWeight] = useState(false);
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [weightSuccess, setWeightSuccess] = useState(false);
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

  const handleQuickWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(weightKg);
    if (isNaN(val) || val <= 0 || !userId) return;

    setLoggingWeight(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await logBodyWeight({
        userId,
        weightKg: val,
        date: today,
        createdAt: Date.now(),
      });
      setWeightSuccess(true);
      toast("Weight logged successfully", "success");
      setTimeout(() => {
        setWeightSuccess(false);
        setShowWeightInput(false);
        setWeightKg("");
        onClose();
      }, 700);
    } catch {
      toast("Failed to log weight", "error");
    } finally {
      setLoggingWeight(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#191D1A]/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Content (image_cc4f9d.jpg top half) */}
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

        {/* 2x2 Photo-Backed Action Grid */}
        {!showWeightInput ? (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* 1. Scan Meal Plate */}
            <button
              onClick={() => handleAction("/dashboard/diet?action=scan")}
              className="group relative h-32 rounded-2xl overflow-hidden p-3 text-left border border-white/[0.08] flex flex-col justify-between transition-transform active:scale-[0.98] cursor-pointer"
            >
              <img
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=75"
                alt=""
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

            {/* 4. Water & Biometrics */}
            <button
              onClick={() => setShowWeightInput(true)}
              className="group relative h-32 rounded-2xl overflow-hidden p-3 text-left border border-white/[0.08] flex flex-col justify-between transition-transform active:scale-[0.98] cursor-pointer"
            >
              <img
                src="https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=300&q=75"
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:opacity-45 group-hover:scale-105 transition-all duration-300 pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141715] via-[#141715]/60 to-transparent pointer-events-none" />
              <div className="relative z-10 w-7 h-7 rounded-lg bg-white/[0.12] backdrop-blur-xs flex items-center justify-center text-white">
                <Scale className="w-3.5 h-3.5" />
              </div>
              <div className="relative z-10">
                <p className="font-bold text-xs text-white leading-tight">Water &amp; Biometrics</p>
                <p className="text-[10px] text-stone-300 mt-0.5">74.1 kg · Daily Log</p>
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={handleQuickWeight} className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => setShowWeightInput(false)}
                className="text-xs font-semibold text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                ← Back
              </button>
              <span className="text-xs font-medium text-stone-300">
                Record Today&apos;s Body Weight
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="30"
                max="300"
                autoFocus
                placeholder="e.g. 74.5"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full bg-white/[0.06] rounded-2xl px-4 py-3 text-base font-bold text-white border border-white/[0.12] focus:outline-none focus:border-[#E05A47]"
              />
              <span className="absolute right-4 top-3.5 text-xs font-mono text-stone-400">
                kg
              </span>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowWeightInput(false)}
                className="flex-1 py-3 rounded-full text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.14] text-stone-300 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!weightKg || loggingWeight || weightSuccess}
                className="flex-1 py-3 rounded-full text-xs font-semibold bg-[#E05A47] hover:bg-[#C94A38] text-white flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
              >
                {loggingWeight ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : weightSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved</span>
                  </>
                ) : (
                  <span>Save Weight</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
