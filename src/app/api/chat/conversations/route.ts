// app/api/chat/conversations/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import type { ConversationListItem } from '@/types/chat';
import { decryptMessage } from '@/lib/encryption';

// GET - Fetch user's conversations
export async function GET(request: Request) {
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
    
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // all | unread | groups | archived
    
    // Fetch conversations where user is a participant
    const participations = await prisma.conversationParticipant.findMany({
      where: {
        userId: user.id,
        isArchived: filter === 'archived' ? true : false,
      },
      include: {
        conversation: {
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
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
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
        },
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc',
        },
      },
    });
    
    // Filter by type if needed
    let filtered = participations;
    if (filter === 'groups') {
      filtered = participations.filter(p => p.conversation.type === 'group');
    }
    
    // Count unread messages for each conversation
    const conversations: ConversationListItem[] = await Promise.all(
      filtered.map(async (p) => {
        const conv = p.conversation;
        const lastMsg = conv.messages[0];
        
        // Count unread
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            createdAt: p.lastReadAt ? { gt: p.lastReadAt } : undefined,
            senderId: { not: user.id },
            isDeleted: false,
          },
        });
        
        // For direct conversations, get the other user
        let displayName = conv.name;
        let displayAvatar = conv.avatarUrl;
        
        if (conv.type === 'direct') {
          const otherParticipant = conv.participants.find(
            part => part.userId !== user.id
          );
          if (otherParticipant) {
            const otherUser = otherParticipant.user;
            displayName = otherUser.profil?.pseudo || 
              `${otherUser.prenom} ${otherUser.nom}`;
            displayAvatar = otherUser.profil?.profilePhotoUrl || null;
          }
        }
        
        // Decrypt last message content
        let lastMessageContent: string | null = null;
        if (lastMsg && lastMsg.contentEncrypted && lastMsg.contentIv) {
          try {
            lastMessageContent = decryptMessage({
              encrypted: lastMsg.contentEncrypted,
              iv: lastMsg.contentIv,
            });
            // Truncate for preview
            if (lastMessageContent && lastMessageContent.length > 50) {
              lastMessageContent = lastMessageContent.substring(0, 50) + '...';
            }
          } catch {
            lastMessageContent = '[Message chiffre]';
          }
        }
        
        return {
          id: conv.id,
          name: displayName || 'Conversation',
          avatarUrl: displayAvatar,
          type: conv.type as 'direct' | 'group',
          lastMessage: lastMsg?.isDeleted 
            ? 'Message supprime' 
            : lastMessageContent,
          lastMessageTime: lastMsg?.createdAt.toISOString() || null,
          lastMessageSenderId: lastMsg?.senderId || null,
          unreadCount,
          participants: conv.participants.map(part => ({
            id: part.id,
            userId: part.userId,
            user: {
              id: part.user.id,
              nom: part.user.nom,
              prenom: part.user.prenom,
              pseudo: part.user.profil?.pseudo || null,
              profilePhotoUrl: part.user.profil?.profilePhotoUrl || null,
            },
          })),
        };
      })
    );
    
    // Filter unread if needed
    if (filter === 'unread') {
      return NextResponse.json(
        conversations.filter(c => c.unreadCount > 0)
      );
    }
    
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Create a new group conversation
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
    const { name, participantIds } = body as {
      name?: string;
      participantIds: string[];
    };
    
    if (!participantIds || participantIds.length < 2) {
      return NextResponse.json(
        { error: 'Au moins 2 participants requis pour un groupe' },
        { status: 400 }
      );
    }
    
    if (participantIds.length > 199) {
      return NextResponse.json(
        { error: 'Maximum 200 membres par groupe' },
        { status: 400 }
      );
    }
    
    // Ensure creator is included
    const allParticipants = [...new Set([user.id, ...participantIds])];
    
    // Create group conversation
    const conversation = await prisma.conversation.create({
      data: {
        name: name || null,
        type: 'group',
        createdById: user.id,
        participants: {
          create: allParticipants.map((userId, index) => ({
            userId,
            role: userId === user.id ? 'admin' : 'member',
          })),
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
    
    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
