// hooks/use-typing-indicator.ts
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

interface UseTypingIndicatorProps {
  conversationId: string;
  currentUserId: string;
  currentUserName: string;
}

const TYPING_TIMEOUT = 3000;

export function useTypingIndicator({
  conversationId,
  currentUserId,
  currentUserName,
}: UseTypingIndicatorProps) {
  const supabase = getSupabaseBrowserClient();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const presenceChannel = supabase.channel(
      `presence:conversation:${conversationId}`,
      {
        config: {
          presence: {
            key: currentUserId,
          },
        },
      },
    );

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const typing: TypingUser[] = [];

        Object.keys(state).forEach((key) => {
          const presences = state[key];
          presences.forEach((presence: any) => {
            if (
              presence.userId !== currentUserId &&
              presence.isTyping &&
              Date.now() - presence.timestamp < TYPING_TIMEOUT
            ) {
              typing.push({
                userId: presence.userId,
                userName: presence.userName,
                timestamp: presence.timestamp,
              });
            }
          });
        });

        setTypingUsers(typing);
      })
      .subscribe();

    channelRef.current = presenceChannel;

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [conversationId, currentUserId, supabase]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers((current) =>
        current.filter((user) => Date.now() - user.timestamp < TYPING_TIMEOUT),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const startTyping = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;

    channel.track({
      userId: currentUserId,
      userName: currentUserName,
      isTyping: true,
      timestamp: Date.now(),
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, TYPING_TIMEOUT);
  }, [currentUserId, currentUserName]);

  const stopTyping = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;

    channel.track({
      userId: currentUserId,
      userName: currentUserName,
      isTyping: false,
      timestamp: Date.now(),
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [currentUserId, currentUserName]);

  return {
    typingUsers,
    startTyping,
    stopTyping,
  };
}
