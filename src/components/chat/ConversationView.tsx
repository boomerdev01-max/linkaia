// components/chat/ConversationView.tsx
"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Phone, Video, MoreVertical, ChevronLeft, Loader2 } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { IncomingCallModal } from "./IncomingCallModal";
import { CallOverlay } from "./CallOverlay";
import { useMessages } from "@/hooks/use-messages";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import { useCall } from "@/hooks/use-call";
import type { ConversationListItem, Message } from "@/types/chat";

interface ConversationViewProps {
  conversation: ConversationListItem;
  currentUserId: string;
  currentUserName: string;
  currentUserPhoto?: string | null;
  onBack?: () => void;
  onOpenInfo?: () => void;
}

export function ConversationView({
  conversation,
  currentUserId,
  currentUserName,
  currentUserPhoto,
  onBack,
  onOpenInfo,
}: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // ── Messages ─────────────────────────────────────────────────────────────
  const {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchMessages,
    loadMore,
    addMessage,
    addOptimisticMessage,
    confirmOptimisticMessage,
    markMessageError,
    fetchSingleMessage,
    updateMessage,
    removeMessage,
    updateReactions,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    pinMessage,
  } = useMessages({ conversationId: conversation.id });

  const { typingUsers, startTyping, stopTyping } = useTypingIndicator({
    conversationId: conversation.id,
    currentUserId,
    currentUserName,
  });

  // ── Appels ──────────────────────────────────────────────────────────────
  // On construit le currentUser à partir des props pour useCall
  const currentUser = {
    id: currentUserId,
    nom: currentUserName.split(" ")[1] || currentUserName,
    prenom: currentUserName.split(" ")[0] || "",
    pseudo: null,
    profilePhotoUrl: currentUserPhoto || null,
  };

  const {
    callSession,
    initiateCall,
    answerCall,
    rejectCall,
    hangUp,
    isIncomingCall,
  } = useCall({
    conversationId: conversation.id,
    currentUser,
    participants: conversation.participants,
  });

  // ── Realtime messages ─────────────────────────────────────────────────
  const handleNewMessage = useCallback(
    (message: Message) => {
      addMessage(message);
    },
    [addMessage],
  );
  const handleMessageUpdate = useCallback(
    (messageId: string, updates: Partial<Message>) => {
      updateMessage(messageId, updates);
    },
    [updateMessage],
  );
  const handleMessageDelete = useCallback(
    (messageId: string) => {
      removeMessage(messageId);
    },
    [removeMessage],
  );
  const handleReactionChange = useCallback(
    (messageId: string, reactions: Message["reactions"]) => {
      updateReactions(messageId, reactions);
    },
    [updateReactions],
  );

  useRealtimeMessages({
    conversationId: conversation.id,
    currentUserId,
    onNewMessage: handleNewMessage,
    onMessageUpdate: handleMessageUpdate,
    onMessageDelete: handleMessageDelete,
    onReactionChange: handleReactionChange,
    onFetchSingleMessage: fetchSingleMessage,
  });

  // Initial fetch
  useEffect(() => {
    fetchMessages(true);
  }, [conversation.id]);

  // Scroll to bottom
  useEffect(() => {
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isNearBottom]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    if (container.scrollTop < 100 && hasMore && !isLoadingMore) loadMore();
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;
    setIsNearBottom(isAtBottom);
  }, [hasMore, isLoadingMore, loadMore]);

  // ── Handlers optimistic ───────────────────────────────────────────────
  const handleOptimisticMessage = useCallback(
    (message: Message) => {
      addOptimisticMessage(message);
    },
    [addOptimisticMessage],
  );
  const handleConfirmMessage = useCallback(
    (tempId: string, realMessage: Message) => {
      confirmOptimisticMessage(tempId, realMessage);
    },
    [confirmOptimisticMessage],
  );
  const handleErrorMessage = useCallback(
    (tempId: string) => {
      markMessageError(tempId);
    },
    [markMessageError],
  );

  const handleSendMessage = useCallback(
    async (
      content: string,
      type: "TEXT" | "MEDIA" | "VOICE" | "MIXED",
      media?: any[],
      replyToId?: string,
    ): Promise<Message> => {
      stopTyping();
      const message = await sendMessage(content, type, media, replyToId);
      setReplyTo(null);
      return message;
    },
    [sendMessage, stopTyping],
  );

  const handleEditMessage = useCallback(
    async (messageId: string, content: string) => {
      await editMessage(messageId, content);
      setEditingMessage(null);
    },
    [editMessage],
  );

  // ── Display info ──────────────────────────────────────────────────────
  const otherParticipant =
    conversation.type === "direct"
      ? conversation.participants.find((p) => p.userId !== currentUserId)?.user
      : null;

  const displayName =
    conversation.type === "direct" && otherParticipant
      ? otherParticipant.pseudo ||
        `${otherParticipant.prenom} ${otherParticipant.nom}`
      : conversation.name;

  const displayAvatar =
    conversation.type === "direct" && otherParticipant
      ? otherParticipant.profilePhotoUrl
      : conversation.avatarUrl;

  const isGroup = conversation.type === "group";

  // ── Boutons d'appel désactivés si un appel est déjà en cours ─────────
  const callActive =
    callSession !== null &&
    callSession.status !== "ended" &&
    callSession.status !== "idle";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 lg:hidden"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}

        <div
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
          onClick={onOpenInfo}
        >
          <div className="w-10 h-10 rounded-full bg-[#0F4C5C] flex items-center justify-center overflow-hidden shrink-0">
            {displayAvatar ? (
              <img
                src={displayAvatar || "/placeholder.svg"}
                alt={displayName || ""}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold">
                {displayName?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">
              {displayName}
            </h2>
            {isGroup && (
              <p className="text-xs text-gray-500">
                {conversation.participants.length} participants
              </p>
            )}
            {/* Indicateur "appel en cours" dans le header */}
            {callActive && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                {callSession?.status === "calling"
                  ? "Appel en cours…"
                  : callSession?.status === "connected"
                    ? "En communication"
                    : ""}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Bouton appel audio */}
          <button
            type="button"
            onClick={() => initiateCall("audio")}
            disabled={callActive}
            title="Appel audio"
            className={
              callActive
                ? "p-2 rounded-full text-gray-300 cursor-not-allowed"
                : "p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
            }
          >
            <Phone className="w-5 h-5" />
          </button>

          {/* Bouton appel vidéo */}
          <button
            type="button"
            onClick={() => initiateCall("video")}
            disabled={callActive}
            title="Appel vidéo"
            className={
              callActive
                ? "p-2 rounded-full text-gray-300 cursor-not-allowed"
                : "p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
            }
          >
            <Video className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onOpenInfo}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 bg-linear-to-b from-slate-50 to-slate-100"
      >
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-[#0F4C5C] animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p>Aucun message</p>
            <p className="text-sm">Commencez la conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const showSender =
              isGroup &&
              (!prevMessage || prevMessage.sender.id !== message.sender.id);

            return (
              <MessageBubble
                key={message.tempId ?? message.id}
                message={message}
                isOwnMessage={message.sender.id === currentUserId}
                showSender={showSender}
                currentUserId={currentUserId}
                onReact={(emoji) => toggleReaction(message.id, emoji)}
                onEdit={() => setEditingMessage(message)}
                onDelete={() => deleteMessage(message.id)}
                onPin={() => pinMessage(message.id, !message.isPinned)}
                onReply={() => setReplyTo(message)}
              />
            );
          })
        )}

        {typingUsers.length > 0 && (
          <TypingIndicator userNames={typingUsers.map((u) => u.userName)} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* MessageInput */}
      <MessageInput
        conversationId={conversation.id}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserPhoto={currentUserPhoto}
        onOptimisticMessage={handleOptimisticMessage}
        onConfirmMessage={handleConfirmMessage}
        onErrorMessage={handleErrorMessage}
        onSendMessage={handleSendMessage}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onTyping={startTyping}
      />

      {/* ── Appel entrant (popup par-dessus tout) ── */}
      {isIncomingCall && callSession && (
        <IncomingCallModal
          callSession={callSession}
          onAnswer={answerCall}
          onReject={rejectCall}
        />
      )}

      {/* ── Appel en cours (overlay plein écran) ── */}
      {callSession &&
        (callSession.status === "calling" ||
          callSession.status === "connected") && (
          <CallOverlay
            callSession={callSession}
            currentUserId={currentUserId}
            onHangUp={() => hangUp("hangup")}
          />
        )}
    </div>
  );
}
