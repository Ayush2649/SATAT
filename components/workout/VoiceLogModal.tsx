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
  Activity,
} from "lucide-react";
import { generateId } from "@/lib/utils";
import { useAudioRecorder, audioExt } from "@/hooks/useAudioRecorder";
import AudioWaveformVisualizer from "@/components/ui/AudioWaveformVisualizer";
import type { ExerciseLog, CardioActivity, SetLog } from "@/types";

type Phase = "idle" | "recording" | "processing" | "review" | "error";

interface ParsedSet {
  reps: number;
  weight?: number;
  unit: string;
}
interface ParsedExercise {
  name: string;
  sets: ParsedSet[];
}
export interface ParsedCardio {
  activity: CardioActivity;
  durationMinutes: number;
  distanceKm?: number;
}

function setSummary(sets: ParsedSet[]): string {
  if (!sets.length) return "no sets";
  const allSame = sets.every(
    (s) => s.reps === sets[0].reps && s.weight === sets[0].weight && s.unit === sets[0].unit
  );
  const w = (s: ParsedSet) =>
    s.unit === "bodyweight" ? "BW" : s.weight != null ? `${s.weight}${s.unit}` : "—";
  if (allSame) {
    return `${sets.length} × ${sets[0].reps}${
      sets[0].unit === "bodyweight" ? " (BW)" : ` @ ${w(sets[0])}`
    }`;
  }
  return sets.map((s) => `${s.reps}@${w(s)}`).join(", ");
}

const CARDIO_LABEL: Record<string, string> = {
  walking: "Walking",
  running: "Running",
  cycling: "Cycling",
  hiking: "Hiking",
  mountain_climbing: "Mountain Climbing",
  swimming: "Swimming",
  jump_rope: "Jump Rope",
  elliptical: "Elliptical",
  stair_climbing: "Stair Climbing",
  rowing: "Rowing",
};

export default function VoiceLogModal({
  onAdd,
  onClose,
}: {
  onAdd: (exercises: ExerciseLog[], cardio: ParsedCardio[]) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [parsed, setParsed] = useState<ParsedExercise[]>([]);
  const [parsedCardio, setParsedCardio] = useState<ParsedCardio[]>([]);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const processAudio = async (blob: Blob) => {
    try {
      const fd = new FormData();
      fd.append("audio", blob, `workout.${audioExt(blob.type)}`);
      const res = await fetch("/api/voice-workout", { method: "POST", body: fd });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setPhase("error");
        return;
      }
      setTranscript(data.transcript || "");
      setParsed(Array.isArray(data.exercises) ? data.exercises : []);
      setParsedCardio(Array.isArray(data.cardio) ? data.cardio : []);
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
    setParsed([]);
    setParsedCardio([]);
    setError("");
    setPhase("idle");
  };

  const removeExercise = (i: number) => setParsed((prev) => prev.filter((_, idx) => idx !== i));
  const removeCardio = (i: number) => setParsedCardio((prev) => prev.filter((_, idx) => idx !== i));

  const handleAdd = () => {
    const logs: ExerciseLog[] = parsed.map((p) => ({
      id: generateId(),
      name: p.name,
      sets: (p.sets.length ? p.sets : [{ reps: 0, unit: "kg" }]).map((s) => {
        const isBw = s.unit === "bodyweight";
        const unit = (s.unit === "lbs" || s.unit === "bodyweight" ? s.unit : "kg") as ExerciseLog["sets"][number]["unit"];
        const set: SetLog = {
          id: generateId(),
          reps: Number(s.reps) || 0,
          unit,
          completed: false,
        };
        if (!isBw && s.weight != null && !Number.isNaN(Number(s.weight))) {
          set.weight = Number(s.weight);
        }
        return set;
      }),
    }));
    onAdd(logs, parsedCardio);
  };

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
        aria-label="Voice Workout Parser"
        className="relative w-full max-w-md bg-[#FCFBF9] text-[#1C1917] rounded-t-[32px] sm:rounded-[32px] max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl border border-[#1C1917]/10 animate-slide-up"
      >
        {/* Sticky Header */}
        <div className="shrink-0 px-5 pt-4 pb-3 bg-[#FCFBF9] border-b border-[#1C1917]/[0.06] flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#E05A47] block">
              TRAIN VOICE LOG
            </span>
            <h3 className="font-serif italic text-2xl text-[#1C1917] mt-0.5 leading-tight">
              Speak your workout
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
                Tap and describe your movements
              </p>
              <p className="text-xs text-[#57534E] mt-1.5 leading-relaxed px-4 max-w-xs mx-auto">
                For example:{" "}
                <span className="font-serif italic text-[#1C1917]">
                  “Bench press 3 sets of 10 at 60 kilos, then ran 5k in 30 minutes.”
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
                Transcribing &amp; parsing sets…
              </p>
              <p className="text-xs text-[#57534E] mt-1">
                Turning your speech into structured workout sets
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

              {parsed.length === 0 && parsedCardio.length === 0 ? (
                <div className="text-center py-6">
                  <p className="font-serif text-base text-[#1C1917]">
                    Couldn’t identify specific exercises
                  </p>
                  <p className="text-xs text-[#57534E] mt-1">
                    Try again and clearly state the movement, reps, and weight.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D6A4F]">
                    <Sparkles className="w-3.5 h-3.5" /> Found {parsed.length + parsedCardio.length} logged activity
                  </div>

                  <div className="space-y-2 max-h-[36dvh] overflow-y-auto no-scrollbar">
                    {parsed.map((ex, i) => (
                      <div
                        key={i}
                        className="bg-[#F6F3EC] rounded-2xl p-3 border border-[#1C1917]/[0.05] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-[#1C1917] truncate">{ex.name}</p>
                          <p className="text-[11px] text-[#57534E] mt-0.5">{setSummary(ex.sets)}</p>
                        </div>
                        <button
                          onClick={() => removeExercise(i)}
                          type="button"
                          className="text-[#8C857B] hover:text-[#E05A47] p-1.5 transition-colors cursor-pointer shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {parsedCardio.map((c, i) => (
                      <div
                        key={`c-${i}`}
                        className="bg-[#F6F3EC] rounded-2xl p-3 border border-[#1C1917]/[0.05] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                          <div>
                            <p className="font-bold text-xs text-[#1C1917]">
                              {CARDIO_LABEL[c.activity] || c.activity}
                            </p>
                            <p className="text-[11px] text-[#57534E] mt-0.5">
                              {c.durationMinutes} min{c.distanceKm ? ` · ${c.distanceKm} km` : ""}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeCardio(i)}
                          type="button"
                          className="text-[#8C857B] hover:text-[#E05A47] p-1.5 transition-colors cursor-pointer shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={reset}
                      type="button"
                      className="bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] flex-1 py-3 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Redo
                    </button>
                    <button
                      onClick={handleAdd}
                      type="button"
                      className="bg-[#E05A47] hover:bg-[#C94A38] text-white flex-1 py-3 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> Add to workout
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
