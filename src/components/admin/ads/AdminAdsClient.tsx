// src/components/admin/ads/AdminAdsClient.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  PlayCircle,
  PauseCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  X,
  TrendingUp,
  MousePointerClick,
  Euro,
  Users,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdCampaign {
  id: string;
  name: string;
  objective: string;
  billingModel: string;
  totalBudget: number;
  amountSpent: number;
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  status: "draft" | "pending" | "active" | "paused" | "ended" | "rejected";
  rejectedReason: string | null;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  advertiser: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    companyProfile: { companyName: string } | null;
  };
  creative: {
    title: string;
    body: string;
    imageUrl: string | null;
    ctaLabel: string;
    ctaUrl: string | null;
  } | null;
  targeting: {
    interestCodes: string[];
    countryCodes: string[];
    ageMin: number | null;
    ageMax: number | null;
    genders: string[];
    educationLevelCodes: string[];
  } | null;
  _count: { impressions: number; clicks: number };
}

interface CampaignStats {
  pending: number;
  active: number;
  paused: number;
  ended: number;
  rejected: number;
  total: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft: {
    label: "Brouillon",
    icon: Clock,
    bg: "bg-gray-50",
    text: "text-gray-500",
    border: "border-gray-200",
    dot: "bg-gray-400",
  },
  pending: {
    label: "En attente",
    icon: Clock,
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  active: {
    label: "Active",
    icon: PlayCircle,
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  paused: {
    label: "En pause",
    icon: PauseCircle,
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-400",
  },
  ended: {
    label: "Terminée",
    icon: CheckCircle,
    bg: "bg-gray-50",
    text: "text-gray-500",
    border: "border-gray-200",
    dot: "bg-gray-400",
  },
  rejected: {
    label: "Rejetée",
    icon: XCircle,
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

function StatusBadge({ status }: { status: AdCampaign["status"] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatEur(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function AdminAdsClient() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [stats, setStats] = useState<CampaignStats>({
    pending: 0,
    active: 0,
    paused: 0,
    ended: 0,
    rejected: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [total, setTotal] = useState(0);

  // Modal détail
  const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null);

  // Modal rejet
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);

  // Actions en cours
  const [actionId, setActionId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  // ── Chargement ──────────────────────────────────────────────────────────────
  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "50");

      const res = await fetch(`/api/admin/ads?${params}`);
      const data = await res.json();

      if (data.success) {
        setCampaigns(data.campaigns);
        setTotal(data.pagination?.total ?? data.campaigns.length);

        // Calculer les stats depuis tous les statuts
        // On refetch sans filtre pour avoir les compteurs globaux
        const allRes = await fetch("/api/admin/ads?limit=200");
        const allData = await allRes.json();
        if (allData.success) {
          const all: AdCampaign[] = allData.campaigns;
          setStats({
            pending: all.filter((c) => c.status === "pending").length,
            active: all.filter((c) => c.status === "active").length,
            paused: all.filter((c) => c.status === "paused").length,
            ended: all.filter((c) => c.status === "ended").length,
            rejected: all.filter((c) => c.status === "rejected").length,
            total: all.length,
          });
        }
      }
    } catch (err) {
      console.error("❌ fetchCampaigns:", err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // ── Filtrage local ──────────────────────────────────────────────────────────
  const filtered = campaigns.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.advertiser.email.toLowerCase().includes(q) ||
      c.advertiser.nom.toLowerCase().includes(q) ||
      (c.advertiser.companyProfile?.companyName ?? "").toLowerCase().includes(q)
    );
  });

  // ── Approuver ───────────────────────────────────────────────────────────────
  async function handleApprove(campaignId: string) {
    setActionId(campaignId);
    try {
      const res = await fetch("/api/admin/ads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, action: "approve" }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Campagne approuvée et mise en ligne.`);
        setSelectedCampaign(null);
        fetchCampaigns();
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        alert(data.error ?? "Erreur lors de l'approbation");
      }
    } catch {
      alert("Une erreur est survenue");
    } finally {
      setActionId(null);
    }
  }

  // ── Rejeter ─────────────────────────────────────────────────────────────────
  function openRejectModal(campaignId: string) {
    setRejectTargetId(campaignId);
    setRejectReason("");
    setShowRejectModal(true);
  }

  async function handleReject() {
    if (!rejectTargetId || !rejectReason.trim()) return;
    setActionId(rejectTargetId);
    try {
      const res = await fetch("/api/admin/ads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: rejectTargetId,
          action: "reject",
          rejectedReason: rejectReason.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage("Campagne rejetée. L'annonceur en sera informé.");
        setShowRejectModal(false);
        setSelectedCampaign(null);
        fetchCampaigns();
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        alert(data.error ?? "Erreur");
      }
    } catch {
      alert("Une erreur est survenue");
    } finally {
      setActionId(null);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDU
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Message succès */}
      {successMessage && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage("")}
            className="ml-auto text-green-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(
          [
            {
              key: "pending" as const,
              label: "En attente",
              icon: Clock,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              key: "active" as const,
              label: "Actives",
              icon: PlayCircle,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              key: "paused" as const,
              label: "En pause",
              icon: PauseCircle,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              key: "ended" as const,
              label: "Terminées",
              icon: CheckCircle,
              color: "text-gray-500",
              bg: "bg-gray-50",
            },
            {
              key: "rejected" as const,
              label: "Rejetées",
              icon: XCircle,
              color: "text-red-600",
              bg: "bg-red-50",
            },
          ] as const
        ).map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.key}
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm cursor-pointer hover:border-gray-300 transition-colors"
              style={{
                borderColor: statusFilter === s.key ? "#0F4C5C" : undefined,
              }}
              onClick={() =>
                setStatusFilter(statusFilter === s.key ? "" : s.key)
              }
            >
              <div
                className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-2`}
              >
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats[s.key]}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Barre d'actions ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, annonceur…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0F4C5C]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F4C5C] bg-white"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente de validation</option>
          <option value="active">Actives</option>
          <option value="paused">En pause</option>
          <option value="ended">Terminées</option>
          <option value="rejected">Rejetées</option>
        </select>
        <button
          onClick={fetchCampaigns}
          className="p-2.5 border border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── Tableau ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Megaphone className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Aucune campagne trouvée</p>
            {statusFilter === "pending" && (
              <p className="text-gray-400 text-xs mt-1">
                Aucune campagne en attente de modération
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Campagne
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Annonceur
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Budget
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Perf.
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Statut
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    {/* Campagne */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 text-sm">
                        {c.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.billingModel} ·{" "}
                        {c.objective === "profile_visit"
                          ? "Visite profil"
                          : "URL externe"}
                      </p>
                    </td>

                    {/* Annonceur */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 text-sm">
                        {c.advertiser.companyProfile?.companyName ??
                          `${c.advertiser.prenom} ${c.advertiser.nom}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {c.advertiser.email}
                      </p>
                    </td>

                    {/* Budget */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatEur(c.totalBudget)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatEur(c.amountSpent)} dépensé
                      </p>
                      {/* Barre de progression budget */}
                      <div className="mt-1.5 w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0F4C5C] rounded-full"
                          style={{
                            width: `${Math.min((c.amountSpent / c.totalBudget) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </td>

                    {/* Performances */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <TrendingUp className="w-3 h-3" />
                        <span>{c.totalImpressions.toLocaleString("fr-FR")}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                        <MousePointerClick className="w-3 h-3" />
                        <span>{c.totalClicks}</span>
                        <span className="text-gray-400">
                          ({(c.ctr * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(c.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Voir le détail */}
                        <button
                          onClick={() => setSelectedCampaign(c)}
                          className="p-1.5 text-gray-400 hover:text-[#0F4C5C] transition-colors"
                          title="Voir le détail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Approuver (seulement si pending) */}
                        {c.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(c.id)}
                              disabled={actionId === c.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {actionId === c.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              Approuver
                            </button>
                            <button
                              onClick={() => openRejectModal(c.id)}
                              disabled={actionId === c.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-3 h-3" />
                              Rejeter
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""} sur{" "}
            {total} au total
          </div>
        )}
      </div>

      {/* ══ MODAL DÉTAIL CAMPAGNE ══════════════════════════════════════════════ */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0F4C5C]/10 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-[#0F4C5C]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {selectedCampaign.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Détail de la campagne
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-6">
              {/* Statut + badge */}
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedCampaign.status} />
                <span className="text-xs text-gray-400">
                  Créée le {formatDate(selectedCampaign.createdAt)}
                </span>
              </div>

              {/* Annonceur */}
              <section>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Annonceur
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-900">
                    {selectedCampaign.advertiser.companyProfile?.companyName ??
                      `${selectedCampaign.advertiser.prenom} ${selectedCampaign.advertiser.nom}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedCampaign.advertiser.email}
                  </p>
                </div>
              </section>

              {/* Paramètres */}
              <section>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Paramètres
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Objectif", value: selectedCampaign.objective === "profile_visit" ? "Visite de profil" : "URL externe" },
                    { label: "Modèle", value: selectedCampaign.billingModel },
                    { label: "Budget total", value: formatEur(selectedCampaign.totalBudget) },
                    { label: "Dépensé", value: formatEur(selectedCampaign.amountSpent) },
                    { label: "Début", value: formatDate(selectedCampaign.startDate) },
                    { label: "Fin", value: selectedCampaign.endDate ? formatDate(selectedCampaign.endDate) : "Aucune" },
                  ].map((item) => (
                    <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Créatif */}
              {selectedCampaign.creative && (
                <section>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Contenu de l&apos;annonce
                  </h4>
                  <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                    {selectedCampaign.creative.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedCampaign.creative.imageUrl}
                        alt="Créatif"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    )}
                    <p className="font-bold text-gray-900">
                      {selectedCampaign.creative.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedCampaign.creative.body}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-[#0F4C5C] text-white text-xs font-semibold rounded-lg">
                        {selectedCampaign.creative.ctaLabel}
                      </span>
                      {selectedCampaign.creative.ctaUrl && (
                        <a
                          href={selectedCampaign.creative.ctaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#0F4C5C] underline truncate max-w-xs"
                        >
                          {selectedCampaign.creative.ctaUrl}
                        </a>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Ciblage */}
              {selectedCampaign.targeting && (
                <section>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Ciblage
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    {selectedCampaign.targeting.countryCodes.length > 0 && (
                      <p>
                        <span className="text-gray-500">Pays :</span>{" "}
                        <span className="font-medium">
                          {selectedCampaign.targeting.countryCodes.join(", ")}
                        </span>
                      </p>
                    )}
                    {(selectedCampaign.targeting.ageMin || selectedCampaign.targeting.ageMax) && (
                      <p>
                        <span className="text-gray-500">Âge :</span>{" "}
                        <span className="font-medium">
                          {selectedCampaign.targeting.ageMin ?? "?"} –{" "}
                          {selectedCampaign.targeting.ageMax ?? "?"} ans
                        </span>
                      </p>
                    )}
                    {selectedCampaign.targeting.genders.length > 0 && (
                      <p>
                        <span className="text-gray-500">Genre :</span>{" "}
                        <span className="font-medium">
                          {selectedCampaign.targeting.genders.join(", ")}
                        </span>
                      </p>
                    )}
                    {selectedCampaign.targeting.interestCodes.length > 0 && (
                      <p>
                        <span className="text-gray-500">Intérêts :</span>{" "}
                        <span className="font-medium">
                          {selectedCampaign.targeting.interestCodes.join(", ")}
                        </span>
                      </p>
                    )}
                    {selectedCampaign.targeting.educationLevelCodes.length > 0 && (
                      <p>
                        <span className="text-gray-500">Éducation :</span>{" "}
                        <span className="font-medium">
                          {selectedCampaign.targeting.educationLevelCodes.join(", ")}
                        </span>
                      </p>
                    )}
                    {selectedCampaign.targeting.countryCodes.length === 0 &&
                      selectedCampaign.targeting.genders.length === 0 &&
                      selectedCampaign.targeting.interestCodes.length === 0 && (
                        <p className="text-gray-400 text-xs">
                          Aucun ciblage spécifique — diffusion à tous les utilisateurs
                        </p>
                      )}
                  </div>
                </section>
              )}

              {/* Raison de rejet */}
              {selectedCampaign.status === "rejected" &&
                selectedCampaign.rejectedReason && (
                  <section>
                    <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">
                      Raison du rejet
                    </h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700">
                        {selectedCampaign.rejectedReason}
                      </p>
                    </div>
                  </section>
                )}
            </div>

            {/* Footer : actions si pending */}
            {selectedCampaign.status === "pending" && (
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
                <button
                  onClick={() => openRejectModal(selectedCampaign.id)}
                  className="flex-1 py-2.5 text-sm font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Rejeter
                </button>
                <button
                  onClick={() => handleApprove(selectedCampaign.id)}
                  disabled={actionId === selectedCampaign.id}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionId === selectedCampaign.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Approuver et diffuser
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ MODAL REJET ═══════════════════════════════════════════════════════ */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Rejeter la campagne
                  </h3>
                  <p className="text-xs text-gray-400">
                    L&apos;annonceur recevra une notification
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Raison du rejet <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Contenu non conforme aux règles de la plateforme, image inappropriée…"
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Cette raison sera visible par l&apos;annonceur.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || !!actionId}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}