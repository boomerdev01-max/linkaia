"use client";
// src/components/lives/LiveTicketGate.tsx
// Affiche un paywall si le live est payant et que l'user n'a pas de ticket
// Gère l'achat du ticket avec débit L-Gems et redirection vers la room

interface LiveTicketGateProps {
  liveTitle: string;
  ticketPriceLgems: number;
  lgemsBalance: number;
  freeMinutesLeft?: number;
  onPurchase: () => Promise<void>;
  onCancel: () => void;
}

export function LiveTicketGate({
  liveTitle,
  ticketPriceLgems,
  lgemsBalance,
  freeMinutesLeft,
  onPurchase,
  onCancel,
}: LiveTicketGateProps) {
  const canAfford = lgemsBalance >= ticketPriceLgems;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0d1117, #0a0e1a)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Gradient header */}
        <div
          className="relative h-28 flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)",
          }}
        >
          <span
            className="text-5xl"
            style={{ filter: "drop-shadow(0 0 16px rgba(245,158,11,0.6))" }}
          >
            🎟️
          </span>
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center bottom, rgba(245,158,11,0.15) 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-1">
              Live privé
            </p>
            <h2 className="text-xl font-bold text-white leading-snug">
              {liveTitle}
            </h2>
          </div>

          {freeMinutesLeft !== undefined && freeMinutesLeft > 0 && (
            <div
              className="rounded-2xl p-3 text-center text-sm"
              style={{
                background: "rgba(52,211,153,0.1)",
                border: "1px solid rgba(52,211,153,0.2)",
                color: "#34d399",
              }}
            >
              ⏱ {freeMinutesLeft} minute{freeMinutesLeft > 1 ? "s" : ""}{" "}
              gratuites restantes
            </div>
          )}

          {/* Prix ticket */}
          <div
            className="rounded-2xl p-4 flex items-center justify-between"
            style={{
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.2)",
            }}
          >
            <div>
              <p className="text-sm text-white/60">Ticket d'accès</p>
              <p className="text-2xl font-bold text-yellow-400">
                {ticketPriceLgems.toLocaleString()}
                <span className="text-sm font-normal text-yellow-400/60 ml-1">
                  L-Gems
                </span>
              </p>
            </div>
            <span className="text-4xl">💎</span>
          </div>

          {/* Solde */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/40">Votre solde</span>
            <span
              className={
                canAfford
                  ? "text-yellow-400 font-medium"
                  : "text-red-400 font-medium"
              }
            >
              {lgemsBalance.toLocaleString()} L-Gems
            </span>
          </div>

          {!canAfford && (
            <p className="text-center text-sm text-red-400/80">
              Solde insuffisant — rechargez vos L-Gems
            </p>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-1">
            <button
              onClick={onPurchase}
              disabled={!canAfford}
              className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm transition-all duration-200 active:scale-95"
              style={{
                background: canAfford
                  ? "linear-gradient(135deg, #f59e0b, #ea580c)"
                  : "rgba(255,255,255,0.06)",
                color: canAfford ? "white" : "rgba(255,255,255,0.3)",
                boxShadow: canAfford
                  ? "0 4px 24px rgba(245,158,11,0.35)"
                  : "none",
                cursor: canAfford ? "pointer" : "not-allowed",
              }}
            >
              {canAfford ? "Acheter le ticket" : "Recharger mes L-Gems"}
            </button>

            <button
              onClick={onCancel}
              className="w-full py-3 rounded-2xl text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
