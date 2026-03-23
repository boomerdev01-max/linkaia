"use client";
// src/components/lives/LiveGiftAnimation.tsx
// Animation "burst" qui apparaît en overlay lors d'un gros cadeau
// Se déclenche automatiquement quand lgemsValue >= threshold

import { useEffect, useState } from "react";
import type { LiveGiftEvent } from "@/hooks/useLiveGifts";

interface LiveGiftAnimationProps {
  gift: LiveGiftEvent | null;
  /** Seuil en L-Gems à partir duquel l'animation burst se déclenche (défaut: 50) */
  burstThreshold?: number;
}

export function LiveGiftAnimation({
  gift,
  burstThreshold = 50,
}: LiveGiftAnimationProps) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<LiveGiftEvent | null>(null);

  useEffect(() => {
    if (!gift || gift.lgemsValue < burstThreshold) return;
    setCurrent(gift);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, [gift, burstThreshold]);

  if (!visible || !current) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-9999 flex items-center justify-center"
      aria-hidden
    >
      {/* Fond radial burst */}
      <div
        className="absolute inset-0 animate-[fadeIn_0.3s_ease,fadeOut_0.5s_ease_3.5s_forwards]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(251,191,36,0.18) 0%, transparent 70%)",
        }}
      />

      {/* Particules étoiles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="absolute text-yellow-300 text-2xl select-none"
          style={
            {
              animation: `burst-particle 1.2s ease-out ${i * 0.06}s both`,
              "--angle": `${(i / 12) * 360}deg`,
              "--dist": `${90 + Math.random() * 80}px`,
            } as React.CSSProperties
          }
        >
          ✦
        </span>
      ))}

      {/* Carte cadeau centrale */}
      <div
        className="relative flex flex-col items-center gap-3 rounded-3xl px-10 py-6 text-center shadow-2xl"
        style={{
          background:
            "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          border: "1px solid rgba(251,191,36,0.4)",
          animation: "giftCardIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        {/* Emoji / icône cadeau */}
        <span
          className="text-5xl"
          style={{ filter: "drop-shadow(0 0 12px rgba(251,191,36,0.8))" }}
        >
          🎁
        </span>

        <div>
          <p className="text-xs uppercase tracking-widest text-yellow-400/70 mb-1">
            Cadeau reçu
          </p>
          <p className="text-xl font-bold text-white">{current.giftName}</p>
        </div>

        <div className="flex items-center gap-2">
          {current.sender.avatar ? (
            <img
              src={current.sender.avatar}
              alt={current.sender.name}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-yellow-400/20 flex items-center justify-center text-xs text-yellow-400">
              {current.sender.name[0]}
            </div>
          )}
          <p className="text-sm text-yellow-200">
            <span className="font-semibold">{current.sender.name}</span> ·{" "}
            {current.lgemsValue} L-Gems
          </p>
        </div>

        {current.message && (
          <p className="text-sm text-white/60 italic max-w-50 line-clamp-2">
            "{current.message}"
          </p>
        )}
      </div>

      <style>{`
        @keyframes burst-particle {
          0%   { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(
                   calc(cos(var(--angle)) * var(--dist)),
                   calc(sin(var(--angle)) * var(--dist))
                 ) scale(0); opacity: 0; }
        }
        @keyframes giftCardIn {
          from { transform: scale(0.5) translateY(30px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeOut { from { opacity:1 } to { opacity:0 } }
      `}</style>
    </div>
  );
}
