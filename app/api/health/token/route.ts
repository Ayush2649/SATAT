import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserKey } from "@/lib/auth/userKey";
import { adminDb } from "@/lib/firebaseAdmin";
import crypto from "crypto";

export const runtime = "nodejs";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
};

// GET /api/health/token  — returns the user's health sync token (creates one if none exists)
// GET /api/health/token?regenerate=1 — deletes old token and creates a new one
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_CACHE_HEADERS });

  const userId = getUserKey(session);
  if (!userId) return NextResponse.json({ error: "No user ID" }, { status: 400, headers: NO_CACHE_HEADERS });

  const regenerate = req.nextUrl.searchParams.get("regenerate") === "1";

  const tokensCol = adminDb.collection("healthTokens");

  // If regenerating, delete the existing token first
  if (regenerate) {
    const existing = await tokensCol.where("userId", "==", userId).limit(1).get();
    if (!existing.empty) {
      await existing.docs[0].ref.delete();
    }
  }

  // Check for an existing token
  if (!regenerate) {
    const existing = await tokensCol.where("userId", "==", userId).limit(1).get();
    if (!existing.empty) {
      return NextResponse.json({ token: existing.docs[0].id }, { headers: NO_CACHE_HEADERS });
    }
  }

  // Create a new token
  const token = crypto.randomBytes(32).toString("hex");
  await tokensCol.doc(token).set({
    userId,
    createdAt: Date.now(),
  });

  return NextResponse.json({ token }, { headers: NO_CACHE_HEADERS });
}

