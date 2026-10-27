"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useFirebaseAuth } from "@/components/FirebaseAuthProvider";
import Link from "next/link";
import {
  Clock, Flame, Check, Sparkles, CheckCircle2, Utensils
} from "lucide-react";
import { setDietContext, setWorkoutContext, setTaskContext } from "@/lib/orbitContext";
import {
  getAllTasks, getMeals, getMacroGoals,
  getWorkoutSessions, getBodyWeightEntries, getAllMeals, getUserProfile,
  updateTask,
} from "@/lib/firestore";
import ProgressTrendChart from "@/components/dashboard/ProgressTrendChart";
import ConsistencyHeatmap from "@/components/dashboard/ConsistencyHeatmap";
import { todayString, localDateString } from "@/lib/utils";
import type { Task, MealEntry, MacroGoals, WorkoutSession, BodyWeightEntry, UserProfileDocument } from "@/types";

/* ── Date Helpers ── */
function getGreetingPrefix() {
  const h = new Date().getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function formatDateEyebrow() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).toUpperCase();
}

function getCurrentWeekDates(refDate: Date = new Date()) {
  const dow = (refDate.getDay() + 6) % 7; // ISO Mon=0..Sun=6
  const monday = new Date(refDate);
  monday.setDate(refDate.getDate() - dow);

  const dates: { dateStr: string; label: string; dayNum: number; isToday: boolean; isPast: boolean }[] = [];
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dStr = localDateString(d);
    dates.push({
      dateStr: dStr,
      label: dayLabels[i],
      dayNum: d.getDate(),
      isToday: i === dow,
      isPast: i < dow,
    });
  }
  return { dates, todayIndex: dow };
}

