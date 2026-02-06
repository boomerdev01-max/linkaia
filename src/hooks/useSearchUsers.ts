// src/hooks/useSearchUsers.ts
"use client";

import { useState, useCallback, useEffect } from "react";

interface SearchUser {
  id: string;
  nom: string;
  prenom: string;
  pseudo: string;
  email: string;
  profil: {
    photo: string | null;
    bio: string | null;
    location: string | null;
  };
}

export function useSearchUsers() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(searchQuery.trim())}`
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la recherche");
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err: any) {
      console.error("❌ Error searching users:", err);
      setError(err.message || "Erreur lors de la recherche");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  return {
    query,
    setQuery,
    users,
    loading,
    error,
  };
}
