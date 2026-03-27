// components/chat/CallOverlay.tsx
//
// Affiché quand status === "calling" (on attend la réponse)
// ou status === "connected" (appel en cours via LiveKit).
//
// Pour l'appel connecté on utilise @livekit/components-react qui gère
// tout le rendu WebRTC nativement.

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  TrackLoop,
  ParticipantTile,
  GridLayout,
} from "@livekit/components-react";
import "@livekit/components-styles";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Track } from "livekit-client";
import type { CallSession } from "@/types/chat";

interface CallOverlayProps {
  callSession: CallSession;
  currentUserId: string;
  onHangUp: () => void;
}

export function CallOverlay({
  callSession,
  currentUserId,
  onHangUp,
}: CallOverlayProps) {
  const { status, type, caller, participants, livekitToken, livekitUrl } =
    callSession;

  const isVideo = type === "video";
  const isCalling = status === "calling";
  const isConnected = status === "connected";

  // ── Durée d'appel ────────────────────────────────────────────────────────
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isConnected || !callSession.connectedAt) return;

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - callSession.connectedAt!) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected, callSession.connectedAt]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // ── Interlocuteur principal à afficher ────────────────────────────────────
  // Pour l'appelant : participants[0] est l'appelé
  // Pour l'appelé  : caller est l'appelant
  const otherUser = caller.id === currentUserId ? participants[0] : caller;

  const otherName = otherUser
    ? otherUser.pseudo || `${otherUser.prenom} ${otherUser.nom}`.trim()
    : "Inconnu";

  // ── Phase "Appel en sonnerie" (appelant attend) ───────────────────────────
  if (isCalling) {
    return (
      <CallingScreen
        otherUser={otherUser}
        otherName={otherName}
        isVideo={isVideo}
        onHangUp={onHangUp}
      />
    );
  }

  // ── Phase "Appel connecté" — LiveKit Room ─────────────────────────────────
  if (isConnected && livekitToken && livekitUrl) {
    return (
      <div className="fixed inset-0 z-40 bg-gray-950 flex flex-col">
        <LiveKitRoom
          token={livekitToken}
          serverUrl={livekitUrl}
          connect={true}
          audio={true}
          video={isVideo}
          onDisconnected={onHangUp}
          className="flex-1 flex flex-col"
          style={{ height: "100%" }}
        >
          {isVideo ? (
            // Appel vidéo : grille de participants
            <VideoCallLayout
              otherName={otherName}
              elapsed={elapsed}
              onHangUp={onHangUp}
              formatDuration={formatDuration}
            />
          ) : (
            // Appel audio : pas de vidéo, juste le rendu audio + UI custom
            <AudioCallLayout
              otherUser={otherUser}
              otherName={otherName}
              elapsed={elapsed}
              onHangUp={onHangUp}
              formatDuration={formatDuration}
            />
          )}
          {/* Rendu audio LiveKit (obligatoire même en mode vidéo) */}
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    );
  }

  return null;
}

// ─── Écran "Appel en cours / sonnerie" ──────────────────────────────────────

interface CallingScreenProps {
  otherUser: any;
  otherName: string;
  isVideo: boolean;
  onHangUp: () => void;
}

