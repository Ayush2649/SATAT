"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AudioWaveformVisualizerProps {
  stream?: MediaStream | null;
  isRecording: boolean;
  className?: string;
  barCount?: number;
}

export default function AudioWaveformVisualizer({
  stream,
  isRecording,
  className,
  barCount = 37, // Odd count so center bar aligns with needle
}: AudioWaveformVisualizerProps) {
  const centerIndex = Math.floor(barCount / 2);

  // Symmetrical bar heights that scroll from right to left
  const [bars, setBars] = useState<number[]>(() =>
    Array.from({ length: barCount }, (_, i) => {
      const dist = Math.abs(i - centerIndex);
      return Math.max(10, Math.min(85, 78 - dist * 3.5));
    })
  );

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastPushTimeRef = useRef(0);

  // Setup Web Audio API Analyzer when stream is present
  useEffect(() => {
    if (!isRecording || !stream || typeof window === "undefined") {
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;
    } catch {
      // AudioContext fallback handles it safely
    }

    return () => {
      try {
        sourceRef.current?.disconnect();
        analyserRef.current?.disconnect();
        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
          audioContextRef.current.close().catch(() => {});
        }
      } catch {
        // ignore close error
      }
      sourceRef.current = null;
      analyserRef.current = null;
      audioContextRef.current = null;
    };
  }, [stream, isRecording]);

  // Main visualizer animation loop: streams live audio bars across the needle
  useEffect(() => {
    if (!isRecording) return;

    let active = true;
    const freqData = new Uint8Array(32);

    const tick = (now: number) => {
      if (!active) return;

      // Push new bar every ~65ms to scroll smoothly like Apple Voice Memos
      if (now - lastPushTimeRef.current > 65) {
        lastPushTimeRef.current = now;

        let currentAmp = 12;
        const t = now * 0.005;
        const organicMotion = Math.sin(t * 2.5) * 8 + Math.cos(t * 1.7) * 5 + 18;

        if (analyserRef.current) {
          try {
            analyserRef.current.getByteFrequencyData(freqData);
            let sum = 0;
            for (let i = 0; i < 16; i++) {
              sum += freqData[i];
            }
            const avg = sum / 16;
            const liveLevel = (avg / 255) * 110;
            currentAmp = Math.max(10, Math.min(95, liveLevel > 14 ? liveLevel * 1.25 : organicMotion));
          } catch {
            currentAmp = organicMotion;
          }
        } else {
          // Clean lively ECG rhythm simulation when running without active mic stream
          const sim = Math.sin(t) * 0.5 + Math.sin(t * 2.3) * 0.3;
          currentAmp = Math.max(12, Math.min(90, 22 + Math.abs(sim) * 68));
        }

        // Shift bars from right to left
        setBars((prev) => [...prev.slice(1), currentAmp]);
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording]);

  return (
    <div
      className={cn(
        "relative w-full h-32 sm:h-36 bg-[#1C1C1E] rounded-[28px] overflow-hidden flex items-center justify-center px-4 shadow-2xl border border-white/[0.08]",
        className
      )}
      aria-label="Apple Voice memo waveform visualizer"
    >
      {/* ── Symmetrical Audio Waveform Bars ── */}
      <div className="relative z-10 w-full h-full flex items-center justify-between gap-[2px] sm:gap-[3px]">
        {bars.map((heightPct, idx) => {
          const isPastNeedle = idx < centerIndex;
          const isAtNeedle = idx === centerIndex;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center justify-center h-full min-w-[2.5px] max-w-[5px]"
            >
              <div
                className={cn(
                  "w-full rounded-full transition-all duration-75",
                  isPastNeedle
                    ? "bg-[#FF3B30] shadow-[0_0_6px_rgba(255,59,48,0.3)]" // Red: Recorded audio left of needle (1:1 Apple Voice Memos)
                    : isAtNeedle
                    ? "bg-[#FF3B30] shadow-[0_0_10px_#FF3B30]"
                    : "bg-white/90" // White: Upcoming incoming audio right of needle
                )}
                style={{
                  height: `${Math.max(6, heightPct)}%`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ── Iconic Apple Blue Playhead Needle with Top & Bottom Beads ── */}
      <div className="absolute top-2.5 bottom-2.5 left-1/2 -translate-x-1/2 w-[2.5px] bg-[#0A84FF] z-20 pointer-events-none flex flex-col justify-between items-center shadow-[0_0_12px_rgba(10,132,255,0.85)]">
        {/* Top circular bead */}
        <div className="w-3 h-3 rounded-full bg-[#0A84FF] -mt-1 shadow-[0_0_8px_#0A84FF]" />
        {/* Bottom circular bead */}
        <div className="w-3 h-3 rounded-full bg-[#0A84FF] -mb-1 shadow-[0_0_8px_#0A84FF]" />
      </div>
    </div>
  );
}
