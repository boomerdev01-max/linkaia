// components/profile/ProfileView.tsx
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
  Edit,
  Camera,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ProfileViewProps {
  profile: any;
  age: number | null;
  isOwnProfile: boolean;
  currentUserId: string;
}

// Composant Badge Premium
const PremiumBadge = ({ level }: { level: string }) => {
  if (level === "free") return null;

  const badgeConfig = {
    vip: {
      image: "/images/vipe.png",
      alt: "Badge VIP",
    },
    platinum: {
      image: "/images/platinium.jpg",
      alt: "Badge Platinum",
    },
    platinium: {
      image: "/images/platinium.jpg",
      alt: "Badge Platinum",
    },
    prestige: {
      image: "/images/platinium.jpg",
      alt: "Badge Prestige",
    },
  };

  const config = badgeConfig[level as keyof typeof badgeConfig];
  if (!config) return null;

  return (
    <span className="inline-flex items-center ml-2">
      <span className="relative w-6 h-6 rounded-full overflow-hidden border-2 border-white shadow-lg inline-block">
        <Image
          src={config.image}
          alt={config.alt}
          fill
          className="object-cover"
        />
      </span>
    </span>
  );
};

export default function ProfileView({
  profile,
  age,
  isOwnProfile,
  currentUserId,
}: ProfileViewProps) {
  const user = profile.user;

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec photo de couverture */}
      <div className="relative h-72 md:h-96 bg-linear-to-r from-[#0F4C5C] via-[#1A6B7A] to-[#B88A4F] overflow-hidden">
        {/* Overlay subtil */}
        <div className="absolute inset-0 bg-black/5"></div>
        
        {/* Pattern décoratif */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white/20 blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-40 h-40 rounded-full bg-white/20 blur-3xl"></div>
        </div>

        {/* Bouton Changer la photo de couverture (si profil personnel) */}
        {isOwnProfile && (
          <button className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-lg shadow-md transition-all flex items-center gap-2 text-sm font-medium">
            <Camera className="w-4 h-4" />
            Changer la photo de couverture
          </button>
        )}
      </div>

      {/* Section profil (photo + infos) - Positionnée en dessous de la couverture */}
      <div className="relative -mt-20 container mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Photo de profil */}
            <div className="relative -mt-24 md:-mt-28">
              <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-white bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] shadow-2xl overflow-hidden">
                {profile.profilePhotoUrl ? (
                  <Image
                    src={profile.profilePhotoUrl}
                    alt={`${user.prenom} ${user.nom}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white text-5xl md:text-6xl font-bold">
                      {user.prenom.charAt(0)}
                      {user.nom.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Badge premium sur la photo */}
              {user.level && user.level !== "free" && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                  <Image
                    src={
                      user.level === "vip"
                        ? "/images/vipe.png"
                        : "/images/platinium.jpg"
                    }
                    alt={`Badge ${user.level}`}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>

            {/* Informations principales */}
            <div className="flex-1 text-center md:text-left mt-4 md:mt-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                      {user.prenom} {user.nom}
                    </h1>
                    <PremiumBadge level={user.level} />
                  </div>
                  
                  {profile.pseudo && (
                    <p className="text-lg text-gray-600 mb-3">
                      @{profile.pseudo}
                    </p>
                  )}

                  {/* Infos rapides : âge, localisation, genre */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-700">
                    {age && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#0F4C5C]" />
                        <span className="font-medium">{age} ans</span>
                      </div>
                    )}
                    {profile.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#0F4C5C]" />
                        <span className="font-medium">{profile.location}</span>
                      </div>
                    )}
                    {profile.gender && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{formatValue(profile.gender)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bouton Modifier (si profil personnel) */}
                {isOwnProfile && (
                  <Link
                    href="/profile/edit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0F4C5C] hover:bg-[#0F4C5C]/90 text-white rounded-xl transition-all shadow-md hover:shadow-lg font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Modifier
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne de gauche - Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Biographie */}
            {profile.bio && (
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#0F4C5C] to-[#1A6B7A] flex items-center justify-center">
                    <span className="text-white text-sm">✍️</span>
                  </div>
                  Biographie
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {profile.bio}
                </p>
              </section>
            )}

            {/* Orientation & Situation */}
            {(profile.sexualOrientation || profile.relationshipStatus) && (
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  Orientation & Situation
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.sexualOrientation && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-pink-50/50">
                      <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center shrink-0">
                        <Heart className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium mb-1">
                          Orientation
                        </p>
                        <p className="font-semibold text-gray-900">
                          {formatValue(profile.sexualOrientation)}
                        </p>
                      </div>
                    </div>
                  )}
                  {profile.relationshipStatus && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-rose-50/50">
                      <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium mb-1">
                          Situation
                        </p>
                        <p className="font-semibold text-gray-900">
                          {formatValue(profile.relationshipStatus)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Apparence physique */}
            {(profile.height || profile.weight || profile.skinTone) && (
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Ruler className="w-4 h-4 text-white" />
                  </div>
                  Apparence
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.height && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50/50">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <Ruler className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium mb-1">
                          Taille
                        </p>
                        <p className="font-semibold text-gray-900">
                          {profile.height} cm
                        </p>
                      </div>
                    </div>
                  )}
                  {profile.weight && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-50/50">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                        <Scale className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium mb-1">
                          Poids
                        </p>
                        <p className="font-semibold text-gray-900">
                          {profile.weight} kg
                        </p>
                      </div>
                    </div>
                  )}
                  {bmi && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50/50">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                        <Star className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium mb-1">
                          IMC
                        </p>
                        <p className="font-semibold text-gray-900">{bmi}</p>
                      </div>
                    </div>
                  )}
                  {profile.skinTone && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50/50">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <span className="w-5 h-5 rounded-full bg-linear-to-br from-amber-200 to-amber-400 border border-amber-300"></span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium mb-1">
                          Teint
                        </p>
                        <p className="font-semibold text-gray-900">
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
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-white" />
                  </div>
                  Études & Travail
                </h2>
                <div className="space-y-4">
                  {profile.educationLevel && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-indigo-50/50">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 font-medium mb-1">
                          Niveau d'études
                        </p>
                        <p className="font-semibold text-gray-900">
                          {formatValue(profile.educationLevel)}
                        </p>
                        {profile.studyPlace && (
                          <p className="text-sm text-gray-600 mt-1">
                            {profile.studyPlace}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {profile.jobTitle && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50/50">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <Briefcase className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 font-medium mb-1">
                          Profession
                        </p>
                        <p className="font-semibold text-gray-900">
                          {profile.jobTitle}
                        </p>
                        {profile.companyName && (
                          <p className="text-sm text-gray-600 mt-1">
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
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  Centres d'intérêt
                </h2>
                <div className="space-y-5">
                  {Object.entries(interestsByCategory).map(
                    ([category, interests]: [string, any]) => (
                      <div key={category}>
                        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
                          {category}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {interests.map((interest: any) => (
                            <span
                              key={interest.id}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-gray-50 to-gray-100 rounded-full text-sm hover:from-[#0F4C5C]/10 hover:to-[#1A6B7A]/10 transition-all border border-gray-200 hover:border-[#0F4C5C]/30"
                            >
                              <span className="text-base">{interest.emoji}</span>
                              <span className="font-medium text-gray-800">
                                {interest.name}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Colonne de droite - Informations secondaires */}
          <div className="space-y-6">
            {/* Origines */}
            {(profile.countryOrigin || profile.nationalites?.length > 0) && (
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  Origines
                </h2>
                <div className="space-y-3">
                  {profile.nationalites?.map((pn: any) => (
                    <div
                      key={pn.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white border border-emerald-200 flex items-center justify-center shrink-0">
                        <span className="text-2xl">{pn.nationality.flag}</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          Nationalité {pn.order}
                        </p>
                        <p className="font-semibold text-gray-900">
                          {pn.nationality.nameFr}
                        </p>
                      </div>
                    </div>
                  ))}
                  {profile.countryOrigin && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 mt-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <Globe className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          Pays d'origine
                        </p>
                        <p className="font-semibold text-gray-900">
                          {profile.countryOrigin}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Habitudes */}
            {(profile.smoker || profile.alcohol) && (
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <Coffee className="w-4 h-4 text-white" />
                  </div>
                  Habitudes
                </h2>
                <div className="space-y-3">
                  {profile.smoker && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50/50">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                        <Cigarette className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          Tabac
                        </p>
                        <p className="font-semibold text-gray-900">
                          {formatValue(profile.smoker)}
                        </p>
                      </div>
                    </div>
                  )}
                  {profile.alcohol && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50/50">
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                        <Coffee className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          Alcool
                        </p>
                        <p className="font-semibold text-gray-900">
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
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
                    <Baby className="w-4 h-4 text-white" />
                  </div>
                  Projet familial
                </h2>
                <div className="space-y-3">
                  {profile.hasChildren && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50/50">
                      <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0">
                        <Baby className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          Enfants actuels
                        </p>
                        <p className="font-semibold text-gray-900">
                          {formatValue(profile.hasChildren)}
                        </p>
                      </div>
                    </div>
                  )}
                  {profile.wantsChildren && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-lime-50/50">
                      <div className="w-10 h-10 rounded-lg bg-lime-100 flex items-center justify-center shrink-0">
                        <Baby className="w-5 h-5 text-lime-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          Envie d'enfants
                        </p>
                        <p className="font-semibold text-gray-900">
                          {formatValue(profile.wantsChildren)}
                        </p>
                      </div>
                    </div>
                  )}
                  {profile.hasPets && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-teal-50/50">
                      <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                        <Dog className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          Animaux de compagnie
                        </p>
                        <p className="font-semibold text-gray-900">
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
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  Personnalité & Convictions
                </h2>
                <div className="space-y-3">
                  {profile.personalityType && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-violet-50/50">
                      <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          Type de personnalité
                        </p>
                        <p className="font-semibold text-gray-900">
                          {formatValue(profile.personalityType)}
                        </p>
                      </div>
                    </div>
                  )}
                  {profile.zodiacSign && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50/50">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                        <Star className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          Signe du zodiaque
                        </p>
                        <p className="font-semibold text-gray-900">
                          {formatValue(profile.zodiacSign)}
                        </p>
                      </div>
                    </div>
                  )}
                  {profile.religion && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50/50">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <span className="text-xl">🕊️</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          Religion
                        </p>
                        <p className="font-semibold text-gray-900">
                          {formatValue(profile.religion)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Photos - Section affichant la photo de profil */}
            {profile.profilePhotoUrl && (
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-white" />
                  </div>
                  Photos
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group cursor-pointer">
                    <Image
                      src={profile.profilePhotoUrl}
                      alt="Photo de profil"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                        <ImageIcon className="w-5 h-5 text-gray-800" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}