"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Mic,
  Square,
  Loader2,
  X,
  Check,
  Trash2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useAudioRecorder, audioExt } from "@/hooks/useAudioRecorder";
import AudioWaveformVisualizer from "@/components/ui/AudioWaveformVisualizer";
import { resolveDishThumbnail } from "@/lib/diet/dishMatcher";
import type { MealMacros } from "@/types";

type Phase = "idle" | "recording" | "processing" | "review" | "error";

export interface ParsedMeal {
  name: string;
  macros: MealMacros;
}

export default function VoiceMealModal({
  onAdd,
  onClose,
}: {
  onAdd: (meals: ParsedMeal[]) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [meals, setMeals] = useState<ParsedMeal[]>([]);
  const [error, setError] = useState("");

  const processAudio = async (blob: Blob) => {
    try {
      const fd = new FormData();
      fd.append("audio", blob, `meal.${audioExt(blob.type)}`);
      const res = await fetch("/api/voice-meal", { method: "POST", body: fd });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setPhase("error");
        return;
      }
      setTranscript(data.transcript || "");
      setMeals(Array.isArray(data.meals) ? data.meals : []);
      setPhase("review");
    } catch {
      setError("Something went wrong processing your recording. Try again.");
      setPhase("error");
    }
  };

  const { seconds, start, stop, stream } = useAudioRecorder(processAudio);

  const startRecording = async () => {
    setError("");
    const err = await start();
    if (err) {
      setError(err);
      setPhase("error");
    } else {
      setPhase("recording");
    }
  };

  const stopRecording = () => {
    stop();
    setPhase("processing");
  };

  const reset = () => {
    setTranscript("");
    setMeals([]);
    setError("");
    setPhase("idle");
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const removeMeal = (i: number) => setMeals((prev) => prev.filter((_, idx) => idx !== i));

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60
  ).padStart(2, "0")}`;

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#191D1A]/65 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center sm:p-4 animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Voice Nourishment Parser"
        className="relative w-full max-w-md bg-[#FCFBF9] text-[#1C1917] rounded-t-[32px] sm:rounded-[32px] max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl border border-[#1C1917]/10 animate-slide-up"
      >
        {/* Sticky Header */}
        <div className="shrink-0 px-5 pt-4 pb-3 bg-[#FCFBF9] border-b border-[#1C1917]/[0.06] flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#E05A47] block">
              NATURAL VOICE PARSER
            </span>
            <h3 className="font-serif italic text-2xl text-[#1C1917] mt-0.5 leading-tight">
              Speak what you ate
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-[#EFECE4] text-[#57534E] rounded-full px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap">
              {phase === "recording" ? "Listening..." : "Tap mic to speak"}
            </span>
            <button
              onClick={onClose}
              type="button"
              className="w-8 h-8 rounded-full bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4 no-scrollbar">

        {/* ── Idle Phase ── */}
        {phase === "idle" && (
          <div className="text-center py-6">
            <button
              onClick={startRecording}
              type="button"
              className="w-20 h-20 rounded-full bg-[#E05A47] hover:bg-[#C94A38] text-white flex items-center justify-center mx-auto shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <Mic className="w-8 h-8" />
            </button>
            <p className="font-serif text-lg text-[#1C1917] mt-5">
              Tap and describe your meal naturally
            </p>
            <p className="text-xs text-[#57534E] mt-1.5 leading-relaxed px-4 max-w-xs mx-auto">
              For example:{" "}
              <span className="font-serif italic text-[#1C1917]">
                “Two rotis with dal tadka, a small bowl of curd, and a boiled egg.”
              </span>
            </p>
          </div>
        )}

        {/* ── Recording Phase (Apple Voice Memo 1:1) ── */}
        {phase === "recording" && (
          <div className="py-2 animate-fade-in space-y-4">
            {/* Top Timer & Status */}
            <div className="text-center">
              <span className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-[#1C1917] tabular-nums block">
                {mmss}
              </span>
              <span className="text-xs font-semibold text-[#E05A47] mt-1 inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#E05A47] animate-pulse" />
                Recording…
              </span>
            </div>

            {/* Apple Voice Memos Waveform Visualizer */}
            <div className="px-1">
              <AudioWaveformVisualizer stream={stream} isRecording={phase === "recording"} />
            </div>

            {/* Stop Action Button */}
            <div className="flex flex-col items-center justify-center pt-2">
              <button
                onClick={stopRecording}
                type="button"
                className="w-16 h-16 rounded-full bg-[#E05A47] hover:bg-[#C94A38] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
                aria-label="Stop recording"
              >
                <Square className="w-6 h-6 fill-current" />
              </button>
              <p className="text-xs text-[#8C857B] font-medium mt-2">
                Tap to finish
              </p>
            </div>
          </div>
        )}

        {/* ── Processing Phase ── */}
        {phase === "processing" && (
          <div className="text-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-[#2D6A4F] mx-auto" />
            <p className="font-serif text-lg text-[#1C1917] mt-4">
              Transcribing &amp; estimating macros…
            </p>
            <p className="text-xs text-[#57534E] mt-1">
              Extracting dishes and Indian nutritional references
            </p>
          </div>
        )}

        {/* ── Error Phase ── */}
        {phase === "error" && (
          <div className="text-center py-6">
            <p className="text-xs font-semibold text-[#C94A38] bg-[#FADCD5] p-3 rounded-2xl border border-[#E05A47]/20">
              {error}
            </p>
            <button
              onClick={reset}
              type="button"
              className="bg-[#EFECE4] text-[#1C1917] rounded-full px-4 py-2 text-xs font-semibold mt-4 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try again
            </button>
          </div>
        )}

        {/* ── Review Phase ── */}
        {phase === "review" && (
          <div className="space-y-4">
            {transcript && (
              <div className="bg-[#F6F3EC] rounded-2xl p-4 border border-[#1C1917]/[0.05]">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#8C857B] mb-1">
                  TRANSCRIPT HEARD
                </p>
                <p className="font-serif italic text-sm text-[#1C1917] leading-relaxed">
                  “{transcript}”
                </p>
              </div>
            )}

            {meals.length === 0 ? (
              <div className="text-center py-6">
                <p className="font-serif text-base text-[#1C1917]">
                  Couldn’t identify specific foods
                </p>
                <p className="text-xs text-[#57534E] mt-1">
                  Try again and clearly name the dish or ingredients.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D6A4F]">
                  <Sparkles className="w-3.5 h-3.5" /> AI estimated — review before logging
                </div>

                <div className="space-y-2.5 max-h-[38dvh] overflow-y-auto no-scrollbar">
                  {meals.map((m, i) => {
                    const thumb = resolveDishThumbnail(m.name);
                    return (
                      <div
                        key={i}
                        className="bg-[#F6F3EC] rounded-[22px] p-3 border border-[#1C1917]/[0.05] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#EFECE4]">
                            <img
                              src={thumb}
                              alt={m.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-[#1C1917] truncate leading-tight">
                              {m.name}
                            </p>
                            <p className="text-[10px] text-[#8C857B] mt-0.5 truncate">
                              {m.macros.calories} kcal · {m.macros.carbsG}g C · {m.macros.fatG}g F
                            </p>
                            <span className="bg-[#D1FAE5] text-[#1B4332] text-[9px] font-bold px-2 py-0.2 rounded-full inline-block mt-1">
                              {m.macros.proteinG}g Protein
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => removeMeal(i)}
                          type="button"
                          className="text-[#8C857B] hover:text-[#E05A47] p-2 transition-colors cursor-pointer shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={reset}
                type="button"
                className="flex-1 bg-[#EFECE4] text-[#1C1917] rounded-full py-3 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Redo
              </button>
              <button
                onClick={() => onAdd(meals)}
                disabled={meals.length === 0}
                type="button"
                className="flex-1 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-full py-3 text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Log All Items ({meals.length})
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>,
    document.body
  );
}
