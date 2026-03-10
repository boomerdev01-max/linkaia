import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import { Heart, Sparkles, UserCircle2 } from "lucide-react";

export default async function WelcomePage() {
  // Check authentication
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-4 selection:bg-pink-500/30 overflow-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-pink-500/10 to-purple-500/10 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-orange-500/10 to-yellow-500/10 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-pink-500/10 overflow-hidden border border-white/20 dark:border-zinc-800/50">
          
          {/* Hero Illustration - CSS / Tailwind Only (Badoo/Bumble Style) */}
          <div className="relative h-72 bg-gradient-to-br from-pink-500 via-rose-400 to-orange-400 overflow-hidden flex items-center justify-center">
             {/* Sparkles */}
            <div className="absolute top-8 left-8 text-white/40 animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="absolute bottom-12 right-12 text-white/40 animate-pulse" style={{ animationDelay: '1s' }}>
              <Sparkles className="w-6 h-6" />
            </div>

            {/* Glowing orbs */}
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/20 rounded-full blur-3xl animate-[spin_10s_linear_infinite]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-[spin_15s_linear_infinite_reverse]" />
            
            {/* CSS Abstract Illustration: Overlapping Profile Cards */}
            <div className="relative z-10 flex items-center justify-center">
              {/* Card 1 (Back left) */}
              <div className="absolute -left-16 rotate-[-12deg] w-32 h-40 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl flex items-center justify-center animate-[bounce_4s_infinite]">
                 <UserCircle2 className="w-16 h-16 text-white/50" />
              </div>
              
              {/* Card 2 (Back right) */}
              <div className="absolute -right-16 rotate-[12deg] w-32 h-40 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl flex items-center justify-center animate-[bounce_5s_infinite_1s]">
                 <UserCircle2 className="w-16 h-16 text-white/50" />
              </div>

              {/* Card 3 (Center Focus) */}
              <div className="relative z-20 w-40 h-52 bg-white/30 backdrop-blur-xl rounded-2xl border-2 border-white/50 shadow-2xl flex flex-col items-center justify-center animate-[bounce_6s_infinite_0.5s]">
                 <div className="w-20 h-20 bg-gradient-to-tr from-white/60 to-white/20 rounded-full border border-white/40 shadow-inner flex items-center justify-center mb-4 backdrop-blur-sm">
                   <Heart className="w-10 h-10 text-white fill-white animate-pulse" />
                 </div>
                 <div className="w-24 h-3 bg-white/40 rounded-full mb-2" />
                 <div className="w-16 h-3 bg-white/30 rounded-full" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 sm:p-10 text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              Qui êtes-<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-400">vous ?</span>
            </h1>
            
            <p className="text-base text-gray-500 dark:text-gray-400 font-medium mb-8 leading-relaxed">
              Démarquez-vous. Remplissez votre profil en quelques étapes simples pour de meilleures rencontres.
            </p>

            {/* CTA Buttons */}
            <div className="space-y-4">
              <Link href="/onboarding/profile" className="block">
                <Button
                  size="lg"
                  className="w-full rounded-full h-14 text-lg font-bold bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white shadow-xl shadow-pink-500/25 transition-all hover:scale-[1.02] active:scale-95"
                >
                  Compléter mon profil
                </Button>
              </Link>

              <form action="/api/profile/skip" method="POST" className="w-full">
                <Button
                  type="submit"
                  variant="ghost"
                  className="w-full rounded-full h-14 text-base font-semibold text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Plus tard
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-sm font-medium text-gray-400 mt-8">
          Prenez votre temps, vous pourrez toujours y revenir.
        </p>
      </div>
    </div>
  );
}