// hooks/use-realtime-messages.ts
"use client";

import { useEffect, useCallback, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { Message, MessageReaction } from "@/types/chat";

interface UseRealtimeMessagesProps {
  conversationId: string;
  currentUserId: string;
  onNewMessage: (message: Message) => void;
  onMessageUpdate: (messageId: string, updates: Partial<Message>) => void;
  onMessageDelete: (messageId: string) => void;
  onReactionChange: (messageId: string, reactions: MessageReaction[]) => void;
  onFetchSingleMessage: (messageId: string) => Promise<Message | null>;
}

export function useRealtimeMessages({
  conversationId,
  currentUserId,
  onNewMessage,
  onMessageUpdate,
  onMessageDelete,
  onReactionChange,
  onFetchSingleMessage,
}: UseRealtimeMessagesProps) {
  const supabase = getSupabaseBrowserClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Évite de traiter deux fois le même INSERT
  const processedIdsRef = useRef<Set<string>>(new Set());

  const setupSubscription = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newRow = payload.new as any;
          const messageId: string = newRow.id;

          // Ignorer nos propres messages — déjà affichés en optimistic
          if (newRow.sender_id === currentUserId) return;

          // Dédoublonnage
          if (processedIdsRef.current.has(messageId)) return;
          processedIdsRef.current.add(messageId);

          // ✅ Un seul fetch ciblé sur ce message (pas toute la liste)
          const fullMessage = await onFetchSingleMessage(messageId);
          if (fullMessage) onNewMessage(fullMessage);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as any;
          onMessageUpdate(row.id, {
            isEdited: row.is_edited,
            isDeleted: row.is_deleted,
            isPinned: row.is_pinned,
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        async (payload) => {
          const messageId =
            (payload.new as any)?.message_id ||
            (payload.old as any)?.message_id;
          if (!messageId) return;

          // ✅ Fetch ciblé sur ce message pour récupérer les réactions à jour
          const fullMessage = await onFetchSingleMessage(messageId);
          if (fullMessage) onReactionChange(messageId, fullMessage.reactions);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Realtime connecté:", conversationId);
        }
        if (status === "CHANNEL_ERROR") {
          console.error("❌ Realtime erreur:", conversationId);
        }
      });

    channelRef.current = channel;
  }, [
    conversationId,
    currentUserId,
    onNewMessage,
    onMessageUpdate,
    onMessageDelete,
    onReactionChange,
    onFetchSingleMessage,
    supabase,
  ]);

  useEffect(() => {
    setupSubscription();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      processedIdsRef.current.clear();
    };
  }, [setupSubscription, supabase]);

  return { reconnect: setupSubscription };
}
