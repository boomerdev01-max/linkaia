// src/components/company/CompanyProfileClient.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  FileText,
  Globe,
  Users,
  Target,
  HandCoins,
  Pencil,
  Check,
  X,
  ChevronLeft,
  ExternalLink,
  Shield,
  Plus,
  Trash2,
  MapPin,
  Calendar,
  BadgeCheck,
  Clock,
  XCircle,
  Linkedin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface Donor {
  name: string;
  amount: number;
  currency: string;
  year: number;
}

interface SocialMedia {
  website?: string;
  linkedin?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
}

interface CompanyData {
  id: string;
  companyName: string;
  legalEmail: string;
  country: string | null;
  registrationType: string | null;
  legalRepresentative: string | null;
  legalAddress: string | null;
  registrationDocumentUrl: string | null;
  logoUrl: string | null;
  status: string;
  annualBudget: number | null;
  annualBudgetCurrency: string | null;
  fullTimeStaff: number | null;
  womenCount: number | null;
  womenInLeadershipPercent: number | null;
  mainMission: string | null;
  projectsDescription: string | null;
  recentAccomplishments: string | null;
  beneficiaries: string | null;
  mainDonors: unknown;
  mainUnrestrictedFundPriority: string | null;
  resourceMobilizationTeam: boolean | null;
  socialMediaPresence: unknown;
  isLegalDetailsCompleted: boolean;
  isDocumentsCompleted: boolean;
  isOrgProfileCompleted: boolean;
}

interface OwnerData {
  id: string;
  nom: string;
  email: string;
  createdAt: string;
}

