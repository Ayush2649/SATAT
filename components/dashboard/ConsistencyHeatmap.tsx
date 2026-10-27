"use client";

import { useState, useMemo } from "react";
import { localDateString, todayString } from "@/lib/utils";
import type { Task, WorkoutSession, MealEntry } from "@/types";

interface ConsistencyHeatmapProps {
  sessions?: WorkoutSession[];
  tasks?: Task[];
  allMeals?: MealEntry[];
  streakDays?: number;
}

interface DayHabitData {
  dateStr: string;
  habitsCount: number; // 0, 1, 2, or 3
  meals: number;
  workouts: number;
  tasks: number;
  calories: number;
  mealSummary?: string;
  workoutSummary?: string;
  taskSummary?: string;
}

interface CalendarCell {
  dateStr: string;
  dayNum: number;
  isOverflow: boolean;
  isToday: boolean;
  tier: "rest" | "mid" | "target" | "today" | "overflow";
  habitsCount: number;
  mealSummary?: string;
  workoutSummary?: string;
  taskSummary?: string;
}

export default function ConsistencyHeatmap({
  sessions = [],
  tasks = [],
  allMeals = [],
  streakDays = 0,
}: ConsistencyHeatmapProps) {
  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const today = todayString();

  // 1. Build unified dailyHabitMap 100% from user's real database records
  const dailyHabitMap = useMemo(() => {
    const map: Record<string, DayHabitData> = {};

    allMeals.forEach((m) => {
      if (!m.date) return;
      if (!map[m.date]) {
        map[m.date] = { dateStr: m.date, habitsCount: 0, meals: 0, workouts: 0, tasks: 0, calories: 0 };
      }
      map[m.date].meals++;
      map[m.date].calories += (m.macros?.calories || 0);
      if (!map[m.date].mealSummary) {
        map[m.date].mealSummary = `${m.name} (${m.macros?.calories || 0} kcal)`;
      }
    });

    sessions.forEach((s) => {
      if (!s.date) return;
      if (!map[s.date]) {
        map[s.date] = { dateStr: s.date, habitsCount: 0, meals: 0, workouts: 0, tasks: 0, calories: 0 };
      }
      map[s.date].workouts++;
      if (!map[s.date].workoutSummary) {
        map[s.date].workoutSummary = s.summary && !s.summary.startsWith("**") && s.summary.length < 35
          ? s.summary
          : (s.exercises?.[0]?.name ? `${s.exercises[0].name} · ${s.durationMinutes || 45}m` : "Session completed");
      }
    });

    tasks.forEach((t) => {
      if (t.status === "completed" && t.completedAt) {
        const dStr = localDateString(new Date(t.completedAt));
        if (!map[dStr]) {
          map[dStr] = { dateStr: dStr, habitsCount: 0, meals: 0, workouts: 0, tasks: 0, calories: 0 };
        }
        map[dStr].tasks++;
        if (!map[dStr].taskSummary) {
          map[dStr].taskSummary = t.title;
        }
      }
    });

    Object.values(map).forEach((entry) => {
      const hasMeal = entry.meals > 0 ? 1 : 0;
      const hasWorkout = entry.workouts > 0 ? 1 : 0;
      const hasTask = entry.tasks > 0 ? 1 : 0;
      entry.habitsCount = hasMeal + hasWorkout + hasTask;
    });

    return map;
  }, [allMeals, sessions, tasks]);

  // Compute best historical streak across all logged dates
  const bestStreak = useMemo(() => {
    const activeDates = Object.keys(dailyHabitMap)
      .filter((ds) => dailyHabitMap[ds].habitsCount > 0)
      .sort();

    if (activeDates.length === 0) return Math.max(streakDays, 0);

    let maxS = 0;
    let currentS = 0;
    let prevDt: Date | null = null;

    activeDates.forEach((ds) => {
      const [y, m, d] = ds.split("-").map(Number);
      const dt = new Date(y, m - 1, d);

      if (!prevDt) {
        currentS = 1;
      } else {
        const diffDays = Math.round((dt.getTime() - prevDt.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentS++;
        } else if (diffDays > 1) {
          currentS = 1;
        }
      }
      prevDt = dt;
      if (currentS > maxS) maxS = currentS;
    });

    return Math.max(streakDays, maxS);
  }, [dailyHabitMap, streakDays]);

  // 2. Month View Data (100% truthful to real month and database)
  const monthData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const mName = now.toLocaleDateString("en-US", { month: "short" });
    const tDayNum = now.getDate();

    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    // ISO Monday = 0 ... Sunday = 6
    const firstDayDow = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: CalendarCell[] = [];

    // Prev month padding
    for (let p = firstDayDow - 1; p >= 0; p--) {
      const dayNum = daysInPrevMonth - p;
      cells.push({
        dateStr: `prev-${dayNum}`,
        dayNum,
        isOverflow: true,
        isToday: false,
        tier: "overflow",
        habitsCount: 0,
      });
    }

    // Current month cells
    let activeDaysInMonth = 0;
    let elapsedDays = 0;

    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const ds = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isToday = ds === today;
      if (ds <= today) elapsedDays++;

      const entry = dailyHabitMap[ds];
      const habitsCount = entry?.habitsCount || 0;
      if (habitsCount > 0) activeDaysInMonth++;

      let tier: CalendarCell["tier"] = "rest";
      if (isToday) {
        tier = "today";
      } else if (habitsCount >= 3) {
        tier = "target";
      } else if (habitsCount >= 1) {
        tier = "mid";
      }

      cells.push({
        dateStr: ds,
        dayNum: d,
        isOverflow: false,
        isToday,
        tier,
        habitsCount,
        mealSummary: entry?.mealSummary,
        workoutSummary: entry?.workoutSummary,
        taskSummary: entry?.taskSummary,
      });
    }

    // Pad remaining row to multiple of 7 (at least 35)
    const totalSlots = Math.ceil(cells.length / 7) * 7;
    let nextD = 1;
    while (cells.length < Math.max(35, totalSlots)) {
      cells.push({
        dateStr: `next-${nextD}`,
        dayNum: nextD,
        isOverflow: true,
        isToday: false,
        tier: "overflow",
        habitsCount: 0,
      });
      nextD++;
    }

    const monthAdherencePct = elapsedDays > 0 ? Math.round((activeDaysInMonth / elapsedDays) * 100) : 0;

    return {
      cells,
      monthName: mName,
      activeDaysInMonth,
      monthAdherencePct,
      todayDayNum: tDayNum,
    };
  }, [dailyHabitMap, today]);

  // 3. Year View Data (52 weeks x 7 days, 100% truthful to database)
  const yearData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const firstDow = (startOfYear.getDay() + 6) % 7; // ISO Mon=0..Sun=6

    const gridStartDate = new Date(startOfYear);
    gridStartDate.setDate(startOfYear.getDate() - firstDow);

    let activeDaysInYear = 0;
    const daysElapsedThisYear = Math.max(
      1,
      Math.round((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    const yearCells: {
      dateStr: string;
      isToday: boolean;
      habitsCount: number;
      tier: "rest" | "mid" | "target" | "today";
      mealSummary?: string;
      workoutSummary?: string;
      taskSummary?: string;
      dayLabel: string;
    }[] = [];

    const cellDate = new Date(gridStartDate);
    for (let i = 0; i < 52 * 7; i++) {
      const ds = localDateString(cellDate);
      const isToday = ds === today;
      const isCurrentYear = cellDate.getFullYear() === currentYear;
      const entry = isCurrentYear ? dailyHabitMap[ds] : undefined;
      const habitsCount = entry?.habitsCount || 0;

      if (isCurrentYear && ds <= today && habitsCount > 0) {
        activeDaysInYear++;
      }

      let tier: "rest" | "mid" | "target" | "today" = "rest";
      if (isToday) tier = "today";
      else if (habitsCount >= 3) tier = "target";
      else if (habitsCount >= 1) tier = "mid";

      yearCells.push({
        dateStr: ds,
        isToday,
        habitsCount,
        tier,
        mealSummary: entry?.mealSummary,
        workoutSummary: entry?.workoutSummary,
        taskSummary: entry?.taskSummary,
        dayLabel: cellDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      });

      cellDate.setDate(cellDate.getDate() + 1);
    }

    const yearAdherencePct = Math.round((activeDaysInYear / daysElapsedThisYear) * 100);

    return {
      cells: yearCells,
      activeDaysInYear,
      yearAdherencePct,
    };
  }, [dailyHabitMap, today]);

  // Selected cell state for interactive tap readout
  const [selectedCell, setSelectedCell] = useState<{
    label: string;
    habitsCount: number;
    mealSummary?: string;
    workoutSummary?: string;
    taskSummary?: string;
  } | null>(null);

  // Default active selected cell (today)
  const activeSelectedCell = useMemo(() => {
    if (selectedCell) return selectedCell;
    const todayCell = monthData.cells.find((c) => c.isToday);
    if (todayCell) {
      return {
        label: `${monthData.monthName} ${todayCell.dayNum}`,
        habitsCount: todayCell.habitsCount,
        mealSummary: todayCell.mealSummary,
        workoutSummary: todayCell.workoutSummary,
        taskSummary: todayCell.taskSummary,
      };
    }
    return null;
  }, [selectedCell, monthData]);

  // Active summary pill metrics based on Month vs Year view
  const currentSummary = useMemo(() => {
    if (viewMode === "year") {
      return {
        streak: `${streakDays}d`,
        adherence: `${yearData.yearAdherencePct}%`,
        best: `${bestStreak}d`,
        active: `${yearData.activeDaysInYear}`,
      };
    }
    return {
      streak: `${streakDays}d`,
      adherence: `${monthData.monthAdherencePct}%`,
      best: `${bestStreak}d`,
      active: `${monthData.activeDaysInMonth}`,
    };
  }, [viewMode, streakDays, monthData, yearData, bestStreak]);

  const getPebbleStyle = (tier: string) => {
    switch (tier) {
      case "rest":
        return "bg-[#EFECE4] text-[#8C857B]";
      case "mid":
        return "bg-[#C6F6D5] text-[#22543D]";
      case "target":
        return "bg-[#2D6A4F] text-white shadow-2xs";
      case "today":
        return "bg-[#2D6A4F] text-white font-bold ring-2 ring-[#E05A47] ring-offset-2 ring-offset-[#FCFBF9]";
      case "overflow":
        return "bg-[#EFECE4]/40 text-[#8C857B]/40";
      default:
        return "bg-[#EFECE4] text-[#8C857B]";
    }
  };

  return (
    <div className="bg-[#FCFBF9] rounded-[28px] p-5 border border-[#1C1917]/[0.06] shadow-xs mb-2">
      {/* 1. Header Row — Fixed Single-Line Title without truncation */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="shrink-0">
          <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-[#8C857B]">
            CONTINUITY · सतत्
          </div>
          <h2 className="font-serif text-[1.15rem] sm:text-xl text-[#1C1917] leading-tight whitespace-nowrap">
            Habit Compounding
          </h2>
        </div>

        {/* 2-Pill View Toggle */}
        <div className="bg-[#EFECE4] p-1 rounded-full inline-flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setViewMode("month");
              setSelectedCell(null);
            }}
            className={`rounded-full py-1 text-[10px] transition-all ${
              viewMode === "month"
                ? "bg-[#191D1A] text-white px-3.5 font-bold shadow-xs"
                : "text-[#8C857B] hover:text-[#1C1917] px-3 font-semibold"
            }`}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode("year");
              setSelectedCell(null);
            }}
            className={`rounded-full py-1 text-[10px] transition-all ${
              viewMode === "year"
                ? "bg-[#191D1A] text-white px-3.5 font-bold shadow-xs"
                : "text-[#8C857B] hover:text-[#1C1917] px-3 font-semibold"
            }`}
          >
            Year
          </button>
        </div>
      </div>

      {/* 2. 2x2 Dynamic Summary Pill Grid */}
      <div className="grid grid-cols-2 gap-2.5 mt-4">
        {/* Pill 1: Streak */}
        <div className="bg-[#FDF2EC] border border-[#E05A47]/15 text-[#9A3412] rounded-full py-2 px-3 text-[11px] font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap">
          <span>🔥</span>
          <span>{currentSummary.streak} Streak</span>
        </div>

        {/* Pill 2: Adherence */}
        <div className="bg-[#E6F7F0] border border-[#2D6A4F]/15 text-[#1B4332] rounded-full py-2 px-3 text-[11px] font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap">
          <span>🌿</span>
          <span>{currentSummary.adherence} Adherence</span>
        </div>

        {/* Pill 3: Best */}
        <div className="bg-[#FEF9E7] border border-[#D97706]/20 text-[#92400E] rounded-full py-2 px-3 text-[11px] font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap">
          <span>🏆</span>
          <span>{currentSummary.best} Best</span>
        </div>

        {/* Pill 4: Active */}
        <div className="bg-[#EFECE4] border border-[#1C1917]/[0.06] text-[#1C1917] rounded-full py-2 px-3 text-[11px] font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap">
          <span>✓</span>
          <span>{currentSummary.active} Active</span>
        </div>
      </div>

      {/* Month vs Year View Rendering */}
      {viewMode === "month" ? (
        <>
          {/* 3. Weekday Header Row */}
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-semibold text-[#8C857B] mt-5 mb-2 select-none">
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
            <span>S</span>
          </div>

          {/* 4. Rounded Pebble Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {monthData.cells.map((cell, idx) => (
              <button
                key={`${cell.dateStr}-${idx}`}
                type="button"
                onClick={() => {
                  if (!cell.isOverflow) {
                    setSelectedCell({
                      label: `${monthData.monthName} ${cell.dayNum}`,
                      habitsCount: cell.habitsCount,
                      mealSummary: cell.mealSummary,
                      workoutSummary: cell.workoutSummary,
                      taskSummary: cell.taskSummary,
                    });
                  }
                }}
                disabled={cell.isOverflow}
                className={`aspect-square rounded-[12px] flex items-center justify-center text-xs font-semibold transition-transform active:scale-95 ${
                  cell.isOverflow ? "cursor-default opacity-30" : "cursor-pointer"
                } ${getPebbleStyle(cell.tier)}`}
              >
                {cell.dayNum}
              </button>
            ))}
          </div>
        </>
      ) : (
        /* Year View: 100% Dynamic 52-Week Botanical Matrix */
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-semibold text-[#8C857B]">
            <span>JAN</span>
            <span>APR</span>
            <span>JUL</span>
            <span>OCT</span>
            <span>DEC</span>
          </div>
          <div className="overflow-x-auto pb-1">
            <div className="grid grid-flow-col grid-rows-7 gap-1 min-w-[320px]">
              {yearData.cells.map((c, i) => (
                <button
                  key={`${c.dateStr}-${i}`}
                  type="button"
                  title={`${c.dayLabel}: ${c.habitsCount} habits`}
                  onClick={() => {
                    setSelectedCell({
                      label: c.dayLabel,
                      habitsCount: c.habitsCount,
                      mealSummary: c.mealSummary,
                      workoutSummary: c.workoutSummary,
                      taskSummary: c.taskSummary,
                    });
                  }}
                  className={`w-2.5 h-2.5 rounded-[2px] transition-transform hover:scale-125 ${
                    c.isToday
                      ? "bg-[#2D6A4F] ring-1 ring-[#E05A47]"
                      : c.tier === "target"
                      ? "bg-[#2D6A4F]"
                      : c.tier === "mid"
                      ? "bg-[#C6F6D5]"
                      : "bg-[#EFECE4]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Bottom Legend Strip */}
      <div className="flex items-center justify-between text-[10px] text-[#8C857B] mt-4 pt-2 border-t border-[#1C1917]/[0.05] flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[3px] bg-[#EFECE4] inline-block" />
          <span>Rest</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[3px] bg-[#C6F6D5] inline-block" />
          <span>1-2 habits</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[3px] bg-[#2D6A4F] inline-block" />
          <span>Target Hit (3)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[3px] bg-[#2D6A4F] ring-1 ring-[#E05A47] inline-block" />
          <span className="text-[#E05A47] font-semibold">Today</span>
        </div>
      </div>

      {/* Compact Interactive Detail Pill (When user taps any day) */}
      {activeSelectedCell && (
        <div className="mt-3.5 bg-[#F6F3EC] rounded-2xl p-2.5 px-3.5 border border-[#1C1917]/[0.05] flex items-center justify-between text-xs animate-fade-in gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-semibold text-[#1C1917] shrink-0">
              {activeSelectedCell.label}:
            </span>
            <span className="text-[#57534E] truncate">
              {activeSelectedCell.habitsCount === 0
                ? "No logs recorded on this date"
                : [activeSelectedCell.mealSummary, activeSelectedCell.workoutSummary, activeSelectedCell.taskSummary]
                    .filter(Boolean)
                    .join(" · ") || `${activeSelectedCell.habitsCount} habits logged`}
            </span>
          </div>
          {activeSelectedCell.habitsCount > 0 && (
            <span className="text-[11px] font-semibold text-[#2D6A4F] tabular-nums shrink-0">
              {activeSelectedCell.habitsCount}/3 habits
            </span>
          )}
        </div>
      )}
    </div>
  );
}
