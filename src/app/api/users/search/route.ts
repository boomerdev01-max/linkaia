// app/api/users/search/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    
    if (!supabaseUser) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }
    
    const currentUser = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: { id: true },
    });
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);
    
    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }
    
    // Search by name, pseudo, or email
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUser.id } }, // Exclude current user
          {
            OR: [
              { nom: { contains: query, mode: 'insensitive' } },
              { prenom: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              {
                profil: {
                  pseudo: { contains: query, mode: 'insensitive' },
                },
              },
            ],
          },
        ],
      },
      take: limit,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        profil: {
          select: {
            pseudo: true,
            profilePhotoUrl: true,
            bio: true,
          },
        },
      },
    });
    
    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        nom: u.nom,
        prenom: u.prenom,
        email: u.email,
        pseudo: u.profil?.pseudo || null,
        profilePhotoUrl: u.profil?.profilePhotoUrl || null,
        bio: u.profil?.bio || null,
      })),
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
