"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export default function SigninForm() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<Record<string, boolean>>({});

  const isFloating = (field: string) =>
    focused[field] || formData[field as keyof typeof formData] !== "";

  const handleGoogleSignin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/api/auth/callback` },
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
    if (!formData.email) newErrors.email = "L'email est requis";
    if (!formData.password) newErrors.password = "Le mot de passe est requis";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.needsVerification) {
          toast.error("Veuillez vérifier votre email avant de vous connecter");
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
          return;
        }
        toast.error(data.error || "Erreur lors de la connexion");
        return;
      }

      toast.success("Connexion réussie !");
      router.push("/home");
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        backgroundImage: "url('/images/no-blur.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* ── TOP-LEFT: Logo + tagline (hidden on mobile) ── */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-10 z-20 max-w-[220px] hidden sm:block">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-6 h-6 rounded-full shrink-0"
            style={{
              background: "linear-gradient(135deg, #60b8f5 0%, #1a6fc4 100%)",
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

        {/* Tagline : Connectez-vous au monde qui vous entoure*/}
        <p
          className="text-[22px] font-semibold leading-snug"
          style={{ color: "#0a2540" }}
        >
          Connectez-vous au monde qui vous entoure
        </p>
        <p
          className="text-[16px] leading-snug mt-0.5 font-medium"
          style={{ color: "#1e4a6e" }}
        >
          Découvrez, échangez, et créez des liens avec{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #2563eb 0%, #38bdf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: 700,
            }}
          >
            qui vous voulez.
          </span>
        </p>
      </div>

      {/* ── Mobile: Simple logo without tagline ── */}
      <div className="absolute top-6 left-6 z-20 sm:hidden">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full shrink-0"
            style={{
              background: "linear-gradient(135deg, #60b8f5 0%, #1a6fc4 100%)",
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

      {/* ── RIGHT: Form card centered vertically ── */}
      <div className="relative z-10 min-h-screen flex items-center justify-end px-4 sm:px-10 lg:px-16 xl:px-24">
        <div
          className="w-full sm:w-[390px] rounded-2xl p-7 sm:p-8"
          style={{
            background: "rgba(255,255,255,0.98)",
            boxShadow:
              "0 24px 64px rgba(10,37,64,0.16), 0 4px 12px rgba(10,37,64,0.06)",
            border: "1px solid rgba(226,232,240,0.8)",
          }}
        >
          {/* Header */}
          <h2 className="text-lg font-bold mb-0.5" style={{ color: "#0a2540" }}>
            Se connecter
          </h2>
          <p className="text-xs mb-6" style={{ color: "#64748b" }}>
            Bienvenue ! Entrez vos identifiants pour continuer.
          </p>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl h-11 font-semibold text-sm mb-5 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-60"
            style={{
              background: "#fff",
              border: "1.5px solid #e2e8f0",
              color: "#1e293b",
              boxShadow: "0 1px 3px rgba(10,37,64,0.06)",
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
            {/* Email */}
            <div>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors"
                  style={{ color: focused.email ? "#2563eb" : "#94a3b8" }}
                />
                <input
                  id="signin-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  onFocus={() => setFocused((f) => ({ ...f, email: true }))}
                  onBlur={() => setFocused((f) => ({ ...f, email: false }))}
                  disabled={loading}
                  className="w-full h-14 rounded-xl pl-10 pr-4 pt-5 pb-1 text-sm font-medium outline-none transition-all disabled:opacity-60"
                  style={{
                    background: "#f8fafc",
                    border: errors.email
                      ? "1.5px solid #ef4444"
                      : focused.email
                        ? "1.5px solid #2563eb"
                        : "1.5px solid #e2e8f0",
                    color: "#0a2540",
                    boxShadow: focused.email
                      ? "0 0 0 3px rgba(37,99,235,0.1)"
                      : "none",
                  }}
                  placeholder=" "
                />
                <label
                  htmlFor="signin-email"
                  className="absolute left-10 pointer-events-none select-none transition-all duration-200"
                  style={{
                    top: isFloating("email") ? "6px" : "50%",
                    transform: isFloating("email")
                      ? "none"
                      : "translateY(-50%)",
                    fontSize: isFloating("email") ? "9px" : "12px",
                    fontWeight: isFloating("email") ? 700 : 500,
                    color: errors.email
                      ? "#ef4444"
                      : focused.email
                        ? "#2563eb"
                        : "#94a3b8",
                    letterSpacing: isFloating("email") ? "0.07em" : "normal",
                    textTransform: isFloating("email") ? "uppercase" : "none",
                  }}
                >
                  Email ou numéro de mobile
                </label>
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 ml-1 font-medium">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors"
                  style={{ color: focused.password ? "#2563eb" : "#94a3b8" }}
                />
                <input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  onFocus={() => setFocused((f) => ({ ...f, password: true }))}
                  onBlur={() => setFocused((f) => ({ ...f, password: false }))}
                  disabled={loading}
                  className="w-full h-14 rounded-xl pl-10 pr-12 pt-5 pb-1 text-sm font-medium outline-none transition-all disabled:opacity-60"
                  style={{
                    background: "#f8fafc",
                    border: errors.password
                      ? "1.5px solid #ef4444"
                      : focused.password
                        ? "1.5px solid #2563eb"
                        : "1.5px solid #e2e8f0",
                    color: "#0a2540",
                    boxShadow: focused.password
                      ? "0 0 0 3px rgba(37,99,235,0.1)"
                      : "none",
                  }}
                  placeholder=" "
                />
                <label
                  htmlFor="signin-password"
                  className="absolute left-10 pointer-events-none select-none transition-all duration-200"
                  style={{
                    top: isFloating("password") ? "6px" : "50%",
                    transform: isFloating("password")
                      ? "none"
                      : "translateY(-50%)",
                    fontSize: isFloating("password") ? "9px" : "12px",
                    fontWeight: isFloating("password") ? 700 : 500,
                    color: errors.password
                      ? "#ef4444"
                      : focused.password
                        ? "#2563eb"
                        : "#94a3b8",
                    letterSpacing: isFloating("password") ? "0.07em" : "normal",
                    textTransform: isFloating("password")
                      ? "uppercase"
                      : "none",
                  }}
                >
                  Mot de passe
                </label>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:text-slate-600"
                  style={{ color: "#94a3b8" }}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500 ml-1 font-medium">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Forgot */}
            <div className="flex justify-end -mt-1">
              <Link
                href="/forgot-password"
                className="text-xs font-semibold hover:underline underline-offset-4"
                style={{ color: "#2563eb" }}
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                height: "48px",
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
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
                  Connexion en cours...
                </span>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          {/* Divider + create account */}
          <div className="relative flex items-center my-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="mx-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              ou
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <Link
            href="/signup"
            className="w-full flex items-center justify-center rounded-xl font-semibold text-sm transition-all hover:bg-slate-100 active:scale-95"
            style={{
              height: "44px",
              background: "#f1f5f9",
              color: "#0a2540",
              border: "1.5px solid #e2e8f0",
            }}
          >
            Créez-vous un compte ici  
          </Link>
        </div>
      </div>
    </div>
  );
}
