"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Target,
  HandCoins,
  Globe,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ArrowRight,
  SkipForward,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Donor {
  name: string;
  amount: string;
  currency: string;
  year: string;
}

interface FormData {
  // Section 1 — Chiffres clés
  annualBudget: string;
  annualBudgetCurrency: string;
  fullTimeStaff: string;
  womenCount: string;
  womenInLeadershipPercent: string;

  // Section 2 — Mission & Projets
  mainMission: string;
  projectsDescription: string;
  recentAccomplishments: string;
  beneficiaries: string;

  // Section 3 — Financement
  mainDonors: Donor[];
  mainUnrestrictedFundPriority: string;
  resourceMobilizationTeam: string; // "true" | "false" | ""

  // Section 4 — Présence numérique
  website: string;
  linkedin: string;
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
}

const INITIAL_FORM: FormData = {
  annualBudget: "",
  annualBudgetCurrency: "XOF",
  fullTimeStaff: "",
  womenCount: "",
  womenInLeadershipPercent: "",
  mainMission: "",
  projectsDescription: "",
  recentAccomplishments: "",
  beneficiaries: "",
  mainDonors: [],
  mainUnrestrictedFundPriority: "",
  resourceMobilizationTeam: "",
  website: "",
  linkedin: "",
  facebook: "",
  twitter: "",
  instagram: "",
  youtube: "",
};

const BLANK_DONOR: Donor = { name: "", amount: "", currency: "XOF", year: "" };

const CURRENCIES = ["XOF", "EUR", "USD", "GBP", "CAD", "CHF", "XAF"];

