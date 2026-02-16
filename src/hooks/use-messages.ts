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

        const params = new URLSearchParams({ limit: pageSize.toString() });
        if (cursorRef.current && !reset) {
          params.set("cursor", cursorRef.current);
        }

        const response = await fetch(
          `/api/chat/conversations/${conversationId}/messages?${params}`,
        );

        if (!response.ok)
          throw new Error("Erreur lors du chargement des messages");

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

  useEffect(() => {
    if (conversationId) fetchMessages(true);
  }, [conversationId]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) fetchMessages(false);
  }, [fetchMessages, isLoadingMore, hasMore]);

  // ── Ajout d'un message (Realtime entrant ou confirmation) ──────────────
  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      // Si un message avec le même ID existe déjà, on ignore
      if (prev.some((m) => m.id === message.id)) return prev;
      // Si le message confirme un optimistic (même tempId), on l'ignore ici
      // car confirmOptimisticMessage s'en charge
      return [...prev, message];
    });
  }, []);

  // ── Affichage immédiat d'un message optimistic ─────────────────────────
  const addOptimisticMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // ── Remplacement du message optimistic par le vrai message confirmé ────
  const confirmOptimisticMessage = useCallback(
    (tempId: string, realMessage: Message) => {
      setMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? realMessage : m)),
      );
    },
    [],
  );

  // ── Rollback d'un message optimistic en cas d'erreur ──────────────────
  const markMessageError = useCallback((tempId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.tempId === tempId ? { ...m, sendStatus: "error" as const } : m,
      ),
    );
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

  // ── Envoi réel vers l'API (retourne le message confirmé) ──────────────
  const sendMessage = useCallback(
    async (
      content: string,
      type: "TEXT" | "MEDIA" | "VOICE" | "MIXED" = "TEXT",
      media?: any[],
      replyToId?: string,
    ): Promise<Message> => {
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

      return response.json();
      // ⚠️ On ne fait plus addMessage ici — c'est MessageInput qui appelle
      // confirmOptimisticMessage après avoir reçu la réponse
    },
    [conversationId],
  );

  // ── Fetch d'un message unique (pour le Realtime entrant) ──────────────
  const fetchSingleMessage = useCallback(
    async (messageId: string): Promise<Message | null> => {
      try {
        const response = await fetch(`/api/chat/messages/${messageId}/full`);
        if (!response.ok) return null;
        return response.json();
      } catch {
        return null;
      }
    },
    [],
  );

  const editMessage = useCallback(
    async (messageId: string, content: string) => {
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
    },
    [updateMessage],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      removeMessage(messageId);
    },
    [removeMessage],
  );

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
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
      // La mise à jour des réactions arrive via Realtime
    },
    [],
  );

  const pinMessage = useCallback(
    async (messageId: string, pin: boolean) => {
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
    addOptimisticMessage, // ← nouveau
    confirmOptimisticMessage, // ← nouveau
    markMessageError, // ← nouveau
    fetchSingleMessage, // ← nouveau
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
