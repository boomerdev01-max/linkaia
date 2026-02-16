import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouve" },
        { status: 404 },
      );
    }

    // ✅ Une seule requête SQL au lieu de la boucle N+1
    // Noms de tables issus des @@map() de ton schéma Prisma
    const result = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "messages" m
      INNER JOIN "conversation_participants" cp
        ON cp."conversation_id" = m."conversation_id"
      WHERE cp."user_id" = ${user.id}
        AND cp."is_archived" = false
        AND m."sender_id" != ${user.id}
        AND m."is_deleted" = false
        AND (cp."last_read_at" IS NULL OR m."created_at" > cp."last_read_at")
    `;

    const totalUnread = Number(result[0].count);

    return NextResponse.json({ count: totalUnread });
  } catch (error) {
    console.error("Error getting unread count:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
