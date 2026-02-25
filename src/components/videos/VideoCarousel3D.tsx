"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Play,
  Pause,
} from "lucide-react";

interface VideoItem {
  id: number;
  src: string;
  title: string;
  description: string;
}

const videos: VideoItem[] = [
  {
    id: 1,
    src: "/videos/vid1.mp4",
    title: "Moment captivant",
    description: "Tendance",
  },
  {
    id: 2,
    src: "/videos/vid2.mp4",
    title: "Nouvelle vibe",
    description: "Populaire",
  },
  {
    id: 3,
    src: "/videos/vid3.mp4",
    title: "Vibes nocturnes",
    description: "Viral",
  },
  {
    id: 4,
    src: "/videos/vid4.mp4",
    title: "En mouvement",
    description: "Tendance",
  },
  {
    id: 5,
    src: "/videos/vid5.mp4",
    title: "Instant magic",
    description: "Nouveau",
  },
  {
    id: 6,
    src: "/videos/vid6.mp4",
    title: "Good energy",
    description: "Populaire",
  },
  {
    id: 7,
    src: "/videos/vid7.mp4",
    title: "Sans filtre",
    description: "Viral",
  },
  {
    id: 8,
    src: "/videos/vid8.mp4",
    title: "Temps fort",
    description: "Tendance",
  },
];

const VISIBLE_COUNT = 5; // nombre de cartes visibles (impair pour avoir un centre)

