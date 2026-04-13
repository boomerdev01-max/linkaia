// src/lib/smart-feed.ts
import { prisma } from "@/lib/prisma";

/**
 * Retourne les codes de catégorie triés par score d'affinité
 * pour un utilisateur donné. Utilisé pour trier le feed.
 */
export async function getUserAffinityRanking(
  userId: string,
): Promise<string[]> {
  const affinities = await prisma.userContentAffinity.findMany({
    where: { userId },
    orderBy: { affinityScore: "desc" },
    select: { categoryCode: true },
    take: 10,
  });

  return affinities.map((a) => a.categoryCode);
}

/**
 * Trie un tableau de posts selon le ranking d'affinité de l'utilisateur.
 * Les posts sans catégorie tombent en bas, mais restent présents.
 */
export function sortPostsByAffinity<T extends { categoryCode: string | null }>(
  posts: T[],
  affinityRanking: string[],
): T[] {
  if (affinityRanking.length === 0) return posts;

  return [...posts].sort((a, b) => {
    const rankA = a.categoryCode
      ? affinityRanking.indexOf(a.categoryCode)
      : Infinity;
    const rankB = b.categoryCode
      ? affinityRanking.indexOf(b.categoryCode)
      : Infinity;

    // -1 = catégorie non trouvée dans le ranking → va en bas
    const scoreA = rankA === -1 ? Infinity : rankA;
    const scoreB = rankB === -1 ? Infinity : rankB;

    return scoreA - scoreB;
  });
}
