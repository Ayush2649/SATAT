import { NextRequest, NextResponse } from "next/server";
import Groq, { toFile } from "groq-sdk";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callJsonStrict } from "@/lib/ai/groq";
import { TRANSCRIPTION_MODEL, MODELS, MAX_TOKENS } from "@/lib/ai/models";
import { enforceAtwaterMath } from "@/lib/nutrition/foodAnchors";

export const runtime = "nodejs";
export const maxDuration = 30;

// ── Zod schemas ────────────────────────────────────────────────────────────────

const MealItemSchema = z.object({
  name:     z.string().min(1),
  calories: z.number().int().nonnegative(),
  proteinG: z.number().int().nonnegative(),
  carbsG:   z.number().int().nonnegative(),
  fatG:     z.number().int().nonnegative(),
  fiberG:   z.number().int().nonnegative(),
});

const VoiceMealSchema = z.object({
  meals: z.array(MealItemSchema),
});

// ── Transcription (shared Groq client for audio API) ──────────────────────────

function groqForAudio() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set");
  return new Groq({ apiKey: key });
}

// ── Parse prompt (clinical IFCT reference values) ─────────────────────────────

function buildParsePrompt(transcript: string): string {
  return `You are a precise Indian nutrition database. The user spoke what they ate.

TRANSCRIPT: "${transcript}"

REFERENCE VALUES (per item):
FITNESS & PROTEIN: Soya chunks dry 50g=173kcal/26P/16.5C/0.3F | Rolled oats 40g=150/5/27/2.5 | Whey isolate 30g scoop=116/25/1.5/1 | Boiled egg white 1pc=17/3.6/0.2/0.1 | Chicken breast grilled 100g=165/31/0/3.6 | Amul protein lassi 200ml=130/15/13/0 | Amul protein buttermilk 200ml=90/15/5/2
BREADS: Chapati plain 30g=85kcal/3P/18C/0.5F | Roti with ghee=130/3/18/5.5 | Paratha plain=150/3/22/6 | Aloo paratha=200/5/28/8 | Paneer paratha=260/10/28/11 | Naan=260/8/45/5
RICE: Plain rice cooked 150g=195/4/42/0.4 | Veg biryani 200g=280/6/45/8 | Chicken biryani 250g=380/22/45/12
DAL: Toor dal 150g=150/7/19/5 | Dal makhani=240/11/25/12 | Rajma=200/13/30/3 | Chole=210/12/32/4
PANEER: Paneer raw 100g=268/18/4/20 | Paneer bhurji 150g=290/20/5/22 | Palak paneer 200g=280/16/10/20
DAIRY: Curd/Dahi 100g=60/3.5/4.5/3.1 | Toned milk 200ml=116/6.2/9.4/6 | Greek yogurt 100g=92/10/6/3
EGGS: Boiled egg 1pc=74/6.3/0.4/5 | Egg bhurji 2eggs=220/13/5/16 | Omelette 2eggs=200/13/4/15
CHICKEN: Curry 150g=230/28/5/10 | Tikka 100g=160/26/4/5
SOUTH INDIAN: Idli 1pc=40/1.5/8/0.2 | Dosa plain=130/3/24/2 | Masala dosa=250/4.5/35/10
BREAKFAST: Poha 150g=180/3/36/3 | Upma 150g=190/5/32/5 | Besan chilla 1pc=140/6/18/5

RULES:
- Group everything from ONE sitting into a SINGLE meal entry, combining (summing) the macros of all items, with a short descriptive name like "2 roti, dal & curd".
- For dry staples like soya chunks or oats, always assume the quoted grams refers to raw/dry weight unless cooked/boiled is explicitly stated.
- Only split into multiple entries if the user clearly describes separate meals (e.g. "breakfast was… and lunch was…").
- Scale for quantities mentioned. Standard single serving if no quantity given.

Return EXACTLY this JSON (integer values only):
{"meals":[{"name":"2 roti, dal & curd","calories":420,"proteinG":18,"carbsG":60,"fatG":10,"fiberG":8}]}`;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let transcript = "";

  try {
    const form = await req.formData();
    const audio = form.get("audio") as File | null;
    if (!audio) return NextResponse.json({ error: "No audio" }, { status: 400 });

    // ── 1. Transcribe ──
    const buf = Buffer.from(await audio.arrayBuffer());
    const type = audio.type || "audio/webm";
    const ext =
      type.includes("mp4") || type.includes("m4a") || type.includes("aac") ? "m4a"
      : type.includes("mpeg") || type.includes("mp3") ? "mp3"
      : type.includes("wav") ? "wav"
      : "webm";
    const file = await toFile(buf, `meal.${ext}`, { type });

    const tr = await groqForAudio().audio.transcriptions.create({
      file,
      model:    TRANSCRIPTION_MODEL,
      language: "en",
      prompt:   "A spoken description of food eaten, e.g. two rotis with dal and a bowl of curd.",
    });
    transcript = (tr.text ?? "").trim();

    if (!transcript) return NextResponse.json({ transcript: "", meals: [] });

    // ── 2. Parse + estimate macros ──
    const result = await callJsonStrict({
      model:      MODELS.voiceMeal,
      messages:   [{ role: "user", content: buildParsePrompt(transcript) }],
      maxTokens:  MAX_TOKENS.voiceMeal,
      temperature: 0,
      schema:     VoiceMealSchema,
      schemaName: "voice-meal",
      feature:    "voiceMeal",
    });

    // Response shape unchanged — frontend reads { transcript, meals: [{ name, macros: {...} }] }
    // Enforce Atwater factor consistency (4P + 4C + 9F) on all meals
    const meals = result.data.meals
      .filter((m) => m.name.trim())
      .map((m) => {
        const enforced = enforceAtwaterMath({
          calories: m.calories,
          proteinG: m.proteinG,
          carbsG:   m.carbsG,
          fatG:     m.fatG,
          fiberG:   m.fiberG,
        });

        return {
          name: m.name.trim(),
          macros: {
            calories: enforced.calories,
            proteinG: Math.round(enforced.proteinG),
            carbsG:   Math.round(enforced.carbsG),
            fatG:     Math.round(enforced.fatG),
            fiberG:   Math.round(enforced.fiberG || 0),
          },
        };
      });

    return NextResponse.json({ transcript, meals });
  } catch (err: any) {
    console.error("[voice-meal] error:", err?.code, err?.message);
    return NextResponse.json(
      { error: err.message ?? "Failed to process audio", transcript },
      { status: 500 },
    );
  }
}
