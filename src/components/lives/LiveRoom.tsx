"use client";
// src/components/lives/LiveRoom.tsx
// Orchestrateur principal — fetch du live + token, routing host/viewer, ticket gate

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LiveRoomHost } from "@/components/lives/LiveRoomHost";
import { LiveRoomViewer } from "@/components/lives/LiveRoomViewer";
import { LiveTicketGate } from "@/components/lives/LiveTicketGate";
import { getLiveKitPublicUrl } from "@/lib/livekit";

interface LiveData {
  id: string;
  title: string;
  status: string;
  livekitRoomName: string;
  host: {
    id: string;
    prenom: string;
    nom: string;
    profil: { pseudo: string | null; profilePhotoUrl: string | null } | null;
  };
  isFree: boolean;
  freeMinutes: number;
  honorSeatEnabled: boolean;
  honorSeatPrice: number;
  ticketPriceLgems?: number;
}

type State =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ticket_gate"; live: LiveData; lgemsBalance: number }
  | {
      phase: "streaming";
      token: string;
      live: LiveData;
      isHost: boolean;
      lgemsBalance: number;
    }
  | { phase: "ended" };

export function LiveRoom({ liveId }: { liveId: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ phase: "loading" });
  const [serverUrl] = useState(() => {
    try {
      return getLiveKitPublicUrl();
    } catch {
      return "ws://localhost:7880";
    }
  });

  const joinLive = useCallback(async () => {
    setState({ phase: "loading" });
    try {
      const res = await fetch(`/api/lives/${liveId}/join`, { method: "POST" });
      const data = await res.json();

      if (res.status === 402 && data.needsTicket) {
        // Récupérer le solde wallet
        const walletRes = await fetch("/api/wallet/balance");
        const walletData = await walletRes.json();
        const lgemsBalance = walletData.lgemsBalance ?? 0;

        setState({
          phase: "ticket_gate",
          live: { ...data.live, ticketPriceLgems: data.price },
          lgemsBalance,
        });
        return;
      }

      if (!res.ok) {
        setState({
          phase: "error",
          message: data.error ?? "Impossible de rejoindre le live",
        });
        return;
      }

      setState({
        phase: "streaming",
        token: data.token,
        live: data.live,
        isHost: data.isHost,
        lgemsBalance: data.lgemsBalance ?? 0,
      });
    } catch {
      setState({ phase: "error", message: "Erreur réseau" });
    }
  }, [liveId]);

  useEffect(() => {
    joinLive();
  }, [joinLive]);

  // ── Rendu par phase ──────────────────────────────────────────────────────

  if (state.phase === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin" />
          <p className="text-white/40 text-sm">Connexion au live…</p>
        </div>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black p-6">
        <div className="text-center max-w-xs space-y-4">
          <div className="text-5xl">📡</div>
          <p className="text-white font-semibold">{state.message}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (state.phase === "ticket_gate") {
    return (
      <LiveTicketGate
        liveTitle={state.live.title}
        ticketPriceLgems={state.live.ticketPriceLgems ?? 0}
        lgemsBalance={state.lgemsBalance}
        onPurchase={joinLive}
        onCancel={() => router.back()}
      />
    );
  }

  if (state.phase === "ended") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black p-6">
        <div className="text-center max-w-xs space-y-4">
          <div className="text-5xl">🎬</div>
          <p className="text-white font-semibold text-lg">
            Le live est terminé
          </p>
          <p className="text-white/40 text-sm">
            Merci pour votre participation !
          </p>
          <button
            onClick={() => router.push("/home")}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }}
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // Phase streaming
  const { token, live, isHost, lgemsBalance } = state;
  const hostName =
    live.host.profil?.pseudo ?? `${live.host.prenom} ${live.host.nom}`;

  return (
    <div className="fixed inset-0 bg-black">
      {isHost ? (
        <LiveRoomHost
          liveId={live.id}
          liveTitle={live.title}
          token={token}
          serverUrl={serverUrl}
          onEnd={() => setState({ phase: "ended" })}
        />
      ) : (
        <LiveRoomViewer
          liveId={live.id}
          liveTitle={live.title}
          token={token}
          serverUrl={serverUrl}
          lgemsBalance={lgemsBalance}
          host={{
            name: hostName,
            avatar: live.host.profil?.profilePhotoUrl ?? null,
          }}
          onLeave={() => router.back()}
        />
      )}
    </div>
  );
}
