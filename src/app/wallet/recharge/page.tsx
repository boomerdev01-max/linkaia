"use client";
// src/app/wallet/recharge/page.tsx

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface Pack {
  code: string;
  name: string;
  lgemsAmount: number;
  bonusLgems: number;
  totalLgems: number;
  priceEur: number;
  isFeatured?: boolean; // l'API retourne isFeatured, pas isPopular
}

// ── Formulaire Stripe ─────────────────────────────────────────────────────────
function CheckoutForm({
  pack,
  onSuccess,
  onCancel,
}: {
  pack: Pack;
  onSuccess: (newBalance: number) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"init" | "pay">("init");

  async function handleInit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/wallet/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packCode: pack.code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur paiement");

      // BUG #3 CORRIGÉ : l'API retourne { success, data: { clientSecret, ... } }
      const secret = data.data?.clientSecret ?? data.clientSecret;
      if (!secret) throw new Error("clientSecret manquant dans la réponse");

      setClientSecret(secret);
      setStep("pay");
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de la préparation du paiement");
    } finally {
      setLoading(false);
    }
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setLoading(true);
    setError(null);

    const card = elements.getElement(CardElement);
    if (!card) return;

    const { error: stripeError, paymentIntent } =
      await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

    if (stripeError) {
      setError(stripeError.message ?? "Paiement refusé");
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      // Attendre que le webhook crédite le wallet (~1.5s)
      await new Promise((r) => setTimeout(r, 1500));
      const balRes = await fetch("/api/wallet/balance");
      const balData = await balRes.json();
      // BUG #2 CORRIGÉ (dans onSuccess) : balance est dans data
      const newBalance =
        balData.data?.lgemsBalance ?? balData.lgemsBalance ?? 0;
      onSuccess(newBalance);
    }

    setLoading(false);
  }

  const totalLgems = pack.totalLgems ?? pack.lgemsAmount + pack.bonusLgems;

  return (
    <div className="space-y-4">
      {/* Récap pack */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.2)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">{pack.name}</p>
            <p className="text-2xl font-bold text-yellow-400 mt-0.5">
              {totalLgems.toLocaleString()}
              <span className="text-sm font-normal text-yellow-400/60 ml-1">L-Gems</span>
              {pack.bonusLgems > 0 && (
                <span
                  className="text-xs ml-2 px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: "rgba(52,211,153,0.2)", color: "#34d399" }}
                >
                  +{pack.bonusLgems} bonus
                </span>
              )}
            </p>
          </div>
          <p className="text-2xl font-bold text-white">{pack.priceEur}€</p>
        </div>
      </div>

      {step === "init" ? (
        <button
          onClick={handleInit}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm transition-all active:scale-95"
          style={{
            background: loading
              ? "rgba(245,158,11,0.3)"
              : "linear-gradient(135deg, #f59e0b, #ea580c)",
            boxShadow: loading ? "none" : "0 4px 20px rgba(245,158,11,0.35)",
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Préparation…
            </span>
          ) : (
            "Procéder au paiement"
          )}
        </button>
      ) : (
        <form onSubmit={handlePay} className="space-y-4">
          <div
            className="rounded-xl p-4"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <CardElement
              options={{
                hidePostalCode: true,
                style: {
                  base: {
                    fontSize: "15px",
                    color: "#ffffff",
                    fontFamily: "system-ui, sans-serif",
                    "::placeholder": { color: "rgba(255,255,255,0.3)" },
                    iconColor: "#f59e0b",
                  },
                  invalid: {
                    color: "#f87171",
                    iconColor: "#f87171",
                  },
                },
              }}
            />
          </div>

          {/* Hint carte de test — visible uniquement en dev */}
          {process.env.NODE_ENV === "development" && (
            <p className="text-xs text-white/25 text-center">
              Test : <span className="font-mono text-white/40">4242 4242 4242 4242</span>
              {" "}· date future · CVC 3 chiffres
            </p>
          )}

          {error && (
            <p className="text-center text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !stripe}
            className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm transition-all active:scale-95"
            style={{
              background: loading
                ? "rgba(245,158,11,0.3)"
                : "linear-gradient(135deg, #f59e0b, #ea580c)",
              boxShadow: loading ? "none" : "0 4px 20px rgba(245,158,11,0.35)",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Paiement en cours…
              </span>
            ) : (
              `Payer ${pack.priceEur}€`
            )}
          </button>
        </form>
      )}

      <button
        onClick={onCancel}
        className="w-full py-2.5 text-sm text-white/30 hover:text-white/60 transition-colors"
      >
        Annuler
      </button>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function WalletRechargePage() {
  const router = useRouter();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [selected, setSelected] = useState<Pack | null>(null);
  const [success, setSuccess] = useState<{
    pack: Pack;
    newBalance: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/wallet/packs").then((r) => r.json()),
      fetch("/api/wallet/balance").then((r) => r.json()),
    ])
      .then(([packsData, balData]) => {
        // BUG #1 CORRIGÉ : les deux APIs enveloppent dans { success, data: ... }
        const packList: Pack[] = packsData.data ?? packsData.packs ?? [];
        const lgems: number =
          balData.data?.lgemsBalance ??
          balData.lgemsBalance ??
          0;

        if (packList.length === 0) {
          setFetchError(
            "Aucun pack disponible. Vérifiez les variables d'environnement STRIPE_LGEMS_*_PRICE_ID dans .env.local"
          );
        }

        setPacks(packList);
        setBalance(lgems);
      })
      .catch(() =>
        setFetchError("Impossible de charger les packs. Réessayez.")
      )
      .finally(() => setLoading(false));
  }, []);

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "linear-gradient(135deg, #0d1117, #0a0e1a)" }}
      >
        <div className="text-center space-y-5 max-w-xs">
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl"
            style={{
              background: "rgba(52,211,153,0.15)",
              border: "1px solid rgba(52,211,153,0.3)",
            }}
          >
            ✅
          </div>
          <div>
            <p className="text-white text-xl font-bold">Recharge réussie !</p>
            <p className="text-white/50 text-sm mt-1">
              {(
                success.pack.totalLgems ??
                success.pack.lgemsAmount + success.pack.bonusLgems
              ).toLocaleString()}{" "}
              L-Gems ajoutés
            </p>
          </div>
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.2)",
            }}
          >
            <p className="text-yellow-400/60 text-xs mb-0.5">Nouveau solde</p>
            <p className="text-yellow-400 text-3xl font-bold">
              {success.newBalance.toLocaleString()}
              <span className="text-sm font-normal ml-1">L-Gems</span>
            </p>
          </div>
          <button
            onClick={() => router.push("/home")}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }}
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 flex flex-col items-center"
      style={{ background: "linear-gradient(135deg, #0d1117 0%, #0a0e1a 100%)" }}
    >
      <div className="w-full max-w-md space-y-6 pt-6 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-white/40 hover:text-white/80 transition-colors text-lg"
          >
            ←
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">Recharger mon wallet</h1>
            {balance !== null && (
              <p className="text-sm text-yellow-400/70 mt-0.5">
                Solde actuel : {balance.toLocaleString()} L-Gems
              </p>
            )}
          </div>
        </div>

        {/* Pack sélectionné → formulaire Stripe */}
        {selected ? (
          <div
            className="rounded-3xl p-6"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Elements stripe={stripePromise}>
              <CheckoutForm
                pack={selected}
                onSuccess={(newBalance) =>
                  setSuccess({ pack: selected, newBalance })
                }
                onCancel={() => setSelected(null)}
              />
            </Elements>
          </div>
        ) : (
          <>
            <p className="text-white/40 text-sm text-center">
              Choisissez un pack L-Gems pour recharger votre wallet
            </p>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin" />
              </div>
            ) : fetchError ? (
              <div
                className="rounded-2xl p-4 text-center text-sm"
                style={{
                  background: "rgba(248,113,113,0.1)",
                  border: "1px solid rgba(248,113,113,0.3)",
                  color: "#f87171",
                }}
              >
                {fetchError}
              </div>
            ) : (
              <div className="space-y-3">
                {packs.map((pack) => {
                  const total =
                    pack.totalLgems ?? pack.lgemsAmount + pack.bonusLgems;
                  const isPopular = pack.isFeatured;
                  return (
                    <button
                      key={pack.code}
                      onClick={() => setSelected(pack)}
                      className="w-full rounded-2xl p-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: isPopular
                          ? "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(234,88,12,0.08))"
                          : "rgba(255,255,255,0.04)",
                        border: isPopular
                          ? "1px solid rgba(245,158,11,0.4)"
                          : "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-semibold text-sm">
                              {pack.name}
                            </p>
                            {isPopular && (
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  background: "rgba(245,158,11,0.2)",
                                  color: "#f59e0b",
                                }}
                              >
                                POPULAIRE
                              </span>
                            )}
                          </div>
                          <p className="text-yellow-400 font-bold text-lg">
                            {total.toLocaleString()} L-Gems
                            {pack.bonusLgems > 0 && (
                              <span
                                className="text-xs font-medium ml-2 px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: "rgba(52,211,153,0.15)",
                                  color: "#34d399",
                                }}
                              >
                                +{pack.bonusLgems}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-xl font-bold">
                            {pack.priceEur}€
                          </p>
                          <p className="text-white/30 text-xs">
                            {((pack.priceEur / total) * 100).toFixed(2)}c/gem
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-center text-xs text-white/20">
              🔒 Paiement sécurisé par Stripe · Vos données bancaires ne sont
              jamais stockées
            </p>
          </>
        )}
      </div>
    </div>
  );
}