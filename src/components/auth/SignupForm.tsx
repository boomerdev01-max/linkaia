"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validatePassword } from "@/lib/utils";
import { CircleCheck, Circle } from "lucide-react";
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
  });

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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
    <div className="flex min-h-screen">
      {/* Left Side - Form */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Créer un compte</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Commencez votre aventure avec{" "}
              {process.env.NEXT_PUBLIC_APP_NAME || "Linkaïa"}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                ou
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="prenom"
                  className={errors.prenom ? "text-red-600" : ""}
                >
                  Prénom
                </Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) =>
                    setFormData({ ...formData, prenom: e.target.value })
                  }
                  className={errors.prenom ? "border-red-600" : ""}
                  disabled={loading}
                />
                {errors.prenom && (
                  <p className="text-xs text-red-600">{errors.prenom}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="nom"
                  className={errors.nom ? "text-red-600" : ""}
                >
                  Nom
                </Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                  className={errors.nom ? "border-red-600" : ""}
                  disabled={loading}
                />
                {errors.nom && (
                  <p className="text-xs text-red-600">{errors.nom}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className={errors.email ? "text-red-600" : ""}
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
                className={errors.email ? "border-red-600" : ""}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className={errors.password ? "text-red-600" : ""}
              >
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className={errors.password ? "border-red-600" : ""}
                disabled={loading}
              />
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
              <p className="text-sm font-medium">Exigences du mot de passe :</p>
              <div className="space-y-1">
                {[
                  { key: "minLength", label: "Au moins 8 caractères" },
                  { key: "hasNumber", label: "Au moins 1 chiffre" },
                  { key: "hasUppercase", label: "Au moins 1 majuscule" },
                  { key: "hasLowercase", label: "Au moins 1 minuscule" },
                  { key: "hasSymbol", label: "Au moins 1 symbole" },
                ].map((req) => (
                  <div
                    key={req.key}
                    className="flex items-center gap-2 text-sm"
                  >
                    {passwordValidation.checks[
                      req.key as keyof typeof passwordValidation.checks
                    ] ? (
                      <CircleCheck className="h-4 w-4 text-green-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span
                      className={
                        passwordValidation.checks[
                          req.key as keyof typeof passwordValidation.checks
                        ]
                          ? "text-green-600"
                          : ""
                      }
                    >
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Création..." : "Créer un compte"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link
              href="/signin"
              className="font-semibold text-primary hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Testimonials */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-primary/10 via-primary/5 to-background items-center justify-center p-16">
        <div className="max-w-lg">
          <div className="mb-8 text-6xl">"</div>
          <blockquote className="space-y-6">
            <p className="text-2xl font-light leading-relaxed">
              {testimonials[currentTestimonial].quote}
            </p>
            <footer className="text-lg font-semibold text-primary">
              {testimonials[currentTestimonial].author}
            </footer>
          </blockquote>

          {/* Dots indicator */}
          <div className="mt-12 flex gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentTestimonial
                    ? "w-8 bg-primary"
                    : "w-2 bg-primary/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
