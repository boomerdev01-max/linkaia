// hooks/use-realtime-messages.ts
"use client";

import { useEffect, useCallback, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { Message, MessageReaction } from "@/types/chat";

interface UseRealtimeMessagesProps {
  conversationId: string;
  onNewMessage: (message: Message) => void;
  onMessageUpdate: (messageId: string, updates: Partial<Message>) => void;
  onMessageDelete: (messageId: string) => void;
  onReactionChange: (messageId: string, reactions: MessageReaction[]) => void;
}

export function useRealtimeMessages({
  conversationId,
  onNewMessage,
  onMessageUpdate,
  onMessageDelete,
  onReactionChange,
}: UseRealtimeMessagesProps) {
  const supabase = getSupabaseBrowserClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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
          // Fetch full message with relations
          const response = await fetch(
            `/api/chat/conversations/${conversationId}/messages?limit=1`,
          );
          if (response.ok) {
            const data = await response.json();
            if (data.messages?.[0]?.id === payload.new.id) {
              onNewMessage(data.messages[0]);
            }
          }
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
          const { id, is_edited, is_deleted, is_pinned } = payload.new as any;
          onMessageUpdate(id, {
            isEdited: is_edited,
            isDeleted: is_deleted,
            isPinned: is_pinned,
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

          // Fetch updated reactions for the message
          // This is simplified - in production you'd want a dedicated endpoint
          const response = await fetch(
            `/api/chat/conversations/${conversationId}/messages?limit=50`,
          );
          if (response.ok) {
            const data = await response.json();
            const message = data.messages?.find(
              (m: Message) => m.id === messageId,
            );
            if (message) {
              onReactionChange(messageId, message.reactions);
            }
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Realtime connected for conversation:", conversationId);
        }
      });

    channelRef.current = channel;
  }, [
    conversationId,
    onNewMessage,
    onMessageUpdate,
    onMessageDelete,
    onReactionChange,
    supabase,
  ]);

  useEffect(() => {
    setupSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [setupSubscription, supabase]);

  return {
    reconnect: setupSubscription,
  };
}
