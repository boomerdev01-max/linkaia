// components/comments/CommentItem.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { MoreVertical, Trash2, Edit2, CornerDownRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ReactionButton from "../reactions/ReactionButton";
import CommentInput from "./CommentInput";

interface CommentItemProps {
  comment: {
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
  };
  postId: string;
  currentUserId: string;
  level?: number; // Pour la profondeur du threading
  onCommentUpdate?: () => void;
}

export default function CommentItem({
  comment,
  postId,
  currentUserId,
  level = 0,
  onCommentUpdate,
}: CommentItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = comment.author.id === currentUserId;
  const hasReplies = comment._count.replies > 0;

  const fetchReplies = async () => {
    if (replies.length > 0) {
      setShowReplies(!showReplies);
      return;
    }

    setIsLoadingReplies(true);
    try {
      const response = await fetch(
        `/api/comments?postId=${postId}&parentId=${comment.id}&limit=50`
      );
      const data = await response.json();

      if (data.success) {
        setReplies(data.data.comments);
        setShowReplies(true);
      }
    } catch (error) {
      console.error("Error fetching replies:", error);
      toast.error("Erreur lors du chargement des réponses");
    } finally {
      setIsLoadingReplies(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Commentaire supprimé");
        if (onCommentUpdate) {
          onCommentUpdate();
        }
      } else {
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReplyAdded = () => {
    setShowReplyInput(false);
    // Rafraîchir les réponses
    setReplies([]);
    fetchReplies();
    if (onCommentUpdate) {
      onCommentUpdate();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  // Indentation basée sur le niveau (max 3 niveaux)
  const maxLevel = 3;
  const displayLevel = Math.min(level, maxLevel);
  const marginLeft = displayLevel * 48; // 48px par niveau

  return (
    <div style={{ marginLeft: `${marginLeft}px` }}>
      {/* Tree line indicator */}
      {level > 0 && (
        <div className="flex items-start gap-2 mb-2">
          <div className="w-6 border-l-2 border-b-2 border-gray-300 dark:border-gray-700 h-6 rounded-bl-lg" />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative w-8 h-8 rounded-full border border-[#B88A4F] overflow-hidden bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] shrink-0">
          {comment.author.profil?.profilePhotoUrl ? (
            <Image
              src={comment.author.profil.profilePhotoUrl}
              alt={`${comment.author.prenom} ${comment.author.nom}`}
              fill
              className="object-cover"
              sizes="32px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">
                {comment.author.prenom.charAt(0)}
                {comment.author.nom.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Comment content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              {comment.author.prenom} {comment.author.nom}
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(comment.createdAt)}
            </span>
            {comment.editedAt && (
              <span className="text-xs text-gray-500">(modifié)</span>
            )}

            {/* Options (seulement pour l'auteur) */}
            {isAuthor && (
              <div className="ml-auto relative">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showOptions && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                    <button
                      onClick={() => {
                        setShowOptions(false);
                        toast.info("Fonction d'édition à venir");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left text-sm"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Modifier</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowOptions(false);
                        handleDelete();
                      }}
                      disabled={isDeleting}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors text-left text-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <p className="text-sm text-gray-800 dark:text-gray-200 mb-2 whitespace-pre-wrap">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ReactionButton
              targetType="comment"
              targetId={comment.id}
              currentReaction={
                comment.userReaction
                  ? {
                      code: comment.userReaction.type.code,
                      emoji: comment.userReaction.type.emoji,
                    }
                  : null
              }
              reactionCounts={comment.reactionCounts}
              onReactionChange={onCommentUpdate}
            />

            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-[#0F4C5C] dark:hover:text-[#B88A4F] transition-colors"
            >
              <CornerDownRight className="w-3 h-3" />
              Répondre
            </button>

            {hasReplies && (
              <button
                onClick={fetchReplies}
                disabled={isLoadingReplies}
                className="flex items-center gap-1 text-xs font-medium text-[#0F4C5C] dark:text-[#B88A4F] hover:underline"
              >
                {isLoadingReplies ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    {showReplies ? "Masquer" : "Afficher"} {comment._count.replies}{" "}
                    réponse{comment._count.replies > 1 ? "s" : ""}
                  </>
                )}
              </button>
            )}
          </div>

          {/* Reply input */}
          {showReplyInput && (
            <div className="mt-3">
              <CommentInput
                postId={postId}
                parentId={comment.id}
                currentUserId={currentUserId}
                onCommentAdded={handleReplyAdded}
                placeholder={`Répondre à ${comment.author.prenom}...`}
                autoFocus
              />
            </div>
          )}

          {/* Replies (recursive) */}
          {showReplies && replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  currentUserId={currentUserId}
                  level={level + 1}
                  onCommentUpdate={onCommentUpdate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}