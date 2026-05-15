// src/components/home/HomeClient.tsx
"use client";

import Header from "./Header";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import MainFeed from "./MainFeed";
import { LiaButton } from "@/components/lia/LiaButton";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePostHogTracking } from "@/hooks/usePostHogTracking";

interface User {
  id: string;
  nom: string;
  prenom: string;
  pseudo: string;
  email: string;
  image?: string | null;
  roles?: string[];
  // ✅ NOUVEAU
  isCompanyUser?: boolean;
}

interface HomeClientProps {
  user: User;
}

export default function HomeClient({ user }: HomeClientProps) {
  const router = useRouter();
  const { identifyUser } = usePostHogTracking();

  useEffect(() => {
    if (!user?.id) {
      router.push("/signin");
      return;
    }

    identifyUser(user.id, {
      level: (user as any).level,
      prenom: user.prenom,
    });
  }, [user, router, identifyUser]);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* ✅ isCompanyUser propagé au Header */}
      <Header user={user} isCompanyUser={user.isCompanyUser ?? false} />

      <div className="flex pt-16 justify-center">
        <div
          className="hidden md:block fixed left-0 top-16 bottom-0"
          style={{ width: "282px" }}
        >
          <LeftSidebar user={user} />
        </div>

        <main
          className="w-full md:ml-70.5 lg:mr-73 min-h-[calc(100vh-80px)]"
          style={{ maxWidth: "555px", width: "90%" }}
        >
          <div className="p-4 lg:p-6 h-full">
            <MainFeed user={user} />
          </div>
        </main>

        <div
          className="hidden lg:block fixed right-0 top-16 bottom-0"
          style={{ width: "292px" }}
        >
          <RightSidebar user={user} />
        </div>
      </div>

      <LiaButton />
    </div>
  );
}
