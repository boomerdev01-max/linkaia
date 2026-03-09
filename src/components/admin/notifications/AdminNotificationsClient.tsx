"use client";
// src/components/admin/notifications/AdminNotificationsClient.tsx

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Bell,
  UserPlus,
  ShieldCheck,
  Flag,
  CreditCard,
  CheckCheck,
  RefreshCw,
  Loader2,
  AlertCircle,
  Filter,
  X,
  Crown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: Date | null;
  metadata: any;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

type FilterType =
  | "all"
  | "unread"
  | "new_user"
  | "new_admin_user"
  | "report_submitted"
  | "subscription_activated";

// ─── Config visuelle par type ─────────────────────────────────────────────────
const typeConfig: Record<
  string,
  {
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    label: string;
  }
> = {
  new_user: {
    icon: UserPlus,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "Inscription",
  },
  new_admin_user: {
    icon: ShieldCheck,
    color: "text-[#0F4C5C]",
    bg: "bg-[#0F4C5C]/5",
    border: "border-[#0F4C5C]/20",
    label: "Staff",
  },
  report_submitted: {
    icon: Flag,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "Signalement",
  },
  subscription_activated: {
    icon: CreditCard,
    color: "text-[#B88A4F]",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "Abonnement",
  },
  default: {
    icon: Bell,
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    label: "Notification",
  },
};

function getConfig(type: string) {
  return typeConfig[type] ?? typeConfig.default;
}

