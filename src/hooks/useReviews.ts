// src/hooks/useReviews.ts
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  reviewer: {
    id: string;
    prenom: string;
    nom: string;
    profil: {
      pseudo: string | null;
      profilePhotoUrl: string | null;
    } | null;
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export function useReviews(profileId: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les avis
  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/profile/${profileId}/reviews`);
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des avis");
      }
      const data = await response.json();
      setReviews(data.reviews || []);
      setStats(data.stats || null);
      setUserReview(data.userReview || null);
    } catch (error) {
      console.error("❌ Error loading reviews:", error);
      toast.error("Impossible de charger les avis");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profileId) {
      loadReviews();
    }
  }, [profileId]);

  // Soumettre ou mettre à jour un avis
  const submitReview = async (
    rating: number,
    comment: string
  ): Promise<void> => {
    try {
      const method = userReview ? "PUT" : "POST";
      const response = await fetch(`/api/profile/${profileId}/reviews`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi de l'avis");
      }

      // Recharger les avis après soumission
      await loadReviews();
    } catch (error) {
      throw error;
    }
  };

  // Supprimer un avis
  const deleteReview = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/profile/${profileId}/reviews`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la suppression de l'avis");
      }

      toast.success("Avis supprimé avec succès");
      await loadReviews();
    } catch (error) {
      throw error;
    }
  };

  return {
    reviews,
    stats,
    userReview,
    isLoading,
    submitReview,
    deleteReview,
    refreshReviews: loadReviews,
  };
}