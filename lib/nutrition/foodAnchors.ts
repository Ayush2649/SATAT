/**
 * lib/nutrition/foodAnchors.ts
 *
 * Deterministic Ground-Truth Food Anchor Reference & Macro Math Engine.
 * Grounded strictly in IFCT (Indian Food Composition Tables, ICMR-NIN)
 * and USDA FoodData Central references.
 *
 * Distinguishes raw vs. cooked weights explicitly:
 * - Dry staples (soya chunks, rolled oats, raw rice, raw lentils) default
 *   to raw/dry weight unless cooked/boiled is explicitly stated.
 * - Enforces Atwater factor math consistency (4P + 4C + 9F) across all items.
 * - Supports compound meal resolution ("2 whole eggs with 2 rotis") without dropping items.
 */

export interface FoodAnchor {
  id: string;
  name: string;
  aliases: string[];
  state: "raw" | "cooked" | "dry" | "prepared";
  defaultServingGrams: number;
  servingLabel: string;
  per100g: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG?: number;
  };
  notes?: string;
  isPackaged?: boolean;
  brand?: string;
}

export const FOOD_ANCHORS: FoodAnchor[] = [
  // ── 1. SOYA CHUNKS (Dry/Raw vs Cooked/Boiled) ──────────────────────────────
  {
    id: "soya_chunks_dry",
    name: "Soya Chunks (Dry / Raw)",
    aliases: [
      "soya chunks",
      "raw soya chunks",
      "dry soya chunks",
      "soya nuggets",
      "soya bari",
      "soya vadi",
      "meal maker",
      "nutrela soya",
      "soya",
    ],
    state: "dry",
    defaultServingGrams: 50, // Standard gym serving: 50g dry = ~173 kcal, 26g P
    servingLabel: "50g dry",
    per100g: {
      calories: 345,
      proteinG: 52.0,
      carbsG: 33.0,
      fatG: 0.5,
      fiberG: 13.0,
    },
    notes: "Default for weighed soya chunks. 50g dry yields ~150g boiled.",
  },
  {
    id: "soya_chunks_boiled",
    name: "Soya Chunks (Boiled / Cooked)",
    aliases: [
      "boiled soya chunks",
      "cooked soya chunks",
      "soaked soya chunks",
      "boiled soya",
    ],
    state: "cooked",
    defaultServingGrams: 150, // ~50g dry absorbs water 3x
    servingLabel: "150g boiled",
    per100g: {
      calories: 120,
      proteinG: 18.0,
      carbsG: 11.0,
      fatG: 0.2,
      fiberG: 4.5,
    },
    notes: "Water absorption dilutes per-100g density by ~3x.",
  },

  // ── 2. ROTI & FLATBREADS ───────────────────────────────────────────────────
  {
    id: "roti_plain",
    name: "Plain Roti / Chapati",
    aliases: [
      "roti",
      "rotis",
      "chapati",
      "chapatis",
      "chappati",
      "phulka",
      "phulkas",
      "fulka",
      "plain roti",
      "whole wheat roti",
      "atta roti",
    ],
    state: "prepared",
    defaultServingGrams: 35, // 1 medium standard roti = 35g cooked
    servingLabel: "1 roti (~35g)",
    per100g: {
      calories: 297,
      proteinG: 8.86,
      carbsG: 60.0,
      fatG: 2.29,
      fiberG: 6.0,
    },
    notes: "1 medium whole wheat roti (35g) provides 104 kcal, 3.1g P, 21g C, 0.8g F; 2 rotis = 208 kcal, 6.2g P, 42g C, 1.6g F.",
  },
  {
    id: "roti_ghee",
    name: "Roti with Ghee",
    aliases: [
      "roti with ghee",
      "rotis with ghee",
      "ghee roti",
      "ghee rotis",
      "ghee chapati",
      "butter roti",
      "chapati with ghee",
    ],
    state: "prepared",
    defaultServingGrams: 40, // 35g roti + 5g ghee
    servingLabel: "1 roti with ghee",
    per100g: {
      calories: 372,
      proteinG: 7.75,
      carbsG: 52.5,
      fatG: 14.75,
      fiberG: 5.2,
    },
    notes: "Includes 1 tsp (5g) ghee addition (+45 kcal, 5g fat). 1 roti with ghee = ~149 kcal, 3.1g P, 21g C, 5.9g F.",
  },

  // ── 3. RICE & GRAINS ───────────────────────────────────────────────────────
  {
    id: "rice_steamed",
    name: "Steamed White Rice (Cooked)",
    aliases: [
      "white rice",
      "cooked rice",
      "steamed rice",
      "boiled rice",
      "chawal",
      "plain rice",
      "rice",
    ],
    state: "cooked",
    defaultServingGrams: 150, // 1 medium katori / bowl = ~150g
    servingLabel: "1 katori (~150g)",
    per100g: {
      calories: 130,
      proteinG: 2.7,
      carbsG: 28.2,
      fatG: 0.3,
      fiberG: 0.4,
    },
    notes: "150g cooked rice = ~195 kcal, 4.0g P, 42.3g C, 0.5g F.",
  },
  {
    id: "rolled_oats_dry",
    name: "Rolled Oats (Dry / Raw)",
    aliases: [
      "oats",
      "rolled oats",
      "quaker oats",
      "dry oats",
      "raw oats",
      "instant oats",
      "oatmeal",
    ],
    state: "dry",
    defaultServingGrams: 40, // Standard serving: 40g = 150 kcal
    servingLabel: "40g serving",
    per100g: {
      calories: 375,
      proteinG: 12.5,
      carbsG: 67.5,
      fatG: 6.2,
      fiberG: 10.0,
    },
    notes: "40g dry serving = 150 kcal, 5g P, 27g C, 2.5g F.",
  },

  // ── 4. DALS & LEGUMES ──────────────────────────────────────────────────────
  {
    id: "dal_yellow_tadka",
    name: "Yellow Dal Tadka (Cooked)",
    aliases: [
      "dal tadka",
      "yellow dal",
      "toor dal",
      "moong dal",
      "arhar dal",
      "dal fry",
      "dal",
    ],
    state: "cooked",
    defaultServingGrams: 150, // 1 katori = ~150g
    servingLabel: "1 katori (~150g)",
    per100g: {
      calories: 100,
      proteinG: 4.7,
      carbsG: 12.7,
      fatG: 3.3,
      fiberG: 3.0,
    },
    notes: "Accounts for homestyle oil/ghee tempering (tadka). 150g bowl = 150 kcal, 7g P, 19g C, 5g F.",
  },

  // ── 5. PANEER & DAIRY ──────────────────────────────────────────────────────
  {
    id: "paneer_raw",
    name: "Fresh Paneer (Raw)",
    aliases: [
      "paneer",
      "fresh paneer",
      "raw paneer",
      "cottage cheese",
      "paneer block",
      "malai paneer",
    ],
    state: "raw",
    defaultServingGrams: 100,
    servingLabel: "100g block",
    per100g: {
      calories: 265,
      proteinG: 18.3,
      carbsG: 3.4,
      fatG: 20.8,
      fiberG: 0,
    },
    notes: "Standard whole milk paneer per IFCT / NIN 2017. 200g = 530 kcal, 36.6g P, 6.8g C, 41.6g F.",
  },
  {
    id: "milk_toned",
    name: "Toned Milk (3% Fat)",
    aliases: [
      "toned milk",
      "milk",
      "cow milk",
      "amul taaza",
      "amul milk",
      "low fat milk",
    ],
    state: "prepared",
    defaultServingGrams: 200, // 1 cup/glass = 200ml
    servingLabel: "1 glass (200ml)",
    per100g: {
      calories: 58,
      proteinG: 3.1,
      carbsG: 4.7,
      fatG: 3.0,
      fiberG: 0,
    },
  },
  {
    id: "curd_plain",
    name: "Fresh Dahi / Curd",
    aliases: [
      "curd",
      "dahi",
      "plain curd",
      "plain dahi",
      "yogurt",
      "homemade curd",
    ],
    state: "prepared",
    defaultServingGrams: 100, // 1 katori = ~100g
    servingLabel: "1 katori (100g)",
    per100g: {
      calories: 60,
      proteinG: 3.5,
      carbsG: 4.5,
      fatG: 3.1,
      fiberG: 0,
    },
  },

  // ── 6. POULTRY & EGGS ──────────────────────────────────────────────────────
  {
    id: "chicken_breast_raw",
    name: "Chicken Breast (Raw)",
    aliases: [
      "raw chicken breast",
      "chicken breast raw",
      "raw chicken",
    ],
    state: "raw",
    defaultServingGrams: 100,
    servingLabel: "100g raw",
    per100g: {
      calories: 120,
      proteinG: 23.0,
      carbsG: 0.0,
      fatG: 2.5,
      fiberG: 0,
    },
    notes: "Skinless, boneless raw chicken breast per USDA.",
  },
  {
    id: "chicken_breast_cooked",
    name: "Chicken Breast (Cooked / Grilled)",
    aliases: [
      "chicken breast",
      "grilled chicken breast",
      "cooked chicken breast",
      "boiled chicken breast",
      "roast chicken breast",
    ],
    state: "cooked",
    defaultServingGrams: 100,
    servingLabel: "100g cooked",
    per100g: {
      calories: 165,
      proteinG: 31.0,
      carbsG: 0.0,
      fatG: 3.6,
      fiberG: 0,
    },
    notes: "Moisture loss during cooking concentrates protein to ~31g/100g.",
  },
  {
    id: "whole_egg_boiled",
    name: "Whole Egg (Large, Boiled)",
    aliases: [
      "egg",
      "eggs",
      "whole egg",
      "whole eggs",
      "boiled egg",
      "boiled eggs",
      "boiled whole egg",
      "boiled whole eggs",
      "hard boiled egg",
      "hard boiled eggs",
      "1 egg",
      "2 eggs",
    ],
    state: "cooked",
    defaultServingGrams: 50, // 1 large egg = ~50g
    servingLabel: "1 large egg",
    per100g: {
      calories: 144,
      proteinG: 12.6,
      carbsG: 0.8,
      fatG: 9.6,
      fiberG: 0,
    },
    notes: "1 large egg (50g) provides 72 kcal, 6.3g P, 0.4g C, 4.8g F; 2 eggs = 144 kcal, 12.6g P, 0.8g C, 9.6g F.",
  },
  {
    id: "egg_white_boiled",
    name: "Egg White (Boiled)",
    aliases: [
      "egg white",
      "egg whites",
      "boiled egg white",
      "boiled egg whites",
      "anda safedi",
    ],
    state: "cooked",
    defaultServingGrams: 33, // 1 large egg white = ~33g
    servingLabel: "1 egg white",
    per100g: {
      calories: 52,
      proteinG: 10.9,
      carbsG: 0.7,
      fatG: 0.2,
      fiberG: 0,
    },
    notes: "1 egg white (33g) = 17 kcal, 3.6g P.",
  },

  // ── 7. FITNESS STAPLES & PROTEIN SUPPLEMENTS ───────────────────────────────
  {
    id: "whey_isolate",
    name: "Whey Protein Isolate",
    aliases: [
      "whey protein",
      "whey",
      "protein scoop",
      "whey isolate",
      "gold standard whey",
      "protein shake",
      "whey protein powder",
    ],
    state: "dry",
    defaultServingGrams: 30, // 1 scoop = 30-32g
    servingLabel: "1 scoop (30g)",
    per100g: {
      calories: 387,
      proteinG: 83.3,
      carbsG: 5.0,
      fatG: 3.3,
      fiberG: 0,
    },
    isPackaged: true,
    notes: "1 scoop (30g) provides ~116 kcal, 25g P, 1.5g C, 1.0g F.",
  },
  {
    id: "amul_protein_lassi",
    name: "Amul High Protein Lassi",
    aliases: [
      "amul protein lassi",
      "protein lassi",
      "amul lassi protein",
      "amul high protein lassi",
    ],
    state: "prepared",
    defaultServingGrams: 200, // 200ml pack
    servingLabel: "200ml pack",
    per100g: {
      calories: 65,
      proteinG: 7.5,
      carbsG: 8.8,
      fatG: 0.0,
      fiberG: 0,
    },
    isPackaged: true,
    brand: "Amul",
  },
  {
    id: "amul_protein_buttermilk",
    name: "Amul High Protein Buttermilk",
    aliases: [
      "amul protein buttermilk",
      "protein buttermilk",
      "amul chaas protein",
      "amul high protein buttermilk",
      "protein chaas",
    ],
    state: "prepared",
    defaultServingGrams: 200, // 200ml pack
    servingLabel: "200ml pack",
    per100g: {
      calories: 45,
      proteinG: 7.5,
      carbsG: 2.5,
      fatG: 1.0,
      fiberG: 0,
    },
    isPackaged: true,
    brand: "Amul",
  },
  {
    id: "greek_yogurt_plain",
    name: "High-Protein Greek Yogurt",
    aliases: [
      "greek yogurt",
      "high protein yogurt",
      "epigamia greek yogurt",
      "hung curd",
    ],
    state: "prepared",
    defaultServingGrams: 100,
    servingLabel: "100g cup",
    per100g: {
      calories: 92,
      proteinG: 10.0,
      carbsG: 6.0,
      fatG: 3.0,
      fiberG: 0,
    },
    isPackaged: true,
  },
  {
    id: "peanut_butter",
    name: "Natural Peanut Butter",
    aliases: [
      "peanut butter",
      "natural peanut butter",
      "pintola peanut butter",
      "myfitness peanut butter",
    ],
    state: "prepared",
    defaultServingGrams: 32, // 2 tbsp = ~32g
    servingLabel: "2 tbsp (32g)",
    per100g: {
      calories: 594,
      proteinG: 25.0,
      carbsG: 18.8,
      fatG: 50.0,
      fiberG: 6.0,
    },
    isPackaged: true,
  },

  // ── 8. COOKING FATS & COMMON DISHES ────────────────────────────────────────
  {
    id: "cooking_ghee_oil",
    name: "Cooking Ghee / Oil",
    aliases: ["ghee", "deshi ghee", "mustard oil", "cooking oil", "refined oil", "butter"],
    state: "prepared",
    defaultServingGrams: 5, // 1 tsp = 5g
    servingLabel: "1 tsp (5g)",
    per100g: {
      calories: 900,
      proteinG: 0,
      carbsG: 0,
      fatG: 100.0,
      fiberG: 0,
    },
  },
  {
    id: "besan_cheela",
    name: "Besan Cheela (Gram Flour Pancake)",
    aliases: ["besan chilla", "besan cheela", "chilla", "cheela", "gram flour pancake"],
    state: "prepared",
    defaultServingGrams: 80, // 1 medium cheela = ~80g
    servingLabel: "1 cheela (~80g)",
    per100g: {
      calories: 175,
      proteinG: 7.5,
      carbsG: 22.5,
      fatG: 6.3,
      fiberG: 4.0,
    },
  },
  {
    id: "masala_dosa",
    name: "Masala Dosa",
    aliases: ["masala dosa", "dosa", "plain dosa", "mysore masala dosa"],
    state: "prepared",
    defaultServingGrams: 150,
    servingLabel: "1 dosa with aloo masala",
    per100g: {
      calories: 167,
      proteinG: 3.0,
      carbsG: 23.3,
      fatG: 6.7,
      fiberG: 2.0,
    },
  },
  {
    id: "boiled_sweet_corn",
    name: "Boiled Sweet Corn",
    aliases: ["sweet corn", "corn", "boiled corn", "bhutta"],
    state: "cooked",
    defaultServingGrams: 100,
    servingLabel: "1 katori (100g)",
    per100g: {
      calories: 96,
      proteinG: 3.4,
      carbsG: 21.0,
      fatG: 1.5,
      fiberG: 2.4,
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ATWATER FACTOR MATH ENFORCER (4P + 4C + 9F)
// ─────────────────────────────────────────────────────────────────────────────

export interface MacroPayload {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  [key: string]: any;
}

/**
 * Enforces strict Atwater energy factor consistency:
 *   expectedCalories = Math.round(4 * proteinG + 4 * carbsG + 9 * fatG)
 *
 * If recorded calories drifts by > 8% from Atwater expected calories
 * (or if calories is 0/negative while macros exist), it calibrates
 * calories to the exact Atwater calculated value.
 */
export function enforceAtwaterMath<T extends MacroPayload>(item: T): T {
  const p = Math.max(0, Number(item.proteinG) || 0);
  const c = Math.max(0, Number(item.carbsG) || 0);
  const f = Math.max(0, Number(item.fatG) || 0);
  const expectedCalories = Math.round(4 * p + 4 * c + 9 * f);

  let finalCalories = Number(item.calories) || 0;

  // Calibrate if calories is missing, <= 0, or differs by > 8% from Atwater total
  if (
    finalCalories <= 0 ||
    Math.abs(finalCalories - expectedCalories) > Math.max(8, expectedCalories * 0.08)
  ) {
    finalCalories = expectedCalories;
  }

  return {
    ...item,
    calories: finalCalories,
    proteinG: Math.round(p * 10) / 10,
    carbsG: Math.round(c * 10) / 10,
    fatG: Math.round(f * 10) / 10,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FAST DETERMINISTIC FOOD ANCHOR LOOKUP
// ─────────────────────────────────────────────────────────────────────────────

export interface AnchorLookupResult {
  matched: boolean;
  anchor: FoodAnchor | null;
  name: string;
  quantity: number;
  unit: string;
  grams: number;
  macros: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
  };
  notes?: string;
}

export const COMPOUND_SEPARATOR_REGEX = /\s+(?:with|and|plus|along with|&|\+)\s+|\s*,\s*/i;

/**
 * Parses quantity and food name from free text query
 * Examples:
 * - "50g soya chunks" -> { qty: 50, unit: "g", cleanName: "soya chunks" }
 * - "200 gms paneer" -> { qty: 200, unit: "g", cleanName: "paneer" }
 * - "2 whole eggs" -> { qty: 2, unit: "piece", cleanName: "whole eggs" }
 * - "2 rotis" -> { qty: 2, unit: "piece", cleanName: "rotis" }
 * - "1 scoop whey" -> { qty: 1, unit: "scoop", cleanName: "whey" }
 */
export function parseQueryPortion(query: string): {
  qty: number;
  unit: string;
  cleanName: string;
} {
  const trimmed = query.trim().toLowerCase();

  // Pattern 1: e.g. "50g soya chunks", "100 grams paneer", "200 gms paneer", "200 gm paneer"
  const gramMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:grams?|gms?|gm|g\b|g)\s*(?:of\s+)?(.+)$/);
  if (gramMatch) {
    return {
      qty: parseFloat(gramMatch[1]),
      unit: "g",
      cleanName: gramMatch[2].trim(),
    };
  }

  // Pattern 2: e.g. "200ml milk", "200 ml of milk"
  const mlMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:milliliters?|mls?|ml\b|ml)\s*(?:of\s+)?(.+)$/);
  if (mlMatch) {
    return {
      qty: parseFloat(mlMatch[1]),
      unit: "ml",
      cleanName: mlMatch[2].trim(),
    };
  }

  // Pattern 3: e.g. "2 scoops whey", "1 scoop protein"
  const scoopMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*scoops?\s*(?:of\s+)?(.+)$/);
  if (scoopMatch) {
    return {
      qty: parseFloat(scoopMatch[1]),
      unit: "scoop",
      cleanName: scoopMatch[2].trim(),
    };
  }

  // Pattern 4: e.g. "2 rotis", "2 whole eggs", "3 eggs", "1 bowl dal"
  const countMatch = trimmed.match(
    /^(\d+(?:\.\d+)?)\s*(?:pieces?|pcs?|bowls?|katoris?|cups?|glasses?|plates?|serving|servings)?\s*(?:of\s+)?(.+)$/
  );
  if (countMatch && countMatch[2]) {
    const rawUnit = trimmed.includes("katori") || trimmed.includes("bowl")
      ? "bowl"
      : trimmed.includes("cup")
      ? "cup"
      : trimmed.includes("glass")
      ? "glass"
      : "piece";
    return {
      qty: parseFloat(countMatch[1]),
      unit: rawUnit,
      cleanName: countMatch[2].trim(),
    };
  }

  return {
    qty: 1,
    unit: "serving",
    cleanName: trimmed,
  };
}

