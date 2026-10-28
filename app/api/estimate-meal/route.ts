import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { estimateMealMacros } from "@/lib/ai/nutrition-calculator";
import { calculateMealNutrition, resolveFoodItem } from "@/lib/ai/nutrition/calculator";
import { resolveMultiItemFoodAnchors, enforceAtwaterMath } from "@/lib/nutrition/foodAnchors";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dishName } = await req.json();
  if (!dishName?.trim()) return NextResponse.json({ error: "No dish name" }, { status: 400 });

  try {
    // 1. Fast deterministic multi-item anchor path:
    // e.g. "2 whole eggs with 2 rotis", "100g paneer and 150g rice", "50g soya chunks"
    const multiAnchor = resolveMultiItemFoodAnchors(dishName);
    if (multiAnchor && multiAnchor.matched) {
      const spread = Math.max(Math.round(multiAnchor.macros.calories * 0.12), 20);
      return NextResponse.json({
        name:         multiAnchor.name,
        calories:     multiAnchor.macros.calories,
        calorieRange: {
          low: Math.max(0, multiAnchor.macros.calories - spread),
          high: multiAnchor.macros.calories + spread,
        },
        proteinG:     multiAnchor.macros.proteinG,
        carbsG:       multiAnchor.macros.carbsG,
        fatG:         multiAnchor.macros.fatG,
        fiberG:       multiAnchor.macros.fiberG,
        verified:     true,
        source:       "canonical_anchor",
      });
    }

    // 2. Fast deterministic path: if single food matches ICMR/IFCT verified database
    const resolved = resolveFoodItem(dishName);
    if (resolved) {
      const calc = calculateMealNutrition(
        [{ name: dishName, quantity: 1, unit: resolved.defaultUnit }],
        dishName
      );
      return NextResponse.json({
        name:         calc.name,
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

    // 3. Fallback to LLM macro estimation with multi-item decomposition
    const macros = await estimateMealMacros(dishName);
    const enforced = enforceAtwaterMath(macros);

    // Response includes point macros plus calorieRange
    return NextResponse.json({
      name:         dishName,
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
