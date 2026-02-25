"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import VideoCarousel3D from "./VideoCarousel3D";
import { PlayCircle, Home, ArrowLeft } from "lucide-react";

interface User {
  id: string;
  nom: string;
  prenom: string;
  pseudo: string;
  email: string;
  image?: string | null;
  roles?: string[];
}

interface VideosClientProps {
  user: User;
}

export default function VideosClient({ user }: VideosClientProps) {
  const router = useRouter();

  useEffect(() => {
    if (!user?.id) {
      router.push("/signin");
    }
  }, [user, router]);

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      {/* Header minimaliste immersif */}
      <header
        className="relative z-40 flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/5"
        style={{
          backgroundColor: "rgba(10,10,10,0.9)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Left - Navigation retour + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/home")}
            className="flex items-center justify-center w-9 h-9 rounded-full border border-white/10 hover:border-[#B88A4F]/40 hover:bg-[#B88A4F]/10 transition-all duration-300"
            aria-label="Retour a l'accueil"
          >
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </button>

          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push("/home")}
          >
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: "#B88A4F" }}
            >
              Linkaia
            </h1>
          </div>
        </div>

        {/* Center - Titre page */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <PlayCircle className="w-5 h-5" style={{ color: "#B88A4F" }} />
          <span className="text-sm font-semibold text-white/80 tracking-wide">
            Videos
          </span>
        </div>

        {/* Right - Accueil rapide */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/home")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:border-[#0F4C5C]/50 hover:bg-[#0F4C5C]/10 transition-all duration-300"
          >
            <Home className="w-4 h-4 text-white/50" />
            <span className="text-xs text-white/50 hidden sm:inline">
              Accueil
            </span>
          </button>
        </div>
      </header>

      {/* Contenu principal - Carousel plein ecran */}
      <main className="flex-1 flex items-center justify-center overflow-hidden relative">
        {/* Ambient glow effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(15,76,92,0.08) 0%, transparent 60%)",
          }}
        />

        <VideoCarousel3D />
      </main>
    </div>
  );
}
