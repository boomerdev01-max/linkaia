"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  User,
  Shield,
  KeyRound,
  ChevronRight,
} from "lucide-react";

// ---- Types ----
interface RoleOption {
  id: string;
  name: string;
  description: string | null;
}

interface RoleMeta {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
  desc: string;
}

// ---- Constantes ----
const ADMIN_ASSIGNABLE = ["administrator", "moderator", "accountant", "assistant"];

const ROLE_META: Record<string, RoleMeta> = {
  administrator: {
    label: "Administrateur",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "🔴",
    desc: "Accès complet au système",
  },
  moderator: {
    label: "Modérateur",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: "🟣",
    desc: "Modération du contenu et des utilisateurs",
  },
  accountant: {
    label: "Comptable",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "🔵",
    desc: "Gestion des finances et des factures",
  },
  assistant: {
    label: "Assistant",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "🟢",
    desc: "Support et consultation des données",
  },
};

// ---- Composant principal ----
export default function CreateUserClient() {
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    roleId: "",
  });
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<{
    nom: string;
    prenom: string;
    email: string;
    role: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Chargement + filtrage des rôles assignables
  useEffect(() => {
    async function loadRoles() {
      try {
        const res = await fetch("/api/admin/roles");
        const data = await res.json();
        if (data.roles) {
          setRoles(
            (data.roles as RoleOption[]).filter((r) =>
              ADMIN_ASSIGNABLE.includes(r.name)
            )
          );
        }
      } catch {
        setError("Impossible de charger les rôles disponibles.");
      } finally {
        setLoadingRoles(false);
      }
    }
    loadRoles();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setError("");
  };

  const handleRoleSelect = (role: RoleOption) => {
    setForm((prev) => ({ ...prev, roleId: role.id }));
    setFieldErrors((prev) => ({ ...prev, roleId: "" }));
    setError("");
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.prenom.trim()) errors.prenom = "Le prénom est requis.";
    if (!form.nom.trim())    errors.nom    = "Le nom est requis.";
    if (!form.email.trim()) {
      errors.email = "L'email est requis.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Adresse email invalide.";
    }
    if (!form.roleId) errors.roleId = "Veuillez sélectionner un rôle.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        return;
      }

      setCreatedUser(data.user);
      setSuccess(true);
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({ prenom: "", nom: "", email: "", roleId: "" });
    setFieldErrors({});
    setError("");
    setSuccess(false);
    setCreatedUser(null);
  };

  // ============================================================
  // Vue succès
  // ============================================================
  if (success && createdUser) {
    const meta = ROLE_META[createdUser.role];

    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Bandeau succès */}
          <div className="bg-linear-to-r from-emerald-500 to-teal-600 px-8 py-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
              <CheckCircle2 className="h-9 w-9 text-white" />
            </div>
            <h2 className="text-white text-2xl font-bold">Compte créé avec succès !</h2>
            <p className="text-white/80 mt-2 text-sm">
              Les identifiants ont été envoyés par email à l&apos;utilisateur.
            </p>
          </div>

          {/* Récap */}
          <div className="px-8 py-7 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Récapitulatif
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Prénom</p>
                <p className="font-semibold text-gray-800">{createdUser.prenom}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Nom</p>
                <p className="font-semibold text-gray-800">{createdUser.nom}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Email</p>
              <p className="font-semibold text-gray-800">{createdUser.email}</p>
            </div>

            {meta && (
              <div className={`rounded-xl p-4 border ${meta.bg} ${meta.border}`}>
                <p className="text-xs text-gray-400 mb-1">Rôle assigné</p>
                <p className={`font-bold ${meta.color}`}>
                  {meta.icon} {meta.label}
                </p>
                <p className="text-xs text-gray-500 mt-1">{meta.desc}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 px-4 text-sm font-semibold text-[#0F4C5C] border-2 border-[#0F4C5C] rounded-xl hover:bg-[#0F4C5C]/5 transition-colors"
              >
                Créer un autre compte
              </button>
              <Link
                href="/admin/users/profiles"
                className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-linear-to-r from-[#0F4C5C] to-[#0a3542] rounded-xl hover:opacity-90 transition-opacity text-center"
              >
                Voir tous les utilisateurs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Formulaire
  // ============================================================
  return (
    <div className="p-6 max-w-2xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link
          href="/admin/users/profiles"
          className="flex items-center gap-1 hover:text-[#0F4C5C] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Utilisateurs
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-800 font-medium">Créer un compte</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* En-tête */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] flex items-center justify-center shrink-0">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Nouveau membre</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Un mot de passe sécurisé sera généré et envoyé par email.
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-7 space-y-8">

          {/* Section identité */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-[#0F4C5C]" />
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Identité
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Prénom */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={form.prenom}
                  onChange={handleChange}
                  placeholder="Jean"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-900
                    placeholder-gray-400 outline-none transition
                    focus:ring-2 focus:ring-[#0F4C5C]/30 focus:border-[#0F4C5C]
                    ${fieldErrors.prenom
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300 bg-white"
                    }`}
                />
                {fieldErrors.prenom && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {fieldErrors.prenom}
                  </p>
                )}
              </div>

              {/* Nom */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nom"
                  value={form.nom}
                  onChange={handleChange}
                  placeholder="Dupont"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-900
                    placeholder-gray-400 outline-none transition
                    focus:ring-2 focus:ring-[#0F4C5C]/30 focus:border-[#0F4C5C]
                    ${fieldErrors.nom
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300 bg-white"
                    }`}
                />
                {fieldErrors.nom && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {fieldErrors.nom}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Section email */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-4 w-4 text-[#0F4C5C]" />
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Adresse email
              </h2>
            </div>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="jean.dupont@exemple.com"
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-900
                placeholder-gray-400 outline-none transition
                focus:ring-2 focus:ring-[#0F4C5C]/30 focus:border-[#0F4C5C]
                ${fieldErrors.email
                  ? "border-red-400 bg-red-50"
                  : "border-gray-300 bg-white"
                }`}
            />
            {fieldErrors.email && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {fieldErrors.email}
              </p>
            )}
          </section>

          {/* Section rôle */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-[#0F4C5C]" />
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Rôle à assigner
              </h2>
            </div>

            {loadingRoles ? (
              <div className="flex items-center gap-3 py-4 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des rôles…
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {roles.map((role) => {
                  const meta = ROLE_META[role.name];
                  const isSelected = form.roleId === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => handleRoleSelect(role)}
                      className={`relative text-left p-4 rounded-xl border-2 transition-all
                        ${isSelected
                          ? `${meta?.border ?? "border-gray-300"} ${meta?.bg ?? "bg-gray-50"} shadow-sm`
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      {isSelected && (
                        <CheckCircle2
                          className={`absolute top-3 right-3 h-4 w-4 ${meta?.color ?? "text-gray-600"}`}
                        />
                      )}
                      <p className="text-base mb-1">{meta?.icon ?? "⚪"}</p>
                      <p className={`text-sm font-bold ${isSelected ? (meta?.color ?? "text-gray-800") : "text-gray-800"}`}>
                        {meta?.label ?? role.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {meta?.desc ?? role.description ?? ""}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {fieldErrors.roleId && (
              <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                {fieldErrors.roleId}
              </p>
            )}
          </section>

          {/* Note mot de passe */}
          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5">
            <KeyRound className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800">Mot de passe automatique</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                Un mot de passe sécurisé sera généré et envoyé uniquement par email à l&apos;utilisateur.
                Il devra le modifier dès sa première connexion.
              </p>
            </div>
          </div>

          {/* Erreur globale */}
          {error && (
            <div className="flex gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3.5">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link
              href="/admin/users/profiles"
              className="flex-1 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-center"
            >
              Annuler
            </Link>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#0F4C5C] to-[#0a3542] rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création en cours…
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Créer le compte
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}