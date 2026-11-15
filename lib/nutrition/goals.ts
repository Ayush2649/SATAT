import type { MacroGoals, MealMacros } from "@/types";

// Shared defaults for accounts that have not configured numerical targets.
export const DEFAULT_MACRO_GOALS: MacroGoals = {
  calories: 2000, proteinG: 150, carbsG: 200, fatG: 65,
};

export function validMealMacros(macros: MealMacros): boolean {
  return [macros.calories, macros.proteinG, macros.carbsG, macros.fatG]
    .every(value => Number.isFinite(value) && value >= 0)
    && macros.calories > 0;
}

export function parseMealMacroFields(fields: Record<keyof MacroGoals, string>): MealMacros | null {
  if (Object.values(fields).some(value => !value.trim())) return null;
  const macros = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, Number(value)])) as unknown as MealMacros;
  return validMealMacros(macros) ? macros : null;
}
