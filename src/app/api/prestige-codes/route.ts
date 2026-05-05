// src/app/api/admin/prestige-codes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { userHasPermission } from "@/lib/rbac";
import { sendPrestigeInviteEmail } from "@/lib/email";

// ── Générateur de code format XXXX-XXXX-XXXX ─────────────────
function generatePrestigeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Sans O/0/I/1 pour éviter confusions
  const block = () =>
    Array.from(
      { length: 4 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
  return `${block()}-${block()}-${block()}`;
}

// ── Durée d'expiration par défaut : 30 jours ─────────────────
function getDefaultExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
}

// ============================================================
// GET — Lister tous les codes prestige
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 },
      );
    }

    const canManage = await userHasPermission(user.id, "prestige.manage");
    if (!canManage) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Mettre à jour automatiquement les codes expirés avant de lister
    await prisma.prestigeInviteCode.updateMany({
      where: {
        status: "pending",
        expiresAt: { lt: new Date() },
      },
      data: { status: "expired" },
    });

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status"); // "pending"|"used"|"revoked"|"expired"
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    const where = statusFilter ? { status: statusFilter } : {};

    const [codes, total] = await Promise.all([
      prisma.prestigeInviteCode.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          generatedBy: {
            select: { id: true, nom: true, prenom: true, email: true },
          },
          usedBy: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              profil: { select: { profilePhotoUrl: true } },
            },
          },
        },
      }),
      prisma.prestigeInviteCode.count({ where }),
    ]);

    // Stats globales
    const stats = await prisma.prestigeInviteCode.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const statsMap = stats.reduce(
      (acc, s) => {
        acc[s.status] = s._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    return NextResponse.json({
      success: true,
      codes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        pending: statsMap["pending"] ?? 0,
        used: statsMap["used"] ?? 0,
        revoked: statsMap["revoked"] ?? 0,
        expired: statsMap["expired"] ?? 0,
      },
    });
  } catch (error) {
    console.error("❌ GET /api/admin/prestige-codes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ============================================================
// POST — Générer un code et envoyer l'email
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 },
      );
    }

    const canManage = await userHasPermission(admin.id, "prestige.manage");
    if (!canManage) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { prospectEmail, prospectName, adminNote, expiresInDays } = body;

    // Validation
    if (!prospectEmail || !prospectName) {
      return NextResponse.json(
        { error: "L'email et le nom du prospect sont requis" },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(prospectEmail)) {
      return NextResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 },
      );
    }

    // Vérifier si cet email a déjà un compte
    const existingUser = await prisma.user.findUnique({
      where: { email: prospectEmail },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 409 },
      );
    }

    // Vérifier si un code pending existe déjà pour cet email
    const existingCode = await prisma.prestigeInviteCode.findFirst({
      where: { prospectEmail, status: "pending" },
    });
    if (existingCode) {
      return NextResponse.json(
        {
          error:
            "Un code d'invitation actif existe déjà pour cet email. Révoquez-le d'abord si vous souhaitez en générer un nouveau.",
        },
        { status: 409 },
      );
    }

    // Générer un code unique (retry si collision, très improbable)
    let code: string;
    let attempts = 0;
    do {
      code = generatePrestigeCode();
      attempts++;
      if (attempts > 10) {
        throw new Error("Impossible de générer un code unique");
      }
    } while (await prisma.prestigeInviteCode.findUnique({ where: { code } }));

    // Calcul expiration
    const daysValid = expiresInDays && expiresInDays > 0 ? expiresInDays : 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysValid);

    // Création en DB
    const newCode = await prisma.prestigeInviteCode.create({
      data: {
        code,
        prospectEmail,
        prospectName,
        adminNote: adminNote ?? null,
        status: "pending",
        expiresAt,
        generatedById: admin.id,
      },
    });

    // Envoi email
    try {
      await sendPrestigeInviteEmail(
        prospectEmail,
        prospectName,
        code,
        expiresAt,
      );
    } catch (emailError) {
      // Si l'email échoue, on supprime le code pour garder la cohérence
      await prisma.prestigeInviteCode.delete({ where: { id: newCode.id } });
      console.error("❌ Échec envoi email prestige:", emailError);
      return NextResponse.json(
        {
          error:
            "Le code a été généré mais l'envoi de l'email a échoué. Vérifiez la configuration email.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Code Prestige généré et envoyé à ${prospectEmail}`,
        code: newCode,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("❌ POST /api/admin/prestige-codes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ============================================================
// DELETE — Révoquer un code (par son id passé en query param)
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 },
      );
    }

    const canManage = await userHasPermission(admin.id, "prestige.manage");
    if (!canManage) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const codeId = searchParams.get("id");

    if (!codeId) {
      return NextResponse.json(
        { error: "L'id du code est requis" },
        { status: 400 },
      );
    }

    const existingCode = await prisma.prestigeInviteCode.findUnique({
      where: { id: codeId },
    });

    if (!existingCode) {
      return NextResponse.json({ error: "Code introuvable" }, { status: 404 });
    }

    if (existingCode.status === "used") {
      return NextResponse.json(
        { error: "Impossible de révoquer un code déjà utilisé" },
        { status: 400 },
      );
    }

    if (existingCode.status === "revoked") {
      return NextResponse.json(
        { error: "Ce code est déjà révoqué" },
        { status: 400 },
      );
    }

    await prisma.prestigeInviteCode.update({
      where: { id: codeId },
      data: { status: "revoked" },
    });

    return NextResponse.json({
      success: true,
      message: "Code révoqué avec succès",
    });
  } catch (error) {
    console.error("❌ DELETE /api/admin/prestige-codes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
