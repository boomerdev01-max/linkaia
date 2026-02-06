import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import Image from "next/image";

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
    <div className="min-h-screen bg-linear-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Hero Illustration - Style Badoo */}
          <div className="relative h-96 bg-linear-to-br from-primary via-secondary/50 to-accent/60 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src="/images/badoo8.png"
                alt="Complete your profile"
                width={400}
                height={400}
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Répondez à quelques petites questions pour remplir votre profil
            </h1>
            
            <p className="text-gray-600 mb-8">
              Cela ne prend que quelques minutes et vous aidera à mieux vous présenter à la communauté.
            </p>

            {/* CTA Buttons */}
            <div className="space-y-4">
              <Link href="/onboarding/profile" className="block">
                <Button
                  size="lg"
                  className="w-full rounded-full text-lg font-semibold h-14 shadow-lg hover:shadow-xl transition-shadow"
                >
                  Commencer
                </Button>
              </Link>

              <form action="/api/profile/skip" method="POST" className="w-full">
                <Button
                  type="submit"
                  variant="ghost"
                  size="lg"
                  className="w-full rounded-full text-gray-600 hover:text-gray-900"
                >
                  Pas maintenant
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Vous pourrez toujours compléter votre profil plus tard
        </p>
      </div>
    </div>
  );
}