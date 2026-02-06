// app/api/chat/start/route.ts
// Start or get existing direct conversation between two users
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

export async function POST(request: Request) {
  try {
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
    const { targetUserId } = body as { targetUserId: string };
    
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'ID utilisateur cible requis' },
        { status: 400 }
      );
    }
    
    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: 'Impossible de demarrer une conversation avec soi-meme' },
        { status: 400 }
      );
    }
    
    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
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
    });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Utilisateur cible non trouve' },
        { status: 404 }
      );
    }
    
    // Check if direct conversation already exists between these users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        type: 'direct',
        AND: [
          {
            participants: {
              some: { userId: user.id },
            },
          },
          {
            participants: {
              some: { userId: targetUserId },
            },
          },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
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
          },
        },
      },
    });
    
    if (existingConversation) {
      // Unarchive if archived
      await prisma.conversationParticipant.updateMany({
        where: {
          conversationId: existingConversation.id,
          userId: user.id,
        },
        data: { isArchived: false },
      });
      
      return NextResponse.json({
        conversation: existingConversation,
        isNew: false,
      });
    }
    
    // Create new direct conversation
    const newConversation = await prisma.conversation.create({
      data: {
        type: 'direct',
        createdById: user.id,
        participants: {
          create: [
            { userId: user.id, role: 'member' },
            { userId: targetUserId, role: 'member' },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
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
          },
        },
      },
    });
    
    return NextResponse.json({
      conversation: newConversation,
      isNew: true,
    }, { status: 201 });
  } catch (error) {
    console.error('Error starting conversation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
