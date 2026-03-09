"use client";
// src/components/admin/statistics/SubscriptionsTab.tsx

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
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  RefreshCw,
  ArrowDownRight,
} from "lucide-react";

interface SubStats {
  active: { free: number; vip: number; platinum: number; total: number };
  newSubscriptions: { total: number };
  renewals: number;
  downgrades: number;
  revenue: { vip: number; platinum: number; total: number };
  metrics: { conversionRate: number; churnRate: number };
}

interface Transaction {
  id: string;
  action: string;
  pricePaid: number;
  createdAt: string;
  user: { pseudo: string; email: string };
  subscriptionType: { name: string; code: string };
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
  upgraded: { label: "Upgrade", bg: "bg-blue-100", text: "text-blue-700" },
  renewed: { label: "Renouvellement", bg: "bg-sky-100", text: "text-sky-700" },
  downgraded: {
    label: "Downgrade",
    bg: "bg-orange-100",
    text: "text-orange-700",
  },
  cancelled: { label: "Annulation", bg: "bg-red-100", text: "text-red-700" },
};

const CODE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  FREE: {
    label: "Free",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
  },
  VIP: {
    label: "VIP",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  },
  PLATINUM: {
    label: "Platinum",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
};

export function SubscriptionsTab({
  stats,
  transactions,
  period,
}: {
  stats: SubStats;
  transactions: Transaction[];
  period: number;
}) {
  const pieData = [
    { name: "Free", value: stats.active.free, color: "#6B7280" },
    { name: "VIP", value: stats.active.vip, color: "#94A3B8" },
    { name: "Platinum", value: stats.active.platinum, color: "#EAB308" },
  ].filter((d) => d.value > 0);

  const revenueData = [
    { name: "VIP", revenue: stats.revenue.vip },
    { name: "Platinum", revenue: stats.revenue.platinum },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Taux de conversion",
            value: `${stats.metrics.conversionRate}%`,
            sub: "FREE → payant",
            Icon: TrendingUp,
            bg: "bg-emerald-50",
            ic: "text-emerald-600",
          },
          {
            label: "Taux de churn",
            value: `${stats.metrics.churnRate}%`,
            sub: "sur la période",
            Icon: TrendingDown,
            bg: "bg-red-50",
            ic: "text-red-500",
          },
          {
            label: "Nouveaux abonnés",
            value: stats.newSubscriptions.total.toString(),
            sub: `${period} derniers jours`,
            Icon: Users,
            bg: "bg-blue-50",
            ic: "text-blue-600",
          },
          {
            label: "Renouvellements",
            value: stats.renewals.toString(),
            sub: `${period} derniers jours`,
            Icon: RefreshCw,
            bg: "bg-sky-50",
            ic: "text-sky-600",
          },
        ].map(({ label, value, sub, Icon, bg, ic }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
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
        {/* Pie distribution */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-1">
            Répartition des abonnés actifs
          </h3>
          <p className="text-sm text-gray-500 mb-4">Par type d'abonnement</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-62.5 text-gray-400 text-sm">
              Aucune donnée
            </div>
          )}
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              { label: "Free", value: stats.active.free, color: "#6B7280" },
              { label: "VIP", value: stats.active.vip, color: "#94A3B8" },
              {
                label: "Platinum",
                value: stats.active.platinum,
                color: "#EAB308",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="text-center p-2 rounded-lg bg-gray-50"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full mx-auto mb-1"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-lg font-bold text-gray-800">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Revenus par type */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Revenus par type</h3>
          <p className="text-sm text-gray-500 mb-4">Derniers {period} jours</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={revenueData}
              margin={{ top: 5, right: 10, bottom: 5, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip formatter={(v: any) => fmt(Number(v))} />
              <Bar
                dataKey="revenue"
                fill="#3B82F6"
                name="Revenus"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Total revenus Premium :
            </span>
            <span className="font-bold text-blue-700">
              {fmt(stats.revenue.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Abonnements actifs détaillés */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Détails par plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { code: "FREE", count: stats.active.free, rev: null },
            { code: "VIP", count: stats.active.vip, rev: stats.revenue.vip },
            {
              code: "PLATINUM",
              count: stats.active.platinum,
              rev: stats.revenue.platinum,
            },
          ].map(({ code, count, rev }) => {
            const cfg = CODE_CONFIG[code];
            return (
              <div
                key={code}
                className={`rounded-xl border-2 ${cfg.border} ${cfg.bg} p-4`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-bold ${cfg.text}`}>
                    {cfg.label}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${cfg.border} ${cfg.bg} ${cfg.text}`}
                  >
                    actif
                  </span>
                </div>
                <p className={`text-3xl font-bold ${cfg.text}`}>{count}</p>
                <p className="text-xs text-gray-500 mt-1">abonnés actifs</p>
                {rev !== null && (
                  <p className="text-xs font-medium text-gray-600 mt-2 pt-2 border-t border-gray-200">
                    Revenu : {fmt(rev)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Transactions récentes */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Transactions récentes</h3>
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
              const cc =
                CODE_CONFIG[t.subscriptionType.code] ?? CODE_CONFIG["FREE"];
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-gray-500">
                        {t.user.pseudo?.[0]?.toUpperCase() ?? "?"}
                      </span>
                    </div>
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
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border shrink-0 ${cc.border} ${cc.bg} ${cc.text}`}
                    >
                      {cc.label}
                    </span>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-bold text-gray-900">
                      {t.pricePaid > 0 ? fmt(t.pricePaid) : "—"}
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
