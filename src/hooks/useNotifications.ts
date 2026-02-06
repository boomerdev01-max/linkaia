// src/hooks/useNotifications.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: Date | null;
  metadata: any;
  createdAt: Date;
}

interface UseNotificationsOptions {
  pollingInterval?: number; // en ms
  unreadOnly?: boolean;
  autoRefresh?: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    pollingInterval = 30000, // 30 secondes par défaut
    unreadOnly = false,
    autoRefresh = true,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref pour éviter les appels multiples
  const isFetchingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 📥 Récupère les notifications
   */
  const fetchNotifications = useCallback(
    async (showLoading = true) => {
      // Éviter les appels concurrents
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("limit", "50");
        if (unreadOnly) {
          params.set("unreadOnly", "true");
        }

        const response = await fetch(`/api/notifications?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des notifications");
        }

        const data = await response.json();

        if (data.success) {
          setNotifications(data.data.notifications);
        } else {
          throw new Error(data.error || "Erreur inconnue");
        }
      } catch (err) {
        console.error("❌ Error fetching notifications:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors de la récupération des notifications"
        );
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [unreadOnly]
  );

  /**
   * 🔢 Récupère le nombre de notifications non lues
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/unread-count");

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data.success) {
        setUnreadCount(data.data.count);
      }
    } catch (err) {
      console.error("❌ Error fetching unread count:", err);
    }
  }, []);

  /**
   * ✅ Marque une notification comme lue
   */
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        // Mise à jour optimiste
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId
              ? { ...notif, isRead: true, readAt: new Date() }
              : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        const response = await fetch(
          `/api/notifications/${notificationId}/read`,
          {
            method: "PUT",
          }
        );

        if (!response.ok) {
          // Rollback en cas d'erreur
          setNotifications((prev) =>
            prev.map((notif) =>
              notif.id === notificationId
                ? { ...notif, isRead: false, readAt: null }
                : notif
            )
          );
          setUnreadCount((prev) => prev + 1);
          throw new Error("Erreur lors du marquage");
        }
      } catch (err) {
        console.error("❌ Error marking notification as read:", err);
      }
    },
    []
  );

  /**
   * ✅✅ Marque toutes les notifications comme lues
   */
  const markAllAsRead = useCallback(async () => {
    try {
      // Mise à jour optimiste
      const now = new Date();
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true, readAt: now }))
      );
      setUnreadCount(0);

      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PUT",
      });

      if (!response.ok) {
        // Rollback en cas d'erreur
        await fetchNotifications(false);
        await fetchUnreadCount();
        throw new Error("Erreur lors du marquage");
      }
    } catch (err) {
      console.error("❌ Error marking all notifications as read:", err);
    }
  }, [fetchNotifications, fetchUnreadCount]);

  /**
   * 🔄 Rafraîchit manuellement les notifications
   */
  const refresh = useCallback(() => {
    fetchNotifications(true);
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  /**
   * 🎯 Effet initial et polling
   */
  useEffect(() => {
    // Chargement initial
    fetchNotifications(true);
    fetchUnreadCount();

    // Polling automatique si activé
    if (autoRefresh && pollingInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchNotifications(false);
        fetchUnreadCount();
      }, pollingInterval);
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, pollingInterval, fetchNotifications, fetchUnreadCount]);

  /**
   * 🔄 Re-fetch quand le filtre change
   */
  useEffect(() => {
    fetchNotifications(true);
  }, [unreadOnly, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}