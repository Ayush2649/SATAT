"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useFirebaseAuth } from "@/components/FirebaseAuthProvider";
import Link from "next/link";
import {
  Clock, Flame, Check, Sparkles, CheckCircle2, Utensils,
  ArrowRight, Dumbbell
} from "lucide-react";
import { setDietContext, setWorkoutContext, setTaskContext } from "@/lib/orbitContext";
import {
  getAllTasks, getMeals, getMacroGoals,
  getWorkoutSessions, getBodyWeightEntries, getAllMeals, getUserProfile,
  updateTask,
} from "@/lib/firestore";
import ProgressTrendChart from "@/components/dashboard/ProgressTrendChart";
import ConsistencyHeatmap from "@/components/dashboard/ConsistencyHeatmap";
import { TodayPageSkeleton } from "@/components/ui/PageSkeletons";
import { cn, todayString, localDateString } from "@/lib/utils";
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
  const tDay = todayString();
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dStr = localDateString(d);
    dates.push({
      dateStr: dStr,
      label: dayLabels[i],
      dayNum: d.getDate(),
      isToday: dStr === tDay,
      isPast: dStr < tDay,
    });
  }
  return { dates, todayIndex: dow };
}

const DESKTOP_RITUALS = [
  {
    id: "deep_work_90",
    title: "90m Deep Work",
    category: "COGNITIVE",
    photo: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=300&q=75",
  },
  {
    id: "creatine_water",
    title: "3g Creatine & 3L Water",
    category: "CELLULAR FUEL",
    photo: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=300&q=75",
  },
  {
    id: "steps_zone2",
    title: "8,000 Steps & Zone 2",
    category: "MOVEMENT",
    photo: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=75",
  },
  {
    id: "evening_journal",
    title: "Evening Journal & Plan",
    category: "RESTORATION",
    photo: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=300&q=75",
  },
];

