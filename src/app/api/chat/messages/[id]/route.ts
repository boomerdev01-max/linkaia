// app/api/chat/messages/[id]/route.ts
// Update, delete, pin messages
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { encryptMessage } from '@/lib/encryption';

// PATCH - Edit or update message (pin, etc.)
export async function PATCH(
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
    
    // Check if user is participant
    const isParticipant = message.conversation.participants.some(
      p => p.userId === user.id
    );
    
    if (!isParticipant) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }
    
    const body = await request.json();
    const { action, content } = body as {
      action: 'edit' | 'pin' | 'unpin';
      content?: string;
    };
    
    // Handle different actions
    if (action === 'edit') {
      // Only sender can edit
      if (message.senderId !== user.id) {
        return NextResponse.json(
          { error: 'Seul l\'expediteur peut modifier le message' },
          { status: 403 }
        );
      }
      
      // Check 10 minute limit
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      if (message.createdAt < tenMinutesAgo) {
        return NextResponse.json(
          { error: 'Le message ne peut plus etre modifie (limite de 10 minutes)' },
          { status: 400 }
        );
      }
      
      if (!content) {
        return NextResponse.json(
          { error: 'Contenu requis pour la modification' },
          { status: 400 }
        );
      }
      
      // Encrypt new content
      const encrypted = encryptMessage(content);
      
      await prisma.message.update({
        where: { id: messageId },
        data: {
          contentEncrypted: encrypted.encrypted,
          contentIv: encrypted.iv,
          isEdited: true,
          updatedAt: new Date(),
        },
      });
      
      return NextResponse.json({ success: true, action: 'edited' });
    }
    
    if (action === 'pin' || action === 'unpin') {
      // Check if user is admin for groups
      if (message.conversation.type === 'group') {
        const participant = message.conversation.participants.find(
          p => p.userId === user.id
        );
        if (participant?.role !== 'admin') {
          return NextResponse.json(
            { error: 'Seuls les admins peuvent epingler des messages' },
            { status: 403 }
          );
        }
      }
      
      await prisma.message.update({
        where: { id: messageId },
        data: { isPinned: action === 'pin' },
      });
      
      return NextResponse.json({ success: true, action });
    }
    
    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a message
export async function DELETE(
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
    
    // Only sender or group admin can delete
    const isOwner = message.senderId === user.id;
    const participant = message.conversation.participants.find(
      p => p.userId === user.id
    );
    const isAdmin = participant?.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Non autorise a supprimer ce message' },
        { status: 403 }
      );
    }
    
    // Soft delete - mark as deleted
    await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        contentEncrypted: null,
        contentIv: null,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
