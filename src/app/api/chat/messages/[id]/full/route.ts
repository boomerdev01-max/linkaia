// app/api/chat/messages/[id]/full/route.ts
// Fetcher un message unique complet (pour le Realtime)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { decryptMessage } from "@/lib/encryption";
import type { Message } from "@/types/chat";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: messageId } = await params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouve" },
        { status: 404 },
      );
    }

    const msg = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
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
        media: true,
        reactions: {
          include: {
            user: {
              select: { id: true, nom: true, prenom: true },
            },
          },
        },
        replyTo: {
          include: {
            sender: {
              select: { id: true, nom: true, prenom: true },
            },
          },
        },
        readReceipts: {
          select: { userId: true, readAt: true },
        },
      },
    });

    if (!msg) {
      return NextResponse.json(
        { error: "Message non trouve" },
        { status: 404 },
      );
    }

    // Vérifier que l'utilisateur est bien participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: msg.conversationId,
        userId: user.id,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    // Décryptage
    let content: string | null = null;
    if (msg.contentEncrypted && msg.contentIv && !msg.isDeleted) {
      try {
        content = decryptMessage({
          encrypted: msg.contentEncrypted,
          iv: msg.contentIv,
        });
      } catch {
        content = "[Erreur de déchiffrement]";
      }
    }

    const fullMessage: Message = {
      id: msg.id,
      conversationId: msg.conversationId,
      content: msg.isDeleted ? null : content,
      type: msg.type as Message["type"],
      isEdited: msg.isEdited,
      isDeleted: msg.isDeleted,
      isPinned: msg.isPinned,
      sendStatus: "sent",
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
      sender: {
        id: msg.sender.id,
        nom: msg.sender.nom,
        prenom: msg.sender.prenom,
        pseudo: msg.sender.profil?.pseudo || null,
        profilePhotoUrl: msg.sender.profil?.profilePhotoUrl || null,
      },
      media: msg.media.map((m) => ({
        id: m.id,
        type: m.type as any,
        url: m.url,
        filename: m.filename || "",
        size: m.size || 0,
        mimeType: m.mimeType || "",
        width: m.width,
        height: m.height,
        duration: m.duration,
        thumbnailUrl: m.thumbnailUrl,
      })),
      reactions: msg.reactions.map((r) => ({
        id: r.id,
        emoji: r.emoji,
        userId: r.userId,
        user: { id: r.user.id, nom: r.user.nom, prenom: r.user.prenom },
        createdAt: r.createdAt.toISOString(),
      })),
      replyTo: msg.replyTo
        ? {
            id: msg.replyTo.id,
            conversationId: msg.replyTo.conversationId,
            content:
              msg.replyTo.contentEncrypted && msg.replyTo.contentIv
                ? (() => {
                    try {
                      return decryptMessage({
                        encrypted: msg.replyTo!.contentEncrypted!,
                        iv: msg.replyTo!.contentIv!,
                      });
                    } catch {
                      return "[Message]";
                    }
                  })()
                : null,
            type: msg.replyTo.type as any,
            isEdited: msg.replyTo.isEdited,
            isDeleted: msg.replyTo.isDeleted,
            isPinned: msg.replyTo.isPinned,
            createdAt: msg.replyTo.createdAt.toISOString(),
            updatedAt: msg.replyTo.updatedAt.toISOString(),
            sender: {
              id: msg.replyTo.sender.id,
              nom: msg.replyTo.sender.nom,
              prenom: msg.replyTo.sender.prenom,
            },
            media: [],
            reactions: [],
          }
        : null,
      readBy: msg.readReceipts.map((r) => ({
        id: r.userId,
        readAt: r.readAt.toISOString(),
      })),
    };

    return NextResponse.json(fullMessage);
  } catch (error) {
    console.error("Error fetching single message:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
