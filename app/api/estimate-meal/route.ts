import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { estimateMealMacros } from "@/lib/ai/nutrition-calculator";
import { calculateMealNutrition, resolveFoodItem } from "@/lib/ai/nutrition/calculator";
import { findFoodAnchor, enforceAtwaterMath } from "@/lib/nutrition/foodAnchors";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dishName } = await req.json();
  if (!dishName?.trim()) return NextResponse.json({ error: "No dish name" }, { status: 400 });

  try {
    // 1. Fast deterministic anchor path: e.g. "50g soya chunks", "2 rotis", "100g paneer"
    const anchor = findFoodAnchor(dishName);
    if (anchor) {
      const spread = Math.max(Math.round(anchor.macros.calories * 0.12), 20);
      return NextResponse.json({
        calories:     anchor.macros.calories,
        calorieRange: {
          low: Math.max(0, anchor.macros.calories - spread),
          high: anchor.macros.calories + spread,
        },
        proteinG:     anchor.macros.proteinG,
        carbsG:       anchor.macros.carbsG,
        fatG:         anchor.macros.fatG,
        fiberG:       anchor.macros.fiberG,
        verified:     true,
        source:       "canonical_anchor",
      });
    }

    // 2. Fast deterministic path: if food matches ICMR/IFCT verified database
    const resolved = resolveFoodItem(dishName);
    if (resolved) {
      const calc = calculateMealNutrition(
        [{ name: dishName, quantity: 1, unit: resolved.defaultUnit }],
        dishName
      );
      return NextResponse.json({
        calories:     calc.calories,
        calorieRange: calc.calorieRange,
        proteinG:     calc.proteinG,
        carbsG:       calc.carbsG,
        fatG:         calc.fatG,
        fiberG:       calc.fiberG,
        verified:     true,
        source:       "canonical_db",
      });
    }

    // 3. Fallback to LLM macro estimation for complex free-text descriptions
    const macros = await estimateMealMacros(dishName);
    const enforced = enforceAtwaterMath(macros);

    // Response includes point macros plus calorieRange
    return NextResponse.json({
      calories:     enforced.calories,
      calorieRange: macros.calorieRange,
      proteinG:     enforced.proteinG,
      carbsG:       enforced.carbsG,
      fatG:         enforced.fatG,
      fiberG:       macros.fiberG,
      verified:     false,
      source:       "ai_estimate",
    });
  } catch (err: any) {
    console.error("[estimate-meal] AI error:", err?.code, err?.message);
    return NextResponse.json({ error: err.message || "Failed to estimate meal" }, { status: 500 });
  }
}
