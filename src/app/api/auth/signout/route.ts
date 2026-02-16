import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(
    new URL(
      "/signin",
      process.env.NEXT_PUBLIC_APP_URL || "https://linkaia.vercel.app",
    ),
  );
}
