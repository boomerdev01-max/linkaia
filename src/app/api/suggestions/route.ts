// src/app/api/suggestions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { getSuggestedProfiles, getHiddenMatchesCount } from '@/lib/matching';

export async function GET(req: NextRequest) {
  try {
    // 1. Authentification
    const { user, error } = await getAuthenticatedUser();

    if (!user || error) {
      return NextResponse.json(
        { success: false, error: error || 'Non authentifié' },
        { status: 401 }
      );
    }

    // 2. Récupérer les paramètres
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // 3. Récupérer les suggestions
    const suggestions = await getSuggestedProfiles(
      user.id,
      user.level,
      limit
    );

    // 4. Compter les matchs cachés pour les banners d'upgrade
    const { hiddenGoodMatches, hiddenPerfectMatches } = await getHiddenMatchesCount(
      user.id,
      user.level
    );

    // 5. Retourner les données
    return NextResponse.json({
      success: true,
      suggestions,
      userLevel: user.level,
      hiddenGoodMatches,
      hiddenPerfectMatches,
      total: suggestions.length,
    });
  } catch (error) {
    console.error('❌ Error in suggestions API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des suggestions',
      },
      { status: 500 }
    );
  }
}