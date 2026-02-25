"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import {
  Search,
  Bell,
  MessageCircle,
  Home,
  Users,
  PlayCircle,
  Calendar,
  Sparkles,
} from "lucide-react";
import UserProfileButton from "./UserProfileButton";
import { UserSearchModal } from "@/components/chat/UserSearchModal";
import { useUnreadMessages } from "@/hooks/use-unread-messages";

interface User {
  id: string;
  nom: string;
  prenom: string;
  pseudo: string;
  email: string;
  image?: string | null;
}

interface HeaderProps {
  user: User;
  notificationCount?: number;
}

export default function Header({ user, notificationCount = 0 }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ Plus de pollingInterval — écoute Realtime uniquement
  // On passe user.id pour que le hook ignore les messages envoyés par l'utilisateur lui-même
  const { unreadCount: messagesUnreadCount } = useUnreadMessages({
    userId: user.id,
  });

  const navItems = [
    { icon: Home, label: "Accueil", path: "/home" },
    { icon: Sparkles, label: "Decouvrir", path: "/discover" },
    { icon: Users, label: "Rencontres", path: "/suggestions" },
    { icon: PlayCircle, label: "Videos", path: "/videos" },
    { icon: Calendar, label: "Evenements", path: "/events" },
  ];

  const handleSearchFocus = () => {
    setShowSearchModal(true);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-[#0F4C5C] px-4 md:px-6 py-3 shadow-lg border-b border-[#0F4C5C]/30">
        {/* Logo & Search */}
        <div className="flex items-center gap-3 md:gap-4">
          <h1
            className="text-xl md:text-2xl font-bold text-[#B88A4F] tracking-tight cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => router.push("/home")}
          >
            Linkaïa
          </h1>

          {/* Search bar - opens modal */}
          <div className="hidden md:block">
            <div
              className="flex items-center bg-white/90 rounded-full pl-3 pr-2 py-1.5 cursor-pointer"
              onClick={handleSearchFocus}
            >
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                placeholder="Rechercher sur Linkaïa..."
                className="ml-2 bg-transparent border-none focus:outline-none w-48 text-sm text-gray-700 placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-3 absolute left-1/2 transform -translate-x-1/2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                type="button"
                title={item.label}
                onClick={() => router.push(item.path)}
                className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-[#0F4C5C]/30 text-[#B88A4F]"
                    : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                }`}
              >
                <item.icon
                  size={20}
                  strokeWidth={1.5}
                  fill={isActive ? "#B88A4F" : "none"}
                />
              </button>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Notifications */}
          <button
            type="button"
            onClick={() => router.push("/notifications")}
            className="relative w-10 h-10 rounded-full bg-white/10 text-[#B88A4F] hover:bg-white/20 transition-colors flex items-center justify-center"
            title="Notifications"
          >
            <Bell size={18} />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF5A5F] text-white text-xs rounded-full min-w-4 h-4 flex items-center justify-center px-1 font-semibold">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          {/* Messages */}
          <button
            type="button"
            onClick={() => router.push("/chat")}
            className="relative w-10 h-10 rounded-full bg-white/10 text-[#B88A4F] hover:bg-white/20 transition-colors flex items-center justify-center"
            title="Messages"
          >
            <MessageCircle size={18} />
            {messagesUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF5A5F] text-white text-xs rounded-full min-w-4 h-4 flex items-center justify-center px-1 font-semibold">
                {messagesUnreadCount > 99 ? "99+" : messagesUnreadCount}
              </span>
            )}
          </button>

          {/* User avatar */}
          <UserProfileButton user={user} />
        </div>
      </header>

      {/* Search Modal */}
      <UserSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </>
  );
}
