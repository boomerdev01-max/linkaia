"use client";
// src/components/admin/statistics/OverviewTab.tsx

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  Users,
  Crown,
  CreditCard,
  Wallet,
  Star,
} from "lucide-react";

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

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " CFA";
}

function fmtK(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return `${n}`;
}

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
}: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1 truncate">
            {value}
          </p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`${iconBg} p-2.5 rounded-lg shrink-0 ml-3`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

export function OverviewTab({
  data,
  period,
}: {
  data: OverviewData;
  period: number;
}) {
  const { revenue, subscriptions, userLevels, revenueByMonth } = data;

  const totalUsers =
    userLevels.free +
    userLevels.premium +
    userLevels.platinium +
    userLevels.prestige;
  const paidUsers =
    userLevels.premium + userLevels.platinium + userLevels.prestige;
  const convRate =
    totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 100) : 0;

  const levelDistrib = [
    { name: "Free", count: userLevels.free, color: "#6B7280" },
    { name: "Premium", count: userLevels.premium, color: "#3B82F6" },
    { name: "Platinium", count: userLevels.platinium, color: "#8B5CF6" },
    { name: "Prestige", count: userLevels.prestige, color: "#F59E0B" },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Revenu total"
          value={fmt(revenue.total)}
          sub={`${period} derniers jours`}
          icon={Wallet}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <KpiCard
          label="Revenus Premium"
          value={fmt(revenue.premium)}
          sub="VIP + Platinum"
          icon={CreditCard}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <KpiCard
          label="Revenus Club LWB"
          value={fmt(revenue.club)}
          sub="Mensuel + Annuel"
          icon={Crown}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <KpiCard
          label="Taux de conversion"
          value={`${convRate}%`}
          sub={`${paidUsers} / ${totalUsers} utilisateurs`}
          icon={TrendingUp}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Graphe revenus mensuels */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900">
            Évolution des revenus sur 6 mois
          </h3>
          <p className="text-sm text-gray-500">
            Premium (VIP + Platinum) vs Club LWB
          </p>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={revenueByMonth}
            margin={{ top: 5, right: 10, bottom: 5, left: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={fmtK} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: any) => fmt(Number(v))} />
            <Legend />
            <Line
              type="monotone"
              dataKey="premium"
              stroke="#3B82F6"
              strokeWidth={2}
              name="Premium"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="club"
              stroke="#8B5CF6"
              strokeWidth={2}
              name="Club LWB"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#10B981"
              strokeWidth={2.5}
              name="Total"
              strokeDasharray="5 3"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Distribution niveaux + abonnements actifs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Niveaux utilisateurs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Distribution des niveaux
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={levelDistrib}
              layout="vertical"
              margin={{ left: 10, right: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#f0f0f0"
              />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                width={60}
              />
              <Tooltip />
              <Bar dataKey="count" name="Utilisateurs" radius={[0, 4, 4, 0]}>
                {levelDistrib.map((entry, i) => (
                  <rect key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {levelDistrib.map((l) => (
              <div
                key={l.name}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: l.color }}
                  />
                  <span className="text-xs text-gray-600">{l.name}</span>
                </div>
                <span className="text-xs font-bold text-gray-800">
                  {l.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Abonnements actifs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Abonnements actifs
          </h3>
          <div className="space-y-4">
            {/* Premium */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-800 text-sm">
                    Abonnements Premium
                  </span>
                </div>
                <span className="text-2xl font-bold text-blue-700">
                  {subscriptions.premium.active}
                </span>
              </div>
              <p className="text-xs text-blue-500">
                {subscriptions.premium.total} au total (historique)
              </p>
              <div className="mt-2 bg-blue-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all"
                  style={{
                    width:
                      subscriptions.premium.total > 0
                        ? `${(subscriptions.premium.active / subscriptions.premium.total) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>

            {/* Club */}
            <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-purple-800 text-sm">
                    Club LWB
                  </span>
                </div>
                <span className="text-2xl font-bold text-purple-700">
                  {subscriptions.club.active}
                </span>
              </div>
              <p className="text-xs text-purple-500">
                {subscriptions.club.total} au total (historique)
              </p>
              <div className="mt-2 bg-purple-200 rounded-full h-1.5">
                <div
                  className="bg-purple-600 h-1.5 rounded-full transition-all"
                  style={{
                    width:
                      subscriptions.club.total > 0
                        ? `${(subscriptions.club.active / subscriptions.club.total) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>

            {/* Total */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-emerald-800 text-sm">
                    Abonnés actifs (total)
                  </span>
                </div>
                <span className="text-2xl font-bold text-emerald-700">
                  {subscriptions.premium.active + subscriptions.club.active}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
