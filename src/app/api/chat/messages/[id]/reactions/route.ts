// app/api/chat/messages/[id]/reactions/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { MESSAGE_REACTIONS } from '@/types/chat';

// POST - Add reaction to message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params;
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
    
    const body = await request.json();
    const { emoji } = body as { emoji: string };
    
    // Validate emoji
    const validEmoji = MESSAGE_REACTIONS.find(r => r.emoji === emoji);
    if (!validEmoji) {
      return NextResponse.json(
        { error: 'Emoji non autorise' },
        { status: 400 }
      );
    }
    
    // Get message and check access
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: true,
          },
        },
      },
    });
    
    if (!message) {
      return NextResponse.json({ error: 'Message non trouve' }, { status: 404 });
    }
    
    const isParticipant = message.conversation.participants.some(
      p => p.userId === user.id
    );
    
    if (!isParticipant) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }
    
    // Check if reaction already exists
    const existingReaction = await prisma.messageReaction.findFirst({
      where: {
        messageId,
        userId: user.id,
        emoji,
      },
    });
    
    if (existingReaction) {
      // Remove reaction (toggle off)
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id },
      });
      
      return NextResponse.json({ action: 'removed' });
    }
    
    // Add new reaction
    const reaction = await prisma.messageReaction.create({
      data: {
        messageId,
        userId: user.id,
        emoji,
      },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });
    
    return NextResponse.json({
      action: 'added',
      reaction: {
        id: reaction.id,
        emoji: reaction.emoji,
        userId: reaction.userId,
        user: reaction.user,
        createdAt: reaction.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error toggling reaction:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
