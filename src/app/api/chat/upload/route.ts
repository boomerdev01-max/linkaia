// app/api/chat/upload/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { createClient } from '@supabase/supabase-js';
import { 
  FILE_LIMITS, 
  getMediaType 
} from '@/lib/supabase/chat-storage';

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
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const conversationId = formData.get('conversationId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
    }
    
    if (!conversationId) {
      return NextResponse.json({ error: 'ID conversation requis' }, { status: 400 });
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
    
    // Validate file
    const mediaType = getMediaType(file.type);
    if (!mediaType) {
      return NextResponse.json(
        { error: 'Type de fichier non autorise' },
        { status: 400 }
      );
    }
    
    const limit = FILE_LIMITS[mediaType];
    if (file.size > limit) {
      const limitMB = limit / (1024 * 1024);
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${limitMB}MB)` },
        { status: 400 }
      );
    }
    
    // IMPORTANT: Utiliser createClient directement avec le service role key
    // Cela bypass complètement les RLS policies
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    const bucket = mediaType === 'VOICE' ? 'voice-messages' : 'chat-media';
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'bin';
    // Utiliser supabaseUser.id au lieu de user.id pour être cohérent avec Supabase
    const path = `${supabaseUser.id}/${conversationId}/${timestamp}.${ext}`;
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('Uploading to Supabase:', { bucket, path, size: file.size, type: file.type });
    
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });
    
    if (error) {
      console.error('Upload error details:', {
        message: error.message,
        error: error
      });
      return NextResponse.json(
        { error: `Erreur upload: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log('Upload successful:', data);
    
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return NextResponse.json({
      url: urlData.publicUrl,
      path: data.path,
      type: mediaType,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}