"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Download,
  ExternalLink,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  XCircle,
  Banknote,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Transaction {
  id: string;
  source: "stripe" | "premium" | "club";
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  plan: string;
  status: string;
  date: string;
  invoiceUrl: string | null;
  invoicePdf: string | null;
}

interface Stats {
  totalRevenue: number;
  totalCount: number;
  totalActive: number;
  totalCancelled: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatAmount(amount: number, currency: string) {
  if (currency === "XOF" || currency === "CFA") {
    return `${amount.toLocaleString("fr-FR")} ${currency}`;
  }
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  stripe:  { label: "Stripe",   color: "bg-violet-100 text-violet-700 border-violet-200" },
  premium: { label: "Premium",  color: "bg-blue-100 text-blue-700 border-blue-200" },
  club:    { label: "Club",     color: "bg-amber-100 text-amber-700 border-amber-200" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  active:    { label: "Actif",    icon: CheckCircle, color: "text-emerald-600" },
  cancelled: { label: "Annulé",  icon: XCircle,     color: "text-red-500"     },
  paid:      { label: "Payé",    icon: CheckCircle, color: "text-emerald-600" },
};

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  label: string;
  value: string;
  icon: any;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
      <div className={`h-11 w-11 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TransactionsClient() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats]               = useState<Stats | null>(null);
  const [pagination, setPagination]     = useState<Pagination | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");

  // Filters
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("");
  const [plan,     setPlan]     = useState("");
  const [source,   setSource]   = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [page,     setPage]     = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, status, plan, source, dateFrom, dateTo]);

  // Fetch
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page:     String(page),
        limit:    "20",
        search:   debouncedSearch,
        status,
        plan,
        source,
        dateFrom,
        dateTo,
      });
      const res = await fetch(`/api/admin/services/transactions?${params}`);
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();
      setTransactions(data.transactions);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch {
      setError("Impossible de charger les transactions.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, plan, source, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Export CSV
  const exportCSV = () => {
    if (!transactions.length) return;
    const headers = ["ID", "Source", "Utilisateur", "Email", "Montant", "Devise", "Plan", "Statut", "Date"];
    const rows = transactions.map((t) => [
      t.id, t.source, t.userName, t.userEmail,
      t.amount, t.currency, t.plan, t.status,
      formatDate(t.date),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearch(""); setStatus(""); setPlan(""); setSource("all");
    setDateFrom(""); setDateTo(""); setPage(1);
  };

  const hasActiveFilters = search || status || plan || source !== "all" || dateFrom || dateTo;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* ── Stats ── */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Revenus totaux"
            value={`${stats.totalRevenue.toLocaleString("fr-FR")} XOF`}
            icon={Banknote}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-100"
          />
          <StatCard
            label="Total transactions"
            value={String(stats.totalCount)}
            icon={TrendingUp}
            iconColor="text-blue-600"
            iconBg="bg-blue-100"
          />
          <StatCard
            label="Actives"
            value={String(stats.totalActive)}
            icon={CheckCircle}
            iconColor="text-violet-600"
            iconBg="bg-violet-100"
          />
          <StatCard
            label="Annulées"
            value={String(stats.totalCancelled)}
            icon={XCircle}
            iconColor="text-red-500"
            iconBg="bg-red-100"
          />
        </div>
      )}

      {/* ── Barre filtres ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Recherche */}
          <div className="relative flex-1 min-w-50">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/30 focus:border-[#0F4C5C]"
            />
          </div>

          {/* Source */}
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/30 focus:border-[#0F4C5C] bg-white"
          >
            <option value="all">Toutes sources</option>
            <option value="stripe">Stripe</option>
            <option value="premium">Premium</option>
            <option value="club">Club</option>
          </select>

          {/* Statut */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/30 focus:border-[#0F4C5C] bg-white"
          >
            <option value="">Tous statuts</option>
            <option value="active">Actif</option>
            <option value="cancelled">Annulé</option>
          </select>

          {/* Date from */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/30 focus:border-[#0F4C5C]"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/30 focus:border-[#0F4C5C]"
          />

          {/* Actions */}
          <div className="flex gap-2 ml-auto">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <Filter className="h-4 w-4" />
                Réinitialiser
              </button>
            )}
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={exportCSV}
              disabled={!transactions.length}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-[#0F4C5C] rounded-lg hover:bg-[#0a3540] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-red-500 text-sm">{error}</div>
        ) : loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-[#0F4C5C] mx-auto mb-2" />
            <p className="text-sm text-gray-500">Chargement…</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            Aucune transaction trouvée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Facture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((t) => {
                  const src    = SOURCE_LABELS[t.source];
                  const stConf = STATUS_CONFIG[t.status] ?? { label: t.status, icon: null, color: "text-gray-500" };
                  const StIcon = stConf.icon;

                  return (
                    <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Utilisateur */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{t.userName}</p>
                        <p className="text-xs text-gray-400">{t.userEmail}</p>
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${src.color}`}>
                          {src.label}
                        </span>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3 text-gray-700">{t.plan}</td>

                      {/* Montant */}
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatAmount(t.amount, t.currency)}
                      </td>

                      {/* Statut */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${stConf.color}`}>
                          {StIcon && <StIcon className="h-3.5 w-3.5" />}
                          {stConf.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-gray-500">{formatDate(t.date)}</td>

                      {/* Facture */}
                      <td className="px-4 py-3 text-center">
                        {t.invoiceUrl || t.invoicePdf ? (
                          <div className="flex items-center justify-center gap-2">
                            {t.invoiceUrl && (
                              <a
                                href={t.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Voir la facture"
                                className="text-[#0F4C5C] hover:text-[#B88A4F] transition-colors"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                            {t.invoicePdf && (
                              <a
                                href={t.invoicePdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Télécharger le PDF"
                                className="text-[#0F4C5C] hover:text-[#B88A4F] transition-colors"
                              >
                                <FileText className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} résultat{pagination.total > 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const p = pagination.totalPages <= 5
                  ? i + 1
                  : Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-md text-sm font-medium transition ${
                      p === pagination.page
                        ? "bg-[#0F4C5C] text-white"
                        : "hover:bg-gray-100 text-gray-600"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}