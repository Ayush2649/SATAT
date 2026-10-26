"use client";

import { useState, useMemo } from "react";
import { localDateString, todayString } from "@/lib/utils";
import type { Task, WorkoutSession, MealEntry, MacroGoals } from "@/types";

interface ProgressTrendChartProps {
  sessions?: WorkoutSession[];
  tasks?: Task[];
  allMeals?: MealEntry[];
  goals?: MacroGoals | null;
}

interface DayPoint {
  dateStr: string;
  dayLabel: string;
  score: number; // 0 to 100
  x: number;
  y: number;
  mealsCount: number;
  calories: number;
  workoutName?: string;
  tasksCount: number;
  isToday: boolean;
}

export default function ProgressTrendChart({
  sessions = [],
  tasks = [],
  allMeals = [],
  goals,
}: ProgressTrendChartProps) {
  const [range, setRange] = useState<"7D" | "30D" | "90D">("7D");
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);

  // Compute 100% dynamic points and KPIs based on real database records
  const chartData = useMemo(() => {
    const today = todayString();
    const numDays = range === "7D" ? 7 : range === "30D" ? 30 : 90;
    const targetKcal = goals?.calories || 2200;

    const rawDays: {
      dateStr: string;
      dayLabel: string;
      score: number;
      mealsCount: number;
      calories: number;
      workoutName?: string;
      tasksCount: number;
      isToday: boolean;
    }[] = [];

    const dowLabels = ["S", "M", "T", "W", "T", "F", "S"];

    for (let i = numDays - 1; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const ds = localDateString(dt);
      const isToday = ds === today;

      const dayMeals = allMeals.filter((m) => m.date === ds);
      const calories = dayMeals.reduce((acc, m) => acc + (m.macros?.calories || 0), 0);
      const daySessions = sessions.filter((s) => s.date === ds);
      const dayTasks = tasks.filter((t) => t.completedAt && localDateString(new Date(t.completedAt)) === ds);

      const hasMeal = dayMeals.length > 0;
      const hasWorkout = daySessions.length > 0;
      const hasTask = dayTasks.length > 0;

      // 0 to 100% adherence score for the day based on habits logged
      const score = Math.round(((hasMeal ? 1 : 0) + (hasWorkout ? 1 : 0) + (hasTask ? 1 : 0)) / 3 * 100);

      const workoutName = daySessions[0]?.summary && !daySessions[0]?.summary.startsWith("**") && daySessions[0]?.summary.length < 35
        ? daySessions[0]?.summary
        : (daySessions[0]?.exercises?.[0]?.name ? `${daySessions[0].exercises[0].name} +` : (hasWorkout ? "Session complete" : undefined));

      rawDays.push({
        dateStr: ds,
        dayLabel: dowLabels[dt.getDay()],
        score,
        mealsCount: dayMeals.length,
        calories,
        workoutName,
        tasksCount: dayTasks.length,
        isToday,
      });
    }

    // Average adherence across elapsed period
    const totalScore = rawDays.reduce((acc, d) => acc + d.score, 0);
    const avgAdherence = Math.round(totalScore / rawDays.length);
    const totalWorkouts = rawDays.filter((d) => !!d.workoutName).length;

    // Fuel calculation from real intake
    const daysWithMeals = rawDays.filter((d) => d.mealsCount > 0);
    const avgCalories = daysWithMeals.length > 0
      ? daysWithMeals.reduce((acc, d) => acc + d.calories, 0) / daysWithMeals.length
      : 0;

    let fuel = "Logging";
    if (avgCalories > 0) {
      if (avgCalories < targetKcal * 0.85) fuel = "Under Target";
      else if (avgCalories > targetKcal * 1.15) fuel = "Surplus";
      else fuel = "Balanced";
    }

    // Sample exactly 7 points across the range for the responsive SVG
    const sampledDays: DayPoint[] = [];
    const xCoords = [20, 66, 112, 158, 205, 252, 300];

    for (let j = 0; j < 7; j++) {
      const idx = Math.min(rawDays.length - 1, Math.round((j / 6) * (rawDays.length - 1)));
      const src = rawDays[idx];
      // Map score 0..100 to y=88..32
      const y = Math.round(88 - (src.score / 100) * 56);
      sampledDays.push({
        ...src,
        x: xCoords[j],
        y,
      });
    }

    // Find peak index (or default to today)
    let peakIdx = 0;
    let maxSc = -1;
    sampledDays.forEach((p, idx) => {
      if (p.score >= maxSc) {
        maxSc = p.score;
        peakIdx = idx;
      }
    });

    const peakDay = sampledDays[peakIdx];
    const defaultTip = peakDay
      ? `${peakDay.dayLabel}: ${peakDay.score}% · ${peakDay.workoutName || (peakDay.calories > 0 ? `${peakDay.calories} kcal` : (peakDay.score === 0 ? "Rest day" : "Active Flow"))}`
      : "Active Rhythm";

    return {
      adherence: `${avgAdherence}%`,
      strength: totalWorkouts > 0 ? `↑ +${Math.min(100, Math.round(totalWorkouts * 4.2))}%` : "0 sessions",
      fuel,
      points: sampledDays,
      peakIndex: peakIdx,
      defaultTooltip: defaultTip,
    };
  }, [range, sessions, allMeals, tasks, goals]);

  const activeIdx = selectedNodeIndex !== null ? selectedNodeIndex : chartData.peakIndex;
  const activePoint = chartData.points[activeIdx] || chartData.points[0];

  const tooltipText = useMemo(() => {
    if (selectedNodeIndex === null) return chartData.defaultTooltip;
    const p = chartData.points[selectedNodeIndex];
    if (!p) return chartData.defaultTooltip;
    const desc = p.workoutName
      ? p.workoutName
      : (p.calories > 0 ? `${p.calories} kcal` : (p.tasksCount > 0 ? `${p.tasksCount} tasks` : "Rest day"));
    return `${p.dayLabel}: ${p.score}% · ${desc}`;
  }, [selectedNodeIndex, chartData]);

  // Construct smooth cubic Bezier path for SVG
  const pathD = useMemo(() => {
    const pts = chartData.points;
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const midX = (p0.x + p1.x) / 2;
      d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [chartData.points]);

  const areaD = useMemo(() => {
    if (!pathD) return "";
    const pts = chartData.points;
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${pathD} L ${last.x} 110 L ${first.x} 110 Z`;
  }, [pathD, chartData.points]);

  return (
    <div className="bg-[#FCFBF9] rounded-[28px] p-5 border border-[#1C1917]/[0.06] shadow-xs">
      {/* 1. Header Row — Fixed Single-Line Title without truncation */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="shrink-0">
          <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-[#8C857B]">
            PROGRESS TRAJECTORY
          </div>
          <h2 className="font-serif text-[1.15rem] sm:text-xl text-[#1C1917] leading-tight whitespace-nowrap">
            Weekly Momentum
          </h2>
        </div>

        {/* 3-Pill Range Switcher */}
        <div className="bg-[#EFECE4] p-1 rounded-full inline-flex items-center gap-0.5 shrink-0">
          {(["7D", "30D", "90D"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRange(r);
                setSelectedNodeIndex(null);
              }}
              className={`rounded-full py-1 text-[10px] font-semibold transition-all ${
                range === r
                  ? "bg-[#191D1A] text-white px-3 font-bold shadow-xs"
                  : "text-[#8C857B] hover:text-[#1C1917] px-2.5"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 2. 3-Column KPI Strip */}
      <div className="bg-[#F6F3EC] rounded-2xl p-3 grid grid-cols-3 divide-x divide-[#1C1917]/[0.07] mt-4 text-center">
        {/* Column 1: Adherence */}
        <div className="px-2">
          <div className="text-[9px] font-bold tracking-wider uppercase text-[#8C857B]">
            ADHERENCE
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-0.5 text-xs font-bold text-[#1C1917]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
            <span>{chartData.adherence}</span>
          </div>
        </div>

        {/* Column 2: Strength */}
        <div className="px-2">
          <div className="text-[9px] font-bold tracking-wider uppercase text-[#8C857B]">
            STRENGTH
          </div>
          <div className="flex items-center justify-center gap-1 mt-0.5 text-xs font-bold text-[#1C1917]">
            <span className="text-[#2D6A4F]">{chartData.strength}</span>
          </div>
        </div>

        {/* Column 3: Fuel */}
        <div className="px-2">
          <div className="text-[9px] font-bold tracking-wider uppercase text-[#8C857B]">
            FUEL
          </div>
          <div className="mt-0.5 text-xs font-bold text-[#2D6A4F]">
            {chartData.fuel}
          </div>
        </div>
      </div>

      {/* 3. Smooth Bezier Area Curve SVG + Floating Tooltip */}
      <div className="mt-7 relative pt-4">
        {/* Floating Dark Tooltip Positioned Over Active Node */}
        <div
          className="absolute -top-1 bg-[#191D1A] text-white rounded-2xl px-3.5 py-1.5 text-[10px] font-semibold shadow-lg whitespace-nowrap z-10 pointer-events-none transition-all duration-300"
          style={{
            left: `${(activePoint.x / 320) * 100}%`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <span>{tooltipText}</span>
        </div>

        {/* Responsive Bezier SVG */}
        <svg
          viewBox="0 0 320 110"
          className="w-full h-28 overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="momentumWash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <path d={areaD} fill="url(#momentumWash)" />

          {/* Vertical dashed guide line from Active Node down to baseline */}
          <line
            x1={activePoint.x}
            y1={activePoint.y}
            x2={activePoint.x}
            y2="110"
            stroke="#2D6A4F"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.45"
            className="transition-all duration-300"
          />

          {/* Smooth Bezier Line Stroke */}
          <path
            d={pathD}
            stroke="#2D6A4F"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Interactive Clickable Nodes */}
          {chartData.points.map((pt, idx) => {
            const isSelected = idx === activeIdx;
            const isToday = pt.isToday;

            return (
              <g
                key={idx}
                className="cursor-pointer"
                onClick={() => setSelectedNodeIndex(idx)}
              >
                {/* Invisible larger hit target for mobile tapping */}
                <circle cx={pt.x} cy={pt.y} r="12" fill="transparent" />

                {isSelected ? (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5.5"
                    fill="#2D6A4F"
                    stroke="#FCFBF9"
                    strokeWidth="2.5"
                    className="transition-all"
                  />
                ) : isToday ? (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#E05A47"
                    className="transition-all"
                  />
                ) : (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="3.5"
                    fill="#FCFBF9"
                    stroke="#2D6A4F"
                    strokeWidth="2"
                    className="transition-all hover:scale-125"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Bottom X-Axis Day Labels */}
        <div className="grid grid-cols-7 text-center text-[10px] font-semibold mt-2 select-none">
          {chartData.points.map((pt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedNodeIndex(idx)}
              className={`transition-colors ${
                idx === activeIdx
                  ? "text-[#2D6A4F] font-bold"
                  : pt.isToday
                  ? "text-[#E05A47] font-bold"
                  : "text-[#8C857B] hover:text-[#1C1917]"
              }`}
            >
              {pt.dayLabel}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
