"use client";
// src/components/admin/statistics/StatisticsClient.tsx

import { useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, LayoutDashboard, Star, Crown } from "lucide-react";
import { OverviewTab } from "@/components/admin/statistics/OverviewTab";
import { SubscriptionsTab } from "@/components/admin/statistics/SubscriptionsTab";
import { ClubTab } from "@/components/admin/statistics/ClubTab";

type Tab = "overview" | "subscriptions" | "club";
type Period = 7 | 30 | 90;

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "subscriptions", label: "Abonnements Premium", icon: Star },
  { id: "club", label: "Club LWB", icon: Crown },
];

const PERIODS: { value: Period; label: string }[] = [
  { value: 7, label: "7j" },
  { value: 30, label: "30j" },
  { value: 90, label: "90j" },
];

export default function StatisticsClient() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [period, setPeriod] = useState<Period>(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (tab: Tab, p: Period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/services/statistics?tab=${tab}&days=${p}`,
      );
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Erreur inconnue");
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTab, period);
  }, [activeTab, period, fetchData]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setData(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* ── Controls bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                ${
                  activeTab === id
                    ? "bg-white text-[#0F4C5C] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Period selector */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 sm:ml-auto">
          {PERIODS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200
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

        {/* Refresh */}
        <button
          onClick={() => fetchData(activeTab, period)}
          disabled={loading}
          className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
          title="Rafraîchir"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── Content ── */}
      {loading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-[#0F4C5C] animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {activeTab === "overview" && (
            <OverviewTab data={data.overview} period={period} />
          )}
          {activeTab === "subscriptions" && (
            <SubscriptionsTab
              stats={data.stats}
              transactions={data.recentTransactions}
              period={period}
            />
          )}
          {activeTab === "club" && (
            <ClubTab
              stats={data.stats}
              transactions={data.recentTransactions}
              period={period}
            />
          )}
        </>
      )}
    </div>
  );
}
