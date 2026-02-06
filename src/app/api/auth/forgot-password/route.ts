import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateVerificationCode, sendPasswordResetEmail } from "@/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Pour la sécurité, on retourne toujours un succès même si l'email n'existe pas
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Si cet email existe, un code de réinitialisation a été envoyé",
      });
    }

    // Générer un code de réinitialisation
    const resetCode = generateVerificationCode();
    const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordCode: resetCode,
        resetPasswordCodeExpiry: resetCodeExpiry,
      },
    });

    await sendPasswordResetEmail(user.email, resetCode, user.prenom);

    return NextResponse.json({
      success: true,
      message: "Code de réinitialisation envoyé",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}