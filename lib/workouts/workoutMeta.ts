import type { WorkoutSession, ExerciseLog, WorkoutTemplate, CardioLog } from "@/types";

export interface WorkoutSplitMeta {
  title: string;
  subtitle: string;
  category: "Upper Body" | "Lower Body" | "Push / Pull" | "Cardio" | "Full Body";
  muscles: string[];
  badgeLabel: string;
}

/**
 * Deterministically infers rich split metadata (title, subtitle, category, muscle tags, badge)
 * from template/session name, exercise list, and cardio logs.
 * Never outputs a generic "Workout logged today".
 */
export function inferWorkoutSplitMeta(
  workout: {
    name?: string;
    exercises?: (ExerciseLog | { name: string; sets?: any[] })[];
    cardioLogs?: CardioLog[];
  } | WorkoutSession | null | undefined
): WorkoutSplitMeta {
  if (!workout) {
    return {
      title: "Active Strength Session",
      subtitle: "Move with steady, progressive form",
      category: "Upper Body",
      muscles: ["Compound", "Hypertrophy"],
      badgeLabel: "STRENGTH",
    };
  }

  const name = (workout as any).name || (workout as any).templateName || "";
  const exercises = workout.exercises || [];
  const cardio = workout.cardioLogs || [];

  // Check if cardio only
  if (exercises.length === 0 && cardio.length > 0) {
    const act = cardio[0].activity.replace(/_/g, " ");
    const capAct = act.charAt(0).toUpperCase() + act.slice(1);
    return {
      title: `${capAct} & Aerobic Flow`,
      subtitle: "Aerobic Conditioning & Zone 2",
      category: "Cardio",
      muscles: ["Endurance", "Circulatory", "Metabolic"],
      badgeLabel: "CARDIO",
    };
  }

  const nameLower = name.toLowerCase();

  // If already named explicitly (e.g. from template or onboarding split)
  if (name && !nameLower.includes("workout logged today")) {
    if (nameLower.includes("push")) {
      return {
        title: name,
        subtitle: "Chest · Shoulders · Triceps",
        category: "Push / Pull",
        muscles: ["Chest", "Shoulders", "Triceps"],
        badgeLabel: "PUSH FOCUS",
      };
    }
    if (nameLower.includes("pull")) {
      return {
        title: name,
        subtitle: "Lats · Upper Back · Biceps",
        category: "Push / Pull",
        muscles: ["Lats", "Upper Back", "Biceps"],
        badgeLabel: "PULL FOCUS",
      };
    }
    if (nameLower.includes("lower") || nameLower.includes("leg")) {
      return {
        title: name,
        subtitle: "Quads · Hamstrings · Glutes",
        category: "Lower Body",
        muscles: ["Quads", "Hamstrings", "Glutes", "Calves"],
        badgeLabel: "QUADS/HINGE",
      };
    }
    if (nameLower.includes("upper")) {
      return {
        title: name,
        subtitle: "Chest · Back · Shoulders",
        category: "Upper Body",
        muscles: ["Chest", "Back", "Shoulders", "Arms"],
        badgeLabel: "CHEST/BACK",
      };
    }
    if (nameLower.includes("full body") || nameLower.includes("calisthenics")) {
      return {
        title: name,
        subtitle: "Compound Full Body Synergy",
        category: "Full Body",
        muscles: ["Chest", "Back", "Legs", "Core"],
        badgeLabel: "FULL BODY",
      };
    }
  }

  // Inspect exercise names with precise regex
  let pushScore = 0;
  let pullScore = 0;
  let lowerScore = 0;
  let coreScore = 0;

  for (const ex of exercises) {
    const exName = (ex.name || "").toLowerCase();

    // Check Lower Body first so "leg press" doesn't trigger "press"
    if (
      exName.includes("squat") ||
      exName.includes("leg press") ||
      exName.includes("leg extension") ||
      exName.includes("leg curl") ||
      exName.includes("hamstring") ||
      exName.includes("quad") ||
      exName.includes("glute") ||
      exName.includes("lunge") ||
      exName.includes("calf") ||
      exName.includes("thrust") ||
      exName.includes("rdl") ||
      exName.includes("romanian")
    ) {
      lowerScore++;
      continue;
    }

    // Push: Chest, shoulders, triceps
    if (
      exName.includes("bench") ||
      exName.includes("incline") ||
      exName.includes("overhead press") ||
      exName.includes("shoulder press") ||
      exName.includes("chest press") ||
      exName.includes("dumbbell press") ||
      (exName.includes("press") && !exName.includes("leg")) ||
      exName.includes("pushdown") ||
      exName.includes("push-up") ||
      exName.includes("pushup") ||
      exName.includes("dip") ||
      exName.includes("tricep") ||
      exName.includes("lateral raise") ||
      exName.includes("front raise") ||
      exName.includes("fly")
    ) {
      pushScore++;
      continue;
    }

    // Pull: Lats, back, biceps
    if (
      exName.includes("pull-up") ||
      exName.includes("pullup") ||
      exName.includes("chin-up") ||
      exName.includes("chinup") ||
      exName.includes("lat pull") ||
      exName.includes("pulldown") ||
      exName.includes("row") ||
      exName.includes("deadlift") ||
      exName.includes("bicep") ||
      exName.includes("curl") ||
      exName.includes("face pull") ||
      exName.includes("shrug")
    ) {
      pullScore++;
      continue;
    }

    if (exName.includes("plank") || exName.includes("crunch") || exName.includes("core") || exName.includes("ab")) {
      coreScore++;
    }
  }

  // Determine split from scores
  if (lowerScore >= 2 && pushScore === 0 && pullScore === 0) {
    return {
      title: "Lower Body — Quads & Hinge",
      subtitle: "Leg Strength & Posterior Chain",
      category: "Lower Body",
      muscles: ["Quads", "Hamstrings", "Glutes", "Calves"],
      badgeLabel: "QUADS/HINGE",
    };
  }

  if (pushScore > 0 && pullScore === 0 && lowerScore === 0) {
    return {
      title: "Push Day — Upper Body",
      subtitle: "Chest · Shoulders · Triceps",
      category: "Push / Pull",
      muscles: ["Chest", "Shoulders", "Triceps"],
      badgeLabel: "PUSH FOCUS",
    };
  }

  if (pullScore > 0 && pushScore === 0 && lowerScore === 0) {
    return {
      title: "Pull Day — Back & Biceps",
      subtitle: "Back & Bicep Hypertrophy",
      category: "Push / Pull",
      muscles: ["Lats", "Upper Back", "Biceps"],
      badgeLabel: "PULL FOCUS",
    };
  }

  if (pushScore > 0 && pullScore > 0 && lowerScore === 0) {
    return {
      title: "Upper Body — Chest & Back",
      subtitle: "Upper Body Hypertrophy",
      category: "Upper Body",
      muscles: ["Chest", "Back", "Shoulders", "Arms"],
      badgeLabel: "CHEST/BACK",
    };
  }

  if (lowerScore > 0 && (pushScore > 0 || pullScore > 0)) {
    return {
      title: "Full Body — Functional Strength",
      subtitle: "Compound Full Body Synergy",
      category: "Full Body",
      muscles: ["Chest", "Back", "Legs", "Core"],
      badgeLabel: "FULL BODY",
    };
  }

  if (lowerScore > 0) {
    return {
      title: "Lower Body — Quads & Hinge",
      subtitle: "Leg Strength & Posterior Chain",
      category: "Lower Body",
      muscles: ["Quads", "Hamstrings", "Glutes", "Calves"],
      badgeLabel: "QUADS/HINGE",
    };
  }

  // Fallback
  return {
    title: name || "Compound Upper A",
    subtitle: "Move with steady, progressive form",
    category: "Upper Body",
    muscles: ["Chest", "Back", "Shoulders"],
    badgeLabel: "HYPERTROPHY",
  };
}

