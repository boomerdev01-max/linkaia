// app/chat/page.tsx
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { ChatClient } from './ChatClient';

interface Props {
  searchParams: Promise<{ conversation?: string }>;
}

export default async function ChatPage({ searchParams }: Props) {
  const { conversation: conversationId } = await searchParams;
  
  const supabase = await createSupabaseServerClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  
  if (!supabaseUser) {
    redirect('/signin');
  }
  
  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
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
  
  if (!user) {
    redirect('/signin');
  }
  
  const currentUser = {
    id: user.id,
    nom: user.nom,
    prenom: user.prenom,
    pseudo: user.profil?.pseudo || null,
    profilePhotoUrl: user.profil?.profilePhotoUrl || null,
  };
  
  return (
    <ChatClient 
      currentUser={currentUser}
      initialConversationId={conversationId || null}
    />
  );
}
