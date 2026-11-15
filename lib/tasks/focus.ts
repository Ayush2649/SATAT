// Keep the existing task document shape: store the optional focus plan in notes.
export function taskFocusMinutes(description = ""): number | null {
  const value = Number(description.match(/(?:^|\n)Focus target: (\d+) min\s*$/)?.[1]);
  return Number.isFinite(value) && value >= 25 && value <= 150 && value % 25 === 0 ? value : null;
}

export function withFocusTarget(notes: string, blocks: number): string {
  const text = notes.replace(/(?:^|\n)Focus target: \d+ min\s*$/, "").trim();
  return [text, `Focus target: ${Math.min(6, Math.max(1, Math.round(blocks))) * 25} min`].filter(Boolean).join("\n");
}
