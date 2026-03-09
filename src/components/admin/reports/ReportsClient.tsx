"use client";
// src/components/admin/reports/ReportsClient.tsx

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  RefreshCw,
  Wallet,
  CreditCard,
  Crown,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Period = 7 | 30 | 90;

interface OverviewData {
  revenue: { premium: number; club: number; total: number };
  subscriptions: {
    premium: { total: number; active: number };
    club: { total: number; active: number };
  };
  userLevels: {
    free: number;
    premium: number;
    platinium: number;
    prestige: number;
  };
  revenueByMonth: {
    month: string;
    premium: number;
    club: number;
    total: number;
  }[];
}

const PERIODS: { value: Period; label: string }[] = [
  { value: 7, label: "7 jours" },
  { value: 30, label: "30 jours" },
  { value: 90, label: "90 jours" },
];

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " CFA";
}

function fmtK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return `${n}`;
}

// ─── Trend indicator ──────────────────────────────────────────────────────────
function Trend({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0)
    return (
      <span className="text-xs text-gray-400 flex items-center gap-0.5">
        <Minus className="w-3 h-3" /> —
      </span>
    );
  if (previous === 0)
    return (
      <span className="text-xs text-emerald-600 flex items-center gap-0.5">
        <ArrowUpRight className="w-3 h-3" /> Nouveau
      </span>
    );
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0)
    return (
      <span className="text-xs text-emerald-600 flex items-center gap-0.5">
        <ArrowUpRight className="w-3 h-3" />+{pct}%
      </span>
    );
  if (pct < 0)
    return (
      <span className="text-xs text-red-500 flex items-center gap-0.5">
        <ArrowDownRight className="w-3 h-3" />
        {pct}%
      </span>
    );
  return (
    <span className="text-xs text-gray-400 flex items-center gap-0.5">
      <Minus className="w-3 h-3" /> 0%
    </span>
  );
}

