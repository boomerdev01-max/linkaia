// src/components/home/LeftSidebar.tsx
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  Users,
  PlayCircle,
  Calendar,
  Store,
  ImageIcon,
  Settings,
  User as UserIcon,
  Heart,
  MapPin,
  Globe,
  BookOpen,
  Briefcase,
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

interface LeftSidebarProps {
  user: User;
}

export default function LeftSidebar({ user }: LeftSidebarProps) {
  const router = useRouter();

  const menuItems = [
    { icon: Home, label: "Accueil", path: "/home", active: true },
    { icon: Users, label: "Rencontres", path: "/matches" },
    { icon: Heart, label: "Favoris", path: "/favorites" },
    { icon: PlayCircle, label: "Vidéos", path: "/videos" },
    { icon: Calendar, label: "Événements", path: "/events" },
    { icon: Store, label: "Marketplace", path: "/marketplace" },
    { icon: ImageIcon, label: "Souvenirs", path: "/memories" },
    { icon: Briefcase, label: "Carrières", path: "/careers" },
    { icon: Globe, label: "Communautés", path: "/communities" },
    { icon: BookOpen, label: "Blog", path: "/blog" },
    { icon: MapPin, label: "Lieux", path: "/places" },
    { icon: Settings, label: "Paramètres", path: "/settings" },
  ];

  const shortcuts = [
    { label: "Groupes populaires", count: 12 },
    { label: "Événements du jour", count: 3 },
    { label: "Nouveaux membres", count: 45 },
    { label: "Offres spéciales", count: 7 },
  ];

  return (
    <aside className="h-full w-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto hover-scrollbar">
      {/* Profil utilisateur */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <Link
          href={`/profile/${user.id}`}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="relative w-12 h-12 rounded-full border-2 border-[#B88A4F] overflow-hidden bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] flex items-center justify-center">
            {user.image ? (
              <Image
                src={user.image}
                alt={`${user.prenom} ${user.nom}`}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <span className="text-white font-bold text-lg">
                {user.prenom.charAt(0)}
                {user.nom.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 dark:text-white truncate">
              {user.prenom} {user.nom}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              @{user.pseudo}
            </p>
          </div>
          <UserIcon className="w-4 h-4 text-gray-400" />
        </Link>
      </div>

      {/* Menu principal */}
      <div className="p-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Navigation
        </h3>
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                if (item.active) return;
                toast.info("Fonctionnalité à venir");
                // router.push(item.path);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                item.active
                  ? "bg-[#0F4C5C]/10 text-[#0F4C5C] dark:bg-[#0F4C5C]/20 dark:text-[#B88A4F]"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Raccourcis */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Raccourcis
        </h3>
        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <button
              key={index}
              onClick={() => toast.info("Fonctionnalité à venir")}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {shortcut.label}
              </span>
              <span className="px-2 py-1 text-xs font-semibold bg-[#0F4C5C] text-white rounded-full">
                {shortcut.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Inviter des amis */}
      <div className="p-4 mt-auto border-t border-gray-200 dark:border-gray-800">
        <div className="bg-linear-to-r from-[#0F4C5C] to-[#B88A4F] rounded-xl p-4 text-white">
          <h4 className="font-bold mb-2">Invitez vos amis</h4>
          <p className="text-sm opacity-90 mb-3">
            Partagez Linkaïa avec vos proches et obtenez des avantages exclusifs
          </p>
          <button
            onClick={() => toast.success("Lien de parrainage copié !")}
            className="w-full bg-white text-[#0F4C5C] font-semibold py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          >
            Inviter
          </button>
        </div>
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
