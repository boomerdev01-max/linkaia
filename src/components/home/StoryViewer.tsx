// src/components/home/StoryViewer.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Pause, Play, Send, Smile, Eye, Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface StorySlide {
  id: string;
  type: string;
  order: number;
  mediaUrl?: string;
  thumbnailUrl?: string;
  textContent?: string;
  bgColor?: string;
  textColor?: string;
  fontSize?: string;
  duration?: number;
}

interface StoryUser {
  id: string;
  nom: string;
  prenom: string;
  profil: {
    pseudo: string | null;
    profilePhotoUrl: string | null;
  } | null;
}

interface Story {
  id: string;
  userId: string;
  user: StoryUser;
  slides: StorySlide[];
  createdAt: string;
  viewsCount: number;
  reactionsCount: number;
  hasViewed: boolean;
  isOwn: boolean;
}

interface StoryViewerProps {
  stories: Story[];
  initialStoryIndex: number;
  onClose: () => void;
  onStoryChange?: (index: number) => void;
}

const EMOJIS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];
const SLIDE_DURATION = 5000; // 5s par slide

export default function StoryViewer({
  stories,
  initialStoryIndex,
  onClose,
  onStoryChange,
}: StoryViewerProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(
    Math.max(0, Math.min(initialStoryIndex, stories.length - 1)),
  );
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [replyText, setReplyText] = useState("");

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const viewedRef = useRef<Set<string>>(new Set());

  const currentStory = stories[currentStoryIndex];
  const currentSlide = currentStory?.slides[currentSlideIndex];
  const totalSlides = currentStory?.slides.length || 0;

  // ─── Navigation ──────────────────────────────────────────────

  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
      setProgress(0);
    } else if (currentStoryIndex < stories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      setCurrentSlideIndex(0);
      setProgress(0);
      onStoryChange?.(nextIndex);
    } else {
      onClose();
    }
  }, [
    currentSlideIndex,
    totalSlides,
    currentStoryIndex,
    stories.length,
    onClose,
    onStoryChange,
  ]);

  const goToPrevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
      setProgress(0);
    } else if (currentStoryIndex > 0) {
      const prevIndex = currentStoryIndex - 1;
      const prevStory = stories[prevIndex];
      setCurrentStoryIndex(prevIndex);
      setCurrentSlideIndex(prevStory.slides.length - 1);
      setProgress(0);
      onStoryChange?.(prevIndex);
    }
  }, [currentSlideIndex, currentStoryIndex, stories, onStoryChange]);

  // ─── Barre de progression ─────────────────────────────────────

  useEffect(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setProgress(0);
  }, [currentStoryIndex, currentSlideIndex]);

  useEffect(() => {
    if (isPaused || !currentSlide) return;

    const duration =
      currentSlide.type === "VIDEO" && currentSlide.duration
        ? currentSlide.duration * 1000
        : SLIDE_DURATION;

    const interval = 50;
    const increment = (interval / duration) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNextSlide();
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentSlide, isPaused, goToNextSlide]);

  // ─── Marquer comme vue (seulement pour les stories des autres) ─

  useEffect(() => {
    if (!currentStory) return;

    // ✅ Ne pas enregistrer la vue pour sa propre story
    if (currentStory.isOwn) return;

    // Éviter d'enregistrer deux fois la même story
    if (viewedRef.current.has(currentStory.id)) return;
    viewedRef.current.add(currentStory.id);

    const markAsViewed = async () => {
      try {
        await fetch(`/api/stories/${currentStory.id}/view`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Error marking story as viewed:", error);
      }
    };

    markAsViewed();
  }, [currentStory]);

  // ─── Gestion du clavier ───────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToNextSlide();
      if (e.key === "ArrowLeft") goToPrevSlide();
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextSlide, goToPrevSlide, onClose]);

  // ─── Touch (swipe bas = fermer, gauche/droite = naviguer) ─────

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;

    if (deltaY > 100 && Math.abs(deltaX) < 50) {
      onClose();
    }

    touchStartRef.current = null;
  };

  const handleClick = (e: React.MouseEvent) => {
    // Ne pas déclencher si c'est un input ou un bouton
    if ((e.target as HTMLElement).closest("input, button, textarea")) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (clickX < width / 3) {
      goToPrevSlide();
    } else if (clickX > (width * 2) / 3) {
      goToNextSlide();
    } else {
      setIsPaused((prev) => !prev);
    }
  };

  // ─── Réactions ────────────────────────────────────────────────

  const handleReaction = async (emoji: string) => {
    try {
      const response = await fetch(`/api/stories/${currentStory.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(
          data.action === "removed" ? "Réaction supprimée" : "Réaction ajoutée",
        );
      }
      setShowReactions(false);
    } catch {
      toast.error("Erreur lors de la réaction");
    }
  };

  // ─── Répondre ─────────────────────────────────────────────────

  const handleReply = async () => {
    if (!replyText.trim()) return;
    // TODO: intégrer avec le système de chat
    toast.success("Réponse envoyée");
    setReplyText("");
  };

  // ─── Supprimer sa story ───────────────────────────────────────

  const handleDeleteStory = async () => {
    if (!confirm("Supprimer cette story ?")) return;

    try {
      const response = await fetch(`/api/stories/${currentStory.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Story supprimée");
        onClose();
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (!currentStory || !currentSlide) return null;

  const displayName =
    currentStory.user.profil?.pseudo ||
    `${currentStory.user.prenom} ${currentStory.user.nom}`;

  const initials =
    `${currentStory.user.prenom.charAt(0)}${currentStory.user.nom.charAt(0)}`.toUpperCase();

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Conteneur centré (format story 9/16) */}
      <div className="relative w-full h-full max-w-sm mx-auto">
        {/* ── Barres de progression ── */}
        <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-2 pt-3">
          {currentStory.slides.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width:
                    index < currentSlideIndex
                      ? "100%"
                      : index === currentSlideIndex
                        ? `${progress}%`
                        : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* ── Header utilisateur ── */}
        <div className="absolute top-6 left-0 right-0 z-30 px-3 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/60 shrink-0">
                {currentStory.user.profil?.profilePhotoUrl ? (
                  <img
                    src={currentStory.user.profil.profilePhotoUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] flex items-center justify-center">
                    <span className="text-white font-bold text-xs">
                      {initials}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-white font-semibold text-sm leading-tight">
                  {currentStory.isOwn ? "Votre story" : displayName}
                </p>
                <p className="text-white/70 text-xs">
                  {formatDistanceToNow(new Date(currentStory.createdAt), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Pause / Play */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused((prev) => !prev);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                {isPaused ? (
                  <Play className="w-4 h-4 text-white" />
                ) : (
                  <Pause className="w-4 h-4 text-white" />
                )}
              </button>

              {/* Supprimer si c'est sa propre story */}
              {currentStory.isOwn && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteStory();
                  }}
                  className="p-2 hover:bg-red-500/30 rounded-full transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              )}

              {/* Fermer */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Contenu principal (cliquable pour naviguer) ── */}
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {currentSlide.type === "PHOTO" && currentSlide.mediaUrl && (
            <img
              src={currentSlide.mediaUrl}
              alt="Story"
              className="w-full h-full object-cover"
              draggable={false}
            />
          )}

          {currentSlide.type === "VIDEO" && currentSlide.mediaUrl && (
            <video
              key={currentSlide.id}
              src={currentSlide.mediaUrl}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
              onEnded={goToNextSlide}
            />
          )}

          {currentSlide.type === "TEXT" && (
            <div
              className="w-full h-full flex items-center justify-center p-8"
              style={{ background: currentSlide.bgColor || "#0F4C5C" }}
            >
              <p
                className="text-center whitespace-pre-wrap wrap-break-word leading-relaxed"
                style={{
                  color: currentSlide.textColor || "#FFFFFF",
                  fontSize:
                    currentSlide.fontSize === "small"
                      ? "1.5rem"
                      : currentSlide.fontSize === "large"
                        ? "3rem"
                        : "2rem",
                }}
              >
                {currentSlide.textContent}
              </p>
            </div>
          )}
        </div>

        {/* ── Zones de tap gauche/droite (overlay invisible) ── */}
        <div className="absolute inset-0 z-10 flex pointer-events-none">
          <div
            className="w-1/3 h-full pointer-events-auto"
            onClick={goToPrevSlide}
          />
          <div className="w-1/3 h-full" />
          <div
            className="w-1/3 h-full pointer-events-auto"
            onClick={goToNextSlide}
          />
        </div>

        {/* ── Footer : Répondre (stories des autres) ── */}
        {!currentStory.isOwn && (
          <div className="absolute bottom-0 left-0 right-0 z-30 p-4 space-y-3">
            {/* Réactions emoji */}
            {showReactions && (
              <div
                className="flex justify-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-transform border border-white/20"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Input réponse */}
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                placeholder={`Répondre à ${displayName}…`}
                className="flex-1 px-4 py-2.5 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full text-white placeholder-white/50 text-sm outline-none focus:border-white/50 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleReply();
                }}
              />

              <button
                onClick={() => {
                  setShowReactions((prev) => !prev);
                  setIsPaused(true);
                }}
                className={`p-2.5 rounded-full transition-colors ${
                  showReactions
                    ? "bg-white/30"
                    : "bg-white/15 hover:bg-white/25"
                } backdrop-blur-sm border border-white/25`}
              >
                <Smile className="w-5 h-5 text-white" />
              </button>

              {replyText.trim() && (
                <button
                  onClick={handleReply}
                  className="p-2.5 bg-[#0F4C5C] rounded-full hover:opacity-90 transition-opacity"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Footer : Statistiques (propre story) ── */}
        {currentStory.isOwn && (
          <div className="absolute bottom-0 left-0 right-0 z-30 p-4">
            <div
              className="bg-black/40 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-around border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 text-white">
                <Eye className="w-5 h-5 opacity-80" />
                <div>
                  <p className="text-xl font-bold leading-none">
                    {currentStory.viewsCount}
                  </p>
                  <p className="text-xs opacity-60 mt-0.5">Vues</p>
                </div>
              </div>

              <div className="w-px h-8 bg-white/20" />

              <div className="flex items-center gap-2 text-white">
                <Heart className="w-5 h-5 opacity-80" />
                <div>
                  <p className="text-xl font-bold leading-none">
                    {currentStory.reactionsCount}
                  </p>
                  <p className="text-xs opacity-60 mt-0.5">Réactions</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
