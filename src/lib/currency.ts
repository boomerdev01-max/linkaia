// lib/currency.ts

/**
 * 💱 Taux de change fixes (base: XOF)
 * À mettre à jour périodiquement ou connecter à une API de taux réels
 */
export const EXCHANGE_RATES = {
  XOF: 1, // Base
  EUR: 655.957, // 1 EUR = 655.957 XOF
  USD: 615.0, // 1 USD = 615 XOF (approximatif)
};

export type CurrencyCode = "XOF" | "EUR" | "USD";

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  XOF: "CFA",
  EUR: "€",
  USD: "$",
};

export const CURRENCY_NAMES: Record<CurrencyCode, string> = {
  XOF: "Franc CFA",
  EUR: "Euro",
  USD: "Dollar",
};

/**
 * Convertit un montant de XOF vers une autre devise
 */
export function convertFromXOF(
  amountXOF: number,
  targetCurrency: CurrencyCode,
): number {
  if (targetCurrency === "XOF") return amountXOF;
  return Math.round((amountXOF / EXCHANGE_RATES[targetCurrency]) * 100) / 100;
}

/**
 * Convertit un montant d'une devise vers XOF
 */
export function convertToXOF(
  amount: number,
  sourceCurrency: CurrencyCode,
): number {
  if (sourceCurrency === "XOF") return amount;
  return Math.round(amount * EXCHANGE_RATES[sourceCurrency]);
}

/**
 * Formate un montant avec le symbole de la devise
 */
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const symbol = CURRENCY_SYMBOLS[currency];

  if (currency === "XOF") {
    // Pas de décimales pour XOF
    return `${Math.round(amount)} ${symbol}`;
  }

  // 2 décimales pour EUR et USD
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Convertit tous les prix d'un plan vers une devise cible
 */
export function convertPlanPrices(
  priceMonthXOF: number,
  priceYearXOF: number,
  targetCurrency: CurrencyCode,
) {
  return {
    priceMonth: convertFromXOF(priceMonthXOF, targetCurrency),
    priceYear: convertFromXOF(priceYearXOF, targetCurrency),
    currency: targetCurrency,
    symbol: CURRENCY_SYMBOLS[targetCurrency],
  };
}
