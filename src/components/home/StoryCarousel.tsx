// src/components/home/StoryCarousel.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import CreateStoryModal from "./CreateStoryModal";
import StoryViewer from "./StoryViewer";

interface User {
  id: string;
  nom: string;
  prenom: string;
  pseudo: string;
  email: string;
  image?: string | null;
}

interface StorySlide {
  id: string;
  type: string;
  order: number;
  mediaUrl?: string;
  thumbnailUrl?: string;
  textContent?: string;
  bgColor?: string;
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

interface StoryCarouselProps {
  user: User;
}

// Stories statiques pour remplir le carousel
const STATIC_STORIES = [
  { id: "static-1", name: "Marie", initials: "MD", image: "🏔️" },
  { id: "static-2", name: "Thomas", initials: "TM", image: "🚀" },
  { id: "static-3", name: "Sophie", initials: "SB", image: "☕" },
  { id: "static-4", name: "Lucas", initials: "LP", image: "🎮" },
];

// ✅ Un bloc = un utilisateur avec toutes ses stories
type DisplayItem =
  | { type: "user-own"; story: Story | null } // Propre story (peut être null si pas de story)
  | { type: "static"; static: (typeof STATIC_STORIES)[number] }
  | { type: "real"; story: Story; userId: string }; // Story d'un autre user

export default function StoryCarousel({ user }: StoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [viewerStories, setViewerStories] = useState<Story[]>([]);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);

  useEffect(() => {
    fetchStories();
    checkScrollButtons();
    window.addEventListener("resize", checkScrollButtons);
    return () => window.removeEventListener("resize", checkScrollButtons);
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/stories");
      if (!response.ok) {
        console.error("Error fetching stories:", response.status);
        return;
      }
      const data = await response.json();
      if (data.success) {
        setStories(data.data.stories);
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Récupérer la propre story de l'utilisateur
  const userStory = stories.find((s) => s.userId === user.id) || null;

  // ✅ Stories des autres utilisateurs (une par utilisateur)
  const otherUsersStories = stories.filter((s) => s.userId !== user.id);

  const handleStoryClick = (item: DisplayItem) => {
    if (item.type === "user-own") {
      if (item.story) {
        // ✅ L'utilisateur a une story → il peut la voir
        setViewerStories([item.story]);
        setViewerStartIndex(0);
        setShowViewer(true);
      } else {
        // Pas de story → ouvrir le créateur
        setShowCreateModal(true);
      }
    } else if (item.type === "static") {
      toast.info("Ceci est un exemple de story");
    } else if (item.type === "real") {
      const index = otherUsersStories.findIndex(
        (s) => s.userId === item.userId,
      );
      setViewerStories(otherUsersStories);
      setViewerStartIndex(Math.max(0, index));
      setShowViewer(true);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 121;
      const newScrollLeft =
        direction === "left"
          ? scrollRef.current.scrollLeft - scrollAmount
          : scrollRef.current.scrollLeft + scrollAmount;

      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });

      setTimeout(checkScrollButtons, 300);
    }
  };

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // ✅ Construire la liste d'affichage : 1 bloc = 1 utilisateur
  const displayItems: DisplayItem[] = [
    // 1. Propre story (ou bouton créer)
    { type: "user-own", story: userStory },
    // 2. Stories statiques (placeholder)
    ...STATIC_STORIES.map((s) => ({ type: "static" as const, static: s })),
    // 3. Une entrée par autre utilisateur
    ...otherUsersStories.map((s) => ({
      type: "real" as const,
      story: s,
      userId: s.userId,
    })),
  ];

  return (
    <>
      <div className="relative">
        {/* Chevron gauche */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-3.75 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 hover:scale-105 active:scale-95"
            aria-label="Stories précédentes"
          >
            <ChevronLeft className="w-7 h-7 text-gray-700 dark:text-gray-300" />
          </button>
        )}

        {/* Chevron droit */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-3.75 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 hover:scale-105 active:scale-95"
            aria-label="Stories suivantes"
          >
            <ChevronRight className="w-7 h-7 text-gray-700 dark:text-gray-300" />
          </button>
        )}

