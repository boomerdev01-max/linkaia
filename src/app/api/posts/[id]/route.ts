// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { deleteAllPostMedia } from "@/lib/supabase/post-media-storage";

/**
 * DELETE /api/posts/[id]
 * Supprime un post (seulement par l'auteur)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }, // ← correction ici
) {
  try {
    const { id } = await params; // ← await + destructuring OBLIGATOIRE

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

    const post = await prisma.post.findUnique({
      where: { id }, // ← utilise id (awaité)
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post non trouvé" },
        { status: 404 },
      );
    }

    if (post.authorId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 403 },
      );
    }

    try {
      await deleteAllPostMedia(user.id, post.id);
    } catch (error) {
      console.error("❌ Error deleting post media:", error);
      // Continue même si échec
    }

    await prisma.post.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Post supprimé avec succès",
    });
  } catch (error) {
    console.error("❌ Error deleting post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete post" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/posts/[id]
 * Modifie le contenu texte d'un post (seulement par l'auteur)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }, // ← correction ici
) {
  try {
    const { id } = await params; // ← await obligatoire

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

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post non trouvé" },
        { status: 404 },
      );
    }

    if (post.authorId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { content, visibility } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Le contenu ne peut pas être vide" },
        { status: 400 },
      );
    }

    const updateData: any = {
      content,
      editedAt: new Date(),
    };

    if (visibility) {
      updateData.visibility = visibility;
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: updateData,
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
        media: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Post modifié avec succès",
      data: updatedPost,
    });
  } catch (error) {
    console.error("❌ Error updating post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update post" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/posts/[id]
 * Récupère un post spécifique par son ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }, // ← correction ici aussi !
) {
  try {
    const { id } = await params; // ← await ici

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

    const post = await prisma.post.findUnique({
      where: { id },
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
        media: {
          orderBy: { order: "asc" },
        },
        reactions: {
          include: {
            type: true,
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
        comments: {
          where: { parentId: null },
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
            reactions: {
              include: {
                type: true,
              },
            },
            replies: {
              select: {
                id: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post non trouvé" },
        { status: 404 },
      );
    }

    // Vérifier visibilité (le reste reste inchangé)
    if (post.visibility === "private" && post.authorId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 403 },
      );
    }

    if (post.visibility === "friends" && post.authorId !== user.id) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            {
              initiatorId: user.id,
              receiverId: post.authorId,
              status: "accepted",
            },
            {
              initiatorId: post.authorId,
              receiverId: user.id,
              status: "accepted",
            },
          ],
        },
      });

      if (!friendship) {
        return NextResponse.json(
          { success: false, error: "Non autorisé" },
          { status: 403 },
        );
      }
    }

    const userReaction = post.reactions.find((r) => r.userId === user.id);

    const enrichedPost = {
      ...post,
      userReaction: userReaction
        ? {
            id: userReaction.id,
            type: userReaction.type,
          }
        : null,
      reactionCounts: post.reactions.reduce(
        (acc, r) => {
          acc[r.type.code] = (acc[r.type.code] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };

    return NextResponse.json({
      success: true,
      data: enrichedPost,
    });
  } catch (error) {
    console.error("❌ Error fetching post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch post" },
      { status: 500 },
    );
  }
}
