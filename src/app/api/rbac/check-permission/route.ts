// app/api/rbac/check-permission/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { userHasPermission } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 },
      );
    }

    const { permission } = await request.json();

    if (!permission) {
      return NextResponse.json(
        { error: "Permission manquante" },
        { status: 400 },
      );
    }

    const hasPermission = await userHasPermission(user.id, permission);

    return NextResponse.json({ hasPermission });
  } catch (error) {
    console.error("Erreur API /rbac/check-permission:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
