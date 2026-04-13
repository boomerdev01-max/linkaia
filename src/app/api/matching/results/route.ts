// src/app/api/matching/results/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { getMatchPortfolio } from "@/lib/matching";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();

    if (!user || error) {
      return NextResponse.json(
        { success: false, error: error || "Non authentifié" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "10", 10);

    const data = await getMatchPortfolio(user.id, user.level, page, pageSize);

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("❌ [MATCHING RESULTS]", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}