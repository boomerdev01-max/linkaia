// hooks/use-unread-messages.ts
"use client";

import { useState, useEffect, useCallback } from "react";

interface UseUnreadMessagesOptions {
  pollingInterval?: number; // in ms
}

export function useUnreadMessages({
  pollingInterval = 30000,
}: UseUnreadMessagesOptions = {}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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
    fetchUnreadCount();

    // Poll for updates
    const interval = setInterval(fetchUnreadCount, pollingInterval);

    return () => clearInterval(interval);
  }, [fetchUnreadCount, pollingInterval]);

  return {
    unreadCount,
    isLoading,
    refresh: fetchUnreadCount,
  };
}
