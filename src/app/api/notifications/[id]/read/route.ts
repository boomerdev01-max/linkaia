// app/api/notifications/[id]/read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/notifications/[id]/read
 * Marque une notification comme lue
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }, // ← CHANGEMENT OBLIGATOIRE ICI
) {
  try {
    const { id } = await params; // ← LIGNE À AJOUTER (await + destructuring)

    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id, // ← remplace params.id par id (la variable awaitée)
        userId: user.id,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: "Notification non trouvée" },
        { status: 404 },
      );
    }

    await prisma.notification.update({
      where: { id }, // ← remplace params.id par id
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notification marquée comme lue",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update notification" },
      { status: 500 },
    );
  }
}
