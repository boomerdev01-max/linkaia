"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

interface UseUnreadMessagesOptions {
  userId?: string;
}

export function useUnreadMessages({ userId }: UseUnreadMessagesOptions = {}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/unread-count");
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Chargement initial
    fetchUnreadCount();

    // Nettoyage d'un éventuel channel existant
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel("global-unread-count")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          // Ignorer les messages envoyés par l'utilisateur lui-même
          if (userId && (payload.new as any).sender_id === userId) return;
          fetchUnreadCount();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_participants",
        },
        () => {
          // lastReadAt mis à jour → le count peut avoir baissé
          fetchUnreadCount();
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchUnreadCount, supabase, userId]);

  return {
    unreadCount,
    isLoading,
    refresh: fetchUnreadCount,
  };
}
