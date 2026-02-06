// src/app/subscription/page.tsx
import { Suspense } from "react";
import SubscriptionPage from "@/components/pricing/SubscriptionPage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="text-center space-y-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground text-lg">
              Chargement de l'abonnement...
            </p>
            <p className="text-sm text-muted-foreground">
              Veuillez patienter un instant
            </p>
          </div>
        </div>
      }
    >
      <SubscriptionPage />
    </Suspense>
  );
}
