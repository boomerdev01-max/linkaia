// src/components/home/MainFeed.tsx
"use client";

import { useState, useEffect } from "react";
import PostComposer from "./PostComposer";
import StoryCarousel from "./StoryCarousel";
import PostCard from "./PostCard";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  nom: string;
  prenom: string;
  pseudo: string;
  email: string;
  image?: string | null;
}

interface Post {
  id: string;
  content: string | null;
  visibility: string;
  createdAt: string;
  editedAt: string | null;
  author: {
    id: string;
    nom: string;
    prenom: string;
    profil: {
      pseudo: string | null;
      profilePhotoUrl: string | null;
    } | null;
  };
  media: Array<{
    id: string;
    type: string;
    url: string;
    order: number;
  }>;
  userReaction: {
    id: string;
    type: {
      code: string;
      emoji: string;
      label: string;
    };
  } | null;
  reactionCounts: Record<string, number>;
  _count: {
    reactions: number;
    comments: number;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface PostsResponse {
  success: boolean;
  data: {
    posts: Post[];
    pagination: PaginationInfo;
  };
}

interface MainFeedProps {
  user: User;
}

export default function MainFeed({ user }: MainFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = async (page = 1, loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`/api/posts?page=${page}&limit=5`);

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data: PostsResponse = await response.json();

      if (data.success && data.data) {
        if (loadMore) {
          setPosts((prev) => [...prev, ...data.data.posts]);
        } else {
          setPosts(data.data.posts);
        }
        setPagination(data.data.pagination);
      } else {
        setError("Erreur lors du chargement des posts");
      }
    } catch (err) {
      console.error("Erreur lors du chargement des posts:", err);
      setError("Impossible de charger les publications");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts(1, false);
  }, []);

  const handlePostCreated = () => {
    fetchPosts(1, false); // Rafraîchir depuis la page 1
  };

  const handlePostUpdate = () => {
    fetchPosts(1, false); // Rafraîchir pour voir les changements
  };

  const handlePostDelete = (deletedPostId: string) => {
    setPosts((prevPosts) =>
      prevPosts.filter((post) => post.id !== deletedPostId)
    );
  };

  const loadMorePosts = () => {
    if (pagination.hasMore && !loadingMore) {
      fetchPosts(pagination.page + 1, true);
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <PostComposer user={user} onPostCreated={handlePostCreated} />
        <StoryCarousel user={user} />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 animate-pulse"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 w-full bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="h-48 bg-gray-300 dark:bg-gray-700 rounded-lg mb-4"></div>
              <div className="flex justify-between">
                <div className="h-8 w-24 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-8 w-24 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-8 w-24 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full space-y-6">
        <PostComposer user={user} onPostCreated={handlePostCreated} />
        <StoryCarousel user={user} />
        <div className="text-center py-10">
          <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => fetchPosts(1, false)}
            className="px-4 py-2 bg-[#0F4C5C] text-white rounded-lg hover:bg-[#0F4C5C]/90 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Composer de post */}
      <PostComposer user={user} onPostCreated={handlePostCreated} />

      {/* Stories */}
      <StoryCarousel user={user} />

      {/* Liste des posts */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Aucune publication pour le moment
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Soyez le premier à publier quelque chose !
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user.id}
              onPostUpdate={handlePostUpdate}
              onPostDelete={() => handlePostDelete(post.id)}
            />
          ))
        )}
      </div>

      {/* Load more avec pagination */}
      {pagination.hasMore && posts.length > 0 && (
        <div className="text-center py-6">
          <button
            onClick={loadMorePosts}
            disabled={loadingMore}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Chargement...
              </>
            ) : (
              "Charger plus de publications"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
