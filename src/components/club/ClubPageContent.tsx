// src/app/club/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Crown,
  Video,
  Users,
  Calendar,
  BookOpen,
  Zap,
  CheckCircle,
  Loader2,
  ChevronRight,
  Settings,
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

interface ClubSubscription {
  id: string;
  startDate: string;
  endDate: string | null;
  status: string;
  autoRenew: boolean;
  period: string;
  pricePaid: number;
  currencyCode: string;
}

export default function ClubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [subscription, setSubscription] = useState<ClubSubscription | null>(
    null,
  );

  const success = searchParams.get("success");

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const response = await fetch("/api/club/current");
      const data = await response.json();

      if (data.success) {
        setSubscription(data.subscription);
        setHasAccess(data.hasAccess);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error("Error checking club access:", error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F4C5C]" />
      </div>
    );
  }

  // Si pas d'accès, rediriger vers la page de checkout
  if (!hasAccess) {
    router.push("/club/checkout");
    return null;
  }

  const contentSections = [
    {
      icon: Video,
      title: "Webinaires",
      description: "Sessions en direct avec nos experts",
      color: "from-blue-500 to-blue-600",
      items: [
        "Comment réussir son profil dating",
        "Les secrets d'une première rencontre",
        "Communication efficace en couple",
        "Gérer les conflits avec intelligence",
      ],
    },
    {
      icon: Users,
      title: "Coachings",
      description: "Accompagnement personnalisé",
      color: "from-purple-500 to-purple-600",
      items: [
        "Coaching individuel 1-to-1",
        "Analyse de profil personnalisée",
        "Stratégie de séduction",
        "Développement personnel",
      ],
    },
    {
      icon: Calendar,
      title: "Événements",
      description: "Rencontres exclusives membres",
      color: "from-pink-500 to-pink-600",
      items: [
        "Soirées networking mensuelles",
        "Speed dating réservé aux membres",
        "Ateliers thématiques",
        "Afterworks VIP",
      ],
    },
    {
      icon: Zap,
      title: "Lives",
      description: "Interactions en temps réel",
      color: "from-orange-500 to-orange-600",
      items: [
        "Q&A avec des coachs",
        "Témoignages de couples",
        "Conseils pratiques quotidiens",
        "Défis et challenges",
      ],
    },
    {
      icon: BookOpen,
      title: "E-books",
      description: "Ressources téléchargeables",
      color: "from-green-500 to-green-600",
      items: [
        "Guide complet du dating",
        "Les 50 erreurs à éviter",
        "Art de la conversation",
        "Psychologie amoureuse",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Success Banner */}
      {success === "true" && (
        <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 p-4">
          <div className="container mx-auto flex items-center gap-3 text-green-800 dark:text-green-200">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-semibold">Bienvenue au Club fermé LWB ! 🎉</p>
              <p className="text-sm">
                Votre abonnement a été activé avec succès. Profitez de tous nos
                contenus exclusifs.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-linear-to-r from-[#0F4C5C] to-[#0A3A47] text-white px-6 py-3 rounded-full mb-6 shadow-lg">
            <Crown className="w-6 h-6" />
            <span className="font-bold text-lg">Membre du Club fermé LWB</span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Votre Espace Exclusif
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Accédez à tous nos contenus premium : webinaires, coachings,
            événements, lives et e-books
          </p>
        </div>

        {/* Subscription Info */}
        {subscription && (
          <Card className="mb-8 border-[#0F4C5C]/20 shadow-lg">
            <CardHeader className="bg-linear-to-r from-[#0F4C5C]/5 to-[#0A3A47]/5">
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#0F4C5C]" />
                Votre Abonnement
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Type
                  </p>
                  <p className="font-semibold text-lg">
                    {subscription.period === "yearly" ? "Annuel" : "Mensuel"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Statut
                  </p>
                  <Badge
                    className={
                      subscription.status === "active"
                        ? "bg-green-500"
                        : "bg-gray-500"
                    }
                  >
                    {subscription.status === "active"
                      ? "Actif"
                      : subscription.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Renouvellement
                  </p>
                  <p className="font-semibold">
                    {subscription.autoRenew ? "Automatique" : "Désactivé"}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={() => router.push("/club/settings")}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Gérer mon abonnement
                </Button>
                <Button
                  onClick={() => router.push("/home")}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour à l'accueil
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Sections */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contentSections.map((section, idx) => (
            <Card
              key={idx}
              className="hover:shadow-xl transition-shadow duration-300 border-gray-200 dark:border-gray-700"
            >
              <CardHeader>
                <div
                  className={`w-14 h-14 rounded-xl bg-linear-to-br ${section.color} flex items-center justify-center mb-4 shadow-lg`}
                >
                  <section.icon className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-2xl">{section.title}</CardTitle>
                <CardDescription className="text-base">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {section.items.map((item, itemIdx) => (
                    <li
                      key={itemIdx}
                      className="flex items-start gap-2 text-sm"
                    >
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6 group" variant="outline">
                  Voir plus
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coming Soon Notice */}
        <Card className="mt-8 bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <Zap className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Nouveaux contenus chaque semaine
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Restez connecté ! Nous ajoutons régulièrement de nouveaux
                webinaires, e-books et événements exclusifs pour nos membres.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
