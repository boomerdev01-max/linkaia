// src/components/suggestions/UpgradeBanners.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Lock, TrendingUp } from "lucide-react";
import Link from "next/link";

interface UpgradeBannersProps {
  userLevel: string;
  hiddenGoodMatches: number;
  hiddenPerfectMatches: number;
}

export function UpgradeBanners({
  userLevel,
  hiddenGoodMatches,
  hiddenPerfectMatches,
}: UpgradeBannersProps) {
  return (
    <div className="space-y-6 mb-8">
      {/* Banner VIP (pour users FREE avec matchs 51-90%) */}
      {userLevel === "free" && hiddenGoodMatches > 0 && (
        <Card className="relative overflow-hidden border-2 border-[#C0C0C0] bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-[#C0C0C0]/20 to-transparent rounded-full -mr-32 -mt-32" />

          <div className="relative p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="shrink-0">
              <div className="w-20 h-20 bg-linear-to-br from-[#C0C0C0] to-gray-400 rounded-full flex items-center justify-center shadow-xl">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <Crown className="w-6 h-6 text-[#C0C0C0]" />
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  Passez VIP
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                <strong className="text-[#C0C0C0]">
                  {hiddenGoodMatches} profil{hiddenGoodMatches > 1 ? "s" : ""} compatible
                  {hiddenGoodMatches > 1 ? "s" : ""} (51-90%)
                </strong>{" "}
                vous attendent !
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C0C0C0]" />
                  <span>Jusqu'à 90% de compatibilité</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#C0C0C0]" />
                  <span>Messages illimités</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#C0C0C0]" />
                  <span>50 suggestions/jour</span>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <Button
                asChild
                size="lg"
                className="bg-linear-to-r from-[#C0C0C0] to-gray-400 hover:opacity-90 text-white font-bold px-8"
              >
                <Link href="/pricing">Passer VIP</Link>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Banner PLATINUM (pour users FREE & VIP avec matchs 90-100%) */}
      {(userLevel === "free" || userLevel === "vip") && hiddenPerfectMatches > 0 && (
        <Card className="relative overflow-hidden border-2 border-[#FFD700] bg-linear-to-br from-amber-50 to-yellow-100 dark:from-yellow-900/20 dark:to-orange-900/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-[#FFD700]/30 to-transparent rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-linear-to-tr from-[#FFD700]/20 to-transparent rounded-full -ml-24 -mb-24" />

          <div className="relative p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="shrink-0">
              <div className="w-20 h-20 bg-linear-to-br from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center shadow-xl animate-pulse">
                <Crown className="w-10 h-10 text-white" fill="white" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <Sparkles className="w-6 h-6 text-[#FFD700]" />
                <h3 className="text-2xl font-bold bg-linear-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                  Passez Platinum
                </h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">
                <strong className="text-[#FFD700]">
                  {hiddenPerfectMatches} Perfect Match{hiddenPerfectMatches > 1 ? "es" : ""}{" "}
                  (90-100%)
                </strong>{" "}
                vous correspondent parfaitement !
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FFD700]" />
                  <span>Compatibilité jusqu'à 100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-[#FFD700]" />
                  <span>Badge Platinum exclusif</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#FFD700]" />
                  <span>Suggestions illimitées</span>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <Button
                asChild
                size="lg"
                className="bg-linear-to-r from-[#FFD700] to-[#FFA500] hover:opacity-90 text-white font-bold px-8 shadow-xl"
              >
                <Link href="/pricing">Passer Platinum</Link>
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}