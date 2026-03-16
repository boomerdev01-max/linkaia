"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validatePassword } from "@/lib/utils";
import { CircleCheck, Circle, Eye, EyeOff } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

const testimonials = [
  {
    quote:
      "Cette plateforme a transformé notre façon de travailler. L'authentification est fluide et sécurisée.",
    author: "@sarah_dev",
  },
  {
    quote:
      "Interface moderne et intuitive. L'intégration d'une connexion avec Google m'a beaucoup plu !",
    author: "@mark_tech",
  },
  {
    quote:
      "La sécurité avant tout. J'apprécie la vérification par email et les exigences strictes pour les mots de passe.",
    author: "@julie_design",
  },
];

export default function SignupPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    confirmPassword: "", // Nouveau champ pour la confirmation
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const passwordValidation = validatePassword(formData.password);

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error("Erreur lors de la connexion avec Google");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.nom) newErrors.nom = "Le nom est requis";
    if (!formData.prenom) newErrors.prenom = "Le prénom est requis";
    if (!formData.email) newErrors.email = "L'email est requis";
    if (!passwordValidation.isValid) {
      newErrors.password = "Le mot de passe ne respecte pas les exigences";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Veuillez confirmer votre mot de passe";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // On n'envoie que les champs nécessaires à l'API (sans confirmPassword)
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
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  // Auto-rotate testimonials
  useState(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  });

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950 font-sans selection:bg-pink-500/30">
      {/* Left Side - Form */}
      <div className="relative flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24 overflow-hidden">
        {/* Ambient Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-linear-to-br from-pink-500/10 to-purple-500/10 blur-[100px]" />
          <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] rounded-full bg-linear-to-brorange-500/10 to-yellow-500/10 blur-[100px]" />
        </div>

        <div className="mx-auto w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Rejoignez{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-orange-400">
                l'aventure
              </span>
            </h1>
            <p className="mt-3 text-base text-gray-500 dark:text-gray-400 font-medium">
              Créez votre compte {process.env.NEXT_PUBLIC_APP_NAME || "Linkaïa"}{" "}
              en quelques secondes.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full h-14 text-base font-medium transition-all hover:bg-gray-50 dark:hover:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-800 hover:border-gray-300 shadow-sm hover:scale-[1.02] active:scale-95"
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            <svg
              className="w-5 h-5 mr-3"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
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
          </Button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-zinc-950 px-4 text-gray-400 font-semibold tracking-wider">
                ou avec votre email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5 group">
                <Label
                  htmlFor="prenom"
                  className={`text-sm font-semibold transition-colors ml-1 ${errors.prenom ? "text-red-500" : "text-gray-700 dark:text-gray-300 group-focus-within:text-pink-500"}`}
                >
                  Prénom
                </Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) =>
                    setFormData({ ...formData, prenom: e.target.value })
                  }
                  className={`h-12 rounded-2xl bg-gray-50/50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 px-4 transition-all focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 ${errors.prenom ? "border-red-500 ring-red-500/20 focus:border-red-500" : ""}`}
                  disabled={loading}
                  placeholder="Jean"
                />
                {errors.prenom && (
                  <p className="text-xs text-red-500 ml-1 font-medium animate-in fade-in slide-in-from-top-1">
                    {errors.prenom}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 group">
                <Label
                  htmlFor="nom"
                  className={`text-sm font-semibold transition-colors ml-1 ${errors.nom ? "text-red-500" : "text-gray-700 dark:text-gray-300 group-focus-within:text-pink-500"}`}
                >
                  Nom
                </Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                  className={`h-12 rounded-2xl bg-gray-50/50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 px-4 transition-all focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 ${errors.nom ? "border-red-500 ring-red-500/20 focus:border-red-500" : ""}`}
                  disabled={loading}
                  placeholder="Dupont"
                />
                {errors.nom && (
                  <p className="text-xs text-red-500 ml-1 font-medium animate-in fade-in slide-in-from-top-1">
                    {errors.nom}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5 group">
              <Label
                htmlFor="email"
                className={`text-sm font-semibold transition-colors ml-1 ${errors.email ? "text-red-500" : "text-gray-700 dark:text-gray-300 group-focus-within:text-pink-500"}`}
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={`h-12 rounded-2xl bg-gray-50/50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 px-4 transition-all focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 ${errors.email ? "border-red-500 ring-red-500/20 focus:border-red-500" : ""}`}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-xs text-red-500 ml-1 font-medium animate-in fade-in slide-in-from-top-1">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5 group">
              <Label
                htmlFor="password"
                className={`text-sm font-semibold transition-colors ml-1 ${errors.password ? "text-red-500" : "text-gray-700 dark:text-gray-300 group-focus-within:text-pink-500"}`}
              >
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={`h-12 rounded-2xl bg-gray-50/50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 px-4 pr-12 transition-all focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 ${errors.password ? "border-red-500 ring-red-500/20 focus:border-red-500" : ""}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 ml-1 font-medium animate-in fade-in slide-in-from-top-1">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Nouveau champ : Confirmation du mot de passe */}
            <div className="space-y-1.5 group">
              <Label
                htmlFor="confirmPassword"
                className={`text-sm font-semibold transition-colors ml-1 ${errors.confirmPassword ? "text-red-500" : "text-gray-700 dark:text-gray-300 group-focus-within:text-pink-500"}`}
              >
                Confirmer le mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className={`h-12 rounded-2xl bg-gray-50/50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 px-4 pr-12 transition-all focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 ${errors.confirmPassword ? "border-red-500 ring-red-500/20 focus:border-red-500" : ""}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 ml-1 font-medium animate-in fade-in slide-in-from-top-1">
                  {errors.confirmPassword}
                </p>
              )}
              {formData.confirmPassword &&
                formData.password === formData.confirmPassword &&
                formData.password.length > 0 && (
                  <p className="text-xs text-green-500 ml-1 font-medium animate-in fade-in slide-in-from-top-1 flex items-center gap-1">
                    <CircleCheck className="h-3 w-3" /> Les mots de passe
                    correspondent
                  </p>
                )}
            </div>

            {/* Password Requirements */}
            <div className="space-y-3 rounded-2xl border border-pink-100 dark:border-pink-900/30 bg-pink-50/50 dark:bg-pink-900/10 p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Votre mot de passe doit contenir :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: "minLength", label: "8 caractères min." },
                  { key: "hasNumber", label: "1 chiffre" },
                  { key: "hasUppercase", label: "1 majuscule" },
                  { key: "hasLowercase", label: "1 minuscule" },
                  { key: "hasSymbol", label: "1 symbole spécial" },
                ].map((req) => (
                  <div
                    key={req.key}
                    className="flex items-center gap-2 text-sm"
                  >
                    {passwordValidation.checks[
                      req.key as keyof typeof passwordValidation.checks
                    ] ? (
                      <CircleCheck className="h-4 w-4 text-pink-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                    )}
                    <span
                      className={
                        passwordValidation.checks[
                          req.key as keyof typeof passwordValidation.checks
                        ]
                          ? "text-pink-600 dark:text-pink-400 font-medium"
                          : "text-gray-500 dark:text-gray-400"
                      }
                    >
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full rounded-full h-14 text-lg font-bold bg-linear-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white shadow-xl shadow-pink-500/25 transition-all hover:scale-[1.02] active:scale-95"
              disabled={loading}
            >
              {loading ? "Création en cours..." : "Créer mon compte"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
            Vous avez déjà un compte ?{" "}
            <Link
              href="/signin"
              className="font-bold text-pink-500 hover:text-pink-600 transition-colors hover:underline underline-offset-4"
            >
              Connectez-vous ici
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Testimonials (Badoo/Bumble Style) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-16 overflow-hidden bg-linear-to-br from-pink-500 via-rose-400 to-orange-400">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-black/5 mix-blend-overlay"></div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />

        <div className="absolute left-[15%] top-[20%] w-24 h-24 rounded-full border border-white/30 bg-white/10 backdrop-blur-md shadow-2xl animate-[bounce_4s_infinite]" />
        <div className="absolute right-[20%] top-[30%] w-16 h-16 rounded-full border border-white/20 bg-white/5 backdrop-blur-md shadow-2xl animate-[bounce_5s_infinite_1s]" />
        <div className="absolute left-[25%] bottom-[25%] w-32 h-32 rounded-full border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl animate-[bounce_6s_infinite_0.5s]" />

        <div className="relative z-10 w-full max-w-lg">
          {/* Glassmorphism Testimonial Card */}
          <div className="rounded-[2.5rem] bg-white/10 p-12 backdrop-blur-xl border border-white/20 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-right-8 duration-1000">
            <div className="mb-6 text-7xl text-white/40 font-serif leading-none">
              "
            </div>
            <blockquote className="space-y-8">
              <p className="text-2xl font-medium leading-relaxed text-white">
                {testimonials[currentTestimonial].quote}
              </p>
              <footer className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-tr from-white/40 to-white/10 text-2xl font-bold text-white shadow-inner border border-white/30 backdrop-blur-md">
                  {testimonials[currentTestimonial].author
                    .charAt(1)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="text-xl font-bold text-white tracking-wide">
                    {testimonials[currentTestimonial].author}
                  </div>
                  <div className="text-sm text-white/70 font-medium flex items-center gap-1 mt-1">
                    <CircleCheck className="w-4 h-4" /> Membre vérifié
                  </div>
                </div>
              </footer>
            </blockquote>

            {/* Dots indicator */}
            <div className="mt-12 flex gap-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`h-2.5 rounded-full transition-all duration-500 ease-in-out ${
                    index === currentTestimonial
                      ? "w-10 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                      : "w-2.5 bg-white/30 hover:bg-white/50"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
