"use client";

// src/components/admin/PrestigeCodesClient.tsx

import { useState, useEffect, useCallback } from "react";
import {
  Crown,
  Plus,
  Search,
  Copy,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
interface PrestigeCode {
  id: string;
  code: string;
  prospectEmail: string;
  prospectName: string;
  adminNote: string | null;
  status: "pending" | "used" | "revoked" | "expired";
  expiresAt: string;
  createdAt: string;
  usedAt: string | null;
  generatedBy: { nom: string; prenom: string; email: string };
  usedBy: {
    nom: string;
    prenom: string;
    email: string;
    profil: { profilePhotoUrl: string | null } | null;
  } | null;
}

interface Stats {
  pending: number;
  used: number;
  revoked: number;
  expired: number;
}

// ── Helpers ───────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: "En attente",
    icon: Clock,
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  used: {
    label: "Utilisé",
    icon: CheckCircle,
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  revoked: {
    label: "Révoqué",
    icon: XCircle,
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  expired: {
    label: "Expiré",
    icon: AlertCircle,
    bg: "bg-gray-50",
    text: "text-gray-500",
    border: "border-gray-200",
    dot: "bg-gray-400",
  },
};

function StatusBadge({ status }: { status: PrestigeCode["status"] }) {
  const cfg = STATUS_CONFIG[status];
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

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function PrestigeCodesClient() {
  // ── State ─────────────────────────────────────────────────
  const [codes, setCodes] = useState<PrestigeCode[]>([]);
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    used: 0,
    revoked: 0,
    expired: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [total, setTotal] = useState(0);

  // Modal génération
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    prospectEmail: "",
    prospectName: "",
    adminNote: "",
    expiresInDays: 30,
  });
  const [formError, setFormError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Révocation
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Copie
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // ── Chargement ────────────────────────────────────────────
  const fetchCodes = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/prestige-codes?${params}`);
      const data = await res.json();
      if (data.success) {
        setCodes(data.codes);
        setStats(data.stats);
        setTotal(data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  // ── Filtrage local par recherche ──────────────────────────
  const filteredCodes = codes.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.prospectEmail.toLowerCase().includes(q) ||
      c.prospectName.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  // ── Générer un code ───────────────────────────────────────
  async function handleGenerate() {
    setFormError("");
    if (!form.prospectEmail.trim() || !form.prospectName.trim()) {
      setFormError("L'email et le nom sont requis");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/prestige-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error ?? "Erreur lors de la génération");
        return;
      }

      setSuccessMessage(
        `Code généré et envoyé à ${form.prospectEmail} avec succès.`,
      );
      setForm({
        prospectEmail: "",
        prospectName: "",
        adminNote: "",
        expiresInDays: 30,
      });
      setShowModal(false);
      fetchCodes();
    } catch {
      setFormError("Une erreur est survenue");
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Révoquer un code ──────────────────────────────────────
  async function handleRevoke(id: string) {
    if (!confirm("Révoquer ce code ? Cette action est irréversible.")) return;
    setRevokingId(id);
    try {
      const res = await fetch(`/api/admin/prestige-codes?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        fetchCodes();
      } else {
        alert(data.error ?? "Erreur lors de la révocation");
      }
    } catch {
      alert("Une erreur est survenue");
    } finally {
      setRevokingId(null);
    }
  }

  // ── Copier le code ────────────────────────────────────────
  function handleCopy(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  // ────────────────────────────────────────────────────────
  // RENDU
  // ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Message succès */}
      {successMessage && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(
          [
            {
              key: "pending",
              label: "En attente",
              icon: Clock,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              key: "used",
              label: "Utilisés",
              icon: CheckCircle,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              key: "revoked",
              label: "Révoqués",
              icon: XCircle,
              color: "text-red-600",
              bg: "bg-red-50",
            },
            {
              key: "expired",
              label: "Expirés",
              icon: AlertCircle,
              color: "text-gray-500",
              bg: "bg-gray-50",
            },
          ] as const
        ).map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.key}
              className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm cursor-pointer hover:border-gray-300 transition-colors"
              onClick={() =>
                setStatusFilter(statusFilter === s.key ? "" : s.key)
              }
              style={{
                borderColor: statusFilter === s.key ? "#0F4C5C" : undefined,
              }}
            >
              <div
                className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}
              >
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats[s.key]}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Barre d'actions ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par email, nom ou code…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0F4C5C]"
          />
        </div>

        {/* Filtre statut */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F4C5C] bg-white"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="used">Utilisés</option>
          <option value="revoked">Révoqués</option>
          <option value="expired">Expirés</option>
        </select>

        {/* Refresh */}
        <button
          onClick={fetchCodes}
          className="p-2.5 border border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>

        {/* Générer */}
        <button
          onClick={() => {
            setShowModal(true);
            setFormError("");
            setSuccessMessage("");
          }}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors"
          style={{ background: "#0F4C5C" }}
        >
          <Plus className="w-4 h-4" />
          Générer une invitation
        </button>
      </div>

      {/* ── Tableau ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Crown className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Aucun code trouvé</p>
            {!statusFilter && !searchQuery && (
              <p className="text-gray-400 text-xs mt-1">
                Générez votre première invitation Prestige
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Code
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Prospect
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Statut
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Expiration
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Généré le
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCodes.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    {/* Code */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 tracking-wider">
                          {c.code}
                        </code>
                        <button
                          onClick={() => handleCopy(c.code)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copier"
                        >
                          {copiedCode === c.code ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Prospect */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 text-sm">
                        {c.prospectName}
                      </p>
                      <p className="text-xs text-gray-400">{c.prospectEmail}</p>
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                      {c.status === "used" && c.usedBy && (
                        <p className="text-xs text-gray-400 mt-1">
                          par {c.usedBy.prenom} {c.usedBy.nom}
                        </p>
                      )}
                    </td>

                    {/* Expiration */}
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(c.expiresAt)}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(c.createdAt)}
                      <p className="text-gray-400">
                        par {c.generatedBy.prenom}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      {c.status === "pending" && (
                        <button
                          onClick={() => handleRevoke(c.id)}
                          disabled={revokingId === c.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Révoquer"
                        >
                          {revokingId === c.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination info */}
        {!isLoading && filteredCodes.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {filteredCodes.length} résultat{filteredCodes.length > 1 ? "s" : ""}{" "}
            sur {total} au total
          </div>
        )}
      </div>

      {/* ═══ MODAL : GÉNÉRER UN CODE ════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Générer une invitation Prestige
                  </h3>
                  <p className="text-xs text-gray-400">
                    Un email sera envoyé automatiquement
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body modal */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Nom du prospect <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.prospectName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, prospectName: e.target.value }))
                  }
                  placeholder="Ex: Jean-Baptiste Koné"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F4C5C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Email du prospect <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.prospectEmail}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, prospectEmail: e.target.value }))
                  }
                  placeholder="email@exemple.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F4C5C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Validité du code (jours)
                </label>
                <select
                  value={form.expiresInDays}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      expiresInDays: parseInt(e.target.value),
                    }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F4C5C] bg-white"
                >
                  <option value={7}>7 jours</option>
                  <option value={14}>14 jours</option>
                  <option value={30}>30 jours (défaut)</option>
                  <option value={60}>60 jours</option>
                  <option value={90}>90 jours</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Note interne (optionnel)
                </label>
                <textarea
                  value={form.adminNote}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, adminNote: e.target.value }))
                  }
                  placeholder="Ex: Célébrité XY, recommandée par Z"
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F4C5C] resize-none"
                />
              </div>

              {formError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {formError}
                </div>
              )}
            </div>

            {/* Footer modal */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "#0F4C5C" }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Génération…
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    Générer et envoyer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
