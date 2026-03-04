"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { validatePassword } from "@/lib/utils";
import {
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PasswordChecks {
  minLength: boolean;
  hasNumber: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasSymbol: boolean;
}

const RULES: { key: keyof PasswordChecks; label: string }[] = [
  { key: "minLength", label: "8 caractères minimum" },
  { key: "hasUppercase", label: "Une lettre majuscule" },
  { key: "hasLowercase", label: "Une lettre minuscule" },
  { key: "hasNumber", label: "Un chiffre" },
  { key: "hasSymbol", label: "Un caractère spécial (!@#$...)" },
];

// ─── Component ────────────────────────────────────────────────────────────────
// Ce composant DOIT être enveloppé dans <Suspense> par son parent (page.tsx)
// car il utilise useSearchParams()

export default function ChangePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isForced = searchParams.get("force") === "true";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Live validation
  const { checks, isValid } = validatePassword(newPassword);
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = isValid && passwordsMatch && !isLoading;

  // Strength score 0-5
  const strengthScore = Object.values(checks).filter(Boolean).length;
  const strengthLabel = [
    "",
    "Très faible",
    "Faible",
    "Moyen",
    "Fort",
    "Très fort",
  ][strengthScore];
  const strengthColor = [
    "",
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-emerald-500",
  ][strengthScore];

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setApiError(null);

    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error ?? "Une erreur est survenue");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/admin"), 1500);
    } catch {
      setApiError("Impossible de joindre le serveur. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Success screen ───────────────────────────────────────────────────────

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Mot de passe mis à jour !
          </h2>
          <p className="text-sm text-gray-500">
            Redirection vers le panneau d'administration…
          </p>
          <div className="flex justify-center pt-1">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        </div>
      </main>
    );
  }

  // ─── Main form ────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <KeyRound className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Changer le mot de passe
          </h1>
          {isForced ? (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
              Pour des raisons de sécurité, vous devez définir un nouveau mot de
              passe avant de continuer.
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              Choisissez un mot de passe sécurisé pour votre compte.
            </p>
          )}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nouveau mot de passe */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setApiError(null);
                  }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showNew ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Barre de force */}
              {newPassword.length > 0 && (
                <div className="space-y-1 pt-0.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= strengthScore ? strengthColor : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  {strengthLabel && (
                    <p className="text-xs text-gray-500">
                      Force :{" "}
                      <span className="font-medium text-gray-700">
                        {strengthLabel}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Confirmation */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setApiError(null);
                  }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full rounded-lg border bg-gray-50 px-4 py-2.5 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                        : "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <p
                  className={`text-xs ${
                    passwordsMatch ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {passwordsMatch
                    ? "✓ Les mots de passe correspondent"
                    : "✗ Les mots de passe ne correspondent pas"}
                </p>
              )}
            </div>

            {/* Règles de sécurité */}
            {newPassword.length > 0 && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-2">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Critères de sécurité
                </p>
                <ul className="space-y-1.5">
                  {RULES.map(({ key, label }) => (
                    <li key={key} className="flex items-center gap-2">
                      {checks[key] ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                      )}
                      <span
                        className={`text-xs transition-colors ${
                          checks[key] ? "text-emerald-700" : "text-gray-400"
                        }`}
                      >
                        {label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Erreur API */}
            {apiError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700">{apiError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mise à jour…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Mettre à jour le mot de passe
                </>
              )}
            </button>
          </form>

          {/* Lien annuler (non forcé) */}
          {!isForced && (
            <div className="text-center pt-1">
              <button
                onClick={() => router.back()}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
