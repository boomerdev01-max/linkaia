// src/app/signup/prestige/page.tsx
import { Suspense } from "react";
import PrestigeSignupContent from "@/components/auth/PrestigeSignupContent";

export default function PrestigeSignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
          <div
            className="bg-[#0f0f0f] border border-[#2a2010] p-8 text-center"
            style={{ color: "#c9a84c" }}
          >
            Chargement...
          </div>
        </div>
      }
    >
      <PrestigeSignupContent />
    </Suspense>
  );
}
