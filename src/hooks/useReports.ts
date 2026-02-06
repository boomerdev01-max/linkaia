// src/hooks/useReports.ts
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface ReportCategory {
  id: string;
  code: string;
  label: string;
  description: string | null;
  order: number;
}

export interface Report {
  id: string;
  categoryId: string;
  reason: string;
  status: string;
  createdAt: string;
  category: ReportCategory;
}

export function useReports() {
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les catégories de signalement
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/reports/categories");
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des catégories");
        }
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error("❌ Error loading report categories:", error);
        toast.error("Impossible de charger les catégories de signalement");
      } finally {
        setIsLoading(false);
      }
    }

    loadCategories();
  }, []);

  // Soumettre un signalement
  const submitReport = async (
    profileId: string,
    categoryId: string,
    reason: string
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/profile/${profileId}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId,
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi du signalement");
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  // Vérifier si l'utilisateur a déjà signalé ce profil
  const checkExistingReport = async (
    profileId: string
  ): Promise<Report | null> => {
    try {
      const response = await fetch(`/api/profile/${profileId}/reports`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.existingReport || null;
    } catch (error) {
      console.error("❌ Error checking existing report:", error);
      return null;
    }
  };

  return {
    categories,
    isLoading,
    submitReport,
    checkExistingReport,
  };
}