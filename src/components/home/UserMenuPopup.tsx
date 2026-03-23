// src/components/home/UserMenuPopup.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Settings,
  HelpCircle,
  Moon,
  MessageSquareWarning,
  LogOut,
  User,
  Shield,
  CreditCard,
  Sparkles,
  Crown,
  Wallet, // ← NOUVEAU
  Zap, // ← NOUVEAU (icône Recharger)
} from "lucide-react";
import { useWalletBalance } from "@/hooks/useWalletBalance";

interface UserMenuPopupProps {
  user: {
    id: string;
    nom: string;
    prenom: string;
    pseudo: string;
    email: string;
    image?: string | null;
    level?: string;
  };
  onLogoutClick: () => void;
  onClose?: () => void;
}

export default function UserMenuPopup({
  user,
  onLogoutClick,
  onClose,
}: UserMenuPopupProps) {
  // Solde L-Gems pour l'afficher dans l'entrée wallet
  const { balance } = useWalletBalance();

  const menuItems = [
    {
      icon: Sparkles,
      label: "Suggestions",
      href: "/suggestions",
      badge: "Matchs",
      highlight: true,
    },
    {
      icon: Crown,
      label: "Club fermé LWB",
      href: "/club/checkout",
      badge: "Premium",
      highlight: true,
      clubExclusive: true,
    },
    // ── WALLET ─────────────────────────────────────────────────────────────
    {
      icon: Wallet,
      label: "Mon Wallet",
      href: "/wallet",
      badge: balance ? `${balance.lgemsBalance.toLocaleString()} 💎` : null,
      highlight: false,
      isWallet: true,
    },
    {
      icon: Zap,
      label: "Recharger mes L-Gems",
      href: "/wallet/recharge",
      badge: null,
      highlight: false,
      isRecharge: true,
    },
    // ───────────────────────────────────────────────────────────────────────
    {
      icon: Shield,
      label: "Confidentialité",
      href: "/privacy",
      badge: null,
    },
    {
      icon: Settings,
      label: "Paramètres",
      href: "/settings",
      badge: null,
    },
    {
      icon: CreditCard,
      label: "Abonnements",
      href: "/pricing",
      badge:
        user.level && user.level !== "free" ? user.level.toUpperCase() : null,
    },
    {
      icon: HelpCircle,
      label: "Aide & Support",
      href: "/help",
      badge: null,
    },
    {
      icon: Moon,
      label: "Affichage",
      href: "/display",
      badge: null,
    },
    {
      icon: MessageSquareWarning,
      label: "Feedback",
      href: "/feedback",
      badge: null,
    },
    {
      icon: LogOut,
      label: "Se déconnecter",
      href: "#",
      badge: null,
      isLogout: true,
    },
  ];

  return (
    <div className="w-80 bg-white dark:bg-gray-900 shadow-xl rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-linear-to-r from-[#0F4C5C]/5 to-[#B88A4F]/5">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full border-2 border-[#B88A4F] overflow-hidden bg-linear-to-br from-[#0F4C5C] to-[#B88A4F]">
            {user.image ? (
              <Image
                src={user.image}
                alt={`${user.prenom} ${user.nom}`}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white font-bold text-base">
                  {user.prenom.charAt(0)}
                  {user.nom.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white truncate">
              {user.prenom} {user.nom}
            </h3>
          </div>
        </div>
        <Link
          href={`/profile/${user.id}`}
          onClick={onClose}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0F4C5C] hover:bg-[#0a3540] text-white font-medium rounded-lg transition-colors text-sm"
        >
          <User className="w-4 h-4" />
          Voir mon profil complet
        </Link>
      </div>

      {/* Menu items */}
      <div className="max-h-105 overflow-y-auto">
        {menuItems.map((item, index) => {
          // Déconnexion
          if (item.isLogout) {
            return (
              <button
                key={index}
                onClick={() => {
                  onLogoutClick();
                  onClose?.();
                }}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0 text-left"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    {item.label}
                  </span>
                </div>
              </button>
            );
          }

          const isHighlighted = item.highlight;
          const isClubExclusive = (item as any).clubExclusive;
          const isWallet = (item as any).isWallet;
          const isRecharge = (item as any).isRecharge;

          return (
            <Link
              key={index}
              href={item.href}
              onClick={onClose}
              className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${
                isClubExclusive
                  ? "bg-linear-to-r from-[#0F4C5C]/10 to-[#0A3A47]/10"
                  : isHighlighted
                    ? "bg-linear-to-r from-[#0F4C5C]/5 to-[#B88A4F]/5"
                    : isRecharge
                      ? "bg-linear-to-r from-amber-50/60 to-orange-50/40 dark:from-amber-900/10 dark:to-orange-900/5"
                      : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={`w-5 h-5 ${
                    isClubExclusive
                      ? "text-[#0F4C5C] dark:text-[#B88A4F]"
                      : isHighlighted
                        ? "text-[#B88A4F]"
                        : isWallet || isRecharge
                          ? "text-amber-500"
                          : "text-gray-600 dark:text-gray-400"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    isClubExclusive
                      ? "text-[#0F4C5C] dark:text-[#B88A4F] font-bold"
                      : isHighlighted
                        ? "text-[#0F4C5C] dark:text-[#B88A4F] font-semibold"
                        : isWallet || isRecharge
                          ? "text-amber-700 dark:text-amber-400 font-semibold"
                          : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {item.label}
                </span>
              </div>

              {item.badge && (
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    isClubExclusive
                      ? "bg-linear-to-r from-[#0F4C5C] to-[#0A3A47] text-white font-semibold"
                      : isHighlighted
                        ? "bg-linear-to-r from-[#0F4C5C] to-[#B88A4F] text-white"
                        : isWallet
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                          : item.badge === "Premium"
                            ? "bg-linear-to-r from-[#B88A4F] to-[#FF5A5F] text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer légal */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-2 justify-center">
          <Link
            href="/privacy"
            onClick={onClose}
            className="hover:text-[#0F4C5C] dark:hover:text-[#B88A4F] transition-colors"
          >
            Confidentialité
          </Link>
          <span>•</span>
          <Link
            href="/terms"
            onClick={onClose}
            className="hover:text-[#0F4C5C] dark:hover:text-[#B88A4F] transition-colors"
          >
            Conditions
          </Link>
          <span>•</span>
          <Link
            href="/cookies"
            onClick={onClose}
            className="hover:text-[#0F4C5C] dark:hover:text-[#B88A4F] transition-colors"
          >
            Cookies
          </Link>
          <span>•</span>
          <Link
            href="/about"
            onClick={onClose}
            className="hover:text-[#0F4C5C] dark:hover:text-[#B88A4F] transition-colors"
          >
            À propos
          </Link>
        </div>
      </div>
    </div>
  );
}
