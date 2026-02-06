// components/reactions/ReactionPicker.tsx
"use client";

import { useState, useEffect, useRef } from "react";

export interface ReactionType {
  code: string;
  label: string;
  emoji: string;
  order: number;
}

interface ReactionPickerProps {
  onSelect: (reactionCode: string) => void;
  currentReaction?: string | null;
  trigger: React.ReactNode;
}

export default function ReactionPicker({
  onSelect,
  currentReaction,
  trigger,
}: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reactions, setReactions] = useState<ReactionType[]>([]);
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chargement des réactions (inchangé)
  useEffect(() => {
    fetch("/api/reactions/toggle")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setReactions(data.data);
        } else {
          console.warn("Aucune réaction chargée", data);
        }
      })
      .catch((err) => console.error("Erreur chargement réactions", err));
  }, []);

  const openPicker = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
    setIsOpen(true);
  };

  const closePicker = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 250); // ← petit délai pour pouvoir cliquer sans que ça ferme trop vite
  };

  const handleReactionClick = (reactionCode: string) => {
    onSelect(reactionCode);
    setIsOpen(false);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={openPicker}
      onMouseLeave={closePicker}
      // Optionnel mais très utile sur trackpad / tactile :
      onPointerEnter={openPicker}
      onPointerLeave={closePicker}
    >
      {/* Trigger */}
      <div>{trigger}</div>

      {/* Picker */}
      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5 flex items-center gap-1.5">
            {reactions.length === 0 ? (
              <div className="px-4 py-1 text-gray-400 text-sm">
                Chargement...
              </div>
            ) : (
              reactions.map((reaction) => (
                <button
                  key={reaction.code}
                  onClick={() => handleReactionClick(reaction.code)}
                  className={`
                    w-11 h-11 flex items-center justify-center rounded-full 
                    hover:bg-gray-100 dark:hover:bg-gray-700 transition-all
                    ${currentReaction === reaction.code ? "bg-amber-100/60 ring-2 ring-amber-500" : ""}
                  `}
                  title={reaction.label}
                >
                  <span className="text-2xl">{reaction.emoji}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
