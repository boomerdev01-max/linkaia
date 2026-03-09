// src/app/api/admin/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { userHasPermission } from "@/lib/rbac";

/**
 * GET /api/admin/notifications
 * Récupère les notifications admin de l'utilisateur connecté
 * Filtre sur metadata.adminOnly = true
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const type = searchParams.get("type") || null; // filtre optionnel par type

    const skip = (page - 1) * limit;

    // Filtre de base : notifs de cet admin avec adminOnly: true
    const whereClause: any = {
      userId: user.id,
      metadata: {
        path: ["adminOnly"],
        equals: true,
      },
    };

    if (unreadOnly) whereClause.isRead = false;

    if (type) whereClause.type = type;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({
        where: {
          userId: user.id,
          isRead: false,
          metadata: { path: ["adminOnly"], equals: true },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          hasMore: skip + notifications.length < total,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching admin notifications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}
