// src/components/stats/PostsStatsTable.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

type SortKey = "views" | "reactions" | "comments" | "date";

interface PostStat {
  id: string;
  contentPreview: string | null;
  createdAt: string;
  mediaPreview: { type: string; url: string } | null;
  stats: {
    views: number;
    reactions: number;
    comments: number;
    engagementRate: number;
  };
  reactionsByType: {
    code: string;
    emoji: string;
    label: string;
    count: number;
  }[];
}

interface PostsStatsTableProps {
  period: string;
  customFrom?: Date;
  customTo?: Date;
}

export default function PostsStatsTable({
  period,
  customFrom,
  customTo,
}: PostsStatsTableProps) {
  const [posts, setPosts] = useState<PostStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("views");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasMore: false,
  });

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period,
        sort,
        page: page.toString(),
        limit: "10",
      });
      if (period === "custom" && customFrom && customTo) {
        params.set("from", customFrom.toISOString());
        params.set("to", customTo.toISOString());
      }
      const res = await fetch(`/api/my-stats/posts?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.data.posts);
        setPagination(data.data.pagination);
      }
    } catch (e) {
      console.error("Erreur chargement posts stats:", e);
    } finally {
      setLoading(false);
    }
  }, [period, sort, page, customFrom, customTo]);

  useEffect(() => {
    setPage(1);
  }, [period, sort]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* En-tête tableau */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          Détail par publication
        </h2>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-7 text-xs w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="views" className="text-xs">
                Trier par vues
              </SelectItem>
              <SelectItem value="reactions" className="text-xs">
                Trier par réactions
              </SelectItem>
              <SelectItem value="comments" className="text-xs">
                Trier par commentaires
              </SelectItem>
              <SelectItem value="date" className="text-xs">
                Trier par date
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Corps */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-[#0F4C5C]" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <FileText className="w-10 h-10 text-gray-300 dark:text-gray-700" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucune publication sur cette période
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {posts.map((post) => (
            <PostStatRow key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {pagination.total} publication{pagination.total > 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs text-gray-600 dark:text-gray-400 px-2">
              {page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasMore}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ligne d'un post ───────────────────────────────────────────────────────────
function PostStatRow({ post }: { post: PostStat }) {
  const dateFormatted = (() => {
    try {
      return format(parseISO(post.createdAt), "d MMM yyyy", { locale: fr });
    } catch {
      return post.createdAt;
    }
  })();

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      {/* Aperçu média ou icône texte */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-center">
        {post.mediaPreview?.url ? (
          <Image
            src={post.mediaPreview.url}
            alt="Aperçu"
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        ) : (
          <FileText className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
          {post.contentPreview ?? (
            <span className="italic text-gray-400">Sans texte</span>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{dateFormatted}</p>

        {/* Réactions détaillées (mobile-friendly) */}
        {post.reactionsByType.length > 0 && (
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {post.reactionsByType.map((r) => (
              <span
                key={r.code}
                className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full text-gray-600 dark:text-gray-400"
              >
                {r.emoji} {r.count}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Métriques */}
      <div className="flex items-center gap-4 shrink-0">
        <Metric
          icon={Eye}
          value={post.stats.views}
          color="text-blue-500"
          label="vues"
        />
        <Metric
          icon={Heart}
          value={post.stats.reactions}
          color="text-pink-500"
          label="réactions"
        />
        <Metric
          icon={MessageCircle}
          value={post.stats.comments}
          color="text-purple-500"
          label="commentaires"
          hideOnMobile
        />
        <div className="hidden sm:flex flex-col items-center gap-0.5">
          <TrendingUp
            className={cn(
              "w-3.5 h-3.5",
              post.stats.engagementRate > 10
                ? "text-emerald-500"
                : post.stats.engagementRate > 5
                  ? "text-amber-500"
                  : "text-gray-400",
            )}
          />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {post.stats.engagementRate}%
          </span>
          <span className="text-[10px] text-gray-400">engagement</span>
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  value,
  color,
  label,
  hideOnMobile = false,
}: {
  icon: typeof Eye;
  value: number;
  color: string;
  label: string;
  hideOnMobile?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5",
        hideOnMobile && "hidden sm:flex",
      )}
    >
      <Icon className={cn("w-3.5 h-3.5", color)} />
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
      </span>
      <span className="text-[10px] text-gray-400 hidden sm:block">{label}</span>
    </div>
  );
}
