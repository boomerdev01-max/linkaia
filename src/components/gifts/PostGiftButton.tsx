"use client";
// src/components/gifts/PostGiftButton.tsx
// Bouton cadeau autonome à insérer dans PostCard.tsx.
// Gère l'ouverture du panneau, la sélection du cadeau, l'envoi et le feedback.

import { useState, useEffect } from "react";
import { useWalletBalance } from "@/hooks/useWalletBalance";

interface Gift {
  id: string;
  code: string;
  name: string;
  lgemsValue: number;
  animationUrl: string | null;
  isImpactGift: boolean;
}

interface PostGiftButtonProps {
  /** ID du post concerné */
  postId: string;
  /** ID du créateur du post (receiver) */
  authorId: string;
  /** Ne pas afficher si l'user courant est l'auteur */
  currentUserId: string;
}

function getGiftEmoji(lgems: number): string {
  if (lgems >= 500) return "👑";
  if (lgems >= 200) return "💎";
  if (lgems >= 100) return "🌹";
  if (lgems >= 50) return "🌟";
  if (lgems >= 20) return "🔥";
  return "💝";
}

export function PostGiftButton({
  postId,
  authorId,
  currentUserId,
}: PostGiftButtonProps) {
  const [open, setOpen] = useState(false);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selected, setSelected] = useState<Gift | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [giftsLoaded, setGiftsLoaded] = useState(false);
  const { balance, refresh: refreshBalance } = useWalletBalance();

  // Ne pas afficher pour l'auteur du post
  if (currentUserId === authorId) return null;

  // Charger le catalogue au premier clic
  const handleOpen = async () => {
    setOpen(true);
    if (!giftsLoaded) {
      try {
        const res = await fetch("/api/gifts/catalog");
        const data = await res.json();
        const list = data.gifts ?? data.data ?? [];
        setGifts(
          list.map((g: Gift) => ({ ...g, emoji: getGiftEmoji(g.lgemsValue) })),
        );
        setGiftsLoaded(true);
      } catch {
        /* silencieux */
      }
    }
  };

  async function handleSend() {
    if (!selected || sending) return;
    setSending(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/gifts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftId: selected.id,
          receiverId: authorId,
          postId,
          message: message.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({
          type: "err",
          text: data.error ?? "Erreur lors de l'envoi",
        });
      } else {
        setFeedback({ type: "ok", text: `${selected.name} envoyé ! 🎉` });
        await refreshBalance();
        setTimeout(() => {
          setOpen(false);
          setSelected(null);
          setMessage("");
          setFeedback(null);
        }, 1500);
      }
    } catch {
      setFeedback({ type: "err", text: "Erreur réseau" });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Bouton déclencheur */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
        title="Envoyer un cadeau"
      >
        <span>🎁</span>
        <span className="hidden sm:inline text-xs">Cadeau</span>
      </button>

      {/* Panel overlay */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
            style={{
              background: "linear-gradient(180deg, #0d1117 0%, #0a0e1a 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              animation: "slideUpPanel 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              maxHeight: "65vh",
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header panel */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div>
                <p className="text-white font-semibold text-sm">
                  Envoyer un cadeau
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#f59e0b" }}>
                  💎 {(balance?.lgemsBalance ?? 0).toLocaleString()} L-Gems
                  disponibles
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/40 hover:text-white/80 text-xl"
              >
                ✕
              </button>
            </div>

            <div
              className="overflow-y-auto"
              style={{ maxHeight: "calc(65vh - 100px)" }}
            >
              {/* Grille cadeaux */}
              {!giftsLoaded ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2.5 p-4">
                  {gifts.map((gift) => {
                    const canAfford =
                      (balance?.lgemsBalance ?? 0) >= gift.lgemsValue;
                    const isSelected = selected?.id === gift.id;
                    return (
                      <button
                        key={gift.id}
                        onClick={() => setSelected(isSelected ? null : gift)}
                        disabled={!canAfford}
                        className="flex flex-col items-center gap-1.5 rounded-2xl p-2.5 transition-all"
                        style={{
                          background: isSelected
                            ? "rgba(245,158,11,0.2)"
                            : "rgba(255,255,255,0.04)",
                          border: isSelected
                            ? "1px solid rgba(245,158,11,0.5)"
                            : "1px solid rgba(255,255,255,0.06)",
                          opacity: canAfford ? 1 : 0.35,
                          transform: isSelected ? "scale(1.05)" : "scale(1)",
                        }}
                      >
                        <span className="text-2xl">
                          {getGiftEmoji(gift.lgemsValue)}
                        </span>
                        <span className="text-[10px] text-white/60 text-center line-clamp-1">
                          {gift.name}
                        </span>
                        <span
                          className="text-[10px] font-bold"
                          style={{ color: "#f59e0b" }}
                        >
                          {gift.lgemsValue} 💎
                        </span>
                        {gift.isImpactGift && (
                          <span className="text-[8px] text-emerald-400">
                            🌱
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Message + envoi */}
              {selected && (
                <div className="px-4 pb-5 space-y-3">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ajouter un message… (optionnel)"
                    maxLength={100}
                    className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />

                  {feedback && (
                    <p
                      className="text-center text-sm font-medium"
                      style={{
                        color: feedback.type === "ok" ? "#34d399" : "#f87171",
                      }}
                    >
                      {feedback.text}
                    </p>
                  )}

                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="w-full py-3 rounded-2xl font-semibold text-white text-sm transition-all active:scale-95"
                    style={{
                      background: sending
                        ? "rgba(245,158,11,0.3)"
                        : "linear-gradient(135deg, #f59e0b, #ea580c)",
                      boxShadow: sending
                        ? "none"
                        : "0 4px 20px rgba(245,158,11,0.3)",
                    }}
                  >
                    {sending
                      ? "Envoi…"
                      : `Envoyer ${selected.name} · ${selected.lgemsValue} 💎`}
                  </button>
                </div>
              )}
            </div>
          </div>

          <style>{`
            @keyframes slideUpPanel {
              from { transform: translateY(100%); opacity: 0.6; }
              to   { transform: translateY(0);    opacity: 1; }
            }
          `}</style>
        </>
      )}
    </>
  );
}