/**
 * Extracts or dynamically calculates physiological calorie burn.
 * Follows the non-negotiable rule: NEVER displays "— Kcal" or "0 kcal".
 */
export function extractOrComputeWorkoutCalories(
  workout: (WorkoutSession & { caloriesBurned?: number; coachReport?: string }) | null | undefined,
  fallbackBodyWeightKg: number = 74.1
): number {
  if (!workout) return 340;

  // 1. Explicit property
  if (typeof (workout as any).caloriesBurned === "number" && (workout as any).caloriesBurned > 0) {
    return Math.round((workout as any).caloriesBurned);
  }

  // 2. Extract from AI report / notes
  const textBlob = `${workout.summary || ""} ${(workout as any).coachReport || ""} ${workout.notes || ""}`;
  if (textBlob.trim()) {
    const match = textBlob.match(/(\d{2,4})\s*(?:kcal|calories|cal)/i);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (parsed >= 100 && parsed <= 2500) {
        return parsed;
      }
    }
  }

  // 3. Dynamic physiological estimation: duration + sets + cardio
  const duration = workout.durationMinutes > 0 ? workout.durationMinutes : 45;
  const totalSets = (workout.exercises ?? []).reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
  const cardioCals = (workout.cardioLogs ?? []).reduce((sum, c) => sum + (c.caloriesBurned || 0), 0);

  const strengthCals = (workout.exercises?.length ?? 0) > 0 ? Math.round(duration * 6.8 + totalSets * 4) : 0;
  const total = strengthCals + cardioCals;

  return total > 0 ? total : Math.round(duration * 6.8);
}

