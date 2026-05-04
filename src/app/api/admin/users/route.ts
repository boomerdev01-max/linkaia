import { NextRequest, NextResponse } from "next/server";
import { notifyAdminNewAdminUser } from "@/lib/admin-notification-helpers";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { getUserPrimaryRole, userHasPermission } from "@/lib/rbac";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAuthUser } from "@/lib/supabase/admin-client";
import { generateSecurePassword, sendAdminCreatedUserEmail } from "@/lib/email";

// ============================================================
// GET — Liste paginée des utilisateurs
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (!user || error) {
      return NextResponse.json(
        { error: error || "Non authentifié" },
        { status: 401 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const levelFilter = searchParams.get("level") || "";
    const typeFilter = searchParams.get("type") || ""; // "individual" | "company"
    const skip = (page - 1) * limit;

    const whereConditions: any = { AND: [] };

    if (search) {
      whereConditions.AND.push({
        OR: [
          { nom: { contains: search, mode: "insensitive" } },
          { prenom: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (levelFilter) {
      whereConditions.AND.push({ level: levelFilter });
    }

    // Filtre par type : on déduit COMPANY/INDIVIDUAL via la relation companyProfile
    if (typeFilter === "COMPANY") {
      whereConditions.AND.push({ companyProfile: { isNot: null } });
    } else if (typeFilter === "INDIVIDUAL") {
      whereConditions.AND.push({ companyProfile: null });
    }

    if (whereConditions.AND.length === 0) delete whereConditions.AND;

    const total = await prisma.user.count({ where: whereConditions });

    const users = await prisma.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        emailVerified: true,
        level: true,
        createdAt: true,
        companyProfile: { select: { id: true } }, // Pour déduire le type
        profil: { select: { profilePhotoUrl: true } },
        roles: { include: { role: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const usersWithRole = await Promise.all(
      users.map(async (u) => {
        const primaryRole = await getUserPrimaryRole(u.id);
        return {
          id: u.id,
          nom: u.nom,
          prenom: u.prenom,
          email: u.email,
          emailVerified: u.emailVerified,
          level: u.level,
          userType: u.companyProfile ? "COMPANY" : "INDIVIDUAL", // ← déduit
          profilePhotoUrl: u.profil?.profilePhotoUrl ?? null,
          primaryRole,
          createdAt: u.createdAt,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      users: usersWithRole,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("❌ GET /api/admin/users:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 },
    );
  }
}

// ============================================================
// POST — Création d'un utilisateur par l'admin
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const { user: adminUser, error } = await getAuthenticatedUser();
    if (!adminUser || error) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const canCreate = await userHasPermission(adminUser.id, "user.create");
    if (!canCreate) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { nom, prenom, email, roleId } = body as {
      nom: string;
      prenom: string;
      email: string;
      roleId: string;
    };

    if (!nom?.trim() || !prenom?.trim() || !email?.trim() || !roleId) {
      return NextResponse.json(
        { error: "Les champs nom, prénom, email et rôle sont requis." },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Adresse email invalide." },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà." },
        { status: 409 },
      );
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return NextResponse.json({ error: "Rôle introuvable." }, { status: 400 });
    }

    const ADMIN_ASSIGNABLE = [
      "administrator",
      "moderator",
      "accountant",
      "assistant",
    ];
    if (!ADMIN_ASSIGNABLE.includes(role.name)) {
      return NextResponse.json(
        { error: "Ce rôle ne peut pas être assigné via ce formulaire." },
        { status: 400 },
      );
    }

    const plainPassword = generateSecurePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const supabaseUser = await createSupabaseAuthUser(
      email.trim().toLowerCase(),
      plainPassword,
      { nom: nom.trim(), prenom: prenom.trim() },
      true,
    );

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    await supabaseAdmin.auth.admin.updateUserById(supabaseUser.id, {
      app_metadata: { primary_role: role.name },
    });

    const newUser = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          nom: nom.trim(),
          prenom: prenom.trim(),
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          supabaseId: supabaseUser.id,
          provider: "email",
          emailVerified: true,
          adminCreated: true,
          isFirstLogin: true,
          mustChangePassword: true,
          level: "FREE",
          isProfileCompleted: false,
          skipProfileSetup: true,
          isPreferenceCompleted: false,
          skipPreferenceSetup: true,
        },
      });

      await tx.userRole.create({
        data: { userId: created.id, roleId: role.id },
      });

      return created;
    });

    await notifyAdminNewAdminUser(newUser.id, adminUser.id).catch(
      console.error,
    );
    await sendAdminCreatedUserEmail(
      email.trim().toLowerCase(),
      plainPassword,
      nom.trim(),
      prenom.trim(),
      role.name,
    );

    return NextResponse.json({
      success: true,
      message: `Compte créé et email envoyé à ${email}.`,
      user: {
        id: newUser.id,
        nom: newUser.nom,
        prenom: newUser.prenom,
        email: newUser.email,
        role: role.name,
      },
    });
  } catch (error: any) {
    console.error("❌ POST /api/admin/users:", error);

    if (error?.message?.includes("User already registered")) {
      return NextResponse.json(
        {
          error:
            "Un compte avec cet email existe déjà dans le système d'authentification.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la création du compte." },
      { status: 500 },
    );
  }
}