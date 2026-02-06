"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validatePassword } from "@/lib/utils";
import { CircleCheck, Circle, Building2 } from "lucide-react";

export default function CompanySignupForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const passwordValidation = validatePassword(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.companyName)
      newErrors.companyName = "Le nom de l'entreprise est requis";
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
      const response = await fetch("/api/auth/company/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erreur lors de l'inscription");
        return;
      }

      toast.success("Compte entreprise créé ! Vérifiez votre email.");
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Form */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Compte Entreprise</h1>
                <p className="text-sm text-muted-foreground">
                  Créez votre compte professionnel
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="companyName"
                className={errors.companyName ? "text-red-600" : ""}
              >
                Nom de l'entreprise *
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                className={errors.companyName ? "border-red-600" : ""}
                disabled={loading}
                placeholder="ACME Corporation"
              />
              {errors.companyName && (
                <p className="text-xs text-red-600">{errors.companyName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className={errors.email ? "text-red-600" : ""}
              >
                Email légal *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@entreprise.com"
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
              <p className="text-xs text-muted-foreground">
                Un code de vérification sera envoyé à cette adresse
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className={errors.password ? "text-red-600" : ""}
              >
                Mot de passe *
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
              {loading ? "Création..." : "Créer le compte entreprise"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Compte individuel ?{" "}
            <Link
              href="/signup"
              className="font-semibold text-primary hover:underline"
            >
              S'inscrire ici
            </Link>
          </p>

          <p className="mt-2 text-center text-sm text-muted-foreground">
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

      {/* Right Side - Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-primary/10 via-primary/5 to-background items-center justify-center p-16">
        <div className="max-w-lg">
          <Building2 className="w-16 h-16 text-primary mb-8" />
          <h2 className="text-3xl font-bold mb-6">
            Rejoignez notre plateforme professionnelle
          </h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Inscription simple</h3>
                <p className="text-sm text-muted-foreground">
                  Créez votre compte en quelques minutes
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Vérification sécurisée</h3>
                <p className="text-sm text-muted-foreground">
                  Validation de votre identité légale
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Accès immédiat</h3>
                <p className="text-sm text-muted-foreground">
                  Profitez de toutes les fonctionnalités
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}