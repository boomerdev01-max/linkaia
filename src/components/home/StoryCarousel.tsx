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

// ✅ TYPAGE EXPLICITE AVEC UNION DISCRIMINÉE
type DisplayItem =
  | { type: "user"; story: Story }
  | { type: "user-empty" }
  | { type: "static"; static: (typeof STATIC_STORIES)[number] }
  | { type: "real"; story: Story };

export default function StoryCarousel({ user }: StoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
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

  const handleStoryClick = (
    index: number,
    isUserStory: boolean,
    isStatic: boolean,
  ) => {
    if (isUserStory) {
      setShowCreateModal(true);
    } else if (isStatic) {
      toast.info("Ceci est un exemple de story");
    } else {
      const userStoryCount = stories.some((s) => s.userId === user.id) ? 1 : 0;
      const realIndex = index - STATIC_STORIES.length - userStoryCount;
      const otherUsersStories = stories.filter((s) => s.userId !== user.id);

      setViewerStartIndex(realIndex);
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

  // Construire la liste d'affichage avec le type correct
  const userStory = stories.find((s) => s.userId === user.id);
  const otherUsersStories = stories.filter((s) => s.userId !== user.id);

  // ✅ LISTE TYPÉE EXPLICITEMENT
  const displayItems: DisplayItem[] = [
    ...(userStory
      ? [{ type: "user" as const, story: userStory }]
      : [{ type: "user-empty" as const }]),
    ...STATIC_STORIES.map((s) => ({ type: "static" as const, static: s })),
    ...otherUsersStories.map((s) => ({ type: "real" as const, story: s })),
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
            const isUserStory =
              item.type === "user" || item.type === "user-empty";
            const isStatic = item.type === "static";
            const isReal = item.type === "real";

            let name = "";
            let initials = "";
            let image = "";
            let hasViewed = false;
            let profilePhoto: string | null | undefined = null;

            // ✅ TYPE NARROWING EXPLICITE
            if (item.type === "user" || item.type === "user-empty") {
              name = "Votre story";
              initials = `${user.prenom.charAt(0)}${user.nom.charAt(0)}`;
              image = "🌟";
            } else if (item.type === "static") {
              // TypeScript sait maintenant que item.static existe
              name = item.static.name;
              initials = item.static.initials;
              image = item.static.image;
            } else if (item.type === "real") {
              // TypeScript sait maintenant que item.story existe
              const story = item.story;
              name =
                story.user.profil?.pseudo ||
                `${story.user.prenom} ${story.user.nom}`;
              initials = `${story.user.prenom.charAt(0)}${story.user.nom.charAt(0)}`;
              image = story.slides[0]?.type === "TEXT" ? "📝" : "📸";
              hasViewed = story.hasViewed;
              profilePhoto = story.user.profil?.profilePhotoUrl;
            }

            const ringColor =
              isUserStory || isStatic
                ? "ring-gray-300"
                : hasViewed
                  ? "ring-gray-400"
                  : "ring-gradient";

            return (
              <button
                key={`${item.type}-${index}`}
                onClick={() => handleStoryClick(index, isUserStory, isStatic)}
                className="shrink-0 w-28.25 relative h-full group"
              >
                <div
                  className={`relative w-full h-full rounded-lg overflow-hidden ${
                    isUserStory && item.type === "user-empty"
                      ? "border-2 border-dashed border-gray-300 dark:border-gray-600"
                      : !hasViewed && !isUserStory && !isStatic
                        ? "ring-2 ring-[#FF5A5F]"
                        : "ring-1 ring-gray-200 dark:ring-gray-700"
                  }`}
                >
                  {/* Background */}
                  <div className="absolute inset-0 bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] flex items-center justify-center">
                    <span className="text-4xl">{image}</span>
                  </div>

                  {/* Avatar */}
                  <div className="absolute top-2 left-2">
                    <div
                      className={`relative w-10 h-10 rounded-full ${
                        isUserStory
                          ? "border-2 border-white dark:border-gray-900"
                          : "ring-2 ring-gray-300"
                      }`}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] flex items-center justify-center">
                        {profilePhoto ? (
                          <img
                            src={profilePhoto}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-sm">
                            {initials}
                          </span>
                        )}
                      </div>
                      {isUserStory && item.type === "user-empty" && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0F4C5C] rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                          <Plus className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name */}
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
          })}
        </div>

        {/* Style scrollbar */}
        <style jsx>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>

      {/* Modals */}
      <CreateStoryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onStoryCreated={() => {
          fetchStories();
          setShowCreateModal(false);
        }}
      />

      {showViewer && (
        <StoryViewer
          stories={otherUsersStories}
          initialStoryIndex={viewerStartIndex}
          onClose={() => setShowViewer(false)}
          onStoryChange={(index) => setViewerStartIndex(index)}
        />
      )}
    </>
  );
}
