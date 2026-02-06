// src/app/api/preference/skip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        skipPreferenceSetup: true,
      },
    });

    console.log(`✅ User ${user.id} skipped preference setup`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error skipping preference setup:", error);
    return NextResponse.json(
      { error: "Failed to skip preference setup" },
      { status: 500 }
    );
  }
}