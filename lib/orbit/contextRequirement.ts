// lib/orbit/contextRequirement.ts

import { classifyOrbitIntent } from "./intentClassifier";

/**
 * Types representing which parts of the OrbitContext are needed for a request.
 */
export type ContextDomain =
  | "profile"
  | "goals"
  | "preferences"
  | "meals"
  | "nutrition"
  | "workouts"
  | "tasks"
  | "habits"
  | "dailyPlan";

/** Temporal scope for data retrieval */
export type TemporalScope = "today" | "yesterday" | "recent" | "none" | "last7Days" | "thisWeek" | "lastWeek" | "twoWeeksAgo";

export interface ContextRequirements {
  domains: ContextDomain[];
  temporalScope?: TemporalScope;
}

const OVERALL_WEEKLY_REVIEW_PATTERNS = [
  /\b(weekly\s+(review|summary|report|breakdown|check|analysis|recap|progress|assessment|adherence|consistency|momentum|performance))\b/i,
  /\b(review|summary|recap|assessment|audit|breakdown)\s+(of\s+)?(my\s+)?(week|past\s+week|last\s+7\s+days|last\s+seven\s+days|weekly\s+consistency|momentum)\b/i,
  /\b(how\s+was|how\s+did\s+i\s+do|how\s+were)\s+(my\s+)?(week|past\s+week|last\s+7\s+days|last\s+seven\s+days)\b/i,
  /\b(rate\s+(my\s+)?(week|progress|consistency|performance)|rate\s+.*?\bout\s+of\s+10|score\s+.*?\bout\s+of\s+10)\b/i,
  /\bwhat\s+should\s+i\s+improve\s+(next\s+week|for\s+next\s+week)\b/i,
  /\bhow\s+consistent\s+(was\s+i|have\s+i\s+been)\s*(this\s+week|over\s+the\s+last\s+7\s+days)?\b/i,
  /\b(honest\s+)?(assessment|evaluation|audit)\s+of\s+(my\s+)?(weekly|week|progress|momentum|consistency)\b/i,
  /\b(consistency\s+and\s+momentum|momentum\s+and\s+consistency)\b/i,
  /\b(rate|score)\s+(my\s+)?overall\s+progress\b/i,
];

/**
 * Demand‑driven inference of required context domains and temporal scope.
 * Purely deterministic, lightweight, and zero external network calls.
 */
