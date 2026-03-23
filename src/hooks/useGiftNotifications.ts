"use client";
// src/hooks/useGiftNotifications.ts
// Écoute les cadeaux reçus en temps réel via Supabase Realtime.
// À brancher dans un composant monté globalement (ex: Header ou un layout).
// Affiche un toast via `sonner` à chaque cadeau reçu hors live.

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface GiftReceivedPayload {
  giftName: string;
  lgemsValue: number;
  sender: { id: string; name: string; avatar: string | null };
  message: string | null;
  context: "live" | "post" | "profile";
}

export function useGiftNotifications(userId: string | null) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(`user:${userId}`)
      .on("broadcast", { event: "gift_received" }, ({ payload }) => {
        const p = payload as GiftReceivedPayload;

        // Sonner supporte title + description sans JSX — compatible .ts
        toast("🎁 Cadeau reçu !", {
          description: p.message
            ? `${p.sender.name} vous a envoyé ${p.giftName} · ${p.lgemsValue} L-Gems\n"${p.message}"`
            : `${p.sender.name} vous a envoyé ${p.giftName} · ${p.lgemsValue} L-Gems`,
          duration: 6000,
          position: "top-right",
          style: {
            background: "linear-gradient(135deg, #1a1a2e, #0f3460)",
            border: "1px solid rgba(245,158,11,0.4)",
            color: "#f59e0b",
            borderRadius: "16px",
          },
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
