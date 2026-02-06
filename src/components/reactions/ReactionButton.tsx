// components/reactions/ReactionButton.tsx
"use client";

import { useState } from "react";
import ReactionPicker from "./ReactionPicker";
import { toast } from "sonner";

interface ReactionButtonProps {
  targetType: "post" | "comment";
  targetId: string;
  currentReaction?: {
    code: string;
    emoji: string;
  } | null;
  reactionCounts?: Record<string, number>;
  onReactionChange?: () => void;
}

export default function ReactionButton({
  targetType,
  targetId,
  currentReaction,
  reactionCounts = {},
  onReactionChange,
}: ReactionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleReactionToggle = async (reactionCode: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/reactions/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetType,
          targetId,
          reactionCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.action === "removed") {
          toast.info("Réaction retirée");
        } else if (data.action === "added") {
          toast.success("Réaction ajoutée !");
        } else if (data.action === "updated") {
          toast.info("Réaction modifiée");
        }

        // Appeler le callback pour rafraîchir les données
        if (onReactionChange) {
          onReactionChange();
        }
      } else {
        toast.error(data.error || "Erreur lors de la réaction");
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
      toast.error("Erreur lors de la réaction");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculer le total de réactions
  const totalReactions = Object.values(reactionCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  // Emoji par défaut (Je soutiens)
  const defaultEmoji = "✊";
  const displayEmoji = currentReaction?.emoji || defaultEmoji;

  return (
    <div className="flex items-center gap-2">
      <ReactionPicker
        currentReaction={currentReaction?.code}
        onSelect={handleReactionToggle}
        trigger={
          <button
            onClick={() => {
              // Si pas de réaction actuelle, ajouter la réaction par défaut "support"
              if (!currentReaction) {
                handleReactionToggle("support");
              } else {
                // Sinon, retirer la réaction actuelle
                handleReactionToggle(currentReaction.code);
              }
            }}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              currentReaction
                ? "bg-[#B88A4F]/10 text-[#B88A4F] hover:bg-[#B88A4F]/20"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span className="text-lg">{displayEmoji}</span>
            <span className="font-medium text-sm">
              {currentReaction
                ? currentReaction.code === "support"
                  ? "Soutien"
                  : "Réaction"
                : "Soutenir"}
            </span>
            {totalReactions > 0 && (
              <span className="text-xs font-semibold bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {totalReactions}
              </span>
            )}
          </button>
        }
      />

      {/* Affichage condensé des types de réactions */}
      {totalReactions > 0 && (
        <div className="flex items-center gap-1">
          {Object.entries(reactionCounts)
            .filter(([_, count]) => count > 0)
            .slice(0, 3)
            .map(([code]) => {
              // Mapping code -> emoji
              const emojiMap: Record<string, string> = {
                support: "✊",
                love: "💖",
                laugh: "😂",
                wow: "🤯",
                sad: "🥺",
                angry: "😡",
              };

              return (
                <span
                  key={code}
                  className="text-sm"
                  title={`${reactionCounts[code]} ${code}`}
                >
                  {emojiMap[code]}
                </span>
              );
            })}
        </div>
      )}
    </div>
  );
}
