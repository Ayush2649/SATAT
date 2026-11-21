"use client";
import { createRecordingSession } from "@/lib/media/recording-session";
import { useEffect, useRef, useState } from "react";

// Pick a MediaRecorder mime type the current browser actually supports
// (webm on Chrome/Android, mp4/aac on iOS Safari).
function pickMime(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

/**
 * Records mic audio via MediaRecorder. Calls `onComplete(blob)` when recording stops.
 * `start()` resolves to an error string on failure, or null on success.
 */
export function useAudioRecorder(onComplete: (blob: Blob) => void) {
  const [seconds, setSeconds] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const sessionRef = useRef<ReturnType<typeof createRecordingSession> | null>(null);
  const createSession = () => createRecordingSession({
    getStream: async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new DOMException("Audio recording unavailable", "NotSupportedError");
      }
      return navigator.mediaDevices.getUserMedia({ audio: true });
    },
    makeRecorder: stream => { const mime = pickMime(); return new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); },
    onStream: setStream, onSeconds: setSeconds,
    onComplete: blob => onCompleteRef.current(blob),
  });
  if (!sessionRef.current) sessionRef.current = createSession();
  useEffect(() => {
    if (!sessionRef.current) sessionRef.current = createSession();
    return () => { sessionRef.current?.dispose(); sessionRef.current = null; };
  }, []);
  return { seconds, stream, start: () => sessionRef.current!.start(), stop: () => sessionRef.current?.stop() };

}

/** Derive a sensible upload filename extension from a recorded blob's mime type. */
export function audioExt(type: string): string {
  if (type.includes("mp4") || type.includes("aac") || type.includes("m4a")) return "m4a";
  if (type.includes("mpeg") || type.includes("mp3")) return "mp3";
  if (type.includes("wav")) return "wav";
  return "webm";
}
