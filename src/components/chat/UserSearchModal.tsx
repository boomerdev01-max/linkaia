// components/chat/UserSearchModal.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  pseudo: string | null;
  profilePhotoUrl: string | null;
  bio: string | null;
}

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSearchModal({ isOpen, onClose }: UserSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(searchQuery)}`,
      );

      if (!response.ok) {
        throw new Error("Erreur de recherche");
      }

      const data = await response.json();
      setResults(data.users || []);
    } catch (err) {
      setError("Erreur lors de la recherche");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchUsers(query.trim());
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setError(null);
    }
  }, [isOpen]);

  // ✅ FIX: Rediriger vers /profile/[id] au lieu de /user/[id]
  const handleSelectUser = (user: SearchUser) => {
    onClose();
    router.push(`/profile/${user.id}`); // ✅ CORRIGÉ
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Fermer
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#0F4C5C] animate-spin" />
            </div>
          )}

          {error && (
            <div className="p-4 text-center text-red-500 text-sm">{error}</div>
          )}

          {!isLoading &&
            !error &&
            query.length >= 2 &&
            results.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                Aucun utilisateur trouvé
              </div>
            )}

          {!isLoading && results.length > 0 && (
            <div className="py-2">
              {results.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectUser(user)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-[#0F4C5C] flex items-center justify-center overflow-hidden shrink-0">
                    {user.profilePhotoUrl ? (
                      <img
                        src={user.profilePhotoUrl}
                        alt={`${user.prenom} ${user.nom}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-lg">
                        {user.prenom.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">
                      {user.prenom} {user.nom}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {user.pseudo ? `@${user.pseudo}` : user.email}
                    </p>
                    {user.bio && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && query.length < 2 && (
            <div className="p-4 text-center text-gray-400 text-sm">
              Tapez au moins 2 caractères pour rechercher
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
