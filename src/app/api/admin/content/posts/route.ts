// src/app/api/admin/content/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { userHasPermission } from "@/lib/rbac";

// ─── Auth helper ─────────────────────────────────────────────────────────────
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

// ─── GET /api/admin/content/posts ────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const canView = await userHasPermission(user.id, "post.moderate");
    if (!canView) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const search = searchParams.get("search") ?? "";
    const visibility = searchParams.get("visibility") ?? "all";
    const categoryId = searchParams.get("categoryId") ?? "all";
    const flagged = searchParams.get("flagged") === "true";
    const skip = (page - 1) * limit;

    // ── Build where clause ───────────────────────────────────────────────────
    const where: Record<string, any> = {};

    if (visibility !== "all") {
      where.visibility = visibility;
    }

    if (categoryId !== "all") {
      where.categoryId = categoryId;
    }

    if (search.trim()) {
      where.OR = [
        { content: { contains: search, mode: "insensitive" } },
        { author: { nom: { contains: search, mode: "insensitive" } } },
        { author: { prenom: { contains: search, mode: "insensitive" } } },
        { author: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    // If flagged=true: only posts that have at least one report
    if (flagged) {
      where.author = {
        ...where.author,
        reportsReceived: { some: {} },
      };
    }

    const [posts, total, categories] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          visibility: true,
          createdAt: true,
          editedAt: true,
          author: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              profil: {
                select: {
                  pseudo: true,
                  profilePhotoUrl: true,
                },
              },
            },
          },
          category: {
            select: {
              id: true,
              label: true,
              emoji: true,
              code: true,
            },
          },
          tags: {
            select: {
              tag: { select: { name: true } },
            },
          },
          media: {
            select: {
              id: true,
              type: true,
              url: true,
            },
            orderBy: { order: "asc" },
            take: 4,
          },
          _count: {
            select: {
              reactions: true,
              comments: true,
              views: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
      prisma.postCategory.findMany({
        where: { isActive: true },
        select: { id: true, label: true, emoji: true, code: true },
        orderBy: { order: "asc" },
      }),
    ]);

    const data = posts.map((p) => ({
      id: p.id,
      content: p.content,
      visibility: p.visibility,
      createdAt: p.createdAt,
      editedAt: p.editedAt,
      author: {
        id: p.author.id,
        nom: p.author.nom,
        prenom: p.author.prenom,
        email: p.author.email,
        pseudo: p.author.profil?.pseudo ?? null,
        photo: p.author.profil?.profilePhotoUrl ?? null,
      },
      category: p.category ?? null,
      tags: p.tags.map((t) => t.tag.name),
      media: p.media,
      reactionsCount: p._count.reactions,
      commentsCount: p._count.comments,
      viewsCount: p._count.views,
    }));

    return NextResponse.json({ data, total, page, limit, categories });
  } catch (error) {
    console.error("Erreur API /admin/content/posts GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── PATCH /api/admin/content/posts  (moderate a single post) ────────────────
// Body: { postId: string, action: "approve" | "hide" | "flag" | "delete" }
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const canModerate = await userHasPermission(user.id, "post.moderate");
    if (!canModerate) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { postId, action } = body as {
      postId: string;
      action: "approve" | "hide" | "flag" | "delete";
    };

    if (!postId || !action) {
      return NextResponse.json(
        { error: "postId et action sont requis" },
        { status: 400 },
      );
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
    }

    if (action === "delete") {
      await prisma.post.delete({ where: { id: postId } });
      return NextResponse.json({ success: true, action: "deleted" });
    }

    if (action === "hide") {
      await prisma.post.update({
        where: { id: postId },
        data: { visibility: "private" },
      });
      return NextResponse.json({ success: true, action: "hidden" });
    }

    if (action === "approve") {
      // "approve" → make the post public if it wasn't already
      await prisma.post.update({
        where: { id: postId },
        data: { visibility: "public" },
      });
      return NextResponse.json({ success: true, action: "approved" });
    }

    if (action === "flag") {
      // "flag" → create a system report for admin review
      // We use the first available report category (or fall back gracefully)
      const category = await prisma.reportCategory.findFirst({
        orderBy: { order: "asc" },
      });

      if (category) {
        await prisma.report.create({
          data: {
            reporterId: user.id,
            reportedUserId: post.authorId,
            categoryId: category.id,
            reason: "Signalé manuellement par un administrateur pour examen.",
            status: "pending",
          },
        });
      }

      return NextResponse.json({ success: true, action: "flagged" });
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  } catch (error) {
    console.error("Erreur API /admin/content/posts PATCH:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
