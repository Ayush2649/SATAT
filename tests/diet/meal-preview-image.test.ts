import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("BUG-06: Meal Preview Image Optimization & Next.js Image Compliance", () => {
  const dietPagePath = path.resolve(__dirname, "../../components/diet/DietPage.tsx");
  const dietPageSource = fs.readFileSync(dietPagePath, "utf8");

  it("1. Imports Image component from next/image", () => {
    expect(dietPageSource).toMatch(/import\s+(NextImage|Image)\s+from\s+["']next\/image["']/);
  });

  it("2. Eliminates raw <img> element for meal photo preview", () => {
    // The previous bug was: <img src={preview} alt="meal" className="w-full h-44 object-cover rounded-xl" ... />
    expect(dietPageSource).not.toMatch(/<img\s+[^>]*src=\{preview\}/);
  });

  it("3. Configures next/image with fill, unoptimized, and object-cover", () => {
    // Must use fill layout with unoptimized for data/blob URLs
    expect(dietPageSource).toMatch(/<(NextImage|Image)/);
    expect(dietPageSource).toContain("src={preview}");
    expect(dietPageSource).toContain("fill");
    expect(dietPageSource).toContain("unoptimized");
    expect(dietPageSource).toContain('className="object-cover"');
  });

  it("4. Maintains proper container dimensions and positioning for fill layout", () => {
    // Parent container must have relative positioning, explicit height (h-44), and overflow-hidden
    expect(dietPageSource).toContain('className="relative w-full h-44 rounded-xl overflow-hidden"');
  });

  it("5. Retains error handling and loading overlay z-index", () => {
    // Preserves error fallback callback
    expect(dietPageSource).toContain('onError={() => setError("Image preview not supported. Please select a JPG or PNG.")}');
    // Loading overlay is positioned above the image with z-10
    expect(dietPageSource).toContain('className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center gap-2 text-white z-10"');
  });

  it("6. Memory Hygiene (ARGON-05): Uses base64 data URLs via FileReader/Canvas without unmanaged URL.createObjectURL", () => {
    // DietPage resizes client-side using FileReader + canvas.toDataURL and sets preview to data: URL.
    // Confirms it never creates unmanaged blob: URLs with URL.createObjectURL.
    expect(dietPageSource).toContain("reader.readAsDataURL(file)");
    expect(dietPageSource).toContain("canvas.toDataURL(");
    expect(dietPageSource).toContain("setPreview(`data:${mimeType};base64,${base64}`)");
    expect(dietPageSource).not.toContain("URL.createObjectURL");
  });
});
