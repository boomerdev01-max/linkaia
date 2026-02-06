// src/app/(onboarding)/preferences/welcome/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function PreferenceWelcomePage() {
  const router = useRouter();
  const [isSkipping, setIsSkipping] = useState(false);

  const handleStart = () => {
    router.push("/onboarding/preferences");
  };

  const handleSkip = async () => {
    try {
      setIsSkipping(true);
      const response = await fetch("/api/preference/skip", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to skip");
      }

      toast.success("Vous pourrez définir vos préférences plus tard");
      router.push("/home");
    } catch (error) {
      console.error("Failed to skip preferences:", error);
      toast.error("Une erreur est survenue");
      setIsSkipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Hero Illustration */}
          <div className="relative h-96 bg-linear-to-br from-primary via-secondary/50 to-accent/60 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src="/images/preferences.png"
                alt="Define your preferences"
                width={400}
                height={400}
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Définissez vos préférences pour des rencontres plus pertinentes
            </h1>
            
            <p className="text-gray-600 mb-8">
              Aidez-nous à vous trouver les meilleures correspondances selon vos envies et vos valeurs.
            </p>

            {/* Info Box simplifiée */}
            <div className="mb-8 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-900">
                Vous pouvez passer n'importe quelle question et modifier vos préférences à tout moment.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-4">
              <Button
                onClick={handleStart}
                size="lg"
                className="w-full rounded-full text-lg font-semibold h-14 shadow-lg hover:shadow-xl transition-shadow"
              >
                Commencer
              </Button>

              <Button
                onClick={handleSkip}
                disabled={isSkipping}
                variant="ghost"
                size="lg"
                className="w-full rounded-full text-gray-600 hover:text-gray-900"
              >
                {isSkipping ? "Redirection..." : "Pas maintenant"}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Vous pourrez toujours définir vos préférences plus tard
        </p>
      </div>
    </div>
  );
}