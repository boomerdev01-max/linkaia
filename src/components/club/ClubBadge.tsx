// src/components/club/ClubBadge.tsx
"use client";

import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClubBadgeProps {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ClubBadge({
  size = "md",
  showLabel = true,
  className = "",
}: ClubBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <Badge
      className={`
        bg-linear-to-r from-[#0F4C5C] to-[#0A3A47]
        hover:from-[#0a3540] hover:to-[#082830]
        text-white
        border-none
        shadow-sm
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <Crown className={`${iconSizes[size]} ${showLabel ? "mr-1.5" : ""}`} />
      {showLabel && "Club LWB"}
    </Badge>
  );
}

// Hook pour vérifier si un utilisateur a accès au Club LWB
export function useClubAccess(userId?: string) {
  // Cette fonction pourrait être étendue pour faire un appel API
  // Pour l'instant, on retourne juste false par défaut
  return {
    hasAccess: false,
    isLoading: false,
  };
}
