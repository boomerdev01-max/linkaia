// src/components/admin/content/PendingMediaClient.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Users,
  Building2,
  CheckCircle2,
  XCircle,
  ImageOff,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  ExternalLink,
  BadgeCheck,
  ShieldOff,
  User,
  Calendar,
  Mail,
  Globe,
  Briefcase,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "profiles" | "companies";

interface ProfileUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  createdAt: string;
  level: string;
  pseudo: string | null;
  profilePhotoUrl: string | null;
  gender: string | null;
  birthdate: string | null;
}

interface CompanyUser {
  id: string;
  email: string;
  createdAt: string;
  companyName: string;
  legalEmail: string;
  country: string | null;
  registrationType: string | null;
  legalRepresentative: string | null;
  registrationDocumentUrl: string | null;
  logoUrl: string | null;
  status: string;
  isLegalDetailsCompleted: boolean;
  isDocumentsCompleted: boolean;
}

type MediaStatus = "approved" | "rejected" | null;

// ─── LocalStorage helpers ────────────────────────────────────────────────────

const LS_KEY = "linkaia_admin_media_statuses";

function loadStatuses(): Record<string, MediaStatus> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStatuses(statuses: Record<string, MediaStatus>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(statuses));
  } catch {}
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MediaStatus }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
        <BadgeCheck className="w-3.5 h-3.5" />
        Approuvé
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
        <ShieldOff className="w-3.5 h-3.5" />
        Non approuvé
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
      En attente
    </span>
  );
}

function ActionButtons({
  id,
  status,
  onApprove,
  onReject,
}: {
  id: string;
  status: MediaStatus;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onApprove(id)}
        disabled={status === "approved"}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
          ${
            status === "approved"
              ? "bg-emerald-100 text-emerald-600 cursor-default border border-emerald-200"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 shadow-sm active:scale-95"
          }`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Approuver
      </button>
      <button
        onClick={() => onReject(id)}
        disabled={status === "rejected"}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
          ${
            status === "rejected"
              ? "bg-red-100 text-red-600 cursor-default border border-red-200"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 shadow-sm active:scale-95"
          }`}
      >
        <XCircle className="w-3.5 h-3.5" />
        Non approuvé
      </button>
    </div>
  );
}

// ─── Profile Card ─────────────────────────────────────────────────────────────

