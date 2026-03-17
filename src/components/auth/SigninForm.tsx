"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, CircleCheck, Eye, EyeOff } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

const testimonials = [
  {
    quote:
      "L'authentification la plus rapide que j'ai jamais utilisée. Sécurisé et élégant !",
    author: "@alex_cto",
  },
  {
    quote:
      "Connexion instantanée avec Google. Plus besoin de se souvenir de mots de passe complexes.",
    author: "@emma_product",
  },
];

export default function SigninPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleSignin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error("Erreur lors de la connexion avec Google");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = "L'email est requis";
    if (!formData.password) newErrors.password = "Le mot de passe est requis";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needsVerification) {
          toast.error("Veuillez vérifier votre email avant de vous connecter");
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
          return;
        }

        toast.error(data.error || "Erreur lors de la connexion");
        return;
      }

      toast.success("Connexion réussie !");
      router.push("/home");
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950 font-sans selection:bg-pink-500/30">
      {/* Left Side - Form */}
      <div className="relative flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24 overflow-hidden">
        {/* Ambient Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-linear-to-br from-pink-500/10 to-purple-500/10 blur-[100px]" />
          <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] rounded-full bg-linear-to-br from-orange-500/10 to-yellow-500/10 blur-[100px]" />
        </div>

        <div className="mx-auto w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Bon <span className="text-transparent bg-clip-text bg-linear-to-rpink-500 to-orange-400">retour !</span>
            </h1>
            <p className="mt-3 text-base text-gray-500 dark:text-gray-400 font-medium">
              Connectez-vous à votre compte {process.env.NEXT_PUBLIC_APP_NAME || "Linkaïa"}.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full h-14 text-base font-medium transition-all hover:bg-gray-50 dark:hover:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-800 hover:border-gray-300 shadow-sm hover:scale-[1.02] active:scale-95"
            onClick={handleGoogleSignin}
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuer avec Google
          </Button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-zinc-950 px-4 text-gray-400 font-semibold tracking-wider">
                ou avec votre email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5 group">
              <Label htmlFor="email" className={`text-sm font-semibold transition-colors ml-1 ${errors.email ? "text-red-500" : "text-gray-700 dark:text-gray-300 group-focus-within:text-pink-500"}`}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`h-12 rounded-2xl bg-gray-50/50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 px-4 transition-all focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 ${errors.email ? "border-red-500 ring-red-500/20 focus:border-red-500" : ""}`}
                disabled={loading}
              />
              {errors.email && <p className="text-xs text-red-500 ml-1 font-medium animate-in fade-in slide-in-from-top-1">{errors.email}</p>}
            </div>

            <div className="space-y-1.5 group">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className={`text-sm font-semibold transition-colors ${errors.password ? "text-red-500" : "text-gray-700 dark:text-gray-300 group-focus-within:text-pink-500"}`}>
                  Mot de passe
                </Label>
                <Link href="/forgot-password" className="text-sm font-medium text-pink-500 hover:text-pink-600 transition-colors hover:underline underline-offset-4">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`h-12 rounded-2xl bg-gray-50/50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 px-4 pr-12 transition-all focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 ${errors.password ? "border-red-500 ring-red-500/20 focus:border-red-500" : ""}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 ml-1 font-medium animate-in fade-in slide-in-from-top-1">{errors.password}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full mt-2 rounded-full h-14 text-lg font-bold bg-linear-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white shadow-xl shadow-pink-500/25 transition-all hover:scale-[1.02] active:scale-95" 
              disabled={loading}
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
            Vous n'avez pas encore de compte ?{" "}
            <Link href="/signup" className="font-bold text-pink-500 hover:text-pink-600 transition-colors hover:underline underline-offset-4">
              Inscrivez-vous ici
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Testimonials (Badoo/Bumble Style) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-16 overflow-hidden bg-linear-to-br from-purple-500 via-pink-400 to-rose-400">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-black/5 mix-blend-overlay"></div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-orange-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="absolute left-[15%] top-[20%] w-24 h-24 rounded-full border border-white/30 bg-white/10 backdrop-blur-md shadow-2xl animate-[bounce_4s_infinite]" />
        <div className="absolute right-[20%] top-[30%] w-16 h-16 rounded-full border border-white/20 bg-white/5 backdrop-blur-md shadow-2xl animate-[bounce_5s_infinite_1s]">
          <div className="w-full h-full flex items-center justify-center text-white/50">
            <Lock className="w-6 h-6" />
          </div>
        </div>
        <div className="absolute left-[25%] bottom-[25%] w-32 h-32 rounded-full border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl animate-[bounce_6s_infinite_0.5s]" />
        
        <div className="relative z-10 w-full max-w-lg">
          {/* Glassmorphism Testimonial Card */}
          <div className="rounded-[2.5rem] bg-white/10 p-12 backdrop-blur-xl border border-white/20 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-right-8 duration-1000">
            <div className="mb-6 text-7xl text-white/40 font-serif leading-none">"</div>
            <blockquote className="space-y-8">
              <p className="text-2xl font-medium leading-relaxed text-white">
                {testimonials[currentTestimonial].quote}
              </p>
              <footer className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-tr from-white/40 to-white/10 text-2xl font-bold text-white shadow-inner border border-white/30 backdrop-blur-md">
                  {testimonials[currentTestimonial].author.charAt(1).toUpperCase()}
                </div>
                <div>
                  <div className="text-xl font-bold text-white tracking-wide">
                    {testimonials[currentTestimonial].author}
                  </div>
                  <div className="text-sm text-white/70 font-medium flex items-center gap-1 mt-1">
                    <CircleCheck className="w-4 h-4" /> Membre vérifié
                  </div>
                </div>
              </footer>
            </blockquote>

            {/* Dots indicator */}
            <div className="mt-12 flex gap-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`h-2.5 rounded-full transition-all duration-500 ease-in-out ${
                    index === currentTestimonial
                      ? "w-10 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                      : "w-2.5 bg-white/30 hover:bg-white/50"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}