        {/* Conteneur des stories */}
        <div
          ref={scrollRef}
          onScroll={checkScrollButtons}
          className="flex gap-2 overflow-x-auto h-50 hide-scrollbar"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {displayItems.map((item, index) => {
            // ─── Propre story ───────────────────────────────────────
            if (item.type === "user-own") {
              const hasStory = !!item.story;
              const initials = `${user.prenom.charAt(0)}${user.nom.charAt(0)}`;

              return (
                <button
                  key="user-own"
                  onClick={() => handleStoryClick(item)}
                  className="shrink-0 w-28.25 relative h-full group"
                >
                  <div
                    className={`relative w-full h-full rounded-lg overflow-hidden ${
                      hasStory
                        ? "ring-2 ring-[#0F4C5C]"
                        : "border-2 border-dashed border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {/* Background */}
                    <div className="absolute inset-0 bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] flex items-center justify-center">
                      <span className="text-4xl">🌟</span>
                    </div>

                    {/* Avatar + badge */}
                    <div className="absolute top-2 left-2">
                      <div className="relative w-10 h-10 rounded-full border-2 border-white dark:border-gray-900">
                        <div className="w-full h-full rounded-full overflow-hidden bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {initials}
                          </span>
                        </div>
                        {/* ✅ Si pas de story → icône + pour créer */}
                        {!hasStory && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0F4C5C] rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                            <Plus className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {/* ✅ Si a une story → icône œil pour voir */}
                        {hasStory && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#FF5A5F] rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                            <span className="text-white text-[8px]">▶</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Barre de progression (si story existante) */}
                    {hasStory && item.story && (
                      <div className="absolute top-1 left-1 right-1 flex gap-0.5">
                        {item.story.slides.map((_, i) => (
                          <div
                            key={i}
                            className="flex-1 h-0.5 bg-white/80 rounded-full"
                          />
                        ))}
                      </div>
                    )}

                    {/* Nom */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/80 to-transparent">
                      <p className="text-white font-medium text-sm text-left truncate">
                        {hasStory ? "Votre story" : "Ajouter"}
                      </p>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                </button>
              );
            }

            // ─── Story statique (placeholder) ───────────────────────
            if (item.type === "static") {
              return (
                <button
                  key={item.static.id}
                  onClick={() => handleStoryClick(item)}
                  className="shrink-0 w-28.25 relative h-full group"
                >
                  <div className="relative w-full h-full rounded-lg overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
                    <div className="absolute inset-0 bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] flex items-center justify-center">
                      <span className="text-4xl">{item.static.image}</span>
                    </div>
                    <div className="absolute top-2 left-2">
                      <div className="w-10 h-10 rounded-full ring-2 ring-gray-300 overflow-hidden bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {item.static.initials}
                        </span>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/80 to-transparent">
                      <p className="text-white font-medium text-sm text-left truncate">
                        {item.static.name}
                      </p>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                </button>
              );
            }

            // ─── Story d'un autre utilisateur ───────────────────────
            if (item.type === "real") {
              const story = item.story;
              const name =
                story.user.profil?.pseudo ||
                `${story.user.prenom} ${story.user.nom}`;
              const initials = `${story.user.prenom.charAt(0)}${story.user.nom.charAt(0)}`;
              const profilePhoto = story.user.profil?.profilePhotoUrl;
              const hasViewed = story.hasViewed;
              const slideCount = story.slides.length;

              return (
                <button
                  key={`real-${story.userId}`}
                  onClick={() => handleStoryClick(item)}
                  className="shrink-0 w-28.25 relative h-full group"
                >
                  <div
                    className={`relative w-full h-full rounded-lg overflow-hidden ${
                      hasViewed
                        ? "ring-1 ring-gray-400"
                        : "ring-2 ring-[#FF5A5F]"
                    }`}
                  >
                    {/* Barres de progression en haut (1 barre par slide) */}
                    {slideCount > 1 && (
                      <div className="absolute top-1 left-1 right-1 z-10 flex gap-0.5">
                        {story.slides.map((_, i) => (
                          <div
                            key={i}
                            className={`flex-1 h-0.5 rounded-full ${
                              hasViewed ? "bg-white/50" : "bg-white/80"
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Background */}
                    <div className="absolute inset-0 bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] flex items-center justify-center">
                      <span className="text-4xl">
                        {story.slides[0]?.type === "TEXT" ? "📝" : "📸"}
                      </span>
                    </div>

                    {/* Avatar */}
                    <div className="absolute top-2 left-2">
                      <div
                        className={`w-10 h-10 rounded-full overflow-hidden ${
                          hasViewed
                            ? "ring-2 ring-gray-400"
                            : "ring-2 ring-[#FF5A5F]"
                        }`}
                      >
                        {profilePhoto ? (
                          <img
                            src={profilePhoto}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {initials}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nom */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/80 to-transparent">
                      <p className="text-white font-medium text-sm text-left truncate">
                        {name}
                      </p>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                </button>
              );
            }

            return null;
          })}
        </div>

        {/* Style scrollbar */}
        <style jsx>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>

      {/* Modal création */}
      <CreateStoryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onStoryCreated={() => {
          fetchStories();
          setShowCreateModal(false);
        }}
      />

      {/* Viewer */}
      {showViewer && viewerStories.length > 0 && (
        <StoryViewer
          stories={viewerStories}
          initialStoryIndex={viewerStartIndex}
          onClose={() => {
            setShowViewer(false);
            setViewerStories([]);
          }}
          onStoryChange={(index) => setViewerStartIndex(index)}
        />
      )}
    </>
  );
}