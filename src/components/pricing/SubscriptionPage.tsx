"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  Calendar,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Subscription {
  id: string;
  startDate: string;
  endDate: string | null;
  status: string;
  autoRenew: boolean;
  subscriptionType: {
    code: string;
    name: string;
    description: string;
    color: string;
    features: Array<{
      featureKey: string;
      featureValue: string;
      description: string;
    }>;
  };
}

interface History {
  id: string;
  action: string;
  startDate: string;
  endDate: string | null;
  pricePaid: number;
  currencyCode: string;
  createdAt: string;
  subscriptionType: {
    name: string;
  };
}

interface Invoice {
  id: string;
  stripeInvoiceId: string;
  amountPaid: number;
  status: string;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  paidAt: string | null;
  createdAt: string;
  currency: {
    symbol: string;
    code: string;
  };
}

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch("/api/subscriptions/current");
      const data = await response.json();

      if (data.success) {
        setSubscription(data.subscription);
        setHistory(data.history);
        setInvoices(data.invoices);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Êtes-vous sûr de vouloir annuler votre abonnement ?")) {
      return;
    }

    setCancelling(true);
    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        alert("Votre abonnement sera annulé à la fin de la période en cours");
        fetchSubscriptionData();
      } else {
        alert("Erreur lors de l'annulation");
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Message de succès */}
      {success === "true" && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <p className="text-green-800 dark:text-green-200">
            🎉 Votre abonnement a été activé avec succès !
          </p>
        </div>
      )}

      {/* Message d'annulation */}
      {canceled === "true" && (
        <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          <p className="text-orange-800 dark:text-orange-200">
            Vous avez annulé le processus de paiement.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mon Abonnement</h1>
          <p className="text-muted-foreground">
            Gérez votre abonnement et vos factures
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push("/home")}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Button
            onClick={() => router.push("/pricing")}
            variant="default"
            size="sm"
          >
            Changer de plan
          </Button>
        </div>
      </div>

      {/* Card d'abonnement actuel */}
      {subscription ? (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {subscription.subscriptionType.name}
                </CardTitle>
                <CardDescription>
                  {subscription.subscriptionType.description}
                </CardDescription>
              </div>
              <Badge
                variant={
                  subscription.status === "active" ? "default" : "secondary"
                }
                className="text-sm"
                style={{
                  backgroundColor:
                    subscription.status === "active"
                      ? subscription.subscriptionType.color
                      : undefined,
                }}
              >
                {subscription.status === "active" ? "Actif" : "Inactif"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Date de début:</span>
                  <span className="font-medium">
                    {format(new Date(subscription.startDate), "dd MMMM yyyy", {
                      locale: fr,
                    })}
                  </span>
                </div>
                {subscription.endDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Date de fin:</span>
                    <span className="font-medium">
                      {format(new Date(subscription.endDate), "dd MMMM yyyy", {
                        locale: fr,
                      })}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Renouvellement automatique:
                  </span>
                  <span className="font-medium">
                    {subscription.autoRenew ? "Activé" : "Désactivé"}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Fonctionnalités incluses:</h4>
                <ul className="space-y-2">
                  {subscription.subscriptionType.features
                    .slice(0, 5)
                    .map((feature) => (
                      <li
                        key={feature.featureKey}
                        className="text-sm flex items-start gap-2"
                      >
                        <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature.description || feature.featureKey}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            {/* Bouton annulation pour les abonnements payants */}
            {subscription.subscriptionType.code !== "FREE" &&
              subscription.autoRenew && (
                <div className="mt-6 pt-6 border-t">
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
                    Votre abonnement restera actif jusqu'à la fin de la période
                    en cours
                  </p>
                </div>
              )}
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Aucun abonnement actif
            </h3>
            <p className="text-muted-foreground mb-6">
              Vous n'avez pas encore d'abonnement. Découvrez nos offres !
            </p>
            <Button onClick={() => router.push("/pricing")}>
              Voir les plans
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs Historique & Factures */}
      <Tabs defaultValue="history" className="space-y-6">
        <TabsList>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="invoices">
            Factures
            {invoices.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {invoices.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historique des abonnements</CardTitle>
              <CardDescription>
                Tous les changements de votre abonnement
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
                      <div>
                        <p className="font-medium">
                          {item.subscriptionType.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="capitalize">{item.action}</span> •{" "}
                          {format(new Date(item.createdAt), "dd MMM yyyy", {
                            locale: fr,
                          })}
                        </p>
                        {item.endDate && (
                          <p className="text-xs text-muted-foreground">
                            Période:{" "}
                            {format(new Date(item.startDate), "dd/MM/yyyy")} -{" "}
                            {format(new Date(item.endDate), "dd/MM/yyyy")}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {item.pricePaid > 0
                            ? `${item.pricePaid} ${item.currencyCode}`
                            : "Gratuit"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Mes factures</CardTitle>
              <CardDescription>
                Téléchargez vos factures de paiement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucune facture disponible
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Vos factures apparaîtront ici après vos paiements
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            Facture #{invoice.stripeInvoiceId.slice(-8)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {invoice.paidAt
                              ? format(
                                  new Date(invoice.paidAt),
                                  "dd MMMM yyyy",
                                  { locale: fr },
                                )
                              : "En attente"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">
                            {invoice.currency.symbol}
                            {invoice.amountPaid.toFixed(2)}
                          </p>
                          <Badge
                            variant={
                              invoice.status === "paid"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {invoice.status === "paid"
                              ? "Payée"
                              : invoice.status}
                          </Badge>
                        </div>
                        {invoice.invoicePdf && (
                          <Button
                            onClick={() =>
                              window.open(invoice.invoicePdf!, "_blank")
                            }
                            variant="outline"
                            size="sm"
                          >
                            Télécharger
                          </Button>
                        )}
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
