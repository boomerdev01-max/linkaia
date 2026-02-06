// src/components/home/StoryCarousel.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  nom: string;
  prenom: string;
  pseudo: string;
  email: string;
  image?: string | null;
}

interface StoryCarouselProps {
  user: User;
}

export default function StoryCarousel({ user }: StoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const [stories] = useState([
    {
      id: 0,
      name: "Votre story",
      initials: `${user.prenom.charAt(0)}${user.nom.charAt(0)}`,
      isUser: true,
      hasNew: true,
      image: "🌟",
    },
    {
      id: 1,
      name: "Marie",
      initials: "MD",
      hasStory: true,
      seen: false,
      image: "🏔️",
    },
    {
      id: 2,
      name: "Thomas",
      initials: "TM",
      hasStory: true,
      seen: true,
      image: "🚀",
    },
    {
      id: 3,
      name: "Sophie",
      initials: "SB",
      hasStory: true,
      seen: false,
      image: "☕",
    },
    {
      id: 4,
      name: "Lucas",
      initials: "LP",
      hasStory: false,
      seen: false,
      image: "🎮",
    },
    {
      id: 5,
      name: "Julie",
      initials: "JG",
      hasStory: true,
      seen: true,
      image: "🎨",
    },
    {
      id: 6,
      name: "Alex",
      initials: "AR",
      hasStory: true,
      seen: false,
      image: "🎸",
    },
    {
      id: 7,
      name: "Emma",
      initials: "EC",
      hasStory: false,
      seen: false,
      image: "📚",
    },
    {
      id: 8,
      name: "David",
      initials: "DL",
      hasStory: true,
      seen: false,
      image: "⚽",
    },
    {
      id: 9,
      name: "Clara",
      initials: "CM",
      hasStory: true,
      seen: true,
      image: "🎭",
    },
  ]);

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener("resize", checkScrollButtons);
    return () => window.removeEventListener("resize", checkScrollButtons);
  }, []);

  const handleStoryClick = (story: any) => {
    if (story.isUser) {
      toast.info("Ajoutez une story en sélectionnant une photo ou vidéo");
    } else {
      toast.success(`Affichage de la story de ${story.name}`);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 121; // 113px + 8px margin
      const newScrollLeft =
        direction === "left"
          ? scrollRef.current.scrollLeft - scrollAmount
          : scrollRef.current.scrollLeft + scrollAmount;

      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });

      setTimeout(() => {
        checkScrollButtons();
      }, 300);
    }
  };

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  return (
    <div className="relative">
      {/* Chevron gauche avec marge */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-3.75 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 hover:scale-105 active:scale-95"
          aria-label="Stories précédentes"
        >
          <ChevronLeft className="w-7 h-7 text-gray-700 dark:text-gray-300" />
        </button>
      )}

      {/* Chevron droit avec marge */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-3.75 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 hover:scale-105 active:scale-95"
          aria-label="Stories suivantes"
        >
          <ChevronRight className="w-7 h-7 text-gray-700 dark:text-gray-300" />
        </button>
      )}

      {/* Conteneur des stories - Hauteur fixe de 200px, sans padding */}
      <div
        ref={scrollRef}
        onScroll={checkScrollButtons}
        className="flex gap-2 overflow-x-auto h-50 hide-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {stories.map((story) => (
          <button
            key={story.id}
            onClick={() => handleStoryClick(story)}
            className="shrink-0 w-28.25 relative h-full group"
          >
            {/* Conteneur principal de la story */}
            <div
              className={`relative w-full h-full rounded-lg overflow-hidden ${
                story.isUser
                  ? "border-2 border-dashed border-gray-300 dark:border-gray-600"
                  : "ring-1 ring-gray-200 dark:ring-gray-700"
              }`}
            >
              {/* Background de la story */}
              <div className="absolute inset-0 bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] flex items-center justify-center">
                <span className="text-4xl">{story.image}</span>
              </div>

              {/* Avatar dans le coin gauche haut */}
              <div className="absolute top-2 left-2">
                <div
                  className={`relative w-10 h-10 rounded-full ${
                    story.isUser
                      ? "border-2 border-white dark:border-gray-900"
                      : "ring-2 ring-gray-300"
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {story.initials}
                    </span>
                  </div>
                  {story.isUser && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0F4C5C] rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                      <Plus className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Nom de l'utilisateur en bas à gauche avec padding */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/80 to-transparent">
                <p className="text-white font-medium text-sm text-left truncate">
                  {story.name}
                </p>
              </div>

              {/* Overlay au survol */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          </button>
        ))}
      </div>

      {/* Style pour cacher la scrollbar */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