function ProfileCard({
  user,
  status,
  onApprove,
  onReject,
}: {
  user: ProfileUser;
  status: MediaStatus;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const displayName = user.pseudo ?? `${user.prenom} ${user.nom}`;
  const initials =
    `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase();
  const hasPhoto = user.profilePhotoUrl && !imgError;

  const borderColor =
    status === "approved"
      ? "border-emerald-200 shadow-emerald-50"
      : status === "rejected"
        ? "border-red-200 shadow-red-50"
        : "border-gray-200";

  return (
    <div
      className={`bg-white rounded-xl border-2 ${borderColor} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
    >
      {/* Photo */}
      <div className="relative bg-linear-to-br from-gray-100 to-gray-50 h-44 flex items-center justify-center">
        {hasPhoto ? (
          <Image
            src={user.profilePhotoUrl!}
            alt={displayName}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            {user.profilePhotoUrl ? (
              <>
                <ImageOff className="w-8 h-8" />
                <span className="text-xs">Image indisponible</span>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-bold">
                  {initials || <User className="w-8 h-8" />}
                </div>
                <span className="text-xs font-medium text-gray-400">Néant</span>
              </>
            )}
          </div>
        )}

        {/* Level badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold border
            ${
              user.level === "premium"
                ? "bg-amber-100 text-amber-700 border-amber-200"
                : user.level === "platinium"
                  ? "bg-purple-100 text-purple-700 border-purple-200"
                  : user.level === "prestige"
                    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                    : "bg-gray-100 text-gray-500 border-gray-200"
            }`}
          >
            {user.level}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <p className="font-semibold text-gray-900 text-sm truncate">
            {displayName}
          </p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>

        <div className="flex items-center justify-between">
          <StatusBadge status={status} />
          <span className="text-xs text-gray-400">
            {new Date(user.createdAt).toLocaleDateString("fr-FR")}
          </span>
        </div>

        <ActionButtons
          id={user.id}
          status={status}
          onApprove={onApprove}
          onReject={onReject}
        />
      </div>
    </div>
  );
}

// ─── Company Row ──────────────────────────────────────────────────────────────

function CompanyRow({
  company,
  status,
  onApprove,
  onReject,
}: {
  company: CompanyUser;
  status: MediaStatus;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [logoError, setLogoError] = useState(false);
  const hasLogo = company.logoUrl && !logoError;
  const initials = company.companyName.slice(0, 2).toUpperCase();

  const rowBg =
    status === "approved"
      ? "bg-emerald-50/40 border-emerald-100"
      : status === "rejected"
        ? "bg-red-50/40 border-red-100"
        : "bg-white border-gray-100";

  return (
    <div
      className={`rounded-xl border ${rowBg} p-5 transition-all duration-200 hover:shadow-md`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        {/* Logo + Nom */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 rounded-xl bg-linear-to-brm-gray-100 to-gray-200 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200">
            {hasLogo ? (
              <Image
                src={company.logoUrl!}
                alt={company.companyName}
                width={56}
                height={56}
                className="object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-gray-500 font-bold text-lg">
                {initials}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900">
                {company.companyName}
              </p>
              {company.registrationType && (
                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 font-medium">
                  {company.registrationType}
                </span>
              )}
            </div>

            <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                <Mail className="w-3 h-3 shrink-0" />
                {company.legalEmail}
              </p>
              {company.country && (
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Globe className="w-3 h-3 shrink-0" />
                  {company.country}
                </p>
              )}
              {company.legalRepresentative && (
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3 shrink-0" />
                  {company.legalRepresentative}
                </p>
              )}
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 shrink-0" />
                {new Date(company.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </div>

            {/* Completion indicators */}
            <div className="mt-2 flex gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium
                ${company.isLegalDetailsCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}
              >
                <FileText className="w-3 h-3" />
                Infos légales {company.isLegalDetailsCompleted ? "✓" : "—"}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium
                ${company.isDocumentsCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}
              >
                <FileText className="w-3 h-3" />
                Documents {company.isDocumentsCompleted ? "✓" : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Médias links + actions */}
        <div className="flex flex-col gap-3 shrink-0">
          {/* Document & logo links */}
          <div className="flex gap-2 flex-wrap">
            {company.registrationDocumentUrl ? (
              <a
                href={company.registrationDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Document légal
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-400 bg-gray-50 border border-gray-100">
                <FileText className="w-3.5 h-3.5" />
                Aucun document
              </span>
            )}
            {company.logoUrl ? (
              <a
                href={company.logoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Logo
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-400 bg-gray-50 border border-gray-100">
                <ImageOff className="w-3.5 h-3.5" />
                Aucun logo
              </span>
            )}
          </div>

          {/* Status + Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={status} />
            <ActionButtons
              id={company.id}
              status={status}
              onApprove={onApprove}
              onReject={onReject}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        Page {page} sur {totalPages} — {total} entrée{total > 1 ? "s" : ""}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {tab === "profiles" ? (
        <Users className="w-14 h-14 text-gray-200 mb-4" />
      ) : (
        <Building2 className="w-14 h-14 text-gray-200 mb-4" />
      )}
      <p className="text-gray-500 font-medium">Aucun élément trouvé</p>
      <p className="text-gray-400 text-sm mt-1">
        {tab === "profiles"
          ? "Aucun utilisateur individuel enregistré."
          : "Aucune organisation enregistrée."}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PendingMediaClient() {
  const [activeTab, setActiveTab] = useState<Tab>("profiles");
  const [profilesData, setProfilesData] = useState<ProfileUser[]>([]);
  const [companiesData, setCompaniesData] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, MediaStatus>>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  // Load statuses from localStorage on mount
  useEffect(() => {
    setStatuses(loadStatuses());
  }, []);

  const fetchData = useCallback(async (tab: Tab, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/content/pending-media?tab=${tab}&page=${p}&limit=${LIMIT}`,
      );
      if (!res.ok) throw new Error("Erreur lors du chargement des données");
      const json = await res.json();
      if (tab === "profiles") {
        setProfilesData(json.data);
      } else {
        setCompaniesData(json.data);
      }
      setTotal(json.total);
    } catch (e: any) {
      setError(e.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTab, page);
  }, [activeTab, page, fetchData]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleApprove = (id: string) => {
    const updated = { ...statuses, [id]: "approved" as MediaStatus };
    setStatuses(updated);
    saveStatuses(updated);
  };

  const handleReject = (id: string) => {
    const updated = { ...statuses, [id]: "rejected" as MediaStatus };
    setStatuses(updated);
    saveStatuses(updated);
  };

  // ── Stats summary ──
  const items =
    activeTab === "profiles"
      ? profilesData.map((u) => u.id)
      : companiesData.map((c) => c.id);
  const approvedCount = items.filter(
    (id) => statuses[id] === "approved",
  ).length;
  const rejectedCount = items.filter(
    (id) => statuses[id] === "rejected",
  ).length;
  const pendingCount = items.filter((id) => !statuses[id]).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* ── Tab switcher ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => handleTabChange("profiles")}
          className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border
            ${
              activeTab === "profiles"
                ? "bg-[#0F4C5C] text-white border-[#0F4C5C] shadow-md shadow-[#0F4C5C]/20"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#0F4C5C]/40 hover:text-[#0F4C5C]"
            }`}
        >
          <Users className="w-4 h-4" />
          Photos de profil utilisateurs
        </button>

        <button
          onClick={() => handleTabChange("companies")}
          className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border
            ${
              activeTab === "companies"
                ? "bg-[#0F4C5C] text-white border-[#0F4C5C] shadow-md shadow-[#0F4C5C]/20"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#0F4C5C]/40 hover:text-[#0F4C5C]"
            }`}
        >
          <Building2 className="w-4 h-4" />
          Médias des organisations
        </button>

        <button
          onClick={() => fetchData(activeTab, page)}
          className="ml-auto p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          title="Rafraîchir"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── Summary bar ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            En attente
          </p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {pendingCount}
          </p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 shadow-sm">
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">
            Approuvés
          </p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {approvedCount}
          </p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4 shadow-sm">
          <p className="text-xs font-medium text-red-500 uppercase tracking-wider">
            Non approuvés
          </p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {rejectedCount}
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            {activeTab === "profiles"
              ? "Photos de profil des utilisateurs"
              : "Documents & médias des organisations"}
          </h2>
          {!loading && (
            <span className="text-sm text-gray-400">
              {total} entrée{total > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="p-6">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#0F4C5C] animate-spin" />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Profiles grid */}
          {!loading && !error && activeTab === "profiles" && (
            <>
              {profilesData.length === 0 ? (
                <EmptyState tab="profiles" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profilesData.map((user) => (
                    <ProfileCard
                      key={user.id}
                      user={user}
                      status={statuses[user.id] ?? null}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Companies list */}
          {!loading && !error && activeTab === "companies" && (
            <>
              {companiesData.length === 0 ? (
                <EmptyState tab="companies" />
              ) : (
                <div className="space-y-3">
                  {companiesData.map((company) => (
                    <CompanyRow
                      key={company.id}
                      company={company}
                      status={statuses[company.id] ?? null}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Pagination */}
          {!loading && !error && (
            <div className="mt-6">
              <Pagination
                page={page}
                total={total}
                limit={LIMIT}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <p className="text-xs text-gray-400 text-center pb-2">
        Powered by Linkaia
      </p>
    </div>
  );
}
