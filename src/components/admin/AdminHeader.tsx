// src/components/admin/AdminHeader.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Bell, LogOut } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

interface AdminHeaderProps {
  title: string;
  description?: string;
  notificationCount?: number;
  userName: string;
  userEmail: string;
  userImage?: string | null;
}

// ─── Modal de confirmation logout ────────────────────────────────
function LogoutModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <LogOut className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Déconnexion</h3>
            <p className="text-sm text-gray-600 mt-2">
              Êtes-vous sûr de vouloir vous déconnecter ?
            </p>
          </div>
          <div className="flex gap-3 w-full pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
            >
              Oui, déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Popup utilisateur (mini-menu au-dessous de l'avatar) ─────────
function AdminUserPopup({
  userName,
  userEmail,
  onLogoutClick,
  onClose,
}: {
  userName: string;
  userEmail: string;
  onLogoutClick: () => void;
  onClose: () => void;
}) {
  return (
    <div className="w-64 bg-white shadow-xl rounded-xl border border-gray-200 overflow-hidden">
      {/* Info utilisateur */}
      <div className="p-4 border-b border-gray-100 bg-[#0F4C5C]/5">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {userName}
        </p>
        <p className="text-xs text-gray-500 truncate">{userEmail}</p>
      </div>
      {/* Item déconnexion */}
      <button
        onClick={() => {
          onLogoutClick();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <LogOut className="w-5 h-5 text-red-600" />
        <span className="text-sm font-medium text-red-600">Se déconnecter</span>
      </button>
    </div>
  );
}

export default function AdminHeader({
  title,
  description,
  notificationCount = 0,
  userName,
  userEmail,
  userImage,
}: AdminHeaderProps) {
  const [isUserPopupOpen, setIsUserPopupOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabaseBrowserClient();

  // ── Fermer le popup si clic dehors ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setIsUserPopupOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Flow logout ──
  const confirmLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // on redirige quoi qu'il arrive
    }
    localStorage.removeItem("supabase.auth.token");
    window.location.href = "/signin?logout=true&t=" + Date.now();
  };

  // ── Initiales pour l'avatar fallback ──
  const initials = userName
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <header className="bg-[#0F4C5C] px-6 py-3 sticky top-0 z-10 shadow-lg border-b border-[#0F4C5C]/30">
        <div className="flex items-center justify-between">
          {/* Titre + description de la page */}
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-white/60 mt-0.5">{description}</p>
            )}
          </div>

          {/* Actions droite — Notifications + Avatar */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Bouton notifications */}
            <button
              type="button"
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

            {/* Avatar utilisateur */}
            <div ref={avatarRef} className="relative">
              <button
                onClick={() => setIsUserPopupOpen(!isUserPopupOpen)}
                className="w-10 h-10 rounded-full border-2 border-[#B88A4F] overflow-hidden bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] flex items-center justify-center hover:ring-2 hover:ring-[#B88A4F]/50 transition-all cursor-pointer"
                aria-label="Menu utilisateur"
              >
                {userImage ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={userImage}
                      alt={userName}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                ) : (
                  <span className="text-white font-bold text-sm">
                    {initials}
                  </span>
                )}
              </button>

              {/* Popup — s'ouvre vers le bas à droite */}
              {isUserPopupOpen && (
                <div className="absolute top-full right-0 mt-2 z-50">
                  <AdminUserPopup
                    userName={userName}
                    userEmail={userEmail}
                    onLogoutClick={() => setIsLogoutModalOpen(true)}
                    onClose={() => setIsUserPopupOpen(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ══ Modal confirmation logout ══ */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
      />
    </>
  );
}