/**
 * Deterministically finds a single matching FoodAnchor by alias or name.
 * Respects raw vs cooked distinctions:
 * - "50g soya chunks" -> soya_chunks_dry (raw/dry weight default)
 * - "boiled soya chunks" -> soya_chunks_boiled
 * - "chicken breast raw" -> chicken_breast_raw
 * - "roti with ghee" -> roti_ghee
 */
export function findFoodAnchor(query: string): AnchorLookupResult | null {
  if (!query || typeof query !== "string") return null;
  const trimmed = query.trim();
  if (!trimmed) return null;

  // If query contains compound separators, route through resolveMultiItemFoodAnchors
  // to prevent greedy single-item substring matching!
  if (COMPOUND_SEPARATOR_REGEX.test(trimmed)) {
    const multi = resolveMultiItemFoodAnchors(trimmed);
    if (multi && multi.matched) {
      return {
        matched: true,
        anchor: multi.items[0]?.anchor || null,
        name: multi.name,
        quantity: 1,
        unit: "serving",
        grams: multi.items.reduce((acc, i) => acc + i.grams, 0),
        macros: multi.macros,
        notes: multi.notes,
      };
    }
    return null;
  }

  const { qty, unit, cleanName } = parseQueryPortion(trimmed);
  const normalized = cleanName.toLowerCase().trim();

  // Search through anchors
  let matchedAnchor: FoodAnchor | null = null;

  // 1. High-Priority Dedicated Food Recognizers (Egg, Roti, Paneer, Soya, Rice, Dal)
  // Ensures typos (e.g. "wgole eggs") or colloquial terms ("anda", "chapatis") reliably resolve.
  const isEgg = /\b(eggs?|anda|ande|boiled eggs?|whole eggs?|omelette|omlet|bhurji)\b/i.test(normalized);
  const isEggWhite = /\bwhites?\b/i.test(normalized);
  if (isEgg) {
    if (isEggWhite) {
      matchedAnchor = FOOD_ANCHORS.find((a) => a.id === "egg_white") || null;
    } else {
      matchedAnchor = FOOD_ANCHORS.find((a) => a.id === "whole_egg_boiled") || null;
    }
  }

  if (!matchedAnchor) {
    const isRoti = /\b(rotis?|chapatis?|chapattis?|phulkas?|fulkas?)\b/i.test(normalized);
    if (isRoti) {
      const isGhee = /\b(ghee|butter|oil)\b/i.test(normalized);
      matchedAnchor = FOOD_ANCHORS.find((a) => a.id === (isGhee ? "roti_ghee" : "roti_plain")) || null;
    }
  }

  if (!matchedAnchor) {
    const isPaneer = /\b(paneer|cottage cheese)\b/i.test(normalized);
    if (isPaneer) {
      matchedAnchor = FOOD_ANCHORS.find((a) => a.id === "paneer_raw") || null;
    }
  }

  if (!matchedAnchor) {
    const isSoya = /\b(soya chunks?|soy chunks?|nutrela)\b/i.test(normalized);
    if (isSoya) {
      const isBoiled = /\b(boiled|cooked|soaked)\b/i.test(normalized);
      matchedAnchor = FOOD_ANCHORS.find((a) => a.id === (isBoiled ? "soya_chunks_boiled" : "soya_chunks_dry")) || null;
    }
  }

  if (!matchedAnchor) {
    const isRice = /\b(rice|chawal|white rice|steamed rice|boiled rice)\b/i.test(normalized);
    if (isRice && !/\b(fried rice|biryani|pulao)\b/i.test(normalized)) {
      matchedAnchor = FOOD_ANCHORS.find((a) => a.id === "cooked_white_rice") || null;
    }
  }

  if (!matchedAnchor) {
    const isChicken = /\b(chicken breast)\b/i.test(normalized);
    if (isChicken) {
      const isRaw = /\b(raw|uncooked)\b/i.test(normalized);
      matchedAnchor = FOOD_ANCHORS.find((a) => a.id === (isRaw ? "chicken_breast_raw" : "chicken_breast_cooked")) || null;
    }
  }

  if (!matchedAnchor) {
    const isDal = /\b(dal|daal|yellow dal|dal tadka|moong dal|toor dal)\b/i.test(normalized);
    if (isDal && !/\b(makhani|dal makhani)\b/i.test(normalized)) {
      matchedAnchor = FOOD_ANCHORS.find((a) => a.id === "dal_tadka") || null;
    }
  }

  // 2. Exact match on name or aliases
  if (!matchedAnchor) {
    for (const anchor of FOOD_ANCHORS) {
      if (anchor.name.toLowerCase() === normalized) {
        matchedAnchor = anchor;
        break;
      }
      if (anchor.aliases.some((a) => a.toLowerCase() === normalized)) {
        matchedAnchor = anchor;
        break;
      }
    }
  }

  // 3. Whole-phrase / keyword match
  if (!matchedAnchor) {
    for (const anchor of FOOD_ANCHORS) {
      for (const a of anchor.aliases) {
        const aliasLower = a.toLowerCase();
        const wordRegex = new RegExp(`(^|\\s)${aliasLower.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}(\\s|$)`, "i");
        if (wordRegex.test(normalized)) {
          const isQueryCooked = /boiled|cooked|soaked|grilled|fried/i.test(normalized);
          const isAnchorCooked = anchor.state === "cooked";

          // If query specifies cooked/raw, enforce match; otherwise accept default common state
          if (isQueryCooked) {
            if (isAnchorCooked) {
              matchedAnchor = anchor;
              break;
            }
          } else {
            matchedAnchor = anchor;
            break;
          }
        }
      }
      if (matchedAnchor) break;
    }
  }

  if (!matchedAnchor) return null;

  // Calculate actual grams
  let totalGrams: number;
  if (unit === "g" || unit === "ml") {
    totalGrams = qty;
  } else if (unit === "scoop" && matchedAnchor.id === "whey_isolate") {
    totalGrams = qty * 30;
  } else {
    totalGrams = qty * matchedAnchor.defaultServingGrams;
  }

  const factor = totalGrams / 100;
  const p100 = matchedAnchor.per100g;

  const rawProtein = Math.round(p100.proteinG * factor * 10) / 10;
  const rawCarbs = Math.round(p100.carbsG * factor * 10) / 10;
  const rawFat = Math.round(p100.fatG * factor * 10) / 10;
  const rawFiber = Math.round((p100.fiberG || 0) * factor * 10) / 10;

  const baseCalories = Math.round(p100.calories * factor);

  const enforced = enforceAtwaterMath({
    calories: baseCalories,
    proteinG: rawProtein,
    carbsG: rawCarbs,
    fatG: rawFat,
    fiberG: rawFiber,
  });

  return {
    matched: true,
    anchor: matchedAnchor,
    name: matchedAnchor.name,
    quantity: qty,
    unit,
    grams: Math.round(totalGrams),
    macros: {
      calories: enforced.calories,
      proteinG: enforced.proteinG,
      carbsG: enforced.carbsG,
      fatG: enforced.fatG,
      fiberG: rawFiber,
    },
    notes: matchedAnchor.notes,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOUND MULTI-ITEM FOOD ANCHOR RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

export interface MultiItemAnchorResult {
  matched: boolean;
  name: string;
  items: AnchorLookupResult[];
  macros: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
  };
  notes?: string;
}

/**
 * Resolves compound queries like "2 whole eggs with 2 rotis", "100g paneer and 150g rice".
 * Splits the query on compound conjunctions (with, and, plus, &, +), resolves each segment
 * against deterministic food anchors, and sums their macros without dropping any ingredient.
 *
 * If ANY segment cannot be resolved by an anchor, returns null to allow full LLM decomposition
 * rather than returning a partial single-item match.
 */
export function resolveMultiItemFoodAnchors(query: string): MultiItemAnchorResult | null {
  if (!query || typeof query !== "string") return null;
  const trimmed = query.trim();
  if (!trimmed) return null;

  // Split on compound separators
  const segments = trimmed
    .split(COMPOUND_SEPARATOR_REGEX)
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length <= 1) return null;

  const resolvedItems: AnchorLookupResult[] = [];

  for (const segment of segments) {
    // Resolve each individual segment through findFoodAnchor
    const res = findFoodAnchor(segment);
    // If ANY segment fails to match an anchor, reject the deterministic compound match
    // so no ingredient is ever silently dropped, and allow Gemini AI to estimate all items!
    if (!res || !res.matched) {
      return null;
    }
    resolvedItems.push(res);
  }

  // Sum macros across all resolved segments
  let totalCalories = 0;
  let totalProteinG = 0;
  let totalCarbsG = 0;
  let totalFatG = 0;
  let totalFiberG = 0;

  for (const item of resolvedItems) {
    totalCalories += item.macros.calories;
    totalProteinG += item.macros.proteinG;
    totalCarbsG += item.macros.carbsG;
    totalFatG += item.macros.fatG;
    totalFiberG += item.macros.fiberG;
  }

  // Enforce Atwater factor consistency on the summed total
  const enforcedTotal = enforceAtwaterMath({
    calories: totalCalories,
    proteinG: Math.round(totalProteinG * 10) / 10,
    carbsG: Math.round(totalCarbsG * 10) / 10,
    fatG: Math.round(totalFatG * 10) / 10,
    fiberG: Math.round(totalFiberG * 10) / 10,
  });

  const mealName = resolvedItems
    .map((item) => `${item.quantity > 1 ? `${item.quantity}× ` : ""}${item.name}`)
    .join(" with ");

  return {
    matched: true,
    name: mealName,
    items: resolvedItems,
    macros: {
      calories: enforcedTotal.calories,
      proteinG: enforcedTotal.proteinG,
      carbsG: enforcedTotal.carbsG,
      fatG: enforcedTotal.fatG,
      fiberG: enforcedTotal.fiberG || 0,
    },
    notes: resolvedItems.map((i) => i.notes).filter(Boolean).join(" | "),
  };
}
