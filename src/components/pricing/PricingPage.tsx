"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Crown, Star, User, Loader2 } from "lucide-react";
import {
  CurrencyCode,
  convertPlanPrices,
  formatCurrency,
  CURRENCY_NAMES,
} from "@/lib/currency";

interface Feature {
  featureKey: string;
  featureValue: string;
  description: string | null;
}

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

interface SubscriptionType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceMonth: number;
  priceYear: number;
  color: string | null;
  icon: string | null;
  order: number;
  features: Feature[];
  currency: Currency;
}

interface UserSubscription {
  id: string;
  subscriptionType: {
    id: string;
    code: string;
  };
}

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>("XOF");
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] =
    useState<UserSubscription | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchUserSubscription();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/subscriptions/plans");
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubscription = async () => {
    try {
      const response = await fetch(
        "/api/subscriptions/current-user-subscription",
      );
      const data = await response.json();
      if (data.success) {
        setUserSubscription(data.subscription);
      }
    } catch (error) {
      console.error("Error fetching user subscription:", error);
    }
  };

  const handleSubscribe = async (planId: string, code: string) => {
    if (code === "FREE") {
      router.push("/home");
      return;
    }
    setProcessingPlan(planId);
    try {
      const response = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionTypeId: planId,
          period: selectedPeriod,
          currency: selectedCurrency,
        }),
      });
      const data = await response.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert("Erreur lors de la création de la session de paiement");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Une erreur est survenue");
    } finally {
      setProcessingPlan(null);
    }
  };

  const getIcon = (icon: string | null) => {
    switch (icon) {
      case "crown":
        return <Crown className="h-8 w-8" />;
      case "star":
        return <Star className="h-8 w-8" />;
      default:
        return <User className="h-8 w-8" />;
    }
  };

  const getFeatureDisplay = (features: Feature[]) => {
    const matchRange = features.find(
      (f) => f.featureKey === "match_range",
    )?.featureValue;
    const dailyMatches = features.find(
      (f) => f.featureKey === "daily_matches",
    )?.featureValue;
    const messages = features.find(
      (f) => f.featureKey === "messages",
    )?.featureValue;
    const profileBoost =
      features.find((f) => f.featureKey === "profile_boost")?.featureValue ===
      "true";
    const badgeVisible =
      features.find((f) => f.featureKey === "badge_visible")?.featureValue ===
      "true";
    const badgeLabel = features.find(
      (f) => f.featureKey === "badge_label",
    )?.featureValue;

    return [
      matchRange && `Matchs: ${matchRange}%`,
      dailyMatches &&
        `${dailyMatches === "unlimited" ? "Suggestions illimitées" : `${dailyMatches} suggestions/jour`}`,
      messages &&
        `${messages === "unlimited" ? "Messages illimités" : "Messages limités"}`,
      profileBoost && "Boost de profil",
      badgeVisible && badgeLabel && `Badge ${badgeLabel}`,
    ].filter(Boolean);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choisissez votre plan</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Trouvez le plan qui correspond à vos besoins
        </p>

        {/* Sélecteur de période */}
        <div className="flex justify-center gap-6 mb-6">
          <Tabs
            value={selectedPeriod}
            onValueChange={(v) => setSelectedPeriod(v as "monthly" | "yearly")}
            className="inline-block"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Mensuel</TabsTrigger>
              <TabsTrigger value="yearly">
                Annuel
                <Badge variant="secondary" className="ml-2">
                  -17%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Sélecteur de devise */}
          <select
            value={selectedCurrency}
            onChange={(e) =>
              setSelectedCurrency(e.target.value as CurrencyCode)
            }
            className="px-4 py-2 border rounded-lg bg-background"
          >
            <option value="XOF">🇧🇯 {CURRENCY_NAMES.XOF}</option>
            <option value="EUR">🇪🇺 {CURRENCY_NAMES.EUR}</option>
            <option value="USD">🇺🇸 {CURRENCY_NAMES.USD}</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const { priceMonth, priceYear, symbol } = convertPlanPrices(
            plan.priceMonth,
            plan.priceYear,
            selectedCurrency,
          );
          const price = selectedPeriod === "yearly" ? priceYear : priceMonth;
          const features = getFeatureDisplay(plan.features);
          const isPopular = plan.code === "VIP";
          const isCurrentPlan =
            userSubscription?.subscriptionType.code === plan.code;

          return (
            <Card
              key={plan.id}
              className={`relative p-8 ${isPopular ? "border-primary shadow-lg scale-105" : ""}`}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Populaire
                </Badge>
              )}
              <div className="text-center mb-6">
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                  style={{
                    backgroundColor: plan.color || "#6B7280",
                    color: "white",
                  }}
                >
                  {getIcon(plan.icon)}
                </div>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>
                <div className="text-4xl font-bold mb-1">
                  {formatCurrency(price, selectedCurrency)}
                </div>
                <div className="text-sm text-muted-foreground">
                  par {selectedPeriod === "yearly" ? "an" : "mois"}
                </div>
              </div>
              <Button
                onClick={() => handleSubscribe(plan.id, plan.code)}
                disabled={processingPlan === plan.id || isCurrentPlan}
                className="w-full mb-6"
                variant={isPopular ? "default" : "outline"}
              >
                {processingPlan === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Traitement...
                  </>
                ) : isCurrentPlan ? (
                  "Plan actuel"
                ) : (
                  "Souscrire"
                )}
              </Button>
              <div className="space-y-3">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
