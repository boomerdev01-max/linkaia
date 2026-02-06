// hooks/use-conversations.ts
"use client";

import { useState, useCallback, useEffect } from "react";
import type { ConversationListItem, Message } from "@/types/chat";

type FilterType = "all" | "unread" | "groups" | "archived";

export function useConversations(initialFilter: FilterType = "all") {
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>(initialFilter);

  const fetchConversations = useCallback(
    async (filterType?: FilterType) => {
      try {
        setIsLoading(true);
        setError(null);

        const currentFilter = filterType || filter;
        const response = await fetch(
          `/api/chat/conversations?filter=${currentFilter}`,
        );

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des conversations");
        }

        const data = await response.json();
        setConversations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setIsLoading(false);
      }
    },
    [filter],
  );

  const changeFilter = useCallback(
    (newFilter: FilterType) => {
      setFilter(newFilter);
      fetchConversations(newFilter);
    },
    [fetchConversations],
  );

  const updateConversationLastMessage = useCallback(
    (conversationId: string, message: Message) => {
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              lastMessage: message.content || "[Media]",
              lastMessageTime: message.createdAt,
              lastMessageSenderId: message.sender.id,
            };
          }
          return conv;
        });

        // Move updated conversation to top
        const convIndex = updated.findIndex((c) => c.id === conversationId);
        if (convIndex > 0) {
          const [conv] = updated.splice(convIndex, 1);
          updated.unshift(conv);
        }

        return updated;
      });
    },
    [],
  );

  const incrementUnreadCount = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? { ...conv, unreadCount: conv.unreadCount + 1 }
          : conv,
      ),
    );
  }, []);

  const markAsRead = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv,
      ),
    );
  }, []);

  useEffect(() => {
    fetchConversations();
  }, []); // Enlever la dépendance fetchConversations pour éviter les boucles

  return {
    conversations,
    isLoading,
    error,
    filter,
    changeFilter,
    refresh: fetchConversations,
    updateConversationLastMessage,
    incrementUnreadCount,
    markAsRead,
  };
}
