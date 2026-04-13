// src/hooks/useMatching.ts
"use client";

import { useState, useCallback, useEffect } from "react";
import type { MatchResult } from "@/lib/matching";

export function useMatching() {
  const [matchs, setMatchs] = useState<MatchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [cursorHasMore, setCursorHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [computing, setComputing] = useState(false);

  // Charge le portefeuille de matchs déjà calculés
  const loadResults = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/matching/results?page=${targetPage}&pageSize=10`,
      );
      const data = await res.json();
      if (!data.success) return;

      setTotal(data.total);
      setCursorHasMore(data.cursorInfo.hasMore);

      if (targetPage === 1) {
        setMatchs(data.matchs);
      } else {
        setMatchs((prev) => [...prev, ...data.matchs]);
      }

      setHasMore(data.hasMore);
      setPage(targetPage);
    } catch (err) {
      console.error("Erreur chargement matchs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Déclenche le calcul du prochain lot de 5 candidats
  const computeNextBatch = useCallback(async () => {
    if (computing) return;
    setComputing(true);
    try {
      const res = await fetch("/api/matching/compute", { method: "POST" });
      const data = await res.json();
      if (!data.success) return;

      setCursorHasMore(data.hasMore);

      // Rafraîchir la page 1 des résultats après le calcul
      await loadResults(1);
    } catch (err) {
      console.error("Erreur calcul matching:", err);
    } finally {
      setComputing(false);
    }
  }, [computing, loadResults]);

  // Charge la page suivante du portefeuille
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    await loadResults(page + 1);
  }, [loading, hasMore, page, loadResults]);

  // Chargement initial
  useEffect(() => {
    loadResults(1);
  }, []);

  return {
    matchs,
    total,
    loading,
    computing,
    hasMore: hasMore || cursorHasMore,
    loadMore,
    computeNextBatch,
    refresh: () => loadResults(1),
  };
}
