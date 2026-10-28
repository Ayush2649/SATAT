import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { estimateMealMacros } from "@/lib/ai/nutrition-calculator";
import { calculateMealNutrition, resolveFoodItem } from "@/lib/ai/nutrition/calculator";
import { resolveMultiItemFoodAnchors, findFoodAnchor, enforceAtwaterMath } from "@/lib/nutrition/foodAnchors";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dishName } = await req.json();
  if (!dishName?.trim()) return NextResponse.json({ error: "No dish name" }, { status: 400 });

  try {
    // 1. Fast deterministic multi-item anchor path:
    // e.g. "2 whole eggs with 2 rotis", "100g paneer and 150g rice", "50g soya chunks"
    const isCompoundQuery = /[\s,]+(?:with|and|plus|along with|&|\+)[\s,]+|\s*,\s*/i.test(dishName);

    if (isCompoundQuery) {
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
      // If multiAnchor returned null, at least one ingredient is not in food anchors or has complex phrasing.
      // CRITICAL: NEVER do single-food partial matching on compound queries!
      // Fall through directly to Step 3 (LLM multi-item decomposition) to prevent partial-match poisoning.
    } else {
      // 2. Fast deterministic single-food anchor lookup (e.g. "2 rotis" -> 208 kcal, "200 gms paneer" -> 530 kcal)
      const singleAnchor = findFoodAnchor(dishName);
      if (singleAnchor && singleAnchor.matched) {
        const spread = Math.max(Math.round(singleAnchor.macros.calories * 0.12), 20);
        return NextResponse.json({
          name:         singleAnchor.name,
          calories:     singleAnchor.macros.calories,
          calorieRange: {
            low: Math.max(0, singleAnchor.macros.calories - spread),
            high: singleAnchor.macros.calories + spread,
          },
          proteinG:     singleAnchor.macros.proteinG,
          carbsG:       singleAnchor.macros.carbsG,
          fatG:         singleAnchor.macros.fatG,
          fiberG:       singleAnchor.macros.fiberG,
          verified:     true,
          source:       "canonical_anchor",
        });
      }

      // 3. Fallback to ICMR/IFCT verified database
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
    }

    // 4. Fallback to LLM macro estimation with multi-item decomposition (Gemini AI)
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
