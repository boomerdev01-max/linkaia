// src/components/stats/StoriesStatsTable.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  Heart,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface StoryStat {
  id: string;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
  preview: {
    type: string;
    mediaUrl: string | null;
    textContent: string | null;
    bgColor: string | null;
  } | null;
  stats: {
    views: number;
    reactions: number;
  };
  emojiBreakdown: { emoji: string; count: number }[];
}

interface StoriesStatsTableProps {
  period: string;
  customFrom?: Date;
  customTo?: Date;
}

export default function StoriesStatsTable({
  period,
  customFrom,
  customTo,
}: StoriesStatsTableProps) {
  const [stories, setStories] = useState<StoryStat[]>([]);
  const [totals, setTotals] = useState({ stories: 0, views: 0, reactions: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasMore: false,
  });

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period,
        page: page.toString(),
        limit: "10",
      });
      if (period === "custom" && customFrom && customTo) {
        params.set("from", customFrom.toISOString());
        params.set("to", customTo.toISOString());
      }
      const res = await fetch(`/api/my-stats/stories?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStories(data.data.stories);
        setPagination(data.data.pagination);
        setTotals(data.data.totals);
      }
    } catch (e) {
      console.error("Erreur chargement stories stats:", e);
    } finally {
      setLoading(false);
    }
  }, [period, page, customFrom, customTo]);

  useEffect(() => {
    setPage(1);
  }, [period]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  return (
    <div className="space-y-4">
      {/* Totaux stories */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <BookOpen className="w-4 h-4 text-[#B88A4F] mx-auto mb-1" />
          <p className="text-xl font-bold text-[#B88A4F]">{totals.stories}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Stories</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <Eye className="w-4 h-4 text-blue-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {totals.views}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Vues</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <Heart className="w-4 h-4 text-pink-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-pink-500">{totals.reactions}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Réactions</p>
        </div>
      </div>

      {/* Tableau stories */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Détail par story
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-[#B88A4F]" />
          </div>
        ) : stories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-700" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucune story sur cette période
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {stories.map((story) => (
              <StoryStatRow key={story.id} story={story} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {pagination.total} storie{pagination.total > 1 ? "s" : ""}
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
    </div>
  );
}

// ── Ligne d'une story ─────────────────────────────────────────────────────────
function StoryStatRow({ story }: { story: StoryStat }) {
  const dateFormatted = (() => {
    try {
      return format(parseISO(story.createdAt), "d MMM yyyy, HH:mm", {
        locale: fr,
      });
    } catch {
      return story.createdAt;
    }
  })();

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      {/* Aperçu story */}
      <div
        className="w-10 h-16 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-sm"
        style={{
          background:
            story.preview?.type === "TEXT" && story.preview.bgColor
              ? story.preview.bgColor
              : story.preview?.mediaUrl
                ? undefined
                : "linear-gradient(135deg, #0F4C5C, #B88A4F)",
        }}
      >
        {story.preview?.mediaUrl ? (
          <img
            src={story.preview.mediaUrl}
            alt="Story"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white text-[10px] text-center px-1 leading-tight">
            {story.preview?.textContent?.substring(0, 20) ?? "Story"}
          </span>
        )}
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {dateFormatted}
          </p>
          {story.isExpired && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-full">
              <Clock className="w-2.5 h-2.5" />
              Expirée
            </span>
          )}
        </div>

        {/* Emojis réactions */}
        {story.emojiBreakdown.length > 0 && (
          <div className="flex gap-1 mt-1">
            {story.emojiBreakdown.map(({ emoji, count }) => (
              <span
                key={emoji}
                className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full"
              >
                {emoji} {count}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Métriques */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex flex-col items-center gap-0.5">
          <Eye className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {story.stats.views}
          </span>
          <span className="text-[10px] text-gray-400">vues</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Heart className="w-3.5 h-3.5 text-pink-500" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {story.stats.reactions}
          </span>
          <span className="text-[10px] text-gray-400">réactions</span>
        </div>
      </div>
    </div>
  );
}
