// app/(auth)/change-password/page.tsx
import { Suspense } from "react";
import ChangePasswordPage from "@/components/auth/ChangePassword";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vérification de l'email",
  description: "Vérifiez votre adresse email",
};

export default function ChangePassword() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="text-center space-y-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground text-lg">
              Chargement de la vérification...
            </p>
            <p className="text-sm text-muted-foreground">
              Veuillez patienter un instant
            </p>
          </div>
        </div>
      }
    >
      <ChangePasswordPage />
    </Suspense>
  );
}