export default function VideoCarousel3D() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const autoplayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = videos.length;

  // Helper pour le wrapping d'index
  const wrapIndex = useCallback(
    (index: number) => ((index % total) + total) % total,
    [total]
  );

  // Naviguer vers la suivante
  const goNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveIndex((prev) => wrapIndex(prev + 1));
    setProgress(0);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [wrapIndex, isTransitioning]);

  // Naviguer vers la precedente
  const goPrev = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveIndex((prev) => wrapIndex(prev - 1));
    setProgress(0);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [wrapIndex, isTransitioning]);

  // Gestion du autoplay de la video active
  useEffect(() => {
    // Pause toutes les videos
    videoRefs.current.forEach((video, index) => {
      if (index !== activeIndex) {
        video.pause();
        video.currentTime = 0;
      }
    });

    // Play la video active
    const activeVideo = videoRefs.current.get(activeIndex);
    if (activeVideo && !isPaused) {
      activeVideo.muted = isMuted;
      const playPromise = activeVideo.play();
      if (playPromise) {
        playPromise.catch(() => {
          // Autoplay blocked, keep muted
          activeVideo.muted = true;
          activeVideo.play().catch(() => {});
        });
      }
    }
  }, [activeIndex, isPaused, isMuted]);

  // Gerer la barre de progression + auto transition
  useEffect(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
    }

    if (isPaused) return;

    const activeVideo = videoRefs.current.get(activeIndex);

    // Mettre a jour la progression
    progressIntervalRef.current = setInterval(() => {
      if (activeVideo && activeVideo.duration) {
        const pct = (activeVideo.currentTime / activeVideo.duration) * 100;
        setProgress(pct);
      }
    }, 100);

    // Ecouter la fin de la video
    const handleEnded = () => {
      goNext();
    };

    if (activeVideo) {
      activeVideo.addEventListener("ended", handleEnded);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
      }
      if (activeVideo) {
        activeVideo.removeEventListener("ended", handleEnded);
      }
    };
  }, [activeIndex, isPaused, goNext]);

  // Clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === " ") {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
      if (e.key === "m" || e.key === "M") setIsMuted((m) => !m);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  // Calcul des positions coverflow
  const getCardStyle = (index: number) => {
    // Calcul de la distance du centre (wrapping)
    let diff = index - activeIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;

    const absDiff = Math.abs(diff);

    // Seuls les VISIBLE_COUNT cartes les plus proches sont visibles
    if (absDiff > Math.floor(VISIBLE_COUNT / 2)) {
      return {
        x: diff > 0 ? 800 : -800,
        scale: 0.4,
        rotateY: diff > 0 ? -45 : 45,
        z: -600,
        opacity: 0,
        filter: "blur(8px)",
      };
    }

    // Carte active (centre)
    if (diff === 0) {
      return {
        x: 0,
        scale: 1,
        rotateY: 0,
        z: 0,
        opacity: 1,
        filter: "blur(0px)",
      };
    }

    // Cartes adjacentes
    const spreadX = diff * 280;
    const scaleVal = 1 - absDiff * 0.15;
    const rotateY = diff * -25;
    const zVal = -absDiff * 150;
    const opacityVal = 1 - absDiff * 0.25;
    const blurVal = absDiff * 3;

    return {
      x: spreadX,
      scale: Math.max(scaleVal, 0.6),
      rotateY,
      z: zVal,
      opacity: Math.max(opacityVal, 0.3),
      filter: `blur(${blurVal}px)`,
    };
  };

  const togglePause = () => {
    const activeVideo = videoRefs.current.get(activeIndex);
    if (isPaused) {
      activeVideo?.play().catch(() => {});
    } else {
      activeVideo?.pause();
    }
    setIsPaused((p) => !p);
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full select-none">
      {/* Indicateurs de progression */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex gap-1.5 px-4 max-w-md w-full">
        {videos.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-white/20">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: "#B88A4F" }}
              initial={{ width: "0%" }}
              animate={{
                width:
                  i === activeIndex
                    ? `${progress}%`
                    : i < activeIndex ||
                      (activeIndex === 0 && i === total - 1 && progress > 0)
                    ? "100%"
                    : "0%",
              }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
        ))}
      </div>

      {/* Scene 3D */}
      <div
        className="relative flex items-center justify-center"
        style={{
          perspective: "1200px",
          width: "100%",
          maxWidth: "1100px",
          height: "min(70vh, 560px)",
        }}
      >
        <AnimatePresence mode="popLayout">
          {videos.map((video, index) => {
            const style = getCardStyle(index);
            const isActive = index === activeIndex;

            return (
              <motion.div
                key={video.id}
                className="absolute flex items-center justify-center"
                style={{
                  transformStyle: "preserve-3d",
                  width: "min(300px, 42vw)",
                  height: "min(480px, 68vh)",
                }}
                animate={{
                  x: style.x,
                  scale: style.scale,
                  rotateY: style.rotateY,
                  z: style.z,
                  opacity: style.opacity,
                  filter: style.filter,
                }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 30,
                  mass: 1,
                }}
                onClick={() => {
                  if (!isActive) {
                    let diff = index - activeIndex;
                    if (diff > total / 2) diff -= total;
                    if (diff < -total / 2) diff += total;
                    if (diff > 0) goNext();
                    else goPrev();
                  }
                }}
              >
                <div
                  className={`relative w-full h-full rounded-2xl overflow-hidden shadow-2xl ${
                    isActive
                      ? "ring-2 ring-[#B88A4F]/60 shadow-[0_0_40px_rgba(184,138,79,0.3)]"
                      : "cursor-pointer"
                  }`}
                  style={{ backgroundColor: "#111" }}
                >
                  {/* Video */}
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current.set(index, el);
                    }}
                    src={video.src}
                    className="absolute inset-0 w-full h-full object-cover"
                    loop={false}
                    muted={isMuted}
                    playsInline
                    preload="metadata"
                    poster=""
                  />

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                  {/* Titre de la video (visible sur la carte active) */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 p-5 pointer-events-none"
                    animate={{ opacity: isActive ? 1 : 0.6 }}
                  >
                    <h3
                      className="text-lg font-bold text-white leading-tight"
                      style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
                    >
                      {video.title}
                    </h3>
                    <p
                      className="text-sm mt-1"
                      style={{
                        color: "#B88A4F",
                        textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                      }}
                    >
                      {video.description}
                    </p>
                  </motion.div>

                  {/* Bordure brillante sur la carte active */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{
                        boxShadow:
                          "inset 0 0 0 1px rgba(184,138,79,0.3), 0 0 60px rgba(184,138,79,0.15)",
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-6 mt-6 z-30">
        {/* Bouton precedent */}
        <button
          onClick={goPrev}
          className="group flex items-center justify-center w-12 h-12 rounded-full border border-white/20 hover:border-[#B88A4F]/50 hover:bg-[#B88A4F]/10 transition-all duration-300"
          aria-label="Video precedente"
        >
          <ChevronLeft className="w-5 h-5 text-white/70 group-hover:text-[#B88A4F] transition-colors" />
        </button>

        {/* Play / Pause */}
        <button
          onClick={togglePause}
          className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-[#B88A4F]/40 hover:border-[#B88A4F] hover:bg-[#B88A4F]/10 transition-all duration-300"
          aria-label={isPaused ? "Reprendre" : "Mettre en pause"}
        >
          {isPaused ? (
            <Play className="w-6 h-6 text-[#B88A4F] ml-0.5" />
          ) : (
            <Pause className="w-6 h-6 text-[#B88A4F]" />
          )}
        </button>

        {/* Bouton suivant */}
        <button
          onClick={goNext}
          className="group flex items-center justify-center w-12 h-12 rounded-full border border-white/20 hover:border-[#B88A4F]/50 hover:bg-[#B88A4F]/10 transition-all duration-300"
          aria-label="Video suivante"
        >
          <ChevronRight className="w-5 h-5 text-white/70 group-hover:text-[#B88A4F] transition-colors" />
        </button>

        {/* Mute / Unmute */}
        <button
          onClick={() => setIsMuted((m) => !m)}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-white/15 hover:border-white/30 hover:bg-white/5 transition-all duration-300"
          aria-label={isMuted ? "Activer le son" : "Couper le son"}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-white/50" />
          ) : (
            <Volume2 className="w-4 h-4 text-white/70" />
          )}
        </button>
      </div>

      {/* Info video active */}
      <div className="mt-4 text-center z-30">
        <p className="text-xs text-white/40 tracking-widest uppercase">
          {activeIndex + 1} / {total}
        </p>
      </div>

      {/* Hint clavier */}
      <div className="absolute bottom-4 right-6 z-30 hidden lg:flex items-center gap-3 text-white/25 text-xs">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded border border-white/15 text-[10px]">
            {"<"}
          </kbd>
          <kbd className="px-1.5 py-0.5 rounded border border-white/15 text-[10px]">
            {">"}
          </kbd>
          naviguer
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded border border-white/15 text-[10px]">
            espace
          </kbd>
          pause
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded border border-white/15 text-[10px]">
            M
          </kbd>
          son
        </span>
      </div>
    </div>
  );
}
