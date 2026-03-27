// components/chat/IncomingCallModal.tsx
"use client";

import { useEffect, useRef } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CallSession } from "@/types/chat";

interface IncomingCallModalProps {
  callSession: CallSession;
  onAnswer: () => Promise<void>;
  onReject: () => void;
}

export function IncomingCallModal({
  callSession,
  onAnswer,
  onReject,
}: IncomingCallModalProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const caller = callSession.caller;
  const callerName = caller.pseudo || `${caller.prenom} ${caller.nom}`.trim();
  const isVideo = callSession.type === "video";

  // ── Sonnerie ────────────────────────────────────────────────────────────
  useEffect(() => {
    // Sonnerie via Web Audio API — pas besoin de fichier externe
    const AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    let stopped = false;

    // Génère une tonalité de sonnerie simple (deux bips courts en boucle)
    const playRing = () => {
      if (stopped) return;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(480, ctx.currentTime);
      oscillator.frequency.setValueAtTime(440, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);

      // Répéter toutes les 1.5s
      const timer = setTimeout(() => playRing(), 1500);
      oscillator.onended = () => {
        if (stopped) clearTimeout(timer);
      };
    };

    playRing();

    return () => {
      stopped = true;
      ctx.close();
    };
  }, []);

  return (
    // Backdrop semi-transparent
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Card */}
      <div
        className={cn(
          "relative z-10 w-full max-w-sm rounded-3xl overflow-hidden",
          "bg-linear-to-b from-gray-900 to-gray-800 shadow-2xl",
          "animate-in slide-in-from-bottom-4 duration-300",
        )}
      >
        {/* En-tête */}
        <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-[#0F4C5C] overflow-hidden ring-4 ring-white/10">
              {caller.profilePhotoUrl ? (
                <img
                  src={caller.profilePhotoUrl}
                  alt={callerName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">
                    {callerName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Indicateur type d'appel */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#0F4C5C] flex items-center justify-center ring-2 ring-gray-800">
              {isVideo ? (
                <Video className="w-4 h-4 text-white" />
              ) : (
                <Phone className="w-4 h-4 text-white" />
              )}
            </div>
          </div>

          {/* Nom + libellé */}
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Appel {isVideo ? "vidéo" : "audio"} entrant
            </p>
            <h2 className="text-xl font-semibold text-white">{callerName}</h2>
          </div>

          {/* Animation "en sonnerie" */}
          <div className="flex gap-1.5 items-center">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-green-400"
                style={{
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-around px-8 pb-8">
          {/* Refuser */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onReject}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center",
                "bg-red-500 hover:bg-red-600 active:scale-95",
                "transition-all duration-150 shadow-lg shadow-red-500/30",
              )}
              aria-label="Refuser l'appel"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </button>
            <span className="text-xs text-gray-400">Refuser</span>
          </div>

          {/* Accepter */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onAnswer}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center",
                "bg-green-500 hover:bg-green-600 active:scale-95",
                "transition-all duration-150 shadow-lg shadow-green-500/30",
                // Légère animation de pulsation pour attirer l'attention
                "animate-pulse",
              )}
              aria-label="Accepter l'appel"
            >
              {isVideo ? (
                <Video className="w-7 h-7 text-white" />
              ) : (
                <Phone className="w-7 h-7 text-white" />
              )}
            </button>
            <span className="text-xs text-gray-400">Accepter</span>
          </div>
        </div>
      </div>

      {/* Keyframes pour les points de sonnerie */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}
