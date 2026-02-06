// src/components/home/PostComposer.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon, Video, Smile } from "lucide-react";
import CreatePostModal from "./CreatePostModal";

interface User {
  id: string;
  nom: string;
  prenom: string;
  pseudo: string;
  email: string;
  image?: string | null;
}

interface PostComposerProps {
  user: User;
  onPostCreated?: () => void; // AJOUTÉ: prop pour le callback
}

export default function PostComposer({
  user,
  onPostCreated,
}: PostComposerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePostCreated = () => {
    setIsModalOpen(false); // Fermer le modal
    if (onPostCreated) {
      onPostCreated(); // Appeler le callback si fourni
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        {/* Ligne principale avec photo, bouton et icônes */}
        <div className="flex items-center gap-3">
          {/* Photo de profil */}
          <div className="relative w-10 h-10 rounded-full border-2 border-[#B88A4F] overflow-hidden bg-linear-to-br from-[#0F4C5C] to-[#B88A4F] shrink-0">
            {user.image ? (
              <Image
                src={user.image}
                alt={`${user.prenom} ${user.nom}`}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user.prenom.charAt(0)}
                  {user.nom.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Bouton de texte (réduit) */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-left text-gray-500 dark:text-gray-400 transition-colors grow h-12"
          >
            Quoi de neuf, {user.prenom} ?
          </button>

          {/* Icônes sur la même ligne */}
          <div className="flex items-center gap-1 shrink-0 h-12">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 h-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg"
              aria-label="Ajouter une photo"
            >
              <ImageIcon className="w-6 h-6 text-green-500" />
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 h-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg"
              aria-label="Ajouter une vidéo"
            >
              <Video className="w-6 h-6 text-red-500" />
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 h-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg"
              aria-label="Ajouter un emoji"
            >
              <Smile className="w-6 h-6 text-yellow-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de création */}
      <CreatePostModal
        user={user}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPostCreated={handlePostCreated} // AJOUTÉ: passer le callback au modal
      />
    </>
  );
}
