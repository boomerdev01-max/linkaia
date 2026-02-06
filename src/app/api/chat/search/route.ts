// app/api/chat/search/route.ts
// Search messages within conversations
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { decryptMessage } from '@/lib/encryption';

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
    const query = searchParams.get('q')?.trim().toLowerCase();
    const conversationId = searchParams.get('conversationId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    
    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }
    
    // Get user's conversations
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId: user.id },
      select: { conversationId: true },
    });
    
    const conversationIds = conversationId
      ? [conversationId]
      : participations.map(p => p.conversationId);
    
    // Verify access to specific conversation
    if (conversationId && !participations.some(p => p.conversationId === conversationId)) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }
    
    // Fetch messages from user's conversations
    const messages = await prisma.message.findMany({
      where: {
        conversationId: { in: conversationIds },
        isDeleted: false,
        contentEncrypted: { not: null },
      },
      take: limit * 5, // Fetch more since we filter after decryption
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        conversation: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });
    
    // Decrypt and filter by search query
    const results: {
      id: string;
      content: string;
      conversationId: string;
      conversationName: string | null;
      createdAt: string;
      sender: { id: string; nom: string; prenom: string };
    }[] = [];
    
    for (const msg of messages) {
      if (results.length >= limit) break;
      
      if (!msg.contentEncrypted || !msg.contentIv) continue;
      
      try {
        const decrypted = decryptMessage({
          encrypted: msg.contentEncrypted,
          iv: msg.contentIv,
        });
        
        if (decrypted.toLowerCase().includes(query)) {
          results.push({
            id: msg.id,
            content: decrypted,
            conversationId: msg.conversationId,
            conversationName: msg.conversation.name,
            createdAt: msg.createdAt.toISOString(),
            sender: msg.sender,
          });
        }
      } catch {
        // Skip messages that can't be decrypted
      }
    }
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching messages:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
