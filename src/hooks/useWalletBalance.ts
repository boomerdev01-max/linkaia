"use client";
// src/hooks/useWalletBalance.ts
// Hook client — récupère le solde L-Gems + Diamonds et le maintient à jour.
// Utilisé dans Header, LeftSidebar, et toute page qui affiche le solde.
//
// Actualisation automatique :
//  - Au montage
//  - Toutes les 60 secondes (polling léger)
//  - Via la fonction `refresh()` exposée (à appeler après un achat / envoi de cadeau)

import { useState, useEffect, useCallback, useRef } from "react";

export interface WalletBalance {
  lgemsBalance: number;
  diamondsBalance: number;
}

interface UseWalletBalanceReturn {
  balance: WalletBalance | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const POLL_INTERVAL_MS = 60_000; // 60 secondes

export function useWalletBalance(): UseWalletBalanceReturn {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet/balance", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setBalance({
        lgemsBalance: data.lgemsBalance ?? data.data?.lgemsBalance ?? 0,
        diamondsBalance:
          data.diamondsBalance ?? data.data?.diamondsBalance ?? 0,
      });
    } catch {
      // silencieux — pas bloquant
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetch_();
  }, [fetch_]);

  useEffect(() => {
    fetch_();
    timerRef.current = setInterval(fetch_, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetch_]);

  return { balance, loading, refresh };
}
