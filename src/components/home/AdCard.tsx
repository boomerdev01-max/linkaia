// src/components/home/AdCard.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ExternalLink, Megaphone } from "lucide-react";

interface AdCreative {
  title: string;
  body: string;
  imageUrl: string | null;
  ctaLabel: string;
  ctaUrl: string | null;
  targetProfileId: string | null;
}

interface AdCardProps {
  campaignId: string;
  creative: AdCreative;
  objective: string;
  billingModel: string;
  feedPosition: number;
}

export default function AdCard({
  campaignId,
  creative,
  objective,
  billingModel,
  feedPosition,
}: AdCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const hasTrackedImpression = useRef(false);
  const [isVisible, setIsVisible] = useState(false);

  // ── Tracking impression via IntersectionObserver (comme les posts) ──────────
  useEffect(() => {
    if (hasTrackedImpression.current) return;

    const element = cardRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Délai de 1s pour s'assurer que c'est une vraie vue
          setTimeout(async () => {
            if (hasTrackedImpression.current) return;
            hasTrackedImpression.current = true;
            try {
              await fetch("/api/ads/track/impression", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ campaignId, feedPosition }),
              });
            } catch {
              // silencieux
            }
          }, 1000);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [campaignId, feedPosition]);

  // ── Gestion du clic ──────────────────────────────────────────────────────────
  const handleCta = async () => {
    const destination =
      objective === "profile_visit" && creative.targetProfileId
        ? `/user/${creative.targetProfileId}`
        : (creative.ctaUrl ?? "#");

    // Tracker le clic
    try {
      await fetch("/api/ads/track/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, destination }),
      });
    } catch {
      // silencieux
    }

    // Navigation
    if (objective === "profile_visit" && creative.targetProfileId) {
      router.push(destination);
    } else if (creative.ctaUrl) {
      window.open(creative.ctaUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      ref={cardRef}
      className={`
        bg-white dark:bg-gray-900 rounded-xl shadow-sm
        border border-[#B88A4F]/30 dark:border-[#B88A4F]/20
        p-5 relative overflow-hidden
        transition-opacity duration-500
        ${isVisible ? "opacity-100" : "opacity-0"}
      `}
    >
      {/* Indicateur "Sponsorisé" */}
      <div className="flex items-center gap-1.5 mb-4">
        <Megaphone className="w-3.5 h-3.5 text-[#B88A4F]" />
        <span className="text-xs font-semibold text-[#B88A4F] tracking-wide uppercase">
          Sponsorisé
        </span>
      </div>

      {/* Contenu principal */}
      <div className="flex flex-col gap-3">
        {/* Image créative (si présente) */}
        {creative.imageUrl && (
          <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            <Image
              src={creative.imageUrl}
              alt={creative.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 555px"
            />
          </div>
        )}

        {/* Texte */}
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug">
            {creative.title}
          </h3>
          {creative.body && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 leading-relaxed line-clamp-3">
              {creative.body}
            </p>
          )}
        </div>

        {/* Bouton CTA */}
        <button
          onClick={handleCta}
          className="
            flex items-center justify-center gap-2
            w-full py-2.5 px-4 rounded-lg
            bg-[#0F4C5C] hover:bg-[#0a3540]
            text-white font-semibold text-sm
            transition-colors duration-200
            mt-1
          "
        >
          <span>{creative.ctaLabel}</span>
          {objective === "external_url" && (
            <ExternalLink className="w-4 h-4 opacity-80" />
          )}
        </button>
      </div>

      {/* Bordure décorative gauche subtile */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-linear-to-b from-[#B88A4F]/60 via-[#B88A4F]/20 to-transparent rounded-l-xl" />
    </div>
  );
}
