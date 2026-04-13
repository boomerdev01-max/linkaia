// src/components/suggestions/SuggestionsClient.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UpgradeBanners } from "@/components/suggestions/UpgradeBanners";
import {
  Loader2,
  Heart,
  MessageCircle,
  MapPin,
  Calendar,
  Sparkles,
  Crown,
  Lock,
  RefreshCw,
  Users,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

interface Suggestion {
  userId: string;
  nom: string;
  prenom: string;
  pseudo: string;
  age: number | null;
  location: string | null;
  photo: string | null;
  score: number;
  matchedCriteria: string[];
  totalCriteria: number;
  level: string;
  isPrestige: boolean;
}

interface SuggestionsClientProps {
  currentUser: {
    id: string;
    prenom: string;
    nom: string;
    pseudo: string;
    email: string;
    level: string;
    image?: string | null;
  };
}

export default function SuggestionsClient({
  currentUser,
}: SuggestionsClientProps) {
  // ── État principal : suggestions originales (/api/suggestions)
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [hiddenGoodMatches, setHiddenGoodMatches] = useState(0);
  const [hiddenPerfectMatches, setHiddenPerfectMatches] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // ── État matching par lots (/api/matching/compute + /api/matching/results)
  const [computing, setComputing] = useState(false);
  const [matchPage, setMatchPage] = useState(1);
  const [matchResults, setMatchResults] = useState<Suggestion[]>([]);
  const [matchHasMore, setMatchHasMore] = useState(false);
  const [matchCursorHasMore, setMatchCursorHasMore] = useState(true);
  const [matchTotal, setMatchTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const router = useRouter();

  // ── 1. Chargement initial : suggestions classiques (comportement inchangé)
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch("/api/suggestions?limit=20");
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Impossible de charger les suggestions");
        }
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setHiddenGoodMatches(data.hiddenGoodMatches || 0);
        setHiddenPerfectMatches(data.hiddenPerfectMatches || 0);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, []);

  // ── 2. Charger le portefeuille de matchs calculés
  const loadMatchResults = useCallback(async (page = 1, append = false) => {
    try {
      const res = await fetch(`/api/matching/results?page=${page}&pageSize=10`);
      const data = await res.json();
      if (!data.success) return;

      const newMatchs: Suggestion[] = data.matchs.map((m: any) => ({
        userId: m.userId,
        nom: m.nom,
        prenom: m.prenom,
        pseudo: m.pseudo ?? m.prenom,
        age: m.age,
        location: m.location,
        photo: m.photo,
        score: m.score,
        matchedCriteria: m.matchedCriteria ?? [],
        totalCriteria: m.totalCriteria,
        level: m.level,
        isPrestige: m.level === "prestige",
      }));

      setMatchTotal(data.total);
      setMatchHasMore(data.hasMore);
      setMatchCursorHasMore(data.cursorInfo?.hasMore ?? false);

      if (append) {
        setMatchResults((prev) => [...prev, ...newMatchs]);
      } else {
        setMatchResults(newMatchs);
      }
      setMatchPage(page);
    } catch (err) {
      console.error("Erreur chargement portefeuille matchs:", err);
    }
  }, []);

  // Charger le portefeuille au montage (matchs déjà calculés)
  useEffect(() => {
    loadMatchResults(1, false);
  }, [loadMatchResults]);

  // ── 3. Déclencher le calcul du prochain lot de 5
  const handleComputeNextBatch = async () => {
    if (computing) return;
    setComputing(true);
    try {
      const res = await fetch("/api/matching/compute", { method: "POST" });
      const data = await res.json();

      if (!data.success) {
        toast.error("Erreur lors du calcul des matchs");
        return;
      }

      if (data.cycleCompleted) {
        toast.success("Tour complet de la base terminé ! Cycle relancé.");
        setMatchCursorHasMore(false);
      } else {
        toast.success(
          `${data.computed} nouveau${data.computed > 1 ? "x" : ""} profil${data.computed > 1 ? "s" : ""} analysé${data.computed > 1 ? "s" : ""} !`,
        );
        setMatchCursorHasMore(data.hasMore);
      }

      // Rafraîchir le portefeuille depuis la page 1
      await loadMatchResults(1, false);
    } catch (err) {
      toast.error("Erreur réseau");
    } finally {
      setComputing(false);
    }
  };

  // ── 4. Charger plus de matchs (pagination portefeuille)
  const handleLoadMoreMatchs = async () => {
    if (loadingMore || !matchHasMore) return;
    setLoadingMore(true);
    await loadMatchResults(matchPage + 1, true);
    setLoadingMore(false);
  };

  // ── 5. Ouvrir une conversation
  const handleSendMessage = async (recipientId: string) => {
    try {
      const res = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Impossible d'ouvrir la conversation");
        return;
      }
      const data = await res.json();
      router.push(`/chat?conversationId=${data.conversationId}`);
    } catch {
      toast.error("Erreur réseau");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#0F4C5C]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative h-64 bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] overflow-hidden">
        <Image
          src="/images/cafeine.png"
          alt="Suggestions"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <div className="flex items-center gap-3 text-white">
            <Sparkles className="w-10 h-10" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Vos suggestions du jour
            </h1>
          </div>
          <p className="text-xl text-white/90 mt-2">
            {suggestions.length} profil{suggestions.length > 1 ? "s" : ""}{" "}
            compatible
            {suggestions.length > 1 ? "s" : ""}
          </p>
          {currentUser.level !== "platinum" && (
            <p className="text-sm text-white/70 mt-1">
              Niveau actuel :{" "}
              <strong className="uppercase">
                {currentUser.level === "free" ? "Gratuit" : currentUser.level}
              </strong>
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* Upgrade Banners */}
        <UpgradeBanners
          userLevel={currentUser.level}
          hiddenGoodMatches={hiddenGoodMatches}
          hiddenPerfectMatches={hiddenPerfectMatches}
        />

        {/* ── SECTION 1 : Suggestions classiques ── */}
        {error ? (
          <Card className="p-10 text-center bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <p className="text-yellow-800 dark:text-yellow-200 text-lg mb-6">
              {error}
            </p>
            <Button asChild className="bg-[#0F4C5C] hover:bg-[#0a3540]">
              <Link href="/onboarding/preferences/welcome">
                Ajuster mes préférences
              </Link>
            </Button>
          </Card>
        ) : suggestions.length === 0 ? (
          <Card className="p-16 text-center">
            <Heart className="w-20 h-20 mx-auto mb-6 text-gray-300 dark:text-gray-600" />
            <h3 className="text-2xl font-bold text-[#0F4C5C] dark:text-[#B88A4F] mb-4">
              Aucun profil pour le moment
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {currentUser.level === "free"
                ? "Passez VIP ou Platinum pour voir plus de profils compatibles !"
                : "Élargissez vos critères pour découvrir plus de personnes !"}
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild className="bg-[#0F4C5C] hover:bg-[#0a3540]">
                <Link href="/onboarding/preferences/welcome">
                  Modifier mes préférences
                </Link>
              </Button>
              {currentUser.level !== "platinum" && (
                <Button
                  asChild
                  variant="outline"
                  className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10"
                >
                  <Link href="/pricing">Voir les abonnements</Link>
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.userId}
                  suggestion={suggestion}
                  currentUserLevel={currentUser.level}
                  onSendMessage={() => handleSendMessage(suggestion.userId)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── SECTION 2 : Portefeuille de matchs par lots ── */}
        <section className="space-y-6">
          {/* En-tête section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#0F4C5C] dark:text-[#B88A4F] flex items-center gap-2">
                <Users className="w-6 h-6" />
                Portefeuille de matchs
              </h2>
              {matchTotal > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {matchTotal} profil{matchTotal > 1 ? "s" : ""} analysé
                  {matchTotal > 1 ? "s" : ""} au total
                </p>
              )}
            </div>

            {/* Bouton : Calculer le prochain lot */}
            <Button
              onClick={handleComputeNextBatch}
              disabled={computing}
              className="bg-[#0F4C5C] hover:bg-[#0a3540] gap-2 self-start sm:self-auto"
            >
              {computing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  {matchCursorHasMore
                    ? "Analyser 5 nouveaux profils"
                    : "Relancer l'analyse"}
                </>
              )}
            </Button>
          </div>

          {/* Grille des matchs calculés */}
          {matchResults.length === 0 ? (
            <Card className="p-10 text-center border-dashed border-2 border-[#0F4C5C]/20">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Aucun match analysé pour l'instant.
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Cliquez sur "Analyser 5 nouveaux profils" pour démarrer votre
                portefeuille de matchs.
              </p>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {matchResults.map((match) => (
                  <SuggestionCard
                    key={`match-${match.userId}`}
                    suggestion={match}
                    currentUserLevel={currentUser.level}
                    onSendMessage={() => handleSendMessage(match.userId)}
                  />
                ))}
              </div>

              {/* Pagination portefeuille */}
              {(matchHasMore || matchCursorHasMore) && (
                <div className="flex flex-col items-center gap-3 pt-4">
                  {matchHasMore && (
                    <Button
                      variant="outline"
                      onClick={handleLoadMoreMatchs}
                      disabled={loadingMore}
                      className="border-[#0F4C5C]/30 text-[#0F4C5C] hover:bg-[#0F4C5C]/5 gap-2"
                    >
                      {loadingMore ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      Voir plus de matchs ({matchTotal - matchResults.length}{" "}
                      restants)
                    </Button>
                  )}
                  {!matchHasMore && matchCursorHasMore && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
                      Cliquez sur "Analyser 5 nouveaux profils" pour enrichir
                      votre portefeuille.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

// ============================================
// SUGGESTION CARD — inchangée
// ============================================

function SuggestionCard({
  suggestion,
  currentUserLevel,
  onSendMessage,
}: {
  suggestion: Suggestion;
  currentUserLevel: string;
  onSendMessage: () => Promise<void>;
}) {
  const [isSending, setIsSending] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "from-emerald-500 to-teal-600";
    if (score >= 70) return "from-blue-500 to-[#0F4C5C]";
    if (score >= 50) return "from-amber-500 to-[#B88A4F]";
    return "from-gray-500 to-gray-600";
  };

  const handleMessage = async () => {
    if (isSending) return;
    setIsSending(true);
    await onSendMessage();
    setIsSending(false);
  };

  const isPerfectMatch = suggestion.score === 100;
  const isLocked = isPerfectMatch && currentUserLevel !== "platinum";

  return (
    <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 shadow-lg relative">
      <div className="relative h-80">
        {suggestion.photo ? (
          <Image
            src={suggestion.photo}
            alt={suggestion.prenom}
            fill
            className={`object-cover transition-transform duration-500 ${
              isLocked ? "blur-sm" : "group-hover:scale-105"
            }`}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-linear-to-br from-[#0F4C5C] to-[#B88A4F]">
            <span className="text-white text-6xl font-bold">
              {suggestion.prenom[0]}
              {suggestion.nom[0]}
            </span>
          </div>
        )}

        {isLocked && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 p-4">
            <Lock className="w-16 h-16 text-[#FFD700] mb-4" />
            <h4 className="text-white font-bold text-lg mb-2 text-center">
              Perfect Match 100%
            </h4>
            <p className="text-white/80 text-sm text-center mb-4">
              Passez Platinum pour découvrir ce profil parfait !
            </p>
            <Button
              asChild
              size="sm"
              className="bg-linear-to-r from-[#FFD700] to-[#FFA500] hover:opacity-90 text-white font-bold"
            >
              <Link href="/pricing">
                <Crown className="w-4 h-4 mr-2" />
                Passer Platinum
              </Link>
            </Button>
          </div>
        )}

        <div className="absolute top-4 right-4 z-20">
          <div
            className={`bg-linear-to-r ${getScoreColor(
              suggestion.score,
            )} text-white px-4 py-2 rounded-full font-bold shadow-xl flex items-center gap-1`}
          >
            <Sparkles className="w-4 h-4" />
            {suggestion.score}%
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-xl font-bold text-[#0F4C5C] dark:text-[#B88A4F] truncate">
            {suggestion.prenom} {suggestion.nom.charAt(0)}.
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            @{suggestion.pseudo}
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
          {suggestion.age && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-[#B88A4F]" />
              <span>{suggestion.age} ans</span>
            </div>
          )}
          {suggestion.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-[#B88A4F]" />
              <span className="truncate">
                {suggestion.location.split(",")[0]}
              </span>
            </div>
          )}
        </div>

        {suggestion.matchedCriteria &&
          suggestion.matchedCriteria.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {suggestion.matchedCriteria.slice(0, 4).map((c, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="bg-[#0F4C5C]/10 text-[#0F4C5C] dark:bg-[#B88A4F]/10 dark:text-[#B88A4F] text-xs"
                >
                  {c}
                </Badge>
              ))}
              {suggestion.matchedCriteria.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{suggestion.matchedCriteria.length - 4}
                </Badge>
              )}
            </div>
          )}

        <div className="flex gap-3 pt-3">
          {isLocked ? (
            <Button
              asChild
              className="flex-1 bg-linear-to-r from-[#FFD700] to-[#FFA500] hover:opacity-90 text-white"
            >
              <Link href="/pricing">
                <Crown className="w-4 h-4 mr-2" />
                Débloquer
              </Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="outline"
                className="flex-1 border-[#0F4C5C]/30 hover:bg-[#0F4C5C]/5"
              >
                <Link href={`/profile/${suggestion.userId}`}>
                  <Heart className="w-4 h-4 mr-2" />
                  Voir
                </Link>
              </Button>
              <Button
                onClick={handleMessage}
                disabled={isSending}
                className="flex-1 bg-[#0F4C5C] hover:bg-[#0a3540]"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
