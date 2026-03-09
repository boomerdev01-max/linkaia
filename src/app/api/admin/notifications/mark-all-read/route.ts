// src/app/api/admin/notifications/mark-all-read/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { userHasPermission } from "@/lib/rbac";

/**
 * PUT /api/admin/notifications/mark-all-read
 */
export async function PUT() {
  try {
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

    // updateMany ne supporte pas les filtres JSON dans tous les drivers Prisma
    // On passe par findMany + updateMany avec les ids
    const unreadIds = await prisma.notification.findMany({
      where: {
        userId: user.id,
        isRead: false,
        metadata: { path: ["adminOnly"], equals: true },
      },
      select: { id: true },
    });

    const ids = unreadIds.map((n) => n.id);

    const result = await prisma.notification.updateMany({
      where: { id: { in: ids } },
      data: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Toutes les notifications ont été marquées comme lues",
      count: result.count,
    });
  } catch (error) {
    console.error("❌ Error marking all admin notifications as read:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour" },
      { status: 500 },
    );
  }
}
