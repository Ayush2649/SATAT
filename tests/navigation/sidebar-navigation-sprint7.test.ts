import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Sprint 7.3 & 7.4: Sidebar Navigation, Profile Menu, Greeting, & Weekly Momentum", () => {
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

  it("4. Today greeting eyebrow and streak badge are on a single non-wrapping row", () => {
    expect(homeSource).toContain("flex items-center gap-3 flex-nowrap mb-2");
    expect(homeSource).toContain("whitespace-nowrap");
    expect(homeSource).toContain("CIRCADIAN ALIGNMENT · {formatDateEyebrow()}");
    expect(homeSource).toContain("🔥 {activeStreakDays}d streak");
  });

  it("5. Weekly Momentum uses monotone cubic curve, dampened Y band, and HTML circular nodes", () => {
    expect(chartSource).toContain("const yMin = 32;");
    expect(chartSource).toContain("const yMax = 82;");
    expect(chartSource).toContain("vectorEffect=\"non-scaling-stroke\"");
    expect(chartSource).toContain("rounded-full");
    expect(chartSource).toContain("top-0 right-2 sm:right-4");
  });
});
