// src/app/api/posts/[id]/view/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

/**
 * POST /api/posts/[id]/view
 * Enregistre une impression (vue) sur un post.
 * Une seule vue unique par utilisateur par post (upsert).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: postId } = await params;

    const { user, error } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error }, { status: 401 });
    }

    // Vérifier que le post existe
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
    }

    // Ne pas compter les vues de l'auteur sur ses propres posts
    if (post.authorId === user.id) {
      return NextResponse.json({ success: true, selfView: true });
    }

    // Upsert : crée ou ignore si déjà vu
    await prisma.postView.upsert({
      where: {
        postId_viewerId: {
          postId,
          viewerId: user.id,
        },
      },
      update: {}, // Ne rien mettre à jour — on garde la première vue
      create: {
        postId,
        viewerId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur POST /api/posts/[id]/view:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
