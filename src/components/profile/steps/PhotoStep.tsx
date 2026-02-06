"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface PhotoStepProps {
  photoUrl: string | null;
  onPhotoUpload: (file: File) => Promise<void>;
  onPhotoRemove: () => void;
}

export default function PhotoStep({
  photoUrl,
  onPhotoUpload,
  onPhotoRemove,
}: PhotoStepProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(photoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Format non supporté. Utilisez JPEG, PNG ou WebP.");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("La photo ne doit pas dépasser 5 MB.");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      setIsUploading(true);
      await onPhotoUpload(file);
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Erreur lors de l'upload. Réessayez.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreview(null);
    onPhotoRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {/* Hero Image - Photo */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-accent via-primary/50 to-secondary overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center p-8">
            {/* Illustration abstraite style Badoo - Photo */}
            <div className="relative w-full h-full max-w-md">
              {/* Appareil photo stylisé */}
              <div className="absolute left-1/2 top-1/4 transform -translate-x-1/2 w-64 h-48 bg-linear-to-br from-primary to-primary-dark rounded-3xl shadow-2xl">
                {/* Objectif */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-white rounded-full flex items-center justify-center">
                  <div className="w-20 h-20 bg-linear-to-br from-accent to-secondary rounded-full" />
                </div>
                
                {/* Flash */}
                <div className="absolute top-6 right-6 w-8 h-8 bg-accent rounded-full" />
              </div>

              {/* Cadre photo */}
              <div className="absolute bottom-16 right-8 w-40 h-48 bg-white rounded-lg shadow-xl transform rotate-6 overflow-hidden border-4 border-white">
                <div className="w-full h-full bg-linear-to-br from-secondary/30 to-accent/30" />
              </div>

              {/* Formes décoratives */}
              <div className="absolute top-12 left-4 w-16 h-16 bg-secondary/60 rounded-full" />
              <div className="absolute bottom-8 left-12 w-12 h-12 bg-accent/70 rounded-4xl transform rotate-45" />
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 pt-5.5 pb-10">
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
          Ajoutez une photo de profil
        </h2>

        <div className="flex flex-col items-center space-y-6">
          {/* Photo Preview */}
          <div className="relative">
            {preview ? (
              <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-primary shadow-lg">
                <Image
                  src={preview}
                  alt="Profile photo"
                  fill
                  className="object-cover"
                />
                <button
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
                  aria-label="Supprimer la photo"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="w-48 h-48 rounded-full bg-gray-100 flex items-center justify-center border-4 border-dashed border-gray-300">
                <Camera className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="photo-upload"
          />
          <label htmlFor="photo-upload">
            <Button
              type="button"
              variant="default"
              size="lg"
              className="rounded-full px-8"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-5 h-5 mr-2" />
              {isUploading ? "Upload en cours..." : preview ? "Changer la photo" : "Choisir une photo"}
            </Button>
          </label>

          {/* Info */}
          <p className="text-sm text-gray-500 text-center">
            Formats acceptés : JPEG, PNG, WebP
            <br />
            Taille maximale : 5 MB
          </p>

          {!preview && (
            <p className="text-sm text-gray-400 text-center italic">
              Cette étape est facultative, vous pouvez la sauter
            </p>
          )}
        </div>

        {/* Spacer */}
        <div className="h-24" />
      </div>
    </>
  );
}