// src/hooks/usePostHogTracking.ts
"use client";

import { usePostHog } from "posthog-js/react";
import { useCallback } from "react";

export function usePostHogTracking() {
  const posthog = usePostHog();

  const trackPostView = useCallback(
    (postId: string, categoryCode?: string | null) => {
      posthog?.capture("post_viewed", {
        post_id: postId,
        category_code: categoryCode ?? null,
      });
    },
    [posthog],
  );

  const trackPostReaction = useCallback(
    (postId: string, reactionCode: string, categoryCode?: string | null) => {
      posthog?.capture("post_reacted", {
        post_id: postId,
        reaction_code: reactionCode,
        category_code: categoryCode ?? null,
      });
    },
    [posthog],
  );

  const trackPostComment = useCallback(
    (postId: string, categoryCode?: string | null) => {
      posthog?.capture("post_commented", {
        post_id: postId,
        category_code: categoryCode ?? null,
      });
    },
    [posthog],
  );

  const trackProfileView = useCallback(
    (profileId: string) => {
      posthog?.capture("profile_viewed", { profile_id: profileId });
    },
    [posthog],
  );

  const trackMatchComputed = useCallback(
    (computed: number, hasMore: boolean) => {
      posthog?.capture("match_batch_computed", { computed, has_more: hasMore });
    },
    [posthog],
  );

  const identifyUser = useCallback(
    (userId: string, properties?: Record<string, unknown>) => {
      posthog?.identify(userId, properties);
    },
    [posthog],
  );

  return {
    trackPostView,
    trackPostReaction,
    trackPostComment,
    trackProfileView,
    trackMatchComputed,
    identifyUser,
  };
}