export default function HomeView() {
  const { data: session } = useSession();
  const { firebaseUser, isReady } = useFirebaseAuth();
  const userId = firebaseUser?.uid ?? (session?.user as any)?.id as string | undefined;
  const firstName = session?.user?.name?.split(" ")[0] || "Ayush";

  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [goals, setGoals] = useState<MacroGoals | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [weights, setWeights] = useState<BodyWeightEntry[]>([]);
  const [allMeals, setAllMeals] = useState<MealEntry[]>([]);
  const [profile, setProfile] = useState<UserProfileDocument | null>(null);
  const [loading, setLoading] = useState(true);

  // Load production data
  useEffect(() => {
    if (!userId || !firebaseUser || !isReady) return;
    const today = todayString();
    setLoading(true);
    Promise.all([
      getMeals(userId, today),
      getMacroGoals(userId),
      getAllTasks(userId),
      getWorkoutSessions(userId),
      getBodyWeightEntries(userId),
      getAllMeals(userId),
      getUserProfile(userId),
    ])
      .then(([m, g, t, s, w, am, p]) => {
        setMeals(m);
        setGoals(g);
        setTasks(t);
        setSessions(s);
        setWeights(w);
        setAllMeals(am);
        setProfile(p);

        // Keep Orbit AI context populated with actual user data
        const tDay = todayString();
        setTaskContext({
          todayDate: tDay,
          pendingToday: t.filter((x: any) => x.status === "pending" && (!x.dueDate || x.dueDate <= tDay)).map((x: any) => ({ title: x.title, priority: x.priority })),
          completedToday: t.filter((x: any) => x.status === "completed" && x.completedAt && localDateString(new Date(x.completedAt)) === tDay).map((x: any) => ({ title: x.title, completedAt: x.completedAt })),
          overdue: t.filter((x: any) => x.status === "pending" && x.dueDate && x.dueDate < tDay).map((x: any) => ({ title: x.title, dueDate: x.dueDate })),
          totalPending: t.filter((x: any) => x.status === "pending").length,
        });

        const mealTotals = m.reduce(
          (acc: any, item: any) => ({
            calories: acc.calories + (item.macros?.calories || 0),
            proteinG: acc.proteinG + (item.macros?.proteinG || 0),
            carbsG: acc.carbsG + (item.macros?.carbsG || 0),
            fatG: acc.fatG + (item.macros?.fatG || 0),
          }),
          { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
        );

        setDietContext({
          date: tDay,
          meals: m.map((tm: any) => ({
            name: tm.name,
            calories: tm.macros?.calories || 0,
            proteinG: tm.macros?.proteinG || 0,
            carbsG: tm.macros?.carbsG || 0,
            fatG: tm.macros?.fatG || 0,
            fiberG: tm.macros?.fiberG,
          })),
          totals: mealTotals,
          goals: g ? { calories: g.calories, proteinG: g.proteinG, carbsG: g.carbsG, fatG: g.fatG } : null,
        });

        setWorkoutContext({
          bodyWeightKg: w.length > 0 ? w[0].weightKg : undefined,
          recentSessions: s.map((sess: any) => ({
            date: sess.date,
            durationMinutes: sess.durationMinutes || 0,
            exercises: sess.exercises || [],
            cardio: sess.cardio || [],
            summary: sess.summary,
          })),
        });
      })
      .catch((err) => {
        console.error("Error loading home data:", err);
      })
      .finally(() => setLoading(false));
  }, [userId, firebaseUser, isReady]);

  // Derived metrics for Today
  const today = todayString();
  const todaySession = sessions.find((s) => s.date === today);

  const todayTasks = tasks.filter((t) => !t.dueDate || t.dueDate === today || (t.dueDate < today && t.status === "pending"));
  const pendingTasks = todayTasks.filter((t) => t.status === "pending");
  const activeTask = pendingTasks[0] || tasks[0] || null;

  // Active dates lookup set across workouts, meals, and tasks
  const activeDatesSet = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      if (s.date) set.add(s.date);
    });
    tasks.forEach((t) => {
      if (t.status === "completed" && t.completedAt) {
        set.add(localDateString(new Date(t.completedAt)));
      }
    });
    allMeals.forEach((m) => {
      if (m.date) set.add(m.date);
    });
    return set;
  }, [sessions, tasks, allMeals]);

  // Real consecutive active streak days
  const activeStreakDays = useMemo(() => {
    const tDay = todayString();
    let curr = new Date();
    // If today hasn't been logged yet, check if streak is active starting from yesterday
    if (!activeDatesSet.has(tDay)) {
      curr.setDate(curr.getDate() - 1);
      const yStr = localDateString(curr);
      if (!activeDatesSet.has(yStr)) {
        return 0;
      }
    }
    let streak = 0;
    while (true) {
      const ds = localDateString(curr);
      if (activeDatesSet.has(ds)) {
        streak++;
        curr.setDate(curr.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [activeDatesSet]);

  const totals = useMemo(() => {
    return meals.reduce(
      (acc, m) => ({
        cal: acc.cal + (m.macros?.calories || 0),
        p: acc.p + (m.macros?.proteinG || 0),
        c: acc.c + (m.macros?.carbsG || 0),
        f: acc.f + (m.macros?.fatG || 0),
      }),
      { cal: 0, p: 0, c: 0, f: 0 }
    );
  }, [meals]);

  // Calorie & Protein calculations
  const calorieGoal = goals?.calories ?? 2200;
  const loggedCalories = totals.cal > 0 ? Math.round(totals.cal) : 1820;
  const remainingCalories = Math.max(0, calorieGoal - loggedCalories);
  const caloriePct = Math.min(100, Math.round((loggedCalories / Math.max(calorieGoal, 1)) * 100));

  const targetProtein = goals?.proteinG ?? 150;
  const loggedProtein = totals.p > 0 ? Math.round(totals.p) : 124;
  const proteinRemaining = Math.max(0, targetProtein - loggedProtein);
  const proteinPct = Math.min(100, Math.round((loggedProtein / Math.max(targetProtein, 1)) * 100));

  const proteinStatusLabel = useMemo(() => {
    if (proteinPct >= 100) return "Goal hit ✓";
    if (proteinRemaining <= 25) return "Almost there";
    return `${proteinRemaining}g to go`;
  }, [proteinPct, proteinRemaining]);

  // Workout details with strict sanitization (no raw AI markdown essays)
  const isWorkoutCompleted = !!todaySession;
  const todayWorkoutTitle = useMemo(() => {
    if (isWorkoutCompleted) {
      if (todaySession.summary && !todaySession.summary.startsWith("**") && todaySession.summary.length < 35) {
        return todaySession.summary;
      }
      return "Workout Completed";
    }
    return profile?.workoutPlanAssignment?.planName || "Upper Body Strength";
  }, [isWorkoutCompleted, todaySession, profile]);

  const todayWorkoutSubtitle = useMemo(() => {
    if (isWorkoutCompleted) {
      const minutes = todaySession.durationMinutes || 45;
      const count = todaySession.exercises?.length || 4;
      return `✓ Session complete · ~${Math.round(minutes * 7.5)} kcal burned · ${count} exercises`;
    }
    return "Incline Press · Chest Rows · 4 movements";
  }, [isWorkoutCompleted, todaySession]);

  const workoutMetaText = isWorkoutCompleted
    ? `COMPLETED · ${todaySession.durationMinutes || 45} MIN`
    : "6:00 PM · 45 MIN";

  // Check for dinner meal: meal with name including "dinner" or logged after 5 PM or meals[meals.length - 1] if >= 2 meals
  const dinnerMeal = useMemo(() => {
    if (meals.length === 0) return null;
    const explicitDinner = meals.find((m) => m.name.toLowerCase().includes("dinner"));
    if (explicitDinner) return explicitDinner;
    if (meals.length >= 3) return meals[meals.length - 1];
    const eveningMeal = meals.find((m) => {
      if (m.createdAt) {
        const h = new Date(m.createdAt).getHours();
        return h >= 17;
      }
      return false;
    });
    if (eveningMeal && meals.length >= 2) return eveningMeal;
    return null;
  }, [meals]);

  const completedRhythmCount = useMemo(() => {
    let count = 0;
    if (meals.length > 0) count++;
    if (todaySession || (tasks.length > 0 && tasks.every((t) => t.status === "completed"))) count++;
    if (dinnerMeal) count++;
    return count;
  }, [meals.length, todaySession, tasks, dinnerMeal]);

  // Weekly consistency & dates
  const { dates: weekDays } = useMemo(() => getCurrentWeekDates(), []);

  // Toggle task completion inline
  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const isNowCompleted = currentStatus !== "completed";
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: isNowCompleted ? "completed" : "pending",
              completedAt: isNowCompleted ? Date.now() : undefined,
            }
          : t
      )
    );
    try {
      await updateTask(taskId, {
        status: isNowCompleted ? "completed" : "pending",
        completedAt: isNowCompleted ? Date.now() : undefined,
      });
    } catch {
      // Revert on error
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: currentStatus as any }
            : t
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto lg:max-w-5xl px-0 sm:px-2 pt-2 pb-6 space-y-5 animate-pulse select-none">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-28 bg-[#EFECE4] rounded-md" />
            <div className="h-8 w-56 bg-[#EFECE4] rounded-xl" />
          </div>
          <div className="w-16 h-8 rounded-full bg-[#EFECE4]" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-20 rounded-[22px] bg-[#EFECE4]" />
          ))}
        </div>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-7 h-[244px] rounded-[26px] bg-[#EFECE4]" />
          <div className="col-span-5 h-[244px] rounded-[26px] bg-[#EFECE4]" />
        </div>
        <div className="h-20 rounded-[26px] bg-[#EFECE4]" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto lg:max-w-5xl px-0 sm:px-2 pt-2 pb-6 space-y-5 select-none animate-fade-in">
      {/* ── SECTION 1: Greeting Header & 7-Day Week Capsule Strip ── */}
      <div className="space-y-4">
        {/* Prominent Editorial Master Greeting */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.14em] uppercase text-[#8C857B] font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
              <span>{formatDateEyebrow()}</span>
            </div>
            <div className="bg-[#EFECE4] border border-[#1C1917]/[0.06] rounded-full px-2.5 py-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-[#1C1917] shrink-0">
              <span>🔥</span>
              <span>{activeStreakDays}d</span>
            </div>
          </div>
          <h1 className="font-serif font-normal text-[1.6rem] sm:text-3xl leading-tight tracking-tight text-[#1C1917] mt-1">
            {getGreetingPrefix()},{" "}
            <span className="italic text-[#2D6A4F] font-normal">{firstName}</span>
          </h1>
        </div>

        {/* 7-Day Week Capsule Strip */}
        <div className="grid grid-cols-7 gap-2 mt-4">
          {weekDays.map((day) => {
            if (day.isToday) {
              return (
                <div
                  key={day.dateStr}
                  className="bg-[#191D1A] text-[#FCFBF9] rounded-[22px] py-3 flex flex-col items-center justify-between shadow-[0_10px_24px_rgba(25,29,26,0.22)]"
                >
                  <span className="text-[10px] font-semibold text-stone-400 uppercase">
                    {day.label}
                  </span>
                  <span className="text-sm font-bold text-white my-1 tabular-nums">
                    {day.dayNum}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E05A47]" />
                </div>
              );
            }

            const isActive = activeDatesSet.has(day.dateStr) || day.isPast;
            return (
              <div
                key={day.dateStr}
                className="bg-[#FCFBF9] text-[#1C1917] rounded-[22px] py-3 flex flex-col items-center justify-between border border-[#1C1917]/[0.05] shadow-2xs transition-all"
              >
                <span className="text-[10px] font-semibold text-[#8C857B] uppercase">
                  {day.label}
                </span>
                <span className="text-sm font-bold text-[#1C1917] my-1 tabular-nums">
                  {day.dayNum}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? "bg-[#2D6A4F]" : "bg-transparent"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 2: Side-by-Side 2-Column Bento Grid (Strictly 12-Cols on All Screens) ── */}
      <div className="grid grid-cols-12 gap-3 items-stretch">
        {/* Left Column (col-span-7) — Compact Workout Card */}
        <div className="col-span-7 h-[244px] flex flex-col justify-between p-4 rounded-[26px] bg-[#191D1A] text-[#FCFBF9] overflow-hidden relative shadow-[0_18px_38px_-12px_rgba(25,29,26,0.28)]">
          {/* Subtle ambient green glow in bottom-right */}
          <div
            className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle at 85% 85%, rgba(45,106,79,0.28), transparent 65%)",
            }}
          />

          {/* Top Pill */}
          <div className="bg-white/[0.08] border border-white/[0.08] rounded-full px-2.5 py-1 inline-flex items-center gap-1.5 w-fit relative z-10 shrink-0">
            <Clock className="w-3 h-3 text-[#E05A47]" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-stone-200">
              {workoutMetaText}
            </span>
          </div>

          {/* Middle Content (Strictly Clamped) */}
          <div className="relative z-10 my-auto py-1">
            <h2 className="font-sans font-bold text-lg leading-snug text-white line-clamp-2">
              {todayWorkoutTitle}
            </h2>
            <p className="text-[11px] text-stone-400 mt-1 line-clamp-2 leading-relaxed">
              {todayWorkoutSubtitle}
            </p>
          </div>

          {/* Bottom Button */}
          <Link
            href="/dashboard/workout"
            className="w-full bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full py-2.5 px-3 text-[11px] font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap shadow-md transition-all relative z-10"
          >
            <span>{isWorkoutCompleted ? "View Summary" : "Start Session"}</span>
            <span className="text-xs">▷</span>
          </Link>
        </div>

        {/* Right Column (col-span-5) — Compact Calorie Ring + Protein Card */}
        <div className="col-span-5 flex flex-col gap-3 h-[244px]">
          {/* Top Right Card — Calorie Ring Card */}
          <Link
            href="/dashboard/diet"
            className="flex-1 bg-[#FCFBF9] rounded-[24px] p-3 border border-[#1C1917]/[0.06] shadow-xs flex flex-col items-center justify-center text-center overflow-hidden hover:border-[#1C1917]/[0.12] transition-colors"
          >
            {/* Compact w-11 h-11 SVG Progress Ring */}
            <div className="w-11 h-11 relative flex items-center justify-center shrink-0">
              <svg className="w-11 h-11 -rotate-90 transform" viewBox="0 0 44 44">
                <circle
                  cx="22"
                  cy="22"
                  r={17}
                  stroke="#EFECE4"
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx="22"
                  cy="22"
                  r={17}
                  stroke="#E05A47"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 17}
                  strokeDashoffset={2 * Math.PI * 17 * (1 - caloriePct / 100)}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-[#E05A47] fill-[#E05A47]" />
              </div>
            </div>

            {/* Readout below ring */}
            <div className="text-xs font-bold text-[#1C1917] mt-1.5 whitespace-nowrap">
              {loggedCalories.toLocaleString()}{" "}
              <span className="font-serif italic font-normal text-[11px] text-[#8C857B]">
                kcal
              </span>
            </div>
            <div className="text-[10px] text-[#8C857B] whitespace-nowrap">
              {remainingCalories} kcal left
            </div>
          </Link>

          {/* Bottom Right Card — Protein Progress Card */}
          <Link
            href="/dashboard/diet"
            className="flex-1 bg-[#FCFBF9] rounded-[24px] p-3 border border-[#1C1917]/[0.06] shadow-xs flex flex-col justify-between overflow-hidden hover:border-[#1C1917]/[0.12] transition-colors"
          >
            {/* Top row */}
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold tracking-wider uppercase text-[#8C857B]">
                PROTEIN
              </span>
              <span className="bg-[#E0F2E9] text-[#2D6A4F] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {proteinPct}%
              </span>
            </div>

            {/* Middle readout */}
            <div className="text-xs font-bold text-[#1C1917] whitespace-nowrap mt-1">
              {loggedProtein}{" "}
              <span className="font-normal text-[10px] text-[#8C857B]">
                / {targetProtein}g
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-[#EFECE4] rounded-full overflow-hidden my-1">
              <div
                className="h-full bg-[#2D6A4F] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${proteinPct}%` }}
              />
            </div>

            {/* Bottom micro-status */}
            <div className="text-[9px] font-medium text-[#2D6A4F] truncate">
              {proteinStatusLabel}
            </div>
          </Link>
        </div>
      </div>

      {/* ── SECTION 3: "MINDFUL WHISPER" Callout Strip ── */}
      <div className="bg-[#EFECE4]/85 border border-[#1C1917]/[0.05] rounded-[26px] p-4 flex items-center gap-3.5 shadow-2xs">
        <div className="w-10 h-10 rounded-full bg-[#FADCD5]/80 text-[#E05A47] flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 fill-current" />
        </div>
        <div className="min-w-0">
          <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-[#8C857B]">
            MINDFUL WHISPER
          </div>
          <p className="text-xs text-[#1C1917] leading-relaxed mt-0.5">
            You&apos;re{" "}
            <strong className="font-semibold text-[#2D6A4F]">
              {proteinRemaining}g away
            </strong>{" "}
            from your protein goal. A scoop of whey or a light bowl of curd with dinner hits it cleanly.
          </p>
        </div>
      </div>

      {/* ── SECTION 4: "TODAY'S RHYTHM" Timeline (Continuous Spine Connector) ── */}
      <div className="space-y-3 pt-1">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#8C857B]">
            TODAY&apos;S RHYTHM
          </span>
          <span className="text-xs font-semibold text-[#2D6A4F]">
            {completedRhythmCount} of 3 Done
          </span>
        </div>

        {/* Timeline Items List with Continuous Flowing Spine Rail */}
        <div className="relative">
          {/* Continuous Flowing Timeline Rail with Animated Light Beam */}
          <div
            className="absolute left-4 -translate-x-1/2 w-[3px] rounded-full overflow-hidden z-0 pointer-events-none"
            style={{
              top: "36px",
              bottom: "36px",
              background: "linear-gradient(180deg, #2D6A4F 0%, #D97706 45%, #E05A47 100%)",
              boxShadow: "0 0 8px rgba(45, 106, 79, 0.35)",
            }}
          >
            {/* Flowing animated pulse beam */}
            <div
              className="w-full h-24 rounded-full animate-timeline-beam"
              style={{
                background: "linear-gradient(180deg, transparent 0%, #FFFFFF 50%, #2D6A4F 100%)",
                opacity: 0.95,
              }}
            />
          </div>

          <div className="space-y-3">
            {/* Item 1: Completed Fuel (08:30 AM · FUEL) */}
            <div className="relative z-10 flex items-center gap-3">
              {/* Centered Node Slot (w-8 aligns center with left-4 line) */}
              <div className="w-8 flex items-center justify-center shrink-0">
                <div className="w-6 h-6 rounded-full bg-[#2D6A4F] text-white ring-4 ring-[#F6F3EC] flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>

              {/* Right Alabaster Card with Text Truncation Safeguard */}
              <div className="flex-1 bg-[#FCFBF9] rounded-[22px] p-3.5 border border-[#1C1917]/[0.06] shadow-xs flex items-center justify-between gap-3 min-w-0 overflow-hidden">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-[#EFECE4]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=300&q=75"
                      alt="Oatmeal and berries"
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-mono uppercase text-[#8C857B] truncate">
                      {meals[0]?.date ? "LOGGED · FUEL" : "08:30 AM · FUEL"}
                    </div>
                    <h4 className="text-sm font-bold text-[#1C1917] truncate mt-0.5">
                      {meals[0]?.name || "Oatmeal & Berries"}
                    </h4>
                    <p className="text-xs text-[#8C857B] truncate mt-0.5">
                      Logged · {meals[0]?.macros?.calories || 420} kcal
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-[#2D6A4F]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Item 2: Active Focus Task (02:00 PM · ACTIVE FOCUS) */}
            <div className="relative z-10 flex items-center gap-3">
              {/* Centered Node Slot */}
              <div className="w-8 flex items-center justify-center shrink-0">
                <div className="w-6 h-6 rounded-full bg-[#191D1A] ring-4 ring-[#F6F3EC] flex items-center justify-center shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#E05A47]" />
                </div>
              </div>

              {/* Right Alabaster Card with Text Truncation Safeguard */}
              <div className="flex-1 bg-[#FCFBF9] rounded-[22px] p-3.5 border border-[#1C1917]/[0.06] shadow-xs flex items-center justify-between gap-3 min-w-0 overflow-hidden">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold tracking-wider uppercase text-[#E05A47] flex items-center gap-1 truncate">
                    <span>02:00 PM · ACTIVE FOCUS</span>
                    <span className="text-[8px]">●</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1C1917] truncate mt-0.5">
                    {activeTask?.title || "Record LeetCode DSA Video"}
                  </h4>
                  <p className="text-xs text-[#8C857B] truncate mt-0.5">
                    {activeTask?.description || "Graph Traversals & Dynamic Planning"}
                  </p>
                </div>

                {/* Completion radio button */}
                <button
                  type="button"
                  onClick={() => {
                    if (activeTask) {
                      handleToggleTask(activeTask.id, activeTask.status);
                    }
                  }}
                  aria-label="Toggle task completion"
                  className="w-7 h-7 rounded-full bg-[#EFECE4] hover:bg-[#E05A47]/15 text-[#1C1917] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                >
                  {activeTask?.status === "completed" ? (
                    <Check className="w-3.5 h-3.5 text-[#2D6A4F] stroke-[3]" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-stone-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Item 3: Dinner / Evening Fuel (Dynamic Slot 3) */}
            <div className="relative z-10 flex items-center gap-3">
              {/* Centered Node Slot */}
              <div className="w-8 flex items-center justify-center shrink-0">
                <div
                  className={`w-6 h-6 rounded-full ${
                    dinnerMeal ? "bg-[#2D6A4F] text-white" : "bg-[#EFECE4]"
                  } ring-4 ring-[#F6F3EC] flex items-center justify-center shadow-xs`}
                >
                  {dinnerMeal ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-[#8C857B]" />
                  )}
                </div>
              </div>

              {/* Right Alabaster Card: Shows logged dinner or actionable link to log dinner */}
              {dinnerMeal ? (
                <div className="flex-1 bg-[#FCFBF9] rounded-[22px] p-3.5 border border-[#1C1917]/[0.06] shadow-xs flex items-center justify-between gap-3 min-w-0 overflow-hidden">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-mono uppercase text-[#8C857B] truncate">
                      LOGGED · DINNER
                    </div>
                    <h4 className="text-sm font-bold text-[#1C1917] truncate mt-0.5">
                      {dinnerMeal.name}
                    </h4>
                    <p className="text-xs text-[#8C857B] truncate mt-0.5">
                      Logged · {dinnerMeal.macros?.calories || 0} kcal · {dinnerMeal.macros?.proteinG || 0}g P
                    </p>
                  </div>

                  <div className="shrink-0 text-[#2D6A4F]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              ) : (
                <Link
                  href="/dashboard/diet"
                  className="flex-1 bg-[#FCFBF9] rounded-[22px] p-3.5 border border-[#1C1917]/[0.06] shadow-xs flex items-center justify-between gap-3 min-w-0 overflow-hidden hover:border-[#1C1917]/[0.15] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-mono uppercase text-[#8C857B] truncate">
                      08:30 PM · EVENING FUEL
                    </div>
                    <h4 className="text-sm font-bold text-[#1C1917] truncate mt-0.5">
                      Dinner & Protein Target
                    </h4>
                    <p className="text-xs text-[#8C857B] truncate mt-0.5">
                      {proteinRemaining > 0
                        ? `${proteinRemaining}g protein · ${remainingCalories} kcal remaining`
                        : "Log your evening meal"}
                    </p>
                  </div>

                  <div className="w-7 h-7 rounded-full bg-[#EFECE4] text-[#1C1917] flex items-center justify-center shrink-0">
                    <Utensils className="w-3.5 h-3.5" />
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 5: "PROGRESS TRAJECTORY — Weekly Momentum" Card ── */}
      <ProgressTrendChart
        sessions={sessions}
        tasks={tasks}
        allMeals={allMeals}
        goals={goals}
      />

      {/* ── SECTION 6: "CONTINUITY · सतत् — Habit Compounding" Card ── */}
      <ConsistencyHeatmap
        sessions={sessions}
        tasks={tasks}
        allMeals={allMeals}
        streakDays={activeStreakDays}
      />
    </div>
  );
}
