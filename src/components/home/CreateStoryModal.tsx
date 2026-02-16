// src/components/home/CreateStoryModal.tsx
"use client";

import { useState, useRef } from "react";
import {
  X,
  Image as ImageIcon,
  Video,
  Type,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Slide {
  id: string;
  type: "PHOTO" | "VIDEO" | "TEXT";
  // Photo/Video
  file?: File;
  mediaUrl?: string;
  thumbnailUrl?: string;
  mimeType?: string;
  // Text
  textContent?: string;
  bgColor?: string;
  textColor?: string;
  fontSize?: "small" | "medium" | "large";
}

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
}

const BG_COLORS = [
  { label: "Rouge", value: "#FF5A5F" },
  { label: "Bleu", value: "#0F4C5C" },
  { label: "Vert", value: "#10B981" },
  { label: "Violet", value: "#8B5CF6" },
  { label: "Orange", value: "#F59E0B" },
  { label: "Rose", value: "#EC4899" },
  {
    label: "Gradient Sunset",
    value: "linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%)",
  },
  {
    label: "Gradient Ocean",
    value: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
  },
  {
    label: "Gradient Forest",
    value: "linear-gradient(135deg, #134E5E 0%, #71B280 100%)",
  },
];

export default function CreateStoryModal({
  isOpen,
  onClose,
  onStoryCreated,
}: CreateStoryModalProps) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentSlide = slides[currentSlideIndex];

  // ============================================
  // HANDLERS - Ajout de slides
  // ============================================

  const handleAddPhotoSlide = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith("image/")) {
      toast.error("Fichier invalide. Sélectionnez une image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image trop volumineuse (max 10MB)");
      return;
    }

    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      type: "PHOTO",
      file,
      mediaUrl: URL.createObjectURL(file),
      mimeType: file.type,
    };

    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
    toast.success("Photo ajoutée");
  };

  const handleAddVideoSlide = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith("video/")) {
      toast.error("Fichier invalide. Sélectionnez une vidéo.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Vidéo trop volumineuse (max 50MB)");
      return;
    }

    // TODO: Vérifier durée (max 30s) avec video element
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      type: "VIDEO",
      file,
      mediaUrl: URL.createObjectURL(file),
      mimeType: file.type,
    };

    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
    toast.success("Vidéo ajoutée");
  };

  const handleAddTextSlide = () => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      type: "TEXT",
      textContent: "",
      bgColor: BG_COLORS[0].value,
      textColor: "#FFFFFF",
      fontSize: "medium",
    };

    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  const handleRemoveSlide = (index: number) => {
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    if (currentSlideIndex >= newSlides.length && newSlides.length > 0) {
      setCurrentSlideIndex(newSlides.length - 1);
    } else if (newSlides.length === 0) {
      setCurrentSlideIndex(0);
    }
  };

  const updateSlide = (updates: Partial<Slide>) => {
    setSlides((prev) =>
      prev.map((slide, i) =>
        i === currentSlideIndex ? { ...slide, ...updates } : slide,
      ),
    );
  };

  // ============================================
  // PUBLISH STORY
  // ============================================

  const handlePublish = async () => {
    if (slides.length === 0) {
      toast.error("Ajoutez au moins un slide");
      return;
    }

    setPublishing(true);

    try {
      // 1. Upload tous les médias d'abord
      const uploadedSlides = await Promise.all(
        slides.map(async (slide, index) => {
          if (slide.type === "PHOTO" || slide.type === "VIDEO") {
            if (!slide.file) {
              throw new Error(`Fichier manquant pour slide ${index}`);
            }

            const formData = new FormData();
            formData.append("file", slide.file);
            formData.append("slideIndex", index.toString());

            const response = await fetch("/api/stories/upload", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              throw new Error("Erreur lors de l'upload");
            }

            const data = await response.json();
            return {
              type: slide.type,
              mediaUrl: data.data.url,
              thumbnailUrl: data.data.thumbnailUrl,
              mimeType: data.data.mimeType,
            };
          } else {
            // TEXT slide
            return {
              type: slide.type,
              textContent: slide.textContent,
              bgColor: slide.bgColor,
              textColor: slide.textColor,
              fontSize: slide.fontSize,
            };
          }
        }),
      );

      // 2. Créer la story avec les slides
      const response = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides: uploadedSlides }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la publication");
      }

      toast.success("Story publiée avec succès ! 🎉");
      onStoryCreated();
      handleClose();
    } catch (error) {
      console.error("Error publishing story:", error);
      toast.error("Erreur lors de la publication");
    } finally {
      setPublishing(false);
    }
  };

  const handleClose = () => {
    setSlides([]);
    setCurrentSlideIndex(0);
    onClose();
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Créer une story
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {slides.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="text-center">
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Créez votre première slide
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ajoutez des photos, vidéos ou texte
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-6 bg-linear-to-br from-[#0F4C5C] to-primary text-white rounded-xl hover:opacity-90 transition-opacity"
                >
                  <ImageIcon className="w-8 h-8" />
                  <span className="font-medium">Photo</span>
                </button>

                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-6 bg-linear-to-br from-[#B88A4F] to-[#D4A574] text-white rounded-xl hover:opacity-90 transition-opacity"
                >
                  <Video className="w-8 h-8" />
                  <span className="font-medium">Vidéo</span>
                </button>

                <button
                  onClick={handleAddTextSlide}
                  className="flex flex-col items-center gap-2 p-6 bg-linear-to-br from-[#FF5A5F] to-[#FF8A8E] text-white rounded-xl hover:opacity-90 transition-opacity"
                >
                  <Type className="w-8 h-8" />
                  <span className="font-medium">Texte</span>
                </button>
              </div>
            </div>
          ) : (
            // Slides editor
            <div className="space-y-6">
              {/* Preview */}
              <div className="relative aspect-9/16 max-h-125 mx-auto bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                {currentSlide.type === "PHOTO" && (
                  <img
                    src={currentSlide.mediaUrl}
                    alt="Story preview"
                    className="w-full h-full object-cover"
                  />
                )}

                {currentSlide.type === "VIDEO" && (
                  <video
                    src={currentSlide.mediaUrl}
                    className="w-full h-full object-cover"
                    controls
                  />
                )}

                {currentSlide.type === "TEXT" && (
                  <div
                    className="w-full h-full flex items-center justify-center p-8"
                    style={{ background: currentSlide.bgColor }}
                  >
                    <textarea
                      value={currentSlide.textContent}
                      onChange={(e) =>
                        updateSlide({ textContent: e.target.value })
                      }
                      placeholder="Écrivez votre texte..."
                      className="w-full h-full bg-transparent border-none outline-none resize-none text-center"
                      style={{
                        color: currentSlide.textColor,
                        fontSize:
                          currentSlide.fontSize === "small"
                            ? "1.5rem"
                            : currentSlide.fontSize === "large"
                              ? "3rem"
                              : "2rem",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Text controls */}
              {currentSlide.type === "TEXT" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Couleur de fond
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {BG_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => updateSlide({ bgColor: color.value })}
                          className={`w-10 h-10 rounded-full border-2 ${
                            currentSlide.bgColor === color.value
                              ? "border-gray-900 dark:border-white scale-110"
                              : "border-transparent"
                          } transition-transform`}
                          style={{ background: color.value }}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Taille du texte
                    </label>
                    <div className="flex gap-2">
                      {(["small", "medium", "large"] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => updateSlide({ fontSize: size })}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            currentSlide.fontSize === size
                              ? "bg-[#0F4C5C] text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {size === "small"
                            ? "Petit"
                            : size === "large"
                              ? "Grand"
                              : "Moyen"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Slides navigation */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {slides.map((slide, index) => (
                  <div key={slide.id} className="relative shrink-0">
                    <button
                      onClick={() => setCurrentSlideIndex(index)}
                      className={`relative w-16 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentSlideIndex
                          ? "border-[#0F4C5C] scale-110"
                          : "border-gray-300 dark:border-gray-700"
                      }`}
                    >
                      {slide.type === "PHOTO" && (
                        <img
                          src={slide.mediaUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                      {slide.type === "VIDEO" && (
                        <video
                          src={slide.mediaUrl}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {slide.type === "TEXT" && (
                        <div
                          className="w-full h-full flex items-center justify-center text-xs"
                          style={{ background: slide.bgColor }}
                        >
                          <Type className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => handleRemoveSlide(index)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Add buttons */}
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="shrink-0 w-16 h-24 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-[#0F4C5C] transition-colors"
                >
                  <ImageIcon className="w-6 h-6 text-gray-500" />
                </button>

                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="shrink-0 w-16 h-24 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-[#0F4C5C] transition-colors"
                >
                  <Video className="w-6 h-6 text-gray-500" />
                </button>

                <button
                  onClick={handleAddTextSlide}
                  className="shrink-0 w-16 h-24 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-[#0F4C5C] transition-colors"
                >
                  <Type className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {slides.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="w-full py-3 bg-linear-to-r from-[#0F4C5C] to-primary text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {publishing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Publication...
                </>
              ) : (
                "Publier la story"
              )}
            </button>
          </div>
        )}
      </div>

      {/* Hidden inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleAddPhotoSlide}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={handleAddVideoSlide}
        className="hidden"
      />
    </div>
  );
}
