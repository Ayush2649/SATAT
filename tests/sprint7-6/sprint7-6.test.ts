import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Sprint 7.6: Full Verification Suite", () => {
  const taskBoardSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/tasks/TaskBoard.tsx"),
    "utf8"
  );
  const workoutSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/workout/WorkoutPage.tsx"),
    "utf8"
  );
  const dietSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/diet/DietPage.tsx"),
    "utf8"
  );
  const homeSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/dashboard/HomeView.tsx"),
    "utf8"
  );
  const orbitSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/orbit/OrbitView.tsx"),
    "utf8"
  );
  const navSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/Navigation.tsx"),
    "utf8"
  );
  const skeletonsSource = fs.readFileSync(
    path.resolve(__dirname, "../../components/ui/PageSkeletons.tsx"),
    "utf8"
  );
  const tasksLoading = fs.readFileSync(
    path.resolve(__dirname, "../../app/dashboard/tasks/loading.tsx"),
    "utf8"
  );
  const workoutLoading = fs.readFileSync(
    path.resolve(__dirname, "../../app/dashboard/workout/loading.tsx"),
    "utf8"
  );
  const dietLoading = fs.readFileSync(
    path.resolve(__dirname, "../../app/dashboard/diet/loading.tsx"),
    "utf8"
  );
  const appShellCss = fs.readFileSync(
    path.resolve(__dirname, "../../styles/app-shell.css"),
    "utf8"
  );

  it("1. Focus timer ring stacks FLOW STATE and BLOCK 1/3 on two separate centered lines and has w-44 h-44 diameter", () => {
    expect(taskBoardSource).toContain("w-44 h-44");
    expect(taskBoardSource).toContain('viewBox="0 0 176 176"');
    expect(taskBoardSource).toContain("FLOW STATE");
    expect(taskBoardSource).toContain("BLOCK 1/3");
    expect(taskBoardSource).toContain("flex flex-col items-center justify-center text-center");
  });

  it("2. Workout template cards and badges have nocturnal botanical dark mode styles", () => {
    expect(workoutSource).toContain(
      "bg-[#191D1A]/85 backdrop-blur-md text-[#F4F1EA] border border-white/15 px-2.5 py-1 rounded-full text-[10px] font-bold"
    );
    expect(workoutSource).toContain(
      "bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.08] dark:border-white/[0.08] rounded-[28px] p-8 text-center"
    );
    expect(workoutSource).toContain(
      "bg-[#EFECE4] dark:bg-[#1E2621] text-[#2D6A4F] dark:text-[#6EE7B7]"
    );
  });

  it("3. Studio pages (Plan, Train, Fuel, Today, Orbit) expand to 100% full desktop width (max-w-none)", () => {
    expect(taskBoardSource).toContain("lg:max-w-none");
    expect(workoutSource).toContain("lg:max-w-none");
    expect(dietSource).toContain("lg:max-w-none");
    expect(homeSource).toContain("max-w-none");
    expect(orbitSource).toContain("max-w-none");
  });

  it("4. Page skeletons feature dark-mode shimmer classes, 12-column desktop grids, and route loaders", () => {
    expect(skeletonsSource).toContain("dark:bg-[#161C18]");
    expect(skeletonsSource).toContain("grid-cols-12");
    expect(skeletonsSource).toContain("lg:grid");
    expect(skeletonsSource).toContain("TodayPageSkeleton");
    expect(skeletonsSource).toContain("PlanPageSkeleton");
    expect(skeletonsSource).toContain("TrainPageSkeleton");
    expect(skeletonsSource).toContain("FuelPageSkeleton");

    expect(tasksLoading).toContain("<PlanPageSkeleton />");
    expect(workoutLoading).toContain("<TrainPageSkeleton />");
    expect(dietLoading).toContain("<FuelPageSkeleton />");

    expect(appShellCss).toContain('html.dark [class*="bg-[#E6E1D6]"]');
    expect(appShellCss).toContain("#161C18 !important;");
  });

  it("5. Navigation OS v2.4 badge and wordmark have dark mode native styling", () => {
    expect(navSource).toContain("OS v2.4");
    expect(navSource).toContain("dark:bg-[#1C221E]");
    expect(navSource).toContain("dark:text-[#9CA39E]");
    expect(navSource).toContain("text-[#1C1917] dark:text-[#F4F1EA]");
    expect(appShellCss).toContain("html.dark aside span[class*=\"rounded-full\"]");
  });
});
