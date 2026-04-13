// src/app/api/posts/[id]/view/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { trackEvent } from "@/lib/behavioral-tracking"; // ✨

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

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
    }

    if (post.authorId === user.id) {
      return NextResponse.json({ success: true, selfView: true });
    }

    await prisma.postView.upsert({
      where: { postId_viewerId: { postId, viewerId: user.id } },
      update: {},
      create: { postId, viewerId: user.id },
    });

    // ✨ Tracking comportemental — non-bloquant
    trackEvent({
      userId: user.id,
      eventType: "post_view",
      targetId: postId,
      targetType: "post",
      postId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur POST /api/posts/[id]/view:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
