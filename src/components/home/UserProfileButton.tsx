// src/components/home/UserProfileButton.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import UserMenuPopup from "@/components/home/UserMenuPopup";
import LogoutConfirmModal from "@/components/home/LogoutConfirmModal";

interface UserProfileButtonProps {
  user: {
    id: string;
    nom: string;
    prenom: string;
    pseudo: string;
    email: string;
    image?: string | null;
  };
}

export default function UserProfileButton({ user }: UserProfileButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  // Fermer le menu si clic dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setIsMenuOpen(false);
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      // 1. Déconnexion de Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erreur lors de la déconnexion:", error);
        // Même en cas d'erreur, on redirige
      }

      // 2. Nettoyer le localStorage
      localStorage.removeItem("supabase.auth.token");

      // 3. Redirection FORCÉE avec paramètre pour bypass proxy
      // Le paramètre ?logout=true permet au proxy de laisser passer
      window.location.href = "/signin?logout=true&t=" + Date.now();
    } catch (error) {
      console.error("Erreur:", error);
      // En cas d'erreur, on redirige quand même
      window.location.href = "/signin?logout=true&t=" + Date.now();
    }
  };

  return (
    <div ref={buttonRef} className="relative">
      {/* Bouton profil */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-[#B88A4F] overflow-hidden bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] flex items-center justify-center hover:ring-2 hover:ring-[#B88A4F]/50 transition-all cursor-pointer"
        aria-label="Menu utilisateur"
        disabled={isLoggingOut}
      >
        {user.image ? (
          <div className="relative w-full h-full">
            <Image
              src={user.image}
              alt={`${user.prenom} ${user.nom}`}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        ) : (
          <span className="text-white font-bold text-sm md:text-base">
            {user.prenom.charAt(0)}
            {user.nom.charAt(0)}
          </span>
        )}
      </button>

      {/* Menu Popup */}
      {isMenuOpen && (
        <div className="absolute right-0 top-12 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <UserMenuPopup
            user={user}
            onLogoutClick={handleLogoutClick}
            onClose={() => setIsMenuOpen(false)}
          />
        </div>
      )}

      {/* Modale de confirmation */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}
