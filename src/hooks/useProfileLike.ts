// src/hooks/useProfileLike.ts
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface UseProfileLikeReturn {
  isLiked: boolean;
  likesCount: number;
  isLoading: boolean;
  toggleLike: () => Promise<void>;
}

/**
 * 🎯 Hook pour gérer les likes de profil
 * @param profileUserId - ID de l'utilisateur dont on consulte le profil
 * @returns { isLiked, likesCount, isLoading, toggleLike }
 */
export function useProfileLike(profileUserId: string): UseProfileLikeReturn {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 📥 Récupérer l'état initial du like
  const fetchLikeStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/profile/${profileUserId}/like`);

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération du statut");
      }

      const data = await response.json();
      setIsLiked(data.isLiked);
      setLikesCount(data.likesCount);
    } catch (error) {
      console.error("❌ Erreur fetchLikeStatus:", error);
      toast.error("Erreur lors du chargement des likes");
    } finally {
      setIsLoading(false);
    }
  }, [profileUserId]);

  useEffect(() => {
    fetchLikeStatus();
  }, [fetchLikeStatus]);

  // 💙 Toggle like/unlike
  const toggleLike = useCallback(async () => {
    try {
      setIsLoading(true);

      const method = isLiked ? "DELETE" : "POST";
      const response = await fetch(`/api/profile/${profileUserId}/like`, {
        method,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l'opération");
      }

      const data = await response.json();

      setIsLiked(data.isLiked);
      setLikesCount(data.likesCount);

      toast.success(data.isLiked ? "❤️ Profil liké !" : "Like retiré");
    } catch (error) {
      console.error("❌ Erreur toggleLike:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'opération",
      );
    } finally {
      setIsLoading(false);
    }
  }, [profileUserId, isLiked]);

  return {
    isLiked,
    likesCount,
    isLoading,
    toggleLike,
  };
}
