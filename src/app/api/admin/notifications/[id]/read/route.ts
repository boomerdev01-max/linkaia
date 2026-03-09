// src/app/api/admin/notifications/[id]/read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { userHasPermission } from "@/lib/rbac";

/**
 * PUT /api/admin/notifications/[id]/read
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

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

    const canView = await userHasPermission(user.id, "notifications.view");
    if (!canView) {
      return NextResponse.json(
        { success: false, error: "Permission refusée" },
        { status: 403 },
      );
    }

    // Vérifier que la notification appartient à cet admin et est bien une notif admin
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: user.id,
        metadata: { path: ["adminOnly"], equals: true },
      },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: "Notification non trouvée" },
        { status: 404 },
      );
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Notification marquée comme lue",
    });
  } catch (error) {
    console.error("❌ Error marking admin notification as read:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update notification" },
      { status: 500 },
    );
  }
}
