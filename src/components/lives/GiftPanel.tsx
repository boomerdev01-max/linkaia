"use client";
// src/components/lives/GiftPanel.tsx
// Panneau de sélection et envoi de cadeaux pendant un live
// Slides depuis le bas, affiche le catalogue, gère l'envoi + feedback

import { useState, useEffect } from "react";

interface Gift {
  id: string;
  code: string;
  name: string;
  lgemsValue: number;
  animationUrl: string | null;
  emoji: string;
  isImpactGift: boolean;
}

interface GiftPanelProps {
  liveId: string;
  lgemsBalance: number;
  onClose: () => void;
  onGiftSent?: (gift: Gift) => void;
}

// Emojis par défaut selon la valeur
function getGiftEmoji(lgems: number): string {
  if (lgems >= 500) return "👑";
  if (lgems >= 200) return "💎";
  if (lgems >= 100) return "🌹";
  if (lgems >= 50)  return "🌟";
  if (lgems >= 20)  return "🔥";
  return "💝";
}

export function GiftPanel({ liveId, lgemsBalance, onClose, onGiftSent }: GiftPanelProps) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selected, setSelected] = useState<Gift | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gifts/catalog")
      .then((r) => r.json())
      .then((data) => {
        const enriched = (data.gifts ?? []).map((g: Gift) => ({
          ...g,
          emoji: getGiftEmoji(g.lgemsValue),
        }));
        setGifts(enriched);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSend() {
    if (!selected || sending) return;
    if (lgemsBalance < selected.lgemsValue) {
      setFeedback({ type: "error", text: "Solde L-Gems insuffisant 💸" });
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/lives/${liveId}/gift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftCode: selected.code, message }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: "error", text: data.error ?? "Erreur lors de l'envoi" });
      } else {
        setFeedback({ type: "success", text: `${selected.name} envoyé ! 🎉` });
        onGiftSent?.(selected);
        setSelected(null);
        setMessage("");
        setTimeout(onClose, 1200);
      }
    } catch {
      setFeedback({ type: "error", text: "Erreur réseau" });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
        style={{
          background: "linear-gradient(180deg, #0d1117 0%, #0a0e1a 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          maxHeight: "70vh",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/08">
          <div>
            <p className="text-white font-semibold text-base">Envoyer un cadeau</p>
            <p className="text-xs mt-0.5" style={{ color: "#f59e0b" }}>
              💎 {lgemsBalance.toLocaleString()} L-Gems
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 120px)" }}>
          {/* Grille cadeaux */}
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 p-4">
              {gifts.map((gift) => {
                const canAfford = lgemsBalance >= gift.lgemsValue;
                const isSelected = selected?.code === gift.code;
                return (
                  <button
                    key={gift.code}
                    onClick={() => setSelected(isSelected ? null : gift)}
                    disabled={!canAfford}
                    className="flex flex-col items-center gap-1.5 rounded-2xl p-3 transition-all duration-200"
                    style={{
                      background: isSelected
                        ? "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(234,88,12,0.15))"
                        : "rgba(255,255,255,0.04)",
                      border: isSelected
                        ? "1px solid rgba(245,158,11,0.6)"
                        : "1px solid rgba(255,255,255,0.06)",
                      opacity: canAfford ? 1 : 0.4,
                      transform: isSelected ? "scale(1.05)" : "scale(1)",
                    }}
                  >
                    <span className="text-3xl">{gift.emoji}</span>
                    <span className="text-[10px] text-white/60 font-medium text-center leading-tight line-clamp-2">
                      {gift.name}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(245,158,11,0.15)",
                        color: "#f59e0b",
                      }}
                    >
                      {gift.lgemsValue} 💎
                    </span>
                    {gift.isImpactGift && (
                      <span className="text-[8px] text-emerald-400">🌱 Impact</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Message optionnel + bouton envoi */}
          {selected && (
            <div className="px-4 pb-6 space-y-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ajouter un message... (optionnel)"
                maxLength={100}
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />

              {feedback && (
                <p
                  className="text-center text-sm font-medium"
                  style={{ color: feedback.type === "success" ? "#34d399" : "#f87171" }}
                >
                  {feedback.text}
                </p>
              )}

              <button
                onClick={handleSend}
                disabled={sending}
                className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm transition-all duration-200 active:scale-95"
                style={{
                  background: sending
                    ? "rgba(245,158,11,0.3)"
                    : "linear-gradient(135deg, #f59e0b, #ea580c)",
                  boxShadow: sending ? "none" : "0 4px 24px rgba(245,158,11,0.35)",
                }}
              >
                {sending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Envoi…
                  </span>
                ) : (
                  `Envoyer ${selected.name} · ${selected.lgemsValue} L-Gems`
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0.5; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}