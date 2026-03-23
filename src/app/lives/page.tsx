// src/app/lives/page.tsx
// Page liste des lives actifs + bouton "Démarrer un live"

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import Header from "@/components/home/Header";
import LeftSidebar from "@/components/home/LeftSidebar";

export const metadata: Metadata = {
  title: "Lives · Linkaïa",
  description: "Rejoignez les lives en cours ou démarrez le vôtre",
};

export const revalidate = 15; // rafraîchi toutes les 15s en ISR

export default async function LivesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) redirect("/signin");

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      profil: { select: { pseudo: true, profilePhotoUrl: true } },
    },
  });

  if (!user) redirect("/signin");

  const formattedUser = {
    id: user.id,
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    pseudo: user.profil?.pseudo ?? user.prenom,
    image: user.profil?.profilePhotoUrl ?? null,
  };

  // Récupérer les lives actifs
  const lives = await prisma.live.findMany({
    where: { status: { in: ["waiting", "live"] } },
    orderBy: [{ status: "desc" }, { createdAt: "desc" }],
    take: 30,
    include: {
      host: {
        select: {
          id: true,
          prenom: true,
          nom: true,
          profil: { select: { pseudo: true, profilePhotoUrl: true } },
        },
      },
      _count: { select: { viewers: true } },
    },
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header user={formattedUser} />

      <div className="flex pt-16 justify-center">
        <div
          className="hidden md:block fixed left-0 top-16 bottom-0"
          style={{ width: "282px" }}
        >
          <LeftSidebar user={formattedUser} />
        </div>

        <main
          className="w-full md:ml-70.5 min-h-[calc(100vh-64px)] px-4 py-6"
          style={{ maxWidth: "900px" }}
        >
          {/* En-tête */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Lives en cours
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {lives.length > 0
                  ? `${lives.length} live${lives.length > 1 ? "s" : ""} actif${lives.length > 1 ? "s" : ""}`
                  : "Aucun live en cours pour le moment"}
              </p>
            </div>

            {/* Bouton démarrer un live */}
            <Link
              href="/lives/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                boxShadow: "0 4px 16px rgba(239,68,68,0.35)",
              }}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Démarrer un live
            </Link>
          </div>

          {/* Grille lives */}
          {lives.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lives.map((live) => {
                const hostName =
                  live.host.profil?.pseudo ??
                  `${live.host.prenom} ${live.host.nom}`;
                const isLive = live.status === "live";

                return (
                  <Link
                    key={live.id}
                    href={`/lives/${live.id}`}
                    className="group block rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                    style={{
                      background: "rgba(0,0,0,0.85)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {/* Thumbnail placeholder */}
                    <div
                      className="relative h-36 flex items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)",
                      }}
                    >
                      {/* Status badge */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
                        style={{ background: isLive ? "#ef4444" : "rgba(0,0,0,0.5)" }}
                      >
                        {isLive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        )}
                        {isLive ? "LIVE" : "En attente"}
                      </div>

                      {/* Viewer count */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-white/80"
                        style={{ background: "rgba(0,0,0,0.5)" }}
                      >
                        👁 {live._count.viewers}
                      </div>

                      {/* Type badge */}
                      {live.type !== "live" && (
                        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                          style={{ background: "rgba(79,70,229,0.7)" }}
                        >
                          {live.type === "webinar" ? "Webinaire" : "Speed Dating"}
                        </div>
                      )}

                      {/* Icon central */}
                      <span className="text-4xl opacity-40">📡</span>
                    </div>

                    {/* Infos */}
                    <div className="p-3 space-y-2">
                      <p className="text-white text-sm font-semibold line-clamp-1 group-hover:text-yellow-300 transition-colors">
                        {live.title}
                      </p>

                      <div className="flex items-center gap-2">
                        {live.host.profil?.profilePhotoUrl ? (
                          <img
                            src={live.host.profil.profilePhotoUrl}
                            alt={hostName}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-yellow-400/20 flex items-center justify-center text-[10px] text-yellow-400">
                            {hostName[0]}
                          </div>
                        )}
                        <span className="text-xs text-white/50">{hostName}</span>
                      </div>

                      {/* Prix */}
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                          style={
                            live.isFree
                              ? { background: "rgba(52,211,153,0.15)", color: "#34d399" }
                              : { background: "rgba(245,158,11,0.15)", color: "#f59e0b" }
                          }
                        >
                          {live.isFree
                            ? "Gratuit"
                            : `${live.ticketPriceLgems} L-Gems`}
                        </span>
                        <span className="text-[11px] text-white/30">
                          Rejoindre →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 rounded-3xl text-center"
      style={{
        background: "rgba(0,0,0,0.04)",
        border: "1px dashed rgba(0,0,0,0.1)",
      }}
    >
      <span className="text-5xl mb-4">📡</span>
      <p className="text-gray-600 dark:text-gray-400 font-medium">
        Aucun live en cours
      </p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-6">
        Soyez le premier à démarrer un live !
      </p>
      <Link
        href="/lives/new"
        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
      >
        Démarrer un live
      </Link>
    </div>
  );
}