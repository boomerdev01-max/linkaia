"use client";

import React, { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Send,
  ImageIcon,
  Smile,
  Mic,
  X,
  Paperclip,
  StopCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { Message } from "@/types/chat";

interface MessageInputProps {
  conversationId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserPhoto?: string | null;
  // ✅ Nouveau : séparation optimistic / envoi réel
  onOptimisticMessage: (message: Message) => void; // affichage immédiat
  onConfirmMessage: (tempId: string, realMessage: Message) => void; // confirmation
  onErrorMessage: (tempId: string) => void; // rollback si erreur
  onSendMessage: (
    content: string,
    type: "TEXT" | "MEDIA" | "VOICE" | "MIXED",
    media?: any[],
    replyToId?: string,
  ) => Promise<Message>; // retourne le vrai message
  replyTo?: Message | null;
  onCancelReply?: () => void;
  onTyping?: () => void;
  disabled?: boolean;
}

export function MessageInput({
  conversationId,
  currentUserId,
  currentUserName,
  currentUserPhoto,
  onOptimisticMessage,
  onConfirmMessage,
  onErrorMessage,
  onSendMessage,
  replyTo,
  onCancelReply,
  onTyping,
  disabled,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [pendingMedia, setPendingMedia] = useState<
    {
      file: File;
      preview: string;
      type: string;
    }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Génère un ID temporaire unique pour l'optimistic update
  const generateTempId = () =>
    `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const newMedia: typeof pendingMedia = [];

      for (const file of files) {
        const maxSize = file.type.startsWith("video/")
          ? 50 * 1024 * 1024
          : file.type.startsWith("image/")
            ? 10 * 1024 * 1024
            : file.type.startsWith("audio/")
              ? 5 * 1024 * 1024
              : 20 * 1024 * 1024;

        if (file.size > maxSize) {
          toast.error(`Fichier trop volumineux: ${file.name}`);
          continue;
        }

        const preview =
          file.type.startsWith("image/") || file.type.startsWith("video/")
            ? URL.createObjectURL(file)
            : "";

        newMedia.push({
          file,
          preview,
          type: file.type.startsWith("image/")
            ? "IMAGE"
            : file.type.startsWith("video/")
              ? "VIDEO"
              : file.type.startsWith("audio/")
                ? "AUDIO"
                : "DOCUMENT",
        });
      }

      setPendingMedia((prev) => [...prev, ...newMedia]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [],
  );

  const removePendingMedia = useCallback((index: number) => {
    setPendingMedia((prev) => {
      const item = prev[index];
      if (item.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => stream.getTracks().forEach((t) => t.stop());

      recorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);

      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 120) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      toast.error("Impossible d'accéder au microphone");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (durationIntervalRef.current)
        clearInterval(durationIntervalRef.current);

      setTimeout(() => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice_${Date.now()}.webm`, {
          type: "audio/webm",
        });
        setPendingMedia((prev) => [
          ...prev,
          { file, preview: "", type: "VOICE" },
        ]);
      }, 100);
    }
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingDuration(0);
    chunksRef.current = [];
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
  }, []);

  const uploadMedia = async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversationId", conversationId);

    const response = await fetch("/api/chat/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Erreur upload");
    }
    return response.json();
  };

  const handleSend = useCallback(async () => {
    if (disabled) return;
    const trimmed = message.trim();
    if (!trimmed && pendingMedia.length === 0) return;

    const tempId = generateTempId();
    const now = new Date().toISOString();
    const hasMedia = pendingMedia.length > 0;

    // ── 1. Capture et reset de l'état AVANT tout await ──────────────────
    const contentSnapshot = trimmed;
    const mediaSnapshot = [...pendingMedia];

    setMessage("");
    setPendingMedia([]);
    onCancelReply?.();

    // ── 2. Optimistic update immédiat ────────────────────────────────────
    // Détermination du type pour l'affichage optimistic
    const optimisticType: Message["type"] = hasMedia
      ? mediaSnapshot.some((m) => m.type === "VOICE")
        ? "VOICE"
        : contentSnapshot
          ? "MIXED"
          : "MEDIA"
      : "TEXT";

    const optimisticMessage: Message = {
      id: tempId,
      tempId,
      conversationId,
      content: contentSnapshot || null,
      type: optimisticType,
      isEdited: false,
      isDeleted: false,
      isPinned: false,
      sendStatus: "sending", // ← statut visible dans le fil
      createdAt: now,
      updatedAt: now,
      sender: {
        id: currentUserId,
        nom: currentUserName.split(" ")[1] || currentUserName,
        prenom: currentUserName.split(" ")[0] || "",
        pseudo: null,
        profilePhotoUrl: currentUserPhoto || null,
      },
      media: mediaSnapshot
        .filter((m) => m.preview)
        .map((m, i) => ({
          id: `temp_media_${i}`,
          type: m.type as any,
          url: m.preview, // URL locale temporaire
          filename: m.file.name,
          size: m.file.size,
          mimeType: m.file.type,
        })),
      reactions: [],
      replyTo: replyTo ?? null,
    };

    // Affichage immédiat dans le fil
    onOptimisticMessage(optimisticMessage);

    // ── 3. Upload des médias (en arrière-plan) ───────────────────────────
    try {
      if (hasMedia) setIsUploading(true);

      const uploadedMedia: any[] = [];
      for (const item of mediaSnapshot) {
        const uploaded = await uploadMedia(item.file);
        uploadedMedia.push({
          type: uploaded.type,
          url: uploaded.url,
          filename: uploaded.filename,
          size: uploaded.size,
          mimeType: uploaded.mimeType,
        });
        // Libérer les URLs locales après upload
        if (item.preview) URL.revokeObjectURL(item.preview);
      }

      // ── 4. Envoi vers l'API ──────────────────────────────────────────
      const realMessage = await onSendMessage(
        contentSnapshot,
        optimisticType,
        uploadedMedia.length > 0 ? uploadedMedia : undefined,
        replyTo?.id,
      );

      // ── 5. Remplacement du message optimistic par le vrai ────────────
      onConfirmMessage(tempId, { ...realMessage, sendStatus: "sent" });
    } catch (error) {
      console.error("Erreur envoi message:", error);
      toast.error("Erreur lors de l'envoi");
      // Rollback : marquer le message en erreur
      onErrorMessage(tempId);
    } finally {
      setIsUploading(false);
    }
  }, [
    message,
    pendingMedia,
    conversationId,
    replyTo,
    currentUserId,
    currentUserName,
    currentUserPhoto,
    onOptimisticMessage,
    onConfirmMessage,
    onErrorMessage,
    onSendMessage,
    onCancelReply,
    disabled,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const canSend = (message.trim() || pendingMedia.length > 0) && !disabled;

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">
              Répondre à {replyTo.sender.prenom}
            </p>
            <p className="text-sm text-gray-700 truncate">
              {replyTo.content || "[Média]"}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded hover:bg-gray-200"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}

      {/* Pending media preview */}
      {pendingMedia.length > 0 && (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto bg-gray-50 border-b border-gray-200">
          {pendingMedia.map((item, index) => (
            <div key={index} className="relative shrink-0">
              {item.preview ? (
                <img
                  src={item.preview}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Paperclip className="w-6 h-6 text-gray-500" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removePendingMedia(index)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recording UI */}
      {isRecording && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border-b border-red-100">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm text-red-700 font-medium">
            Enregistrement... {formatDuration(recordingDuration)}
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={cancelRecording}
            className="p-2 rounded-full hover:bg-red-100 text-red-600"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={stopRecording}
            className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
          >
            <StopCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Input area */}
      {!isRecording && (
        <div className="flex items-end gap-2 p-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            disabled={disabled}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            disabled={disabled}
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                onTyping?.();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez un message..."
              disabled={disabled}
              rows={1}
              className={cn(
                "w-full resize-none rounded-2xl border border-gray-200 px-4 py-2.5",
                "focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/20 focus:border-[#0F4C5C]",
                "max-h-32 text-sm",
                disabled && "opacity-50 cursor-not-allowed",
              )}
              style={{ minHeight: "42px" }}
            />
          </div>

          {!canSend ? (
            <button
              type="button"
              onClick={startRecording}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              disabled={disabled}
            >
              <Mic className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={disabled}
              className="p-2 rounded-full bg-[#0F4C5C] text-white hover:bg-[#0F4C5C]/90 transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
