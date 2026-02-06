"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, CircleCheck, Circle } from "lucide-react";
import { validatePassword } from "@/lib/utils";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [formData, setFormData] = useState({
    code: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(false);
  
  const passwordValidation = validatePassword(formData.newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.code.length !== 6) {
      toast.error("Le code doit contenir 6 chiffres");
      return;
    }

    if (!passwordValidation.isValid) {
      toast.error("Le mot de passe ne respecte pas les exigences");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: formData.code,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erreur lors de la réinitialisation");
        return;
      }

      toast.success("Mot de passe réinitialisé avec succès !");
      router.push("/signin");
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">Nouveau mot de passe</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entrez le code reçu par email et créez un nouveau mot de passe
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code">Code de vérification</Label>
            <Input
              id="code"
              type="text"
              placeholder="000000"
              value={formData.code}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  code: e.target.value.replace(/\D/g, "").slice(0, 6),
                })
              }
              maxLength={6}
              className="text-center text-2xl tracking-widest"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
              disabled={loading}
            />
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
                <div key={req.key} className="flex items-center gap-2 text-sm">
                  {passwordValidation.checks[req.key as keyof typeof passwordValidation.checks] ? (
                    <CircleCheck className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={passwordValidation.checks[req.key as keyof typeof passwordValidation.checks] ? "text-green-600" : ""}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || formData.code.length !== 6 || !passwordValidation.isValid}>
            {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
          </Button>
        </form>
      </div>
    </div>
  );
}