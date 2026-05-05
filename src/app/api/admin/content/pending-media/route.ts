// src/app/api/admin/content/pending-media/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { userHasPermission } from "@/lib/rbac";

// ─── Auth helper local ───────────────────────────────────────────────────────
async function getAdminUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) return null;

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    select: { id: true },
  });

  return user;
}

// ─── GET /api/admin/content/pending-media ────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const canView = await userHasPermission(user.id, "media.moderate");
    if (!canView) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") ?? "profiles";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    // ── Onglet 1 : Utilisateurs individuels (sans companyProfile) ───────────
    if (tab === "profiles") {
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: { companyProfile: null },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            createdAt: true,
            level: true,
            profil: {
              select: {
                pseudo: true,
                profilePhotoUrl: true,
                gender: true,
                birthdate: true,
              },
            },
          },
        }),
        prisma.user.count({ where: { companyProfile: null } }),
      ]);

      const data = users.map((u) => ({
        id: u.id,
        nom: u.nom,
        prenom: u.prenom,
        email: u.email,
        createdAt: u.createdAt,
        level: u.level,
        pseudo: u.profil?.pseudo ?? null,
        profilePhotoUrl: u.profil?.profilePhotoUrl ?? null,
        gender: u.profil?.gender ?? null,
        birthdate: u.profil?.birthdate ?? null,
      }));

      return NextResponse.json({ data, total, page, limit });
    }

    // ── Onglet 2 : Entreprises (avec companyProfile) ─────────────────────────
    if (tab === "companies") {
      const [companies, total] = await Promise.all([
        prisma.user.findMany({
          where: { companyProfile: { isNot: null } },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            createdAt: true,
            companyProfile: {
              select: {
                companyName: true,
                legalEmail: true,
                country: true,
                registrationType: true,
                legalRepresentative: true,
                registrationDocumentUrl: true,
                logoUrl: true,
                status: true,
                isLegalDetailsCompleted: true,
                isDocumentsCompleted: true,
              },
            },
          },
        }),
        prisma.user.count({ where: { companyProfile: { isNot: null } } }),
      ]);

      const data = companies.map((c) => ({
        id: c.id,
        email: c.email,
        createdAt: c.createdAt,
        companyName: c.companyProfile?.companyName ?? c.nom,
        legalEmail: c.companyProfile?.legalEmail ?? c.email,
        country: c.companyProfile?.country ?? null,
        registrationType: c.companyProfile?.registrationType ?? null,
        legalRepresentative: c.companyProfile?.legalRepresentative ?? null,
        registrationDocumentUrl:
          c.companyProfile?.registrationDocumentUrl ?? null,
        logoUrl: c.companyProfile?.logoUrl ?? null,
        status: c.companyProfile?.status ?? "PENDING",
        isLegalDetailsCompleted:
          c.companyProfile?.isLegalDetailsCompleted ?? false,
        isDocumentsCompleted: c.companyProfile?.isDocumentsCompleted ?? false,
      }));

      return NextResponse.json({ data, total, page, limit });
    }

    return NextResponse.json({ error: "Tab invalide" }, { status: 400 });
  } catch (error) {
    console.error("Erreur API /admin/content/pending-media:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}