interface CompanyProfileClientProps {
  company: CompanyData;
  owner: OwnerData;
  isOwner: boolean;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const REGISTRATION_TYPES = [
  "ONG", "SARL", "SAS", "SASU", "EURL", "SA",
  "SNC", "SCS", "ASSOCIATION", "FONDATION", "GIE",
  "COOPERATIVE", "AUTO_ENTREPRENEUR", "OTHER",
];

const CURRENCIES = ["XOF", "EUR", "USD", "GBP", "CAD", "CHF", "XAF"];

const BLANK_DONOR: Donor = { name: "", amount: 0, currency: "XOF", year: new Date().getFullYear() };

// ── Sous-composants utilitaires ───────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: React.ElementType; className: string }> = {
    PENDING:  { label: "En attente de vérification", icon: Clock,     className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    VERIFIED: { label: "Organisation vérifiée",       icon: BadgeCheck, className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    REJECTED: { label: "Vérification rejetée",        icon: XCircle,   className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  };
  const s = map[status] ?? map.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${s.className}`}>
      <s.icon className="w-3.5 h-3.5" />
      {s.label}
    </span>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  isOwner,
  isEditing,
  isSaving,
  onEdit,
  onCancel,
  onSave,
}: {
  icon: React.ElementType;
  title: string;
  isOwner: boolean;
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F4C5C]/10 dark:bg-[#0F4C5C]/20">
          <Icon className="h-4 w-4 text-[#0F4C5C] dark:text-[#B88A4F]" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {isOwner && (
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button size="sm" variant="ghost" onClick={onCancel} disabled={isSaving} className="text-gray-500 hover:text-gray-700">
                <X className="w-4 h-4 mr-1" /> Annuler
              </Button>
              <Button size="sm" onClick={onSave} disabled={isSaving} className="bg-[#0F4C5C] hover:bg-[#0a3540] text-white">
                {isSaving ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Enregistrement…
                  </span>
                ) : (
                  <><Check className="w-4 h-4 mr-1" /> Enregistrer</>
                )}
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={onEdit} className="text-[#0F4C5C] border-[#0F4C5C]/30 hover:bg-[#0F4C5C]/5">
              <Pencil className="w-4 h-4 mr-1" /> Modifier
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ReadField({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: React.ElementType }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
        {value}
      </p>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function CompanyProfileClient({
  company,
  owner,
  isOwner,
}: CompanyProfileClientProps) {
  const router = useRouter();

  const donors = Array.isArray(company.mainDonors)
    ? (company.mainDonors as Donor[])
    : [];
  const social = (company.socialMediaPresence ?? {}) as SocialMedia;

  // ── État local des 3 sections ─────────────────────────────────────────────

  // Section 1 — Infos légales
  const [legalEdit, setLegalEdit] = useState(false);
  const [legalSaving, setLegalSaving] = useState(false);
  const [legalData, setLegalData] = useState({
    country: company.country ?? "",
    registrationType: company.registrationType ?? "",
    legalRepresentative: company.legalRepresentative ?? "",
    legalAddress: company.legalAddress ?? "",
  });
  const [legalSnapshot, setLegalSnapshot] = useState(legalData);

  // Section 2 — Profil organisation
  const [orgEdit, setOrgEdit] = useState(false);
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgData, setOrgData] = useState({
    annualBudget: company.annualBudget != null ? String(company.annualBudget) : "",
    annualBudgetCurrency: company.annualBudgetCurrency ?? "XOF",
    fullTimeStaff: company.fullTimeStaff != null ? String(company.fullTimeStaff) : "",
    womenCount: company.womenCount != null ? String(company.womenCount) : "",
    womenInLeadershipPercent: company.womenInLeadershipPercent != null ? String(company.womenInLeadershipPercent) : "",
    mainMission: company.mainMission ?? "",
    projectsDescription: company.projectsDescription ?? "",
    recentAccomplishments: company.recentAccomplishments ?? "",
    beneficiaries: company.beneficiaries ?? "",
    mainDonors: donors.map((d) => ({ ...d, amount: String(d.amount), year: String(d.year) })),
    mainUnrestrictedFundPriority: company.mainUnrestrictedFundPriority ?? "",
    resourceMobilizationTeam:
      company.resourceMobilizationTeam != null
        ? String(company.resourceMobilizationTeam)
        : "",
  });
  const [orgSnapshot, setOrgSnapshot] = useState(orgData);

  // Section 3 — Présence numérique
  const [socialEdit, setSocialEdit] = useState(false);
  const [socialSaving, setSocialSaving] = useState(false);
  const [socialData, setSocialData] = useState({
    website: social.website ?? "",
    linkedin: social.linkedin ?? "",
    facebook: social.facebook ?? "",
    twitter: social.twitter ?? "",
    instagram: social.instagram ?? "",
    youtube: social.youtube ?? "",
  });
  const [socialSnapshot, setSocialSnapshot] = useState(socialData);

  // ── Save helpers ──────────────────────────────────────────────────────────

  const save = async (section: string, payload: Record<string, unknown>) => {
    const res = await fetch(`/api/company/${owner.id}/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, ...payload }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Erreur serveur");
    }
  };

  // Section légale
  const saveLegal = async () => {
    setLegalSaving(true);
    try {
      await save("legal", {
        country: legalData.country || null,
        registrationType: legalData.registrationType || null,
        legalRepresentative: legalData.legalRepresentative || null,
        legalAddress: legalData.legalAddress || null,
      });
      setLegalSnapshot(legalData);
      setLegalEdit(false);
      toast.success("Informations légales mises à jour");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLegalSaving(false);
    }
  };

  // Section organisation
  const saveOrg = async () => {
    setOrgSaving(true);
    try {
      const cleanDonors = orgData.mainDonors
        .filter((d) => d.name.trim() && d.amount && d.year)
        .map((d) => ({
          name: d.name.trim(),
          amount: parseFloat(d.amount),
          currency: d.currency,
          year: parseInt(d.year),
        }));

      await save("org", {
        annualBudget: orgData.annualBudget ? parseFloat(orgData.annualBudget) : null,
        annualBudgetCurrency: orgData.annualBudgetCurrency || "XOF",
        fullTimeStaff: orgData.fullTimeStaff ? parseInt(orgData.fullTimeStaff) : null,
        womenCount: orgData.womenCount ? parseInt(orgData.womenCount) : null,
        womenInLeadershipPercent: orgData.womenInLeadershipPercent ? parseFloat(orgData.womenInLeadershipPercent) : null,
        mainMission: orgData.mainMission || null,
        projectsDescription: orgData.projectsDescription || null,
        recentAccomplishments: orgData.recentAccomplishments || null,
        beneficiaries: orgData.beneficiaries || null,
        mainDonors: cleanDonors.length > 0 ? cleanDonors : null,
        mainUnrestrictedFundPriority: orgData.mainUnrestrictedFundPriority || null,
        resourceMobilizationTeam:
          orgData.resourceMobilizationTeam === "true"
            ? true
            : orgData.resourceMobilizationTeam === "false"
              ? false
              : null,
      });
      setOrgSnapshot(orgData);
      setOrgEdit(false);
      toast.success("Profil organisation mis à jour");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setOrgSaving(false);
    }
  };

  // Section sociale
  const saveSocial = async () => {
    setSocialSaving(true);
    try {
      await save("social", { ...socialData });
      setSocialSnapshot(socialData);
      setSocialEdit(false);
      toast.success("Présence numérique mise à jour");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSocialSaving(false);
    }
  };

  // ── Donor helpers ─────────────────────────────────────────────────────────

  const addDonor = () => {
    if (orgData.mainDonors.length >= 20) return;
    setOrgData((p) => ({
      ...p,
      mainDonors: [...p.mainDonors, { name: "", amount: "", currency: "XOF", year: String(new Date().getFullYear()) }],
    }));
  };

  const removeDonor = (i: number) =>
    setOrgData((p) => ({ ...p, mainDonors: p.mainDonors.filter((_, idx) => idx !== i) }));

  const updateDonor = (i: number, field: string, value: string) =>
    setOrgData((p) => {
      const d = [...p.mainDonors];
      d[i] = { ...d[i], [field]: value };
      return { ...p, mainDonors: d };
    });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Header hero ───────────────────────────────────────────────────── */}
      <div className="bg-linear-to-r from-[#0F4C5C] to-[#0a3540] text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour
          </button>

          <div className="flex items-center gap-5">
            {/* Logo */}
            <div className="relative w-20 h-20 rounded-2xl border-2 border-[#B88A4F] overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
              {company.logoUrl ? (
                <Image
                  src={company.logoUrl}
                  alt={company.companyName}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <Building2 className="w-10 h-10 text-[#B88A4F]" />
              )}
            </div>

            {/* Identité */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold truncate">
                {company.companyName}
              </h1>
              <p className="text-white/70 text-sm mt-1">{company.legalEmail}</p>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <StatusBadge status={company.status} />
                {company.registrationType && (
                  <span className="text-xs bg-white/15 px-2.5 py-1 rounded-full font-medium">
                    {company.registrationType}
                  </span>
                )}
                {company.country && (
                  <span className="inline-flex items-center gap-1 text-xs bg-white/15 px-2.5 py-1 rounded-full font-medium">
                    <MapPin className="w-3 h-3" />
                    {company.country}
                  </span>
                )}
              </div>
            </div>

            {/* Date d'inscription */}
            <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
              <span className="inline-flex items-center gap-1.5 text-xs text-white/60">
                <Calendar className="w-3.5 h-3.5" />
                Membre depuis {new Date(owner.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Stats rapides */}
          {(company.fullTimeStaff || company.annualBudget || company.womenInLeadershipPercent) && (
            <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
              {company.fullTimeStaff != null && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#B88A4F]">{company.fullTimeStaff}</p>
                  <p className="text-xs text-white/60 mt-0.5">Employés</p>
                </div>
              )}
              {company.annualBudget != null && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#B88A4F]">
                    {new Intl.NumberFormat("fr-FR", { notation: "compact" }).format(company.annualBudget)}
                    <span className="text-sm ml-1">{company.annualBudgetCurrency}</span>
                  </p>
                  <p className="text-xs text-white/60 mt-0.5">Budget annuel</p>
                </div>
              )}
              {company.womenInLeadershipPercent != null && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#B88A4F]">{company.womenInLeadershipPercent}%</p>
                  <p className="text-xs text-white/60 mt-0.5">Femmes en leadership</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Contenu ───────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* ══ SECTION 1 : Informations légales ══ */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <SectionHeader
            icon={FileText}
            title="Informations légales"
            isOwner={isOwner}
            isEditing={legalEdit}
            isSaving={legalSaving}
            onEdit={() => { setLegalSnapshot(legalData); setLegalEdit(true); }}
            onCancel={() => { setLegalData(legalSnapshot); setLegalEdit(false); }}
            onSave={saveLegal}
          />

          {legalEdit ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pays</Label>
                <Input
                  placeholder="Ex : Bénin"
                  value={legalData.country}
                  onChange={(e) => setLegalData((p) => ({ ...p, country: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Type d'enregistrement</Label>
                <Select
                  value={legalData.registrationType}
                  onValueChange={(v) => setLegalData((p) => ({ ...p, registrationType: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                  <SelectContent>
                    {REGISTRATION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Représentant légal</Label>
                <Input
                  placeholder="Nom complet"
                  value={legalData.legalRepresentative}
                  onChange={(e) => setLegalData((p) => ({ ...p, legalRepresentative: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Adresse légale</Label>
                <Input
                  placeholder="Adresse complète"
                  value={legalData.legalAddress}
                  onChange={(e) => setLegalData((p) => ({ ...p, legalAddress: e.target.value }))}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReadField label="Pays" value={company.country} icon={MapPin} />
              <ReadField label="Type d'enregistrement" value={company.registrationType} icon={Shield} />
              <ReadField label="Représentant légal" value={company.legalRepresentative} />
              <ReadField label="Adresse légale" value={company.legalAddress} />
              {!company.isLegalDetailsCompleted && isOwner && (
                <div className="col-span-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-4 py-3">
                  <Shield className="w-4 h-4 shrink-0" />
                  Ces informations sont incomplètes. Cliquez sur Modifier pour les compléter.
                </div>
              )}
            </div>
          )}

          {/* Document d'enregistrement */}
          {company.registrationDocumentUrl && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Document d'enregistrement</p>
              <a
                href={company.registrationDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#0F4C5C] dark:text-[#B88A4F] hover:underline font-medium"
              >
                <FileText className="w-4 h-4" />
                Voir le document
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* ══ SECTION 2 : Profil organisation ══ */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <SectionHeader
            icon={Target}
            title="Profil organisation"
            isOwner={isOwner}
            isEditing={orgEdit}
            isSaving={orgSaving}
            onEdit={() => { setOrgSnapshot(orgData); setOrgEdit(true); }}
            onCancel={() => { setOrgData(orgSnapshot); setOrgEdit(false); }}
            onSave={saveOrg}
          />

          {orgEdit ? (
            <div className="space-y-5">
              {/* Chiffres clés */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Chiffres clés</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Budget annuel</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number" min={0}
                        placeholder="Ex : 50000000"
                        value={orgData.annualBudget}
                        onChange={(e) => setOrgData((p) => ({ ...p, annualBudget: e.target.value }))}
                        className="flex-1"
                      />
                      <Select
                        value={orgData.annualBudgetCurrency}
                        onValueChange={(v) => setOrgData((p) => ({ ...p, annualBudgetCurrency: v }))}
                      >
                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Salariés à temps plein</Label>
                    <Input type="number" min={0} placeholder="Ex : 12"
                      value={orgData.fullTimeStaff}
                      onChange={(e) => setOrgData((p) => ({ ...p, fullTimeStaff: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre de femmes</Label>
                    <Input type="number" min={0} placeholder="Ex : 7"
                      value={orgData.womenCount}
                      onChange={(e) => setOrgData((p) => ({ ...p, womenCount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Femmes en leadership (%)</Label>
                    <Input type="number" min={0} max={100} step={0.1} placeholder="Ex : 40"
                      value={orgData.womenInLeadershipPercent}
                      onChange={(e) => setOrgData((p) => ({ ...p, womenInLeadershipPercent: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Mission */}
              <div className="space-y-2">
                <Label>Mission principale</Label>
                <Textarea rows={4} maxLength={2000}
                  value={orgData.mainMission}
                  onChange={(e) => setOrgData((p) => ({ ...p, mainMission: e.target.value }))}
                />
                <p className="text-xs text-right text-gray-400">{orgData.mainMission.length}/2000</p>
              </div>

              <div className="space-y-2">
                <Label>Description des projets</Label>
                <Textarea rows={4} maxLength={3000}
                  value={orgData.projectsDescription}
                  onChange={(e) => setOrgData((p) => ({ ...p, projectsDescription: e.target.value }))}
                />
                <p className="text-xs text-right text-gray-400">{orgData.projectsDescription.length}/3000</p>
              </div>

              <div className="space-y-2">
                <Label>Réalisations récentes</Label>
                <Textarea rows={3} maxLength={2000}
                  value={orgData.recentAccomplishments}
                  onChange={(e) => setOrgData((p) => ({ ...p, recentAccomplishments: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Bénéficiaires</Label>
                <Textarea rows={2} maxLength={1000}
                  value={orgData.beneficiaries}
                  onChange={(e) => setOrgData((p) => ({ ...p, beneficiaries: e.target.value }))}
                />
              </div>

              {/* Bailleurs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Principaux bailleurs de fonds</Label>
                  <span className="text-xs text-gray-400">{orgData.mainDonors.length}/20</span>
                </div>
                {orgData.mainDonors.map((d, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="col-span-4">
                      <Input placeholder="Nom" value={d.name} onChange={(e) => updateDonor(i, "name", e.target.value)} className="text-sm" />
                    </div>
                    <div className="col-span-3">
                      <Input type="number" min={0} placeholder="Montant" value={d.amount} onChange={(e) => updateDonor(i, "amount", e.target.value)} className="text-sm" />
                    </div>
                    <div className="col-span-2">
                      <Select value={d.currency} onValueChange={(v) => updateDonor(i, "currency", v)}>
                        <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input type="number" min={2000} placeholder="Année" value={d.year} onChange={(e) => updateDonor(i, "year", e.target.value)} className="text-sm" />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <button type="button" onClick={() => removeDonor(i)} className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {orgData.mainDonors.length < 20 && (
                  <button type="button" onClick={addDonor} className="flex items-center gap-2 text-sm text-[#0F4C5C] dark:text-[#B88A4F] hover:opacity-80 font-medium transition-opacity">
                    <Plus className="w-4 h-4" /> Ajouter un bailleur
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Priorité des fonds non affectés</Label>
                <Textarea rows={3} maxLength={1000}
                  value={orgData.mainUnrestrictedFundPriority}
                  onChange={(e) => setOrgData((p) => ({ ...p, mainUnrestrictedFundPriority: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Équipe dédiée à la mobilisation des ressources ?</Label>
                <Select
                  value={orgData.resourceMobilizationTeam}
                  onValueChange={(v) => setOrgData((p) => ({ ...p, resourceMobilizationTeam: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Oui</SelectItem>
                    <SelectItem value="false">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Mission */}
              {company.mainMission && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Mission principale</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{company.mainMission}</p>
                </div>
              )}

              {company.projectsDescription && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Projets</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{company.projectsDescription}</p>
                </div>
              )}

              {company.recentAccomplishments && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Réalisations récentes</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{company.recentAccomplishments}</p>
                </div>
              )}

              {company.beneficiaries && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Bénéficiaires</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{company.beneficiaries}</p>
                </div>
              )}

              {/* Bailleurs */}
              {donors.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                    <HandCoins className="w-3.5 h-3.5" /> Principaux bailleurs
                  </p>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    {donors.map((d, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{d.name}</span>
                        <span className="text-sm text-gray-500">
                          {new Intl.NumberFormat("fr-FR").format(d.amount)} {d.currency} — {d.year}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Indicateurs vides */}
              {!company.mainMission && !company.projectsDescription && !company.beneficiaries && donors.length === 0 && isOwner && (
                <div className="text-center py-8 text-gray-400">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Aucune information renseignée. Cliquez sur Modifier pour compléter votre profil.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══ SECTION 3 : Présence numérique ══ */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <SectionHeader
            icon={Globe}
            title="Présence numérique"
            isOwner={isOwner}
            isEditing={socialEdit}
            isSaving={socialSaving}
            onEdit={() => { setSocialSnapshot(socialData); setSocialEdit(true); }}
            onCancel={() => { setSocialData(socialSnapshot); setSocialEdit(false); }}
            onSave={saveSocial}
          />

          {socialEdit ? (
            <div className="space-y-4">
              {[
                { key: "website",   label: "Site web",    placeholder: "https://www.monorganisation.org" },
                { key: "linkedin",  label: "LinkedIn",    placeholder: "https://linkedin.com/company/..." },
                { key: "facebook",  label: "Facebook",    placeholder: "https://facebook.com/..." },
                { key: "twitter",   label: "X / Twitter", placeholder: "https://twitter.com/..." },
                { key: "instagram", label: "Instagram",   placeholder: "https://instagram.com/..." },
                { key: "youtube",   label: "YouTube",     placeholder: "https://youtube.com/@..." },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Input
                    type="url"
                    placeholder={placeholder}
                    value={socialData[key as keyof typeof socialData]}
                    onChange={(e) => setSocialData((p) => ({ ...p, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { key: "website",   label: "Site web",    Icon: Globe },
                { key: "linkedin",  label: "LinkedIn",    Icon: Linkedin },
                { key: "facebook",  label: "Facebook",    Icon: Facebook },
                { key: "twitter",   label: "X / Twitter", Icon: Twitter },
                { key: "instagram", label: "Instagram",   Icon: Instagram },
                { key: "youtube",   label: "YouTube",     Icon: Youtube },
              ]
                .filter(({ key }) => !!social[key as keyof SocialMedia])
                .map(({ key, label, Icon }) => (
                  <a
                    key={key}
                    href={social[key as keyof SocialMedia]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <Icon className="w-5 h-5 text-[#0F4C5C] dark:text-[#B88A4F] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-400">{label}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 truncate group-hover:text-[#0F4C5C] dark:group-hover:text-[#B88A4F] transition-colors">
                        {social[key as keyof SocialMedia]}
                      </p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  </a>
                ))}

              {Object.values(social).every((v) => !v) && isOwner && (
                <div className="text-center py-8 text-gray-400">
                  <Globe className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Aucun lien renseigné. Cliquez sur Modifier pour ajouter votre présence en ligne.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}