/**
 * Parses raw AI coach report text into 3 clean, structured editorial sub-cards
 * stripped of markdown asterisks.
 */
export function parseCoachReport(
  reportText: string | undefined,
  session?: WorkoutSession | null
): {
  intensityBadge: string;
  volumeHighlight: string;
  loadProgression: string;
  nextSessionTip: string;
} {
  const calories = extractOrComputeWorkoutCalories(session as any);

  if (!reportText || !reportText.trim()) {
    const exerciseCount = session?.exercises?.length ?? 4;
    const totalSets = session?.exercises?.reduce((acc, ex) => acc + ex.sets.length, 0) ?? 12;
    const totalVolume = session?.exercises?.reduce(
      (acc, ex) => acc + ex.sets.reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0),
      0
    ) ?? 3240;

    return {
      intensityBadge: `High Intensity · 🔥 ${calories} kcal`,
      volumeHighlight: `Completed ${totalSets} working sets across ${exerciseCount} movements with ${totalVolume > 0 ? `${totalVolume.toLocaleString()}kg workload.` : "disciplined execution."} Strong biomechanical consistency maintained.`,
      loadProgression: `Progressive resistance sustained across compound lifts. Muscular fatigue threshold achieved; adaptive recovery window initiates over the next 24–48 hours.`,
      nextSessionTip: `Target 30–40g high-bioavailability protein within 2 hours. Hydrate with 500ml electrolyte water to replenish glycogen and accelerate myofibrillar repair.`,
    };
  }

  // Clean asterisks
  const clean = reportText.replace(/\*\*/g, "").replace(/\*/g, "");

  // Detect intensity
  let intensityLevel = "High Intensity";
  const lower = clean.toLowerCase();
  if (lower.includes("very high")) intensityLevel = "Peak Intensity";
  else if (lower.includes("moderate")) intensityLevel = "Moderate Cadence";
  else if (lower.includes("low")) intensityLevel = "Low Strain / Deload";

  // Section parsing
  let volumeHighlight = "";
  let loadProgression = "";
  let nextSessionTip = "";

  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);

  // Match headers
  let currentSection = 0;
  for (const line of lines) {
    const lineLower = line.toLowerCase();
    if (
      lineLower.includes("what you did well") ||
      lineLower.includes("overall performance") ||
      lineLower.includes("volume highlight") ||
      lineLower.startsWith("1.") ||
      lineLower.startsWith("2.")
    ) {
      currentSection = 1;
      const content = line.replace(/^[0-9]\.\s*[^–—:-]+[–—:-]\s*/i, "").trim();
      if (content && content.length > 15) volumeHighlight += (volumeHighlight ? " " : "") + content;
      continue;
    }
    if (
      lineLower.includes("areas to improve") ||
      lineLower.includes("intensity level") ||
      lineLower.includes("load progression") ||
      lineLower.startsWith("3.") ||
      lineLower.startsWith("4.")
    ) {
      currentSection = 2;
      const content = line.replace(/^[0-9]\.\s*[^–—:-]+[–—:-]\s*/i, "").trim();
      if (content && content.length > 15) loadProgression += (loadProgression ? " " : "") + content;
      continue;
    }
    if (
      lineLower.includes("next session tip") ||
      lineLower.includes("cardio insight") ||
      lineLower.startsWith("5.") ||
      lineLower.startsWith("6.")
    ) {
      currentSection = 3;
      const content = line.replace(/^[0-9]\.\s*[^–—:-]+[–—:-]\s*/i, "").trim();
      if (content && content.length > 15) nextSessionTip += (nextSessionTip ? " " : "") + content;
      continue;
    }

    // Append to current section
    const cleanLine = line.replace(/^[•\-\*]\s*/, "");
    if (currentSection === 1) {
      volumeHighlight += (volumeHighlight ? " " : "") + cleanLine;
    } else if (currentSection === 2) {
      loadProgression += (loadProgression ? " " : "") + cleanLine;
    } else if (currentSection === 3) {
      nextSessionTip += (nextSessionTip ? " " : "") + cleanLine;
    }
  }

  // Fallbacks if sections were not cleanly identified
  if (!volumeHighlight) {
    volumeHighlight = lines[0] || "Exceptional set execution and consistent movement tempo throughout the session.";
  }
  if (!loadProgression) {
    loadProgression = lines[1] || "Target an incremental 1–2kg load or +1 rep progression on primary compound movements next cycle.";
  }
  if (!nextSessionTip) {
    nextSessionTip = lines[2] || lines[lines.length - 1] || "Prioritize restful recovery and replenish with adequate dietary protein.";
  }

  return {
    intensityBadge: `${intensityLevel} · 🔥 ${calories} kcal`,
    volumeHighlight,
    loadProgression,
    nextSessionTip,
  };
}

