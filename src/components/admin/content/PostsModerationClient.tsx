// src/components/admin/content/PostsModerationClient.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Search,
  Filter,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  Flag,
  ImageOff,
  MessageSquare,
  Heart,
  BarChart2,
  Calendar,
  User,
  Globe,
  Lock,
  Users,
  Tag,
  AlertTriangle,
  X,
  MoreHorizontal,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PostAction = "approve" | "hide" | "flag" | "delete";
type PostStatus = "approved" | "hidden" | "flagged" | "deleted" | null;

interface PostAuthor {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  pseudo: string | null;
  photo: string | null;
}

interface PostMedia {
  id: string;
  type: string;
  url: string;
}

interface PostCategory {
  id: string;
  label: string;
  emoji: string;
  code: string;
}

interface Post {
  id: string;
  content: string | null;
  visibility: string;
  createdAt: string;
  editedAt: string | null;
  author: PostAuthor;
  category: PostCategory | null;
  tags: string[];
  media: PostMedia[];
  reactionsCount: number;
  commentsCount: number;
  viewsCount: number;
}

interface Category {
  id: string;
  label: string;
  emoji: string;
  code: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VISIBILITY_CONFIG = {
  public:  { label: "Public",  icon: Globe,  color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  friends: { label: "Amis",    icon: Users,  color: "text-blue-600 bg-blue-50 border-blue-200" },
  private: { label: "Privé",   icon: Lock,   color: "text-gray-500 bg-gray-50 border-gray-200" },
};

function VisibilityBadge({ visibility }: { visibility: string }) {
  const cfg = VISIBILITY_CONFIG[visibility as keyof typeof VISIBILITY_CONFIG] ?? {
    label: visibility, icon: Globe, color: "text-gray-500 bg-gray-50 border-gray-200",
  };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: PostStatus }) {
  if (!status) return null;

  const cfg = {
    approved: { label: "Approuvé",    color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    hidden:   { label: "Masqué",      color: "bg-amber-100  text-amber-700  border-amber-200"  },
    flagged:  { label: "Signalé",     color: "bg-orange-100 text-orange-700 border-orange-200" },
    deleted:  { label: "Supprimé",    color: "bg-red-100    text-red-700    border-red-200"    },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── Action Menu ──────────────────────────────────────────────────────────────

function ActionMenu({
  postId,
  status,
  onAction,
}: {
  postId: string;
  status: PostStatus;
  onAction: (id: string, action: PostAction) => void;
}) {
  const [open, setOpen] = useState(false);

  const actions: { key: PostAction; label: string; icon: React.ElementType; color: string }[] = [
    { key: "approve", label: "Approuver",       icon: CheckCircle2,   color: "text-emerald-600 hover:bg-emerald-50" },
    { key: "hide",    label: "Masquer",          icon: EyeOff,         color: "text-amber-600  hover:bg-amber-50"   },
    { key: "flag",    label: "Signaler",         icon: Flag,           color: "text-orange-600 hover:bg-orange-50"  },
    { key: "delete",  label: "Supprimer",        icon: Trash2,         color: "text-red-600    hover:bg-red-50"     },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-40">
            {actions.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.key}
                  onClick={() => { onAction(postId, a.key); setOpen(false); }}
                  disabled={
                    (a.key === "approve" && status === "approved") ||
                    (a.key === "hide"    && status === "hidden")   ||
                    (a.key === "flag"    && status === "flagged")  ||
                    status === "deleted"
                  }
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${a.color}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {a.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────

function ConfirmDeleteModal({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Supprimer ce post ?</p>
            <p className="text-sm text-gray-500">Cette action est irréversible.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  status,
  onAction,
}: {
  post: Post;
  status: PostStatus;
  onAction: (id: string, action: PostAction) => void;
}) {
  const [authorImgError, setAuthorImgError] = useState(false);
  const [mediaImgErrors, setMediaImgErrors] = useState<Record<string, boolean>>({});

  const authorName = post.author.pseudo ?? `${post.author.prenom} ${post.author.nom}`;
  const initials   = `${post.author.prenom?.[0] ?? ""}${post.author.nom?.[0] ?? ""}`.toUpperCase();
  const hasAuthorPhoto = post.author.photo && !authorImgError;

  const cardBorder =
    status === "approved" ? "border-emerald-200 shadow-emerald-50/60" :
    status === "hidden"   ? "border-amber-200  shadow-amber-50/60"   :
    status === "flagged"  ? "border-orange-200 shadow-orange-50/60"  :
    status === "deleted"  ? "border-red-200    shadow-red-50/60 opacity-60" :
    "border-gray-200";

  const visibleMedia = post.media.slice(0, 3);
  const extraCount   = post.media.length - 3;

  return (
    <div className={`bg-white rounded-xl border-2 ${cardBorder} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col`}>
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Author avatar */}
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center border border-gray-200">
            {hasAuthorPhoto ? (
              <Image
                src={post.author.photo!}
                alt={authorName}
                width={36}
                height={36}
                className="object-cover w-full h-full"
                onError={() => setAuthorImgError(true)}
              />
            ) : (
              <span className="text-xs font-bold text-gray-500">{initials || <User className="w-4 h-4" />}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{authorName}</p>
            <p className="text-xs text-gray-400 truncate">{post.author.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <VisibilityBadge visibility={post.visibility} />
          <ActionMenu postId={post.id} status={status} onAction={onAction} />
        </div>
      </div>

      {/* ── Content ── */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">{post.content}</p>
        </div>
      )}

      {/* ── Media preview ── */}
      {visibleMedia.length > 0 && (
        <div className={`mx-4 mb-3 grid gap-1 rounded-lg overflow-hidden ${
          visibleMedia.length === 1 ? "grid-cols-1" :
          visibleMedia.length === 2 ? "grid-cols-2" : "grid-cols-3"
        }`}>
          {visibleMedia.map((m, i) => {
            const isLast = i === visibleMedia.length - 1 && extraCount > 0;
            return (
              <div key={m.id} className="relative aspect-square bg-gray-100">
                {m.type === "photo" && !mediaImgErrors[m.id] ? (
                  <Image
                    src={m.url}
                    alt="media"
                    fill
                    className="object-cover"
                    onError={() => setMediaImgErrors((e) => ({ ...e, [m.id]: true }))}
                  />
                ) : m.type === "video" ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Eye className="w-6 h-6 text-gray-400" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff className="w-5 h-5 text-gray-300" />
                  </div>
                )}
                {isLast && extraCount > 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">+{extraCount}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Category & Tags ── */}
      {(post.category || post.tags.length > 0) && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {post.category && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
              {post.category.emoji} {post.category.label}
            </span>
          )}
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-gray-500 bg-gray-50 border border-gray-200">
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
          {post.tags.length > 3 && (
            <span className="text-xs text-gray-400 self-center">+{post.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="mt-auto px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            {post.reactionsCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            {post.commentsCount}
          </span>
          <span className="flex items-center gap-1">
            <BarChart2 className="w-3.5 h-3.5" />
            {post.viewsCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {status && <StatusBadge status={status} />}
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(post.createdAt).toLocaleDateString("fr-FR")}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page, total, limit, onPageChange,
}: {
  page: number; total: number; limit: number; onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        Page {page} sur {totalPages} — {total} post{total > 1 ? "s" : ""}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <MessageSquare className="w-14 h-14 text-gray-200 mb-4" />
      <p className="text-gray-500 font-medium">Aucun post trouvé</p>
      <p className="text-gray-400 text-sm mt-1">Essayez de modifier vos filtres.</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PostsModerationClient() {
  const [posts,      setPosts]      = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const LIMIT = 18;

  // Filters
  const [search,     setSearch]     = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [flagged,    setFlagged]    = useState(false);

  // Local action statuses (no backend status field on Post)
  const [statuses, setStatuses] = useState<Record<string, PostStatus>>({});

  // Confirm delete
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPosts = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page:       String(p),
        limit:      String(LIMIT),
        search:     debouncedSearch,
        visibility,
        categoryId,
        flagged:    String(flagged),
      });
      const res  = await fetch(`/api/admin/content/posts?${params}`);
      if (!res.ok) throw new Error("Erreur lors du chargement des posts");
      const json = await res.json();
      setPosts(json.data);
      setTotal(json.total);
      if (json.categories?.length) setCategories(json.categories);
    } catch (e: any) {
      setError(e.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, visibility, categoryId, flagged]);

  useEffect(() => {
    fetchPosts(page);
  }, [page, fetchPosts]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [visibility, categoryId, flagged]);

  // ── Moderation action ─────────────────────────────────────────────────────
  const handleAction = useCallback((postId: string, action: PostAction) => {
    if (action === "delete") {
      setPendingDelete(postId);
      return;
    }
    applyAction(postId, action);
  }, []);

  const applyAction = async (postId: string, action: PostAction) => {
    try {
      const res = await fetch("/api/admin/content/posts", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ postId, action }),
      });
      if (!res.ok) throw new Error("Échec de l'action");

      const newStatus: PostStatus =
        action === "approve" ? "approved" :
        action === "hide"    ? "hidden"   :
        action === "flag"    ? "flagged"  :
        action === "delete"  ? "deleted"  : null;

      setStatuses((prev) => ({ ...prev, [postId]: newStatus }));

      if (action === "delete") {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (e: any) {
      console.error("Moderation error:", e);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await applyAction(pendingDelete, "delete");
    setPendingDelete(null);
  };

  // ── Summary counts ────────────────────────────────────────────────────────
  const approvedCount = Object.values(statuses).filter((s) => s === "approved").length;
  const hiddenCount   = Object.values(statuses).filter((s) => s === "hidden").length;
  const flaggedCount  = Object.values(statuses).filter((s) => s === "flagged").length;

  const hasActiveFilters = visibility !== "all" || categoryId !== "all" || flagged || debouncedSearch;

  return (
    <>
      <ConfirmDeleteModal
        open={!!pendingDelete}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <div className="p-6 space-y-6 max-w-7xl">
        {/* ── Filters bar ── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-55">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un post, auteur…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/30 focus:border-[#0F4C5C] transition-colors bg-white"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Visibility filter */}
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/30 focus:border-[#0F4C5C] transition-colors"
          >
            <option value="all">Toutes visibilités</option>
            <option value="public">Public</option>
            <option value="friends">Amis</option>
            <option value="private">Privé</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/30 focus:border-[#0F4C5C] transition-colors"
          >
            <option value="all">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
            ))}
          </select>

          {/* Flagged toggle */}
          <button
            onClick={() => setFlagged((v) => !v)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
              flagged
                ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200"
                : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600"
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            Signalés
          </button>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(""); setVisibility("all"); setCategoryId("all"); setFlagged(false); }}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Réinitialiser
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={() => fetchPosts(page)}
            className="ml-auto p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* ── Summary bar ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{total}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 shadow-sm">
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Approuvés</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{approvedCount}</p>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 shadow-sm">
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Masqués</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{hiddenCount}</p>
          </div>
          <div className="bg-orange-50 rounded-xl border border-orange-100 p-4 shadow-sm">
            <p className="text-xs font-medium text-orange-600 uppercase tracking-wider">Signalés</p>
            <p className="text-2xl font-bold text-orange-700 mt-1">{flaggedCount}</p>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              Publications de la plateforme
            </h2>
            {!loading && (
              <span className="text-sm text-gray-400">
                {total} post{total > 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="p-6">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#0F4C5C] animate-spin" />
              </div>
            )}

            {!loading && error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
                {error}
              </div>
            )}

            {!loading && !error && posts.length === 0 && <EmptyState />}

            {!loading && !error && posts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    status={statuses[post.id] ?? null}
                    onAction={handleAction}
                  />
                ))}
              </div>
            )}

            {!loading && !error && (
              <div className="mt-6">
                <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center pb-2">Powered by Linkaia</p>
      </div>
    </>
  );
}