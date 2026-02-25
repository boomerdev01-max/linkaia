// src/components/discover/DiscoverRightSidebar.tsx
"use client";

import { useState } from "react";
import {
  Building2,
  Users,
  Handshake,
  Sparkles,
  TrendingUp,
  Calendar,
  MapPin,
  BadgeCheck,
  Plus,
  Crown,
  Briefcase,
  Globe,
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

interface DiscoverRightSidebarProps {
  user: User;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const SUGGESTED_ORGS = [
  {
    id: 1,
    name: "Africa Tech Hub",
    type: "startup",
    typeLabel: "Startup",
    followers: "12.4k",
    description: "Écosystème tech panafricain",
    verified: true,
    gradient: "from-violet-500 to-purple-600",
  },
  {
    id: 2,
    name: "GreenAfrica Fund",
    type: "ong",
    typeLabel: "ONG",
    followers: "8.2k",
    description: "Finance verte & développement durable",
    verified: true,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: 3,
    name: "Réseau Jeunes Leaders",
    type: "community",
    typeLabel: "Communauté",
    followers: "23.1k",
    description: "Leadership & entrepreneuriat jeune",
    verified: false,
    gradient: "from-amber-500 to-orange-500",
  },
  {
    id: 4,
    name: "Ministère du Numérique",
    type: "institution",
    typeLabel: "Institution",
    followers: "45.6k",
    description: "Transformation digitale nationale",
    verified: true,
    gradient: "from-blue-500 to-indigo-600",
  },
];

const SECTOR_TRENDS = [
  { id: 1, tag: "#AgriTech", posts: "3.8k", sector: "Agriculture", hot: true },
  { id: 2, tag: "#FinTechAfrica", posts: "5.2k", sector: "Finance", hot: true },
  { id: 3, tag: "#SantéNumerique", posts: "1.9k", sector: "Santé", hot: false },
  { id: 4, tag: "#EnergieVerte", posts: "2.4k", sector: "Énergie", hot: false },
  { id: 5, tag: "#EdTech", posts: "4.1k", sector: "Éducation", hot: true },
];

const UPCOMING_EVENTS = [
  {
    id: 1,
    date: "27 FÉV",
    title: "Webinaire IA & Éducation",
    org: "EduConnect",
    type: "online",
    participants: 240,
  },
  {
    id: 2,
    date: "28 FÉV",
    title: "Journée Portes Ouvertes",
    org: "Mairie de Cotonou",
    type: "présentiel",
    participants: 500,
  },
  {
    id: 3,
    date: "15 MAR",
    title: "Programme Reforestation",
    org: "Terre & Avenir",
    type: "terrain",
    participants: 20,
  },
];

const OPEN_JOBS = [
  {
    id: 1,
    title: "Dev Full Stack",
    org: "AgriTech Sahel",
    location: "Dakar",
    type: "CDI",
    hot: true,
  },
  {
    id: 2,
    title: "Chef de projet ONG",
    org: "SantéPour Tous",
    location: "Bamako",
    type: "CDD",
    hot: false,
  },
  {
    id: 3,
    title: "Marketing Digital",
    org: "AgriTech Sahel",
    location: "Remote",
    type: "CDI",
    hot: false,
  },
];

const TYPE_ICON: Record<string, React.ElementType> = {
  startup: Sparkles,
  ong: Handshake,
  community: Users,
  institution: Building2,
};

const TYPE_COLOR: Record<string, { bg: string; text: string }> = {
  startup: {
    bg: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-700 dark:text-violet-400",
  },
  ong: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  community: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
  },
  institution: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
  },
};

