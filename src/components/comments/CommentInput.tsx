// components/comments/CommentInput.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CommentInputProps {
  postId: string;
  parentId?: string | null;
  currentUserId: string;
  onCommentAdded?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function CommentInput({
  postId,
  parentId = null,
  currentUserId,
  onCommentAdded,
  placeholder = "Ajouter un commentaire...",
  autoFocus = false,
}: CommentInputProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          content: content.trim(),
          parentId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Commentaire ajouté !");
        setContent("");
        if (onCommentAdded) {
          onCommentAdded();
        }
      } else {
        toast.error(data.error || "Erreur lors de l'ajout du commentaire");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Erreur lors de l'ajout du commentaire");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2">
      {/* Avatar de l'utilisateur courant */}
      <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] flex items-center justify-center shrink-0">
        <span className="text-white font-bold text-xs">U</span>
      </div>

      {/* Input */}
      <div className="flex-1 relative">
        <textarea
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={isSubmitting}
          className="w-full px-4 py-2 pr-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/50 text-sm resize-none disabled:opacity-50"
          style={{
            minHeight: "40px",
            maxHeight: "120px",
          }}
        />

        {/* Bouton submit */}
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-[#0F4C5C] hover:bg-[#0a3540] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </div>
    </form>
  );
}
