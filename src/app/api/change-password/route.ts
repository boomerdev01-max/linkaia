// app/api/change-password/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { updateSupabaseUserPassword } from "@/lib/supabase/admin-client";
import { validatePassword } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    // 1. Authentification
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // 2. Récupérer l'utilisateur Prisma
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: {
        id: true,
        supabaseId: true,
        mustChangePassword: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 },
      );
    }

    // 3. Récupérer et valider les données du body
    const body = await request.json();
    const { newPassword, confirmPassword } = body;

    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Les deux champs sont requis" },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Les mots de passe ne correspondent pas" },
        { status: 400 },
      );
    }

    // 4. Validation des règles du mot de passe
    const { isValid, checks } = validatePassword(newPassword);
    if (!isValid) {
      return NextResponse.json(
        {
          error: "Le mot de passe ne respecte pas les critères de sécurité",
          checks,
        },
        { status: 400 },
      );
    }

    // 5. Mise à jour dans Supabase Auth
    if (user.supabaseId) {
      await updateSupabaseUserPassword(user.supabaseId, newPassword);
    }

    // 6. Mise à jour dans Prisma (hash bcrypt + mustChangePassword = false)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    return NextResponse.json(
      { success: true, message: "Mot de passe mis à jour avec succès" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur API /change-password:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
