// app/api/chat/conversations/[id]/messages/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { encryptMessage, decryptMessage } from '@/lib/encryption';
import type { Message } from '@/types/chat';

// GET - Fetch messages for a conversation with pagination
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    
    if (!supabaseUser) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: { id: true },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }
    
    // Verify user is participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id,
      },
    });
    
    if (!participant) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    
    // Fetch messages with pagination
    const messages = await prisma.message.findMany({
      where: { conversationId },
      take: limit + 1, // Get one extra to check if there are more
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
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
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
        readReceipts: {
          select: {
            userId: true,
            readAt: true,
          },
        },
      },
    });
    
    const hasMore = messages.length > limit;
    const messagesData = hasMore ? messages.slice(0, -1) : messages;
    
    // Decrypt messages and format response
    const decryptedMessages: Message[] = messagesData.map(msg => {
      let content: string | null = null;
      
      if (msg.contentEncrypted && msg.contentIv && !msg.isDeleted) {
        try {
          content = decryptMessage({
            encrypted: msg.contentEncrypted,
            iv: msg.contentIv,
          });
        } catch {
          content = '[Erreur de dechiffrement]';
        }
      }
      
      return {
        id: msg.id,
        conversationId: msg.conversationId,
        content: msg.isDeleted ? null : content,
        type: msg.type as Message['type'],
        isEdited: msg.isEdited,
        isDeleted: msg.isDeleted,
        isPinned: msg.isPinned,
        createdAt: msg.createdAt.toISOString(),
        updatedAt: msg.updatedAt.toISOString(),
        sender: {
          id: msg.sender.id,
          nom: msg.sender.nom,
          prenom: msg.sender.prenom,
          pseudo: msg.sender.profil?.pseudo || null,
          profilePhotoUrl: msg.sender.profil?.profilePhotoUrl || null,
        },
        media: msg.media.map(m => ({
          id: m.id,
          type: m.type as any,
          url: m.url,
          filename: m.filename || '',
          size: m.size || 0,
          mimeType: m.mimeType || '',
          width: m.width,
          height: m.height,
          duration: m.duration,
          thumbnailUrl: m.thumbnailUrl,
        })),
        reactions: msg.reactions.map(r => ({
          id: r.id,
          emoji: r.emoji,
          userId: r.userId,
          user: {
            id: r.user.id,
            nom: r.user.nom,
            prenom: r.user.prenom,
          },
          createdAt: r.createdAt.toISOString(),
        })),
        replyTo: msg.replyTo ? {
          id: msg.replyTo.id,
          conversationId: msg.replyTo.conversationId,
          content: msg.replyTo.contentEncrypted && msg.replyTo.contentIv
            ? (() => {
                try {
                  return decryptMessage({
                    encrypted: msg.replyTo.contentEncrypted,
                    iv: msg.replyTo.contentIv,
                  });
                } catch {
                  return '[Message]';
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
        } : null,
        readBy: msg.readReceipts.map(r => ({
          id: r.userId,
          readAt: r.readAt.toISOString(),
        })),
      };
    });
    
    // Update last read
    await prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: new Date() },
    });
    
    return NextResponse.json({
      messages: decryptedMessages.reverse(), // Return in chronological order
      nextCursor: hasMore ? messagesData[messagesData.length - 1].id : null,
      hasMore,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Send a new message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    
    if (!supabaseUser) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: { id: true },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }
    
    // Verify user is participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id,
      },
    });
    
    if (!participant) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }
    
    const body = await request.json();
    const { content, type, replyToId, media } = body as {
      content?: string;
      type: 'TEXT' | 'MEDIA' | 'VOICE' | 'MIXED';
      replyToId?: string;
      media?: {
        type: string;
        url: string;
        filename: string;
        size: number;
        mimeType: string;
        width?: number;
        height?: number;
        duration?: number;
        thumbnailUrl?: string;
      }[];
    };
    
    // Validate
    if (!content && (!media || media.length === 0)) {
      return NextResponse.json(
        { error: 'Contenu ou media requis' },
        { status: 400 }
      );
    }
    
    // Encrypt content if present
    let encrypted: { encrypted: string; iv: string } | null = null;
    if (content) {
      encrypted = encryptMessage(content);
    }
    
    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        contentEncrypted: encrypted?.encrypted || null,
        contentIv: encrypted?.iv || null,
        type,
        replyToId: replyToId || null,
        media: media ? {
          create: media.map(m => ({
            type: m.type,
            url: m.url,
            filename: m.filename,
            size: m.size,
            mimeType: m.mimeType,
            width: m.width,
            height: m.height,
            duration: m.duration,
            thumbnailUrl: m.thumbnailUrl,
          })),
        } : undefined,
      },
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
        reactions: true,
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
      },
    });
    
    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    
    // Update sender's last read
    await prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: new Date() },
    });
    
    // Format response
    const responseMessage: Message = {
      id: message.id,
      conversationId: message.conversationId,
      content: content || null,
      type: message.type as Message['type'],
      isEdited: message.isEdited,
      isDeleted: message.isDeleted,
      isPinned: message.isPinned,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      sender: {
        id: message.sender.id,
        nom: message.sender.nom,
        prenom: message.sender.prenom,
        pseudo: message.sender.profil?.pseudo || null,
        profilePhotoUrl: message.sender.profil?.profilePhotoUrl || null,
      },
      media: message.media.map(m => ({
        id: m.id,
        type: m.type as any,
        url: m.url,
        filename: m.filename || '',
        size: m.size || 0,
        mimeType: m.mimeType || '',
        width: m.width,
        height: m.height,
        duration: m.duration,
        thumbnailUrl: m.thumbnailUrl,
      })),
      reactions: [],
      replyTo: message.replyTo ? {
        id: message.replyTo.id,
        conversationId: message.replyTo.conversationId,
        content: null,
        type: message.replyTo.type as any,
        isEdited: message.replyTo.isEdited,
        isDeleted: message.replyTo.isDeleted,
        isPinned: message.replyTo.isPinned,
        createdAt: message.replyTo.createdAt.toISOString(),
        updatedAt: message.replyTo.updatedAt.toISOString(),
        sender: {
          id: message.replyTo.sender.id,
          nom: message.replyTo.sender.nom,
          prenom: message.replyTo.sender.prenom,
        },
        media: [],
        reactions: [],
      } : null,
    };
    
    return NextResponse.json(responseMessage, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
