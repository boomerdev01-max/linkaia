"use client";

import { useRouter } from "next/navigation";
import { User, MapPin, Loader2 } from "lucide-react";

interface SearchUser {
  id: string;
  nom: string;
  prenom: string;
  pseudo: string;
  email: string;
  profil?: {
    photo: string | null;
    bio: string | null;
    location: string | null;
  };
}

interface SearchResultsProps {
  users: SearchUser[];
  loading: boolean;
  query: string;
  onClose: () => void;
}

export function SearchResults({
  users,
  loading,
  query,
  onClose,
}: SearchResultsProps) {
  const router = useRouter();

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`);
    onClose();
  };

  if (!query || query.length < 2) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 max-h-125 overflow-y-auto">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#0F4C5C]" />
          <span className="ml-2 text-gray-600">Recherche en cours...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <User className="w-12 h-12 text-gray-300 mb-2" />
          <p className="text-gray-600 font-medium">Aucun utilisateur trouvé</p>
          <p className="text-gray-400 text-sm mt-1">
            Essayez avec un autre terme de recherche
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => handleUserClick(user.id)}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
            >
              {/* Photo de profil */}
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0">
                {user.profil?.photo ? (
                  <img
                    src={user.profil.photo}
                    alt={`${user.prenom} ${user.nom}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-[#0F4C5C] to-[#B88A4F]">
                    <span className="text-white font-semibold text-lg">
                      {user.prenom[0]}
                      {user.nom[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Informations utilisateur */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">
                    {user.prenom} {user.nom}
                  </p>
                  <span className="text-gray-400 text-sm">@{user.pseudo}</span>
                </div>

                {user.profil?.bio && (
                  <p className="text-sm text-gray-600 truncate mt-0.5">
                    {user.profil.bio}
                  </p>
                )}

                {user.profil?.location && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {user.profil.location}
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
