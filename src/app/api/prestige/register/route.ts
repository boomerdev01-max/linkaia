// src/app/api/prestige/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseAuthUser } from "@/lib/supabase/admin-client";
import bcrypt from "bcryptjs";

// ============================================================
// POST — Inscription d'un compte Prestige via code d'invitation
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, email, password, nom, prenom } = body;

    // ── Validation des champs ────────────────────────────────
    if (!code || !email || !password || !nom || !prenom) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 },
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    // ── Vérification du code ─────────────────────────────────
    const inviteCode = await prisma.prestigeInviteCode.findUnique({
      where: { code: normalizedCode },
    });

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Code d'invitation invalide" },
        { status: 400 },
      );
    }

    if (inviteCode.status !== "pending") {
      const messages: Record<string, string> = {
        used: "Ce code a déjà été utilisé",
        revoked: "Ce code d'invitation a été révoqué",
        expired: "Ce code d'invitation a expiré",
      };
      return NextResponse.json(
        { error: messages[inviteCode.status] ?? "Code invalide" },
        { status: 400 },
      );
    }

    if (inviteCode.expiresAt < new Date()) {
      await prisma.prestigeInviteCode.update({
        where: { id: inviteCode.id },
        data: { status: "expired" },
      });
      return NextResponse.json(
        { error: "Ce code d'invitation a expiré" },
        { status: 400 },
      );
    }

    // ── Vérifier si l'email est déjà pris ───────────────────
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 409 },
      );
    }

    // ── Créer l'utilisateur dans Supabase Auth ───────────────
    // Email déjà confirmé : le code d'invitation fait office de vérification
    const supabaseUser = await createSupabaseAuthUser(
      email,
      password,
      { nom, prenom },
      true, // email_confirm: true
    );

    // ── Créer l'utilisateur dans Prisma ──────────────────────
    const hashedPassword = await bcrypt.hash(password, 10);

    // Récupérer le rôle standard_user
    const standardRole = await prisma.role.findUnique({
      where: { name: "standard_user" },
    });

    const newUser = await prisma.user.create({
      data: {
        nom,
        prenom,
        email,
        password: hashedPassword,
        supabaseId: supabaseUser.id,
        provider: "email",
        emailVerified: true, // Validé via le code d'invitation
        level: "PRESTIGE", // ← Le niveau clé
        adminCreated: false,
        mustChangePassword: false,
        isFirstLogin: true,
        // Rôle standard_user (le level prestige est géré par le champ level, pas le rôle RBAC)
        ...(standardRole
          ? {
            roles: {
              create: { roleId: standardRole.id },
            },
          }
          : {}),
      },
    });

    // ── Marquer le code comme utilisé (atomique) ─────────────
    await prisma.prestigeInviteCode.update({
      where: { id: inviteCode.id },
      data: {
        status: "used",
        usedById: newUser.id,
        usedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Compte Prestige créé avec succès. Vous pouvez maintenant vous connecter.",
        userId: newUser.id,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("❌ POST /api/prestige/register:", error);

    // Erreur spécifique Supabase : email déjà utilisé dans Auth
    if (error?.message?.includes("User already registered")) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
