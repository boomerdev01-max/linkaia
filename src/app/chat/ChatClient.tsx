// app/chat/ChatClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Search,
  X,
  Users,
  Archive,
  Settings,
} from 'lucide-react';

import { ConversationItem } from '@/components/chat/ConversationItem';
import { ConversationView } from '@/components/chat/ConversationView';
import { useConversations } from '@/hooks/use-conversations';
import type { ConversationListItem } from '@/types/chat';

import Header from '@/components/home/Header';
import { useUnreadMessages } from '@/hooks/use-unread-messages';

interface ChatClientProps {
  currentUser: {
    id: string;
    nom: string;
    prenom: string;
    pseudo: string | null;
    profilePhotoUrl: string | null;
  };
  initialConversationId: string | null;
}

export function ChatClient({ currentUser, initialConversationId }: ChatClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [selectedConversation, setSelectedConversation] = useState<ConversationListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false);

  const {
    conversations,
    isLoading,
    error,
    filter,
    changeFilter,
    refresh,
    markAsRead,
  } = useConversations();

  const { unreadCount: messagesUnreadCount } = useUnreadMessages({ pollingInterval: 30000 });

  // Préparation des données utilisateur pour le Header
  const headerUser = {
    id: currentUser.id,
    nom: currentUser.nom,
    prenom: currentUser.prenom,
    pseudo: currentUser.pseudo || '',
    email: '', // ← Ajoute l'email si disponible dans tes données utilisateur
    image: currentUser.profilePhotoUrl,
  };

  // Sélection d'une conversation via URL ou prop initiale
  useEffect(() => {
    const convId = searchParams.get('conversation') || initialConversationId;
    if (convId && conversations.length > 0) {
      const conv = conversations.find((c) => c.id === convId);
      if (conv) {
        setSelectedConversation(conv);
        setIsMobileConversationOpen(true);
      }
    }
  }, [searchParams, initialConversationId, conversations]);

  const handleSelectConversation = (conv: ConversationListItem) => {
    setSelectedConversation(conv);
    setIsMobileConversationOpen(true);
    markAsRead(conv.id);

    // Mise à jour de l'URL sans rechargement
    const url = new URL(window.location.href);
    url.searchParams.set('conversation', conv.id);
    window.history.replaceState({}, '', url.toString());
  };

  const handleBackToList = () => {
    setIsMobileConversationOpen(false);
    setSelectedConversation(null);

    // Suppression du paramètre conversation de l'URL
    const url = new URL(window.location.href);
    url.searchParams.delete('conversation');
    window.history.replaceState({}, '', url.toString());
  };

  const filteredConversations = conversations.filter((conv) => {
    if (searchQuery) {
      return conv.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const currentUserName = currentUser.pseudo || `${currentUser.prenom} ${currentUser.nom}`;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header fixe identique à la page d'accueil */}
      <Header user={headerUser} notificationCount={0} /* ← mets la vraie valeur si disponible */ />

      {/* Contenu principal – padding-top pour compenser le header fixe */}
      <main className="flex-1 pt-16 md:pt-20 flex flex-col overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          {/* Liste des conversations (cachée en mobile quand une conv est ouverte) */}
          <div
            className={cn(
              'w-full md:w-96 bg-white border-r border-gray-200 flex flex-col',
              isMobileConversationOpen && 'hidden md:flex',
            )}
          >
            {/* Barre de recherche + filtres */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative mb-3">
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-2">
                  <Search className="w-4 h-4 text-gray-500 mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher des discussions"
                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="ml-2 p-1 rounded-full hover:bg-gray-200"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => changeFilter('all')}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                    filter === 'all' ? 'bg-[#0F4C5C] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                  )}
                >
                  Tout
                </button>
                <button
                  onClick={() => changeFilter('unread')}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                    filter === 'unread' ? 'bg-[#0F4C5C] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                  )}
                >
                  Non lus
                </button>
                <button
                  onClick={() => changeFilter('groups')}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                    filter === 'groups' ? 'bg-[#0F4C5C] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                  )}
                >
                  Groupes
                </button>
              </div>
            </div>

            {/* Liste des conversations */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-6 h-6 border-2 border-[#0F4C5C] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-500 text-sm">
                  {error}
                  <button
                    type="button"
                    onClick={() => refresh()}
                    className="block mx-auto mt-2 text-[#0F4C5C] underline"
                  >
                    Réessayer
                  </button>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isSelected={selectedConversation?.id === conv.id}
                    onClick={() => handleSelectConversation(conv)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Zone de visualisation de la conversation */}
          <div
            className={cn(
              'flex-1 flex flex-col bg-white',
              !isMobileConversationOpen && 'hidden md:flex',
            )}
          >
            {selectedConversation ? (
              <ConversationView
                conversation={selectedConversation}
                currentUserId={currentUser.id}
                currentUserName={currentUserName}
                onBack={handleBackToList}
                onOpenInfo={() => setShowInfoSidebar(!showInfoSidebar)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <p>Sélectionnez une conversation</p>
                  <p className="text-sm mt-1">ou commencez-en une nouvelle</p>
                </div>
              </div>
            )}
          </div>

          {/* Panneau d'informations (desktop uniquement) */}
          {showInfoSidebar && selectedConversation && (
            <div className="w-[320px] border-l border-gray-200 bg-white hidden lg:block overflow-y-auto">
              <div className="p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-[#0F4C5C] mx-auto mb-4 flex items-center justify-center overflow-hidden">
                  {selectedConversation.avatarUrl ? (
                    <img
                      src={selectedConversation.avatarUrl}
                      alt={selectedConversation.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-2xl">
                      {selectedConversation.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedConversation.name}</h3>
                {selectedConversation.type === 'group' && (
                  <p className="text-sm text-gray-500">
                    {selectedConversation.participants.length} participants
                  </p>
                )}
              </div>

              <div className="px-4 space-y-2">
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left"
                >
                  <Search className="w-5 h-5 text-gray-500" />
                  <span className="text-sm">Rechercher dans la discussion</span>
                </button>

                {selectedConversation.type === 'group' && (
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left"
                  >
                    <Users className="w-5 h-5 text-gray-500" />
                    <span className="text-sm">Voir les membres</span>
                  </button>
                )}

                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left"
                >
                  <Archive className="w-5 h-5 text-gray-500" />
                  <span className="text-sm">Archiver</span>
                </button>

                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left"
                >
                  <Settings className="w-5 h-5 text-gray-500" />
                  <span className="text-sm">Paramètres</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}