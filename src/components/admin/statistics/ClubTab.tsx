"use client";
// src/components/admin/statistics/ClubTab.tsx

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Crown, Users, TrendingUp, DollarSign } from "lucide-react";

interface ClubStats {
  subscriptions: {
    active: number;
    cancelled: number;
    expired: number;
    total: number;
  };
  byPeriod: { monthly: number; yearly: number };
  activity: {
    newSubscriptions: number;
    renewals: number;
    cancellations: number;
    expirations: number;
  };
  revenue: { monthly: number; yearly: number; total: number };
  metrics: { retentionRate: number; averageRevenuePerUser: number };
}

interface ClubTransaction {
  id: string;
  action: string;
  pricePaid: number;
  period: string;
  createdAt: string;
  user: { pseudo: string; email: string };
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " CFA";
}

const ACTION_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  subscribed: {
    label: "Nouveau",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
  },
  renewed: {
    label: "Renouvellement",
    bg: "bg-blue-100",
    text: "text-blue-700",
  },
  cancelled: {
    label: "Annulation",
    bg: "bg-orange-100",
    text: "text-orange-700",
  },
  expired: { label: "Expiré", bg: "bg-red-100", text: "text-red-700" },
};

export function ClubTab({
  stats,
  transactions,
  period,
}: {
  stats: ClubStats;
  transactions: ClubTransaction[];
  period: number;
}) {
  const statusPie = [
    { name: "Actifs", value: stats.subscriptions.active, color: "#10B981" },
    { name: "Annulés", value: stats.subscriptions.cancelled, color: "#F59E0B" },
    { name: "Expirés", value: stats.subscriptions.expired, color: "#EF4444" },
  ].filter((d) => d.value > 0);

  const periodBar = [
    {
      name: "Mensuel",
      count: stats.byPeriod.monthly,
      revenue: stats.revenue.monthly,
    },
    {
      name: "Annuel",
      count: stats.byPeriod.yearly,
      revenue: stats.revenue.yearly,
    },
  ];

  const activityItems = [
    {
      label: "Nouveaux",
      value: stats.activity.newSubscriptions,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-100",
    },
    {
      label: "Renouvellements",
      value: stats.activity.renewals,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-100",
    },
    {
      label: "Annulations",
      value: stats.activity.cancellations,
      color: "text-orange-600",
      bg: "bg-orange-50 border-orange-100",
    },
    {
      label: "Expirations",
      value: stats.activity.expirations,
      color: "text-red-600",
      bg: "bg-red-50 border-red-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Membres actifs",
            value: stats.subscriptions.active.toString(),
            Icon: Users,
            bg: "bg-emerald-50",
            ic: "text-emerald-600",
          },
          {
            label: "Taux de rétention",
            value: `${stats.metrics.retentionRate}%`,
            Icon: TrendingUp,
            bg: "bg-blue-50",
            ic: "text-blue-600",
          },
          {
            label: "Revenu total",
            value: fmt(stats.revenue.total),
            Icon: DollarSign,
            bg: "bg-purple-50",
            ic: "text-purple-600",
          },
          {
            label: "Rev. moyen / membre",
            value: fmt(stats.metrics.averageRevenuePerUser),
            Icon: Crown,
            bg: "bg-amber-50",
            ic: "text-amber-600",
          },
        ].map(({ label, value, Icon, bg, ic }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {label}
                </p>
                <p className="text-xl font-bold text-gray-900 mt-1 truncate">
                  {value}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {period} derniers jours
                </p>
              </div>
              <div className={`${bg} p-2.5 rounded-lg shrink-0 ml-2`}>
                <Icon className={`w-4 h-4 ${ic}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Statut pie */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-1">
            Statut des abonnements
          </h3>
          <p className="text-sm text-gray-500 mb-4">Répartition par état</p>
          {statusPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={statusPie}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {statusPie.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-57.5 text-gray-400 text-sm">
              Aucune donnée
            </div>
          )}
          <div className="mt-3 p-3 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Total membres (historique) :
            </span>
            <span className="font-bold text-purple-700">
              {stats.subscriptions.total}
            </span>
          </div>
        </div>

        {/* Mensuel vs Annuel */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-1">
            Mensuel vs Annuel
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Nombre d'abonnés et revenus
          </p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              data={periodBar}
              margin={{ top: 5, right: 10, bottom: 5, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="left"
                orientation="left"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(v: any, name?: string) =>
                  name === "revenue" ? fmt(Number(v)) : v
                }
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="count"
                fill="#9333EA"
                name="Abonnés"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="revenue"
                fill="#10B981"
                name="Revenus"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activité période */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Activité —{" "}
          <span className="text-gray-500 font-normal">
            {period} derniers jours
          </span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {activityItems.map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border p-4 text-center ${item.bg}`}
            >
              <p className="text-xs text-gray-600 mb-2 font-medium">
                {item.label}
              </p>
              <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Revenus détaillés */}
      <div className="rounded-xl border border-purple-200 bg-linear-to-br from-purple-50 to-pink-50 p-6">
        <div className="flex items-center gap-2 mb-5">
          <DollarSign className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Revenus détaillés</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center bg-white/70 rounded-xl p-4 border border-purple-100">
            <p className="text-sm text-gray-600 mb-2">Abonnements mensuels</p>
            <p className="text-xl font-bold text-gray-900">
              {fmt(stats.revenue.monthly)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.byPeriod.monthly} membre
              {stats.byPeriod.monthly > 1 ? "s" : ""}
            </p>
          </div>
          <div className="text-center bg-white/70 rounded-xl p-4 border border-purple-100">
            <p className="text-sm text-gray-600 mb-2">Abonnements annuels</p>
            <p className="text-xl font-bold text-gray-900">
              {fmt(stats.revenue.yearly)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.byPeriod.yearly} membre
              {stats.byPeriod.yearly > 1 ? "s" : ""}
            </p>
          </div>
          <div className="text-center bg-white/60 rounded-xl p-4 border-2 border-purple-300">
            <p className="text-sm text-gray-600 mb-2">Revenu total</p>
            <p className="text-2xl font-bold text-purple-700">
              {fmt(stats.revenue.total)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Derniers {period} jours
            </p>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold text-gray-900">
              Transactions Club LWB récentes
            </h3>
          </div>
          <span className="text-xs text-gray-400">
            20 dernières — {period}j
          </span>
        </div>
        <div className="divide-y divide-gray-50">
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              Aucune transaction sur cette période
            </div>
          ) : (
            transactions.map((t) => {
              const ac = ACTION_CONFIG[t.action] ?? {
                label: t.action,
                bg: "bg-gray-100",
                text: "text-gray-700",
              };
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Crown className="w-4 h-4 text-purple-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {t.user.pseudo}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {t.user.email}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${ac.bg} ${ac.text}`}
                    >
                      {ac.label}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${
                        t.period === "yearly"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {t.period === "yearly" ? "Annuel" : "Mensuel"}
                    </span>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-bold text-purple-700">
                      {fmt(t.pricePaid)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
