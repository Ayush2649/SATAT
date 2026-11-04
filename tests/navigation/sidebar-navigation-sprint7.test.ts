import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Sprint 7.3, 7.4 & 7.5: Navigation, Profile Menu, Streak Positioning, & Unified Momentum Spline", () => {
  const navSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/Navigation.tsx"),
    "utf8"
  );
  const homeSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/dashboard/HomeView.tsx"),
    "utf8"
  );
  const chartSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/dashboard/ProgressTrendChart.tsx"),
    "utf8"
  );
  const cssSource = fs.readFileSync(
    path.resolve(__dirname, "../../styles/app-shell.css"),
    "utf8"
  );

  it("1. Inactive sidebar navigation items and workspaces have no background and no border", () => {
    expect(navSource).toContain("bg-transparent border border-transparent shadow-none");
    expect(cssSource).toContain("html.dark aside nav a:not([aria-current=\"page\"])");
    expect(cssSource).toContain("background-color: transparent !important;");
  });

  it("2. Orbit AI sidebar button is styled with Coral Ember (#E05A47) and not green", () => {
    expect(navSource).toContain("bg-[#E05A47]/12 dark:bg-[#E05A47]/18");
    expect(navSource).toContain("text-[#C84331] dark:text-[#FF7A68]");
    expect(navSource).toContain("border-[#E05A47]/30");
    expect(navSource).toContain("bg-[#E05A47] text-white border border-[#F87171]/40");
    expect(cssSource).toContain("aside nav a[data-orbit=\"true\"]:not([aria-current=\"page\"])");
    expect(cssSource).toContain("background-color: #E05A47 !important;");
  });

  it("3. Desktop and mobile profile menus use independent refs and handle clicks reliably", () => {
    expect(navSource).toContain("const desktopProfileRef = useRef<HTMLDivElement>(null);");
    expect(navSource).toContain("const mobileProfileRef = useRef<HTMLDivElement>(null);");
    expect(navSource).toContain('data-profile-menu="true"');
    expect(navSource).toContain('router.push("/dashboard/settings");');
  });

  it("4. Desktop streak badge is cleanly positioned in dedicated top-right slot above 7-day strip", () => {
    expect(homeSource).toContain("CIRCADIAN ALIGNMENT · {formatDateEyebrow()}");
    expect(homeSource).toContain("🔥 {activeStreakDays}d streak");
    expect(homeSource).toContain("Dedicated Top Eyebrow Row: Streak Pill Cleanly Positioned in Top-Right");
  });

  it("5. Weekly Momentum uses unified SVG coordinate space for curve and circular markers", () => {
    expect(chartSource).toContain("xCoords = [40, 148, 256, 364, 472, 580, 660]");
    expect(chartSource).toContain("const y = Math.round(98 - (src.score / 100) * 64);");
    expect(chartSource).toContain("viewBox=\"0 0 700 140\"");
    expect(chartSource).toContain("vectorEffect=\"non-scaling-stroke\"");
    expect(chartSource).toContain("circle cx={pt.x} cy={pt.y}");
  });
});
