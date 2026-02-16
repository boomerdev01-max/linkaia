// src/components/home/StoryViewer.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Heart, Smile, Flame, Send, Pause, Play } from "lucide-react";
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
const SLIDE_DURATION = 5000; // 5 secondes par slide

export default function StoryViewer({
  stories,
  initialStoryIndex,
  onClose,
  onStoryChange,
}: StoryViewerProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [replyText, setReplyText] = useState("");

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const currentStory = stories[currentStoryIndex];
  const currentSlide = currentStory?.slides[currentSlideIndex];
  const totalSlides = currentStory?.slides.length || 0;

  // ============================================
  // NAVIGATION
  // ============================================

  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      // Passer à la story suivante
      if (currentStoryIndex < stories.length - 1) {
        setCurrentStoryIndex((prev) => prev + 1);
        setCurrentSlideIndex(0);
        setProgress(0);
        onStoryChange?.(currentStoryIndex + 1);
      } else {
        onClose();
      }
    }
  }, [currentSlideIndex, totalSlides, currentStoryIndex, stories.length, onClose, onStoryChange]);

  const goToPrevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
      setProgress(0);
    } else {
      // Passer à la story précédente
      if (currentStoryIndex > 0) {
        const prevStory = stories[currentStoryIndex - 1];
        setCurrentStoryIndex((prev) => prev - 1);
        setCurrentSlideIndex(prevStory.slides.length - 1);
        setProgress(0);
        onStoryChange?.(currentStoryIndex - 1);
      }
    }
  }, [currentSlideIndex, currentStoryIndex, stories, onStoryChange]);

  // ============================================
  // PROGRESS BAR
  // ============================================

  useEffect(() => {
    if (isPaused || !currentSlide) return;

    const duration = currentSlide.type === "VIDEO" && currentSlide.duration
      ? currentSlide.duration * 1000
      : SLIDE_DURATION;

    const interval = 50; // Update every 50ms
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

  // ============================================
  // MARK AS VIEWED
  // ============================================

  useEffect(() => {
    if (!currentStory || currentStory.isOwn || currentStory.hasViewed) return;

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

  // ============================================
  // TOUCH HANDLERS (Swipe & Tap)
  // ============================================

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

    // Swipe down to close
    if (deltaY > 100 && Math.abs(deltaX) < 50) {
      onClose();
    }

    touchStartRef.current = null;
  };

  const handleClick = (e: React.MouseEvent) => {
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

  // ============================================
  // REACTIONS
  // ============================================

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
          data.action === "removed" ? "Réaction supprimée" : "Réaction ajoutée"
        );
      }
      setShowReactions(false);
    } catch (error) {
      toast.error("Erreur lors de la réaction");
    }
  };

  // ============================================
  // REPLY (TODO: Intégration chat)
  // ============================================

  const handleReply = async () => {
    if (!replyText.trim()) return;

    // TODO: Intégrer avec le système de chat existant
    // Pour l'instant, juste un toast
    toast.success("Réponse envoyée (TODO: intégrer chat)");
    setReplyText("");
  };

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================

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

  if (!currentStory || !currentSlide) return null;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
        {currentStory.slides.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all duration-100"
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

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 z-20 px-4 mt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] flex items-center justify-center">
              {currentStory.user.profil?.profilePhotoUrl ? (
                <img
                  src={currentStory.user.profil.profilePhotoUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-sm">
                  {currentStory.user.prenom.charAt(0)}
                  {currentStory.user.nom.charAt(0)}
                </span>
              )}
            </div>

            <div className="text-white">
              <p className="font-medium text-sm">
                {currentStory.user.profil?.pseudo ||
                  `${currentStory.user.prenom} ${currentStory.user.nom}`}
              </p>
              <p className="text-xs opacity-80">
                {formatDistanceToNow(new Date(currentStory.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              {isPaused ? (
                <Play className="w-5 h-5 text-white" />
              ) : (
                <Pause className="w-5 h-5 text-white" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentSlide.type === "PHOTO" && (
          <img
            src={currentSlide.mediaUrl}
            alt="Story"
            className="max-w-full max-h-full object-contain"
          />
        )}

        {currentSlide.type === "VIDEO" && (
          <video
            src={currentSlide.mediaUrl}
            className="max-w-full max-h-full object-contain"
            autoPlay
            muted
            playsInline
          />
        )}

        {currentSlide.type === "TEXT" && (
          <div
            className="w-full h-full flex items-center justify-center p-8"
            style={{ background: currentSlide.bgColor }}
          >
            <p
              className="text-center whitespace-pre-wrap"
              style={{
                color: currentSlide.textColor,
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

      {/* Navigation hint areas */}
      <div className="absolute inset-0 flex pointer-events-none">
        <div className="w-1/3" />
        <div className="w-1/3" />
        <div className="w-1/3" />
      </div>

      {/* Bottom actions */}
      {!currentStory.isOwn && (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 space-y-4">
          {/* Reaction picker */}
          {showReactions && (
            <div className="flex justify-center gap-2 mb-2">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl hover:scale-110 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Reply input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Répondre à la story..."
              className="flex-1 px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white placeholder-white/60 outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleReply();
              }}
            />

            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
            >
              <Smile className="w-6 h-6 text-white" />
            </button>

            {replyText.trim() && (
              <button
                onClick={handleReply}
                className="p-3 bg-[#0F4C5C] rounded-full hover:opacity-90 transition-opacity"
              >
                <Send className="w-6 h-6 text-white" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Own story stats */}
      {currentStory.isOwn && (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex items-center justify-around">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {currentStory.viewsCount}
              </p>
              <p className="text-xs text-white/80">Vues</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {currentStory.reactionsCount}
              </p>
              <p className="text-xs text-white/80">Réactions</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}