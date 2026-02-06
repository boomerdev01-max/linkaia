// app/api/auth/resend-code/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateVerificationCode, sendVerificationEmail } from "@/lib/email";

const resendSchema = z.object({
  email: z.string().email("Email invalide"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = resendSchema.parse(body);

    // 1️⃣ TROUVER L'UTILISATEUR
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // 2️⃣ VÉRIFIER SI DÉJÀ VÉRIFIÉ
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email déjà vérifié" },
        { status: 400 }
      );
    }

    // 3️⃣ GÉNÉRER UN NOUVEAU CODE
    const verificationCode = generateVerificationCode();
    const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // 4️⃣ METTRE À JOUR LE CODE
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationCodeExpiry,
      },
    });

    // 5️⃣ RENVOYER L'EMAIL
    await sendVerificationEmail(user.email, verificationCode, user.prenom);

    console.log(`✅ Verification code resent to: ${email}`);

    return NextResponse.json({
      success: true,
      message: "Code renvoyé avec succès",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("❌ Resend code error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
