// src/app/api/prestige/validate-code/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ============================================================
// POST — Valider un code prestige (endpoint public)
// Utilisé par /signup/prestige pour vérifier le code avant inscription
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, error: "Code requis" },
        { status: 400 },
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    const inviteCode = await prisma.prestigeInviteCode.findUnique({
      where: { code: normalizedCode },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        prospectEmail: true,
        prospectName: true,
      },
    });

    if (!inviteCode) {
      return NextResponse.json(
        { valid: false, error: "Code d'invitation invalide" },
        { status: 200 }, // 200 intentionnel : pas une erreur serveur
      );
    }

    if (inviteCode.status === "used") {
      return NextResponse.json(
        { valid: false, error: "Ce code a déjà été utilisé" },
        { status: 200 },
      );
    }

    if (inviteCode.status === "revoked") {
      return NextResponse.json(
        { valid: false, error: "Ce code d'invitation a été révoqué" },
        { status: 200 },
      );
    }

    if (inviteCode.status === "expired" || inviteCode.expiresAt < new Date()) {
      // Mettre à jour le statut si pas encore fait
      if (inviteCode.status !== "expired") {
        await prisma.prestigeInviteCode.update({
          where: { id: inviteCode.id },
          data: { status: "expired" },
        });
      }
      return NextResponse.json(
        { valid: false, error: "Ce code d'invitation a expiré" },
        { status: 200 },
      );
    }

    // Code valide
    return NextResponse.json({
      valid: true,
      prospectEmail: inviteCode.prospectEmail,
      prospectName: inviteCode.prospectName,
      expiresAt: inviteCode.expiresAt,
    });
  } catch (error) {
    console.error("❌ POST /api/prestige/validate-code:", error);
    return NextResponse.json(
      { valid: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}
