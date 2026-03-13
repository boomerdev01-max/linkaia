// ═══════════════════════════════════════════════════════════════════════════
// src/app/api/gifts/catalog/route.ts
// GET /api/gifts/catalog — Liste des cadeaux virtuels disponibles
// ═══════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const gifts = await prisma.virtualGift.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { order: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      emoji: true,
      description: true,
      animationUrl: true,
      lgemsValue: true,
      isImpactGift: true,
      impactPercent: true,
      category: true,
      impactCause: {
        select: { id: true, name: true, logoUrl: true },
      },
    },
  });

  // Grouper par catégorie pour l'affichage
  const grouped = gifts.reduce(
    (acc: { [x: string]: any[]; }, gift: { category: string | number; }) => {
      if (!acc[gift.category]) acc[gift.category] = [];
      acc[gift.category].push(gift);
      return acc;
    },
    {} as Record<string, typeof gifts>,
  );

  return NextResponse.json({ success: true, data: { gifts, grouped } });
}
