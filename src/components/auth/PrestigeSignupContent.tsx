"use client";

// src/app/signup/prestige/page.tsx

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Crown,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────
type Step = "code" | "form" | "success";

interface CodeValidation {
  valid: boolean;
  prospectEmail?: string;
  prospectName?: string;
  expiresAt?: string;
  error?: string;
}

// ── Helpers ──────────────────────────────────────────────────
function formatCode(raw: string): string {
  // Auto-format en XXXX-XXXX-XXXX pendant la saisie
  const clean = raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const parts = [clean.slice(0, 4), clean.slice(4, 8), clean.slice(8, 12)];
  return parts.filter(Boolean).join("-");
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function PrestigeSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>("code");

  // ── Step 1 : Code ──
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [validatedData, setValidatedData] = useState<CodeValidation | null>(
    null,
  );

  // ── Step 2 : Formulaire ──
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pré-remplir le code depuis l'URL
  useEffect(() => {
    const urlCode = searchParams.get("code");
    if (urlCode) {
      setCode(urlCode.trim().toUpperCase());
    }
  }, [searchParams]);

  // Auto-valider si code complet dans l'URL
  useEffect(() => {
    if (code.replace(/-/g, "").length === 12 && step === "code") {
      // Lancer la validation auto après un court délai
      const timer = setTimeout(() => handleValidateCode(), 400);
      return () => clearTimeout(timer);
    }
  }, [code]);

  // ── Handler : valider le code ────────────────────────────
  async function handleValidateCode() {
    if (!code.trim()) {
      setCodeError("Veuillez saisir votre code d'invitation");
      return;
    }

    setIsValidatingCode(true);
    setCodeError("");

    try {
      const res = await fetch("/api/prestige/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data: CodeValidation = await res.json();

      if (!data.valid) {
        setCodeError(data.error ?? "Code invalide");
        return;
      }

      setValidatedData(data);

      // Pré-remplir l'email du prospect si fourni
      if (data.prospectEmail) setEmail(data.prospectEmail);
      if (data.prospectName) {
        const parts = data.prospectName.trim().split(" ");
        if (parts.length >= 2) {
          setPrenom(parts[0]);
          setNom(parts.slice(1).join(" "));
        } else {
          setPrenom(data.prospectName);
        }
      }

      setStep("form");
    } catch {
      setCodeError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsValidatingCode(false);
    }
  }

  // ── Handler : créer le compte ────────────────────────────
  async function handleRegister() {
    setFormError("");

    if (!nom.trim() || !prenom.trim()) {
      setFormError("Veuillez renseigner vos nom et prénom");
      return;
    }
    if (!email.trim()) {
      setFormError("Veuillez renseigner votre email");
      return;
    }
    if (password.length < 8) {
      setFormError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/prestige/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, email, password, nom, prenom }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error ?? "Une erreur est survenue");
        return;
      }

      setStep("success");
    } catch {
      setFormError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ────────────────────────────────────────────────────────
  // RENDU
  // ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      {/* Fond ambiance */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(180,140,40,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* ═══ ÉTAPE 1 : SAISIE DU CODE ═══════════════════════ */}
        {step === "code" && (
          <div
            className="bg-[#0f0f0f] border border-[#2a2010]"
            style={{ borderTop: "2px solid #c9a84c" }}
          >
            {/* Header */}
            <div className="px-10 pt-10 pb-6 text-center border-b border-[#1a1408]">
              <div className="text-3xl mb-3">👑</div>
              <p
                className="text-[10px] tracking-[0.4em] uppercase mb-3"
                style={{ color: "#6a5030" }}
              >
                Accès Exclusif
              </p>
              <h1
                className="text-xl font-light leading-snug"
                style={{ color: "#c9a84c", fontFamily: "Georgia, serif" }}
              >
                Inscription Prestige
              </h1>
              <p
                className="text-xs mt-3 leading-relaxed"
                style={{ color: "#5a4a28" }}
              >
                Saisissez votre code d'invitation personnel
                <br />
                reçu par email
              </p>
            </div>

            {/* Formulaire code */}
            <div className="px-10 py-8">
              <div className="mb-6">
                <label
                  className="block text-[10px] tracking-[0.3em] uppercase mb-3"
                  style={{ color: "#6a5030" }}
                >
                  Code d'invitation
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCodeError("");
                    setCode(formatCode(e.target.value));
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleValidateCode()}
                  placeholder="XXXX-XXXX-XXXX"
                  maxLength={14}
                  className="w-full bg-[#0a0a0a] border text-center text-lg tracking-[0.2em] py-4 px-4 outline-none transition-colors placeholder:opacity-30 font-mono"
                  style={{
                    borderColor: codeError ? "#c0392b" : "#2a2010",
                    color: "#f0d060",
                    caretColor: "#c9a84c",
                  }}
                  onFocus={(e) =>
                    !codeError && (e.target.style.borderColor = "#c9a84c")
                  }
                  onBlur={(e) =>
                    !codeError && (e.target.style.borderColor = "#2a2010")
                  }
                />
                {codeError && (
                  <p
                    className="mt-2 text-xs flex items-center gap-1.5"
                    style={{ color: "#c0392b" }}
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {codeError}
                  </p>
                )}
              </div>

              <button
                onClick={handleValidateCode}
                disabled={
                  isValidatingCode || code.replace(/-/g, "").length < 12
                }
                className="w-full py-4 text-[11px] tracking-[0.25em] uppercase font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background:
                    "linear-gradient(135deg, #c9a84c 0%, #a07830 100%)",
                  color: "#0a0a0a",
                  fontFamily: "Georgia, serif",
                }}
              >
                {isValidatingCode ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Vérification…
                  </>
                ) : (
                  "Valider mon code →"
                )}
              </button>
            </div>

            <div className="px-10 pb-8 text-center">
              <p className="text-[11px]" style={{ color: "#3a2e18" }}>
                Vous n'avez pas reçu de code ?{" "}
                <Link
                  href="/signin"
                  className="underline"
                  style={{ color: "#6a5030" }}
                >
                  Retour à la connexion
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 2 : FORMULAIRE D'INSCRIPTION ═════════════ */}
        {step === "form" && (
          <div
            className="bg-[#0f0f0f] border border-[#2a2010]"
            style={{ borderTop: "2px solid #c9a84c" }}
          >
            {/* Header */}
            <div className="px-10 pt-10 pb-6 text-center border-b border-[#1a1408]">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4" style={{ color: "#c9a84c" }} />
                <span
                  className="text-[10px] tracking-[0.3em] uppercase"
                  style={{ color: "#c9a84c" }}
                >
                  Code validé
                </span>
              </div>
              <h1
                className="text-xl font-light"
                style={{ color: "#c9a84c", fontFamily: "Georgia, serif" }}
              >
                Créer votre compte
              </h1>
              {validatedData?.prospectName && (
                <p className="text-xs mt-2 italic" style={{ color: "#6a5030" }}>
                  Bienvenue, {validatedData.prospectName}
                </p>
              )}
            </div>

            <div className="px-10 py-8 space-y-5">
              {/* Nom / Prénom */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-[10px] tracking-[0.25em] uppercase mb-2"
                    style={{ color: "#6a5030" }}
                  >
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#2a2010] py-3 px-3 text-sm outline-none"
                    style={{ color: "#e8d5a3", caretColor: "#c9a84c" }}
                    onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
                    onBlur={(e) => (e.target.style.borderColor = "#2a2010")}
                  />
                </div>
                <div>
                  <label
                    className="block text-[10px] tracking-[0.25em] uppercase mb-2"
                    style={{ color: "#6a5030" }}
                  >
                    Nom
                  </label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#2a2010] py-3 px-3 text-sm outline-none"
                    style={{ color: "#e8d5a3", caretColor: "#c9a84c" }}
                    onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
                    onBlur={(e) => (e.target.style.borderColor = "#2a2010")}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  className="block text-[10px] tracking-[0.25em] uppercase mb-2"
                  style={{ color: "#6a5030" }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#2a2010] py-3 px-3 text-sm outline-none"
                  style={{ color: "#e8d5a3", caretColor: "#c9a84c" }}
                  onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
                  onBlur={(e) => (e.target.style.borderColor = "#2a2010")}
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label
                  className="block text-[10px] tracking-[0.25em] uppercase mb-2"
                  style={{ color: "#6a5030" }}
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                    className="w-full bg-[#0a0a0a] border border-[#2a2010] py-3 pl-3 pr-10 text-sm outline-none"
                    style={{ color: "#e8d5a3", caretColor: "#c9a84c" }}
                    onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
                    onBlur={(e) => (e.target.style.borderColor = "#2a2010")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#5a4a28" }}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="mt-1.5 text-[11px]" style={{ color: "#3a2e18" }}>
                  Minimum 8 caractères
                </p>
              </div>

              {/* Erreur */}
              {formError && (
                <div
                  className="flex items-start gap-2 p-3 text-xs"
                  style={{
                    background: "rgba(192,57,43,0.1)",
                    borderLeft: "2px solid #c0392b",
                    color: "#e74c3c",
                  }}
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {formError}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleRegister}
                disabled={isSubmitting}
                className="w-full py-4 text-[11px] tracking-[0.25em] uppercase font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                style={{
                  background:
                    "linear-gradient(135deg, #c9a84c 0%, #a07830 100%)",
                  color: "#0a0a0a",
                  fontFamily: "Georgia, serif",
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Création du compte…
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    Rejoindre le cercle Prestige
                  </>
                )}
              </button>
            </div>

            <div className="px-10 pb-8 text-center">
              <button
                onClick={() => {
                  setStep("code");
                  setFormError("");
                }}
                className="text-[11px] underline"
                style={{ color: "#3a2e18" }}
              >
                ← Modifier mon code
              </button>
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 3 : SUCCÈS ════════════════════════════════ */}
        {step === "success" && (
          <div
            className="bg-[#0f0f0f] border border-[#2a2010] px-10 py-12 text-center"
            style={{ borderTop: "2px solid #c9a84c" }}
          >
            <div className="text-4xl mb-4">👑</div>
            <div
              className="w-16 h-px mx-auto mb-6"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #c9a84c, transparent)",
              }}
            />
            <h2
              className="text-xl font-light mb-3"
              style={{ color: "#c9a84c", fontFamily: "Georgia, serif" }}
            >
              Bienvenue dans le cercle
            </h2>
            <p
              className="text-sm leading-relaxed mb-8"
              style={{ color: "#6a5030" }}
            >
              Votre compte Prestige a été créé avec succès.
              <br />
              Vous pouvez maintenant vous connecter.
            </p>
            <button
              onClick={() => router.push("/signin")}
              className="w-full py-4 text-[11px] tracking-[0.25em] uppercase font-bold"
              style={{
                background: "linear-gradient(135deg, #c9a84c 0%, #a07830 100%)",
                color: "#0a0a0a",
                fontFamily: "Georgia, serif",
              }}
            >
              Me connecter →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
