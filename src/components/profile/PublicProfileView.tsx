// components/profile/PublicProfileView.tsx - VERSION COMPLÈTE AVEC REVIEWS & REPORTS
"use client";

import {
  Calendar,
  MapPin,
  Ruler,
  Scale,
  Briefcase,
  GraduationCap,
  Heart,
  Users,
  Globe,
  Coffee,
  Cigarette,
  Baby,
  Dog,
  Star,
  MessageCircle,
  UserPlus,
  Flag,
  Edit,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useProfileLike } from "@/hooks/useProfileLike";
import { useReviews } from "@/hooks/useReviews";
import { useReports } from "@/hooks/useReports";
import ReviewModal from "./ReviewModal";
import ReportModal from "./ReportModal";
import ReviewsSection from "./ReviewsSection";

interface PublicProfileViewProps {
  profile: any;
  age: number | null;
  currentUserId: string;
  currentUserName: string;
}

export default function PublicProfileView({
  profile,
  age,
  currentUserId,
  currentUserName,
}: PublicProfileViewProps) {
  const router = useRouter();
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  // Modals state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const user = profile.user;

  // 💙 Hook pour gérer les likes
  const {
    isLiked,
    likesCount,
    isLoading: isLikeLoading,
    toggleLike,
  } = useProfileLike(user.id);

  // ⭐ Hook pour gérer les avis
  const {
    reviews,
    stats,
    userReview,
    isLoading: isReviewsLoading,
    submitReview,
    deleteReview,
    refreshReviews,
  } = useReviews(user.id);

  // ⚠️ Hook pour gérer les signalements
  const { categories, submitReport } = useReports();

  // Group interests by category
  const interestsByCategory =
    profile.interests?.reduce((acc: any, pi: any) => {
      const categoryName = pi.interest.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(pi.interest);
      return acc;
    }, {}) || {};

  // Calcul de l'IMC
  const calculateBMI = () => {
    if (!profile.height || !profile.weight) return null;
    const heightInM = profile.height / 100;
    return (profile.weight / (heightInM * heightInM)).toFixed(1);
  };

  const bmi = calculateBMI();

  // Formater les valeurs pour l'affichage
  const formatValue = (value: string | null) => {
    if (!value) return "Non renseigné";
    if (value === "PREFER_NOT_TO_SAY") return "Préfère ne pas dire";

    const valueMap: Record<string, string> = {
      man: "Homme",
      woman: "Femme",
      "non-binary": "Non-binaire",
      hetero: "Hétérosexuel(le)",
      homo: "Homosexuel(le)",
      bi: "Bisexuel(le)",
      pan: "Pansexuel(le)",
      asexual: "Asexuel(le)",
      single: "Célibataire",
      couple: "En couple",
      complicated: "C'est compliqué",
      open: "Relation libre",
      never: "Jamais",
      sometimes: "Occasionnellement",
      regularly: "Régulièrement",
      socially: "En société",
      yes: "Oui",
      no: "Non",
      soon: "Bientôt",
      maybe: "Peut-être",
      "want-one": "En voudrait un",
      introvert: "Introverti(e)",
      extrovert: "Extraverti(e)",
      ambivert: "Ambiverti(e)",
      neutral: "Neutre",
      "very-light": "Très claire",
      light: "Claire",
      medium: "Moyenne",
      tanned: "Mate",
      brown: "Brun(e)",
      dark: "Foncée",
      "high-school": "Lycée",
      bachelor: "Licence",
      master: "Master",
      doctorate: "Doctorat",
    };

    return valueMap[value] || value;
  };

  // Démarrer une conversation
  const handleStartConversation = async () => {
    try {
      setIsCreatingConversation(true);

      const response = await fetch("/api/chat/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur");
      }

      const data = await response.json();
      router.push(`/chat?conversation=${data.conversation.id}`);
    } catch (error) {
      console.error("❌ Error starting conversation:", error);
      toast.error("Impossible de démarrer la conversation");
    } finally {
      setIsCreatingConversation(false);
    }
  };

  // Gérer la soumission d'un avis
  const handleReviewSubmit = async (rating: number, comment: string) => {
    await submitReview(rating, comment);
    setIsReviewModalOpen(false);
  };

  // Gérer la suppression d'un avis
  const handleDeleteReview = async () => {
    try {
      await deleteReview();
    } catch (error) {
      toast.error("Erreur lors de la suppression de l'avis");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec photo de couverture */}
      <div className="relative h-64 md:h-80 bg-linear-to-r from-[#0F4C5C] via-[#1A6B7A] to-[#B88A4F]">
        <div className="absolute inset-0 bg-black/10"></div>

        {/* Contenu du header */}
        <div className="relative container mx-auto px-4 h-full flex items-end pb-8">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
            {/* Photo de profil */}
            <div className="relative -mb-16 md:-mb-24">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-white bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] shadow-xl overflow-hidden">
                {profile.profilePhotoUrl ? (
                  <img
                    src={profile.profilePhotoUrl}
                    alt={`${user.prenom} ${user.nom}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white text-4xl md:text-5xl font-bold">
                      {user.prenom.charAt(0)}
                      {user.nom.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Informations basiques */}
            <div className="ml-0 md:ml-32 mt-20 md:mt-0 text-center md:text-left flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {user.prenom} {user.nom}
                </h1>
                {profile.pseudo && (
                  <span className="text-lg text-white/80">
                    @{profile.pseudo}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-white/90 justify-center md:justify-start">
                {age && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{age} ans</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.gender && (
                  <div className="flex items-center gap-1">
                    <span>•</span>
                    <span>{formatValue(profile.gender)}</span>
                  </div>
                )}
              </div>

              {/* ⭐ Affichage de la note moyenne */}
              {stats && stats.totalReviews > 0 && (
                <div className="flex items-center gap-2 mt-3 justify-center md:justify-start">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(stats.averageRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-white/40"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-white/90 text-sm">
                    {stats.averageRating} ({stats.totalReviews} avis)
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mt-4 md:mt-0 justify-center">
              {/* 💙 Bouton Like */}
              <button
                onClick={toggleLike}
                disabled={isLikeLoading}
                className={`inline-flex items-center gap-2 px-4 py-3 rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  isLiked
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-white/20 hover:bg-white/30 text-white"
                }`}
                title={isLiked ? "Ne plus aimer" : "J'aime"}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                <span className="font-medium">{likesCount}</span>
              </button>

              {/* Bouton Message */}
              <button
                onClick={handleStartConversation}
                disabled={isCreatingConversation}
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#0F4C5C] hover:bg-[#0F4C5C]/90 text-white rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageCircle className="w-5 h-5" />
                {isCreatingConversation ? "..." : "Message"}
              </button>

              {/* ⭐ Bouton Avis */}
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                title={userReview ? "Modifier mon avis" : "Laisser un avis"}
              >
                {userReview ? (
                  <>
                    <Edit className="w-5 h-5" />
                    <span className="hidden sm:inline">Modifier</span>
                  </>
                ) : (
                  <>
                    <Star className="w-5 h-5" />
                    <span className="hidden sm:inline">Avis</span>
                  </>
                )}
              </button>

              {/* ⚠️ Bouton Signaler */}
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-white rounded-lg transition-colors"
                title="Signaler ce profil"
              >
                <Flag className="w-5 h-5" />
                <span className="hidden sm:inline">Signaler</span>
              </button>

              {/* Bouton Ajouter en ami */}
              <button
                className="inline-flex items-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                title="Ajouter en ami"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-8 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne de gauche - Informations principales */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio */}
            {profile.bio && (
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Biographie
                </h2>
                <p className="text-gray-700 whitespace-pre-line">
                  {profile.bio}
                </p>
              </section>
            )}

            {/* Apparence physique */}
            {(profile.height || profile.weight || profile.skinTone) && (
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Apparence
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.height && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Ruler className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Taille</p>
                        <p className="font-medium">{profile.height} cm</p>
                      </div>
                    </div>
                  )}
                  {profile.weight && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                        <Scale className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Poids</p>
                        <p className="font-medium">{profile.weight} kg</p>
                      </div>
                    </div>
                  )}
                  {bmi && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                        <Star className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">IMC</p>
                        <p className="font-medium">{bmi}</p>
                      </div>
                    </div>
                  )}
                  {profile.skinTone && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                        <span className="w-5 h-5 rounded-full bg-amber-200"></span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Teint</p>
                        <p className="font-medium">
                          {formatValue(profile.skinTone)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Études & Travail */}
            {(profile.educationLevel ||
              profile.studyPlace ||
              profile.jobTitle) && (
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Études & Travail
                </h2>
                <div className="space-y-4">
                  {profile.educationLevel && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium">Niveau d'études</p>
                        <p className="text-gray-600">
                          {formatValue(profile.educationLevel)}
                        </p>
                        {profile.studyPlace && (
                          <p className="text-sm text-gray-500">
                            {profile.studyPlace}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {profile.jobTitle && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                        <Briefcase className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">Profession</p>
                        <p className="text-gray-600">{profile.jobTitle}</p>
                        {profile.companyName && (
                          <p className="text-sm text-gray-500">
                            {profile.companyName}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Centres d'intérêt */}
            {Object.keys(interestsByCategory).length > 0 && (
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Centres d'intérêt
                </h2>
                <div className="space-y-6">
                  {Object.entries(interestsByCategory).map(
                    ([category, interests]: [string, any]) => (
                      <div key={category}>
                        <h3 className="font-semibold text-gray-800 mb-2">
                          {category}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {interests.map((interest: any) => (
                            <span
                              key={interest.id}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-full text-sm hover:bg-gray-100 transition-colors"
                            >
                              <span>{interest.emoji}</span>
                              <span>{interest.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </section>
            )}

            {/* ⭐ Section Avis */}
            {!isReviewsLoading && (
              <ReviewsSection
                reviews={reviews}
                stats={stats}
                currentUserId={currentUserId}
                onDeleteReview={handleDeleteReview}
              />
            )}
          </div>

          {/* Colonne de droite - Informations secondaires */}
          <div className="space-y-8">
            {/* Orientation & Situation */}
            {(profile.sexualOrientation || profile.relationshipStatus) && (
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Orientation & Situation
                </h2>
                <div className="space-y-4">
                  {profile.sexualOrientation && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Orientation</p>
                        <p className="font-medium">
                          {formatValue(profile.sexualOrientation)}
                        </p>
                      </div>
                    </div>
                  )}
                  {profile.relationshipStatus && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                        <Users className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Situation</p>
                        <p className="font-medium">
                          {formatValue(profile.relationshipStatus)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Origines */}
            {(profile.countryOrigin || profile.nationalites?.length > 0) && (
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Origines
                </h2>
                <div className="space-y-3">
                  {profile.nationalites?.map((pn: any) => (
                    <div key={pn.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <span className="text-xl">{pn.nationality.flag}</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Nationalité {pn.order}
                        </p>
                        <p className="font-medium">{pn.nationality.nameFr}</p>
                      </div>
                    </div>
                  ))}
                  {profile.countryOrigin && (
                    <div className="flex items-center gap-3 mt-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Pays d'origine</p>
                        <p className="font-medium">{profile.countryOrigin}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Habitudes */}
            {(profile.smoker || profile.alcohol) && (
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Habitudes
                </h2>
                <div className="space-y-4">
                  {profile.smoker && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                        <Cigarette className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tabac</p>
                        <p className="font-medium">
                          {formatValue(profile.smoker)}
                        </p>
                      </div>
                    </div>
                  )}
                  {profile.alcohol && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                        <Coffee className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Alcool</p>
                        <p className="font-medium">
                          {formatValue(profile.alcohol)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Projet familial */}
            {(profile.hasChildren ||
              profile.wantsChildren ||
              profile.hasPets) && (
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Projet familial
                </h2>
                <div className="space-y-3">
                  {profile.hasChildren && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                        <Baby className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Enfants actuels</p>
                        <p className="font-medium">
                          {formatValue(profile.hasChildren)}
                        </p>
                      </div>
                    </div>
                  )}
                  {profile.wantsChildren && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-lime-50 flex items-center justify-center">
                        <Baby className="w-5 h-5 text-lime-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Envie d'enfants</p>
                        <p className="font-medium">
                          {formatValue(profile.wantsChildren)}
                        </p>
                      </div>
                    </div>
                  )}
                  {profile.hasPets && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                        <Dog className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Animaux de compagnie
                        </p>
                        <p className="font-medium">
                          {formatValue(profile.hasPets)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Personnalité & Convictions */}
            {(profile.personalityType ||
              profile.zodiacSign ||
              profile.religion) && (
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Personnalité & Convictions
                </h2>
                <div className="space-y-3">
                  {profile.personalityType && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                        <Users className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Type de personnalité
                        </p>
                        <p className="font-medium">
                          {formatValue(profile.personalityType)}
                        </p>
                      </div>
                    </div>
                  )}
                  {profile.zodiacSign && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                        <Star className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Signe du zodiaque
                        </p>
                        <p className="font-medium">
                          {formatValue(profile.zodiacSign)}
                        </p>
                      </div>
                    </div>
                  )}
                  {profile.religion && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <span className="text-lg">🕊️</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Religion</p>
                        <p className="font-medium">
                          {formatValue(profile.religion)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* ⭐ Modal Avis */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleReviewSubmit}
        existingReview={
          userReview
            ? { rating: userReview.rating, comment: userReview.comment }
            : null
        }
        profileName={profile.pseudo || `${user.prenom} ${user.nom}`}
      />

      {/* ⚠️ Modal Signalement */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        profileId={user.id}
        profileName={profile.pseudo || `${user.prenom} ${user.nom}`}
      />
    </div>
  );
}
