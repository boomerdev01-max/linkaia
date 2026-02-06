// src/components/profile/ReviewModal.tsx
'use client';

import { useState } from 'react';
import { X, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  existingReview?: {
    rating: number;
    comment: string;
  } | null;
  profileName: string;
}

export default function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  existingReview,
  profileName,
}: ReviewModalProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Veuillez sélectionner une note');
      return;
    }

    if (comment.trim().length < 10) {
      toast.error('Le commentaire doit contenir au moins 10 caractères');
      return;
    }

    if (comment.trim().length > 500) {
      toast.error('Le commentaire ne peut pas dépasser 500 caractères');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(rating, comment.trim());
      toast.success(
        existingReview ? 'Avis mis à jour avec succès' : 'Avis publié avec succès'
      );
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'avis'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#0F4C5C] to-[#1a6b7f] px-6 py-4">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-white pr-8">
            {existingReview ? 'Modifier votre avis' : 'Laisser un avis'}
          </h2>
          <p className="text-white/90 text-sm mt-1">
            À propos de {profileName}
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Votre note
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  disabled={submitting}
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {rating}/5
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label
              htmlFor="comment"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Votre commentaire
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience avec ce profil... (10-500 caractères)"
              rows={5}
              disabled={submitting}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0F4C5C] focus:ring-2 focus:ring-[#0F4C5C]/20 transition-colors resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                Minimum 10 caractères
              </span>
              <span
                className={`text-xs ${
                  comment.length > 500
                    ? 'text-red-500 font-medium'
                    : 'text-gray-500'
                }`}
              >
                {comment.length}/500
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0 || comment.trim().length < 10}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#0F4C5C] to-[#1a6b7f] text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Envoi...</span>
                </>
              ) : (
                <span>{existingReview ? 'Mettre à jour' : 'Publier'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}