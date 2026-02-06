// src/app/notifications/NotificationsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Bell,
  Heart,
  MessageCircle,
  CreditCard,
  Eye,
  UserPlus,
  CheckCheck,
  Loader2,
  RefreshCw,
  ThumbsUp,
  MessageSquare,
  Reply,
  Sparkles,
  Star,
  AlertCircle,
  UserCheck,
  Filter,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// Map des icônes
const iconMap = {
  MessageCircle,
  Eye,
  Heart,
  ThumbsUp,
  MessageSquare,
  Reply,
  Sparkles,
  Star,
  CreditCard,
  AlertCircle,
  UserPlus,
  UserCheck,
  Bell,
};

// Configuration visuelle des notifications
const notificationConfig: Record<
  string,
  {
    icon: keyof typeof iconMap;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  new_message: {
    icon: "MessageCircle",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  profile_visit: {
    icon: "Eye",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  profile_like: {
    icon: "Heart",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  post_reaction: {
    icon: "ThumbsUp",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
  },
  post_comment: {
    icon: "MessageSquare",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  comment_reaction: {
    icon: "ThumbsUp",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
  },
  comment_reply: {
    icon: "Reply",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  new_match: {
    icon: "Heart",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
  },
  high_match: {
    icon: "Sparkles",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  perfect_match: {
    icon: "Star",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  subscription_activated: {
    icon: "CreditCard",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  subscription_expired: {
    icon: "CreditCard",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  subscription_expiring_soon: {
    icon: "AlertCircle",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  friendship_request: {
    icon: "UserPlus",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  friendship_accepted: {
    icon: "UserCheck",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  default: {
    icon: "Bell",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
};

type FilterType = "all" | "unread" | "messages" | "likes" | "matchs";

export default function NotificationsClient() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications({ unreadOnly: filter === "unread" });

  /**
   * 🔍 Filtre les notifications selon le type sélectionné
   */
  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all" || filter === "unread") return true;
    if (filter === "messages") return notif.type === "new_message";
    if (filter === "likes")
      return notif.type === "profile_like" || notif.type === "post_reaction";
    if (filter === "matchs")
      return (
        notif.type === "new_match" ||
        notif.type === "high_match" ||
        notif.type === "perfect_match"
      );
    return true;
  });

  /**
   * 🖱️ Gère le clic sur une notification
   */
  const handleNotificationClick = (
    notificationId: string,
    isRead: boolean,
    type: string,
    metadata: any,
  ) => {
    // Marquer comme lu si non lu
    if (!isRead) {
      markAsRead(notificationId);
    }

    // Rediriger selon le type
    try {
      switch (type) {
        case "new_message":
          if (metadata?.conversationId) {
            router.push(`/chat?conversation=${metadata.conversationId}`);
          } else if (metadata?.senderId) {
            router.push(`/chat?user=${metadata.senderId}`);
          }
          break;

        case "profile_visit":
        case "profile_like":
          if (metadata?.visitorId || metadata?.likerId) {
            const userId = metadata.visitorId || metadata.likerId;
            router.push(`/profile/${userId}`);
          }
          break;

        case "post_reaction":
        case "post_comment":
          if (metadata?.postId) {
            router.push(`/home?post=${metadata.postId}`);
          }
          break;

        case "comment_reaction":
        case "comment_reply":
          if (metadata?.postId) {
            router.push(`/home?post=${metadata.postId}`);
          }
          break;

        case "new_match":
        case "high_match":
        case "perfect_match":
          if (metadata?.matchedUserId) {
            router.push(`/profile/${metadata.matchedUserId}`);
          }
          break;

        case "subscription_activated":
        case "subscription_expired":
        case "subscription_expiring_soon":
          router.push("/subscription");
          break;

        case "friendship_request":
          if (metadata?.requesterId) {
            router.push(`/profile/${metadata.requesterId}`);
          }
          break;

        case "friendship_accepted":
          if (metadata?.accepterId) {
            router.push(`/profile/${metadata.accepterId}`);
          }
          break;

        default:
          break;
      }
    } catch (e) {
      console.error("Erreur lors de la redirection:", e);
    }
  };

  /**
   * 🎨 Récupère la config visuelle d'une notification
   */
  const getNotificationConfig = (type: string) => {
    return notificationConfig[type] || notificationConfig.default;
  };

  /**
   * 📊 Filtres disponibles
   */
  const filters = [
    {
      value: "all" as FilterType,
      label: "Toutes",
      count: notifications.length,
    },
    { value: "unread" as FilterType, label: "Non lues", count: unreadCount },
    {
      value: "messages" as FilterType,
      label: "Messages",
      count: notifications.filter((n) => n.type === "new_message").length,
    },
    {
      value: "likes" as FilterType,
      label: "Likes",
      count: notifications.filter(
        (n) => n.type === "profile_like" || n.type === "post_reaction",
      ).length,
    },
    {
      value: "matchs" as FilterType,
      label: "Matchs",
      count: notifications.filter(
        (n) =>
          n.type === "new_match" ||
          n.type === "high_match" ||
          n.type === "perfect_match",
      ).length,
    },
  ];

  // Loading initial
  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F4C5C]" />
      </div>
    );
  }

  // Erreur
  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Erreur de chargement
        </h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-[#0F4C5C] text-white rounded-lg hover:bg-[#0F4C5C]/90 transition-colors inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        {/* Titre */}
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <div className="flex items-center gap-2">
              {/* Bouton rafraîchir */}
              <button
                onClick={refresh}
                disabled={loading}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Rafraîchir"
              >
                <RefreshCw
                  className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                />
              </button>

              {/* Marquer tout comme lu */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#0F4C5C] text-white hover:bg-[#0F4C5C]/90 transition-colors flex items-center gap-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  Tout marquer comme lu
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="px-4 py-3 flex items-center gap-2 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f.value
                  ? "bg-[#0F4C5C] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span
                  className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                    filter === f.value
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des notifications */}
      {filteredNotifications.length === 0 ? (
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
            <Bell className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune notification
          </h3>
          <p className="text-gray-600">
            {filter === "unread"
              ? "Vous n'avez aucune notification non lue"
              : filter === "all"
                ? "Vous n'avez aucune notification pour le moment"
                : `Aucune notification de type "${filters.find((f) => f.value === filter)?.label}"`}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 bg-white">
          {filteredNotifications.map((notification) => {
            const config = getNotificationConfig(notification.type);
            const IconComponent = iconMap[config.icon];
            const timeAgo = formatDistanceToNow(
              new Date(notification.createdAt),
              {
                addSuffix: true,
                locale: fr,
              },
            );

            return (
              <div
                key={notification.id}
                onClick={() =>
                  handleNotificationClick(
                    notification.id,
                    notification.isRead,
                    notification.type,
                    notification.metadata,
                  )
                }
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  !notification.isRead ? "bg-blue-50/30" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icône */}
                  <div
                    className={`shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center border ${config.borderColor}`}
                  >
                    <IconComponent className={`w-5 h-5 ${config.color}`} />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`text-sm font-semibold ${
                          !notification.isRead
                            ? "text-gray-900"
                            : "text-gray-700"
                        }`}
                      >
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <span className="shrink-0 w-2 h-2 bg-[#0F4C5C] rounded-full mt-1.5" />
                      )}
                    </div>
                    <p
                      className={`text-sm mt-1 ${
                        !notification.isRead ? "text-gray-700" : "text-gray-600"
                      }`}
                    >
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">{timeAgo}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
