// app/user/[id]/page.tsx
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function UserProfilePage({ params }: Props) {
  const { id: targetUserId } = await params;
  
  const supabase = await createSupabaseServerClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  
  if (!supabaseUser) {
    redirect('/signin');
  }
  
  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    select: { id: true },
  });
  
  if (!user) {
    redirect('/signin');
  }
  
  // Ne pas permettre de démarrer une conversation avec soi-même
  if (user.id === targetUserId) {
    redirect('/home');
  }
  
  // Vérifier si l'utilisateur cible existe
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });
  
  if (!targetUser) {
    redirect('/home');
  }
  
  // Chercher une conversation existante entre ces deux utilisateurs
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
    select: { id: true },
  });
  
  if (existingConversation) {
    // Désarchiver si archivé
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: existingConversation.id,
        userId: user.id,
      },
      data: { isArchived: false },
    });
    
    // Rediriger vers le chat avec cette conversation
    redirect(`/chat?conversation=${existingConversation.id}`);
  }
  
  // Créer une nouvelle conversation directe
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
    select: { id: true },
  });
  
  // Rediriger vers le chat avec la nouvelle conversation
  redirect(`/chat?conversation=${newConversation.id}`);
}