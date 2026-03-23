"use client";
// src/hooks/useLiveGifts.ts
// Écoute les cadeaux envoyés pendant un live via Supabase Realtime (broadcast)
// Compatible avec le canal `live:{liveId}` que le serveur broadcaste

import { useEffect, useRef, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface LiveGiftEvent {
  giftId: string;
  giftCode: string;
  giftName: string;
  animationUrl: string | null;
  lgemsValue: number;
  sender: {
    id: string;
    name: string;
    avatar: string | null;
  };
  message: string | null;
  sentAt: string;
  /** ID local unique pour animer/désanimer */
  _localId: string;
}

export function useLiveGifts(liveId: string) {
  const [gifts, setGifts] = useState<LiveGiftEvent[]>([]);
  const [lastGift, setLastGift] = useState<LiveGiftEvent | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const clearGift = useCallback((localId: string) => {
    setGifts((prev) => prev.filter((g) => g._localId !== localId));
  }, []);

  useEffect(() => {
    if (!liveId) return;

    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(`live:${liveId}`)
      .on("broadcast", { event: "gift" }, ({ payload }) => {
        const event: LiveGiftEvent = {
          ...payload,
          _localId: `${payload.giftId}_${Date.now()}`,
        };
        setGifts((prev) => [...prev.slice(-19), event]); // garder les 20 derniers
        setLastGift(event);

        // Auto-clear l'animation après 5s
        setTimeout(() => clearGift(event._localId), 5000);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveId, clearGift]);

  return { gifts, lastGift, clearGift };
}
