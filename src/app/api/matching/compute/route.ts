// src/app/api/matching/compute/route.ts
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { computeNextMatchBatch } from "@/lib/matching";

export async function POST() {
  try {
    const { user, error } = await getAuthenticatedUser();

    if (!user || error) {
      return NextResponse.json(
        { success: false, error: error || "Non authentifié" },
        { status: 401 }
      );
    }

    const result = await computeNextMatchBatch(user.id, user.level);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("❌ [MATCHING COMPUTE]", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}