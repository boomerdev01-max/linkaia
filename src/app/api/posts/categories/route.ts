// src/app/api/posts/categories/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.postCategory.findMany({
      where:   { isActive: true },
      orderBy: { order: "asc" },
      select:  { id: true, code: true, label: true, emoji: true },
    });
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error("❌ Error fetching post categories:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
