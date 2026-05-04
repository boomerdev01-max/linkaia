import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateVerificationCode, sendVerificationEmail } from "@/lib/email";
import {
  createSupabaseAuthUser,
  deleteSupabaseAuthUser,
} from "@/lib/supabase/admin-client";

const companySignupSchema = z.object({
  companyName: z
    .string()
    .min(2, "Le nom de l'entreprise doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins 1 majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins 1 minuscule")
    .regex(/\d/, "Le mot de passe doit contenir au moins 1 chiffre")
    .regex(
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      "Le mot de passe doit contenir au moins 1 symbole",
    ),
});

export async function POST(request: Request) {
  let supabaseUserId: string | null = null;
  let prismaUserId: string | null = null;

  try {
    const body = await request.json();
    const validatedData = companySignupSchema.parse(body);

    // 1️⃣ Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 },
      );
    }

    // 2️⃣ Générer le code de vérification
    const verificationCode = generateVerificationCode();
    const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

    try {
      // 3️⃣ CRÉER L'UTILISATEUR DANS SUPABASE AUTH
      const supabaseUser = await createSupabaseAuthUser(
        validatedData.email,
        validatedData.password,
        {
          nom: validatedData.companyName,
          prenom: "Company",
        },
        false,
      );

      supabaseUserId = supabaseUser.id;
      console.log(`✅ Supabase company user created: ${supabaseUserId}`);
    } catch (supabaseError) {
      console.error("❌ Supabase user creation failed:", supabaseError);
      return NextResponse.json(
        { error: "Erreur lors de la création du compte Supabase" },
        { status: 500 },
      );
    }

    try {
      // 4️⃣ HASHER LE PASSWORD POUR PRISMA
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // 5️⃣ RÉCUPÉRER LE RÔLE company_user
      const companyUserRole = await prisma.role.findUnique({
        where: { name: "company_user" },
      });

      if (!companyUserRole) {
        throw new Error("Rôle company_user introuvable - problème de seed");
      }

      // 6️⃣ CRÉER L'UTILISATEUR DANS PRISMA (TYPE COMPANY)
      const user = await prisma.user.create({
        data: {
          nom: validatedData.companyName,
          prenom: "Company",
          email: validatedData.email,
          password: hashedPassword,
          supabaseId: supabaseUserId,
          verificationCode,
          verificationCodeExpiry,
          provider: "email",
          emailVerified: false,
        },
      });

      prismaUserId = user.id;
      console.log(`✅ Prisma company user created: ${user.id}`);

      // 7️⃣ CRÉER LE PROFIL ENTREPRISE
      await prisma.companyProfile.create({
        data: {
          userId: user.id,
          companyName: validatedData.companyName,
          legalEmail: validatedData.email,
        },
      });

      console.log(`✅ Company profile created for user: ${user.id}`);

      // 8️⃣ ATTRIBUER LE PLAN FREE PAR DÉFAUT
      const freePlan = await prisma.subscriptionType.findUnique({
        where: { code: "FREE" },
      });

      if (freePlan) {
        await prisma.userSubscription.create({
          data: {
            userId: user.id,
            subscriptionTypeId: freePlan.id,
            status: "active",
            autoRenew: false,
          },
        });

        await prisma.subscriptionHistory.create({
          data: {
            userId: user.id,
            subscriptionTypeId: freePlan.id,
            startDate: new Date(),
            action: "subscribed",
            pricePaid: 0,
            currencyCode: "XOF",
          },
        });

        console.log(`✅ FREE plan assigned to company user: ${user.id}`);
      }

      // 9️⃣ ATTRIBUER LE RÔLE company_user
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: companyUserRole.id,
        },
      });

      console.log(`✅ Role company_user assigned to user: ${user.id}`);

      // 🔟 ENVOYER L'EMAIL DE VÉRIFICATION (NON-BLOQUANT)
      // ✅ On tente d'envoyer l'email, mais on ne bloque pas l'inscription si ça échoue
      try {
        await sendVerificationEmail(
          user.email,
          verificationCode,
          validatedData.companyName,
        );
        console.log(`✅ Verification email sent to: ${user.email}`);
      } catch (emailError) {
        // ⚠️ Log l'erreur mais ne pas faire échouer l'inscription
        console.error(
          "⚠️ Failed to send verification email (non-blocking):",
          emailError,
        );
        // On pourrait enregistrer dans une queue pour retry plus tard
      }

      return NextResponse.json({
        success: true,
        message: "Compte entreprise créé avec succès. Vérifiez votre email.",
        email: user.email,
      });
    } catch (prismaError) {
      // ⚠️ ROLLBACK COMPLET : Supprimer à la fois Supabase ET Prisma
      console.error(
        "❌ Prisma company user creation failed, rolling back:",
        prismaError,
      );

      // Rollback Supabase
      if (supabaseUserId) {
        try {
          await deleteSupabaseAuthUser(supabaseUserId);
          console.log(`✅ Supabase user ${supabaseUserId} deleted (rollback)`);
        } catch (deleteError) {
          console.error(
            "❌ Failed to delete Supabase user during rollback:",
            deleteError,
          );
        }
      }

      // Rollback Prisma (supprimer user + cascade)
      if (prismaUserId) {
        try {
          await prisma.user.delete({
            where: { id: prismaUserId },
          });
          console.log(`✅ Prisma user ${prismaUserId} deleted (rollback)`);
        } catch (deletePrismaError) {
          console.error(
            "❌ Failed to delete Prisma user during rollback:",
            deletePrismaError,
          );
        }
      }

      throw prismaError;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }

    console.error("❌ Company signup error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription" },
      { status: 500 },
    );
  }
}
