// src/lib/stripe-lgems.ts
// ─────────────────────────────────────────────────────────────────────────────
// Gestion des achats de packs L-Gems via Stripe
//
// DIFFÉRENCE vs stripe-club.ts (abonnements) :
//   - Club LWB = Checkout Session + mode "subscription" (récurrent)
//   - L-Gems   = Payment Intent   + mode "payment"      (paiement unique)
//
// On utilise Payment Intent pour garder l'UI de paiement intégrée dans l'app
// (page /wallet/recharge avec Stripe Elements) plutôt que de rediriger vers
// une page Stripe externe. C'est plus fluide, comme dans les jeux mobiles.
// ─────────────────────────────────────────────────────────────────────────────

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// DÉFINITION DES PACKS L-GEMS
// Ces valeurs DOIVENT correspondre aux produits créés dans le dashboard Stripe
// Voir le guide de création des produits dans le README ci-dessous
// ─────────────────────────────────────────────────────────────────────────────

export const LGEMS_PACKS = {
  starter_100: {
    code: "starter_100",
    name: "Starter",
    lgemsAmount: 100,
    bonusLgems: 0,
    totalLgems: 100, // lgemsAmount + bonusLgems
    priceEur: 0.99,
    priceXof: 650,
    stripePriceId: process.env.STRIPE_LGEMS_STARTER_PRICE_ID!,
    isFeatured: false,
    description: "Parfait pour débuter",
    badgeColor: "gray",
  },
  popular_500: {
    code: "popular_500",
    name: "Populaire",
    lgemsAmount: 500,
    bonusLgems: 50,
    totalLgems: 550,
    priceEur: 4.99,
    priceXof: 3_250,
    stripePriceId: process.env.STRIPE_LGEMS_POPULAR_PRICE_ID!,
    isFeatured: true, // badge "Le plus populaire"
    description: "+50 L-Gems offerts",
    badgeColor: "teal",
  },
  pro_1000: {
    code: "pro_1000",
    name: "Pro",
    lgemsAmount: 1000,
    bonusLgems: 150,
    totalLgems: 1150,
    priceEur: 9.99,
    priceXof: 6_500,
    stripePriceId: process.env.STRIPE_LGEMS_PRO_PRICE_ID!,
    isFeatured: false,
    description: "+150 L-Gems offerts",
    badgeColor: "blue",
  },
  elite_5000: {
    code: "elite_5000",
    name: "Élite",
    lgemsAmount: 5000,
    bonusLgems: 1000,
    totalLgems: 6000,
    priceEur: 44.99,
    priceXof: 29_250,
    stripePriceId: process.env.STRIPE_LGEMS_ELITE_PRICE_ID!,
    isFeatured: false,
    description: "+1000 L-Gems offerts",
    badgeColor: "gold",
  },
} as const;

export type LGemsPackCode = keyof typeof LGEMS_PACKS;

// ─────────────────────────────────────────────────────────────────────────────
// CRÉATION DU PAYMENT INTENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crée un PaymentIntent Stripe pour l'achat d'un pack L-Gems.
 *
 * Flux complet :
 * 1. Client appelle POST /api/wallet/purchase avec { packCode }
 * 2. Cette fonction crée le PaymentIntent et retourne le client_secret
 * 3. Le front utilise Stripe.js + client_secret pour afficher le formulaire
 * 4. L'utilisateur entre sa carte → Stripe confirme le paiement
 * 5. Stripe envoie l'événement payment_intent.succeeded au webhook
 * 6. Le webhook crédite le wallet (voir src/app/api/wallet/webhook/route.ts)
 *
 * IMPORTANT : Les L-Gems sont crédités UNIQUEMENT via le webhook,
 * jamais directement après la réponse de cette fonction.
 * Cela garantit que seuls les paiements réellement confirmés créditent le wallet.
 */
export async function createLGemsPurchaseIntent(
  userId: string,
  packCode: LGemsPackCode,
  currency: "eur" | "xof" = "eur"
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const pack = LGEMS_PACKS[packCode];
  if (!pack) throw new Error(`Pack L-Gems inconnu : ${packCode}`);

  // Stripe veut des centimes (ex: 0.99€ → 99 centimes)
  // XOF est une devise sans décimales (Stripe accepte les entiers directement)
  const amount =
    currency === "eur"
      ? Math.round(pack.priceEur * 100)
      : Math.round(pack.priceXof);

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    payment_method_types: ["card"],
    // Ces métadonnées sont lues par le webhook pour créditer le bon wallet
    metadata: {
      type: "lgems_purchase", // CRITIQUE : distingue ce type des abonnements
      userId,
      packCode,
      lgemsToCredit: String(pack.totalLgems), // inclut les bonus
      priceEur: String(pack.priceEur),
    },
    description: `Achat ${pack.name} — ${pack.totalLgems} L-Gems Linkaïa`,
    // Capture automatique (pas besoin d'une étape de capture manuelle)
    capture_method: "automatic",
  });

  if (!paymentIntent.client_secret) {
    throw new Error("Stripe n'a pas retourné de client_secret");
  }

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Récupère ou recrée le client_secret d'un PaymentIntent existant.
 * Utile si l'utilisateur ferme la page et revient sur le formulaire.
 */
export async function getExistingPaymentIntent(
  paymentIntentId: string
): Promise<string | null> {
  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    // Ne retourner le secret que si le paiement n'est pas encore complété
    if (intent.status === "requires_payment_method" || intent.status === "requires_confirmation") {
      return intent.client_secret;
    }
    return null;
  } catch {
    return null;
  }
}