// app/api/chat/unread-count/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

export async function GET() {
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
    
    // Get all user's participations with lastReadAt
    const participations = await prisma.conversationParticipant.findMany({
      where: {
        userId: user.id,
        isArchived: false,
      },
      select: {
        conversationId: true,
        lastReadAt: true,
      },
    });
    
    // Count total unread messages
    let totalUnread = 0;
    
    for (const p of participations) {
      const count = await prisma.message.count({
        where: {
          conversationId: p.conversationId,
          senderId: { not: user.id },
          isDeleted: false,
          createdAt: p.lastReadAt ? { gt: p.lastReadAt } : undefined,
        },
      });
      totalUnread += count;
    }
    
    return NextResponse.json({ count: totalUnread });
  } catch (error) {
    console.error('Error getting unread count:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
