// app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateVerificationCode, sendVerificationEmail } from "@/lib/email";
import {
  createSupabaseAuthUser,
  deleteSupabaseAuthUser,
} from "@/lib/supabase/admin-client";

const signupSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
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
  try {
    const body = await request.json();
    const validatedData = signupSchema.parse(body);

    // 1️⃣ Vérifier si l'email existe déjà dans Prisma
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

    let supabaseUserId: string;

    try {
      // 3️⃣ CRÉER L'UTILISATEUR DANS SUPABASE AUTH
      const supabaseUser = await createSupabaseAuthUser(
        validatedData.email,
        validatedData.password,
        {
          nom: validatedData.nom,
          prenom: validatedData.prenom,
        },
        false,
      );

      supabaseUserId = supabaseUser.id;
      console.log(`✅ Supabase user created: ${supabaseUserId}`);
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

      // ✨ RÉCUPÉRER LE RÔLE standard_user
      const standardUserRole = await prisma.role.findUnique({
        where: { name: "standard_user" },
      });

      if (!standardUserRole) {
        throw new Error("Rôle standard_user introuvable - problème de seed");
      }

      // 5️⃣ CRÉER L'UTILISATEUR DANS PRISMA
      const user = await prisma.user.create({
        data: {
          nom: validatedData.nom,
          prenom: validatedData.prenom,
          email: validatedData.email,
          password: hashedPassword,
          supabaseId: supabaseUserId,
          verificationCode,
          verificationCodeExpiry,
          provider: "email",
          emailVerified: false,
        },
      });

      console.log(`✅ Prisma user created: ${user.id}`);

      // 5️⃣' ATTRIBUER LE PLAN FREE PAR DÉFAUT
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

        console.log(`✅ FREE plan assigned to user: ${user.id}`);
      }

      // ✨ 6️⃣ ATTRIBUER LE RÔLE standard_user
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: standardUserRole.id,
        },
      });

      console.log(`✅ Role standard_user assigned to user: ${user.id}`);

      // 7️⃣ ENVOYER L'EMAIL DE VÉRIFICATION
      await sendVerificationEmail(user.email, verificationCode, user.prenom);

      return NextResponse.json({
        success: true,
        message: "Compte créé avec succès. Vérifiez votre email.",
        email: user.email,
      });
    } catch (prismaError) {
      // ⚠️ ROLLBACK : Si Prisma échoue, on supprime l'utilisateur Supabase
      console.error(
        "❌ Prisma user creation failed, rolling back Supabase user:",
        prismaError,
      );

      try {
        await deleteSupabaseAuthUser(supabaseUserId);
        console.log(`✅ Supabase user ${supabaseUserId} deleted (rollback)`);
      } catch (deleteError) {
        console.error(
          "❌ Failed to delete Supabase user during rollback:",
          deleteError,
        );
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

    console.error("❌ Signup error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription" },
      { status: 500 },
    );
  }
}
