// hooks/use-messages.ts
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Message, MessageReaction } from "@/types/chat";

interface UseMessagesOptions {
  conversationId: string;
  pageSize?: number;
}

export function useMessages({
  conversationId,
  pageSize = 20,
}: UseMessagesOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);
  const lastConversationIdRef = useRef<string | null>(null);

  const fetchMessages = useCallback(
    async (reset = false) => {
      // Reset if conversation changed
      if (lastConversationIdRef.current !== conversationId) {
        reset = true;
        lastConversationIdRef.current = conversationId;
      }

      if (reset) {
        cursorRef.current = null;
        setMessages([]);
        setHasMore(true);
      }

      try {
        setIsLoading(reset);
        setIsLoadingMore(!reset);
        setError(null);

        const params = new URLSearchParams({
          limit: pageSize.toString(),
        });

        if (cursorRef.current && !reset) {
          params.set("cursor", cursorRef.current);
        }

        const response = await fetch(
          `/api/chat/conversations/${conversationId}/messages?${params}`,
        );

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des messages");
        }

        const data = await response.json();

        setMessages((prev) =>
          reset ? data.messages : [...data.messages, ...prev],
        );
        setHasMore(data.hasMore);
        cursorRef.current = data.nextCursor;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [conversationId, pageSize],
  );

  // Auto-fetch on conversation change
  useEffect(() => {
    if (conversationId) {
      fetchMessages(true);
    }
  }, [conversationId]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchMessages(false);
    }
  }, [fetchMessages, isLoadingMore, hasMore]);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      // Check if message already exists
      if (prev.some((m) => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  const updateMessage = useCallback(
    (messageId: string, updates: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg,
        ),
      );
    },
    [],
  );

  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isDeleted: true, content: null } : msg,
      ),
    );
  }, []);

  const updateReactions = useCallback(
    (messageId: string, reactions: MessageReaction[]) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, reactions } : msg)),
      );
    },
    [],
  );

  const sendMessage = useCallback(
    async (
      content: string,
      type: "TEXT" | "MEDIA" | "VOICE" | "MIXED" = "TEXT",
      media?: any[],
      replyToId?: string,
    ) => {
      try {
        const response = await fetch(
          `/api/chat/conversations/${conversationId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content, type, media, replyToId }),
          },
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Erreur lors de l'envoi");
        }

        const message = await response.json();
        addMessage(message);
        return message;
      } catch (err) {
        throw err;
      }
    },
    [conversationId, addMessage],
  );

  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      try {
        const response = await fetch(`/api/chat/messages/${messageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "edit", content }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Erreur lors de la modification");
        }

        updateMessage(messageId, { content, isEdited: true });
      } catch (err) {
        throw err;
      }
    },
    [updateMessage],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        const response = await fetch(`/api/chat/messages/${messageId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Erreur lors de la suppression");
        }

        removeMessage(messageId);
      } catch (err) {
        throw err;
      }
    },
    [removeMessage],
  );

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        const response = await fetch(
          `/api/chat/messages/${messageId}/reactions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emoji }),
          },
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Erreur");
        }

        // Reaction update will come through realtime
      } catch (err) {
        throw err;
      }
    },
    [],
  );

  const pinMessage = useCallback(
    async (messageId: string, pin: boolean) => {
      try {
        const response = await fetch(`/api/chat/messages/${messageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: pin ? "pin" : "unpin" }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Erreur");
        }

        updateMessage(messageId, { isPinned: pin });
      } catch (err) {
        throw err;
      }
    },
    [updateMessage],
  );

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetchMessages,
    loadMore,
    addMessage,
    updateMessage,
    removeMessage,
    updateReactions,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    pinMessage,
  };
}