function CallingScreen({
  otherUser,
  otherName,
  isVideo,
  onHangUp,
}: CallingScreenProps) {
  return (
    <div className="fixed inset-0 z-40 bg-linear-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-between py-16 px-6">
      {/* Infos interlocuteur */}
      <div className="flex flex-col items-center gap-4 mt-8">
        {/* Avatar avec animation de pulsation */}
        <div className="relative">
          {/* Cercles de pulsation */}
          <div className="absolute inset-0 rounded-full bg-[#0F4C5C]/20 animate-ping scale-150" />
          <div className="absolute inset-0 rounded-full bg-[#0F4C5C]/10 animate-ping scale-125 delay-300" />

          <div className="relative w-28 h-28 rounded-full overflow-hidden ring-4 ring-white/10 bg-[#0F4C5C]">
            {otherUser?.profilePhotoUrl ? (
              <img
                src={otherUser.profilePhotoUrl}
                alt={otherName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white text-4xl font-bold">
                  {otherName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white">{otherName}</h2>
          <p className="text-gray-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block" />
            {isVideo ? "Appel vidéo" : "Appel audio"} en cours…
          </p>
        </div>
      </div>

      {/* Bouton raccrocher */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onHangUp}
          className={cn(
            "w-18 h-18 rounded-full flex items-center justify-center",
            "bg-red-500 hover:bg-red-600 active:scale-95",
            "transition-all duration-150 shadow-lg shadow-red-500/40",
          )}
          aria-label="Raccrocher"
        >
          <PhoneOff className="w-8 h-8 text-white" />
        </button>
        <span className="text-xs text-gray-400">Raccrocher</span>
      </div>
    </div>
  );
}

// ─── Layout appel vidéo ───────────────────────────────────────────────────────

interface CallLayoutProps {
  otherName: string;
  elapsed: number;
  onHangUp: () => void;
  formatDuration: (s: number) => string;
}

function VideoCallLayout({
  otherName,
  elapsed,
  onHangUp,
  formatDuration,
}: CallLayoutProps) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <div className="relative flex-1 flex flex-col">
      {/* Grille vidéo LiveKit */}
      <div className="flex-1">
        <GridLayout tracks={tracks} style={{ height: "100%" }}>
          <TrackLoop tracks={tracks}>
            <ParticipantTile />
          </TrackLoop>
        </GridLayout>
      </div>

      {/* Overlay info + durée */}
      <div className="absolute top-4 left-0 right-0 flex justify-center">
        <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-white/70" />
          <span className="text-white text-sm font-mono">
            {formatDuration(elapsed)}
          </span>
        </div>
      </div>

      {/* Barre de contrôles LiveKit (micro, caméra, raccrocher) */}
      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent pt-8 pb-6">
        <ControlBar
          controls={{
            microphone: true,
            camera: true,
            screenShare: false,
            leave: true,
          }}
          // onLeave={onHangUp}
        />
      </div>
    </div>
  );
}

// ─── Layout appel audio ───────────────────────────────────────────────────────

interface AudioCallLayoutProps extends CallLayoutProps {
  otherUser: any;
}

function AudioCallLayout({
  otherUser,
  otherName,
  elapsed,
  onHangUp,
  formatDuration,
}: AudioCallLayoutProps) {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className="flex-1 flex flex-col items-center justify-between py-16 px-6 bg-linear-to-b from-gray-900 to-gray-800">
      {/* Infos interlocuteur + durée */}
      <div className="flex flex-col items-center gap-4 mt-8">
        <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-white/10 bg-[#0F4C5C]">
          {otherUser?.profilePhotoUrl ? (
            <img
              src={otherUser.profilePhotoUrl}
              alt={otherName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white text-4xl font-bold">
                {otherName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white">{otherName}</h2>
          <p className="text-green-400 font-mono text-lg mt-1">
            {formatDuration(elapsed)}
          </p>
        </div>
      </div>

      {/* Contrôles audio */}
      <div className="flex items-center gap-8">
        {/* Micro — on utilise la ControlBar de LiveKit en mode "microphone only" */}
        <ControlBar
          controls={{
            microphone: true,
            camera: false,
            screenShare: false,
            leave: false,
          }}
          variation="minimal"
        />

        {/* Raccrocher */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onHangUp}
            className={cn(
              "w-18 h-18 rounded-full flex items-center justify-center",
              "bg-red-500 hover:bg-red-600 active:scale-95",
              "transition-all duration-150 shadow-lg shadow-red-500/40",
            )}
            aria-label="Raccrocher"
          >
            <PhoneOff className="w-8 h-8 text-white" />
          </button>
          <span className="text-xs text-gray-400">Raccrocher</span>
        </div>
      </div>
    </div>
  );
}