// ─── Badge filtre ─────────────────────────────────────────────────────────────
function FilterBadge({
  active,
  label,
  count,
  onClick,
  color,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
        ${
          active
            ? "bg-[#0F4C5C] text-white shadow-sm"
            : "bg-white text-gray-600 border border-gray-200 hover:border-[#0F4C5C]/30 hover:text-[#0F4C5C]"
        }`}
    >
      {label}
      {count > 0 && (
        <span
          className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
            active
              ? "bg-white/20 text-white"
              : `${color ?? "bg-gray-100 text-gray-600"}`
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Carte notification ───────────────────────────────────────────────────────
function NotificationCard({
  notification,
  onMarkRead,
  onClick,
}: {
  notification: AdminNotification;
  onMarkRead: (id: string) => void;
  onClick: (notif: AdminNotification) => void;
}) {
  const config = getConfig(notification.type);
  const Icon = config.icon;
  const meta = notification.metadata ?? {};

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <div
      onClick={() => onClick(notification)}
      className={`group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md
        ${
          !notification.isRead
            ? "bg-white border-l-4 border-l-[#0F4C5C] border-gray-200 shadow-sm"
            : "bg-gray-50/60 border-gray-200 hover:bg-white"
        }`}
    >
      {/* Icône */}
      <div
        className={`shrink-0 w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center mt-0.5`}
      >
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {/* Badge type + titre */}
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.color}`}
              >
                {config.label}
              </span>
              {!notification.isRead && (
                <span className="w-2 h-2 rounded-full bg-[#0F4C5C]" />
              )}
            </div>
            <p
              className={`text-sm font-semibold leading-snug ${
                notification.isRead ? "text-gray-700" : "text-gray-900"
              }`}
            >
              {notification.title}
            </p>
            <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
              {notification.message}
            </p>

            {/* Metadata complémentaire selon le type */}
            {notification.type === "report_submitted" && meta.categoryLabel && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200 rounded-lg">
                <Flag className="w-3 h-3 text-red-500" />
                <span className="text-xs text-red-700 font-medium">
                  {meta.categoryLabel}
                </span>
              </div>
            )}
            {notification.type === "subscription_activated" &&
              meta.pricePaid != null && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg">
                  {meta.isClub ? (
                    <Crown className="w-3 h-3 text-amber-600" />
                  ) : (
                    <CreditCard className="w-3 h-3 text-amber-600" />
                  )}
                  <span className="text-xs text-amber-800 font-medium">
                    {meta.pricePaid.toLocaleString("fr-FR")}{" "}
                    {meta.currencyCode ?? "CFA"}
                  </span>
                </div>
              )}
            {notification.type === "new_admin_user" && meta.role && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0F4C5C]/5 border border-[#0F4C5C]/15 rounded-lg">
                <ShieldCheck className="w-3 h-3 text-[#0F4C5C]" />
                <span className="text-xs text-[#0F4C5C] font-medium capitalize">
                  {meta.role}
                </span>
              </div>
            )}
          </div>

          {/* Temps + bouton marquer lu */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-xs text-gray-400">{timeAgo}</span>
            {!notification.isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(notification.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-[#0F4C5C] hover:underline font-medium"
              >
                Lu
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminNotificationsClient() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("all");
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetching = useRef(false);

  // ── Fetch ──
  const fetchNotifications = useCallback(
    async (page = 1, append = false, showLoading = true) => {
      if (isFetching.current) return;
      isFetching.current = true;

      if (showLoading && !append) setLoading(true);
      if (append) setLoadingMore(true);
      setError(null);

      try {
        const params = new URLSearchParams({ page: String(page), limit: "20" });
        if (filter === "unread") params.set("unreadOnly", "true");
        else if (filter !== "all") params.set("type", filter);

        const res = await fetch(`/api/admin/notifications?${params}`);
        if (!res.ok) throw new Error("Erreur de chargement");
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Erreur inconnue");

        setNotifications((prev) =>
          append
            ? [...prev, ...json.data.notifications]
            : json.data.notifications,
        );
        setPagination(json.data.pagination);
        setUnreadCount(json.data.unreadCount);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetching.current = false;
      }
    },
    [filter],
  );

  useEffect(() => {
    fetchNotifications(1, false, true);
  }, [filter, fetchNotifications]);

  // Polling 60s
  useEffect(() => {
    const id = setInterval(() => fetchNotifications(1, false, false), 60_000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // ── Mark read ──
  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, isRead: true, readAt: new Date() as any } : n,
      ),
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await fetch(`/api/admin/notifications/${id}/read`, { method: "PUT" });
    } catch {
      // rollback silencieux
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const now = new Date() as any;
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: now })),
    );
    setUnreadCount(0);
    try {
      await fetch("/api/admin/notifications/mark-all-read", { method: "PUT" });
    } catch {}
  }, []);

  // ── Click navigation ──
  const handleClick = useCallback(
    (notif: AdminNotification) => {
      if (!notif.isRead) markAsRead(notif.id);

      const meta = notif.metadata ?? {};
      switch (notif.type) {
        case "new_user":
          if (meta.newUserId) router.push(`/admin/users/${meta.newUserId}`);
          break;
        case "new_admin_user":
          if (meta.newAdminUserId)
            router.push(`/admin/users/${meta.newAdminUserId}`);
          break;
        case "report_submitted":
          if (meta.reportId)
            router.push(`/admin/content/reports/${meta.reportId}`);
          else router.push("/admin/content/reports");
          break;
        case "subscription_activated":
          router.push("/admin/services/statistics");
          break;
        default:
          break;
      }
    },
    [markAsRead, router],
  );

  // ── Comptages par type pour les filtres ──
  const counts = {
    all: notifications.length,
    unread: unreadCount,
    new_user: notifications.filter((n) => n.type === "new_user").length,
    new_admin_user: notifications.filter((n) => n.type === "new_admin_user")
      .length,
    report_submitted: notifications.filter((n) => n.type === "report_submitted")
      .length,
    subscription_activated: notifications.filter(
      (n) => n.type === "subscription_activated",
    ).length,
  };

  const filters: { value: FilterType; label: string; color?: string }[] = [
    { value: "all", label: "Toutes" },
    {
      value: "unread",
      label: "Non lues",
      color: "bg-[#0F4C5C]/10 text-[#0F4C5C]",
    },
    {
      value: "new_user",
      label: "Inscriptions",
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      value: "new_admin_user",
      label: "Staff",
      color: "bg-[#0F4C5C]/10 text-[#0F4C5C]",
    },
    {
      value: "report_submitted",
      label: "Signalements",
      color: "bg-red-100 text-red-700",
    },
    {
      value: "subscription_activated",
      label: "Abonnements",
      color: "bg-amber-100 text-amber-700",
    },
  ];

  // ── Render ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-[#0F4C5C] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => fetchNotifications(1, false, true)}
            className="ml-auto px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl space-y-5">
      {/* ── Barre d'actions ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Compteur non lus */}
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[#0F4C5C]/5 border border-[#0F4C5C]/15 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-[#0F4C5C]" />
            <span className="text-sm font-semibold text-[#0F4C5C]">
              {unreadCount} notification{unreadCount > 1 ? "s" : ""} non lue
              {unreadCount > 1 ? "s" : ""}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => fetchNotifications(1, false, false)}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            title="Actualiser"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-[#0F4C5C] text-white text-sm font-medium rounded-xl hover:bg-[#0F4C5C]/90 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Tout marquer comme lu
            </button>
          )}
        </div>
      </div>

      {/* ── Filtres ── */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <FilterBadge
            key={f.value}
            active={filter === f.value}
            label={f.label}
            count={counts[f.value]}
            onClick={() => setFilter(f.value)}
            color={f.color}
          />
        ))}
      </div>

      {/* ── Liste ── */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">Aucune notification</p>
          <p className="text-gray-400 text-sm mt-1">
            {filter === "unread"
              ? "Tout est à jour !"
              : "Les événements importants apparaîtront ici"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <NotificationCard
              key={notif.id}
              notification={notif}
              onMarkRead={markAsRead}
              onClick={handleClick}
            />
          ))}

          {/* Charger plus */}
          {pagination?.hasMore && (
            <div className="pt-3 text-center">
              <button
                onClick={() =>
                  fetchNotifications((pagination.page ?? 1) + 1, true, false)
                }
                disabled={loadingMore}
                className="px-6 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
                  </>
                ) : (
                  `Voir plus (${pagination.total - notifications.length} restantes)`
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
