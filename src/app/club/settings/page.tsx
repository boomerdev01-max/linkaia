// src/app/club/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Crown,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  FileText,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

interface HistoryItem {
  id: string;
  action: string;
  startDate: string;
  endDate: string | null;
  pricePaid: number;
  currencyCode: string;
  period: string;
  createdAt: string;
}

export default function ClubSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [subscription, setSubscription] = useState<ClubSubscription | null>(
    null,
  );
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch("/api/club/current");
      const data = await response.json();

      if (data.success) {
        setSubscription(data.subscription);
        setHistory(data.history);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir annuler votre abonnement au Club LWB ?",
      )
    ) {
      return;
    }

    setCancelling(true);
    try {
      const response = await fetch("/api/club/cancel", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        alert("Votre abonnement sera annulé à la fin de la période en cours");
        fetchSubscriptionData();
      } else {
        alert(data.error || "Erreur lors de l'annulation");
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      alert("Une erreur est survenue");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F4C5C]" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Aucun abonnement Club LWB
            </h3>
            <p className="text-muted-foreground mb-6">
              Vous n'avez pas encore souscrit au Club fermé LWB.
            </p>
            <Button onClick={() => router.push("/club/checkout")}>
              Rejoindre le Club
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Crown className="w-8 h-8 text-[#0F4C5C]" />
            Mon Abonnement Club LWB
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre abonnement et votre historique
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push("/club")}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au Club
          </Button>
        </div>
      </div>

      {/* Subscription Card */}
      <Card className="mb-8 border-[#0F4C5C]/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[#0F4C5C]/5 to-[#0A3A47]/5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                Abonnement{" "}
                {subscription.period === "yearly" ? "Annuel" : "Mensuel"}
              </CardTitle>
              <CardDescription className="text-base">
                {subscription.period === "yearly"
                  ? "126 000 FCFA / an"
                  : "10 500 FCFA / mois"}
              </CardDescription>
            </div>
            <Badge
              className={
                subscription.status === "active"
                  ? "bg-green-500"
                  : subscription.status === "cancelled"
                    ? "bg-orange-500"
                    : "bg-gray-500"
              }
            >
              {subscription.status === "active"
                ? "Actif"
                : subscription.status === "cancelled"
                  ? "Annulé"
                  : "Expiré"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">Date de début:</span>
                <p className="font-medium">
                  {format(new Date(subscription.startDate), "dd MMMM yyyy", {
                    locale: fr,
                  })}
                </p>
              </div>
            </div>

            {subscription.endDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Date de fin:</span>
                  <p className="font-medium">
                    {format(new Date(subscription.endDate), "dd MMMM yyyy", {
                      locale: fr,
                    })}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">Renouvellement:</span>
                <p className="font-medium">
                  {subscription.autoRenew ? "Automatique" : "Désactivé"}
                </p>
              </div>
            </div>
          </div>

          {/* Cancel Button */}
          {subscription.status === "active" && subscription.autoRenew && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                variant="destructive"
                size="sm"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Annulation...
                  </>
                ) : (
                  "Annuler l'abonnement"
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Votre accès restera actif jusqu'à la fin de la période en cours
              </p>
            </div>
          )}

          {subscription.status === "cancelled" && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Votre abonnement sera annulé le{" "}
                  {subscription.endDate &&
                    format(new Date(subscription.endDate), "dd MMMM yyyy", {
                      locale: fr,
                    })}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs History */}
      <Tabs defaultValue="history" className="space-y-6">
        <TabsList>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historique de l'abonnement</CardTitle>
              <CardDescription>
                Tous les événements liés à votre abonnement Club LWB
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucun historique disponible
                </p>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            item.action === "subscribed"
                              ? "bg-green-100 dark:bg-green-900/30"
                              : item.action === "cancelled"
                                ? "bg-orange-100 dark:bg-orange-900/30"
                                : item.action === "expired"
                                  ? "bg-gray-100 dark:bg-gray-800"
                                  : "bg-blue-100 dark:bg-blue-900/30"
                          }`}
                        >
                          {item.action === "subscribed" ? (
                            <CheckCircle
                              className={`w-5 h-5 ${
                                item.action === "subscribed"
                                  ? "text-green-600 dark:text-green-400"
                                  : ""
                              }`}
                            />
                          ) : (
                            <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {item.action === "subscribed"
                              ? "Souscription"
                              : item.action === "renewed"
                                ? "Renouvellement"
                                : item.action === "cancelled"
                                  ? "Annulation"
                                  : "Expiration"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(item.createdAt), "dd MMM yyyy", {
                              locale: fr,
                            })}{" "}
                            • {item.period === "yearly" ? "Annuel" : "Mensuel"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {item.pricePaid > 0
                            ? `${item.pricePaid} ${item.currencyCode}`
                            : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