export function inferContextRequirements(message: string): ContextRequirements {
  const lower = message.toLowerCase();
  const intent = classifyOrbitIntent(message);

  // For pure simple conversation without substantive query, return empty requirements
  if (intent === "SIMPLE_CONVERSATION") {
    return { domains: [], temporalScope: "none" };
  }

  const domains: ContextDomain[] = [];
  let temporal: TemporalScope | undefined;

  // 1. Detect explicit domains from keywords
  if (/\b(profiles?|names?|age|weights?|heights?)\b/.test(lower)) domains.push("profile");
  if (/\b(goals?|targets?|macros?|calories?|proteins?|carbs?|fats?)\b/.test(lower)) {
    domains.push("goals");
    domains.push("nutrition");
  }
  if (/\b(preferences?|tastes?|vegetarian|vegan)\b/.test(lower)) domains.push("preferences");
  if (/\b(meals?|eat|eating|ate|food|breakfast|lunch|dinner|snacks?|nutrition|nutrients)\b/.test(lower)) {
    domains.push("meals");
    domains.push("nutrition");
  }
  if (/\b(workouts?|exercises?|train|training|gym|runs?|running|cardio)\b/.test(lower)) domains.push("workouts");
  if (/\b(tasks?|todos?|schedules?|plans?)\b/.test(lower)) domains.push("tasks");
  if (/\b(habits?)\b/.test(lower)) domains.push("habits");
  if (/\b(daily plan|schedules?)\b/.test(lower)) domains.push("dailyPlan");

  // 2. Temporal scope detection
  if (/\btoday\b/.test(lower)) {
    temporal = "today";
  } else if (/\byesterday\b/.test(lower) || /\blast night\b/.test(lower) || /\blast afternoon\b/.test(lower)) {
    temporal = "yesterday";
  } else if (/\b(last\s+7\s+days|past\s+7\s+days|last\s+seven\s+days|past\s+seven\s+days|7\s+days)\b/.test(lower)) {
    temporal = "last7Days";
  } else if (/\bthis\s+week\b/.test(lower) || /\bmy\s+week\b/.test(lower)) {
    temporal = "thisWeek";
  } else if (/\blast\s+week\b/.test(lower) || /\bpast\s+week\b/.test(lower)) {
    temporal = "lastWeek";
  } else if (/\bweekly\b/.test(lower)) {
    temporal = "last7Days";
  } else if (/\btwo\s+weeks\s+ago\b/.test(lower)) {
    temporal = "twoWeeksAgo";
  } else if (/\brecent\b/.test(lower) || /\b2\s+days\s+ago\b/.test(lower)) {
    temporal = "recent";
  } else if (/\b(how\s+consistent\s+(was\s+i|have\s+i\s+been)|consistency)\b/.test(lower)) {
    temporal = "last7Days";
  }

  // 3. Multi-domain weekly review vs. domain-specific historical request
  const isOverallReviewPhrase = OVERALL_WEEKLY_REVIEW_PATTERNS.some((pat) => pat.test(lower));
  if (isOverallReviewPhrase) {
    if (!temporal) {
      temporal = /\bthis\s+week\b/.test(lower) ? "thisWeek" : "last7Days";
    }

    // Check whether the user specifically restricted the query to a specific domain:
    // e.g. "Summarize my workouts from the last seven days" has workouts explicitly
    // "Analyze my meals from the last seven days" has meals explicitly
    const specificDomains = domains.filter((d) => ["meals", "workouts", "tasks"].includes(d));
    const asksAllDomains = specificDomains.length >= 2 || /\b(all\s+(domains|categories)|workouts,\s*nutrition|everything\s+across\s+the\s+board)\b/i.test(lower);

    // Only inject ALL categories when the user is asking for an overall assessment across all domains / progress,
    // NOT when asking specifically about one domain (e.g. workout structure).
    const isExplicitOverallReview = (
      (specificDomains.length === 0 && /\b(review\s+my\s+week|rate\s+my\s+week|rate\s+my\s+progress|weekly\s+review|honest\s+assessment|assessment\s+of|consistency\s+and\s+momentum|momentum\s+and\s+consistency|overall\s+progress)\b/i.test(lower)) ||
      (/\boverall\s+progress\b/i.test(lower) && asksAllDomains)
    );

    if (specificDomains.length === 0 || isExplicitOverallReview) {
      const allHistoricalDomains: ContextDomain[] = [
        "workouts",
        "meals",
        "nutrition",
        "tasks",
        "habits",
        "profile",
        "goals",
      ];
      for (const d of allHistoricalDomains) {
        if (!domains.includes(d)) domains.push(d);
      }
    } else {
      // Domain-specific query: keep only the targeted domain plus relevant profile/goals
      if (domains.includes("workouts") && !domains.includes("profile")) domains.push("profile");
      if (domains.includes("meals") && !domains.includes("goals")) domains.push("goals");
    }
  }

  // 4. Strict Domain Pruning for single-domain queries
  const hasWorkoutFocus = /\b(workouts?|exercises?|train|training|gym|runs?|running|cardio|splits?|sets?|reps?|bench|squats?|deadlifts?|shoulders?|arms?|legs?|push|pull)\b/i.test(lower);
  const hasDietFocus = /\b(meals?|eat|eating|ate|food|breakfast|lunch|dinner|snacks?|nutrition|nutrients|calories?|proteins?|carbs?|fats?|macro|macros)\b/i.test(lower);
  const hasTaskFocus = /\b(tasks?|todos?|projects?|deep\s+work|priorit(y|ies))\b/i.test(lower);

  if (hasWorkoutFocus && !hasDietFocus && !hasTaskFocus) {
    const pruned = domains.filter((d) => !["meals", "nutrition", "tasks", "habits", "dailyPlan"].includes(d));
    if (!pruned.includes("workouts")) pruned.push("workouts");
    return { domains: pruned, temporalScope: temporal };
  }

  if (hasDietFocus && !hasWorkoutFocus && !hasTaskFocus) {
    const pruned = domains.filter((d) => !["workouts", "tasks", "habits", "dailyPlan"].includes(d));
    if (!pruned.includes("meals")) pruned.push("meals");
    if (!pruned.includes("nutrition")) pruned.push("nutrition");
    return { domains: pruned, temporalScope: temporal };
  }

  if (hasTaskFocus && !hasWorkoutFocus && !hasDietFocus) {
    const pruned = domains.filter((d) => !["workouts", "meals", "nutrition", "habits"].includes(d));
    if (!pruned.includes("tasks")) pruned.push("tasks");
    return { domains: pruned, temporalScope: temporal };
  }

  // 5. Fallback: if no domains detected, include a minimal safe set
  if (domains.length === 0) {
    domains.push("profile", "goals", "preferences");
  }

  return { domains, temporalScope: temporal };
}
