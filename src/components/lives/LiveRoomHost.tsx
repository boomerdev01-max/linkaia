"use client";
// src/components/lives/LiveRoomHost.tsx
// Vue host : caméra + stats + contrôles + flux de cadeaux entrants

import { useState, useEffect, useCallback } from "react";
import {
  LiveKitRoom,
  VideoConference,
  useParticipants,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { useLiveGifts } from "@/hooks/useLiveGifts";
import { LiveGiftAnimation } from "@/components/lives/LiveGiftAnimation";

interface HostStats {
  viewerCount: number;
  totalGiftsReceived: number;
  totalLgemsReceived: number;
}

interface LiveRoomHostProps {
  liveId: string;
  liveTitle: string;
  token: string;
  serverUrl: string;
  onEnd: () => void;
}

function HostOverlay({
  liveId,
  liveTitle,
  onEnd,
}: {
  liveId: string;
  liveTitle: string;
  onEnd: () => void;
}) {
  const participants = useParticipants();
  const room = useRoomContext();
  const { gifts, lastGift } = useLiveGifts(liveId);
  const [isEnding, setIsEnding] = useState(false);
  const [totalLgems, setTotalLgems] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  // Timer durée
  useEffect(() => {
    const t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Cumul L-Gems
  useEffect(() => {
    if (lastGift) setTotalLgems((t) => t + lastGift.lgemsValue);
  }, [lastGift]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const handleEnd = useCallback(async () => {
    if (isEnding) return;
    setIsEnding(true);
    try {
      await fetch(`/api/lives/${liveId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end" }),
      });
      await room.disconnect();
      onEnd();
    } catch {
      setIsEnding(false);
    }
  }, [liveId, room, onEnd, isEnding]);

  return (
    <>
      <LiveGiftAnimation gift={lastGift} burstThreshold={50} />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 pointer-events-none">
        {/* LIVE badge + titre */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <span
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ background: "#ef4444" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
          <span className="text-white text-sm font-medium drop-shadow truncate max-w-45">
            {liveTitle}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <StatBadge icon="👁" value={`${participants.length}`} />
          <StatBadge icon="⏱" value={formatDuration(duration)} />
          <StatBadge icon="💎" value={`${totalLgems}`} accent />
        </div>
      </div>

      {/* Feed cadeaux entrants */}
      <div className="absolute left-4 bottom-24 z-20 space-y-2 pointer-events-none max-w-55">
        {gifts.slice(-4).map((g) => (
          <div
            key={g._localId}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl text-sm text-white"
            style={{
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.08)",
              animation: "fadeSlideIn 0.3s ease",
            }}
          >
            <span className="text-base">🎁</span>
            <span className="leading-tight">
              <span className="font-semibold text-yellow-300">
                {g.sender.name}
              </span>{" "}
              <span className="text-white/60">a envoyé</span> {g.giftName}
            </span>
          </div>
        ))}
      </div>

      {/* Bouton fin */}
      <div className="absolute bottom-6 right-4 z-20">
        {showConfirm ? (
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 rounded-xl text-sm text-white/60 bg-white/10"
            >
              Annuler
            </button>
            <button
              onClick={handleEnd}
              disabled={isEnding}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 active:scale-95"
            >
              {isEnding ? "Fin…" : "Confirmer"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white active:scale-95 transition-all"
            style={{
              background: "rgba(239,68,68,0.85)",
              backdropFilter: "blur(8px)",
            }}
          >
            Terminer le live
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

function StatBadge({
  icon,
  value,
  accent,
}: {
  icon: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <span
      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(8px)",
        border: accent
          ? "1px solid rgba(245,158,11,0.4)"
          : "1px solid rgba(255,255,255,0.1)",
        color: accent ? "#f59e0b" : "white",
      }}
    >
      {icon} {value}
    </span>
  );
}

export function LiveRoomHost({
  liveId,
  liveTitle,
  token,
  serverUrl,
  onEnd,
}: LiveRoomHostProps) {
  return (
    <div className="relative w-full h-full bg-black">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        video
        audio
        style={{ height: "100%" }}
      >
        <VideoConference />
        <HostOverlay liveId={liveId} liveTitle={liveTitle} onEnd={onEnd} />
      </LiveKitRoom>
    </div>
  );
}
