import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AudioWaveformVisualizer from "@/components/ui/AudioWaveformVisualizer";

describe("AudioWaveformVisualizer", () => {
  it("renders Apple Voice Memo waveform bars and blue playhead needle", () => {
    const html = renderToStaticMarkup(
      React.createElement(AudioWaveformVisualizer, {
        isRecording: true,
      })
    );
    // Dark background card
    expect(html).toContain("bg-[#1C1C1E]");
    // Red bars on left (recorded audio)
    expect(html).toContain("bg-[#FF3B30]");
    // White bars on right (incoming audio)
    expect(html).toContain("bg-white/90");
    // Blue playhead needle
    expect(html).toContain("bg-[#0A84FF]");
  });

  it("renders idle state safely without crashing", () => {
    const html = renderToStaticMarkup(
      React.createElement(AudioWaveformVisualizer, {
        isRecording: false,
      })
    );
    expect(html).toContain("Voice memo waveform");
  });
});
