// app/api/comments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/comments/[id]
 * Supprime un commentaire (seulement par l'auteur)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }, // ← CHANGEMENT ICI
) {
  try {
    const { id } = await params; // ← OBLIGATOIRE : await + destructuring

    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Vérifier que le commentaire existe et appartient à l'utilisateur
    const comment = await prisma.comment.findUnique({
      where: { id }, // ← on utilise la variable id awaitée
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: "Commentaire non trouvé" },
        { status: 404 },
      );
    }

    if (comment.authorId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 403 },
      );
    }

    await prisma.comment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Commentaire supprimé avec succès",
    });
  } catch (error) {
    console.error("❌ Error deleting comment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete comment" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/comments/[id]
 * Modifie le contenu d'un commentaire (seulement par l'auteur)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }, // ← CHANGEMENT ICI
) {
  try {
    const { id } = await params; // ← OBLIGATOIRE

    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: "Commentaire non trouvé" },
        { status: 404 },
      );
    }

    if (comment.authorId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Le contenu ne peut pas être vide" },
        { status: 400 },
      );
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        content,
        editedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            profil: {
              select: {
                pseudo: true,
                profilePhotoUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            reactions: true,
            replies: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Commentaire modifié avec succès",
      data: updatedComment,
    });
  } catch (error) {
    console.error("❌ Error updating comment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update comment" },
      { status: 500 },
    );
  }
}
