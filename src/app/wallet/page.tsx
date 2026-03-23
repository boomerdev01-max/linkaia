"use client";
// src/app/wallet/page.tsx
// Dashboard wallet complet : solde, Diamonds, historique des transactions
// Route protégée — authent vérifiée via API

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: "LGEMS" | "DIAMONDS";
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  referenceType: string | null;
  createdAt: string;
}

interface WalletData {
  lgemsBalance: number;
  diamondsBalance: number;
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  purchase: { label: "Achat L-Gems", icon: "💳", color: "#34d399" },
  gift_sent: { label: "Cadeau envoyé", icon: "🎁", color: "#f87171" },
  gift_received: { label: "Cadeau reçu", icon: "🎁", color: "#34d399" },
  live_ticket: { label: "Ticket live", icon: "🎟", color: "#f87171" },
  honor_seat: { label: "Siège d'honneur", icon: "🪑", color: "#f87171" },
  debit: { label: "Débit", icon: "➖", color: "#f87171" },
  credit: { label: "Crédit", icon: "➕", color: "#34d399" },
};

function txConfig(type: string) {
  return TYPE_CONFIG[type] ?? { label: type, icon: "💰", color: "#94a3b8" };
}

function isDebit(type: string) {
  return ["gift_sent", "live_ticket", "honor_seat", "debit"].includes(type);
}

// ── Composant principal ────────────────────────────────────────────────────────
export default function WalletPage() {
  const router = useRouter();
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "LGEMS" | "DIAMONDS">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [balRes, txRes] = await Promise.all([
        fetch("/api/wallet/balance"),
        fetch(
          `/api/wallet/transactions?page=${page}&pageSize=15${filter !== "all" ? `&currency=${filter}` : ""}`,
        ),
      ]);

      if (balRes.status === 401) {
        router.push("/signin");
        return;
      }

      const bal = await balRes.json();
      const tx = await txRes.json();

      setData({
        lgemsBalance: bal.lgemsBalance ?? bal.data?.lgemsBalance ?? 0,
        diamondsBalance: bal.diamondsBalance ?? bal.data?.diamondsBalance ?? 0,
        transactions: tx.transactions ?? tx.data?.transactions ?? [],
        total: tx.total ?? tx.data?.total ?? 0,
        page: tx.page ?? 1,
        pageSize: tx.pageSize ?? 15,
      });
    } catch {
      /* silencieux */
    } finally {
      setLoading(false);
    }
  }, [page, filter, router]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(160deg, #0d1117 0%, #0a0e1a 100%)",
      }}
    >
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-white/40 hover:text-white transition-colors text-lg"
            >
              ←
            </button>
            <h1 className="text-white text-xl font-bold">Mon Wallet</h1>
          </div>
          <Link
            href="/wallet/recharge"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #f59e0b, #ea580c)",
              boxShadow: "0 4px 16px rgba(245,158,11,0.3)",
            }}
          >
            + Recharger
          </Link>
        </div>

        {/* Cartes solde */}
        <div className="grid grid-cols-2 gap-3">
          {/* L-Gems */}
          <div
            className="rounded-3xl p-5 space-y-1"
            style={{
              background:
                "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,88,12,0.08))",
              border: "1px solid rgba(245,158,11,0.3)",
            }}
          >
            <p className="text-xs text-yellow-400/60 uppercase tracking-wider">
              L-Gems
            </p>
            <p className="text-3xl font-bold text-yellow-400">
              {loading ? "…" : (data?.lgemsBalance ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-yellow-400/40">Utilisables partout</p>
          </div>

          {/* Diamonds */}
          <div
            className="rounded-3xl p-5 space-y-1"
            style={{
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))",
              border: "1px solid rgba(99,102,241,0.3)",
            }}
          >
            <p className="text-xs text-indigo-400/60 uppercase tracking-wider">
              Diamonds
            </p>
            <p className="text-3xl font-bold text-indigo-400">
              {loading ? "…" : (data?.diamondsBalance ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-indigo-400/40">Gains créateur</p>
          </div>
        </div>

        {/* Accès rapides */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Recharger", href: "/wallet/recharge", icon: "💳" },
            { label: "Lives", href: "/lives", icon: "📡" },
            { label: "Mes stats", href: "/my-stats", icon: "📊" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-center transition-all hover:scale-[1.03]"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <span className="text-xl">{a.icon}</span>
              <span className="text-xs text-white/50">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* Historique */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold">Historique</h2>
            {/* Filtre */}
            <div className="flex gap-1.5">
              {(["all", "LGEMS", "DIAMONDS"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFilter(f);
                    setPage(1);
                  }}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                  style={{
                    background:
                      filter === f
                        ? "rgba(245,158,11,0.2)"
                        : "rgba(255,255,255,0.05)",
                    border:
                      filter === f
                        ? "1px solid rgba(245,158,11,0.4)"
                        : "1px solid rgba(255,255,255,0.06)",
                    color: filter === f ? "#f59e0b" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {f === "all" ? "Tout" : f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin" />
            </div>
          ) : data?.transactions.length === 0 ? (
            <div
              className="flex flex-col items-center py-12 rounded-2xl text-center"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px dashed rgba(255,255,255,0.08)",
              }}
            >
              <span className="text-4xl mb-3">💸</span>
              <p className="text-white/40 text-sm">
                Aucune transaction pour le moment
              </p>
              <Link
                href="/wallet/recharge"
                className="mt-4 text-xs text-yellow-400/70 hover:text-yellow-400 transition-colors"
              >
                Recharger mon wallet →
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {data?.transactions.map((tx) => {
                  const cfg = txConfig(tx.type);
                  const debit = isDebit(tx.type);
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {/* Icône */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                        style={{ background: `${cfg.color}18` }}
                      >
                        {cfg.icon}
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">
                          {cfg.label}
                        </p>
                        <p className="text-xs text-white/35 truncate">
                          {tx.description ?? "—"} ·{" "}
                          {new Date(tx.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {/* Montant */}
                      <div className="text-right shrink-0">
                        <p
                          className="text-sm font-bold"
                          style={{ color: debit ? "#f87171" : "#34d399" }}
                        >
                          {debit ? "−" : "+"}
                          {tx.amount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-white/30">
                          {tx.currency}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white transition-colors disabled:opacity-30"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    ←
                  </button>
                  <span className="text-xs text-white/30">
                    Page {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white transition-colors disabled:opacity-30"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
