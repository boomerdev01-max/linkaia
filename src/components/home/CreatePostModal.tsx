// src/components/home/CreatePostModal.tsx
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  ImageIcon,
  Video,
  MapPin,
  Smile,
  Calendar,
  X,
  Users,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  nom: string;
  prenom: string;
  pseudo: string;
  email: string;
  image?: string | null;
}

interface CreatePostModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

export default function CreatePostModal({
  user,
  isOpen,
  onClose,
  onPostCreated,
}: CreatePostModalProps) {
  const [postText, setPostText] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<
    "public" | "friends" | "private"
  >("public");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length + selectedImages.length > 10) {
      toast.error("Maximum 10 photos par publication");
      return;
    }

    if (selectedVideo) {
      toast.error("Impossible de mixer photos et vidéo");
      return;
    }

    // Valider chaque fichier
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} n'est pas une image valide`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} dépasse 5MB`);
        return;
      }

      validFiles.push(file);

      // Créer preview
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === validFiles.length) {
          setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setSelectedImages((prev) => [...prev, ...validFiles]);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (selectedImages.length > 0) {
      toast.error("Impossible de mixer photos et vidéo");
      return;
    }

    if (!file.type.startsWith("video/")) {
      toast.error("Fichier vidéo invalide");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("La vidéo dépasse 50MB");
      return;
    }

    setSelectedVideo(file);

    // Créer preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setSelectedVideo(null);
    setVideoPreview(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const handlePublish = async () => {
    if (!postText.trim() && selectedImages.length === 0 && !selectedVideo) {
      toast.error("Écrivez quelque chose ou ajoutez un média");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      if (postText.trim()) {
        formData.append("content", postText.trim());
      }

      formData.append("visibility", visibility);

      // Ajouter les photos
      selectedImages.forEach((image) => {
        formData.append("photos", image);
      });

      // Ajouter la vidéo
      if (selectedVideo) {
        formData.append("video", selectedVideo);
      }

      const response = await fetch("/api/posts/create", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Publication créée avec succès !");

        // Réinitialiser
        setPostText("");
        setSelectedImages([]);
        setImagePreviews([]);
        setSelectedVideo(null);
        setVideoPreview(null);
        setVisibility("public");

        if (imageInputRef.current) imageInputRef.current.value = "";
        if (videoInputRef.current) videoInputRef.current.value = "";

        onClose();

        // Callback pour rafraîchir le feed
        if (onPostCreated) {
          onPostCreated();
        }
      } else {
        toast.error(data.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVisibilityLabel = () => {
    switch (visibility) {
      case "public":
        return "Public";
      case "friends":
        return "Amis";
      case "private":
        return "Privé";
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center pt-16 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-xl mx-4 animate-in fade-in slide-in-from-top-4 duration-300">
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Créer une publication
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Profil utilisateur */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full border-2 border-[#B88A4F] overflow-hidden bg-linear-to-br from-[#0F4C5C] to-[#B88A4F]">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={`${user.prenom} ${user.nom}`}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white font-bold text-base">
                    {user.prenom.charAt(0)}
                    {user.nom.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 dark:text-white">
                {user.prenom} {user.nom}
              </p>
              <button
                onClick={() => {
                  const options: Array<"public" | "friends" | "private"> = [
                    "public",
                    "friends",
                    "private",
                  ];
                  const currentIndex = options.indexOf(visibility);
                  const nextIndex = (currentIndex + 1) % options.length;
                  setVisibility(options[nextIndex]);
                }}
                className="flex items-center gap-1 mt-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Users className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {getVisibilityLabel()}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Zone de texte */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <textarea
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            placeholder={`Quoi de neuf, ${user.prenom} ?`}
            className="w-full min-h-37.5 p-3 bg-transparent border-none focus:outline-none resize-none text-gray-900 dark:text-white text-lg placeholder:text-gray-400"
            disabled={isSubmitting}
            autoFocus
          />

          {/* Prévisualisation images */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {imagePreviews.map((preview, index) => (
                <div
                  key={index}
                  className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 aspect-square"
                >
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Prévisualisation vidéo */}
          {videoPreview && (
            <div className="relative mt-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <video src={videoPreview} controls className="w-full max-h-64" />
              <button
                onClick={removeVideo}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Options de publication */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Ajouter à votre publication
            </p>
            <div className="flex items-center gap-2">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
                disabled={isSubmitting}
              />
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={isSubmitting || !!selectedVideo}
                className="w-9 h-9 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-500 flex items-center justify-center transition-colors disabled:opacity-50"
                title="Photo"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
                disabled={isSubmitting}
              />
              <button
                onClick={() => videoInputRef.current?.click()}
                disabled={isSubmitting || selectedImages.length > 0}
                className="w-9 h-9 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-500 flex items-center justify-center transition-colors disabled:opacity-50"
                title="Vidéo"
              >
                <Video className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bouton publier */}
        <div className="p-4">
          <button
            onClick={handlePublish}
            disabled={
              (!postText.trim() &&
                selectedImages.length === 0 &&
                !selectedVideo) ||
              isSubmitting
            }
            className="w-full py-3 bg-[#0F4C5C] hover:bg-[#0a3540] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Publication en cours...
              </>
            ) : (
              "Publier"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
