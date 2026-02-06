// src/components/UserProfileButton.tsx
"use client";

import { User } from "@/types/user";
import Image from "next/image";

interface UserProfileButtonProps {
  user: User;
}

export default function UserProfileButton({ user }: UserProfileButtonProps) {
  return (
    <button className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#B88A4F] hover:opacity-80 transition-opacity">
      {user.image ? (
        <Image
          src={user.image}
          alt={`${user.prenom} ${user.nom}`}
          width={40}
          height={40}
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full bg-[#B88A4F] flex items-center justify-center text-white font-semibold">
          {user.prenom[0]}
          {user.nom[0]}
        </div>
      )}
    </button>
  );
}
