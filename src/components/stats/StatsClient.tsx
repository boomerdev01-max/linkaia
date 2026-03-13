"use client";

// src/components/stats/StatsClient.tsx
// StatsClient étendu avec 3 onglets :
//   1. Publications  — contenu existant intact
//   2. Stories       — contenu existant intact
//   3. Monétisation  — NOUVEAU : wallet, cadeaux, lives, impact score

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
  Gem,
  Gift,
  Video,
  Star,
  Zap,
  Coins,
  Trophy,
  Globe,
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
  reactionsDetail: { code: string; label: string; emoji: string; count: number }[];
  timeline: { date: string; views: number; reactions: number; comments: number }[];
}

interface CreatorStats {
  impactScore: number;
  bonusEligible: boolean;
  lifetime: {
    totalLgemsEarned: number;
    totalDiamondsEarned: number;
    totalImpactGenerated: number;
  };
  period_stats: {
    totalLgemsFromGifts: number;
    totalDiamondsFromGifts: number;
    totalImpact: number;
    totalLivesRevenue: number;
    ticketsSold: number;
    giftsReceivedCount: number;
    livesCount: number;
  };
  giftsByType: { code: string; name: string; emoji: string; count: number; totalLgems: number }[];
  recentGifts: {
    id: string;
    giftName: string;
    giftEmoji: string;
    lgemsAmount: number;
    diamondsAwarded: number;
    senderPseudo: string;
    senderAvatar: string | null;
    liveId: string | null;
    postId: string | null;
    createdAt: string;
  }[];
  lives: {
    id: string;
    title: string;
    type: string;
    status: string;
    peakViewers: number;
    totalGiftsLgems: number;
    totalTicketsSold: number;
    startedAt: string | null;
    endedAt: string | null;
  }[];
  giftsTimeline: { date: string; lgems: number; diamonds: number }[];
  badges: { code: string; name: string; emoji: string; level: number; earnedAt: string }[];
}

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "all", label: "Tout" },
  { value: "custom", label: "Personnalisé" },
];

const BRAND = "#0F4C5C";
const GOLD  = "#B88A4F";

