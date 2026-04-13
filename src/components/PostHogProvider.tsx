// src/components/PostHogProvider.tsx
"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Ne s'initialise que côté client, jamais côté serveur
    if (typeof window === "undefined") return;

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
      // Capture automatique des pageviews
      capture_pageview: true,
      // Capture automatique des clics sur les éléments avec data-ph-capture
      autocapture: false, // On gère manuellement pour ne capturer que ce qui compte
      // Ne pas envoyer de données en développement
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") ph.opt_out_capturing();
      },
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}