"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { validatePassword } from "@/lib/utils";
import {
  CircleCheck,
  Circle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

const testimonials = [
  {
    quote:
      "Cette plateforme a transformé notre façon de travailler. L'authentification est fluide et sécurisée.",
    author: "@sarah_dev",
    initial: "S",
  },
  {
    quote:
      "Interface moderne et intuitive. L'intégration d'une connexion avec Google m'a beaucoup plu !",
    author: "@mark_tech",
    initial: "M",
  },
  {
    quote:
      "La sécurité avant tout. J'apprécie la vérification par email et les exigences strictes pour les mots de passe.",
    author: "@julie_design",
    initial: "J",
  },
];

/* ─── Animated floating orb ─────────────────────────────────── */
function FloatingOrb({
  size,
  color,
  delay = 0,
  style,
}: {
  size: number;
  color: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: color,
        filter: "blur(60px)",
        animationName: "floatOrb",
        animationDuration: "7s",
        animationDelay: `${delay}s`,
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "infinite",
        animationDirection: "alternate",
        ...style,
      }}
    />
  );
}

/* ─── Animated counter ───────────────────────────────────────── */
function AnimatedNumber({
  target,
  suffix = "",
}: {
  target: number;
  suffix?: string;
}) {
  const [val, setVal] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    let current = 0;
    const increment = target / 60;
    const id = setInterval(() => {
      current += increment;
      if (current >= target) {
        setVal(target);
        clearInterval(id);
      } else {
        setVal(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(id);
  }, [target]);
  return (
    <>
      {val.toLocaleString()}
      {suffix}
    </>
  );
}

export default function SignupForm() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<Record<string, boolean>>({});
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(
      () => setCurrentTestimonial((p) => (p + 1) % testimonials.length),
      5000
    );
    return () => clearInterval(id);
  }, []);

  const passwordValidation = validatePassword(formData.password);

  const isFloating = (field: string) =>
    focused[field] || formData[field as keyof typeof formData] !== "";

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) toast.error(error.message);
    } catch {
      toast.error("Erreur lors de la connexion avec Google");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const newErrors: Record<string, string> = {};
    if (!formData.nom) newErrors.nom = "Le nom est requis";
    if (!formData.prenom) newErrors.prenom = "Le prénom est requis";
    if (!formData.email) newErrors.email = "L'email est requis";
    if (!passwordValidation.isValid)
      newErrors.password = "Le mot de passe ne respecte pas les exigences";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Veuillez confirmer votre mot de passe";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Erreur lors de l'inscription");
        return;
      }
      toast.success("Compte créé ! Vérifiez votre email.");
      router.push(
        `/verify-email?email=${encodeURIComponent(formData.email)}`
      );
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  /* ── Floating label field renderer ── */
  const renderField = ({
    id,
    label,
    type = "text",
    icon: Icon,
    value,
    error,
    rightSlot,
  }: {
    id: string;
    label: string;
    type?: string;
    icon: React.ElementType;
    value: string;
    error?: string;
    rightSlot?: React.ReactNode;
  }) => (
    <div>
      <div className="relative">
        <Icon
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200"
          style={{ color: focused[id] ? "#2563eb" : "#94a3b8" }}
        />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) =>
            setFormData({ ...formData, [id]: e.target.value })
          }
          onFocus={() => setFocused((f) => ({ ...f, [id]: true }))}
          onBlur={() => setFocused((f) => ({ ...f, [id]: false }))}
          disabled={loading}
          className="w-full h-14 rounded-xl pl-10 pt-5 pb-1 text-sm font-medium outline-none transition-all duration-200 disabled:opacity-60"
          style={{
            background: "#f8fafc",
            border: error
              ? "1.5px solid #ef4444"
              : focused[id]
              ? "1.5px solid #2563eb"
              : "1.5px solid #e2e8f0",
            color: "#0a2540",
            boxShadow: focused[id]
              ? "0 0 0 3px rgba(37,99,235,0.1)"
              : "none",
            paddingRight: rightSlot ? "3rem" : "1rem",
          }}
          placeholder=" "
        />
        <label
          htmlFor={id}
          className="absolute left-10 pointer-events-none select-none transition-all duration-200"
          style={{
            top: isFloating(id) ? "6px" : "50%",
            transform: isFloating(id) ? "none" : "translateY(-50%)",
            fontSize: isFloating(id) ? "9px" : "12px",
            fontWeight: isFloating(id) ? 700 : 500,
            color: error
              ? "#ef4444"
              : focused[id]
              ? "#2563eb"
              : "#94a3b8",
            letterSpacing: isFloating(id) ? "0.07em" : "normal",
            textTransform: isFloating(id) ? "uppercase" : "none",
          }}
        >
          {label}
        </label>
        {rightSlot}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500 ml-1 font-medium">{error}</p>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes floatOrb {
          0%   { transform: translateY(0px) scale(1); }
          100% { transform: translateY(-30px) scale(1.07); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideRight {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes testimonialIn {
          from { opacity: 0; transform: translateX(14px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes spinLoader {
          to { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 4px 14px rgba(37,99,235,0.35); }
          50%       { box-shadow: 0 4px 28px rgba(37,99,235,0.6); }
        }
        .card-enter {
          animation: fadeSlideUp 0.6s cubic-bezier(0.22,1,0.36,1) both;
        }
        .card-enter-delay {
          animation: fadeSlideUp 0.6s 0.14s cubic-bezier(0.22,1,0.36,1) both;
        }
        .testimonial-in {
          animation: testimonialIn 0.4s cubic-bezier(0.22,1,0.36,1) both;
        }
        .stat-badge-0 { animation: fadeSlideRight 0.5s 0.1s cubic-bezier(0.22,1,0.36,1) both; }
        .stat-badge-1 { animation: fadeSlideRight 0.5s 0.2s cubic-bezier(0.22,1,0.36,1) both; }
        .stat-badge-2 { animation: fadeSlideRight 0.5s 0.3s cubic-bezier(0.22,1,0.36,1) both; }
        .submit-btn:not(:disabled):hover {
          animation: pulseGlow 1.5s ease-in-out infinite;
        }
      `}</style>

      <div
        className="relative min-h-screen w-full overflow-hidden flex"
        style={{ background: "#eef5ff" }}
      >
        {/* ── Full-page dot grid ── */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.5 }}>
            <defs>
              <pattern
                id="dotgrid"
                x="0"
                y="0"
                width="28"
                height="28"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1.4" fill="#93c5fd" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dotgrid)" />
          </svg>
        </div>

        {/* ── Ambient orbs behind form ── */}
        <FloatingOrb
          size={420}
          color="rgba(191,219,254,0.6)"
          delay={0}
          style={{ top: "-100px", left: "-100px" }}
        />
        <FloatingOrb
          size={280}
          color="rgba(147,197,253,0.45)"
          delay={2}
          style={{ bottom: "-60px", left: "22%" }}
        />
        <FloatingOrb
          size={180}
          color="rgba(59,130,246,0.2)"
          delay={1}
          style={{ top: "42%", left: "36%" }}
        />

        {/* ══════════════════════════════════════════════
            LEFT — Form
        ══════════════════════════════════════════════ */}
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center lg:items-end px-4 sm:px-8 lg:px-14 xl:px-20 py-10">
          {/* Logo */}
          <div className="absolute top-6 left-6 sm:top-8 sm:left-10 z-20">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, #60b8f5 0%, #1a6fc4 100%)",
                  boxShadow: "0 2px 8px rgba(59,130,246,0.5)",
                }}
              />
              <span
                className="text-xs font-bold tracking-wide"
                style={{ color: "#0a2540" }}
              >
                {process.env.NEXT_PUBLIC_APP_NAME || "Linkaïa"}
              </span>
            </div>
          </div>

          {/* Form card */}
          <div
            className={`w-full sm:w-105 rounded-2xl p-7 sm:p-8 mt-14 lg:mt-0 ${
              mounted ? "card-enter" : "opacity-0"
            }`}
            style={{
              background: "rgba(255,255,255,0.96)",
              boxShadow:
                "0 24px 64px rgba(10,37,64,0.13), 0 4px 12px rgba(10,37,64,0.05)",
              border: "1px solid rgba(226,232,240,0.9)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-0.5">
              <h2
                className="text-lg font-bold"
                style={{ color: "#0a2540" }}
              >
                Créer un compte
              </h2>
              <Sparkles
                className="w-4 h-4"
                style={{ color: "#2563eb" }}
              />
            </div>
            <p className="text-xs mb-6" style={{ color: "#64748b" }}>
              Rejoignez Linkaïa et connectez-vous au monde entier.
            </p>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl h-11 font-semibold text-sm mb-5 transition-all duration-200 hover:bg-slate-50 hover:shadow-md active:scale-95 disabled:opacity-60"
              style={{
                background: "#fff",
                border: "1.5px solid #e2e8f0",
                color: "#1e293b",
                boxShadow: "0 1px 4px rgba(10,37,64,0.07)",
              }}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continuer avec Google
            </button>

            {/* Divider */}
            <div className="relative flex items-center mb-5">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="mx-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                ou
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Prénom + Nom */}
              <div className="grid grid-cols-2 gap-3">
                {renderField({
                  id: "prenom",
                  label: "Prénom",
                  icon: User,
                  value: formData.prenom,
                  error: errors.prenom,
                })}
                {renderField({
                  id: "nom",
                  label: "Nom",
                  icon: User,
                  value: formData.nom,
                  error: errors.nom,
                })}
              </div>

              {/* Email */}
              {renderField({
                id: "email",
                label: "Adresse email",
                type: "email",
                icon: Mail,
                value: formData.email,
                error: errors.email,
              })}

              {/* Password */}
              {renderField({
                id: "password",
                label: "Mot de passe",
                type: showPassword ? "text" : "password",
                icon: Lock,
                value: formData.password,
                error: errors.password,
                rightSlot: (
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:text-slate-600 transition-colors"
                    style={{ color: "#94a3b8" }}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                ),
              })}

              {/* Confirm password */}
              <div>
                {renderField({
                  id: "confirmPassword",
                  label: "Confirmer le mot de passe",
                  type: showConfirmPassword ? "text" : "password",
                  icon: Lock,
                  value: formData.confirmPassword,
                  error: errors.confirmPassword,
                  rightSlot: (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:text-slate-600 transition-colors"
                      style={{ color: "#94a3b8" }}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  ),
                })}
                {formData.confirmPassword &&
                  formData.password === formData.confirmPassword &&
                  formData.password.length > 0 && (
                    <p className="mt-1 text-xs text-emerald-600 ml-1 font-medium flex items-center gap-1">
                      <CircleCheck className="h-3 w-3" /> Les mots de passe
                      correspondent
                    </p>
                  )}
              </div>

              {/* Password requirements */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: "#f0f6ff",
                  border: "1.5px solid #dbeafe",
                }}
              >
                <p
                  className="text-xs font-semibold mb-2.5"
                  style={{ color: "#1e40af" }}
                >
                  Votre mot de passe doit contenir :
                </p>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-2">
                  {[
                    { key: "minLength", label: "8 caractères min." },
                    { key: "hasNumber", label: "1 chiffre" },
                    { key: "hasUppercase", label: "1 majuscule" },
                    { key: "hasLowercase", label: "1 minuscule" },
                    { key: "hasSymbol", label: "1 symbole spécial" },
                  ].map((req) => {
                    const ok =
                      passwordValidation.checks[
                        req.key as keyof typeof passwordValidation.checks
                      ];
                    return (
                      <div
                        key={req.key}
                        className="flex items-center gap-1.5 transition-all duration-300"
                      >
                        {ok ? (
                          <CircleCheck
                            className="w-3.5 h-3.5 shrink-0 transition-all duration-300"
                            style={{ color: "#2563eb" }}
                          />
                        ) : (
                          <Circle
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: "#cbd5e1" }}
                          />
                        )}
                        <span
                          className="text-xs font-medium transition-colors duration-300"
                          style={{ color: ok ? "#1d4ed8" : "#94a3b8" }}
                        >
                          {req.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="submit-btn w-full rounded-xl font-bold text-sm text-white transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  height: "48px",
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="w-4 h-4"
                      style={{
                        animation: "spinLoader 0.8s linear infinite",
                      }}
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
                    Création en cours...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Créer mon compte
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>

            {/* Sign-in link */}
            <div className="relative flex items-center my-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="mx-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                ou
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <Link
              href="/signin"
              className="w-full flex items-center justify-center rounded-xl font-semibold text-sm transition-all duration-200 hover:bg-slate-100 active:scale-95"
              style={{
                height: "44px",
                background: "#f1f5f9",
                color: "#0a2540",
                border: "1.5px solid #e2e8f0",
              }}
            >
              Déjà un compte ? Se connecter
            </Link>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            RIGHT — yolo.png + overlay + UI
        ══════════════════════════════════════════════ */}
        <div
          className={`hidden lg:flex lg:w-[46%] xl:w-[44%] relative flex-col items-center justify-center overflow-hidden shrink-0 ${
            mounted ? "card-enter-delay" : "opacity-0"
          }`}
        >
          {/* yolo.png */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/yolo.png')" }}
          />

          {/* Dark gradient overlay for readability */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(160deg, rgba(10,37,64,0.3) 0%, rgba(10,37,64,0.12) 45%, rgba(10,37,64,0.75) 100%)",
            }}
          />

          {/* Subtle blue tint */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(37,99,235,0.07)" }}
          />

          {/* dot grid on top of image */}
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.18 }}>
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <pattern
                  id="dotgrid-right"
                  x="0"
                  y="0"
                  width="28"
                  height="28"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="2" cy="2" r="1.4" fill="#ffffff" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dotgrid-right)" />
            </svg>
          </div>

          {/* ── Stat badges top ── */}
          <div className="absolute top-10 left-8 right-8 flex gap-3 z-10">
            {[
              { num: 1000, suffix: "+", label: "Membres" },
              { num: 48, suffix: " pays", label: "Connectés" },
              { num: 98, suffix: "%", label: "Satisfaction" },
            ].map((s, i) => (
              <div
                key={s.label}
                className={`flex-1 rounded-xl px-3 py-2.5 stat-badge-${i}`}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  backdropFilter: "blur(14px)",
                }}
              >
                <p className="text-white font-bold text-base leading-none">
                  <AnimatedNumber target={s.num} suffix={s.suffix} />
                </p>
                <p className="text-white/60 text-[10px] font-medium mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* ── Centre tagline ── */}
          <div className="relative z-10 text-center px-10">
            <p
              className="text-2xl font-bold text-white leading-snug"
              style={{ textShadow: "0 2px 14px rgba(0,0,0,0.45)" }}
            >
              Rejoignez des milliers de personnes qui créent des liens à
              travers le monde
            </p>
            <div
              className="mx-auto mt-3 h-0.5 rounded-full"
              style={{
                width: 52,
                background: "linear-gradient(90deg, #60b8f5, #fff)",
                boxShadow: "0 0 8px rgba(96,184,245,0.6)",
              }}
            />
          </div>

          {/* ── Testimonial card bottom ── */}
          <div
            className="absolute bottom-10 left-8 right-8 z-10 rounded-2xl p-6"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(18px)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            }}
          >
            <div
              className="text-5xl font-serif leading-none mb-3 select-none"
              style={{ color: "rgba(255,255,255,0.28)" }}
            >
              "
            </div>

            <div key={currentTestimonial} className="testimonial-in">
              <p className="text-white text-sm font-medium leading-relaxed mb-4">
                {testimonials[currentTestimonial].quote}
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    background: "rgba(255,255,255,0.18)",
                    border: "1.5px solid rgba(255,255,255,0.32)",
                    color: "#fff",
                  }}
                >
                  {testimonials[currentTestimonial].initial}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">
                    {testimonials[currentTestimonial].author}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <CircleCheck className="w-3 h-3 text-blue-300" />
                    <span className="text-blue-200 text-xs font-medium">
                      Membre vérifié
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dots */}
            <div className="flex gap-2 mt-5">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentTestimonial(i)}
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: i === currentTestimonial ? 28 : 6,
                    background:
                      i === currentTestimonial
                        ? "#fff"
                        : "rgba(255,255,255,0.3)",
                  }}
                  aria-label={`Témoignage ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}