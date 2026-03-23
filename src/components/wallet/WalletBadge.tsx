"use client";
// src/components/wallet/WalletBadge.tsx
// Badge compact affichant le solde L-Gems — à insérer dans Header ou LeftSidebar.
// Cliquable → redirige vers /wallet

import Link from "next/link";
import { useWalletBalance } from "@/hooks/useWalletBalance";

interface WalletBadgeProps {
  /** "compact" = icône + chiffre sur une ligne (pour Header)
   *  "full"    = avec label "L-Gems" (pour Sidebar) */
  variant?: "compact" | "full";
}

export function WalletBadge({ variant = "compact" }: WalletBadgeProps) {
  const { balance, loading } = useWalletBalance();

  if (variant === "compact") {
    return (
      <Link
        href="/wallet"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
        style={{
          background: "rgba(245,158,11,0.12)",
          border: "1px solid rgba(245,158,11,0.3)",
          color: "#f59e0b",
          textDecoration: "none",
        }}
        title="Mon wallet — Recharger mes L-Gems"
      >
        <span>💎</span>
        <span>
          {loading ? "…" : (balance?.lgemsBalance ?? 0).toLocaleString()}
        </span>
      </Link>
    );
  }

  // Variant "full" — pour sidebar
  return (
    <Link
      href="/wallet"
      className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all hover:opacity-80"
      style={{
        background: "rgba(245,158,11,0.08)",
        border: "1px solid rgba(245,158,11,0.2)",
        textDecoration: "none",
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">💎</span>
        <div>
          <p className="text-xs text-yellow-500/60 leading-none mb-0.5">
            L-Gems
          </p>
          <p className="text-sm font-bold text-yellow-400 leading-none">
            {loading ? "…" : (balance?.lgemsBalance ?? 0).toLocaleString()}
          </p>
        </div>
      </div>
      <span className="text-xs text-yellow-500/50">Recharger →</span>
    </Link>
  );
}
