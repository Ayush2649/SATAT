/** Owns one recording and releases pending/active microphone streams on disposal. */
export function createRecordingSession(options: {
  getStream: () => Promise<MediaStream>;
  makeRecorder: (stream: MediaStream) => MediaRecorder;
  onStream: (stream: MediaStream | null) => void;
  onSeconds: (seconds: number) => void;
  onComplete: (blob: Blob) => void;
}) {
  let disposed = false, revision = 0;
  let stream: MediaStream | null = null, recorder: MediaRecorder | null = null;
  let pending: Promise<string | null> | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  const stopTracks = (value: MediaStream) => value.getTracks().forEach(track => { if (track.readyState !== "ended") track.stop(); });
  const release = () => {
    if (timer) clearInterval(timer); timer = null;
    if (stream) stopTracks(stream); stream = null;
    if (!disposed) options.onStream(null);
  };
  const record = async (): Promise<string | null> => {
    const token = ++revision;
    try {
      const next = await options.getStream();
      if (disposed || token !== revision) { stopTracks(next); return "Recording was cancelled."; }
      stream = next;
      recorder = options.makeRecorder(next);
      const currentRecorder = recorder, chunks: Blob[] = [];
      currentRecorder.ondataavailable = event => { if (!disposed && token === revision && event.data.size) chunks.push(event.data); };
      currentRecorder.onstop = () => {
        if (stream === next) release(); else stopTracks(next);
        if (!disposed && token === revision) options.onComplete(new Blob(chunks, { type: currentRecorder.mimeType || "audio/webm" }));
      };
      currentRecorder.start(); options.onStream(next); options.onSeconds(0);
      let seconds = 0; timer = setInterval(() => options.onSeconds(++seconds), 1000);
      return null;
    } catch (error) {
      release();
      const name = error instanceof Error ? error.name : "";
      if (name === "NotSupportedError") return "Audio recording is not supported in this browser. Try another browser or type your meal.";
      if (name === "NotFoundError") return "No microphone was found. Connect one or type your meal.";
      if (name === "NotAllowedError" || name === "SecurityError") return "Microphone access was blocked. Allow mic permission and try again.";
      return "Could not start recording. Check your microphone or type your meal.";
    }
  };
  return {
    start: () => {
      if (disposed) return Promise.resolve("Recording was cancelled.");
      if (pending) return pending;
      if (recorder?.state === "recording") return Promise.resolve(null);
      pending = record().finally(() => { pending = null; }); return pending;
    },
    stop: () => { if (recorder && recorder.state !== "inactive") recorder.stop(); release(); },
    dispose: () => { disposed = true; revision++; if (recorder && recorder.state !== "inactive") recorder.stop(); release(); },
  };
}
