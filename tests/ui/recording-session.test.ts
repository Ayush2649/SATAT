import { afterEach, describe, expect, it, vi } from "vitest";
import { createRecordingSession } from "@/lib/media/recording-session";
function fixture() {
  const track = { readyState: "live", stop: vi.fn(() => { track.readyState = "ended"; }) };
  const stream = { getTracks: () => [track] } as unknown as MediaStream;
  const recorder: any = { state: "inactive", mimeType: "audio/webm", start: vi.fn(() => { recorder.state = "recording"; }), stop: vi.fn(() => { recorder.state = "inactive"; recorder.onstop?.(); }) };
  const callbacks = { onStream: vi.fn(), onSeconds: vi.fn(), onComplete: vi.fn() };
  const getStream = vi.fn(async () => stream), makeRecorder = vi.fn(() => recorder);
  return { track, stream, recorder, callbacks, getStream, makeRecorder, controller: createRecordingSession({ ...callbacks, getStream, makeRecorder }) };
}
afterEach(() => vi.useRealTimers());
describe("Microphone lifecycle", () => {
  it("releases a permission grant that arrives after the modal closes", async () => {
    const f = fixture(); let grant!: (stream: MediaStream) => void;
    f.getStream.mockImplementationOnce(() => new Promise(resolve => { grant = resolve; }));
    const pending = f.controller.start(); f.controller.dispose(); grant(f.stream); await pending;
    expect(f.track.stop).toHaveBeenCalledOnce(); expect(f.makeRecorder).not.toHaveBeenCalled(); expect(f.callbacks.onComplete).not.toHaveBeenCalled();
  });
  it("releases the microphone when recorder construction fails", async () => {
    const f = fixture(); f.makeRecorder.mockImplementationOnce(() => { throw new DOMException("unsupported", "NotSupportedError"); });
    expect(await f.controller.start()).toContain("not supported"); expect(f.track.stop).toHaveBeenCalledOnce();
  });
  it("shares a pending permission request, safely stops once and delivers the final blob", async () => {
    vi.useFakeTimers(); const f = fixture(); const first = f.controller.start(), second = f.controller.start();
    expect(first).toBe(second); await first; expect(f.getStream).toHaveBeenCalledOnce();
    f.recorder.ondataavailable({ data: new Blob(["isolated test audio"]) });
    f.controller.stop(); f.controller.stop();
    expect(f.recorder.stop).toHaveBeenCalledOnce(); expect(f.callbacks.onComplete).toHaveBeenCalledOnce(); expect(f.track.stop).toHaveBeenCalledOnce();
  });
  it("does not submit audio when an active recording is disposed", async () => {
    vi.useFakeTimers(); const f = fixture(); await f.controller.start(); f.controller.dispose(); vi.advanceTimersByTime(5000);
    expect(f.callbacks.onComplete).not.toHaveBeenCalled(); expect(f.track.stop).toHaveBeenCalledOnce(); expect(f.callbacks.onSeconds).toHaveBeenCalledTimes(1);
  });
});
