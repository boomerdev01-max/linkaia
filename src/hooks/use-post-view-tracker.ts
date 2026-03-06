// src/hooks/use-post-view-tracker.ts
"use client";

import { useEffect, useRef } from "react";

interface UsePostViewTrackerOptions {
  postId: string;
  /** Délai en ms avant de compter la vue (évite les survols rapides) */
  delay?: number;
  /** Pourcentage de visibilité requis (0.0 → 1.0) */
  threshold?: number;
  /** Désactiver le tracking (ex: si c'est le propre post de l'auteur) */
  disabled?: boolean;
}

/**
 * Hook qui enregistre une vue de post dès que le composant
 * est visible dans le viewport pendant au moins `delay` ms.
 *
 * Utilisation :
 *   const ref = usePostViewTracker({ postId: "abc123" });
 *   return <article ref={ref}>...</article>;
 */
export function usePostViewTracker({
  postId,
  delay = 1500,
  threshold = 0.5,
  disabled = false,
}: UsePostViewTrackerOptions) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const hasTracked = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (disabled || hasTracked.current || !elementRef.current) return;

    const element = elementRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry.isIntersecting) {
          // L'élément est visible → démarrer le timer
          timerRef.current = setTimeout(async () => {
            if (hasTracked.current) return;

            try {
              await fetch(`/api/posts/${postId}/view`, {
                method: "POST",
              });
              hasTracked.current = true;
            } catch {
              // Silencieux — on ne veut pas perturber l'UX
            }
          }, delay);
        } else {
          // L'élément n'est plus visible → annuler le timer
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        }
      },
      { threshold },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [postId, delay, threshold, disabled]);

  return elementRef;
}