const EVENT_TYPE_COLOR: Record<string, string> = {
  online: "text-violet-500 bg-violet-50 dark:bg-violet-900/20",
  présentiel: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  terrain: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DiscoverRightSidebar({
  user,
}: DiscoverRightSidebarProps) {
  const [followedOrgs, setFollowedOrgs] = useState<Set<number>>(new Set());

  const toggleFollow = (id: number, name: string) => {
    const next = new Set(followedOrgs);
    if (next.has(id)) {
      next.delete(id);
      toast.success(`Vous ne suivez plus ${name}`);
    } else {
      next.add(id);
      toast.success(`Vous suivez maintenant ${name}`);
    }
    setFollowedOrgs(next);
  };

  return (
    <aside className="h-full w-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-y-auto hover-scrollbar p-4 space-y-5">
      {/* ── Organisations suggérées ── */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 text-[#0F4C5C] dark:text-[#B88A4F]" />
            Organisations à suivre
          </h3>
          <button className="text-xs text-[#0F4C5C] dark:text-[#B88A4F] font-medium hover:underline">
            Voir tout
          </button>
        </div>

        <div className="space-y-3">
          {SUGGESTED_ORGS.map((org) => {
            const Icon = TYPE_ICON[org.type] || Building2;
            const colors = TYPE_COLOR[org.type];
            const followed = followedOrgs.has(org.id);

            return (
              <div
                key={org.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
              >
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-xl bg-linear-to-br ${org.gradient} flex items-center justify-center shrink-0`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                      {org.name}
                    </span>
                    {org.verified && (
                      <BadgeCheck className="w-3.5 h-3.5 text-[#0F4C5C] dark:text-[#B88A4F] shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}
                    >
                      {org.typeLabel}
                    </span>
                    <span className="text-xs text-gray-400">
                      {org.followers} abonnés
                    </span>
                  </div>
                </div>

                {/* Follow */}
                <button
                  onClick={() => toggleFollow(org.id, org.name)}
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    followed
                      ? "bg-[#0F4C5C]/10 text-[#0F4C5C] dark:bg-[#B88A4F]/10 dark:text-[#B88A4F]"
                      : "bg-[#0F4C5C] text-white hover:bg-[#0a3540]"
                  }`}
                >
                  {followed ? (
                    <BadgeCheck className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tendances sectorielles ── */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-[#0F4C5C] dark:text-[#B88A4F]" />
            Tendances sectorielles
          </h3>
        </div>

        <div className="space-y-2">
          {SECTOR_TRENDS.map((trend) => (
            <button
              key={trend.id}
              onClick={() => toast.info(`Explorer ${trend.tag}`)}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="flex items-center gap-2">
                {trend.hot && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                )}
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#0F4C5C] dark:text-[#B88A4F] group-hover:underline">
                    {trend.tag}
                  </p>
                  <p className="text-xs text-gray-400">{trend.sector}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500 shrink-0">
                {trend.posts} posts
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Événements organisationnels ── */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-[#0F4C5C] dark:text-[#B88A4F]" />
            Événements à venir
          </h3>
          <button className="text-xs text-[#0F4C5C] dark:text-[#B88A4F] font-medium hover:underline">
            Tout voir
          </button>
        </div>

        <div className="space-y-2">
          {UPCOMING_EVENTS.map((event) => (
            <div
              key={event.id}
              onClick={() => toast.info(`Détails : ${event.title}`)}
              className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <div className="bg-[#B88A4F] text-white rounded-lg text-center p-2 min-w-10 shrink-0">
                <p className="font-bold text-sm leading-none">
                  {event.date.split(" ")[0]}
                </p>
                <p className="text-xs leading-none mt-0.5 opacity-90">
                  {event.date.split(" ")[1]}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs text-gray-900 dark:text-white leading-tight">
                  {event.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{event.org}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${EVENT_TYPE_COLOR[event.type]}`}
                  >
                    {event.type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {event.participants} inscrits
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Offres d'emploi récentes ── */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
            <Briefcase className="w-4 h-4 text-[#0F4C5C] dark:text-[#B88A4F]" />
            Offres récentes
          </h3>
          <button className="text-xs text-[#0F4C5C] dark:text-[#B88A4F] font-medium hover:underline">
            Voir tout
          </button>
        </div>

        <div className="space-y-2">
          {OPEN_JOBS.map((job) => (
            <button
              key={job.id}
              onClick={() => toast.info(`Voir l'offre : ${job.title}`)}
              className="w-full text-left p-3 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-xs text-gray-900 dark:text-white">
                      {job.title}
                    </p>
                    {job.hot && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 font-medium">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{job.org}</p>
                  <div className="flex items-center gap-1 mt-1 text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span className="text-xs">{job.location}</span>
                  </div>
                </div>
                <span className="shrink-0 text-xs px-2 py-1 bg-[#0F4C5C]/10 text-[#0F4C5C] dark:bg-[#B88A4F]/10 dark:text-[#B88A4F] rounded-full font-medium">
                  {job.type}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Banner Premium ── */}
      <div className="bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-5 h-5" />
          <span className="font-bold text-sm">Linkaïa Premium</span>
        </div>
        <p className="text-xs opacity-90 mb-3">
          Accédez aux publications exclusives des organisations partenaires et
          décuplez votre réseau professionnel.
        </p>
        <button
          onClick={() => toast.success("Redirection vers les abonnements")}
          className="w-full bg-white text-[#0F4C5C] font-semibold py-2 rounded-lg hover:bg-gray-100 transition-colors text-xs"
        >
          Essayer gratuitement
        </button>
      </div>

      <style jsx>{`
        .hover-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hover-scrollbar::-webkit-scrollbar {
          width: 0;
          height: 0;
        }
        .hover-scrollbar:hover {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
        }
        .hover-scrollbar:hover::-webkit-scrollbar {
          width: 6px;
        }
        .hover-scrollbar:hover::-webkit-scrollbar-track {
          background: transparent;
        }
        .hover-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        .hover-scrollbar:hover::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.7);
        }
      `}</style>
    </aside>
  );
}
