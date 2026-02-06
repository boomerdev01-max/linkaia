// src/components/home/RightSidebar.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import {
  UserPlus,
  Calendar,
  TrendingUp,
  Crown,
  Users,
  MapPin,
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

interface RightSidebarProps {
  user: User;
}

export default function RightSidebar({ user }: RightSidebarProps) {
  const [suggestions] = useState([
    { id: 1, name: "Marie Dubois", age: 28, mutualFriends: 3, online: true },
    { id: 2, name: "Thomas Martin", age: 32, mutualFriends: 5, online: false },
    { id: 3, name: "Sophie Bernard", age: 26, mutualFriends: 2, online: true },
    { id: 4, name: "Lucas Petit", age: 30, mutualFriends: 7, online: true },
  ]);

  const [events] = useState([
    {
      id: 1,
      date: "24 DÉC",
      title: "Soirée Rooftop",
      location: "Paris",
      participants: 45,
    },
    {
      id: 2,
      date: "31 DÉC",
      title: "Réveillon",
      location: "Lyon",
      participants: 120,
    },
    {
      id: 3,
      date: "14 JAN",
      title: "Afterwork Tech",
      location: "Toulouse",
      participants: 23,
    },
  ]);

  const [trending] = useState([
    { id: 1, tag: "#MeetNewPeople", posts: "2.4k" },
    { id: 2, tag: "#WinterEvents", posts: "1.8k" },
    { id: 3, tag: "#DigitalNomad", posts: "896" },
    { id: 4, tag: "#FrenchTech", posts: "3.2k" },
  ]);

  return (
    <aside className="h-full w-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-y-auto hover-scrollbar p-4 space-y-6">
      {/* Suggestions de personnes */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Suggestions
          </h3>
          <button className="text-sm text-[#0F4C5C] dark:text-[#B88A4F] font-medium hover:underline">
            Voir tout
          </button>
        </div>
        <div className="space-y-3">
          {suggestions.map((person) => (
            <div
              key={person.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#B88A4F] to-[#0F4C5C] flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {person.name.split(" ")[0].charAt(0)}
                      {person.name.split(" ")[1]?.charAt(0)}
                    </span>
                  </div>
                  {person.online && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {person.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {person.mutualFriends} amis en commun
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  toast.success(`Demande envoyée à ${person.name}`)
                }
                className="px-3 py-1.5 bg-[#FF5A5F] hover:bg-[#ff4449] text-white text-xs font-semibold rounded-full transition-colors"
              >
                Connecter
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Événements à venir */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Événements
          </h3>
          <button className="text-sm text-[#0F4C5C] dark:text-[#B88A4F] font-medium hover:underline">
            Tout voir
          </button>
        </div>
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => toast.info(`Détails de ${event.title}`)}
              className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <div className="bg-[#B88A4F] text-gray-900 rounded-lg text-center p-2 min-w-12">
                <p className="font-bold text-lg leading-none">
                  {event.date.split(" ")[0]}
                </p>
                <p className="text-xs leading-none mt-1">
                  {event.date.split(" ")[1]}
                </p>
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900 dark:text-white">
                  {event.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-500">{event.location}</p>
                  <Users className="w-3 h-3 text-gray-400 ml-2" />
                  <p className="text-xs text-gray-500">{event.participants}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tendances */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tendances
          </h3>
          <button className="text-sm text-[#0F4C5C] dark:text-[#B88A4F] font-medium hover:underline">
            Rafraîchir
          </button>
        </div>
        <div className="space-y-2">
          {trending.map((trend) => (
            <button
              key={trend.id}
              onClick={() => toast.info(`Recherche pour ${trend.tag}`)}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {trend.tag}
              </span>
              <span className="text-xs text-gray-500">{trend.posts} posts</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats personnelles */}
      <div className="bg-linear-to-r from-[#0F4C5C] to-[#B88A4F] rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Vos stats
          </h3>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
            Cette semaine
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center mb-4">
          <div>
            <p className="text-2xl font-bold">142</p>
            <p className="text-xs opacity-90">Vues</p>
          </div>
          <div>
            <p className="text-2xl font-bold">18</p>
            <p className="text-xs opacity-90">Messages</p>
          </div>
          <div>
            <p className="text-2xl font-bold">95</p>
            <p className="text-xs opacity-90">J'aime</p>
          </div>
        </div>
        <button
          onClick={() => toast.info("Accès aux statistiques détaillées")}
          className="w-full bg-white text-[#0F4C5C] font-semibold py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
        >
          Voir le détail
        </button>
      </div>

      {/* Publicité Premium */}
      <div className="bg-linear-to-br from-[#B88A4F]/10 to-[#0F4C5C]/10 dark:from-[#B88A4F]/20 dark:to-[#0F4C5C]/20 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Sponsorisé
        </p>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#B88A4F] to-[#0F4C5C] flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">
              Linkaïa Premium
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Débloquez toutes les fonctionnalités
            </p>
          </div>
        </div>
        <button
          onClick={() => toast.success("Redirection vers les abonnements")}
          className="w-full bg-[#0F4C5C] hover:bg-[#0a3540] text-white font-semibold py-2 rounded-lg transition-colors text-sm"
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
