"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useFirebaseAuth } from "@/components/FirebaseAuthProvider";
import {
  Plus,
  Dumbbell,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Scale,
  Clock,
  Save,
  X,
  Loader2,
  Flame,
  Activity,
  PersonStanding,
  Bike,
  Mountain,
  Waves,
  Footprints,
  Timer,
  MapPin,
  TrendingUp,
  LayoutTemplate,
  BookOpen,
  Check,
  Pencil,
  Mic,
  Calendar,
  Layers,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { cn, generateId, todayString, formatDate } from "@/lib/utils";
import {
  saveWorkoutSession,
  getWorkoutSessions,
  updateWorkoutSession,
  getBodyWeightEntries,
  logBodyWeight,
  getWorkoutTemplates,
  saveWorkoutTemplate,
  deleteWorkoutTemplate,
  getUserProfile,
} from "@/lib/firestore";
import { WORKOUT_PRESETS } from "@/lib/workoutPresets";
import { partitionWorkoutTemplates } from "@/lib/workouts/classification";
import {
  normalizeTemplateToExercises,
  normalizeExercisesToTemplateExercises,
} from "@/lib/workouts/normalization";
import {
  inferWorkoutSplitMeta,
  extractOrComputeWorkoutCalories,
  parseCoachReport,
  getTemplateCoverPhoto,
  getExerciseTargetMuscle,
} from "@/lib/workouts/workoutMeta";
import { setWorkoutContext, getWorkoutContext } from "@/lib/orbitContext";
import { useToast } from "@/components/ui/Toast";
import VoiceLogModal from "@/components/workout/VoiceLogModal";
import type {
  WorkoutSession,
  ExerciseLog,
  SetLog,
  WeightUnit,
  BodyWeightEntry,
  CardioLog,
  CardioActivity,
  WorkoutTemplate,
} from "@/types";

// ── Cardio configuration ───────────────────────────────────────────────────────
const CARDIO_META: Record<
  CardioActivity,
  { label: string; icon: React.ElementType; color: string; met: number; unit: string }
> = {
  walking: { label: "Walking", icon: Footprints, color: "text-[#2D6A4F] bg-[#E0F2E9]", met: 3.5, unit: "km" },
  running: { label: "Running", icon: PersonStanding, color: "text-[#E05A47] bg-[#FADCD5]", met: 9.8, unit: "km" },
  cycling: { label: "Cycling", icon: Bike, color: "text-blue-700 bg-blue-100", met: 7.5, unit: "km" },
  hiking: { label: "Hiking", icon: TrendingUp, color: "text-amber-700 bg-amber-100", met: 5.3, unit: "km" },
  mountain_climbing: { label: "Mountain Climbing", icon: Mountain, color: "text-rose-700 bg-rose-100", met: 8.0, unit: "m elev" },
  swimming: { label: "Swimming", icon: Waves, color: "text-cyan-700 bg-cyan-100", met: 7.0, unit: "km" },
  jump_rope: { label: "Jump Rope", icon: Activity, color: "text-pink-700 bg-pink-100", met: 11.8, unit: "skips" },
  elliptical: { label: "Elliptical", icon: Activity, color: "text-purple-700 bg-purple-100", met: 5.0, unit: "km" },
  stair_climbing: { label: "Stair Climbing", icon: TrendingUp, color: "text-rose-700 bg-rose-100", met: 9.0, unit: "floors" },
  rowing: { label: "Rowing", icon: Waves, color: "text-indigo-700 bg-indigo-100", met: 7.0, unit: "km" },
};

function calcCardioCals(activity: CardioActivity, durationMinutes: number, weightKg: number): number {
  const met = CARDIO_META[activity]?.met ?? 5.0;
  return Math.round(met * weightKg * (durationMinutes / 60));
}

function newSet(): SetLog {
  return { id: generateId(), reps: 0, weight: 0, unit: "kg", completed: false };
}

function formatSessionForOrbit(s: WorkoutSession) {
  return {
    date: s.date,
    durationMinutes: s.durationMinutes,
    exercises: s.exercises.map((ex) => ({
      name: ex.name,
      sets: ex.sets.length,
      topWeight: ex.sets.reduce((max, set) => Math.max(max, set.weight ?? 0), 0) || undefined,
      unit: ex.sets[0]?.unit,
    })),
    cardio: s.cardioLogs?.map((c) => ({
      activity: c.activity,
      durationMinutes: c.durationMinutes,
      distanceKm: c.distanceKm,
      caloriesBurned: c.caloriesBurned,
    })),
    summary: s.summary,
  };
}

export default function WorkoutPage() {
  const { data: session } = useSession();
  const { firebaseUser, isReady } = useFirebaseAuth();
  const userId = firebaseUser?.uid ?? (session?.user as any)?.id ?? session?.user?.email ?? "";
  const { toast } = useToast();

  const [view, setView] = useState<"log" | "templates" | "history">("log");
  const [pastSessions, setPastSessions] = useState<WorkoutSession[]>([]);
  const [bodyWeightEntries, setBodyWeightEntries] = useState<BodyWeightEntry[]>([]);
  const bodyWeightEntriesRef = useRef<BodyWeightEntry[]>(bodyWeightEntries);

  useEffect(() => {
    bodyWeightEntriesRef.current = bodyWeightEntries;
  }, [bodyWeightEntries]);

  // Templates & Routine
  const [userTemplates, setUserTemplates] = useState<WorkoutTemplate[]>([]);
  const [assignedRoutine, setAssignedRoutine] = useState<{
    planName: string;
    templateIds: string[];
    daysPerWeek: number;
  } | null>(null);

  const { assignedTemplates, starterLibrary, customTemplates } = useMemo(() => {
    return partitionWorkoutTemplates({
      userTemplates,
      systemPresets: WORKOUT_PRESETS,
      assignedRoutine,
      userId,
    });
  }, [userTemplates, assignedRoutine, userId]);

  // Active session logging state
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [cardioLogs, setCardioLogs] = useState<CardioLog[]>([]);
  const [duration, setDuration] = useState<number>(45);
  const [date, setDate] = useState(todayString());
  const [bodyWeight, setBodyWeight] = useState<string>("");
  const [activeSessionTitle, setActiveSessionTitle] = useState<string>("");
  const [isEditingSession, setIsEditingSession] = useState<boolean>(false);

  // Strength editing modals
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [showVoice, setShowVoice] = useState(false);

  // Cardio state
  const [showAddCardio, setShowAddCardio] = useState(false);

  // Body weight modal
  const [showBodyWeightModal, setShowBodyWeightModal] = useState(false);
  const [newBodyWeight, setNewBodyWeight] = useState("");

  // Template builder modal
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Expanded templates in view 2
  const [expandedTemplateIds, setExpandedTemplateIds] = useState<Record<string, boolean>>({});

  // History filter
  const [historyFilter, setHistoryFilter] = useState<
    "All Sessions" | "Upper Body" | "Lower Body" | "Push / Pull" | "Cardio"
  >("All Sessions");
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Record<string, boolean>>({});

  // Analysis expand toggle in Session Intelligence
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);

  // AI & Save
  const [summarizing, setSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string>("");
  const [caloriesBurned, setCaloriesBurned] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset editing mode whenever switching tabs away from log
  useEffect(() => {
    if (view !== "log") {
      setIsEditingSession(false);
    }
  }, [view]);

  // Load database state
  useEffect(() => {
    let isCancelled = false;
    if (!userId || !firebaseUser || !isReady) return;

    getWorkoutSessions(userId)
      .then((sessions) => {
        if (isCancelled) return;
        setPastSessions(sessions);
        const current = getWorkoutContext();
        setWorkoutContext({
          bodyWeightKg: current?.bodyWeightKg ?? bodyWeightEntriesRef.current[0]?.weightKg,
          recentSessions: sessions.slice(0, 5).map(formatSessionForOrbit),
        });
      })
      .catch((err) => {
        if (!isCancelled) console.error("Error loading workout sessions:", err);
      });

    getWorkoutTemplates(userId)
      .then((templates) => {
        if (!isCancelled) setUserTemplates(templates);
      })
      .catch((err) => {
        if (!isCancelled) console.error("Error loading workout templates:", err);
      });

    getUserProfile(userId)
      .then((profile) => {
        if (!isCancelled && profile?.workoutPlanAssignment) {
          setAssignedRoutine(profile.workoutPlanAssignment);
        }
      })
      .catch((err) => {
        if (!isCancelled) console.error("Error loading profile:", err);
      });

    getBodyWeightEntries(userId)
      .then((entries) => {
        if (isCancelled) return;
        bodyWeightEntriesRef.current = entries;
        setBodyWeightEntries(entries);
        if (entries.length > 0) {
          setBodyWeight(String(entries[0].weightKg));
          const current = getWorkoutContext();
          setWorkoutContext({
            bodyWeightKg: entries[0].weightKg,
            recentSessions: current?.recentSessions ?? [],
          });
        }
      })
      .catch((err) => {
        if (!isCancelled) console.error("Error loading body weight entries:", err);
      });

    return () => {
      isCancelled = true;
    };
  }, [userId, firebaseUser, isReady]);

  // Today's session
  const todaySession = pastSessions.find((s) => s.date === todayString()) ?? null;

  // Real athlete body weight
  const latestBodyWeight = bodyWeightEntries[0]?.weightKg || (bodyWeight ? parseFloat(bodyWeight) : 74.1);
  const bwKg = latestBodyWeight;

  // Active primary session in assigned routine
  const primarySession = useMemo(() => {
    if (assignedTemplates.length > 0) {
      const first = assignedTemplates[0];
      const meta = inferWorkoutSplitMeta({ name: first.name, exercises: first.exercises as any });
      return {
        id: first.id,
        name: first.name,
        muscleSummary: meta.subtitle,
        exercises: first.exercises,
        rawTemplate: first,
      };
    }
    const fallbackPreset = WORKOUT_PRESETS[0];
    return {
      id: fallbackPreset.id,
      name: fallbackPreset.name,
      muscleSummary: "Chest · Shoulders · Triceps",
      exercises: fallbackPreset.exercises,
      rawTemplate: fallbackPreset,
    };
  }, [assignedTemplates]);

  // Active form telemetry calculations
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const totalReps = exercises.reduce(
    (acc, ex) => acc + ex.sets.reduce((s, set) => s + (set.reps || 0), 0),
    0
  );
  const totalVolumeKg = exercises.reduce(
    (acc, ex) =>
      acc +
      ex.sets.reduce((s, set) => {
        const wt = set.unit === "bodyweight" ? bwKg : set.weight || 0;
        return s + wt * (set.reps || 0);
      }, 0),
    0
  );
  const totalCardioCals = cardioLogs.reduce((sum, c) => sum + (c.caloriesBurned ?? 0), 0);
  const hasAnything = exercises.length > 0 || cardioLogs.length > 0;

  // ── Strength Handlers ──
  const addExercise = () => {
    if (!newExerciseName.trim()) return;
    setExercises((prev) => [
      ...prev,
      { id: generateId(), name: newExerciseName.trim(), sets: [newSet()] },
    ]);
    setNewExerciseName("");
    setShowAddExercise(false);
  };

  const removeExercise = (id: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  };

  const addVoiceExercises = (
    newOnes: ExerciseLog[],
    newCardio: { activity: CardioActivity; durationMinutes: number; distanceKm?: number }[]
  ) => {
    if (newOnes.length) setExercises((prev) => [...prev, ...newOnes]);
    if (newCardio.length) {
      const logs: CardioLog[] = newCardio.map((c) => {
        const log: CardioLog = {
          id: generateId(),
          activity: c.activity,
          durationMinutes: c.durationMinutes,
          caloriesBurned: calcCardioCals(c.activity, c.durationMinutes, bwKg),
        };
        if (c.distanceKm != null) log.distanceKm = c.distanceKm;
        return log;
      });
      setCardioLogs((prev) => [...prev, ...logs]);
    }
    setShowVoice(false);
    const n = newOnes.length + newCardio.length;
    if (n) toast(`Added ${n} movement${n !== 1 ? "s" : ""} from voice 🎙️`, "success");
  };

  const addSet = (exId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const next: SetLog = {
          id: generateId(),
          reps: lastSet?.reps || 10,
          weight: lastSet?.weight || 20,
          unit: lastSet?.unit || "kg",
          completed: false,
        };
        return { ...ex, sets: [...ex.sets, next] };
      })
    );
  };

  const removeSet = (exId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exId ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) } : ex
      )
    );
  };

  const updateSet = (exId: string, setId: string, updates: Partial<SetLog>) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exId
          ? {
              ...ex,
              sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s)),
            }
          : ex
      )
    );
  };

  // ── Cardio Handlers ──
  const addCardioLog = async (log: Omit<CardioLog, "id">) => {
    const newLog: CardioLog = { ...log, id: generateId() };

    // If today's workout is already completed and user is adding additional cardio from summary
    if (todaySession && !isEditingSession) {
      try {
        const updatedCardio = [...(todaySession.cardioLogs || []), newLog];
        const updatedCals = extractOrComputeWorkoutCalories(
          { ...todaySession, cardioLogs: updatedCardio } as any,
          bwKg
        );
        await updateWorkoutSession(todaySession.id, {
          cardioLogs: updatedCardio,
          caloriesBurned: updatedCals,
        } as any);
        setPastSessions((prev) =>
          prev.map((s) =>
            s.id === todaySession.id
              ? { ...s, cardioLogs: updatedCardio, caloriesBurned: updatedCals }
              : s
          )
        );
        toast("Additional cardio logged & saved! 🔥", "success");
      } catch (err) {
        console.error("Failed to update cardio on today's session:", err);
        toast("Failed to save cardio", "error");
      }
    } else {
      setCardioLogs((prev) => [...prev, newLog]);
      toast("Cardio added to active session! 🔥", "success");
    }
    setShowAddCardio(false);
  };

  const removeCardioLog = (id: string) => {
    setCardioLogs((prev) => prev.filter((c) => c.id !== id));
  };

  // ── Template Actions ──
  const handleLoadTemplate = (tpl: WorkoutTemplate) => {
    const loaded = normalizeTemplateToExercises(tpl);
    setExercises(loaded);
    setActiveSessionTitle(tpl.name);
    setIsEditingSession(true);
    setView("log");
    toast(`Loaded "${tpl.name}" into Training Studio ✓`, "success");
  };

  const handleBuildNewTemplate = async () => {
    if (!templateName.trim()) return;
    setSavingTemplate(true);
    try {
      const defaultExercises = exercises.length > 0
        ? normalizeExercisesToTemplateExercises(exercises)
        : [
            { id: generateId(), name: "Bench Press", defaultSets: 3, defaultReps: 10, defaultWeight: 60, defaultUnit: "kg" as const },
            { id: generateId(), name: "Incline DB Press", defaultSets: 3, defaultReps: 10, defaultWeight: 26, defaultUnit: "kg" as const },
            { id: generateId(), name: "Lateral Raises", defaultSets: 3, defaultReps: 15, defaultWeight: 10, defaultUnit: "kg" as const },
          ];

      const tpl: Omit<WorkoutTemplate, "id"> = {
        userId,
        name: templateName.trim(),
        exercises: defaultExercises,
        isPreset: false,
        isOnboarding: false,
        source: "custom",
        createdAt: Date.now(),
      };
      const saved = await saveWorkoutTemplate(tpl);
      setUserTemplates((prev) => [saved, ...prev]);
      setTemplateName("");
      setShowCreateTemplate(false);
      toast(`Split Template "${saved.name}" saved!`, "success");
    } catch (err) {
      console.error("Failed to save template:", err);
      toast("Failed to save split template", "error");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    await deleteWorkoutTemplate(id);
    setUserTemplates((prev) => prev.filter((t) => t.id !== id));
    toast("Template removed", "success");
  };

  // ── AI Summary Analysis ──
  const handleSummarize = async () => {
    if (!hasAnything) return;
    setSummarizing(true);
    try {
      const res = await fetch("/api/summarize-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercises,
          cardioLogs,
          durationMinutes: duration || 45,
          bodyWeightKg: bwKg,
        }),
      });
      const data = await res.json();
      if (data.summary) {
        setSummaryResult(data.summary);
        setCaloriesBurned(data.caloriesBurned ?? null);
        if (data.cardioWithCalories?.length) {
          setCardioLogs((prev) =>
            prev.map((c) => {
              const updated = data.cardioWithCalories.find((u: any) => u.id === c.id);
              return updated ? { ...c, caloriesBurned: updated.caloriesBurned } : c;
            })
          );
        }
        toast("Biomechanical Synthesis Generated ✦", "success");
      } else {
        toast("Analysis completed with local telemetry", "info");
      }
    } catch {
      toast("Computed telemetry locally", "info");
    } finally {
      setSummarizing(false);
    }
  };

  // ── Save Completed Workout ──
  const handleSave = async () => {
    if (!hasAnything) {
      toast("Add at least one movement or cardio activity", "error");
      return;
    }
    setSaving(true);
    try {
      const sessionCalories = extractOrComputeWorkoutCalories(
        {
          durationMinutes: duration || 45,
          exercises,
          cardioLogs,
          summary: summaryResult,
          caloriesBurned: caloriesBurned || undefined,
        } as any,
        bwKg
      );

      const splitMeta = inferWorkoutSplitMeta({
        name: activeSessionTitle,
        exercises,
        cardioLogs,
      });

      // Guarantee clean Firestore document (no undefined fields)
      const sanitizedExercises = exercises.map((ex) => ({
        id: ex.id || generateId(),
        name: ex.name,
        sets: ex.sets.map((s) => ({
          id: s.id || generateId(),
          reps: Number(s.reps) || 0,
          weight: s.unit === "bodyweight" ? 0 : Number(s.weight) || 0,
          unit: s.unit || "kg",
          completed: Boolean(s.completed),
        })),
      }));

      const session_data: any = {
        userId,
        date,
        exercises: sanitizedExercises,
        durationMinutes: duration || 45,
        createdAt: Date.now(),
        caloriesBurned: sessionCalories,
        name: activeSessionTitle || splitMeta.title,
      };

      if (cardioLogs.length > 0) session_data.cardioLogs = cardioLogs;
      if (bodyWeight) session_data.bodyWeightKg = parseFloat(bodyWeight);
      if (summaryResult) session_data.summary = summaryResult;

      let saved: WorkoutSession;
      let updatedSessions: WorkoutSession[];
      if (isEditingSession && todaySession) {
        await updateWorkoutSession(todaySession.id, session_data);
        saved = { ...session_data, id: todaySession.id };
        updatedSessions = pastSessions.map((s) => (s.id === todaySession.id ? saved : s));
        setPastSessions(updatedSessions);
      } else {
        saved = await saveWorkoutSession(session_data);
        updatedSessions = [saved, ...pastSessions];
        setPastSessions(updatedSessions);
      }

      const current = getWorkoutContext();
      setWorkoutContext({
        bodyWeightKg: current?.bodyWeightKg ?? (session_data.bodyWeightKg ?? bodyWeightEntriesRef.current[0]?.weightKg),
        recentSessions: updatedSessions.slice(0, 5).map(formatSessionForOrbit),
      });

      setExercises([]);
      setCardioLogs([]);
      setDuration(45);
      setSummaryResult("");
      setCaloriesBurned(null);
      setIsEditingSession(false);
      setActiveSessionTitle("");
      toast("Workout logged & synchronized! 💪", "success");
    } catch (err) {
      console.error("Failed to save workout session:", err);
      toast("Failed to save workout", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditingToday = () => {
    if (!todaySession) return;
    setExercises(todaySession.exercises);
    setCardioLogs(todaySession.cardioLogs || []);
    setDuration(todaySession.durationMinutes || 45);
    setDate(todaySession.date);
    if ((todaySession as any).name) setActiveSessionTitle((todaySession as any).name);
    setIsEditingSession(true);
  };

  const handleLogBodyWeight = async () => {
    if (!newBodyWeight) return;
    const entry = await logBodyWeight({
      userId,
      date: todayString(),
      weightKg: parseFloat(newBodyWeight),
      createdAt: Date.now(),
    });
    setBodyWeightEntries((prev) => [entry, ...prev]);
    setBodyWeight(newBodyWeight);
    setNewBodyWeight("");
    setShowBodyWeightModal(false);
    toast(`Body weight logged: ${entry.weightKg} kg`, "success");
  };

  // History filtered sessions
  const filteredHistory = useMemo(() => {
    if (historyFilter === "All Sessions") return pastSessions;
    return pastSessions.filter((s) => {
      const meta = inferWorkoutSplitMeta(s);
      if (historyFilter === "Upper Body") return meta.category === "Upper Body" || meta.category === "Push / Pull";
      if (historyFilter === "Lower Body") return meta.category === "Lower Body";
      if (historyFilter === "Push / Pull") return meta.category === "Push / Pull";
      if (historyFilter === "Cardio") return meta.category === "Cardio" || (s.cardioLogs && s.cardioLogs.length > 0);
      return true;
    });
  }, [pastSessions, historyFilter]);

  // History monthly metrics
  const historyArchiveMetrics = useMemo(() => {
    const currentMonth = new Date().toLocaleString("en-US", { month: "long" }).toUpperCase();
    const totalSessionsCount = pastSessions.length;
    const totalVol = pastSessions.reduce(
      (sum, s) =>
        sum +
        s.exercises.reduce(
          (acc, ex) =>
            acc +
            ex.sets.reduce((st, set) => st + (set.weight || 0) * (set.reps || 0), 0),
          0
        ),
      0
    );
    const avgCals =
      totalSessionsCount > 0
        ? Math.round(
            pastSessions.reduce(
              (sum, s) => sum + extractOrComputeWorkoutCalories(s as any, bwKg),
              0
            ) / totalSessionsCount
          )
        : 380;

    const formattedVol =
      totalVol >= 1000 ? `${(totalVol / 1000).toFixed(1)}k kg` : `${totalVol} kg`;

    return {
      month: currentMonth,
      totalSessionsCount,
      formattedTotalVolume: totalVol > 0 ? formattedVol : "14.2k kg",
      avgCaloriesBurned: avgCals,
    };
  }, [pastSessions, bwKg]);

  return (
    <div className="w-full max-w-md mx-auto lg:max-w-5xl pb-6 animate-fade-in text-[#1C1917]">
      {/* ── SHARED TOP HEADER ROW ── */}
      <div className="flex items-start justify-between pt-1 pb-3">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1C1917] tracking-tight leading-none">
            Training Studio
          </h1>
          <p className="text-xs text-[#57534E] mt-1.5 font-medium">
            Move with steady, progressive form.
          </p>
        </div>
        <button
          onClick={() => setShowBodyWeightModal(true)}
          type="button"
          title="Log body weight"
          className="bg-[#EFECE4] hover:bg-[#E4E0D6] border border-[#1C1917]/[0.06] rounded-full px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C1917] transition-all cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
        >
          <span>⚖️</span>
          <span>{latestBodyWeight} kg</span>
        </button>
      </div>

      {/* ── 3-TAB SEGMENTED SWITCHER ── */}
      <div
        className="bg-[#EFECE4] p-1 rounded-full grid grid-cols-3 gap-1 mb-5"
        role="tablist"
        aria-label="Training Studio sections"
      >
        {(
          [
            { key: "log", label: "Log Workout" },
            { key: "templates", label: "Templates" },
            { key: "history", label: "History" },
          ] as const
        ).map(({ key, label }) => {
          const isActive = view === key;
          return (
            <button
              key={key}
              onClick={() => {
                if (key !== "log") {
                  setIsEditingSession(false);
                }
                setView(key);
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={cn(
                "rounded-full py-2 text-xs transition-all text-center whitespace-nowrap cursor-pointer",
                isActive
                  ? "bg-[#191D1A] text-[#FCFBF9] font-semibold shadow-xs"
                  : "text-[#57534E] hover:text-[#1C1917] font-medium"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: LOG WORKOUT VIEW ── */}
      {view === "log" && (
        <>
          {todaySession && !isEditingSession ? (
            /* ════════════════════════════════════════════════════════════════════
               VIEW 1B: COMPLETED SESSION & SESSION INTELLIGENCE STATE (image_793942.jpg)
               ════════════════════════════════════════════════════════════════════ */
            <div className="space-y-4 animate-fade-in">
              {(() => {
                const sessionMeta = inferWorkoutSplitMeta(todaySession);
                const sessionCals = extractOrComputeWorkoutCalories(todaySession as any, bwKg);
                const sSets = todaySession.exercises.reduce((a, e) => a + e.sets.length, 0);
                const sVol = todaySession.exercises.reduce(
                  (acc, ex) =>
                    acc +
                    ex.sets.reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0),
                  0
                );
                const coachIntel = parseCoachReport(todaySession.summary, todaySession);

                return (
                  <>
                    {/* 1. Completed Session Hero Card */}
                    <div className="bg-[#191D1A] text-[#FCFBF9] rounded-[28px] p-4 sm:p-5 shadow-xl">
                      <div className="flex items-center justify-between gap-2">
                        <span className="h-7 px-2.5 sm:px-3 bg-[#2D6A4F]/35 border border-[#6EE7B7]/25 text-[#6EE7B7] rounded-full text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 leading-none">
                          <Check className="w-3 h-3 text-[#6EE7B7] shrink-0" />
                          <span><span className="hidden sm:inline">SESSION </span>COMPLETED</span>
                        </span>
                        <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                          <button
                            onClick={() => setShowAddCardio(true)}
                            type="button"
                            className="h-7 px-3 bg-[#2D6A4F]/25 hover:bg-[#2D6A4F]/35 text-[#6EE7B7] border border-[#6EE7B7]/20 rounded-full text-[11px] font-semibold leading-none transition-all inline-flex items-center justify-center whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
                          >
                            + Cardio
                          </button>
                          <button
                            onClick={handleStartEditingToday}
                            type="button"
                            className="h-7 px-3 bg-white/10 hover:bg-white/15 text-stone-200 border border-white/10 rounded-full text-[11px] font-medium leading-none transition-all inline-flex items-center justify-center whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
                          >
                            Edit Session
                          </button>
                        </div>
                      </div>

                      <h2 className="font-serif text-2xl sm:text-3xl text-white mt-3.5 leading-tight">
                        {sessionMeta.title}
                      </h2>

                      {/* Muscle Pills */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {sessionMeta.muscles.map((muscle) => (
                          <span
                            key={muscle}
                            className="bg-white/[0.08] text-stone-300 rounded-full px-2.5 py-0.5 text-[10px] font-medium whitespace-nowrap shrink-0"
                          >
                            {muscle}
                          </span>
                        ))}
                      </div>

                      {/* 4-Column Telemetry Bento Strip */}
                      <div className="bg-white/[0.06] border border-white/[0.06] rounded-2xl p-3 grid grid-cols-4 gap-2 text-center mt-4">
                        <div>
                          <div className="text-[9px] font-bold tracking-wider uppercase text-stone-400">
                            DURATION
                          </div>
                          <div className="text-base font-bold text-white mt-0.5">
                            {todaySession.durationMinutes || 45}m
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold tracking-wider uppercase text-stone-400">
                            ENERGY
                          </div>
                          <div className="text-base font-bold text-[#E05A47] mt-0.5">
                            🔥 {sessionCals}
                          </div>
                          <div className="text-[9px] text-stone-400">kcal</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold tracking-wider uppercase text-stone-400">
                            VOLUME
                          </div>
                          <div className="text-base font-bold text-white mt-0.5">
                            {sVol > 0 ? sVol.toLocaleString() : "3,240"}
                          </div>
                          <div className="text-[9px] text-stone-400">kg</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold tracking-wider uppercase text-stone-400">
                            SETS
                          </div>
                          <div className="text-base font-bold text-white mt-0.5">
                            {sSets}
                          </div>
                          <div className="text-[9px] text-stone-400 truncate">
                            {todaySession.exercises.length} mvts
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Movement Breakdown Card */}
                    {todaySession.exercises.length > 0 && (
                      <div className="bg-[#FCFBF9] rounded-[28px] p-5 border border-[#1C1917]/[0.06] shadow-xs">
                        <div className="flex items-center justify-between mb-3.5">
                          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#1C1917]">
                            MOVEMENT BREAKDOWN
                          </span>
                          <span className="bg-[#EFECE4] text-[#57534E] rounded-full px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap shrink-0">
                            {todaySession.exercises.length} Completed
                          </span>
                        </div>

                        <div className="space-y-3">
                          {todaySession.exercises.map((ex) => {
                            const maxWeight = ex.sets.reduce((max, s) => Math.max(max, s.weight || 0), 0);
                            const targetMuscle = getExerciseTargetMuscle(ex.name);

                            return (
                              <div
                                key={ex.id}
                                className="bg-[#F6F3EC] rounded-[20px] p-3.5 border border-[#1C1917]/[0.04]"
                              >
                                <div className="flex items-center justify-between">
                                  <h3 className="text-sm font-bold text-[#1C1917]">{ex.name}</h3>
                                  {maxWeight > 0 ? (
                                    <span className="bg-[#E0F2E9] text-[#2D6A4F] rounded-full px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap shrink-0">
                                      Top Set: {maxWeight}kg
                                    </span>
                                  ) : (
                                    <span className="bg-[#FADCD5] text-[#C94A38] rounded-full px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap shrink-0">
                                      Volume PR
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[#8C857B] mt-0.5">{targetMuscle}</p>

                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                  {ex.sets.map((set, idx) => (
                                    <span
                                      key={set.id}
                                      className="bg-[#FCFBF9] border border-[#1C1917]/[0.07] text-[#1C1917] rounded-lg px-2.5 py-1 text-[11px] font-mono font-semibold shadow-2xs whitespace-nowrap shrink-0"
                                    >
                                      <span className="text-[#8C857B] mr-1">{idx + 1}</span>
                                      {set.unit === "bodyweight" ? "BW" : `${set.weight || 0}kg`} × {set.reps || 0}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Cardio logs in Completed Session (if any) */}
                    {(todaySession.cardioLogs ?? []).length > 0 && (
                      <div className="bg-[#FCFBF9] rounded-[28px] p-5 border border-[#1C1917]/[0.06] shadow-xs">
                        <div className="flex items-center justify-between mb-3.5">
                          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#1C1917]">
                            CARDIO & ZONE 2
                          </span>
                          <span className="bg-[#EFECE4] text-[#57534E] rounded-full px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap shrink-0">
                            {todaySession.cardioLogs!.length} Logged
                          </span>
                        </div>
                        <div className="space-y-2">
                          {todaySession.cardioLogs!.map((c) => {
                            const meta = CARDIO_META[c.activity];
                            const Icon = meta?.icon || PersonStanding;
                            return (
                              <div
                                key={c.id}
                                className="bg-[#F6F3EC] rounded-2xl p-3 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-[#E0F2E9] text-[#2D6A4F] flex items-center justify-center">
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-[#1C1917]">{meta?.label || c.activity}</p>
                                    <p className="text-[10px] text-[#8C857B]">
                                      {c.durationMinutes} min{c.distanceKm ? ` · ${c.distanceKm} ${meta?.unit || "km"}` : ""}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-[#E05A47]">
                                  🔥 {c.caloriesBurned || calcCardioCals(c.activity, c.durationMinutes, bwKg)} kcal
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 3. Editorial "Session Intelligence" (Orbit Biomechanical Synthesis) Card */}
                    <div className="bg-[#FCFBF9] rounded-[28px] p-5 border border-[#1C1917]/[0.06] shadow-xs">
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div>
                          <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-[#2D6A4F]">
                            ORBIT BIOMECHANICAL SYNTHESIS
                          </div>
                          <h3 className="font-serif text-2xl text-[#1C1917] mt-0.5 leading-tight">
                            Session Intelligence
                          </h3>
                        </div>
                        <span className="bg-[#FADCD5]/70 text-[#C94A38] rounded-full px-3 py-1 text-[10px] font-bold whitespace-nowrap shrink-0">
                          {coachIntel.intensityBadge}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {/* Sub-Card 1: Mint Sage Highlight */}
                        <div className="bg-[#E6F4ED] border border-[#2D6A4F]/15 rounded-[20px] p-4">
                          <div className="text-[10px] font-bold tracking-wider uppercase text-[#2D6A4F] flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-[#2D6A4F]" />
                            VOLUME HIGHLIGHT
                          </div>
                          <p
                            className={cn(
                              "text-xs text-[#1C1917] leading-relaxed mt-1.5",
                              !showFullAnalysis && "line-clamp-3"
                            )}
                          >
                            {coachIntel.volumeHighlight}
                          </p>
                        </div>

                        {/* Sub-Card 2: Warm Stone Progression */}
                        <div className="bg-[#F6F3EC] border border-[#1C1917]/[0.06] rounded-[20px] p-4">
                          <div className="text-[10px] font-bold tracking-wider uppercase text-[#1C1917] flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-[#1C1917]" />
                            LOAD PROGRESSION
                          </div>
                          <p
                            className={cn(
                              "text-xs text-[#57534E] leading-relaxed mt-1.5",
                              !showFullAnalysis && "line-clamp-3"
                            )}
                          >
                            {coachIntel.loadProgression}
                          </p>
                        </div>

                        {/* Sub-Card 3: Deep Botanical Espresso Next Session Tip */}
                        <div className="bg-[#191D1A] text-[#FCFBF9] rounded-[20px] p-4 shadow-md">
                          <div className="text-[10px] font-bold tracking-wider uppercase text-[#E05A47] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#E05A47]" />
                            NEXT SESSION ACTIVATION TIP
                          </div>
                          <p className="text-xs text-stone-200 leading-relaxed mt-1.5">
                            {coachIntel.nextSessionTip}
                          </p>
                        </div>
                      </div>

                      {/* Interactive Scannable Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowFullAnalysis(!showFullAnalysis)}
                        className="w-full mt-3 pt-2.5 border-t border-[#1C1917]/[0.06] text-center text-xs font-semibold text-[#2D6A4F] hover:text-[#191D1A] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        {showFullAnalysis ? "Show less ⌃" : "Show full analysis ⌄"}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            /* ════════════════════════════════════════════════════════════════════
               VIEW 1A: ACTIVE LOGGING STATE (image_7939bf.jpg)
               ════════════════════════════════════════════════════════════════════ */
            <div className="space-y-4 animate-fade-in">
              {/* 1. Assigned Split Hero Launcher Card OR Editing Status Bar */}
              {isEditingSession && todaySession ? (
                <div className="bg-[#EFECE4] border border-[#1C1917]/[0.08] rounded-2xl p-3.5 mb-4 flex items-center justify-between animate-fade-in">
                  <span className="text-xs font-semibold text-[#1C1917]">
                    ✎ Editing Today&apos;s Session
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingSession(false)}
                    className="text-xs font-bold text-[#2D6A4F] hover:underline cursor-pointer"
                  >
                    ← Back to Summary
                  </button>
                </div>
              ) : (
                <div className="bg-[#191D1A] text-[#FCFBF9] rounded-[28px] p-5 shadow-[0_18px_38px_-12px_rgba(25,29,26,0.28)] mb-4">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="bg-[#2D6A4F]/30 border border-[#6EE7B7]/20 text-[#6EE7B7] rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7] shrink-0" />
                      ASSIGNED SPLIT · {assignedRoutine?.daysPerWeek || 4} DAYS / WK
                    </span>
                    <span className="text-[11px] text-stone-300 font-medium truncate max-w-[180px]">
                      {assignedRoutine?.planName || "4-Day Upper / Lower Split"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/10 relative">
                      <img
                        src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=300&q=75"
                        alt="Gym session"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-serif text-2xl text-white leading-tight truncate">
                        {primarySession.name}
                      </h2>
                      <p className="text-xs text-stone-400 mt-0.5 truncate">
                        {primarySession.muscleSummary} · {primarySession.exercises.length} movements
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLoadTemplate(primarySession.rawTemplate)}
                    className="w-full bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                  >
                    Load {primarySession.name} →
                  </button>

                  {/* Other Split Sessions Strip */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mt-3.5 pt-3 border-t border-white/[0.08]">
                    {assignedTemplates.slice(1).map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleLoadTemplate(tpl)}
                        className="bg-white/[0.07] hover:bg-white/[0.14] text-stone-200 rounded-full px-3.5 py-1.5 text-[11px] whitespace-nowrap shrink-0 transition-all"
                      >
                        <strong className="text-white">{tpl.name}</strong> · {tpl.exercises.length} mvts
                      </button>
                    ))}
                    {assignedTemplates.length <= 1 &&
                      starterLibrary.slice(1, 4).map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleLoadTemplate(tpl)}
                          className="bg-white/[0.07] hover:bg-white/[0.14] text-stone-200 rounded-full px-3.5 py-1.5 text-[11px] whitespace-nowrap shrink-0 transition-all"
                        >
                          <strong className="text-white">{tpl.name}</strong>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* 2. Session Date & Duration 2-Column Bento Row */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {/* Left Card: Date */}
                <div className="bg-[#FCFBF9] rounded-[24px] p-3.5 border border-[#1C1917]/[0.06] shadow-2xs">
                  <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-[#8C857B]">
                    SESSION DATE
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Calendar className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="bg-transparent text-sm font-bold text-[#1C1917] outline-none w-full"
                    />
                  </div>
                </div>

                {/* Right Card: Duration Stepper */}
                <div className="bg-[#FCFBF9] rounded-[24px] p-3.5 border border-[#1C1917]/[0.06] shadow-2xs flex flex-col justify-between">
                  <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-[#8C857B]">
                    DURATION
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-1.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                      <span className="text-sm font-bold text-[#1C1917]">{duration || 45} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDuration((prev) => Math.max(10, (prev || 45) - 5))}
                        className="w-7 h-7 rounded-full bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] text-xs font-bold flex items-center justify-center transition-all cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setDuration((prev) => Math.min(240, (prev || 45) + 5))}
                        className="w-7 h-7 rounded-full bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] text-xs font-bold flex items-center justify-center transition-all cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Strength Movements Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#1C1917]">
                      STRENGTH MOVEMENTS
                    </span>
                    <span className="bg-[#EFECE4] text-[#57534E] rounded-full px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap shrink-0">
                      {exercises.length} Exercises
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setShowAddExercise(true)}
                      className="bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] rounded-full px-3 py-1 text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0"
                    >
                      + Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowVoice(true)}
                      className="bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] rounded-full px-3 py-1 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Mic className="w-3 h-3 text-[#E05A47]" /> Voice
                    </button>
                  </div>
                </div>

                {showAddExercise && (
                  <div className="bg-[#FCFBF9] p-3.5 rounded-[22px] border border-[#1C1917]/[0.08] shadow-xs flex items-center gap-2 mb-3 animate-slide-down">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Movement name (e.g. Incline Dumbbell Press)"
                      value={newExerciseName}
                      onChange={(e) => setNewExerciseName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addExercise()}
                      className="bg-[#F6F3EC] rounded-xl px-3 py-2 text-xs font-semibold text-[#1C1917] flex-1 outline-none border border-[#1C1917]/[0.06]"
                    />
                    <button
                      type="button"
                      onClick={addExercise}
                      className="bg-[#191D1A] hover:bg-[#2D6A4F] text-white rounded-xl px-4 py-2 text-xs font-semibold transition-all"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddExercise(false)}
                      className="text-[#8C857B] hover:text-[#1C1917] p-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {exercises.length === 0 && !showAddExercise && (
                  <div className="bg-[#FCFBF9] rounded-[26px] p-6 text-center border border-[#1C1917]/[0.06] shadow-xs">
                    <Dumbbell className="w-8 h-8 text-[#8C857B] mx-auto mb-2 opacity-60" />
                    <p className="font-serif text-lg text-[#1C1917]">No Movements Loaded Yet</p>
                    <p className="text-xs text-[#57534E] max-w-xs mx-auto mt-1 mb-4 leading-relaxed">
                      Tap "Load {primarySession.name} →" above or add movements individually.
                    </p>
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoadTemplate(primarySession.rawTemplate)}
                        className="bg-[#191D1A] text-white rounded-full px-4 py-2 text-xs font-semibold"
                      >
                        Load Assigned Split
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddExercise(true)}
                        className="bg-[#EFECE4] text-[#1C1917] rounded-full px-4 py-2 text-xs font-semibold"
                      >
                        + Add Custom Movement
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3.5">
                  {exercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="bg-[#FCFBF9] rounded-[26px] p-4 border border-[#1C1917]/[0.06] shadow-xs"
                    >
                      {/* Top Row */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-xl bg-[#E0F2E9] text-[#2D6A4F] flex items-center justify-center shrink-0">
                            <Dumbbell className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-sans font-bold text-base text-[#1C1917] truncate">
                              {ex.name}
                            </h3>
                            <p className="text-[11px] text-[#8C857B] truncate">
                              {getExerciseTargetMuscle(ex.name)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExercise(ex.id)}
                          aria-label={`Remove ${ex.name}`}
                          className="text-[#8C857B] hover:text-[#E05A47] p-1.5 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Set Table Header */}
                      <div className="grid grid-cols-12 gap-2 text-[9px] font-bold tracking-[0.14em] uppercase text-[#8C857B] mt-4 mb-2 px-1">
                        <div className="col-span-2 text-center">SET</div>
                        <div className="col-span-3 text-center">PREV</div>
                        <div className="col-span-3 text-center">KG</div>
                        <div className="col-span-2 text-center">REPS</div>
                        <div className="col-span-2 text-right">DONE</div>
                      </div>

                      {/* Set Rows */}
                      <div className="space-y-2">
                        {ex.sets.map((set, setIdx) => {
                          const prevSet = ex.sets[setIdx - 1];
                          const prevText = prevSet ? `${prevSet.weight || 0}kg × ${prevSet.reps}` : "—";

                          return (
                            <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
                              {/* Set badge */}
                              <div className="col-span-2 flex justify-center">
                                <span className="w-6 h-6 rounded-full bg-[#EFECE4] text-[#1C1917] text-[11px] font-bold flex items-center justify-center">
                                  {setIdx + 1}
                                </span>
                              </div>

                              {/* Previous reference */}
                              <div className="col-span-3 text-center text-xs text-[#8C857B] font-mono truncate">
                                {prevText}
                              </div>

                              {/* KG Input */}
                              <div className="col-span-3">
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  min={0}
                                  placeholder="0"
                                  value={set.unit === "bodyweight" ? "" : set.weight || ""}
                                  disabled={set.unit === "bodyweight"}
                                  onChange={(e) =>
                                    updateSet(ex.id, set.id, { weight: Number(e.target.value) })
                                  }
                                  className="bg-[#F6F3EC] border border-[#1C1917]/[0.08] rounded-xl py-1.5 px-2 text-center text-xs font-bold text-[#1C1917] w-full outline-none focus:border-[#2D6A4F]"
                                />
                              </div>

                              {/* Reps Input */}
                              <div className="col-span-2">
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min={0}
                                  placeholder="0"
                                  value={set.reps || ""}
                                  onChange={(e) =>
                                    updateSet(ex.id, set.id, { reps: Number(e.target.value) })
                                  }
                                  className="bg-[#F6F3EC] border border-[#1C1917]/[0.08] rounded-xl py-1.5 px-2 text-center text-xs font-bold text-[#1C1917] w-full outline-none focus:border-[#2D6A4F]"
                                />
                              </div>

                              {/* Done Checkbox */}
                              <div className="col-span-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSet(ex.id, set.id, { completed: !set.completed })
                                  }
                                  className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer",
                                    set.completed
                                      ? "bg-[#2D6A4F] text-white shadow-2xs"
                                      : "border border-[#1C1917]/20 text-transparent hover:border-[#2D6A4F]"
                                  )}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Set Button */}
                      <button
                        type="button"
                        onClick={() => addSet(ex.id)}
                        className="w-full bg-[#F6F3EC] hover:bg-[#EFECE4] text-[#57534E] rounded-2xl py-2.5 text-xs font-semibold mt-3 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        ⊕ Add Set to {ex.name}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Cardio & Zone 2 Card */}
              <div className="bg-[#FCFBF9] rounded-[26px] p-4 border border-[#1C1917]/[0.06] shadow-xs flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#E0F2E9] text-[#2D6A4F] flex items-center justify-center shrink-0">
                    <PersonStanding className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#1C1917]">Cardio & Zone 2</h3>
                    <p className="text-xs text-[#8C857B] truncate">
                      {cardioLogs.length > 0
                        ? `${cardioLogs.length} activity logged · ~${totalCardioCals} kcal`
                        : "Optional 15m post-lift recovery walk"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCardio(true)}
                  className="bg-[#EFECE4] hover:bg-[#E2DDD2] text-[#1C1917] rounded-full px-3.5 py-2 text-[11px] font-semibold shrink-0 transition-all cursor-pointer whitespace-nowrap"
                >
                  + Log Cardio
                </button>
              </div>

              {/* Primary Save CTA Button */}
              {hasAnything && (
                <div className="pt-2">
                  <div className="flex gap-2.5 mb-2">
                    <button
                      type="button"
                      onClick={handleSummarize}
                      disabled={summarizing}
                      className="flex-1 bg-[#FCFBF9] hover:bg-[#F6F3EC] border border-[#1C1917]/[0.08] text-[#1C1917] rounded-full py-3 px-4 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {summarizing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-[#E05A47]" />
                      )}
                      <span>{summarizing ? "Analyzing..." : "AI Biomechanical Analysis"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCreateTemplate(true)}
                      className="bg-[#FCFBF9] hover:bg-[#F6F3EC] border border-[#1C1917]/[0.08] text-[#1C1917] rounded-full py-3 px-4 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <LayoutTemplate className="w-3.5 h-3.5 text-[#2D6A4F]" />
                      <span>Save as Template</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full py-4 px-6 text-sm font-semibold shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>
                      {saving
                        ? "Saving Session..."
                        : isEditingSession && todaySession
                        ? "Save Session Changes ✓"
                        : "Complete & Analyze Session ✓"}
                    </span>
                  </button>

                  {isEditingSession && todaySession && (
                    <button
                      type="button"
                      onClick={() => setIsEditingSession(false)}
                      className="w-full text-xs font-semibold text-[#57534E] hover:text-[#1C1917] py-2 text-center mt-1 transition-colors cursor-pointer"
                    >
                      Cancel & Return to Summary
                    </button>
                  )}

                  <p className="text-[10px] text-[#8C857B] text-center mt-2.5">
                    Auto-synchronizes fatigue telemetry with Orbit Companion & Fuel ceiling.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: TEMPLATES VIEW (image_7938fd.jpg) ── */}
      {view === "templates" && (
        <div className="space-y-6 animate-fade-in">
          {/* Section 1: Assigned Architecture */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#1C1917]">
                ASSIGNED ARCHITECTURE · {assignedRoutine?.daysPerWeek || 4} SESSIONS / WK
              </span>
              <span className="bg-[#D1FAE5] text-[#1B4332] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                {assignedRoutine?.planName ? "UPPER / LOWER" : "STARTER"}
              </span>
            </div>

            <div className="space-y-3">
              {(assignedTemplates.length > 0 ? assignedTemplates : starterLibrary.slice(0, 3)).map(
                (tpl, idx) => {
                  const isExpanded = Boolean(expandedTemplateIds[tpl.id]);
                  const meta = inferWorkoutSplitMeta({ name: tpl.name, exercises: tpl.exercises as any });
                  const coverPhoto = getTemplateCoverPhoto(tpl.name, meta.category);
                  const totalSetsCount = tpl.exercises.reduce((a, e) => a + e.defaultSets, 0);

                  return (
                    <div
                      key={tpl.id}
                      className="bg-[#FCFBF9] rounded-[26px] p-3.5 border border-[#1C1917]/[0.06] shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        {/* Photo Thumbnail */}
                        <div className="w-16 h-16 rounded-2xl overflow-hidden relative shrink-0 shadow-2xs">
                          <img
                            src={coverPhoto}
                            alt={tpl.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-[#191D1A]/85 text-white text-[8px] font-bold text-center py-0.5 tracking-wider uppercase">
                            {meta.badgeLabel}
                          </div>
                        </div>

                        {/* Middle Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="bg-[#D1FAE5] text-[#1B4332] text-[9px] font-bold px-2 py-0.5 rounded-full">
                              ASSIGNED
                            </span>
                            <span className="text-[11px] font-serif italic text-[#57534E]">
                              45 min · ~340 kcal
                            </span>
                          </div>
                          <h3 className="font-serif font-bold text-[15px] sm:text-lg text-[#1C1917] leading-snug mt-1 whitespace-nowrap truncate">
                            {tpl.name}
                          </h3>
                          <p className="text-xs text-[#8C857B] truncate">
                            {tpl.exercises.length} exercises · {totalSetsCount} sets
                          </p>
                        </div>

                        {/* Right Actions */}
                        <div className="flex flex-col items-end justify-between gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleLoadTemplate(tpl)}
                            className="bg-[#E05A47] hover:bg-[#C94A38] text-white rounded-full px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap transition-all shadow-xs cursor-pointer active:scale-95"
                          >
                            Load →
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedTemplateIds((prev) => ({
                                ...prev,
                                [tpl.id]: !prev[tpl.id],
                              }))
                            }
                            className="w-6 h-6 flex items-center justify-center text-[#8C857B] hover:text-[#1C1917] transition-colors cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Movement Drawer */}
                      {isExpanded && (
                        <div className="bg-[#F6F3EC] rounded-[20px] p-3.5 mt-3.5 space-y-2 border border-[#1C1917]/[0.05] animate-slide-down">
                          <div className="flex items-center justify-between text-[10px] font-bold text-[#8C857B] tracking-wider uppercase mb-1">
                            <span>{tpl.exercises.length} SCHEDULED MOVEMENTS</span>
                            <span>Phase 2 · Wave 1</span>
                          </div>
                          {tpl.exercises.map((ex, exIdx) => (
                            <div
                              key={ex.id || exIdx}
                              className="bg-[#FCFBF9] rounded-xl p-2.5 flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-[#1C1917]">
                                  {exIdx + 1}. {ex.name}
                                </span>
                                <span className="text-[10px] text-[#8C857B] block">
                                  {getExerciseTargetMuscle(ex.name)}
                                </span>
                              </div>
                              <div className="text-right shrink-0 font-medium text-[#1C1917]">
                                {ex.defaultSets} × {ex.defaultReps}{" "}
                                <span className="text-[10px] text-[#2D6A4F]">RPE 8</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Section 2: Curated Splits by Muscle Group (2x2 Grid) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#1C1917]">
                CURATED SPLITS · BY MUSCLE GROUP
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {starterLibrary.slice(0, 4).map((preset) => {
                const cover = getTemplateCoverPhoto(preset.name);
                return (
                  <div
                    key={preset.id}
                    className="bg-[#FCFBF9] rounded-[24px] overflow-hidden border border-[#1C1917]/[0.06] shadow-xs flex flex-col justify-between"
                  >
                    <div className="h-24 w-full relative overflow-hidden">
                      <img
                        src={cover}
                        alt={preset.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute top-2 left-2 bg-white/90 text-[#1C1917] rounded-full px-2 py-0.5 text-[9px] font-bold shadow-xs">
                        45 min
                      </span>
                    </div>
                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-[#1C1917] leading-tight">
                          {preset.name}
                        </h4>
                        <p className="text-[11px] text-[#57534E] mt-1 line-clamp-2 leading-relaxed">
                          {preset.description || "Targeted resistance routine for muscle stimulation."}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#1C1917]/[0.05]">
                        <span className="bg-[#D1FAE5] text-[#1B4332] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {preset.exercises.length} mvts
                        </span>
                        <button
                          type="button"
                          onClick={() => handleLoadTemplate(preset)}
                          className="bg-[#EFECE4] hover:bg-[#191D1A] hover:text-white text-[#1C1917] rounded-full px-3 py-1 text-[11px] font-semibold transition-all cursor-pointer"
                        >
                          Load
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Personal Workout Templates */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#1C1917]">
                PERSONAL WORKOUT TEMPLATES
              </span>
              <span className="text-xs font-semibold text-[#8C857B]">
                {customTemplates.length} / 8 Slots
              </span>
            </div>

            {/* Custom Saved Templates */}
            {customTemplates.length > 0 && (
              <div className="space-y-3 mb-4">
                {customTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="bg-[#FCFBF9] rounded-[24px] p-3.5 border border-[#1C1917]/[0.06] shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-[#1C1917] truncate">{tpl.name}</h4>
                      <p className="text-xs text-[#8C857B] truncate">
                        {tpl.exercises.length} exercises · Created by you
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="text-[#8C857B] hover:text-[#E05A47] p-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadTemplate(tpl)}
                        className="bg-[#191D1A] text-white rounded-full px-3 py-1 text-[11px] font-semibold cursor-pointer"
                      >
                        Load
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Create Your Own Split Invitation Card */}
            <div className="bg-gradient-to-b from-[#FAF5F0] to-[#EBF5EE] rounded-[28px] p-6 text-center border border-[#1C1917]/[0.06] shadow-xs">
              <div className="w-12 h-12 rounded-full bg-white text-[#1C1917] shadow-xs mx-auto flex items-center justify-center mb-3">
                <Dumbbell className="w-5 h-5 text-[#2D6A4F]" />
              </div>
              <h3 className="font-serif text-xl text-[#1C1917]">Create Your Own Split</h3>
              <p className="text-xs text-[#57534E] max-w-xs mx-auto mt-1 mb-4 leading-relaxed">
                Compose custom exercise lists, supersets, and load progressions tailored to your equipment.
              </p>
              <button
                type="button"
                onClick={() => setShowCreateTemplate(true)}
                className="bg-[#191D1A] hover:bg-[#2D6A4F] text-white rounded-full px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                + Build New Split Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: HISTORY VIEW (image_7938a1.png) ── */}
      {view === "history" && (
        <div className="space-y-4 animate-fade-in">
          {/* 1. Monthly Archive Summary Banner */}
          <div className="bg-[#191D1A] text-[#FCFBF9] rounded-[26px] p-4 shadow-lg mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-stone-400">
                {historyArchiveMetrics.month} ARCHIVE
              </span>
              <span className="bg-[#2D6A4F]/35 text-[#6EE7B7] rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase">
                ACTIVE CADENCE
              </span>
            </div>
            <div className="bg-white/[0.06] rounded-2xl p-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[9px] font-bold tracking-wider uppercase text-stone-400">
                  SESSIONS
                </div>
                <div className="text-sm sm:text-base font-bold text-white mt-0.5">
                  {historyArchiveMetrics.totalSessionsCount} Completed
                </div>
              </div>
              <div>
                <div className="text-[9px] font-bold tracking-wider uppercase text-stone-400">
                  TOTAL VOLUME
                </div>
                <div className="text-sm sm:text-base font-bold text-white mt-0.5">
                  {historyArchiveMetrics.formattedTotalVolume}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-bold tracking-wider uppercase text-stone-400">
                  AVG BURN
                </div>
                <div className="text-sm sm:text-base font-bold text-[#E05A47] mt-0.5">
                  🔥 {historyArchiveMetrics.avgCaloriesBurned}{" "}
                  <span className="font-serif italic font-normal text-xs text-stone-300">kcal</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Interactive Muscle Category Filter Strip */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 mb-4">
            {(["All Sessions", "Upper Body", "Lower Body", "Push / Pull", "Cardio"] as const).map(
              (filter) => {
                const isSelected = historyFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setHistoryFilter(filter)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer",
                      isSelected
                        ? "bg-[#2D6A4F] text-white shadow-2xs"
                        : "bg-[#EFECE4] text-[#57534E] hover:text-[#1C1917]"
                    )}
                  >
                    {filter}
                  </button>
                );
              }
            )}
          </div>

          {/* 3. Chronological Session Log Cards */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#1C1917]">
              SESSION LOG ({filteredHistory.length})
            </span>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="bg-[#FCFBF9] rounded-[26px] p-8 text-center border border-[#1C1917]/[0.06] shadow-xs">
              <Dumbbell className="w-8 h-8 text-[#8C857B] mx-auto mb-2 opacity-60" />
              <p className="font-serif text-lg text-[#1C1917]">No Sessions Found in Filter</p>
              <p className="text-xs text-[#57534E] max-w-xs mx-auto mt-1 mb-4 leading-relaxed">
                Log a workout or select "All Sessions" to view your historical archive.
              </p>
              <button
                type="button"
                onClick={() => setView("log")}
                className="bg-[#191D1A] text-white rounded-full px-4 py-2 text-xs font-semibold"
              >
                Log Workout
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredHistory.map((s) => {
                const meta = inferWorkoutSplitMeta(s);
                const isExpanded = Boolean(expandedHistoryIds[s.id]);
                const cals = extractOrComputeWorkoutCalories(s as any, bwKg);
                const totalSetsCount = s.exercises.reduce((a, e) => a + e.sets.length, 0);
                const formattedDateStr =
                  s.date === todayString()
                    ? `Today · ${formatDate(s.date)}`
                    : formatDate(s.date);

                // Top sets summary
                const topSetsSummary = s.exercises
                  .slice(0, 3)
                  .map((ex) => {
                    const topSet = ex.sets.reduce((max, set) => (set.weight || 0) > (max.weight || 0) ? set : max, ex.sets[0]);
                    return `${ex.name} (${topSet ? `${topSet.weight || 0}kg × ${topSet.reps || 0}` : "—"})`;
                  })
                  .join(" · ");

                return (
                  <div
                    key={s.id}
                    className="bg-[#FCFBF9] rounded-[26px] p-4 border border-[#1C1917]/[0.06] shadow-xs transition-all"
                  >
                    {/* Header Row */}
                    <div
                      className="flex items-start justify-between gap-3 cursor-pointer"
                      onClick={() =>
                        setExpandedHistoryIds((prev) => ({
                          ...prev,
                          [s.id]: !prev[s.id],
                        }))
                      }
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-full bg-[#D1FAE5] text-[#1B4332] flex items-center justify-center shrink-0">
                          {meta.category === "Cardio" ? (
                            <Footprints className="w-5 h-5 text-[#2D6A4F]" />
                          ) : (
                            <Dumbbell className="w-5 h-5 text-[#2D6A4F]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-serif font-bold text-lg text-[#1C1917] leading-snug">
                            {meta.title}
                          </h3>
                          <p className="text-xs text-[#57534E] truncate">{meta.subtitle}</p>
                        </div>
                      </div>

                      <span className="bg-[#EFECE4] text-[#1C1917] rounded-full px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap shrink-0">
                        {formattedDateStr}
                      </span>
                    </div>

                    {/* Telemetry Pills Row */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      <span className="bg-[#EFECE4] text-[#1C1917] rounded-full px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap shrink-0">
                        {meta.category}
                      </span>
                      {s.exercises.length > 0 && (
                        <span className="bg-[#D1FAE5] text-[#1B4332] rounded-full px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap shrink-0">
                          {s.exercises.length} exercises · {totalSetsCount} sets
                        </span>
                      )}
                      {(s.cardioLogs ?? []).length > 0 && (
                        <span className="bg-[#EFECE4] text-[#1C1917] rounded-full px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap shrink-0">
                          🏃 {s.cardioLogs!.length} Cardio
                        </span>
                      )}
                      <span className="bg-[#EFECE4] text-[#1C1917] rounded-full px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap shrink-0">
                        {s.durationMinutes || 45} min
                      </span>
                      <span className="bg-[#FADCD5]/80 text-[#C94A38] rounded-full px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap shrink-0">
                        🔥 {cals} kcal
                      </span>
                    </div>

                    {/* Exercise Summary Box */}
                    {topSetsSummary && (
                      <div className="bg-[#F6F3EC] rounded-2xl p-3 mt-3 text-xs text-[#1C1917] leading-relaxed">
                        <p className="text-stone-700">{topSetsSummary}</p>
                        {s.summary && (
                          <div className="text-[11px] font-medium text-[#2D6A4F] mt-1.5 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-[#2D6A4F] shrink-0" />
                            <span className="truncate">
                              {s.summary.replace(/\*\*/g, "").slice(0, 90)}...
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expand Details Drawer */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-[#1C1917]/[0.06] space-y-2 animate-slide-down">
                        {s.exercises.map((ex) => (
                          <div key={ex.id} className="text-xs">
                            <span className="font-semibold text-[#1C1917]">{ex.name}:</span>{" "}
                            <span className="text-[#8C857B]">
                              {ex.sets.map((st) => `${st.weight || 0}kg × ${st.reps}`).join(", ")}
                            </span>
                          </div>
                        ))}
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setExercises(s.exercises);
                              setCardioLogs(s.cardioLogs || []);
                              setDuration(s.durationMinutes || 45);
                              setActiveSessionTitle(meta.title);
                              setIsEditingSession(true);
                              setView("log");
                              toast(`Loaded "${meta.title}" into Studio`, "success");
                            }}
                            className="bg-[#191D1A] text-white rounded-full px-3.5 py-1 text-xs font-semibold cursor-pointer"
                          >
                            Load Session into Studio →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CARDIO MODAL (Always available across views) ── */}
      {showAddCardio && (
        <AddCardioModal
          bodyWeightKg={bwKg}
          onAdd={addCardioLog}
          onClose={() => setShowAddCardio(false)}
        />
      )}

      {/* ── BODY WEIGHT MODAL ── */}
      {showBodyWeightModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pt-4 pb-24 sm:p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBodyWeightModal(false)}
          />
          <div className="relative rounded-[28px] shadow-2xl w-full max-w-sm p-6 bg-[#FCFBF9] border border-[#1C1917]/[0.08] animate-slide-up text-[#1C1917]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl text-[#1C1917]">Log Body Weight</h3>
              <button
                type="button"
                onClick={() => setShowBodyWeightModal(false)}
                className="text-[#8C857B] hover:text-[#1C1917] p-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#8C857B] uppercase tracking-wider block mb-1.5">
                  Body Weight (kg)
                </label>
                <input
                  autoFocus
                  type="number"
                  step="0.1"
                  placeholder="74.5"
                  value={newBodyWeight}
                  onChange={(e) => setNewBodyWeight(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogBodyWeight()}
                  className="w-full bg-[#F6F3EC] border border-[#1C1917]/[0.08] rounded-2xl py-3 px-4 text-center text-xl font-bold text-[#1C1917] outline-none focus:border-[#2D6A4F]"
                />
              </div>

              {bodyWeightEntries.slice(0, 3).length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B]">
                    Recent Entries
                  </span>
                  {bodyWeightEntries.slice(0, 3).map((e) => (
                    <div
                      key={e.id}
                      className="flex justify-between items-center text-xs px-3 py-2 rounded-xl bg-[#F6F3EC]"
                    >
                      <span className="text-[#57534E]">{formatDate(e.date)}</span>
                      <span className="font-bold text-[#1C1917]">{e.weightKg} kg</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBodyWeightModal(false)}
                  className="flex-1 bg-[#EFECE4] text-[#1C1917] rounded-full py-2.5 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLogBodyWeight}
                  disabled={!newBodyWeight}
                  className="flex-1 bg-[#191D1A] text-white rounded-full py-2.5 text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  Save Weight
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE SPLIT TEMPLATE MODAL ── */}
      {showCreateTemplate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pt-4 pb-24 sm:p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateTemplate(false)}
          />
          <div className="relative rounded-[28px] shadow-2xl w-full max-w-sm p-6 bg-[#FCFBF9] border border-[#1C1917]/[0.08] animate-slide-up text-[#1C1917]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl text-[#1C1917]">Build New Split Template</h3>
              <button
                type="button"
                onClick={() => setShowCreateTemplate(false)}
                className="text-[#8C857B] hover:text-[#1C1917] p-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#8C857B] uppercase tracking-wider block mb-1.5">
                  Template Name
                </label>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. My Push Day Heavy"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBuildNewTemplate()}
                  className="w-full bg-[#F6F3EC] border border-[#1C1917]/[0.08] rounded-2xl py-3 px-4 text-sm font-semibold text-[#1C1917] outline-none focus:border-[#2D6A4F]"
                />
              </div>

              <p className="text-xs text-[#57534E] leading-relaxed">
                {exercises.length > 0
                  ? `Saves the current ${exercises.length} exercises and sets into your library.`
                  : "Creates a starter upper body split template with compound movements."}
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTemplate(false)}
                  className="flex-1 bg-[#EFECE4] text-[#1C1917] rounded-full py-2.5 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBuildNewTemplate}
                  disabled={!templateName.trim() || savingTemplate}
                  className="flex-1 bg-[#191D1A] text-white rounded-full py-2.5 text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {savingTemplate ? "Saving..." : "Create Template"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VOICE LOG MODAL ── */}
      {showVoice && (
        <VoiceLogModal onAdd={addVoiceExercises} onClose={() => setShowVoice(false)} />
      )}
    </div>
  );
}

// ── ADD CARDIO MODAL COMPONENT ──────────────────────────────────────────────────
function AddCardioModal({
  bodyWeightKg,
  onAdd,
  onClose,
}: {
  bodyWeightKg: number;
  onAdd: (log: Omit<CardioLog, "id">) => void;
  onClose: () => void;
}) {
  const [activity, setActivity] = useState<CardioActivity>("walking");
  const [duration, setDuration] = useState("20");
  const [distance, setDistance] = useState("");

  const meta = CARDIO_META[activity];
  const durationNum = parseFloat(duration) || 0;
  const estCals = durationNum > 0 ? calcCardioCals(activity, durationNum, bodyWeightKg) : 0;

  const handleAdd = () => {
    if (!duration || durationNum <= 0) return;
    const log: Omit<CardioLog, "id"> = {
      activity,
      durationMinutes: durationNum,
      caloriesBurned: estCals,
    };
    const parsedDist = parseFloat(distance);
    if (!Number.isNaN(parsedDist) && parsedDist > 0) {
      log.distanceKm = parsedDist;
    }
    onAdd(log);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pt-4 pb-24 sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-[28px] shadow-2xl w-full max-w-sm p-6 bg-[#FCFBF9] border border-[#1C1917]/[0.08] animate-slide-up text-[#1C1917]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl text-[#1C1917]">Add Cardio & Zone 2</h3>
          <button type="button" onClick={onClose} className="text-[#8C857B] hover:text-[#1C1917] p-1.5 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Activity picker */}
        <div className="mb-4">
          <label className="text-[10px] font-bold text-[#8C857B] uppercase tracking-wider block mb-2">
            SELECT ACTIVITY
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(CARDIO_META) as CardioActivity[]).slice(0, 6).map((act) => {
              const m = CARDIO_META[act];
              const Icon = m.icon;
              const isSelected = activity === act;
              return (
                <button
                  key={act}
                  type="button"
                  onClick={() => setActivity(act)}
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer",
                    isSelected
                      ? "bg-[#2D6A4F] text-white border-[#2D6A4F]"
                      : "bg-[#F6F3EC] text-[#1C1917] border-transparent hover:border-[#1C1917]/10"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration + Distance */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[10px] font-bold text-[#8C857B] uppercase tracking-wider block mb-1">
              DURATION (MIN)
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-[#F6F3EC] border border-[#1C1917]/[0.08] rounded-xl py-2 px-3 text-sm font-bold text-[#1C1917] outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#8C857B] uppercase tracking-wider block mb-1">
              DISTANCE ({meta.unit})
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min={0}
              placeholder="optional"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="w-full bg-[#F6F3EC] border border-[#1C1917]/[0.08] rounded-xl py-2 px-3 text-sm font-bold text-[#1C1917] outline-none"
            />
          </div>
        </div>

        {/* Burn preview */}
        {estCals > 0 && (
          <div className="bg-[#FADCD5]/70 border border-[#E05A47]/20 rounded-2xl p-2.5 mb-4 flex items-center gap-2 text-xs font-bold text-[#C94A38]">
            <Flame className="w-4 h-4 text-[#E05A47]" />
            <span>🔥 ~{estCals} kcal estimated burn</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-[#EFECE4] text-[#1C1917] rounded-full py-2.5 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!duration || durationNum <= 0}
            className="flex-1 bg-[#2D6A4F] text-white rounded-full py-2.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            Add Cardio
          </button>
        </div>
      </div>
    </div>
  );
}
