// src/components/stats/StatsClient.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarIcon,
  Eye,
  Heart,
  MessageCircle,
  FileText,
  BookOpen,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import StatMetricCard from "@/components/stats/StatMetricCard";
import StatsChart from "@/components/stats/StatsChart";
import PostsStatsTable from "@/components/stats/PostsStatsTable";
import StoriesStatsTable from "@/components/stats/StoriesStatsTable";
import ReactionsBreakdown from "@/components/stats/ReactionsBreakdown";

interface User {
  id: string;
  nom: string;
  prenom: string;
  pseudo: string;
  email: string;
  image?: string | null;
}

type Period = "7d" | "30d" | "all" | "custom";

interface GlobalStats {
  period: string;
  dateFrom: string | null;
  dateTo: string;
  totals: {
    posts: number;
    stories: number;
    views: number;
    reactions: number;
    comments: number;
  };
  reactionsDetail: {
    code: string;
    label: string;
    emoji: string;
    count: number;
  }[];
  timeline: {
    date: string;
    views: number;
    reactions: number;
    comments: number;
  }[];
}

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "all", label: "Tout" },
  { value: "custom", label: "Personnalisé" },
];

export default function StatsClient({ user }: { user: User }) {
  const [period, setPeriod] = useState<Period>("7d");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({ period });
    if (period === "custom" && customFrom && customTo) {
      params.set("from", customFrom.toISOString());
      params.set("to", customTo.toISOString());
    }
    return `/api/my-stats?${params.toString()}`;
  }, [period, customFrom, customTo]);

  const fetchGlobalStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(buildUrl());
      const data = await res.json();
      if (data.success) setGlobalStats(data.data);
    } catch (e) {
      console.error("Erreur chargement stats:", e);
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    // Ne pas fetch si période custom sans dates
    if (period === "custom" && (!customFrom || !customTo)) return;
    fetchGlobalStats();
  }, [fetchGlobalStats, period, customFrom, customTo]);

  return (
    <div className="space-y-6">
      {/* ── En-tête ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mes statistiques
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Suivez les performances de vos publications et stories
          </p>
        </div>

        {/* Sélecteur de période */}
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p.value)}
              className={cn(
                "text-xs h-8",
                period === p.value &&
                  "bg-[#0F4C5C] hover:bg-[#0F4C5C]/90 text-white border-[#0F4C5C]",
              )}
            >
              {p.label}
            </Button>
          ))}

          {/* Date picker pour période personnalisée */}
          {period === "custom" && (
            <div className="flex items-center gap-2">
              <DatePicker
                value={customFrom}
                onChange={setCustomFrom}
                placeholder="Début"
              />
              <span className="text-gray-400 text-xs">→</span>
              <DatePicker
                value={customTo}
                onChange={setCustomTo}
                placeholder="Fin"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Métriques globales ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 animate-pulse"
            />
          ))}
        </div>
      ) : globalStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatMetricCard
            icon={FileText}
            label="Publications"
            value={globalStats.totals.posts}
            color="teal"
          />
          <StatMetricCard
            icon={BookOpen}
            label="Stories"
            value={globalStats.totals.stories}
            color="gold"
          />
          <StatMetricCard
            icon={Eye}
            label="Vues"
            value={globalStats.totals.views}
            color="blue"
          />
          <StatMetricCard
            icon={Heart}
            label="Réactions"
            value={globalStats.totals.reactions}
            color="pink"
          />
          <StatMetricCard
            icon={MessageCircle}
            label="Commentaires"
            value={globalStats.totals.comments}
            color="purple"
          />
        </div>
      ) : null}

      {/* ── Graphe d'évolution ─────────────────────────────────────────────── */}
      {!loading && globalStats && globalStats.timeline.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#0F4C5C]" />
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
              Évolution sur la période
            </h2>
          </div>
          <StatsChart data={globalStats.timeline} />
        </div>
      )}

      {/* ── Répartition des réactions ──────────────────────────────────────── */}
      {!loading && globalStats && globalStats.reactionsDetail.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">
            Répartition des réactions
          </h2>
          <ReactionsBreakdown
            data={globalStats.reactionsDetail}
            total={globalStats.totals.reactions}
          />
        </div>
      )}

      {/* ── Onglets Posts / Stories ─────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 dark:bg-gray-800">
          <TabsTrigger
            value="posts"
            className="data-[state=active]:bg-[#0F4C5C] data-[state=active]:text-white text-xs"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Publications
          </TabsTrigger>
          <TabsTrigger
            value="stories"
            className="data-[state=active]:bg-[#B88A4F] data-[state=active]:text-white text-xs"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1.5" />
            Stories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          <PostsStatsTable
            period={period}
            customFrom={customFrom}
            customTo={customTo}
          />
        </TabsContent>

        <TabsContent value="stories" className="mt-4">
          <StoriesStatsTable
            period={period}
            customFrom={customFrom}
            customTo={customTo}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── DatePicker inline ─────────────────────────────────────────────────────────
function DatePicker({
  value,
  onChange,
  placeholder,
}: {
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  placeholder: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 min-w-27.5"
        >
          <CalendarIcon className="w-3 h-3" />
          {value ? format(value, "dd/MM/yyyy", { locale: fr }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          locale={fr}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
