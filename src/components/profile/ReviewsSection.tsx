// src/components/profile/ReviewsSection.tsx
"use client";

import { Star, ThumbsUp, MessageSquare, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Review, ReviewStats } from "@/hooks/useReviews";

interface ReviewsSectionProps {
  reviews: Review[];
  stats: ReviewStats | null;
  currentUserId: string;
  onDeleteReview?: () => void;
}

export default function ReviewsSection({
  reviews,
  stats,
  currentUserId,
  onDeleteReview,
}: ReviewsSectionProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!stats || stats.totalReviews === 0) {
    return (
      <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Avis des utilisateurs
        </h2>
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun avis pour le moment</p>
          <p className="text-sm text-gray-400 mt-1">
            Soyez le premier à laisser un avis !
          </p>
        </div>
      </section>
    );
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer votre avis ?")) {
      return;
    }

    try {
      setDeletingId(reviewId);
      // La suppression sera gérée par le hook dans le composant parent
      onDeleteReview?.();
    } catch (error) {
      toast.error("Erreur lors de la suppression de l'avis");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Avis des utilisateurs
      </h2>

      {/* Statistiques globales */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-6 mb-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">
              {stats.averageRating}
            </div>
            <div className="flex items-center justify-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(stats.averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {stats.totalReviews} avis
            </div>
          </div>

          {/* Distribution des notes */}
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count =
                stats.ratingDistribution[
                  rating as keyof typeof stats.ratingDistribution
                ];
              const percentage =
                stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

              return (
                <div key={rating} className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-600 w-8">{rating}★</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Liste des avis */}
      <div className="space-y-6">
        {reviews.map((review) => {
          const reviewerName =
            review.reviewer.profil?.pseudo ||
            `${review.reviewer.prenom} ${review.reviewer.nom}`;
          const isOwnReview = review.reviewer.id === currentUserId;

          return (
            <div
              key={review.id}
              className="pb-6 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] flex items-center justify-center shrink-0 overflow-hidden">
                  {review.reviewer.profil?.profilePhotoUrl ? (
                    <img
                      src={review.reviewer.profil.profilePhotoUrl}
                      alt={reviewerName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold">
                      {review.reviewer.prenom.charAt(0)}
                      {review.reviewer.nom.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Contenu de l'avis */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {reviewerName}
                        {isOwnReview && (
                          <span className="ml-2 text-xs font-normal text-blue-600">
                            (Vous)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString(
                            "fr-FR",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </span>
                        {review.updatedAt !== review.createdAt && (
                          <span className="text-xs text-gray-400">
                            (modifié)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bouton supprimer (uniquement pour son propre avis) */}
                    {isOwnReview && (
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        disabled={deletingId === review.id}
                        className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Supprimer mon avis"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-gray-700 whitespace-pre-line">
                    {review.comment}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
