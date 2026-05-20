// src/components/ads/AdsClient.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Megaphone,
  Plus,
  ChevronRight,
  ChevronLeft,
  X,
  Loader2,
  TrendingUp,
  MousePointerClick,
  Euro,
  PlayCircle,
  PauseCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ImageIcon,
  Upload,
  Trash2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdvertiserUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  level: string;
  profilePhotoUrl: string | null;
  pseudo: string | null;
  companyName: string | null;
  isEligible: boolean;
  ineligibilityReason: string | null;
}

interface Campaign {
  id: string;
  name: string;
  objective: string;
  billingModel: string;
  totalBudget: number;
  amountSpent: number;
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  status: string;
  rejectedReason: string | null;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

// Formulaire multi-étapes
interface CampaignForm {
  // Étape 1 — Paramètres
  name: string;
  objective: "profile_visit" | "external_url";
  billingModel: "CPM" | "CPC";
  totalBudget: number;
  dailyBudgetCap: string; // string pour le champ, parsé en number
  startDate: string;
  endDate: string;
  // Étape 2 — Créatif
  creativeTitle: string;
  creativeBody: string;
  creativeCtaLabel: string;
  creativeCtaUrl: string;
  creativeTargetProfileId: string;
  creativeImageFile: File | null;
  creativeImagePreview: string | null;
  // Étape 3 — Ciblage
  interestCodes: string[];
  countryCodes: string;   // séparés par virgule
  ageMin: string;
  ageMax: string;
  genders: string[];
  educationLevelCodes: string[];
}

const DEFAULT_FORM: CampaignForm = {
  name: "",
  objective: "external_url",
  billingModel: "CPM",
  totalBudget: 20,
  dailyBudgetCap: "",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  creativeTitle: "",
  creativeBody: "",
  creativeCtaLabel: "En savoir plus",
  creativeCtaUrl: "",
  creativeTargetProfileId: "",
  creativeImageFile: null,
  creativeImagePreview: null,
  interestCodes: [],
  countryCodes: "",
  ageMin: "",
  ageMax: "",
  genders: [],
  educationLevelCodes: [],
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  draft:    { label: "Brouillon",   icon: Clock,        color: "text-gray-500",   bg: "bg-gray-50" },
  pending:  { label: "En attente",  icon: Clock,        color: "text-amber-600",  bg: "bg-amber-50" },
  active:   { label: "Active",      icon: PlayCircle,   color: "text-green-600",  bg: "bg-green-50" },
  paused:   { label: "En pause",    icon: PauseCircle,  color: "text-blue-600",   bg: "bg-blue-50" },
  ended:    { label: "Terminée",    icon: CheckCircle,  color: "text-gray-500",   bg: "bg-gray-50" },
  rejected: { label: "Rejetée",     icon: XCircle,      color: "text-red-600",    bg: "bg-red-50" },
};

const INTEREST_OPTIONS = [
  "voyage", "cuisine", "musique", "sport", "mode", "culture", "technologie",
  "spiritualité", "famille", "lecture", "photographie", "cinéma",
];

const EDUCATION_OPTIONS = [
  { code: "primary", label: "Primaire" },
  { code: "high-school", label: "Lycée" },
  { code: "bachelor", label: "Licence" },
  { code: "master", label: "Master" },
  { code: "doctorate", label: "Doctorat" },
  { code: "vocational", label: "Formation pro" },
];

const GENDER_OPTIONS = [
  { code: "man", label: "Hommes" },
  { code: "woman", label: "Femmes" },
  { code: "non-binary", label: "Non-binaire" },
];

function formatEur(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color} border border-current/20`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function AdsClient({ user }: { user: AdvertiserUser }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal création multi-étapes
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1); // 1 | 2 | 3 | 4
  const [form, setForm] = useState<CampaignForm>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Annulation campagne
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);

  // ── Chargement des campagnes ─────────────────────────────────────────────────
  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ads/campaigns");
      const data = await res.json();
      if (data.success) setCampaigns(data.campaigns);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  // ── Helpers form ─────────────────────────────────────────────────────────────
  function toggleArray(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
  }

  function resetModal() {
    setStep(1);
    setForm(DEFAULT_FORM);
    setCreatedCampaignId(null);
    setShowModal(false);
  }

  // ── Étape 1 — Validation paramètres ─────────────────────────────────────────
  function validateStep1(): string | null {
    if (!form.name.trim()) return "Le nom de la campagne est requis";
    if (form.totalBudget < 5) return "Budget minimum : 5€";
    if (!form.startDate) return "La date de début est requise";
    return null;
  }

  // ── Étape 2 — Validation créatif ────────────────────────────────────────────
  function validateStep2(): string | null {
    if (!form.creativeTitle.trim()) return "Le titre de l'annonce est requis";
    if (!form.creativeCtaLabel.trim()) return "Le libellé du bouton est requis";
    if (form.objective === "external_url" && !form.creativeCtaUrl.trim())
      return "L'URL de destination est requise";
    if (form.objective === "profile_visit" && !form.creativeTargetProfileId.trim())
      return "L'ID du profil cible est requis";
    return null;
  }

  // ── Soumission finale (étape 3 → créer en DB) ────────────────────────────────
  async function handleSubmit() {
    const err2 = validateStep2();
    if (err2) { toast.error(err2); return; }

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        objective: form.objective,
        billingModel: form.billingModel,
        totalBudget: form.totalBudget,
        dailyBudgetCap: form.dailyBudgetCap ? parseFloat(form.dailyBudgetCap) : undefined,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        creative: {
          title: form.creativeTitle.trim(),
          body: form.creativeBody.trim(),
          ctaLabel: form.creativeCtaLabel.trim(),
          ctaUrl: form.objective === "external_url" ? form.creativeCtaUrl.trim() : undefined,
          targetProfileId: form.objective === "profile_visit" ? form.creativeTargetProfileId.trim() : undefined,
        },
        targeting: {
          interestCodes: form.interestCodes,
          countryCodes: form.countryCodes
            ? form.countryCodes.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean)
            : [],
          ageMin: form.ageMin ? parseInt(form.ageMin) : undefined,
          ageMax: form.ageMax ? parseInt(form.ageMax) : undefined,
          genders: form.genders,
          educationLevelCodes: form.educationLevelCodes,
        },
      };

      const res = await fetch("/api/ads/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Erreur lors de la création"); return; }

      const newCampaignId = data.campaign.id;
      setCreatedCampaignId(newCampaignId);

      // Upload de l'image si présente
      if (form.creativeImageFile) {
        setIsUploadingImage(true);
        try {
          const fd = new FormData();
          fd.append("image", form.creativeImageFile);
          fd.append("campaignId", newCampaignId);
          await fetch("/api/ads/upload-creative", { method: "POST", body: fd });
        } catch {
          toast.error("Campagne créée mais l'image n'a pas pu être uploadée");
        } finally {
          setIsUploadingImage(false);
        }
      }

      // Passer à l'étape 4 (paiement)
      setStep(4);
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Lancement du paiement Stripe ─────────────────────────────────────────────
  async function handlePayment() {
    if (!createdCampaignId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/ads/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: createdCampaignId,
          amountEur: form.totalBudget,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Erreur Stripe"); return; }

      // En production : intégrer Stripe.js / Elements ici
      // Pour l'instant on affiche le clientSecret avec un message d'information
      toast.success("Paiement initié — intégrez Stripe Elements avec le clientSecret retourné.");
      toast.info(`Client Secret : ${data.clientSecret?.slice(0, 20)}…`);

      resetModal();
      fetchCampaigns();
    } catch {
      toast.error("Erreur lors du paiement");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Annulation / Remboursement ────────────────────────────────────────────────
  async function handleCancel(campaignId: string) {
    if (!confirm("Annuler cette campagne ? Le solde résiduel sera remboursé si applicable.")) return;
    setCancellingId(campaignId);
    try {
      const res = await fetch(`/api/ads/campaigns/${campaignId}/refund`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.refunded ? `Campagne annulée. ${formatEur(data.refundedAmount)} remboursé.` : "Campagne annulée.");
        fetchCampaigns();
      } else {
        toast.error(data.error ?? "Erreur lors de l'annulation");
      }
    } catch {
      toast.error("Erreur lors de l'annulation");
    } finally {
      setCancellingId(null);
    }
  }

  // ── Pause / Reprise ───────────────────────────────────────────────────────────
  async function handleTogglePause(campaignId: string, currentStatus: string) {
    const action = currentStatus === "active" ? "pause" : "resume";
    try {
      const res = await fetch(`/api/ads/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(action === "pause" ? "Campagne mise en pause" : "Campagne relancée");
        fetchCampaigns();
      } else {
        toast.error(data.error ?? "Erreur");
      }
    } catch {
      toast.error("Erreur");
    }
  }

  // ── Image créative ────────────────────────────────────────────────────────────
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error("Image max 3MB"); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((f) => ({
        ...f,
        creativeImageFile: file,
        creativeImagePreview: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDU
  // ────────────────────────────────────────────────────────────────────────────

  // Écran non-éligible
  if (!user.isEligible) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0F4C5C]/10 flex items-center justify-center mx-auto mb-6">
            <Megaphone className="w-8 h-8 text-[#0F4C5C]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Publicité sur Linkaïa
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {user.ineligibilityReason}
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-left">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              Qui peut créer des campagnes ?
            </p>
            <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
              <li>Organisations vérifiées (statut VERIFIED)</li>
              <li>Membres VIP, Platinum ou Prestige</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Header ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F4C5C]/10 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-[#0F4C5C]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Mes Campagnes
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.companyName ?? `${user.prenom} ${user.nom}`} · {user.level}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchCampaigns}
              className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => { setShowModal(true); setStep(1); setForm(DEFAULT_FORM); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#0F4C5C] hover:bg-[#0a3540] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouvelle campagne
            </button>
          </div>
        </div>
      </div>

      {/* ── Liste des campagnes ── */}
      <div className="max-w-5xl mx-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20">
            <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Aucune campagne pour l&apos;instant
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Créez votre première campagne pour toucher des milliers d&apos;utilisateurs ciblés.
            </p>
            <button
              onClick={() => { setShowModal(true); setStep(1); setForm(DEFAULT_FORM); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F4C5C] text-white font-semibold rounded-lg hover:bg-[#0a3540] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Créer ma première campagne
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((c) => {
              const budget_pct = Math.min((c.amountSpent / c.totalBudget) * 100, 100);
              return (
                <div
                  key={c.id}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm"
                >
                  {/* Ligne principale */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">
                          {c.name}
                        </h3>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-xs text-gray-400">
                        {c.billingModel} ·{" "}
                        {c.objective === "profile_visit" ? "Visite de profil" : "URL externe"} ·
                        Début {formatDate(c.startDate)}
                      </p>
                    </div>

                    {/* Actions rapides */}
                    <div className="flex items-center gap-2 shrink-0">
                      {c.status === "active" && (
                        <button
                          onClick={() => handleTogglePause(c.id, c.status)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                          title="Mettre en pause"
                        >
                          <PauseCircle className="w-4 h-4" />
                        </button>
                      )}
                      {c.status === "paused" && (
                        <button
                          onClick={() => handleTogglePause(c.id, c.status)}
                          className="p-1.5 text-gray-400 hover:text-green-500 transition-colors"
                          title="Relancer"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </button>
                      )}
                      {["active", "paused", "pending"].includes(c.status) && (
                        <button
                          onClick={() => handleCancel(c.id)}
                          disabled={cancellingId === c.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Annuler"
                        >
                          {cancellingId === c.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Raison rejet */}
                  {c.status === "rejected" && c.rejectedReason && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-red-700">
                        <span className="font-semibold">Motif :</span>{" "}
                        {c.rejectedReason}
                      </p>
                    </div>
                  )}

                  {/* Métriques */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Euro className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400">Budget</span>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">
                        {formatEur(c.totalBudget)}
                      </p>
                      <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0F4C5C] rounded-full"
                          style={{ width: `${budget_pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatEur(c.amountSpent)} dépensé
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400">Impressions</span>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">
                        {c.totalImpressions.toLocaleString("fr-FR")}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MousePointerClick className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400">Clics</span>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">
                        {c.totalClicks}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400">CTR</span>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">
                        {(c.ctr * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ MODAL CRÉATION MULTI-ÉTAPES ══════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col">
            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">
                  {step === 4 ? "Finalisation" : "Nouvelle campagne"}
                </h2>
                {step < 4 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Étape {step} sur 3 —{" "}
                    {step === 1 ? "Paramètres" : step === 2 ? "Contenu" : "Ciblage"}
                  </p>
                )}
              </div>
              <button onClick={resetModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barre de progression */}
            {step < 4 && (
              <div className="px-6 pt-4">
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? "bg-[#0F4C5C]" : "bg-gray-200 dark:bg-gray-700"}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Body scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* ── ÉTAPE 1 : Paramètres ── */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                      Nom de la campagne *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Ex: Lancement Club Femmes Leaders"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F4C5C] dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                        Objectif *
                      </label>
                      <select
                        value={form.objective}
                        onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value as any }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F4C5C] bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      >
                        <option value="external_url">URL externe</option>
                        <option value="profile_visit">Visite de profil</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                        Modèle de facturation *
                      </label>
                      <select
                        value={form.billingModel}
                        onChange={(e) => setForm((f) => ({ ...f, billingModel: e.target.value as any }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F4C5C] bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      >
                        <option value="CPM">CPM (1000 impressions)</option>
                        <option value="CPC">CPC (par clic)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                        Budget total (€) *
                      </label>
                      <input
                        type="number"
                        min={5}
                        step={5}
                        value={form.totalBudget}
                        onChange={(e) => setForm((f) => ({ ...f, totalBudget: parseFloat(e.target.value) || 5 }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F4C5C] dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                        Plafond journalier (€)
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={form.dailyBudgetCap}
                        onChange={(e) => setForm((f) => ({ ...f, dailyBudgetCap: e.target.value }))}
                        placeholder="Optionnel"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F4C5C] dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                        Date de début *
                      </label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F4C5C] dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                        Date de fin
                      </label>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F4C5C] dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                      <p className="text-xs text-gray-400 mt-1">Laissez vide = pas de fin</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── ÉTAPE 2 : Créatif ── */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                      Titre de l&apos;annonce * <span className="text-gray-400 font-normal">(max 60 car.)</span>
                    </label>
                    <input
                      type="text"
                      maxLength={60}
                      value={form.creativeTitle}
                      onChange={(e) => setForm((f) => ({ ...f, creativeTitle: e.target.value }))}
                      placeholder="Ex: Rejoignez notre programme d'impact en Afrique"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F4C5C] dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      {form.creativeTitle.length}/60
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                      Description <span className="text-gray-400 font-normal">(max 150 car.)</span>
                    </label>
                    <textarea
                      maxLength={150}
                      rows={3}
                      value={form.creativeBody}
                      onChange={(e) => setForm((f) => ({ ...f, creativeBody: e.target.value }))}
                      placeholder="Décrivez votre offre en quelques mots…"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F4C5C] resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      {form.creativeBody.length}/150
                    </p>
                  </div>

                  {/* Image */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                      Image créative <span className="text-gray-400 font-normal">(optionnel, max 3MB)</span>
                    </label>
                    {form.creativeImagePreview ? (
                      <div className="relative w-full h-36 rounded-lg overflow-hidden border border-gray-200">
                        <Image src={form.creativeImagePreview} alt="Préview" fill className="object-cover" />
                        <button
                          onClick={() => setForm((f) => ({ ...f, creativeImageFile: null, creativeImagePreview: null }))}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full h-28 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#0F4C5C]/40 transition-colors"
                      >
                        <ImageIcon className="w-6 h-6" />
                        <span className="text-xs">Cliquer pour ajouter une image</span>
                      </button>
                    )}
                    <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageSelect} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                        Texte du bouton *
                      </label>
                      <input
                        type="text"
                        value={form.creativeCtaLabel}
                        onChange={(e) => setForm((f) => ({ ...f, creativeCtaLabel: e.target.value }))}
                        placeholder="En savoir plus"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F4C5C] dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                    </div>
                    {form.objective === "external_url" ? (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                          URL de destination *
                        </label>
                        <input
                          type="url"
                          value={form.creativeCtaUrl}
                          onChange={(e) => setForm((f) => ({ ...f, creativeCtaUrl: e.target.value }))}
                          placeholder="https://..."
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F4C5C] dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                          ID du profil cible *
                        </label>
                        <input
                          type="text"
                          value={form.creativeTargetProfileId}
                          onChange={(e) => setForm((f) => ({ ...f, creativeTargetProfileId: e.target.value }))}
                          placeholder="user-id-ici"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F4C5C] dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Aperçu live */}
                  {form.creativeTitle && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                        Aperçu de l&apos;annonce
                      </p>
                      <div className="border border-[#B88A4F]/30 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-semibold text-[#B88A4F] uppercase tracking-wide">Sponsorisé</p>
                        {form.creativeImagePreview && (
                          <div className="relative w-full h-24 rounded-lg overflow-hidden">
                            <Image src={form.creativeImagePreview} alt="Aperçu" fill className="object-cover" />
                          </div>
                        )}
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{form.creativeTitle}</p>
                        {form.creativeBody && <p className="text-xs text-gray-500 line-clamp-2">{form.creativeBody}</p>}
                        <div className="pt-1">
                          <span className="px-3 py-1.5 bg-[#0F4C5C] text-white text-xs font-semibold rounded-lg">
                            {form.creativeCtaLabel || "En savoir plus"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── ÉTAPE 3 : Ciblage ── */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Laissez tous les champs vides pour diffuser à tous les utilisateurs sans restriction.
                    </p>
                  </div>

                  {/* Pays */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                      Pays (codes ISO séparés par virgule)
                    </label>
                    <input
                      type="text"
                      value={form.countryCodes}
                      onChange={(e) => setForm((f) => ({ ...f, countryCodes: e.target.value }))}
                      placeholder="BJ, FR, SN, CI"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F4C5C] dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Âge */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                        Âge minimum
                      </label>
                      <input
                        type="number"
                        min={18}
                        max={99}
                        value={form.ageMin}
                        onChange={(e) => setForm((f) => ({ ...f, ageMin: e.target.value }))}
                        placeholder="18"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F4C5C] dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                        Âge maximum
                      </label>
                      <input
                        type="number"
                        min={18}
                        max={99}
                        value={form.ageMax}
                        onChange={(e) => setForm((f) => ({ ...f, ageMax: e.target.value }))}
                        placeholder="65"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F4C5C] dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Genre */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      Genre
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {GENDER_OPTIONS.map((g) => (
                        <button
                          key={g.code}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, genders: toggleArray(f.genders, g.code) }))}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            form.genders.includes(g.code)
                              ? "bg-[#0F4C5C] text-white border-[#0F4C5C]"
                              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-[#0F4C5C]/40"
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Intérêts */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      Intérêts
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {INTEREST_OPTIONS.map((interest) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, interestCodes: toggleArray(f.interestCodes, interest) }))}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            form.interestCodes.includes(interest)
                              ? "bg-[#0F4C5C] text-white border-[#0F4C5C]"
                              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-[#0F4C5C]/40"
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Éducation */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      Niveau d&apos;éducation
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {EDUCATION_OPTIONS.map((edu) => (
                        <button
                          key={edu.code}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, educationLevelCodes: toggleArray(f.educationLevelCodes, edu.code) }))}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            form.educationLevelCodes.includes(edu.code)
                              ? "bg-[#0F4C5C] text-white border-[#0F4C5C]"
                              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-[#0F4C5C]/40"
                          }`}
                        >
                          {edu.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── ÉTAPE 4 : Paiement ── */}
              {step === 4 && (
                <div className="space-y-5 text-center py-4">
                  <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                      Campagne créée !
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Votre campagne est en attente de validation par notre équipe.
                      Finalisez le paiement du budget pour qu&apos;elle soit examinée.
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 text-left space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Campagne</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{form.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Modèle</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{form.billingModel}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-3">
                      <span className="text-gray-500">Budget à payer</span>
                      <span className="font-bold text-[#0F4C5C] text-base">
                        {formatEur(form.totalBudget)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-left">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Le paiement est sécurisé via Stripe. Votre campagne ne sera diffusée
                      qu&apos;après validation par notre équipe (sous 24h ouvrées).
                    </p>
                  </div>

                  {isUploadingImage && (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Upload de l&apos;image en cours…
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer avec navigation */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
              {step > 1 && step < 4 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Retour
                </button>
              )}

              {step === 1 && (
                <button
                  onClick={() => {
                    const err = validateStep1();
                    if (err) { toast.error(err); return; }
                    setStep(2);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-[#0F4C5C] hover:bg-[#0a3540] rounded-lg transition-colors"
                >
                  Suivant — Contenu
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {step === 2 && (
                <button
                  onClick={() => {
                    const err = validateStep2();
                    if (err) { toast.error(err); return; }
                    setStep(3);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-[#0F4C5C] hover:bg-[#0a3540] rounded-lg transition-colors"
                >
                  Suivant — Ciblage
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {step === 3 && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-[#0F4C5C] hover:bg-[#0a3540] rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Création…</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Créer la campagne</>
                  )}
                </button>
              )}

              {step === 4 && (
                <button
                  onClick={handlePayment}
                  disabled={isSubmitting || isUploadingImage}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Paiement…</>
                  ) : (
                    <><Euro className="w-4 h-4" /> Payer {formatEur(form.totalBudget)}</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}