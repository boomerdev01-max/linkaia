"use client";
// src/app/lives/new/page.tsx
// Formulaire de création d'un live — redirige vers /lives/[id] après création

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewLivePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    type: "live" as "live" | "webinar" | "speed_dating",
    isFree: true,
    ticketPriceLgems: 50,
    freeMinutes: 0,
    honorSeatEnabled: false,
    honorSeatPrice: 100,
    honorSeatDuration: 30,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!form.title.trim()) {
      setError("Le titre est requis");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/lives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la création");
        return;
      }

      // Rediriger directement vers la live room
      router.push(`/lives/${data.live.id}`);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #0d1117 0%, #0a0e1a 100%)",
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-6 space-y-5"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-white/40 hover:text-white/80 transition-colors"
          >
            ←
          </button>
          <h1 className="text-white text-lg font-bold">Démarrer un live</h1>
        </div>

        {/* Titre */}
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 uppercase tracking-wider">
            Titre *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ex: Discussion interculturelle en live !"
            maxLength={80}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 uppercase tracking-wider">
            Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["live", "webinar", "speed_dating"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setForm({ ...form, type: t })}
                className="py-2.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background:
                    form.type === t
                      ? "rgba(239,68,68,0.25)"
                      : "rgba(255,255,255,0.04)",
                  border:
                    form.type === t
                      ? "1px solid rgba(239,68,68,0.5)"
                      : "1px solid rgba(255,255,255,0.06)",
                  color: form.type === t ? "#fca5a5" : "rgba(255,255,255,0.4)",
                }}
              >
                {t === "live"
                  ? "🎥 Live"
                  : t === "webinar"
                    ? "🎓 Webinaire"
                    : "💘 Speed Dating"}
              </button>
            ))}
          </div>
        </div>

        {/* Accès */}
        <div className="space-y-3">
          <label className="text-xs text-white/50 uppercase tracking-wider">
            Accès
          </label>
          <div className="flex gap-2">
            {[true, false].map((isFree) => (
              <button
                key={String(isFree)}
                onClick={() => setForm({ ...form, isFree })}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background:
                    form.isFree === isFree
                      ? isFree
                        ? "rgba(52,211,153,0.2)"
                        : "rgba(245,158,11,0.2)"
                      : "rgba(255,255,255,0.04)",
                  border:
                    form.isFree === isFree
                      ? isFree
                        ? "1px solid rgba(52,211,153,0.4)"
                        : "1px solid rgba(245,158,11,0.4)"
                      : "1px solid rgba(255,255,255,0.06)",
                  color:
                    form.isFree === isFree
                      ? isFree
                        ? "#34d399"
                        : "#f59e0b"
                      : "rgba(255,255,255,0.4)",
                }}
              >
                {isFree ? "🆓 Gratuit" : "🎟 Payant"}
              </button>
            ))}
          </div>

          {/* Prix ticket si payant */}
          {!form.isFree && (
            <div className="space-y-1.5">
              <label className="text-xs text-white/50">
                Prix du ticket (L-Gems)
              </label>
              <input
                type="number"
                value={form.ticketPriceLgems}
                onChange={(e) =>
                  setForm({
                    ...form,
                    ticketPriceLgems: Math.max(1, +e.target.value),
                  })
                }
                min={1}
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
              <div className="flex gap-2">
                {[10, 50, 100, 200].map((v) => (
                  <button
                    key={v}
                    onClick={() => setForm({ ...form, ticketPriceLgems: v })}
                    className="flex-1 py-1.5 rounded-lg text-[11px] text-white/50 hover:text-white/80 transition-colors"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Siège d'honneur */}
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">
                🪑 Siège d'honneur
              </p>
              <p className="text-[11px] text-white/40 mt-0.5">
                Un viewer peut apparaître à l'écran avec toi
              </p>
            </div>
            <button
              onClick={() =>
                setForm({ ...form, honorSeatEnabled: !form.honorSeatEnabled })
              }
              className="relative w-10 h-5 rounded-full transition-colors"
              style={{
                background: form.honorSeatEnabled
                  ? "rgba(245,158,11,0.8)"
                  : "rgba(255,255,255,0.15)",
              }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                style={{
                  left: form.honorSeatEnabled ? "calc(100% - 18px)" : "2px",
                }}
              />
            </button>
          </div>

          {form.honorSeatEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-white/40">
                  Prix (L-Gems)
                </label>
                <input
                  type="number"
                  value={form.honorSeatPrice}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      honorSeatPrice: Math.max(1, +e.target.value),
                    })
                  }
                  className="w-full rounded-lg px-3 py-2 text-xs text-white outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-white/40">Durée (min)</label>
                <input
                  type="number"
                  value={form.honorSeatDuration}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      honorSeatDuration: Math.max(1, +e.target.value),
                    })
                  }
                  className="w-full rounded-lg px-3 py-2 text-xs text-white outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-center text-sm text-red-400">{error}</p>}

        {/* CTA */}
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm transition-all duration-200 active:scale-95"
          style={{
            background: loading
              ? "rgba(239,68,68,0.3)"
              : "linear-gradient(135deg, #ef4444, #dc2626)",
            boxShadow: loading ? "none" : "0 4px 20px rgba(239,68,68,0.4)",
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Création…
            </span>
          ) : (
            "🎬 Démarrer maintenant"
          )}
        </button>
      </div>
    </div>
  );
}
