"use client";
// src/components/lives/HonorSeatButton.tsx
// Bouton "Siège d'honneur" affiché dans LiveRoomViewer quand honorSeatEnabled=true.
// Achète le siège, récupère un nouveau token LiveKit avec canPublish, et active la caméra.
// À brancher dans LiveRoomViewer.tsx (voir instructions en bas de fichier).

import { useState } from "react";
import { useRoomContext } from "@livekit/components-react";

interface HonorSeatButtonProps {
  liveId: string;
  price: number; // en L-Gems
  durationMinutes: number;
  lgemsBalance: number;
  serverUrl: string;
  onActivated: () => void; // callback quand la caméra est prête
}

export function HonorSeatButton({
  liveId,
  price,
  durationMinutes,
  lgemsBalance,
  serverUrl,
  onActivated,
}: HonorSeatButtonProps) {
  const room = useRoomContext();
  const [state, setState] = useState<
    "idle" | "confirm" | "loading" | "active" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const canAfford = lgemsBalance >= price;

  async function handlePurchase() {
    setState("loading");
    try {
      const res = await fetch(`/api/lives/${liveId}/honor-seat`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Erreur lors de l'achat");
        setState("error");
        return;
      }

      // Reconnecter à la room avec le nouveau token (canPublish=true)
      await room.disconnect();
      await room.connect(serverUrl, data.token);
      // Activer la caméra immédiatement
      await room.localParticipant.setCameraEnabled(true);
      await room.localParticipant.setMicrophoneEnabled(true);

      setState("active");
      onActivated();

      // Timer : désactiver la caméra à l'expiration
      const durationMs = data.durationMinutes * 60 * 1000;
      setTimeout(async () => {
        await room.localParticipant.setCameraEnabled(false);
        await room.localParticipant.setMicrophoneEnabled(false);
        setState("idle");
      }, durationMs);
    } catch {
      setErrorMsg("Erreur réseau");
      setState("error");
    }
  }

  if (state === "active") {
    return (
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
        style={{
          background: "rgba(52,211,153,0.2)",
          border: "1px solid rgba(52,211,153,0.4)",
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        Siège d'honneur actif ({durationMinutes} min)
      </div>
    );
  }

  if (state === "error") {
    return (
      <button
        onClick={() => setState("idle")}
        className="text-xs text-red-400 hover:text-red-300 transition-colors"
      >
        ⚠️ {errorMsg} — Réessayer
      </button>
    );
  }

  if (state === "confirm") {
    return (
      <div className="flex items-center gap-2">
        <div className="text-xs text-white/70">
          {price} 💎 · {durationMinutes} min
        </div>
        <button
          onClick={() => setState("idle")}
          className="px-2.5 py-1 rounded-lg text-xs text-white/40 hover:text-white/70"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          Non
        </button>
        <button
          onClick={handlePurchase}
          disabled={!canAfford}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white transition-all active:scale-95"
          style={{
            background: canAfford
              ? "linear-gradient(135deg, #f59e0b, #ea580c)"
              : "rgba(255,255,255,0.1)",
            opacity: canAfford ? 1 : 0.5,
          }}
        >
          Confirmer
        </button>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-white/50">
        <span className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin" />
        Achat en cours…
      </div>
    );
  }

  // Idle
  return (
    <button
      onClick={() => setState("confirm")}
      disabled={!canAfford}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white transition-all hover:scale-105 active:scale-95"
      style={{
        background: "rgba(245,158,11,0.15)",
        border: "1px solid rgba(245,158,11,0.35)",
        opacity: canAfford ? 1 : 0.45,
      }}
      title={
        !canAfford
          ? "Solde insuffisant"
          : `Rejoindre comme invité d'honneur · ${price} L-Gems`
      }
    >
      🪑 Siège d'honneur · {price} 💎
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INTÉGRATION dans LiveRoomViewer.tsx
//
// 1. Importer :
//    import { HonorSeatButton } from "./HonorSeatButton";
//
// 2. Dans les props de ViewerContent, ajouter :
//    honorSeatEnabled: boolean;
//    honorSeatPrice: number;
//    honorSeatDuration: number;
//    serverUrl: string;
//
// 3. Dans le JSX de ViewerContent, ajouter sous le bouton 🎁 :
//    {honorSeatEnabled && (
//      <HonorSeatButton
//        liveId={liveId}
//        price={honorSeatPrice}
//        durationMinutes={honorSeatDuration}
//        lgemsBalance={lgemsBalance}
//        serverUrl={serverUrl}
//        onActivated={() => console.log("Siège d'honneur activé !")}
//      />
//    )}
//
// 4. Passer les props depuis LiveRoomViewer vers ViewerContent.
// ─────────────────────────────────────────────────────────────────────────────