type RhythmItem =
  | { type: "meal"; id: string; name: string; calories: number; protein: number; timeStr: string; photoUrl?: string }
  | { type: "workout"; id: string; title: string; subtitle: string; duration: number; caloriesBurned: number }
  | { type: "task"; id: string; title: string; description?: string; status: string; priority?: any; dueDate?: string };

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

  // Sprint 8.3 & 8.4: Reactive date selection across 7-day strip
  const [selectedDate, setSelectedDate] = useState<string>(todayString());
  const [rituals, setRituals] = useState<Record<string, boolean>>({});
  const [timelineFilter, setTimelineFilter] = useState<string>("All Timeline");

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

  // Derived metrics for Selected Date (truthful zero-state defaults)
  const isSelectedDateToday = selectedDate === todayString();

  const displayedMeals = useMemo(() => {
    const list = allMeals.length > 0
      ? allMeals.filter((m) => m.date === selectedDate)
      : isSelectedDateToday ? meals : [];
    return [...list].sort((a, b) => a.createdAt - b.createdAt);
  }, [allMeals, meals, selectedDate, isSelectedDateToday]);

  const displayedSession = useMemo(() => {
    return sessions.find((s) => s.date === selectedDate);
  }, [sessions, selectedDate]);

  const displayedTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.dueDate === selectedDate) return true;
      if (t.status === "completed" && t.completedAt && localDateString(new Date(t.completedAt)) === selectedDate) return true;
      if (isSelectedDateToday && (!t.dueDate || t.dueDate < selectedDate) && t.status === "pending") return true;
      return false;
    });
  }, [tasks, selectedDate, isSelectedDateToday]);

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

  // Real totals computed strictly from displayedMeals for selectedDate
  const totals = useMemo(() => {
    return displayedMeals.reduce(
      (acc, m) => ({
        cal: acc.cal + (m.macros?.calories || 0),
        p: acc.p + (m.macros?.proteinG || 0),
        c: acc.c + (m.macros?.carbsG || 0),
        f: acc.f + (m.macros?.fatG || 0),
      }),
      { cal: 0, p: 0, c: 0, f: 0 }
    );
  }, [displayedMeals]);

  // Sprint 8.3: Calorie & Protein calculations — strictly 0 when no meals logged!
  const calorieGoal = goals?.calories ?? 2200;
  const loggedCalories = Math.round(totals.cal);
  const remainingCalories = Math.max(0, calorieGoal - loggedCalories);
  const caloriePct = Math.min(100, Math.round((loggedCalories / Math.max(calorieGoal, 1)) * 100));

  const targetProtein = goals?.proteinG ?? 135;
  const loggedProtein = Math.round(totals.p);
  const proteinRemaining = Math.max(0, targetProtein - loggedProtein);
  const proteinPct = Math.min(100, Math.round((loggedProtein / Math.max(targetProtein, 1)) * 100));

  const loggedCarbs = Math.round(totals.c);
  const loggedFat = Math.round(totals.f);

  const proteinStatusLabel = useMemo(() => {
    if (loggedProtein === 0) return "Log a meal to track protein";
    if (loggedProtein >= targetProtein) return "✓ Daily protein target hit!";
    return `${proteinRemaining}g away from goal`;
  }, [loggedProtein, targetProtein, proteinRemaining]);

  // Workout details with strict sanitization
  const isWorkoutCompleted = !!displayedSession;
  const todayWorkoutTitle = useMemo(() => {
    if (isWorkoutCompleted && displayedSession) {
      if (displayedSession.summary && !displayedSession.summary.startsWith("**") && displayedSession.summary.length < 35) {
        return displayedSession.summary;
      }
      return "Workout Completed";
    }
    return profile?.workoutPlanAssignment?.planName || "Upper Body Strength";
  }, [isWorkoutCompleted, displayedSession, profile]);

  const todayWorkoutSubtitle = useMemo(() => {
    if (isWorkoutCompleted && displayedSession) {
      const minutes = displayedSession.durationMinutes || 45;
      const count = displayedSession.exercises?.length || 4;
      return `✓ Session complete · ~${Math.round(minutes * 7.5)} kcal burned · ${count} exercises`;
    }
    return "Incline Press · Chest Rows · 4 movements";
  }, [isWorkoutCompleted, displayedSession]);

  const workoutMetaText = isWorkoutCompleted && displayedSession
    ? `COMPLETED · ${displayedSession.durationMinutes || 45} MIN`
    : "TODAY'S SPLIT · 45 MIN";

  // Dynamic Mindful Whisper (truthful context without hardcoded assumptions)
  const mindfulWhisper = useMemo(() => {
    if (isWorkoutCompleted && loggedCalories === 0) {
      return "Great session in the books! Prioritize a high-protein post-workout meal to kickstart recovery.";
    }
    if (loggedCalories === 0) {
      return "Fresh slate today. Fuel your body with high-protein nutrition and check your workout split when you're ready.";
    }
    if (loggedProtein >= targetProtein) {
      return `Target reached — excellent fueling today with ${loggedProtein}g protein.`;
    }
    return `You've logged ${loggedProtein}g protein so far. ${proteinRemaining}g to reach your ${targetProtein}g daily goal.`;
  }, [isWorkoutCompleted, loggedCalories, loggedProtein, targetProtein, proteinRemaining]);

  // Rhythm timeline items built strictly from real user data
  const rhythmItems = useMemo<RhythmItem[]>(() => {
    const items: RhythmItem[] = [];

    // Real Meals
    if (timelineFilter === "All Timeline" || timelineFilter === "Meals") {
      displayedMeals.forEach((m) => {
        items.push({
          type: "meal",
          id: m.id || `${m.name}_${m.createdAt}`,
          name: m.name,
          calories: m.macros?.calories || 0,
          protein: m.macros?.proteinG || 0,
          timeStr: m.createdAt
            ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "FUEL",
          photoUrl: (m as any).photoUrl || (m as any).imageUrl,
        });
      });
    }

    // Real Workout
    if (timelineFilter === "All Timeline" || timelineFilter === "Movement") {
      if (displayedSession) {
        const minutes = displayedSession.durationMinutes || 45;
        items.push({
          type: "workout",
          id: displayedSession.id || `session_${displayedSession.date}`,
          title: displayedSession.summary || "Workout Session",
          subtitle: `Completed · ${displayedSession.exercises?.length || 4} exercises logged`,
          duration: minutes,
          caloriesBurned: Math.round(minutes * 7.5),
        });
      }
    }

    // Real Tasks
    if (timelineFilter === "All Timeline" || timelineFilter === "Deep Work") {
      displayedTasks.forEach((t) => {
        items.push({
          type: "task",
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
        });
      });
    }

    return items;
  }, [displayedMeals, displayedSession, displayedTasks, timelineFilter]);

  const completedRhythmCount = useMemo(() => {
    let count = 0;
    if (displayedMeals.length > 0) count++;
    if (displayedSession) count++;
    if (displayedTasks.some((t) => t.status === "completed")) count++;
    return count;
  }, [displayedMeals.length, displayedSession, displayedTasks]);

  // Weekly consistency & dates
  const { dates: weekDays } = useMemo(() => getCurrentWeekDates(), []);

  // Rituals storage (per date)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(`satat_rituals_${selectedDate}`);
      if (stored) {
        setRituals(JSON.parse(stored));
      } else {
        setRituals({});
      }
    } catch {}
  }, [selectedDate]);

  const toggleRitual = (id: string) => {
    setRituals((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(`satat_rituals_${selectedDate}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

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
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: currentStatus as any } : t
        )
      );
    }
  };

  if (loading) {
    return <TodayPageSkeleton />;
  }

  return (
    <div className="w-full max-w-none mx-auto px-0 sm:px-2 pt-2 pb-8 select-none animate-fade-in">
      {/* ──────────────────────────────────────────────────────────────────────────
         MOBILE FLOW (< 1024px) — Clean Responsive Bento with Collapsible Secondary Trends
         ────────────────────────────────────────────────────────────────────────── */}
      <div className="lg:hidden space-y-5 max-w-md mx-auto">
        {/* Section 1: Greeting Header & 7-Day Week Capsule Strip */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.14em] uppercase text-[#8C857B] font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
                <span>{formatDateEyebrow()}</span>
              </div>
              <div className="flex items-center gap-2">
                {!isSelectedDateToday && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayString())}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E05A47]/10 text-[#E05A47] hover:bg-[#E05A47]/20 transition-colors"
                  >
                    Jump to Today
                  </button>
                )}
                <div className="bg-[#EFECE4] dark:bg-[#1C221E] border border-[#1C1917]/[0.06] dark:border-white/[0.08] rounded-full px-2.5 py-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-[#1C1917] dark:text-[#F4F1EA] shrink-0">
                  <span>🔥</span>
                  <span>{activeStreakDays}d</span>
                </div>
              </div>
            </div>
            <h1 className="font-serif font-normal text-[1.6rem] sm:text-3xl leading-tight tracking-tight text-[#1C1917] dark:text-[#F4F1EA] mt-1">
              {getGreetingPrefix()},{" "}
              <span className="italic text-[#2D6A4F] dark:text-[#6EE7B7] font-normal">{firstName}</span>
            </h1>
          </div>

          {/* Interactive 7-Day Week Strip */}
          <div className="grid grid-cols-7 gap-2 mt-4">
            {weekDays.map((day) => {
              const isSelected = day.dateStr === selectedDate;
              const isActive = activeDatesSet.has(day.dateStr);

              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(day.dateStr)}
                  className={cn(
                    "rounded-[22px] py-3 flex flex-col items-center justify-between transition-all cursor-pointer",
                    isSelected
                      ? "bg-[#191D1A] text-[#FCFBF9] shadow-[0_10px_24px_rgba(25,29,26,0.22)] ring-2 ring-[#2D6A4F]"
                      : "bg-[#FCFBF9] dark:bg-[#141916] text-[#1C1917] dark:text-[#F4F1EA] border border-[#1C1917]/[0.05] dark:border-white/[0.06] shadow-2xs hover:bg-[#F6F3EC]"
                  )}
                >
                  <span className={cn("text-[10px] font-semibold uppercase", isSelected ? "text-stone-400" : "text-[#8C857B]")}>
                    {day.label}
                  </span>
                  <span className={cn("text-sm font-bold my-1 tabular-nums", isSelected ? "text-white" : "text-[#1C1917] dark:text-[#F4F1EA]")}>
                    {day.dayNum}
                  </span>
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      day.isToday ? "bg-[#E05A47]" : isActive ? "bg-[#2D6A4F]" : "bg-transparent"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Mobile Bento Grid */}
        <div className="grid grid-cols-12 gap-3 items-stretch">
          {/* Left Column (col-span-7) — Compact Workout Card */}
          <div className="col-span-7 h-[244px] flex flex-col justify-between p-4 rounded-[26px] bg-[#191D1A] text-[#FCFBF9] overflow-hidden relative shadow-[0_18px_38px_-12px_rgba(25,29,26,0.28)]">
            <div
              className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle at 85% 85%, rgba(45,106,79,0.28), transparent 65%)",
              }}
            />
            <div className="bg-white/[0.08] border border-white/[0.08] rounded-full px-2.5 py-1 inline-flex items-center gap-1.5 w-fit relative z-10 shrink-0">
              <Clock className="w-3 h-3 text-[#E05A47]" />
              <span className="text-[10px] font-bold tracking-wider uppercase text-stone-200">
                {workoutMetaText}
              </span>
            </div>
            <div className="relative z-10 my-auto py-1">
              <h2 className="font-sans font-bold text-lg leading-snug text-white line-clamp-2">
                {todayWorkoutTitle}
              </h2>
              <p className="text-[11px] text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                {todayWorkoutSubtitle}
              </p>
            </div>
            <Link
              href="/dashboard/workout"
              className="w-full bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full py-2.5 px-3 text-[11px] font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap shadow-md transition-all relative z-10"
            >
              <span>{isWorkoutCompleted ? "View Summary" : "Start Session"}</span>
              <span className="text-xs">▷</span>
            </Link>
          </div>

          {/* Right Column (col-span-5) — Calorie Ring + Protein */}
          <div className="col-span-5 flex flex-col gap-3 h-[244px]">
            <Link
              href="/dashboard/diet"
              className="flex-1 bg-[#FCFBF9] dark:bg-[#141916] rounded-[24px] p-3 border border-[#1C1917]/[0.06] dark:border-white/[0.08] shadow-xs flex flex-col items-center justify-center text-center overflow-hidden hover:border-[#1C1917]/[0.12] transition-colors group"
            >
              <div className="w-11 h-11 relative flex items-center justify-center shrink-0">
                <svg className="w-11 h-11 -rotate-90 transform" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r={17} stroke="#EFECE4" strokeWidth="4" fill="none" className="dark:stroke-[#1E2621]" />
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
              <div className="text-xs font-bold text-[#1C1917] dark:text-[#F4F1EA] mt-1.5 whitespace-nowrap">
                {loggedCalories.toLocaleString()}{" "}
                <span className="font-serif italic font-normal text-[11px] text-[#8C857B]">kcal</span>
              </div>
              {loggedCalories === 0 ? (
                <div className="text-[10px] font-semibold text-[#E05A47] group-hover:underline whitespace-nowrap mt-0.5">
                  + Log first meal →
                </div>
              ) : (
                <div className="text-[10px] text-[#8C857B] whitespace-nowrap mt-0.5">{remainingCalories.toLocaleString()} kcal left</div>
              )}
            </Link>

            <Link
              href="/dashboard/diet"
              className="flex-1 bg-[#FCFBF9] dark:bg-[#141916] rounded-[24px] p-3 border border-[#1C1917]/[0.06] dark:border-white/[0.08] shadow-xs flex flex-col justify-between overflow-hidden hover:border-[#1C1917]/[0.12] transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold tracking-wider uppercase text-[#8C857B]">PROTEIN</span>
                <span className="bg-[#E0F2E9] dark:bg-[#132B20] text-[#2D6A4F] dark:text-[#34D399] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {proteinPct}%
                </span>
              </div>
              <div className="text-xs font-bold text-[#1C1917] dark:text-[#F4F1EA] whitespace-nowrap mt-1">
                {loggedProtein} <span className="font-normal text-[10px] text-[#8C857B]">/ {targetProtein}g</span>
              </div>
              <div className="w-full h-1.5 bg-[#EFECE4] dark:bg-[#1E2621] rounded-full overflow-hidden my-1">
                <div
                  className="h-full bg-[#2D6A4F] dark:bg-[#34D399] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${proteinPct}%` }}
                />
              </div>
              <div className="text-[9px] font-medium text-[#2D6A4F] dark:text-[#34D399] truncate">{proteinStatusLabel}</div>
            </Link>
          </div>
        </div>

        {/* Section 3: Mindful Whisper */}
        <div className="bg-[#EFECE4]/85 dark:bg-[#161C18] border border-[#1C1917]/[0.05] dark:border-white/[0.08] rounded-[26px] p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-full bg-[#FADCD5]/80 dark:bg-[#E05A47]/20 text-[#E05A47] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-[#8C857B]">MINDFUL WHISPER</div>
            <p className="text-xs text-[#1C1917] dark:text-[#F4F1EA] leading-relaxed mt-0.5">
              {mindfulWhisper}
            </p>
          </div>
        </div>

        {/* Section 4: Today's Rhythm Feed */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#8C857B]">TODAY&apos;S RHYTHM</span>
            <span className="text-xs font-semibold text-[#2D6A4F] dark:text-[#34D399]">{completedRhythmCount} of 3 Done</span>
          </div>

          {rhythmItems.length === 0 ? (
            <div className="bg-[#FCFBF9] dark:bg-[#141916] rounded-[24px] p-5 border border-dashed border-[#1C1917]/20 dark:border-white/20 text-center shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-[#EFECE4] dark:bg-[#1E2621] text-[#2D6A4F] dark:text-[#34D399] flex items-center justify-center mx-auto mb-2.5">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <h4 className="text-sm font-bold text-[#1C1917] dark:text-[#F4F1EA]">
                No activities logged yet for this day
              </h4>
              <p className="text-[11px] text-[#8C857B] dark:text-[#9CA39E] mt-1 leading-relaxed">
                Set the tone for your day by logging a meal, starting your workout, or scheduling a priority focus block.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-4">
                <Link
                  href="/dashboard/diet"
                  className="w-full sm:w-auto px-3.5 py-2 rounded-full bg-[#E05A47] hover:bg-[#C94A38] text-white font-semibold text-xs text-center shadow-xs inline-flex items-center justify-center gap-1"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>+ Log First Meal</span>
                </Link>
                <Link
                  href="/dashboard/workout"
                  className="w-full sm:w-auto px-3.5 py-2 rounded-full bg-[#191D1A] dark:bg-[#2D6A4F] text-white font-semibold text-xs text-center shadow-xs inline-flex items-center justify-center gap-1"
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  <span>+ Start Workout</span>
                </Link>
                <Link
                  href="/dashboard/tasks"
                  className="w-full sm:w-auto px-3.5 py-2 rounded-full bg-[#EFECE4] dark:bg-[#1E2621] text-[#1C1917] dark:text-[#F4F1EA] font-semibold text-xs text-center border border-[#1C1917]/10 dark:border-white/10 inline-flex items-center justify-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>+ Add Focus Task</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Dynamic Animated Timeline Beam */}
              <div
                className="absolute left-4 -translate-x-1/2 w-[3px] rounded-full overflow-hidden z-0 pointer-events-none"
                style={{
                  top: "24px",
                  bottom: "24px",
                  background: "linear-gradient(180deg, #2D6A4F 0%, #D97706 45%, #E05A47 100%)",
                  boxShadow: "0 0 8px rgba(45, 106, 79, 0.35)",
                }}
              >
                <div
                  className="w-full h-24 rounded-full animate-timeline-beam"
                  style={{
                    background: "linear-gradient(180deg, transparent 0%, #FFFFFF 50%, #2D6A4F 100%)",
                    opacity: 0.95,
                  }}
                />
              </div>

              <div className="space-y-3">
                {rhythmItems.map((item) => {
                  if (item.type === "meal") {
                    return (
                      <div key={`m_${item.id}`} className="relative z-10 flex items-center gap-3">
                        <div className="w-8 flex items-center justify-center shrink-0">
                          <div className="w-6 h-6 rounded-full bg-[#2D6A4F] text-white ring-4 ring-[#F6F3EC] dark:ring-[#0A0D0B] flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </div>
                        <div className="flex-1 bg-[#FCFBF9] dark:bg-[#141916] rounded-[22px] p-3.5 border border-[#1C1917]/[0.06] dark:border-white/[0.08] shadow-xs flex items-center justify-between gap-3 min-w-0 overflow-hidden">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-11 h-11 rounded-2xl overflow-hidden shrink-0 bg-[#EFECE4] dark:bg-[#1C221E] flex items-center justify-center">
                              {item.photoUrl ? (
                                <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <Utensils className="w-5 h-5 text-[#2D6A4F]" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[10px] font-mono uppercase text-[#2D6A4F] dark:text-[#34D399] font-bold truncate">
                                {item.timeStr} · FUEL
                              </div>
                              <h4 className="text-sm font-bold text-[#1C1917] dark:text-[#F4F1EA] truncate mt-0.5">{item.name}</h4>
                              <p className="text-xs text-[#8C857B] dark:text-[#9CA39E] truncate mt-0.5">Logged · {item.calories} kcal · {item.protein}g P</p>
                            </div>
                          </div>
                          <div className="shrink-0 text-[#2D6A4F] dark:text-[#34D399]"><CheckCircle2 className="w-5 h-5" /></div>
                        </div>
                      </div>
                    );
                  }
                  if (item.type === "workout") {
                    return (
                      <div key={`w_${item.id}`} className="relative z-10 flex items-center gap-3">
                        <div className="w-8 flex items-center justify-center shrink-0">
                          <div className="w-6 h-6 rounded-full bg-[#E05A47] text-white ring-4 ring-[#F6F3EC] dark:ring-[#0A0D0B] flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </div>
                        <div className="flex-1 bg-[#FCFBF9] dark:bg-[#141916] rounded-[22px] p-3.5 border border-[#1C1917]/[0.06] dark:border-white/[0.08] shadow-xs flex items-center justify-between gap-3 min-w-0 overflow-hidden">
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold tracking-wider uppercase text-[#E05A47] truncate">
                              {item.duration} MIN · TRAINING
                            </div>
                            <h4 className="text-sm font-bold text-[#1C1917] dark:text-[#F4F1EA] truncate mt-0.5">{item.title}</h4>
                            <p className="text-xs text-[#8C857B] dark:text-[#9CA39E] truncate mt-0.5">{item.subtitle} · ~{item.caloriesBurned} kcal</p>
                          </div>
                          <Link href="/dashboard/workout" className="shrink-0 text-[#2D6A4F] dark:text-[#34D399]">
                            <CheckCircle2 className="w-5 h-5" />
                          </Link>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={`t_${item.id}`} className="relative z-10 flex items-center gap-3">
                      <div className="w-8 flex items-center justify-center shrink-0">
                        <div className="w-6 h-6 rounded-full bg-[#191D1A] dark:bg-[#2D6A4F] ring-4 ring-[#F6F3EC] dark:ring-[#0A0D0B] flex items-center justify-center shadow-xs">
                          {item.status === "completed" ? (
                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-[#E05A47]" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 bg-[#FCFBF9] dark:bg-[#141916] rounded-[22px] p-3.5 border border-[#1C1917]/[0.06] dark:border-white/[0.08] shadow-xs flex items-center justify-between gap-3 min-w-0 overflow-hidden">
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold tracking-wider uppercase text-[#E05A47] flex items-center gap-1 truncate">
                            <span>FOCUS TASK</span>
                            <span className="text-[8px]">●</span>
                          </div>
                          <h4 className={cn("text-sm font-bold text-[#1C1917] dark:text-[#F4F1EA] truncate mt-0.5", item.status === "completed" && "line-through text-stone-400")}>
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-xs text-[#8C857B] dark:text-[#9CA39E] truncate mt-0.5">{item.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleTask(item.id, item.status)}
                          aria-label="Toggle task completion"
                          className="w-7 h-7 rounded-full bg-[#EFECE4] dark:bg-[#1E2621] hover:bg-[#E05A47]/15 text-[#1C1917] dark:text-[#F4F1EA] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        >
                          {item.status === "completed" ? (
                            <Check className="w-3.5 h-3.5 text-[#2D6A4F] stroke-[3]" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-stone-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Section 5 & 6: Weekly Momentum & Streak Consistency (Always Visible) */}
        <div className="space-y-4 pt-2">
          <ProgressTrendChart sessions={sessions} tasks={tasks} allMeals={allMeals} goals={goals} />
          <ConsistencyHeatmap sessions={sessions} tasks={tasks} allMeals={allMeals} streakDays={activeStreakDays} />
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
         DESKTOP FLOW (lg: 1024px+) — 12-Column Responsive Studio Architecture
         ────────────────────────────────────────────────────────────────────────── */}
      <div className="hidden lg:grid grid-cols-12 gap-6 items-start">
        {/* ── LEFT 8 COLUMNS: Main Studio Flow ── */}
        <div className="col-span-8 space-y-6">
          {/* 1. Top Greeting + 7-Day Calendar Row */}
          <div className="bg-[#FCFBF9] dark:bg-[#141916] rounded-[28px] p-6 border border-[#1C1917]/[0.06] dark:border-white/[0.07] shadow-xs">
            {/* Dedicated Top Eyebrow Row: Streak Pill Cleanly Positioned in Top-Right */}
            <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-[#1C1917]/[0.05] dark:border-white/[0.06]">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-[#57534E] dark:text-[#9CA39E] whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-[#2D6A4F] dark:bg-[#34D399]" />
                CIRCADIAN ALIGNMENT · {formatDateEyebrow()}
              </span>
              <div className="flex items-center gap-2">
                {!isSelectedDateToday && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayString())}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E05A47]/10 text-[#E05A47] hover:bg-[#E05A47]/20 transition-colors cursor-pointer"
                  >
                    Jump to Today
                  </button>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 bg-[#EFECE4] dark:bg-[#1C221E] text-[#1C1917] dark:text-[#F4F1EA] border border-[#1C1917]/[0.06] dark:border-white/[0.08] shadow-xs">
                  🔥 {activeStreakDays}d streak
                </span>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
              <div className="flex-1 min-w-0">
                <h1 className="font-serif font-normal text-3xl leading-tight tracking-tight text-[#1C1917] dark:text-[#F4F1EA]">
                  {getGreetingPrefix()},{" "}
                  <span className="italic text-[#2D6A4F] dark:text-[#6EE7B7]">{firstName}</span>
                </h1>
                <p className="text-xs text-[#57534E] dark:text-[#9CA39E] mt-1">
                  Biological readiness primed · Personal cadence tracking for {selectedDate}
                </p>
              </div>

              {/* Horizontal 7-Day Week Strip */}
              <div className="grid grid-cols-7 gap-2 xl:w-[380px] shrink-0">
                {weekDays.map((day) => {
                  const isSelected = day.dateStr === selectedDate;
                  const isActive = activeDatesSet.has(day.dateStr);

                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(day.dateStr)}
                      className={cn(
                        "rounded-[20px] py-3 flex flex-col items-center justify-between transition-all cursor-pointer",
                        isSelected
                          ? "bg-[#191D1A] text-[#FCFBF9] shadow-[0_8px_20px_rgba(25,29,26,0.25)] ring-2 ring-[#2D6A4F]"
                          : "bg-[#F6F3EC] dark:bg-[#1C221E] text-[#1C1917] dark:text-[#F4F1EA] border border-[#1C1917]/[0.05] dark:border-white/[0.06] hover:bg-[#EFECE4]"
                      )}
                    >
                      <span className={cn("text-[10px] font-semibold uppercase", isSelected ? "text-stone-400" : "text-[#8C857B]")}>
                        {day.label}
                      </span>
                      <span className={cn("text-sm font-bold my-0.5 tabular-nums", isSelected ? "text-white" : "text-[#1C1917] dark:text-[#F4F1EA]")}>
                        {day.dayNum}
                      </span>
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          day.isToday ? "bg-[#E05A47]" : isActive ? "bg-[#2D6A4F]" : "bg-transparent"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. 2-Column Hero Row (Training Split Card + Calorie/Protein Stack) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Card: Dark #191D1A Training Split Card */}
            <div className="bg-[#191D1A] text-[#FCFBF9] rounded-[28px] p-6 flex flex-col justify-between shadow-xl relative overflow-hidden min-h-[290px]">
              <div
                className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle at 85% 85%, rgba(45,106,79,0.32), transparent 70%)",
                }}
              />
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="bg-white/[0.08] border border-white/[0.08] rounded-full px-3 py-1 inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#E05A47]" />
                    <span className="text-[10px] font-bold tracking-wider uppercase text-stone-200">
                      {workoutMetaText}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-300 font-medium">5-Day Upper / Lower</span>
                </div>

                <h2 className="font-serif text-2xl text-white mt-4 leading-snug">
                  {todayWorkoutTitle}
                </h2>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  {todayWorkoutSubtitle}
                </p>

                {/* Movement Pills */}
                {isWorkoutCompleted && displayedSession?.exercises && displayedSession.exercises.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-3.5">
                    {displayedSession.exercises.slice(0, 4).map((ex: any, idx: number) => (
                      <span
                        key={idx}
                        className="bg-white/[0.08] text-stone-300 rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                      >
                        {ex.name || `Movement ${idx + 1}`}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-3.5">
                    {["Incline Dumbbell Press", "Chest-Supported Row", "Lateral Raises", "Skull Crushers"].map((m) => (
                      <span
                        key={m}
                        className="bg-white/[0.08] text-stone-300 rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/dashboard/workout"
                className="w-full bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] mt-4"
              >
                <span>{isWorkoutCompleted ? "Review Completed Session" : "Start Session"}</span>
                <span className="text-xs">▷</span>
              </Link>
            </div>

            {/* Right Stack: Calorie Budget & Protein Synthesis */}
            <div className="flex flex-col gap-4">
              {/* Top Alabaster Card: DAILY CALORIE BUDGET */}
              <Link
                href="/dashboard/diet"
                className="bg-[#FCFBF9] dark:bg-[#141916] rounded-[26px] p-5 border border-[#1C1917]/[0.06] dark:border-white/[0.08] shadow-xs flex items-center justify-between gap-4 hover:border-[#1C1917]/[0.15] dark:hover:border-white/[0.15] transition-all group cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#8C857B] block">
                    DAILY CALORIE BUDGET
                  </span>
                  <div className="text-2xl font-bold text-[#1C1917] dark:text-[#F4F1EA] mt-1">
                    {loggedCalories.toLocaleString()}{" "}
                    <span className="font-serif italic font-normal text-sm text-[#8C857B]">
                      / {calorieGoal.toLocaleString()} kcal
                    </span>
                  </div>
                  {loggedCalories === 0 ? (
                    <p className="text-xs text-[#E05A47] font-semibold mt-0.5 group-hover:underline">
                      + Log first meal →
                    </p>
                  ) : (
                    <p className="text-xs text-[#2D6A4F] dark:text-[#34D399] font-semibold mt-0.5">
                      {remainingCalories.toLocaleString()} kcal remaining
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-2.5">
                    <span className="bg-[#EFECE4] dark:bg-[#1E2621] text-[#1C1917] dark:text-[#F4F1EA] rounded-md px-2 py-0.5 text-[10px] font-bold">
                      P: {loggedProtein}g
                    </span>
                    <span className="bg-[#EFECE4] dark:bg-[#1E2621] text-[#57534E] dark:text-[#9CA39E] rounded-md px-2 py-0.5 text-[10px] font-medium">
                      C: {loggedCarbs}g
                    </span>
                    <span className="bg-[#EFECE4] dark:bg-[#1E2621] text-[#57534E] dark:text-[#9CA39E] rounded-md px-2 py-0.5 text-[10px] font-medium">
                      F: {loggedFat}g
                    </span>
                  </div>
                </div>

                {/* Progress Ring */}
                <div className="w-16 h-16 relative flex items-center justify-center shrink-0">
                  <svg className="w-16 h-16 -rotate-90 transform" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r={25} stroke="#EFECE4" strokeWidth="6" fill="none" className="dark:stroke-[#1E2621]" />
                    <circle
                      cx="32"
                      cy="32"
                      r={25}
                      stroke="#E05A47"
                      strokeWidth="6"
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray={2 * Math.PI * 25}
                      strokeDashoffset={2 * Math.PI * 25 * (1 - caloriePct / 100)}
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold text-[#1C1917] dark:text-[#F4F1EA]">{caloriePct}%</span>
                  </div>
                </div>
              </Link>

              {/* Bottom Alabaster Card: TARGET PROTEIN SYNTHESIS */}
              <Link
                href="/dashboard/diet"
                className="bg-[#FCFBF9] dark:bg-[#141916] rounded-[26px] p-5 border border-[#1C1917]/[0.06] dark:border-white/[0.08] shadow-xs hover:border-[#1C1917]/[0.15] dark:hover:border-white/[0.15] transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#8C857B]">
                    TARGET PROTEIN SYNTHESIS
                  </span>
                  <span className="bg-[#E0F2E9] dark:bg-[#132B20] text-[#2D6A4F] dark:text-[#34D399] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {proteinPct}% Met
                  </span>
                </div>
                <div className="text-xl font-bold text-[#1C1917] dark:text-[#F4F1EA] mt-1.5">
                  {loggedProtein}g{" "}
                  <span className="font-normal text-xs text-[#8C857B]">/ {targetProtein}g daily target</span>
                </div>
                <div className="w-full h-2 bg-[#EFECE4] dark:bg-[#1E2621] rounded-full overflow-hidden my-2.5">
                  <div
                    className="h-full bg-[#2D6A4F] dark:bg-[#34D399] rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${proteinPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#57534E] dark:text-[#9CA39E] font-medium">{proteinStatusLabel}</span>
                  <span className="text-[#2D6A4F] dark:text-[#34D399] font-semibold">
                    {loggedProtein >= targetProtein ? "Target met" : `${proteinRemaining}g to go`}
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* 3. Today's Rhythm Section with Filter Pills */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#8C857B]">
                  TODAY&apos;S RHYTHM
                </span>
                <p className="text-xs text-[#57534E] dark:text-[#9CA39E] mt-0.5">
                  Chronological biological & cognitive execution cadence
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 bg-[#FCFBF9] dark:bg-[#141916] border border-[#1C1917]/[0.06] dark:border-white/[0.08] rounded-full p-1 shadow-2xs">
                {["All Timeline", "Meals", "Movement", "Deep Work"].map((pill) => (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => setTimelineFilter(pill)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      timelineFilter === pill
                        ? "bg-[#191D1A] dark:bg-[#2D6A4F] text-white shadow-2xs"
                        : "text-[#57534E] dark:text-[#9CA39E] hover:text-[#1C1917] dark:hover:text-white"
                    }`}
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>

            {/* Real Items or Empty Day Kickoff Card */}
            {rhythmItems.length === 0 ? (
              <div className="bg-[#FCFBF9] dark:bg-[#141916] rounded-[26px] p-8 border border-dashed border-[#1C1917]/20 dark:border-white/20 text-center shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-[#EFECE4] dark:bg-[#1E2621] text-[#2D6A4F] dark:text-[#34D399] flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 fill-current" />
                </div>
                <h4 className="text-base font-bold text-[#1C1917] dark:text-[#F4F1EA]">
                  No activities logged yet for this day
                </h4>
                <p className="text-xs text-[#8C857B] dark:text-[#9CA39E] max-w-md mx-auto mt-1 leading-relaxed">
                  Set the tone for your day by logging a meal, starting your workout, or scheduling a priority focus block.
                </p>
                <div className="flex items-center justify-center gap-3 mt-5">
                  <Link
                    href="/dashboard/diet"
                    className="px-4 py-2 rounded-full bg-[#E05A47] hover:bg-[#C94A38] text-white font-semibold text-xs transition-all shadow-xs inline-flex items-center gap-1.5"
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    <span>+ Log First Meal</span>
                  </Link>
                  <Link
                    href="/dashboard/workout"
                    className="px-4 py-2 rounded-full bg-[#191D1A] dark:bg-[#2D6A4F] hover:opacity-90 text-white font-semibold text-xs transition-all shadow-xs inline-flex items-center gap-1.5"
                  >
                    <Dumbbell className="w-3.5 h-3.5" />
                    <span>+ Start Workout</span>
                  </Link>
                  <Link
                    href="/dashboard/tasks"
                    className="px-4 py-2 rounded-full bg-[#EFECE4] dark:bg-[#1E2621] hover:bg-[#E5E0D5] text-[#1C1917] dark:text-[#F4F1EA] font-semibold text-xs transition-all shadow-xs inline-flex items-center gap-1.5 border border-[#1C1917]/10 dark:border-white/10"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>+ Add Focus Task</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {rhythmItems.map((item) => {
                  if (item.type === "meal") {
                    return (
                      <div key={item.id} className="bg-[#FCFBF9] dark:bg-[#141916] rounded-[24px] p-4 border border-[#1C1917]/[0.06] dark:border-white/[0.08] shadow-xs flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-[#EFECE4] dark:bg-[#1C221E] flex items-center justify-center">
                            {item.photoUrl ? (
                              <img
                                src={item.photoUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Utensils className="w-6 h-6 text-[#2D6A4F]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-mono uppercase text-[#2D6A4F] dark:text-[#34D399] font-bold">
                              {item.timeStr} · FUEL
                            </div>
                            <h4 className="text-base font-bold text-[#1C1917] dark:text-[#F4F1EA] truncate mt-0.5">
                              {item.name}
                            </h4>
                            <p className="text-xs text-[#8C857B] dark:text-[#9CA39E] mt-0.5">
                              Logged · {item.calories} kcal · {item.protein}g Protein
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="bg-[#E0F2E9] dark:bg-[#132B20] text-[#2D6A4F] dark:text-[#34D399] text-xs font-bold px-3 py-1 rounded-full">
                            Logged ✓
                          </span>
                        </div>
                      </div>
                    );
                  }
                  if (item.type === "workout") {
                    return (
                      <div key={item.id} className="bg-[#FCFBF9] dark:bg-[#141916] rounded-[24px] p-4 border border-[#1C1917]/[0.06] dark:border-white/[0.08] shadow-xs flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-[#191D1A] text-white flex items-center justify-center">
                            <Dumbbell className="w-6 h-6 text-[#E05A47]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-mono uppercase text-[#E05A47] font-bold">
                              {item.duration} MIN · TRAINING
                            </div>
                            <h4 className="text-base font-bold text-[#1C1917] dark:text-[#F4F1EA] truncate mt-0.5">
                              {item.title}
                            </h4>
                            <p className="text-xs text-[#8C857B] dark:text-[#9CA39E] mt-0.5">
                              {item.subtitle} · ~{item.caloriesBurned} kcal
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Link
                            href="/dashboard/workout"
                            className="bg-[#E0F2E9] dark:bg-[#132B20] text-[#2D6A4F] dark:text-[#34D399] text-xs font-bold px-3 py-1 rounded-full hover:opacity-80 transition-opacity"
                          >
                            Completed ✓
                          </Link>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={item.id} className="bg-[#FCFBF9] dark:bg-[#141916] rounded-[24px] p-4 border border-[#1C1917]/[0.06] dark:border-white/[0.08] shadow-xs flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(item.id, item.status)}
                          aria-label="Toggle task completion"
                          className="w-10 h-10 rounded-2xl bg-[#EFECE4] dark:bg-[#1E2621] hover:bg-[#E05A47]/15 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        >
                          {item.status === "completed" ? (
                            <Check className="w-5 h-5 text-[#2D6A4F] stroke-[3]" />
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-stone-400" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold tracking-wider uppercase text-[#E05A47]">
                            FOCUS TASK
                          </div>
                          <h4 className={cn("text-base font-bold text-[#1C1917] dark:text-[#F4F1EA] truncate mt-0.5", item.status === "completed" && "line-through text-stone-400")}>
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-xs text-[#8C857B] dark:text-[#9CA39E] truncate mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Link
                          href="/dashboard/tasks"
                          className="bg-[#191D1A] dark:bg-[#2D6A4F] hover:opacity-90 text-white rounded-full px-4 py-1.5 text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>▷ Focus</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Momentum & Habit Compounding */}
          <div className="space-y-4">
            <ProgressTrendChart sessions={sessions} tasks={tasks} allMeals={allMeals} goals={goals} />
            <ConsistencyHeatmap sessions={sessions} tasks={tasks} allMeals={allMeals} streakDays={activeStreakDays} />
          </div>
        </div>

        {/* ── RIGHT 4 COLUMNS: Sticky Biological Co-pilot Rail ── */}
        <div className="col-span-4 space-y-5 lg:sticky lg:top-20">
          {/* 1. Orbit Adaptive Whisper Card */}
          <div className="bg-[#FCFBF9] dark:bg-[#141916] rounded-[28px] p-5 border border-[#1C1917]/[0.06] dark:border-white/[0.07] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-[#8C857B] dark:text-[#6E7872]">
                ORBIT ADAPTIVE WHISPER
              </span>
              <span className="bg-[#E0F2E9] dark:bg-[#132B20] text-[#2D6A4F] dark:text-[#34D399] text-[10px] font-bold px-2 py-0.5 rounded-full">
                ● AI Synced
              </span>
            </div>

            <blockquote className="font-serif italic text-lg text-[#1C1917] dark:text-[#F4F1EA] leading-relaxed">
              &ldquo;{mindfulWhisper}&rdquo;
            </blockquote>

            <div className="mt-4 pt-3 border-t border-[#1C1917]/[0.06] dark:border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] text-[#8C857B] dark:text-[#6E7872]">Cadence optimization active</span>
              <Link
                href="/dashboard/orbit"
                className="text-xs font-semibold text-[#2D6A4F] dark:text-[#34D399] hover:underline inline-flex items-center gap-1 transition-colors"
              >
                <span>Open in Orbit AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 2. Daily Rituals 2×2 Photo-Backed Grid */}
          <div className="bg-[#FCFBF9] dark:bg-[#141916] rounded-[28px] p-5 border border-[#1C1917]/[0.06] dark:border-white/[0.07] shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#1C1917] dark:text-[#F4F1EA]">
                DAILY NON-NEGOTIABLES
              </span>
              <span className="text-xs font-semibold text-[#2D6A4F] dark:text-[#34D399]">
                {Object.values(rituals).filter(Boolean).length} / 4 Done
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {DESKTOP_RITUALS.map((ritual) => {
                const isDone = !!rituals[ritual.id];
                return (
                  <div
                    key={ritual.id}
                    onClick={() => toggleRitual(ritual.id)}
                    className="bg-[#FCFBF9] hover:bg-[#F6F3EC] dark:bg-[#141916] dark:hover:bg-[#1C221E] p-3.5 rounded-[22px] border border-[#1C1917]/[0.08] dark:border-white/[0.08] shadow-2xs cursor-pointer transition-all flex flex-col justify-between min-h-[118px] group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-[#1C1917]/10 dark:border-white/10 bg-stone-100 dark:bg-[#1C221E] shadow-2xs">
                        <img
                          src={ritual.photo}
                          alt={ritual.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=300&q=75";
                          }}
                        />
                      </div>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0",
                          isDone
                            ? "bg-[#2D6A4F] text-white"
                            : "border-2 border-[#1C1917]/20 dark:border-white/20 bg-white dark:bg-[#1C221E]"
                        )}
                      >
                        {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="mt-2">
                      <span className="text-[9px] font-bold tracking-wider uppercase text-[#8C857B] dark:text-[#6E7872] block truncate">
                        {ritual.category}
                      </span>
                      <h5 className="font-bold text-xs text-[#1C1917] dark:text-[#F4F1EA] mt-0.5 leading-snug line-clamp-2">
                        {ritual.title}
                      </h5>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
