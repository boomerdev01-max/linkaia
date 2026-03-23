"use client";
// src/components/lives/LiveRoomViewer.tsx
// Vue viewer : stream vidéo + chat overlay + panneau cadeaux

import { useState, useRef, useEffect } from "react";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  useTracks,
  useParticipants,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { useLiveGifts } from "@/hooks/useLiveGifts";
import { LiveGiftAnimation } from "@/components/lives/LiveGiftAnimation";
import { GiftPanel } from "@/components/lives/GiftPanel";

interface ChatMessage {
  id: string;
  author: string;
  text: string;
  isGift?: boolean;
  at: string;
}

interface LiveRoomViewerProps {
  liveId: string;
  liveTitle: string;
  token: string;
  serverUrl: string;
  lgemsBalance: number;
  host: { name: string; avatar: string | null };
  onLeave: () => void;
}

// ── Sous-composant interne (accès aux hooks LiveKit) ──────────────────────────
function ViewerContent({
  liveId,
  liveTitle,
  lgemsBalance,
  host,
  onLeave,
}: Omit<LiveRoomViewerProps, "token" | "serverUrl">) {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);
  const participants = useParticipants();

  const { gifts, lastGift } = useLiveGifts(liveId);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [viewerCount, setViewerCount] = useState(participants.length);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync viewerCount
  useEffect(() => {
    setViewerCount(participants.length);
  }, [participants]);

  // Ajouter les cadeaux dans le chat
  useEffect(() => {
    if (!lastGift) return;
    const msg: ChatMessage = {
      id: lastGift._localId,
      author: lastGift.sender.name,
      text: `a envoyé ${lastGift.giftName} (${lastGift.lgemsValue} L-Gems) 🎁`,
      isGift: true,
      at: new Date(lastGift.sentAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setChat((prev) => [...prev.slice(-49), msg]);
  }, [lastGift]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const hostTrack = tracks.find((t) => t.participant.identity === host.name);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <LiveGiftAnimation gift={lastGift} burstThreshold={50} />

      {/* Video principale */}
      <div className="absolute inset-0">
        {tracks.length > 0 ? (
          <GridLayout tracks={tracks} style={{ height: "100%" }}>
            <ParticipantTile />
          </GridLayout>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <div
                className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                📡
              </div>
              <p className="text-white/40 text-sm">
                En attente de la diffusion…
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Gradient overlay bas */}
      <div
        className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
        }}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {host.avatar ? (
            <img
              src={host.avatar}
              alt={host.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center text-sm text-yellow-400">
              {host.name[0]}
            </div>
          )}
          <div>
            <p className="text-white text-sm font-semibold leading-tight">
              {host.name}
            </p>
            <div className="flex items-center gap-1.5">
              <span
                className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full"
                style={{ background: "#ef4444" }}
              >
                LIVE
              </span>
              <span className="text-[10px] text-white/50">
                👁 {viewerCount}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onLeave}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          ✕
        </button>
      </div>

      {/* Chat overlay + feed cadeaux */}
      <div className="absolute left-3 bottom-20 z-10 max-w-[65%] space-y-1.5 pointer-events-none">
        {chat.slice(-8).map((msg) => (
          <div
            key={msg.id}
            className="flex gap-1.5 items-start text-sm"
            style={{ animation: "fadeSlideIn 0.25s ease" }}
          >
            <span
              className={`font-semibold shrink-0 ${msg.isGift ? "text-yellow-400" : "text-white"}`}
            >
              {msg.author}
            </span>
            <span
              className={msg.isGift ? "text-yellow-300/80" : "text-white/70"}
            >
              {msg.text}
            </span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Bouton cadeau */}
      <div className="absolute bottom-6 right-4 z-10">
        <button
          onClick={() => setShowGiftPanel(true)}
          className="flex flex-col items-center gap-1 group"
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-transform group-active:scale-90"
            style={{
              background:
                "linear-gradient(135deg, rgba(245,158,11,0.3), rgba(234,88,12,0.2))",
              border: "1px solid rgba(245,158,11,0.4)",
              backdropFilter: "blur(8px)",
            }}
          >
            🎁
          </div>
          <span className="text-[10px] text-white/50">Cadeau</span>
        </button>
      </div>

      {/* Gift panel */}
      {showGiftPanel && (
        <GiftPanel
          liveId={liveId}
          lgemsBalance={lgemsBalance}
          onClose={() => setShowGiftPanel(false)}
          onGiftSent={() => setShowGiftPanel(false)}
        />
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Export principal ──────────────────────────────────────────────────────────
export function LiveRoomViewer({
  liveId,
  liveTitle,
  token,
  serverUrl,
  lgemsBalance,
  host,
  onLeave,
}: LiveRoomViewerProps) {
  return (
    <div className="w-full h-full bg-black">
      <LiveKitRoom token={token} serverUrl={serverUrl} video={false} audio>
        <ViewerContent
          liveId={liveId}
          liveTitle={liveTitle}
          lgemsBalance={lgemsBalance}
          host={host}
          onLeave={onLeave}
        />
      </LiveKitRoom>
    </div>
  );
}
