// src/app/club/page.tsx
import { Suspense } from "react";
import ClubPageContent from "@/components/club/ClubPageContent";

export default function ClubPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F4C5C] mx-auto"></div>
            <p className="text-muted-foreground text-lg">
              Chargement du Club LWB...
            </p>
          </div>
        </div>
      }
    >
      <ClubPageContent />
    </Suspense>
  );
}