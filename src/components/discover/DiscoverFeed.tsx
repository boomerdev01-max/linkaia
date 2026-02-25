// src/components/discover/DiscoverFeed.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import {
  MessageCircle,
  Share2,
  Bookmark,
  ThumbsUp,
  Building2,
  Users,
  Briefcase,
  CalendarDays,
  Handshake,
  Globe,
  BadgeCheck,
  Sparkles,
  ChevronDown,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  nom: string;
  prenom: string;
  pseudo: string;
  email: string;
  image?: string | null;
}

interface DiscoverFeedProps {
  user: User;
}

// ─── Types ──────────────────────────────────────────────────────────────────

type PostType = "individual" | "ong" | "startup" | "institution" | "community";

type ContentTag =
  | "volunteer"
  | "project_update"
  | "job"
  | "event"
  | "news"
  | "social";

interface DiscoverPost {
  id: string;
  authorType: PostType;
  authorName: string;
  authorHandle: string;
  authorAvatar: string | null;
  authorVerified: boolean;
  authorLocation?: string;
  contentTag: ContentTag;
  content: string;
  imageUrl?: string;
  createdAt: string;
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
  saved: boolean;
  // Org-specific extras
  orgCategory?: string;
  cta?: { label: string; url: string };
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_POSTS: DiscoverPost[] = [
  {
    id: "1",
    authorType: "ong",
    authorName: "Terre & Avenir",
    authorHandle: "terreavenir",
    authorAvatar: null,
    authorVerified: true,
    authorLocation: "Cotonou, Bénin",
    contentTag: "volunteer",
    orgCategory: "ONG",
    content:
      "🌱 Appel à bénévoles ! Nous lançons notre programme de reforestation au Bénin et cherchons 20 volontaires motivés pour rejoindre notre équipe terrain du 15 au 30 mars. Aucune expérience requise — juste de l'enthousiasme et l'envie de contribuer à un monde plus vert. Postulez dès maintenant !",
    createdAt: "2025-02-24T08:30:00Z",
    likes: 142,
    comments: 38,
    shares: 67,
    liked: false,
    saved: false,
    cta: { label: "Postuler comme bénévole", url: "#" },
  },
  {
    id: "2",
    authorType: "individual",
    authorName: "Amara Diallo",
    authorHandle: "amara.diallo",
    authorAvatar: null,
    authorVerified: false,
    authorLocation: "Abidjan, CI",
    contentTag: "social",
    content:
      "Incroyable journée au Forum Africain de l'Innovation à Dakar 🔥 Les startups présentes avaient des solutions vraiment bluffantes pour l'agriculture connectée et la fintech. Le continent a un potentiel immense. Hâte de voir ces projets évoluer dans les prochains mois !",
    createdAt: "2025-02-24T07:15:00Z",
    likes: 89,
    comments: 21,
    shares: 15,
    liked: true,
    saved: false,
  },
  {
    id: "3",
    authorType: "startup",
    authorName: "AgriTech Sahel",
    authorHandle: "agritechsahel",
    authorAvatar: null,
    authorVerified: true,
    authorLocation: "Dakar, Sénégal",
    contentTag: "job",
    orgCategory: "Startup",
    content:
      "💼 Nous recrutons ! AgriTech Sahel est en pleine croissance et cherche :\n\n→ 1 Développeur Full Stack (React / Node.js)\n→ 1 Responsable Marketing Digital\n→ 2 Agents terrain (zones rurales)\n\nMission : révolutionner l'agriculture de précision au Sahel. Stack tech moderne, équipe soudée, impact réel. Envoyez votre CV !",
    createdAt: "2025-02-23T16:00:00Z",
    likes: 203,
    comments: 57,
    shares: 112,
    liked: false,
    saved: true,
    cta: { label: "Voir les offres", url: "#" },
  },
  {
    id: "4",
    authorType: "institution",
    authorName: "Mairie de Cotonou",
    authorHandle: "mairie.cotonou",
    authorAvatar: null,
    authorVerified: true,
    authorLocation: "Cotonou, Bénin",
    contentTag: "event",
    orgCategory: "Institution",
    content:
      "📢 La Mairie de Cotonou vous invite à la Journée Portes Ouvertes du 28 février. Découvrez les projets d'urbanisme 2025-2030, rencontrez les équipes municipales et participez aux ateliers citoyens. Venez nombreux — votre voix compte dans la construction de notre ville !",
    imageUrl: "/images/linka4.png",
    createdAt: "2025-02-23T10:45:00Z",
    likes: 318,
    comments: 74,
    shares: 156,
    liked: false,
    saved: false,
    cta: { label: "S'inscrire à l'événement", url: "#" },
  },
  {
    id: "5",
    authorType: "community",
    authorName: "Women in Tech Africa",
    authorHandle: "womenintech_africa",
    authorAvatar: null,
    authorVerified: true,
    authorLocation: "Pan-Africain",
    contentTag: "project_update",
    orgCategory: "Communauté",
    content:
      "🚀 Mise à jour du projet MentorConnect : après 3 mois de développement, notre plateforme de mentorat compte désormais 480 mentorées actives et 120 mentors bénévoles dans 14 pays africains. Taux de satisfaction : 94%. Prochaine étape — déploiement en Afrique francophone. Merci à toutes celles qui font vivre cette initiative !",
    createdAt: "2025-02-22T14:20:00Z",
    likes: 561,
    comments: 93,
    shares: 234,
    liked: true,
    saved: true,
  },
  {
    id: "6",
    authorType: "individual",
    authorName: "Kofi Mensah",
    authorHandle: "kofi.mensah",
    authorAvatar: null,
    authorVerified: false,
    contentTag: "social",
    content:
      "Après 2 ans à construire ma startup seul dans mon coin, j'ai finalement rejoint un incubateur. Ce que personne ne vous dit : le réseau compte autant que le produit. Cette semaine j'ai eu plus de feedback utile en 3 conversations qu'en 6 mois de travail solo. Entourez-vous des bonnes personnes 🤝",
    createdAt: "2025-02-22T09:00:00Z",
    likes: 712,
    comments: 148,
    shares: 89,
    liked: false,
    saved: false,
  },
  {
    id: "7",
    authorType: "ong",
    authorName: "SantéPour Tous",
    authorHandle: "santépourtous",
    authorAvatar: null,
    authorVerified: true,
    authorLocation: "Bamako, Mali",
    contentTag: "project_update",
    orgCategory: "ONG",
    content:
      "📊 Rapport de mission — Janvier 2025 : 1 240 consultations médicales gratuites dans les zones rurales du Mali. 3 nouvelles cliniques mobiles déployées. 45 agents de santé communautaire formés. Tout cela grâce à vos dons et votre soutien. Merci ❤️ Le rapport complet est disponible sur notre site.",
    imageUrl: "/images/linka2.png",
    createdAt: "2025-02-21T11:30:00Z",
    likes: 892,
    comments: 121,
    shares: 445,
    liked: false,
    saved: false,
    cta: { label: "Lire le rapport", url: "#" },
  },
  {
    id: "8",
    authorType: "startup",
    authorName: "EduConnect",
    authorHandle: "educonnect.africa",
    authorAvatar: null,
    authorVerified: true,
    authorLocation: "Lomé, Togo",
    contentTag: "event",
    orgCategory: "Startup",
    content:
      "🎓 Webinaire gratuit — \"L'IA au service de l'éducation en Afrique\" — Jeudi 27 février à 18h GMT. Inscription obligatoire (lien en bio). Avec la participation de 4 experts internationaux et des retours terrain de nos équipes au Togo, Ghana et Côte d'Ivoire.",
    createdAt: "2025-02-20T13:00:00Z",
    likes: 267,
    comments: 44,
    shares: 198,
    liked: false,
    saved: false,
    cta: { label: "S'inscrire au webinaire", url: "#" },
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const FILTER_TABS = [
  { key: "all", label: "Tout" },
  { key: "individual", label: "Individus" },
  { key: "organization", label: "Organisations" },
] as const;

type FilterTab = (typeof FILTER_TABS)[number]["key"];

const ORG_SUB_FILTERS = [
  { key: "all_org", label: "Toutes", icon: Globe },
  { key: "ong", label: "ONG", icon: Handshake },
  { key: "startup", label: "Startups", icon: Sparkles },
  { key: "institution", label: "Institutions", icon: Building2 },
  { key: "community", label: "Communautés", icon: Users },
] as const;

type OrgSubFilter = (typeof ORG_SUB_FILTERS)[number]["key"];

const CONTENT_FILTERS = [
  { key: "all_content", label: "Tout le contenu", icon: Filter },
  { key: "volunteer", label: "Bénévolat", icon: Handshake },
  { key: "project_update", label: "Projets", icon: Sparkles },
  { key: "job", label: "Emploi / Stages", icon: Briefcase },
  { key: "event", label: "Événements", icon: CalendarDays },
] as const;

type ContentFilter = (typeof CONTENT_FILTERS)[number]["key"];

// ─── Badge Config ─────────────────────────────────────────────────────────────

const ORG_BADGE_CONFIG: Record<
  PostType,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ElementType;
  }
> = {
  ong: {
    label: "ONG",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-l-emerald-500",
    icon: Handshake,
  },
  startup: {
    label: "Startup",
    bg: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-700 dark:text-violet-400",
    border: "border-l-violet-500",
    icon: Sparkles,
  },
  institution: {
    label: "Institution",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-l-blue-500",
    icon: Building2,
  },
  community: {
    label: "Communauté",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-l-amber-500",
    icon: Users,
  },
  individual: {
    label: "Individu",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
    border: "border-l-transparent",
    icon: Users,
  },
};

const CONTENT_TAG_CONFIG: Record<
  ContentTag,
  { label: string; bg: string; text: string }
> = {
  volunteer: {
    label: "Bénévolat",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  project_update: {
    label: "Projet",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
  },
  job: {
    label: "Emploi",
    bg: "bg-violet-50 dark:bg-violet-900/20",
    text: "text-violet-600 dark:text-violet-400",
  },
  event: {
    label: "Événement",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-600 dark:text-orange-400",
  },
  news: {
    label: "Actualité",
    bg: "bg-sky-50 dark:bg-sky-900/20",
    text: "text-sky-600 dark:text-sky-400",
  },
  social: {
    label: "Social",
    bg: "bg-gray-50 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
  },
};

// ─── Avatar Fallback ──────────────────────────────────────────────────────────

function AvatarFallback({ name, type }: { name: string; type: PostType }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  const gradients: Record<PostType, string> = {
    ong: "from-emerald-500 to-teal-600",
    startup: "from-violet-500 to-purple-600",
    institution: "from-blue-500 to-indigo-600",
    community: "from-amber-500 to-orange-500",
    individual: "from-[#0F4C5C] to-[#B88A4F]",
  };

  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-linear-to-br ${gradients[type]}`}
    >
      <span className="text-white font-bold text-base">{initials}</span>
    </div>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

function DiscoverPostCard({ post }: { post: DiscoverPost }) {
  const [liked, setLiked] = useState(post.liked);
  const [saved, setSaved] = useState(post.saved);
  const [likeCount, setLikeCount] = useState(post.likes);

  const isOrg = post.authorType !== "individual";
  const badge = ORG_BADGE_CONFIG[post.authorType];
  const tagConfig = CONTENT_TAG_CONFIG[post.contentTag];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden
        ${isOrg ? `border-l-4 ${badge.border}` : ""}`}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative w-11 h-11 rounded-full border-2 border-[#B88A4F] overflow-hidden shrink-0">
            {post.authorAvatar ? (
              <Image
                src={post.authorAvatar}
                alt={post.authorName}
                fill
                className="object-cover"
                sizes="44px"
              />
            ) : (
              <AvatarFallback name={post.authorName} type={post.authorType} />
            )}
          </div>

          {/* Author info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-gray-900 dark:text-white text-sm truncate">
                {post.authorName}
              </span>
              {post.authorVerified && (
                <BadgeCheck className="w-4 h-4 text-[#0F4C5C] dark:text-[#B88A4F] shrink-0" />
              )}
              {isOrg && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
                >
                  <badge.icon className="w-3 h-3" />
                  {badge.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500">
                @{post.authorHandle}
              </span>
              {post.authorLocation && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <span className="text-xs text-gray-400">
                    {post.authorLocation}
                  </span>
                </>
              )}
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span className="text-xs text-gray-400">
                {formatTime(post.createdAt)}
              </span>
            </div>
          </div>

          {/* Content tag */}
          <span
            className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${tagConfig.bg} ${tagConfig.text}`}
          >
            {tagConfig.label}
          </span>
        </div>

        {/* Content */}
        <p className="mt-3 text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className="w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image
            src={post.imageUrl}
            alt="Post image"
            width={555}
            height={208}
            className="w-full object-cover"
          />
        </div>
      )}

      {/* CTA Button */}
      {post.cta && (
        <div className="px-4 pt-3">
          <button
            onClick={() => toast.info(`Redirection : ${post.cta!.label}`)}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${badge.bg} ${badge.text} hover:opacity-80`}
          >
            {post.cta.label}
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between text-xs text-gray-400">
        <span>{formatCount(likeCount)} réactions</span>
        <div className="flex gap-3">
          <span>{formatCount(post.comments)} commentaires</span>
          <span>{formatCount(post.shares)} partages</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-2 pb-2 pt-1 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
            ${
              liked
                ? "text-[#0F4C5C] dark:text-[#B88A4F] bg-[#0F4C5C]/10"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
        >
          <ThumbsUp className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
          J'aime
        </button>

        <button
          onClick={() => toast.info("Ouverture des commentaires")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Commenter
        </button>

        <button
          onClick={() => toast.success("Lien copié !")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Partager
        </button>

        <button
          onClick={() => {
            setSaved(!saved);
            toast.success(saved ? "Retiré des favoris" : "Ajouté aux favoris");
          }}
          className={`p-2 rounded-lg transition-colors
            ${
              saved
                ? "text-[#B88A4F] bg-[#B88A4F]/10"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
        >
          <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Feed ────────────────────────────────────────────────────────────────

export default function DiscoverFeed({ user }: DiscoverFeedProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [orgSubFilter, setOrgSubFilter] = useState<OrgSubFilter>("all_org");
  const [contentFilter, setContentFilter] =
    useState<ContentFilter>("all_content");
  const [showContentFilter, setShowContentFilter] = useState(false);

  const filteredPosts = MOCK_POSTS.filter((post) => {
    // Tab filter
    if (activeTab === "individual" && post.authorType !== "individual")
      return false;
    if (activeTab === "organization" && post.authorType === "individual")
      return false;

    // Org sub-filter (only when on "organization" or "all" tab)
    if (activeTab !== "individual" && orgSubFilter !== "all_org") {
      if (post.authorType !== orgSubFilter) return false;
    }

    // Content tag filter
    if (contentFilter !== "all_content" && post.contentTag !== contentFilter)
      return false;

    return true;
  });

  return (
    <div className="w-full space-y-4">
      {/* Page header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
              Découvrir
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Publications de la communauté et des organisations
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-2">
        <div className="flex gap-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setOrgSubFilter("all_org");
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-[#0F4C5C] text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Org sub-filters */}
        {(activeTab === "organization" || activeTab === "all") && (
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-hide">
            {ORG_SUB_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setOrgSubFilter(f.key)}
                className={`flex items-center gap-1 shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  orgSubFilter === f.key
                    ? "bg-[#B88A4F]/20 text-[#B88A4F] border border-[#B88A4F]/40"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <f.icon className="w-3 h-3" />
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Content type filter */}
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => setShowContentFilter(!showContentFilter)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors"
          >
            <Filter className="w-3 h-3" />
            Type de contenu
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showContentFilter ? "rotate-180" : ""}`}
            />
          </button>
          {contentFilter !== "all_content" && (
            <span className="text-xs text-[#0F4C5C] dark:text-[#B88A4F] font-medium">
              : {CONTENT_FILTERS.find((f) => f.key === contentFilter)?.label}
            </span>
          )}
        </div>

        {showContentFilter && (
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
            {CONTENT_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setContentFilter(f.key);
                  setShowContentFilter(false);
                }}
                className={`flex items-center gap-1 shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  contentFilter === f.key
                    ? "bg-[#0F4C5C] text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <f.icon className="w-3 h-3" />
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Posts */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <Sparkles className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Aucune publication dans cette catégorie
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Essayez un autre filtre
          </p>
        </div>
      ) : (
        filteredPosts.map((post) => (
          <DiscoverPostCard key={post.id} post={post} />
        ))
      )}

      {/* Load more */}
      {filteredPosts.length > 0 && (
        <div className="text-center py-4">
          <button
            onClick={() => toast.info("Chargement de plus de publications…")}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors text-sm"
          >
            Charger plus
          </button>
        </div>
      )}
    </div>
  );
}
