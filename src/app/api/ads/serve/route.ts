// src/app/api/ads/serve/route.ts
// Retourne la publicité à afficher dans le feed pour l'utilisateur courant

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { selectAdForUser, buildUserContext } from "@/lib/ad-server";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (!user || error) {
      return NextResponse.json({ ad: null }, { status: 200 });
    }

    const userContext = await buildUserContext(user.id);
    const ad = await selectAdForUser(userContext);

    if (!ad) {
      return NextResponse.json({ ad: null });
    }

    return NextResponse.json({ ad });
  } catch (err) {
    console.error("❌ GET /api/ads/serve:", err);
    // On ne bloque jamais le feed pour une erreur pub
    return NextResponse.json({ ad: null });
  }
}