/**
 * Returns athletic image for templates
 */
export function getTemplateCoverPhoto(templateName: string, category?: string): string {
  const nameLower = (templateName || "").toLowerCase();
  if (nameLower.includes("lower") || nameLower.includes("leg") || nameLower.includes("quad")) {
    return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=75";
  }
  if (nameLower.includes("pull") || nameLower.includes("back")) {
    return "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=75";
  }
  if (nameLower.includes("push") || nameLower.includes("hypertrophy")) {
    return "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=400&q=75";
  }
  if (nameLower.includes("full") || nameLower.includes("calisthenics")) {
    return "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=75";
  }
  return "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=75";
}

/**
 * Returns target muscle for an exercise
 */
export function getExerciseTargetMuscle(exerciseName: string): string {
  const name = (exerciseName || "").toLowerCase();
  if (name.includes("bench") || name.includes("chest fly") || name.includes("push up")) return "Chest & Front Delts";
  if (name.includes("incline")) return "Upper Chest & Shoulders";
  if (name.includes("overhead press") || name.includes("shoulder press")) return "Anterior & Lateral Delts";
  if (name.includes("lateral raise")) return "Lateral Deltoids";
  if (name.includes("tricep") || name.includes("dip")) return "Triceps Brachii";
  if (name.includes("pull-up") || name.includes("chin-up") || name.includes("lat pulldown")) return "Latissimus Dorsi & Biceps";
  if (name.includes("row")) return "Rhomboids, Lats & Mid-Back";
  if (name.includes("bicep") || name.includes("curl")) return "Biceps Brachii";
  if (name.includes("squat") || name.includes("leg press") || name.includes("leg ext")) return "Quadriceps & Gluteals";
  if (name.includes("rdl") || name.includes("deadlift") || name.includes("hamstring")) return "Hamstrings & Posterior Chain";
  if (name.includes("calf")) return "Gastrocnemius & Soleus";
  if (name.includes("plank") || name.includes("crunch") || name.includes("ab")) return "Core Stability & Rectus Abdominis";
  return "Target Musculature";
}