export default function StatsClient({ user }: { user: User }) {
  const [period, setPeriod]         = useState<Period>("7d");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo]     = useState<Date | undefined>();
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [creatorStats, setCreatorStats] = useState<CreatorStats | null>(null);
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [loadingCreator, setLoadingCreator] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  // ── URL builder ────────────────────────────────────────────────────────────
  const buildUrl = useCallback((base: string) => {
    const params = new URLSearchParams({ period });
    if (period === "custom" && customFrom && customTo) {
      params.set("from", customFrom.toISOString());
      params.set("to", customTo.toISOString());
    }
    return `${base}?${params.toString()}`;
  }, [period, customFrom, customTo]);

  // ── Fetch stats globales (Publications + Stories) ──────────────────────────
  const fetchGlobalStats = useCallback(async () => {
    setLoadingGlobal(true);
    try {
      const res = await fetch(buildUrl("/api/my-stats"));
      const data = await res.json();
      if (data.success) setGlobalStats(data.data);
    } catch (e) {
      console.error("Erreur stats globales:", e);
    } finally {
      setLoadingGlobal(false);
    }
  }, [buildUrl]);

  // ── Fetch stats créateur (Monétisation) ────────────────────────────────────
  const fetchCreatorStats = useCallback(async () => {
    setLoadingCreator(true);
    try {
      const res = await fetch(buildUrl("/api/my-stats/creator"));
      const data = await res.json();
      if (data.success) setCreatorStats(data.data);
    } catch (e) {
      console.error("Erreur stats créateur:", e);
    } finally {
      setLoadingCreator(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    if (period === "custom" && (!customFrom || !customTo)) return;
    fetchGlobalStats();
  }, [fetchGlobalStats, period, customFrom, customTo]);

  // Charger les stats créateur seulement quand l'onglet est actif
  useEffect(() => {
    if (activeTab !== "monetisation") return;
    if (period === "custom" && (!customFrom || !customTo)) return;
    fetchCreatorStats();
  }, [activeTab, fetchCreatorStats, period, customFrom, customTo]);

  // ── Header commun : titre + sélecteur de période ──────────────────────────
  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Mes statistiques
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Suivez les performances de vos publications, stories et revenus
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p.value}
            variant={period === p.value ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p.value)}
            className={cn(
              "text-xs h-8",
              period === p.value && "bg-[#0F4C5C] hover:bg-[#0F4C5C]/90 text-white"
            )}
          >
            {p.label}
          </Button>
        ))}
        {period === "custom" && (
          <div className="flex items-center gap-2">
            <DatePicker value={customFrom} onChange={setCustomFrom} placeholder="Début" />
            <span className="text-gray-400 text-xs">→</span>
            <DatePicker value={customTo} onChange={setCustomTo} placeholder="Fin" />
          </div>
        )}
      </div>
    </div>
  );

  // ── Onglet Publications ────────────────────────────────────────────────────
  const renderPublications = () => (
    <div className="space-y-6">
      {/* Métriques globales */}
      {loadingGlobal ? (
        <SkeletonCards count={5} />
      ) : globalStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatMetricCard icon={FileText}       label="Publications" value={globalStats.totals.posts}     color="teal" />
          <StatMetricCard icon={BookOpen}        label="Stories"      value={globalStats.totals.stories}   color="gold" />
          <StatMetricCard icon={Eye}             label="Vues"         value={globalStats.totals.views}     color="blue" />
          <StatMetricCard icon={Heart}           label="Réactions"    value={globalStats.totals.reactions} color="pink" />
          <StatMetricCard icon={MessageCircle}   label="Commentaires" value={globalStats.totals.comments}  color="purple" />
        </div>
      ) : null}

      {/* Graphe d'évolution */}
      {!loadingGlobal && globalStats && globalStats.timeline.length > 0 && (
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

      {/* Réactions */}
      {!loadingGlobal && globalStats && globalStats.reactionsDetail.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">
            Répartition des réactions
          </h2>
          <ReactionsBreakdown data={globalStats.reactionsDetail} total={globalStats.totals.reactions} />
        </div>
      )}

      {/* Tableau détaillé des posts */}
      <PostsStatsTable period={period} customFrom={customFrom} customTo={customTo} />
    </div>
  );

  // ── Onglet Stories ─────────────────────────────────────────────────────────
  const renderStories = () => (
    <div className="space-y-6">
      <StoriesStatsTable period={period} customFrom={customFrom} customTo={customTo} />
    </div>
  );

  // ── Onglet Monétisation ────────────────────────────────────────────────────
  const renderMonetisation = () => {
    if (loadingCreator) return <SkeletonCards count={6} />;
    if (!creatorStats)  return <EmptyCreator />;

    const { impactScore, period_stats, giftsByType, recentGifts, lives, badges, giftsTimeline } = creatorStats;

    return (
      <div className="space-y-6">
        {/* ── Impact Score + Badges ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Impact Score */}
          <div className="md:col-span-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col items-center justify-center gap-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Linkaïa Impact Score
            </div>
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={BRAND} strokeWidth="10"
                  strokeDasharray={`${(impactScore / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{impactScore}</span>
                <span className="text-xs text-gray-500">/100</span>
              </div>
            </div>
            {creatorStats.bonusEligible && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-200">
                <Star className="w-3 h-3 fill-amber-500" />
                Éligible Ambassadeur de Paix
              </span>
            )}
          </div>

          {/* Badges */}
          <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-[#B88A4F]" />
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Mes badges</h3>
            </div>
            {badges.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                Envoyez des cadeaux et animez des lives pour débloquer vos premiers badges.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {badges.map((b) => (
                  <div
                    key={b.code}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <span className="text-xl">{b.emoji}</span>
                    <div>
                      <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{b.name}</div>
                      <div className="text-xs text-gray-400">
                        Niveau {b.level} · {format(new Date(b.earnedAt), "MMM yyyy", { locale: fr })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── KPIs monétisation ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon="💎" label="L-Gems reçus" value={period_stats.totalLgemsFromGifts}
            sub="via cadeaux" color="teal"
          />
          <MetricCard
            icon="💠" label="Diamonds gagnés" value={Math.floor(period_stats.totalDiamondsFromGifts)}
            sub="après commission 30%" color="blue"
          />
          <MetricCard
            icon="🎁" label="Cadeaux reçus" value={period_stats.giftsReceivedCount}
            sub={`${period_stats.livesCount} live(s)`} color="purple"
          />
          <MetricCard
            icon="🌍" label="Impact généré" value={`${period_stats.totalImpact.toFixed(0)} L-Gems`}
            sub="reversés aux ONG" color="gold"
          />
        </div>

        {/* ── Évolution des dons ────────────────────────────────────────── */}
        {giftsTimeline.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#0F4C5C]" />
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                Évolution des L-Gems reçus
              </h3>
            </div>
            <GiftsTimelineChart data={giftsTimeline} />
          </div>
        )}

        {/* ── Répartition par type de cadeau ────────────────────────────── */}
        {giftsByType.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-4 h-4 text-[#0F4C5C]" />
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                Cadeaux reçus par type
              </h3>
            </div>
            <div className="space-y-3">
              {giftsByType.map((g) => {
                const maxLgems = giftsByType[0]?.totalLgems ?? 1;
                const pct = Math.round((g.totalLgems / maxLgems) * 100);
                return (
                  <div key={g.code} className="flex items-center gap-3">
                    <span className="text-lg w-8 text-center">{g.emoji}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300 mb-1">
                        <span className="font-medium">{g.name}</span>
                        <span className="text-gray-400">×{g.count} — {g.totalLgems} L-Gems</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: BRAND }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Lives ─────────────────────────────────────────────────────── */}
        {lives.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Video className="w-4 h-4 text-[#0F4C5C]" />
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                Mes lives & webinaires
              </h3>
            </div>
            <div className="space-y-2">
              {lives.map((live) => (
                <div
                  key={live.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg">{live.type === "webinar" ? "🎓" : "🎥"}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{live.title}</p>
                      <p className="text-xs text-gray-400">
                        {live.peakViewers} spectateurs max · {live.totalTicketsSold} tickets vendus
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-semibold text-[#0F4C5C]">{live.totalGiftsLgems} 💎</p>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      live.status === "live"    && "bg-green-100 text-green-700",
                      live.status === "ended"   && "bg-gray-100 text-gray-500",
                      live.status === "scheduled" && "bg-blue-100 text-blue-600",
                    )}>
                      {live.status === "live" ? "En direct" : live.status === "ended" ? "Terminé" : "Programmé"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Derniers cadeaux reçus ────────────────────────────────────── */}
        {recentGifts.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Gem className="w-4 h-4 text-[#0F4C5C]" />
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                Derniers cadeaux reçus
              </h3>
            </div>
            <div className="space-y-2">
              {recentGifts.map((g) => (
                <div key={g.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{g.giftEmoji}</span>
                    <div>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        <span className="font-medium">{g.senderPseudo}</span> vous a offert{" "}
                        <span className="font-medium text-[#0F4C5C]">{g.giftName}</span>
                        {g.liveId && <span className="ml-1 text-xs text-gray-400">(en live)</span>}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(g.createdAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#0F4C5C]">+{g.lgemsAmount} 💎</p>
                    <p className="text-xs text-gray-400">→ {g.diamondsAwarded.toFixed(1)} 💠</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Totaux lifetime ───────────────────────────────────────────── */}
        <div className="bg-linear-to-r from-[#0F4C5C]/5 to-[#B88A4F]/5 rounded-xl border border-[#0F4C5C]/10 p-5">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#B88A4F]" />
            Totaux cumulés depuis le début
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[#0F4C5C]">
                {creatorStats.lifetime.totalLgemsEarned.toLocaleString("fr-FR")}
              </p>
              <p className="text-xs text-gray-500">L-Gems reçus</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0F4C5C]">
                {Math.floor(creatorStats.lifetime.totalDiamondsEarned).toLocaleString("fr-FR")}
              </p>
              <p className="text-xs text-gray-500">Diamonds gagnés</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#B88A4F]">
                {creatorStats.lifetime.totalImpactGenerated.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">L-Gems reversés aux ONG</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Rendu principal ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {renderHeader()}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 dark:bg-gray-800 h-10">
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
          <TabsTrigger
            value="monetisation"
            className="data-[state=active]:bg-[#0F4C5C] data-[state=active]:text-white text-xs"
          >
            <Gem className="w-3.5 h-3.5 mr-1.5" />
            Monétisation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts"       className="mt-5">{renderPublications()}</TabsContent>
        <TabsContent value="stories"     className="mt-5">{renderStories()}</TabsContent>
        <TabsContent value="monetisation" className="mt-5">{renderMonetisation()}</TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SOUS-COMPOSANTS UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

function MetricCard({
  icon, label, value, sub, color,
}: {
  icon: string; label: string; value: number | string; sub?: string; color: string;
}) {
  const colors: Record<string, string> = {
    teal:   "bg-teal-50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800",
    blue:   "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800",
    purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800",
    gold:   "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800",
  };
  return (
    <div className={cn("rounded-xl border p-4", colors[color] ?? colors.teal)}>
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{typeof value === "number" ? value.toLocaleString("fr-FR") : value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function GiftsTimelineChart({ data }: { data: { date: string; lgems: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.lgems), 1);
  return (
    <div className="flex items-end gap-1 h-28 w-full">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full rounded-t-sm transition-all duration-300"
            style={{
              height: `${Math.max((d.lgems / max) * 100, d.lgems > 0 ? 4 : 0)}%`,
              backgroundColor: d.lgems > 0 ? "#0F4C5C" : "#E5E7EB",
            }}
          />
          <span className="text-[9px] text-gray-400 hidden group-hover:block absolute -top-5 bg-white dark:bg-gray-800 px-1 rounded shadow text-nowrap">
            {d.lgems} 💎
          </span>
        </div>
      ))}
    </div>
  );
}

function SkeletonCards({ count }: { count: number }) {
  return (
    <div className={cn("grid gap-4", count <= 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 lg:grid-cols-5")}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-28 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyCreator() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">💎</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Linkaïa Studio
      </h3>
      <p className="text-sm text-gray-500 max-w-sm">
        Recevez vos premiers cadeaux virtuels ou animez un live pour voir vos statistiques de monétisation ici.
      </p>
    </div>
  );
}

function DatePicker({ value, onChange, placeholder }: {
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  placeholder: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 min-w-27.5">
          <CalendarIcon className="w-3 h-3" />
          {value ? format(value, "dd/MM/yyyy", { locale: fr }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} locale={fr} initialFocus />
      </PopoverContent>
    </Popover>
  );
}