// components/comments/CommentSection.tsx
"use client";

import { useState, useEffect } from "react";
import CommentItem from "./CommentItem";
import CommentInput from "./CommentInput";
import { Loader2 } from "lucide-react";

interface Comment {
  id: string;
  content: string;
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
    replies: number;
  };
}

interface CommentSectionProps {
  postId: string;
  currentUserId: string;
}

export default function CommentSection({
  postId,
  currentUserId,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchComments = async (pageNum: number = 1) => {
    try {
      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await fetch(
        `/api/comments?postId=${postId}&page=${pageNum}&limit=3`
      );
      const data = await response.json();

      if (data.success) {
        if (pageNum === 1) {
          setComments(data.data.comments);
        } else {
          setComments((prev) => [...prev, ...data.data.comments]);
        }
        setHasMore(data.data.pagination.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleCommentAdded = () => {
    // Rafraîchir la liste des commentaires
    fetchComments(1);
  };

  const handleLoadMore = () => {
    fetchComments(page + 1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#0F4C5C]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Input pour nouveau commentaire */}
      <CommentInput
        postId={postId}
        currentUserId={currentUserId}
        onCommentAdded={handleCommentAdded}
      />

      {/* Liste des commentaires */}
      {comments.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          Aucun commentaire pour le moment. Soyez le premier à commenter !
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              currentUserId={currentUserId}
              onCommentUpdate={handleCommentAdded}
            />
          ))}
        </div>
      )}

      {/* Bouton "Charger plus" */}
      {hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={isLoadingMore}
          className="w-full py-2 text-sm font-medium text-[#0F4C5C] dark:text-[#B88A4F] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoadingMore ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement...
            </span>
          ) : (
            "Voir plus de commentaires"
          )}
        </button>
      )}
    </div>
  );
}
