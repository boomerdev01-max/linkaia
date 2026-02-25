// src/components/discover/DiscoverClient.tsx
"use client";

import Header from "@/components/home/Header";
import LeftSidebar from "@/components/home/LeftSidebar";
import DiscoverFeed from "./DiscoverFeed";
import DiscoverRightSidebar from "./DiscoverRightSidebar";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  nom: string;
  prenom: string;
  pseudo: string;
  email: string;
  image?: string | null;
  roles?: string[];
}

interface DiscoverClientProps {
  user: User;
}

export default function DiscoverClient({ user }: DiscoverClientProps) {
  const router = useRouter();

  useEffect(() => {
    if (!user?.id) {
      router.push("/signin");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header user={user} />

      <div className="flex pt-16 justify-center">
        {/* LeftSidebar - 282px fixe */}
        <div
          className="hidden md:block fixed left-0 top-16 bottom-0"
          style={{ width: "282px" }}
        >
          <LeftSidebar user={user} />
        </div>

        {/* DiscoverFeed - Largeur ajustable */}
        <main
          className="w-full md:ml-70.5 lg:mr-73 min-h-[calc(100vh-80px)]"
          style={{
            maxWidth: "555px",
            width: "90%",
          }}
        >
          <div className="p-4 lg:p-6 h-full">
            <DiscoverFeed user={user} />
          </div>
        </main>

        {/* DiscoverRightSidebar - 292px fixe */}
        <div
          className="hidden lg:block fixed right-0 top-16 bottom-0"
          style={{ width: "292px" }}
        >
          <DiscoverRightSidebar user={user} />
        </div>
      </div>
    </div>
  );
}