// components/auth/VerifyEmailForm.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { maskEmail } from "@/lib/utils";

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6) {
      toast.error("Le code doit contenir 6 chiffres");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Code invalide");
        return;
      }

      // ✅ Email vérifié avec succès !
      toast.success("Email vérifié avec succès");

      // ⚠️ NOUVEAU COMPORTEMENT : Rediriger vers signin si needsLogin
      if (data.needsLogin) {
        toast.info("Connectez-vous maintenant avec vos identifiants");
        setTimeout(() => {
          router.push("/signin");
        }, 1500);
      } else {
        // Connexion auto réussie (si implémentée plus tard)
        router.push("/home");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);

    try {
      const response = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erreur lors du renvoi");
        return;
      }

      toast.success("Code renvoyé avec succès !");
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">Vérifiez votre email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Nous avons envoyé un code de vérification à
          </p>
          <p className="mt-1 font-semibold">{maskEmail(email)}</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code">Code de vérification</Label>
            <Input
              id="code"
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              maxLength={6}
              className="text-center text-2xl tracking-widest"
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-center">
              Le code expire dans 15 minutes
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || code.length !== 6}
          >
            {loading ? "Vérification..." : "Vérifier mon email"}
          </Button>
        </form>

        <div className="space-y-4 text-center text-sm">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resending}
            className="text-primary hover:underline disabled:opacity-50"
          >
            {resending ? "Envoi en cours..." : "Renvoyer le code"}
          </button>

          <Link
            href="/signup"
            className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'inscription
          </Link>
        </div>
      </div>
    </div>
  );
}
