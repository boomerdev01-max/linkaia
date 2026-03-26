"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, X } from "lucide-react";
import { LiaChatWindow } from "./LiaChatWindow";
import { cn } from "@/lib/utils";

export function LiaButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fermer si clic en dehors
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Effacer le badge quand on ouvre
  useEffect(() => {
    if (isOpen) setHasNewMessage(false);
  }, [isOpen]);

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* ── Fenêtre de chat ─────────────────────────────────────── */}
      <div
        className={cn(
          "w-90 h-140 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 origin-bottom-right",
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        )}
      >
        {isOpen && <LiaChatWindow onClose={() => setIsOpen(false)} />}
      </div>

      {/* ── Bouton flottant ──────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 active:scale-95",
          isOpen
            ? "bg-gray-700 hover:bg-gray-800"
            : "bg-linear-to-br from-[#0F4C5C] to-[#1a7a8a] hover:shadow-xl hover:scale-105"
        )}
        aria-label={isOpen ? "Fermer Lia" : "Ouvrir Lia"}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Sparkles className="w-6 h-6 text-white" />
        )}

        {/* Badge notification */}
        {hasNewMessage && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>
    </div>
  );
}