/**
 * SATAT Orbit Types & Primitives
 * Universal Orbit Entity Context, Mutation Engine, and Suggestion Engine
 * across all manually editable domains: Workouts, Tasks, Meals, Rituals, and Sprints.
 */

export type OrbitMessageType =
  | "text"
  | "markdown"
  | "action"
  | "insight"
  | "recommendation"
  | "error"
  | "loading";

export type OrbitDomain = "workout" | "nutrition" | "tasks" | "momentum";

export interface OrbitAction {
  id: string;
  label: string;
  type: "workout" | "meal" | "task" | "link";
  href?: string;
  primary?: boolean;
  payload?: Record<string, any>;
}

export interface OrbitInsight {
  id: string;
  title: string;
  category: OrbitDomain;
  content: string;
  action?: OrbitAction;
}

export interface OrbitRecommendation {
  id: string;
  category: OrbitDomain;
  title: string;
  subtitle?: string;
  details?: string[];
  actions: OrbitAction[];
}

export interface OrbitEntityContext {
  // Meals & Diet
  activeMealSlot?: "breakfast" | "lunch" | "dinner" | "snack" | string;
  activeMealId?: string;

  // Workouts & Exercises
  activeWorkoutId?: string;
  activeWorkoutName?: string;
  activeExerciseId?: string;
  activeExerciseName?: string;
  activeExerciseIndex?: number;

  // Tasks & Schedules
  activeTaskId?: string;
  activeTaskTitle?: string;
  activePlanId?: string;

  // Habits & Rituals
  activeHabitType?: "hydration" | "steps" | "journal" | "reading";

  // Sprints & Milestones
  activeSprintId?: string;
  activeSprintDay?: number;

  // Conversational Clarification & Partial Intent
  awaitingParam?: "sets" | "time" | "duration" | "exerciseName" | "title" | string;
  partialIntent?: string;
}

export type OrbitActionType =
  | "UPSERT_MEAL"
  | "MODIFY_MEAL"
  | "DELETE_MEAL"
  | "START_WORKOUT"
  | "UPDATE_WORKOUT"
  | "UPDATE_WORKOUT_SET"
  | "ADD_EXERCISE"
  | "DELETE_EXERCISE"
  | "COMPLETE_WORKOUT"
  | "CREATE_TASK"
  | "UPDATE_TASK"
  | "DELETE_TASK"
  | "COMPLETE_TASK"
  | "RESCHEDULE_TASK"
  | "LOG_RITUAL"
  | "UPDATE_SPRINT_PROGRESS"
  | "MODIFY_PLAN"
  | "CLARIFICATION_NEEDED";

export interface OrbitActionExecuted {
  type: OrbitActionType | string;
  status: "success" | "failed" | string;
  domain: "meals" | "workouts" | "tasks" | "rituals" | "sprints";
  details: Record<string, any>;
}

export interface OrbitSuggestedAction {
  label: string;
  prompt: string;
}

export interface OrbitDualLayerResponse {
  reply: string;
  message: string;
  action_executed: OrbitActionExecuted | OrbitActionExecuted[] | null;
  actions_executed?: OrbitActionExecuted[];
  suggested_actions: OrbitSuggestedAction[];
  activeContext: OrbitEntityContext;
}

export interface OrbitMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
  type?: OrbitMessageType;
  insight?: OrbitInsight;
  recommendation?: OrbitRecommendation;
  action_executed?: OrbitActionExecuted | OrbitActionExecuted[] | null;
  actions_executed?: OrbitActionExecuted[];
  suggested_actions?: OrbitSuggestedAction[];
  activeContext?: OrbitEntityContext;
}

export type OrbitFocusMode = "all" | "workout" | "diet" | "tasks" | "circadian";
