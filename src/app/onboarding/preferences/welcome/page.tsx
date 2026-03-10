"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Settings2, Sparkles } from "lucide-react";

export default function PreferenceWelcomePage() {
  const router = useRouter();
  const [isSkipping, setIsSkipping] = useState(false);

  const handleStart = () => {
    router.push("/onboarding/preferences");
  };

  const handleSkip = async () => {
    try {
      setIsSkipping(true);
      const response = await fetch("/api/preference/skip", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to skip");
      }

      toast.success("Vous pourrez définir vos préférences plus tard");
      router.push("/home");
    } catch (error) {
      console.error("Failed to skip preferences:", error);
      toast.error("Une erreur est survenue");
      setIsSkipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-4 selection:bg-purple-500/30 overflow-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-bl from-purple-500/10 to-indigo-500/10 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-pink-500/10 to-rose-500/10 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-purple-500/10 overflow-hidden border border-white/20 dark:border-zinc-800/50">
          
          {/* Hero Illustration - CSS / Tailwind Only */}
          <div className="relative h-72 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden flex items-center justify-center">
             {/* Sparkles */}
            <div className="absolute top-8 right-8 text-white/40 animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>

            {/* Glowing orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-white/20 rounded-full blur-3xl animate-[spin_12s_linear_infinite]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-64 h-64 bg-pink-500/30 rounded-full blur-3xl animate-[spin_14s_linear_infinite_reverse]" />
            
            {/* CSS Abstract Illustration: Settings/Preferences Dials */}
            <div className="relative z-10 flex items-center justify-center">
              {/* Floating Settings Gear */}
              <div className="absolute -top-12 -right-8 w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl flex items-center justify-center animate-[spin_10s_linear_infinite]">
                 <Settings2 className="w-10 h-10 text-white/60" />
              </div>
              
              {/* Main Preference Card */}
              <div className="relative w-48 h-48 bg-white/20 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-2xl flex flex-col items-center justify-center p-6 animate-[bounce_5s_infinite]">
                 {/* Sliders Graphic */}
                 <div className="w-full space-y-4">
                   {/* Slider 1 */}
                   <div className="relative h-2 w-full bg-white/20 rounded-full">
                     <div className="absolute top-1/2 -translate-y-1/2 left-1/4 w-6 h-6 bg-white rounded-full shadow-lg border border-purple-200" />
                     <div className="absolute top-0 left-0 w-1/4 h-full bg-gradient-to-r from-white to-white/80 rounded-full" />
                   </div>
                   {/* Slider 2 */}
                   <div className="relative h-2 w-full bg-white/20 rounded-full">
                     <div className="absolute top-1/2 -translate-y-1/2 left-3/4 w-6 h-6 bg-white rounded-full shadow-lg border border-purple-200" />
                     <div className="absolute top-0 left-0 w-3/4 h-full bg-gradient-to-r from-white to-white/80 rounded-full" />
                   </div>
                   {/* Slider 3 */}
                   <div className="relative h-2 w-full bg-white/20 rounded-full">
                     <div className="absolute top-1/2 -translate-y-1/2 left-1/2 w-6 h-6 bg-white rounded-full shadow-lg border border-purple-200" />
                     <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-white to-white/80 rounded-full" />
                   </div>
                 </div>
                 
                 <div className="mt-6 flex items-center justify-center w-12 h-12 bg-white/20 rounded-full border border-white/30 backdrop-blur-sm">
                   <SlidersHorizontal className="w-6 h-6 text-white" />
                 </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 sm:p-10 text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              Que <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">cherchez-vous ?</span>
            </h1>
            
            <p className="text-base text-gray-500 dark:text-gray-400 font-medium mb-6 leading-relaxed">
              Aidez-nous à vous trouver les meilleures correspondances en ajustant vos préférences de recherche.
            </p>

            {/* Micro-info */}
            <div className="mb-8 inline-flex items-start bg-purple-50 dark:bg-purple-500/10 rounded-2xl p-4 border border-purple-100 dark:border-purple-500/20">
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300 text-left">
                💡 Vous pouvez modifier vos filtres à tout moment dans les paramètres.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-4">
              <Button
                onClick={handleStart}
                className="w-full rounded-full h-14 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-xl shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-95"
              >
                Définir mes critères
              </Button>

              <Button
                onClick={handleSkip}
                disabled={isSkipping}
                variant="ghost"
                className="w-full rounded-full h-14 text-base font-semibold text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {isSkipping ? "Un instant..." : "Sauter cette étape"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}