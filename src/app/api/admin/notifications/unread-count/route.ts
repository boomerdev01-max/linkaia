// src/app/api/admin/notifications/unread-count/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { userHasPermission } from "@/lib/rbac";

/**
 * GET /api/admin/notifications/unread-count
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) {
      return NextResponse.json({ success: false, error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const canView = await userHasPermission(user.id, "notifications.view");
    if (!canView) {
      return NextResponse.json({ success: false, error: "Permission refusée" }, { status: 403 });
    }

    const count = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
        metadata: { path: ["adminOnly"], equals: true },
      },
    });

    return NextResponse.json({ success: true, data: { count } });
  } catch (error) {
    console.error("❌ Error fetching admin unread count:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch unread count" }, { status: 500 });
  }
}