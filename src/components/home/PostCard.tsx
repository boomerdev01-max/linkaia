// components/posts/PostCard.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import {
  MessageCircle,
  Share2,
  Bookmark,
  MoreVertical,
  Trash2,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";
import ReactionButton from "../reactions/ReactionButton";
import CommentSection from "../comments/CommentSection";

interface PostCardProps {
  post: {
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
  };
  currentUserId: string;
  onPostUpdate?: () => void;
  onPostDelete?: () => void;
}

export default function PostCard({
  post,
  currentUserId,
  onPostUpdate,
  onPostDelete,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = post.author.id === currentUserId;

  const handleShare = () => {
    toast.success("Lien de partage copié !");
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast.success(
      isSaved ? "Post retiré des favoris" : "Post ajouté aux favoris"
    );
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette publication ?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Publication supprimée");
        if (onPostDelete) {
          onPostDelete();
        }
      } else {
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
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

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-5">
      {/* En-tête du post */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full border-2 border-[#B88A4F] overflow-hidden bg-linear-to-br from-[#0F4C5C] to-[#B88A4F]">
            {post.author.profil?.profilePhotoUrl ? (
              <Image
                src={post.author.profil.profilePhotoUrl}
                alt={`${post.author.prenom} ${post.author.nom}`}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white font-bold text-base">
                  {post.author.prenom.charAt(0)}
                  {post.author.nom.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white">
              {post.author.prenom} {post.author.nom}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {formatTime(post.createdAt)}
              </span>
              {post.editedAt && (
                <>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500">Modifié</span>
                </>
              )}
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-[#0F4C5C] dark:text-[#B88A4F] font-medium capitalize">
                {post.visibility === "public"
                  ? "Public"
                  : post.visibility === "friends"
                  ? "Amis"
                  : "Privé"}
              </span>
            </div>
          </div>
        </div>

        {/* Options (seulement pour l'auteur) */}
        {isAuthor && (
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showOptions && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <button
                  onClick={() => {
                    setShowOptions(false);
                    toast.info("Fonction d'édition à venir");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Modifier</span>
                </button>
                <button
                  onClick={() => {
                    setShowOptions(false);
                    handleDelete();
                  }}
                  disabled={isDeleting}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Supprimer</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contenu du post */}
      {post.content && (
        <p className="text-gray-800 dark:text-gray-200 mb-4 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {/* Médias */}
      {post.media.length > 0 && (
        <div className="mb-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {post.media[0].type === "photo" ? (
            <div
              className={`grid gap-1 ${
                post.media.length === 1
                  ? "grid-cols-1"
                  : post.media.length === 2
                  ? "grid-cols-2"
                  : post.media.length === 3
                  ? "grid-cols-3"
                  : "grid-cols-2"
              }`}
            >
              {post.media.slice(0, 4).map((media, index) => (
                <div
                  key={media.id}
                  className="relative w-full h-64 bg-gray-100 dark:bg-gray-800"
                >
                  <Image
                    src={media.url}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 555px"
                  />
                  {index === 3 && post.media.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-3xl font-bold">
                        +{post.media.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <video
              src={post.media[0].url}
              controls
              className="w-full max-h-96"
            />
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-3 pb-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          {post._count.reactions > 0 && (
            <span>{post._count.reactions} réactions</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {post._count.comments > 0 && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:underline"
            >
              {post._count.comments} commentaire
              {post._count.comments > 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <ReactionButton
          targetType="post"
          targetId={post.id}
          currentReaction={
            post.userReaction
              ? {
                  code: post.userReaction.type.code,
                  emoji: post.userReaction.type.emoji,
                }
              : null
          }
          reactionCounts={post.reactionCounts}
          onReactionChange={onPostUpdate}
        />

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium text-sm">Commenter</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span className="font-medium text-sm">Partager</span>
        </button>

        <button
          onClick={handleSave}
          className={`p-2 rounded-lg transition-colors ${
            isSaved
              ? "text-[#B88A4F] bg-[#B88A4F]/10"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Section des commentaires */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 animate-in fade-in slide-in-from-top-2 duration-300">
          <CommentSection postId={post.id} currentUserId={currentUserId} />
        </div>
      )}
    </div>
  );
}