// ─── Big KPI card ─────────────────────────────────────────────────────────────
function RevenueCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  current,
  previous,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  accent: string;
  current: number;
  previous: number;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-6 relative overflow-hidden`}
    >
      {/* accent strip */}
      <div
        className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl ${accent}`}
      />
      <div className="pl-2">
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          <div
            className={`p-2 rounded-xl ${accent.replace("bg-", "bg-").replace("-600", "-100")}`}
          >
            <Icon className={`w-4 h-4 ${accent.replace("bg-", "text-")}`} />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{sub}</p>
        <div className="mt-3">
          <Trend current={current} previous={previous} />
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ReportsClient() {
  const [period, setPeriod] = useState<Period>(30);
  const [data, setData] = useState<OverviewData | null>(null);
  const [prevData, setPrevData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch période courante
      const res = await fetch(
        `/api/admin/services/statistics?tab=overview&days=${p}`,
      );
      if (!res.ok) throw new Error("Erreur de chargement");
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Erreur inconnue");
      setData(json.overview);

      // Fetch période précédente pour les tendances (double la période)
      const resPrev = await fetch(
        `/api/admin/services/statistics?tab=overview&days=${p * 2}`,
      );
      if (resPrev.ok) {
        const jsonPrev = await resPrev.json();
        if (jsonPrev.success) setPrevData(jsonPrev.overview);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  // Revenus période précédente (approximation : total - current)
  const prevTotal = prevData
    ? prevData.revenue.total - (data?.revenue.total ?? 0)
    : 0;
  const prevPremium = prevData
    ? prevData.revenue.premium - (data?.revenue.premium ?? 0)
    : 0;
  const prevClub = prevData
    ? prevData.revenue.club - (data?.revenue.club ?? 0)
    : 0;

  const pieData = data
    ? [
        { name: "Premium", value: data.revenue.premium, color: "#3B82F6" },
        { name: "Club LWB", value: data.revenue.club, color: "#9333EA" },
      ].filter((d) => d.value > 0)
    : [];

  // Meilleur mois
  const topMonth = data?.revenueByMonth.reduce(
    (best, m) => (m.total > (best?.total ?? 0) ? m : best),
    data.revenueByMonth[0],
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* ── Period selector ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {PERIODS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                ${
                  period === value
                    ? "bg-[#0F4C5C] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => fetchData(period)}
          disabled={loading}
          className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-[#0F4C5C] animate-spin" />
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* ── KPI cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <RevenueCard
              label="Revenu total"
              value={fmt(data.revenue.total)}
              sub={`Sur les ${period} derniers jours`}
              icon={Wallet}
              accent="bg-emerald-600"
              current={data.revenue.total}
              previous={prevTotal}
            />
            <RevenueCard
              label="Abonnements Premium"
              value={fmt(data.revenue.premium)}
              sub="VIP + Platinum"
              icon={CreditCard}
              accent="bg-blue-600"
              current={data.revenue.premium}
              previous={prevPremium}
            />
            <RevenueCard
              label="Club LWB"
              value={fmt(data.revenue.club)}
              sub="Mensuel + Annuel"
              icon={Crown}
              accent="bg-purple-600"
              current={data.revenue.club}
              previous={prevClub}
            />
          </div>

          {/* ── Area chart + Pie ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Area chart — 6 mois */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="mb-5">
                <h3 className="font-semibold text-gray-900">
                  Évolution des revenus
                </h3>
                <p className="text-sm text-gray-500">
                  6 derniers mois — Premium vs Club LWB
                </p>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={data.revenueByMonth}
                  margin={{ top: 5, right: 10, bottom: 5, left: 10 }}
                >
                  <defs>
                    <linearGradient
                      id="gradPremium"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#3B82F6"
                        stopOpacity={0.15}
                      />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradClub" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#9333EA"
                        stopOpacity={0.15}
                      />
                      <stop offset="95%" stopColor="#9333EA" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={fmtK} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: any) => fmt(Number(v))} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="premium"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#gradPremium)"
                    name="Premium"
                    dot={{ r: 3 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="club"
                    stroke="#9333EA"
                    strokeWidth={2}
                    fill="url(#gradClub)"
                    name="Club LWB"
                    dot={{ r: 3 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fill="url(#gradTotal)"
                    name="Total"
                    dot={{ r: 3 }}
                    strokeDasharray="5 3"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Pie répartition */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
              <div className="mb-5">
                <h3 className="font-semibold text-gray-900">Répartition</h3>
                <p className="text-sm text-gray-500">Sources de revenus</p>
              </div>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {pieData.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => fmt(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-auto space-y-2">
                    {pieData.map((item) => {
                      const pct =
                        data.revenue.total > 0
                          ? Math.round((item.value / data.revenue.total) * 100)
                          : 0;
                      return (
                        <div
                          key={item.name}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-gray-600">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-gray-800">
                              {pct}%
                            </span>
                            <span className="text-gray-400 text-xs ml-2">
                              {fmt(item.value)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                  Aucun revenu sur la période
                </div>
              )}
            </div>
          </div>

          {/* ── Résumé financier + meilleur mois ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Résumé abonnements actifs */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Abonnés actifs
              </h3>
              <div className="space-y-3">
                {[
                  {
                    label: "Premium (VIP + Platinum)",
                    count: data.subscriptions.premium.active,
                    total: data.subscriptions.premium.total,
                    color: "bg-blue-500",
                    bg: "bg-blue-50",
                    text: "text-blue-700",
                  },
                  {
                    label: "Club LWB",
                    count: data.subscriptions.club.active,
                    total: data.subscriptions.club.total,
                    color: "bg-purple-500",
                    bg: "bg-purple-50",
                    text: "text-purple-700",
                  },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl ${item.bg} p-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${item.text}`}>
                        {item.label}
                      </span>
                      <span className={`text-xl font-bold ${item.text}`}>
                        {item.count}
                      </span>
                    </div>
                    <div className="bg-white/60 rounded-full h-1.5">
                      <div
                        className={`${item.color} h-1.5 rounded-full transition-all`}
                        style={{
                          width:
                            item.total > 0
                              ? `${Math.min((item.count / item.total) * 100, 100)}%`
                              : "0%",
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {item.total} au total (historique)
                    </p>
                  </div>
                ))}

                {/* Total abonnés payants */}
                <div className="rounded-xl bg-[#0F4C5C]/5 border border-[#0F4C5C]/10 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#0F4C5C]" />
                    <span className="text-sm font-semibold text-[#0F4C5C]">
                      Total abonnés payants
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-[#0F4C5C]">
                    {data.subscriptions.premium.active +
                      data.subscriptions.club.active}
                  </span>
                </div>
              </div>
            </div>

            {/* Meilleur mois + total cumulé */}
            <div className="space-y-4">
              {/* Meilleur mois */}
              {topMonth && (
                <div className="bg-linear-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-semibold text-gray-900">
                      Meilleur mois (6 mois)
                    </h3>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {topMonth.month}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Premium : {fmt(topMonth.premium)} · Club :{" "}
                        {fmt(topMonth.club)}
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-600">
                      {fmt(topMonth.total)}
                    </p>
                  </div>
                </div>
              )}

              {/* Récapitulatif sources */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Récapitulatif période
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      label: "Abonnements Premium",
                      value: data.revenue.premium,
                      icon: CreditCard,
                      color: "text-blue-600",
                      bg: "bg-blue-50",
                    },
                    {
                      label: "Club LWB",
                      value: data.revenue.club,
                      icon: Crown,
                      color: "text-purple-600",
                      bg: "bg-purple-50",
                    },
                  ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`${bg} p-1.5 rounded-lg`}>
                          <Icon className={`w-3.5 h-3.5 ${color}`} />
                        </div>
                        <span className="text-sm text-gray-600">{label}</span>
                      </div>
                      <span className="font-semibold text-gray-800 text-sm">
                        {fmt(value)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#0F4C5C] mt-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-white" />
                      <span className="text-sm font-semibold text-white">
                        Total
                      </span>
                    </div>
                    <span className="font-bold text-white">
                      {fmt(data.revenue.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
