import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins 1 majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins 1 minuscule")
    .regex(/\d/, "Le mot de passe doit contenir au moins 1 chiffre")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Le mot de passe doit contenir au moins 1 symbole"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code, newPassword } = resetPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Vérifier le code
    if (user.resetPasswordCode !== code) {
      return NextResponse.json(
        { error: "Code de réinitialisation invalide" },
        { status: 400 }
      );
    }

    // Vérifier l'expiration
    if (user.resetPasswordCodeExpiry && user.resetPasswordCodeExpiry < new Date()) {
      return NextResponse.json(
        { error: "Code de réinitialisation expiré" },
        { status: 400 }
      );
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordCode: null,
        resetPasswordCodeExpiry: null,
      },
    });

    // Mettre à jour dans Supabase si l'utilisateur a un supabaseId
    if (user.supabaseId) {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.admin.updateUserById(user.supabaseId, {
        password: newPassword,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}