const SECTIONS = [
  { id: 0, label: "Chiffres clés", icon: Users },
  { id: 1, label: "Mission & Projets", icon: Target },
  { id: 2, label: "Financement", icon: HandCoins },
  { id: 3, label: "Présence numérique", icon: Globe },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CompanyOrgProfileForm() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Pré-remplir si données déjà existantes
  useEffect(() => {
    fetch("/api/auth/company/org-profile")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          const donors: Donor[] = Array.isArray(d.mainDonors)
            ? d.mainDonors.map((donor: any) => ({
                name: donor.name ?? "",
                amount: String(donor.amount ?? ""),
                currency: donor.currency ?? "XOF",
                year: String(donor.year ?? ""),
              }))
            : [];

          const social = d.socialMediaPresence ?? {};

          setFormData({
            annualBudget: d.annualBudget != null ? String(d.annualBudget) : "",
            annualBudgetCurrency: d.annualBudgetCurrency ?? "XOF",
            fullTimeStaff:
              d.fullTimeStaff != null ? String(d.fullTimeStaff) : "",
            womenCount: d.womenCount != null ? String(d.womenCount) : "",
            womenInLeadershipPercent:
              d.womenInLeadershipPercent != null
                ? String(d.womenInLeadershipPercent)
                : "",
            mainMission: d.mainMission ?? "",
            projectsDescription: d.projectsDescription ?? "",
            recentAccomplishments: d.recentAccomplishments ?? "",
            beneficiaries: d.beneficiaries ?? "",
            mainDonors: donors,
            mainUnrestrictedFundPriority: d.mainUnrestrictedFundPriority ?? "",
            resourceMobilizationTeam:
              d.resourceMobilizationTeam != null
                ? String(d.resourceMobilizationTeam)
                : "",
            website: social.website ?? "",
            linkedin: social.linkedin ?? "",
            facebook: social.facebook ?? "",
            twitter: social.twitter ?? "",
            instagram: social.instagram ?? "",
            youtube: social.youtube ?? "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, []);

  // ─── Donors helpers ─────────────────────────────────────────────────────────

  const addDonor = () => {
    if (formData.mainDonors.length >= 20) return;
    setFormData((f) => ({
      ...f,
      mainDonors: [...f.mainDonors, { ...BLANK_DONOR }],
    }));
  };

  const removeDonor = (idx: number) => {
    setFormData((f) => ({
      ...f,
      mainDonors: f.mainDonors.filter((_, i) => i !== idx),
    }));
  };

  const updateDonor = (idx: number, field: keyof Donor, value: string) => {
    setFormData((f) => {
      const donors = [...f.mainDonors];
      donors[idx] = { ...donors[idx], [field]: value };
      return { ...f, mainDonors: donors };
    });
  };

  // ─── Submit helpers ──────────────────────────────────────────────────────────

  const buildPayload = (skip = false) => {
    if (skip) return { skip: true };

    const donors = formData.mainDonors
      .filter((d) => d.name.trim() && d.amount && d.year)
      .map((d) => ({
        name: d.name.trim(),
        amount: parseFloat(d.amount),
        currency: d.currency,
        year: parseInt(d.year),
      }));

    return {
      skip: false,
      annualBudget: formData.annualBudget
        ? parseFloat(formData.annualBudget)
        : null,
      annualBudgetCurrency: formData.annualBudgetCurrency || "XOF",
      fullTimeStaff: formData.fullTimeStaff
        ? parseInt(formData.fullTimeStaff)
        : null,
      womenCount: formData.womenCount ? parseInt(formData.womenCount) : null,
      womenInLeadershipPercent: formData.womenInLeadershipPercent
        ? parseFloat(formData.womenInLeadershipPercent)
        : null,
      mainMission: formData.mainMission || null,
      projectsDescription: formData.projectsDescription || null,
      recentAccomplishments: formData.recentAccomplishments || null,
      beneficiaries: formData.beneficiaries || null,
      mainDonors: donors.length > 0 ? donors : null,
      mainUnrestrictedFundPriority:
        formData.mainUnrestrictedFundPriority || null,
      resourceMobilizationTeam:
        formData.resourceMobilizationTeam === "true"
          ? true
          : formData.resourceMobilizationTeam === "false"
            ? false
            : null,
      socialMediaPresence: {
        website: formData.website || undefined,
        linkedin: formData.linkedin || undefined,
        facebook: formData.facebook || undefined,
        twitter: formData.twitter || undefined,
        instagram: formData.instagram || undefined,
        youtube: formData.youtube || undefined,
      },
    };
  };

  const submitForm = async (skip = false) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/company/org-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(skip)),
      });
      const data = await response.json();
      console.log("🔴 API response:", data);

      if (!response.ok) {
        toast.error(data.error || "Erreur lors de l'enregistrement");
        return;
      }

      toast.success(
        skip
          ? "Étape ignorée — accès à votre espace"
          : "Profil complété avec succès !",
      );
      router.push("/home");
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarde intermédiaire (auto-save optionnel non-bloquant)
  const saveProgress = async () => {
    setSaving(true);
    try {
      await fetch("/api/auth/company/org-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(false)),
      });
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const goNext = async () => {
    if (currentSection < SECTIONS.length - 1) {
      await saveProgress();
      setCurrentSection((s) => s + 1);
    } else {
      await submitForm(false);
    }
  };

  const goPrev = () => {
    if (currentSection > 0) setCurrentSection((s) => s - 1);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Profil Organisation
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Renforcez votre crédibilité en complétant votre profil.
            <br />
            Qui êtes-vous ? Créez votre profil organisationnel rapidement pour
            marquer les esprits.
          </p>

          {/* Stepper global (4 étapes inscription) */}
          <div className="mt-5 flex items-center justify-center gap-2">
            {[1, 2, 3, 4].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step < 4
                      ? "bg-primary text-white"
                      : "bg-primary text-white ring-2 ring-primary ring-offset-2"
                  }`}
                >
                  {step < 4 ? <Check className="w-4 h-4" /> : "4"}
                </div>
                {i < 3 && (
                  <div
                    className={`w-10 h-1 rounded ${step < 4 ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Section stepper interne */}
          <div className="mt-6 flex items-center justify-center gap-1">
            {SECTIONS.map((section, i) => (
              <button
                key={section.id}
                onClick={() => setCurrentSection(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  i === currentSection
                    ? "bg-primary text-white shadow-sm"
                    : i < currentSection
                      ? "bg-primary/20 text-primary"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                }`}
              >
                <section.icon className="w-3 h-3" />
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
          {/* ── Section 0 : Chiffres clés ── */}
          {currentSection === 0 && (
            <div className="space-y-5">
              <SectionTitle icon={Users} title="Chiffres clés" />

              {/* Budget */}
              <div className="space-y-2">
                <Label>Budget annuel</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder="Ex : 50000000"
                    value={formData.annualBudget}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        annualBudget: e.target.value,
                      }))
                    }
                    className="flex-1"
                  />
                  <Select
                    value={formData.annualBudgetCurrency}
                    onValueChange={(v) =>
                      setFormData((f) => ({ ...f, annualBudgetCurrency: v }))
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-gray-400">
                  Budget annuel de fonctionnement
                </p>
              </div>

              {/* Staff */}
              <div className="space-y-2">
                <Label>Nombre de salariés à temps plein</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="Ex : 12"
                  value={formData.fullTimeStaff}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      fullTimeStaff: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Women */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre de femmes dans l'équipe</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Ex : 7"
                    value={formData.womenCount}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, womenCount: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Femmes en leadership (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    placeholder="Ex : 40"
                    value={formData.womenInLeadershipPercent}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        womenInLeadershipPercent: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Section 1 : Mission & Projets ── */}
          {currentSection === 1 && (
            <div className="space-y-5">
              <SectionTitle icon={Target} title="Mission & Projets" />

              <div className="space-y-2">
                <Label>Mission principale</Label>
                <Textarea
                  rows={4}
                  maxLength={2000}
                  placeholder="Décrivez la mission principale de votre organisation…"
                  value={formData.mainMission}
                  onChange={(e: { target: { value: any } }) =>
                    setFormData((f) => ({ ...f, mainMission: e.target.value }))
                  }
                />
                <CharCount current={formData.mainMission.length} max={2000} />
              </div>

              <div className="space-y-2">
                <Label>Description des projets</Label>
                <Textarea
                  rows={4}
                  maxLength={3000}
                  placeholder="Décrivez vos projets phares, leur impact, leur portée géographique…"
                  value={formData.projectsDescription}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      projectsDescription: e.target.value,
                    }))
                  }
                />
                <CharCount
                  current={formData.projectsDescription.length}
                  max={3000}
                />
              </div>

              <div className="space-y-2">
                <Label>Réalisations récentes</Label>
                <Textarea
                  rows={3}
                  maxLength={2000}
                  placeholder="Vos accomplissements marquants des 2 dernières années…"
                  value={formData.recentAccomplishments}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      recentAccomplishments: e.target.value,
                    }))
                  }
                />
                <CharCount
                  current={formData.recentAccomplishments.length}
                  max={2000}
                />
              </div>

              <div className="space-y-2">
                <Label>Bénéficiaires</Label>
                <Textarea
                  rows={2}
                  maxLength={1000}
                  placeholder="Qui sont les bénéficiaires de vos actions ? (nombre, profil, zone géographique…)"
                  value={formData.beneficiaries}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      beneficiaries: e.target.value,
                    }))
                  }
                />
                <CharCount current={formData.beneficiaries.length} max={1000} />
              </div>
            </div>
          )}

          {/* ── Section 2 : Financement ── */}
          {currentSection === 2 && (
            <div className="space-y-5">
              <SectionTitle icon={HandCoins} title="Financement" />

              {/* Donors */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>
                    Principaux bailleurs de fonds (4 dernières années)
                  </Label>
                  <span className="text-xs text-gray-400">
                    {formData.mainDonors.length}/20
                  </span>
                </div>

                {formData.mainDonors.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                    Aucun bailleur ajouté. Cliquez sur + pour commencer.
                  </p>
                )}

                {formData.mainDonors.map((donor, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="col-span-4">
                      <Input
                        placeholder="Nom du bailleur"
                        value={donor.name}
                        onChange={(e) =>
                          updateDonor(idx, "name", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min={0}
                        placeholder="Montant"
                        value={donor.amount}
                        onChange={(e) =>
                          updateDonor(idx, "amount", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Select
                        value={donor.currency}
                        onValueChange={(v) => updateDonor(idx, "currency", v)}
                      >
                        <SelectTrigger className="text-sm h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min={2000}
                        max={new Date().getFullYear()}
                        placeholder="Année"
                        value={donor.year}
                        onChange={(e) =>
                          updateDonor(idx, "year", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeDonor(idx)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {formData.mainDonors.length < 20 && (
                  <button
                    type="button"
                    onClick={addDonor}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un bailleur
                  </button>
                )}
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>
                  Priorité principale d'utilisation des fonds non affectés
                </Label>
                <Textarea
                  rows={3}
                  maxLength={1000}
                  placeholder="Ex : Renforcement des capacités de l'équipe, développement de nouveaux programmes…"
                  value={formData.mainUnrestrictedFundPriority}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      mainUnrestrictedFundPriority: e.target.value,
                    }))
                  }
                />
                <CharCount
                  current={formData.mainUnrestrictedFundPriority.length}
                  max={1000}
                />
              </div>

              {/* Resource mobilization team */}
              <div className="space-y-2">
                <Label>
                  Avez-vous une équipe dédiée à la mobilisation des ressources ?
                </Label>
                <Select
                  value={formData.resourceMobilizationTeam}
                  onValueChange={(v) =>
                    setFormData((f) => ({ ...f, resourceMobilizationTeam: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Oui</SelectItem>
                    <SelectItem value="false">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* ── Section 3 : Présence numérique ── */}
          {currentSection === 3 && (
            <div className="space-y-5">
              <SectionTitle icon={Globe} title="Présence numérique" />
              <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">
                Renseignez les URLs de vos profils (commençant par https://)
              </p>

              {[
                {
                  key: "website",
                  label: "Site web",
                  placeholder: "https://www.monorganisation.org",
                },
                {
                  key: "linkedin",
                  label: "LinkedIn",
                  placeholder: "https://linkedin.com/company/...",
                },
                {
                  key: "facebook",
                  label: "Facebook",
                  placeholder: "https://facebook.com/...",
                },
                {
                  key: "twitter",
                  label: "X / Twitter",
                  placeholder: "https://twitter.com/...",
                },
                {
                  key: "instagram",
                  label: "Instagram",
                  placeholder: "https://instagram.com/...",
                },
                {
                  key: "youtube",
                  label: "YouTube",
                  placeholder: "https://youtube.com/@...",
                },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Input
                    type="url"
                    placeholder={placeholder}
                    value={formData[key as keyof FormData] as string}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              {currentSection > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goPrev}
                  disabled={loading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Précédent
                </Button>
              ) : (
                <div />
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Skip global — visible seulement sur la 1re section */}
              {currentSection === 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => submitForm(true)}
                  disabled={loading}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  <SkipForward className="w-4 h-4 mr-1" />
                  Passer cette étape
                </Button>
              )}

              <Button type="button" onClick={goNext} disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    {saving ? "Sauvegarde…" : "Envoi…"}
                  </span>
                ) : currentSection < SECTIONS.length - 1 ? (
                  <>
                    Suivant
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    Terminer l'inscription
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {saving && (
          <p className="text-center text-xs text-gray-400 mt-3">
            Sauvegarde en cours…
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
    </div>
  );
}

function CharCount({ current, max }: { current: number; max: number }) {
  const ratio = current / max;
  return (
    <p
      className={`text-xs text-right ${
        ratio > 0.9
          ? "text-red-400"
          : ratio > 0.7
            ? "text-amber-400"
            : "text-gray-400"
      }`}
    >
      {current}/{max}
    </p>
  );
}
