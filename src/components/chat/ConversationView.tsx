// components/chat/ConversationView.tsx
"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Phone,
  Video,
  MoreVertical,
  ChevronLeft,
  Search,
  Loader2,
} from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { useMessages } from "@/hooks/use-messages";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import type { ConversationListItem, Message } from "@/types/chat";

interface ConversationViewProps {
  conversation: ConversationListItem;
  currentUserId: string;
  currentUserName: string;
  onBack?: () => void;
  onOpenInfo?: () => void;
}

export function ConversationView({
  conversation,
  currentUserId,
  currentUserName,
  onBack,
  onOpenInfo,
}: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchMessages,
    loadMore,
    addMessage,
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

  useRealtimeMessages({
    conversationId: conversation.id,
    onNewMessage: (message) => {
      if (message.sender.id !== currentUserId) {
        addMessage(message);
      }
    },
    onMessageUpdate: (messageId, updates) => {
      updateMessage(messageId, updates);
    },
    onMessageDelete: (messageId) => {
      removeMessage(messageId);
    },
    onReactionChange: (messageId, reactions) => {
      updateReactions(messageId, reactions);
    },
  });

  // Initial fetch
  useEffect(() => {
    fetchMessages(true);
  }, [conversation.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isNearBottom]);

  // Handle scroll for loading more and tracking position
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Check if near top for loading more
    if (container.scrollTop < 100 && hasMore && !isLoadingMore) {
      loadMore();
    }

    // Check if near bottom
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;
    setIsNearBottom(isAtBottom);
  }, [hasMore, isLoadingMore, loadMore]);

  const handleSendMessage = useCallback(
    async (
      content: string,
      type: "TEXT" | "MEDIA" | "VOICE" | "MIXED",
      media?: any[],
      replyToId?: string,
    ) => {
      stopTyping();
      await sendMessage(content, type, media, replyToId);
      setReplyTo(null);
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

  // Get display info for the conversation
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
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
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
        {/* Loading more indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        )}

        {/* Initial loading */}
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
          <>
            {messages.map((message, index) => {
              const prevMessage = messages[index - 1];
              const showSender =
                isGroup &&
                (!prevMessage || prevMessage.sender.id !== message.sender.id);

              return (
                <MessageBubble
                  key={message.id}
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
            })}
          </>
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator userNames={typingUsers.map((u) => u.userName)} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput
        conversationId={conversation.id}
        onSendMessage={handleSendMessage}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onTyping={startTyping}
      />
    </div>
  );
}
