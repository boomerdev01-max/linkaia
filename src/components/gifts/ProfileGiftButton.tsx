"use client";
// src/components/gifts/ProfileGiftButton.tsx
// Bouton "Offrir un cadeau" affiché sur la page profil d'un créateur.
// Réutilise la même logique que PostGiftButton mais sans postId ni liveId.

import { useState } from "react";
import { useWalletBalance } from "@/hooks/useWalletBalance";

interface Gift {
  id: string;
  code: string;
  name: string;
  lgemsValue: number;
  isImpactGift: boolean;
}

interface ProfileGiftButtonProps {
  profileUserId: string; // receiver
  currentUserId: string;
  profileName: string;
}

function getGiftEmoji(lgems: number): string {
  if (lgems >= 500) return "👑";
  if (lgems >= 200) return "💎";
  if (lgems >= 100) return "🌹";
  if (lgems >= 50) return "🌟";
  if (lgems >= 20) return "🔥";
  return "💝";
}

export function ProfileGiftButton({
  profileUserId,
  currentUserId,
  profileName,
}: ProfileGiftButtonProps) {
  const [open, setOpen] = useState(false);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selected, setSelected] = useState<Gift | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { balance, refresh } = useWalletBalance();

  if (currentUserId === profileUserId) return null;

  const handleOpen = async () => {
    setOpen(true);
    if (!loaded) {
      const res = await fetch("/api/gifts/catalog");
      const data = await res.json();
      setGifts((data.gifts ?? data.data ?? []).map((g: Gift) => ({ ...g })));
      setLoaded(true);
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
          receiverId: profileUserId,
          message: message.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "err", text: data.error ?? "Erreur" });
      } else {
        setFeedback({
          type: "ok",
          text: `${selected.name} envoyé à ${profileName} ! 🎉`,
        });
        await refresh();
        setTimeout(() => {
          setOpen(false);
          setSelected(null);
          setMessage("");
          setFeedback(null);
        }, 1600);
      }
    } catch {
      setFeedback({ type: "err", text: "Erreur réseau" });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* CTA principal sur le profil */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm text-white transition-all hover:scale-105 active:scale-95"
        style={{
          background:
            "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(234,88,12,0.15))",
          border: "1px solid rgba(245,158,11,0.4)",
        }}
      >
        🎁 Offrir un cadeau
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
            style={{
              background: "linear-gradient(180deg, #0d1117, #0a0e1a)",
              border: "1px solid rgba(255,255,255,0.08)",
              animation: "slideUpPanel 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              maxHeight: "65vh",
            }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div>
                <p className="text-white font-semibold text-sm">
                  Offrir à {profileName}
                </p>
                <p className="text-xs mt-0.5 text-yellow-400/70">
                  💎 {(balance?.lgemsBalance ?? 0).toLocaleString()} L-Gems
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/40 hover:text-white/70 text-xl"
              >
                ✕
              </button>
            </div>

            <div
              className="overflow-y-auto"
              style={{ maxHeight: "calc(65vh - 100px)" }}
            >
              {!loaded ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2.5 p-4">
                  {gifts.map((gift) => {
                    const canAfford =
                      (balance?.lgemsBalance ?? 0) >= gift.lgemsValue;
                    const isSel = selected?.id === gift.id;
                    return (
                      <button
                        key={gift.id}
                        onClick={() => setSelected(isSel ? null : gift)}
                        disabled={!canAfford}
                        className="flex flex-col items-center gap-1 rounded-2xl p-2.5 transition-all"
                        style={{
                          background: isSel
                            ? "rgba(245,158,11,0.2)"
                            : "rgba(255,255,255,0.04)",
                          border: isSel
                            ? "1px solid rgba(245,158,11,0.5)"
                            : "1px solid rgba(255,255,255,0.06)",
                          opacity: canAfford ? 1 : 0.35,
                          transform: isSel ? "scale(1.05)" : "scale(1)",
                        }}
                      >
                        <span className="text-2xl">
                          {getGiftEmoji(gift.lgemsValue)}
                        </span>
                        <span className="text-[10px] text-white/60 text-center line-clamp-1">
                          {gift.name}
                        </span>
                        <span className="text-[10px] font-bold text-yellow-400">
                          {gift.lgemsValue} 💎
                        </span>
                        {gift.isImpactGift && (
                          <span className="text-[8px] text-emerald-400">
                            🌱 Impact
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {selected && (
                <div className="px-4 pb-5 space-y-3">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Un message pour accompagner le cadeau…"
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
                      : `Offrir ${selected.name} · ${selected.lgemsValue} 💎`}
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
