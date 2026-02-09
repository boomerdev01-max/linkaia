// src/app/club/checkout/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Crown,
  Check,
  Loader2,
  AlertCircle,
  Video,
  Users,
  Calendar,
  BookOpen,
  Zap,
  ArrowLeft,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ClubCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const canceled = searchParams.get("canceled");

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/club/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: selectedPeriod }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Erreur lors de la création de la session");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Une erreur est survenue");
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Video,
      title: "Webinaires exclusifs",
      description: "Sessions en direct avec nos experts en relations",
    },
    {
      icon: Users,
      title: "Coachings personnalisés",
      description: "Accompagnement 1-to-1 pour atteindre vos objectifs",
    },
    {
      icon: Calendar,
      title: "Événements privés",
      description: "Rencontres et networking réservés aux membres",
    },
    {
      icon: Zap,
      title: "Lives interactifs",
      description: "Q&A et défis en temps réel avec la communauté",
    },
    {
      icon: BookOpen,
      title: "E-books premium",
      description: "Guides complets téléchargeables à vie",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Canceled Banner */}
      {canceled === "true" && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800 p-4">
          <div className="container mx-auto flex items-center gap-3 text-orange-800 dark:text-orange-200">
            <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            <p>Vous avez annulé le processus de paiement.</p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-linear-to-r from-[#0F4C5C] to-[#0A3A47] text-white px-6 py-3 rounded-full mb-6 shadow-lg">
            <Crown className="w-6 h-6" />
            <span className="font-bold text-lg">Club fermé LWB</span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Rejoignez le Club Exclusif
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Accédez à des contenus premium et à une communauté d'élite pour
            maximiser vos chances de rencontres réussies
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Features */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Ce qui vous attend
            </h2>
            {features.map((feature, idx) => (
              <Card key={idx} className="border-gray-200 dark:border-gray-700">
                <CardContent className="flex items-start gap-4 pt-6">
                  <div className="w-12 h-12 rounded-lg bg-linear-to-br from-[#0F4C5C] to-[#0A3A47] flex items-center justify-center shrink-0">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pricing Card */}
          <div>
            <Card className="border-[#0F4C5C]/20 shadow-xl sticky top-8">
              <CardHeader className="bg-linear-to-r from-[#0F4C5C]/5 to-[#0A3A47]/5">
                <CardTitle className="text-2xl">Choisissez votre plan</CardTitle>
                <CardDescription>
                  Économisez 10% avec l'abonnement annuel
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Period Selector */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedPeriod("monthly")}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      selectedPeriod === "monthly"
                        ? "border-[#0F4C5C] bg-[#0F4C5C]/5"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Mensuel
                    </p>
                    <p className="text-2xl font-bold text-[#0F4C5C] dark:text-[#B88A4F] mt-2">
                      10 500 FCFA
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      ~15€ / mois
                    </p>
                  </button>

                  <button
                    onClick={() => setSelectedPeriod("yearly")}
                    className={`p-4 border-2 rounded-lg transition-all relative ${
                      selectedPeriod === "yearly"
                        ? "border-[#0F4C5C] bg-[#0F4C5C]/5"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <Badge className="absolute -top-2 -right-2 bg-green-500">
                      -10%
                    </Badge>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Annuel
                    </p>
                    <p className="text-2xl font-bold text-[#0F4C5C] dark:text-[#B88A4F] mt-2">
                      126 000 FCFA
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      ~180€ / an
                    </p>
                  </button>
                </div>

                {/* Included Features */}
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Inclus dans votre abonnement :
                  </p>
                  {[
                    "Webinaires illimités",
                    "Coachings personnalisés",
                    "Événements privés mensuels",
                    "Lives interactifs quotidiens",
                    "Bibliothèque e-books complète",
                    "Communauté exclusive",
                    "Support prioritaire",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Checkout Button */}
                <Button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-linear-to-r from-[#0F4C5C] to-[#0A3A47] hover:from-[#0a3540] hover:to-[#082830] text-white font-semibold py-6 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Redirection...
                    </>
                  ) : (
                    <>
                      <Crown className="mr-2 h-5 w-5" />
                      Rejoindre le Club LWB
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Paiement sécurisé par Stripe • Annulation à tout moment
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}