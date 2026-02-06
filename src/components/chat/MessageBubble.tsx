// components/chat/MessageBubble.tsx
'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { 
  Download, Play, Pause, File, X, ZoomIn, 
  MoreVertical, Smile, Reply, Pin, Pencil, Trash2, Forward,
  Check, CheckCheck
} from 'lucide-react';
import type { Message, MessageMedia } from '@/types/chat';
import { MESSAGE_REACTIONS } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showSender: boolean;
  currentUserId: string;
  onReact: (emoji: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onReply: () => void;
}

export function MessageBubble({
  message,
  isOwnMessage,
  showSender,
  currentUserId,
  onReact,
  onEdit,
  onDelete,
  onPin,
  onReply,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const canEdit = () => {
    if (!isOwnMessage) return false;
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    return new Date(message.createdAt) > tenMinutesAgo;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleAudio = (url: string, duration?: number | null) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlayingAudio) {
      audio.pause();
      setIsPlayingAudio(false);
    } else {
      audio.src = url;
      audio.play();
      setIsPlayingAudio(true);

      audio.ontimeupdate = () => {
        if (duration) {
          setAudioProgress((audio.currentTime / duration) * 100);
        }
      };

      audio.onended = () => {
        setIsPlayingAudio(false);
        setAudioProgress(0);
      };
    }
  };

  const renderMedia = (media: MessageMedia) => {
    switch (media.type) {
      case 'IMAGE':
        return (
          <div
            key={media.id}
            className="relative group cursor-pointer"
            onClick={() => {
              setSelectedImage(media.url);
              setShowImageModal(true);
            }}
          >
            <img
              src={media.url || "/placeholder.svg"}
              alt={media.filename}
              className="max-w-xs rounded-lg object-cover"
              style={{ maxHeight: '300px' }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                <ZoomIn className="w-4 h-4 text-gray-800" />
              </div>
            </div>
          </div>
        );

      case 'VIDEO':
        return (
          <video
            key={media.id}
            src={media.url}
            controls
            className="max-w-xs rounded-lg"
            style={{ maxHeight: '300px' }}
          />
        );

      case 'VOICE':
        return (
          <div key={media.id} className="flex items-center gap-3 min-w-50">
            <audio ref={audioRef} />
            <button
              type="button"
              onClick={() => toggleAudio(media.url, media.duration)}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                isOwnMessage ? 'bg-white/20 hover:bg-white/30' : 'bg-[#0F4C5C]/10 hover:bg-[#0F4C5C]/20'
              )}
            >
              {isPlayingAudio ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>

            <div className="flex-1 h-8 flex items-center gap-0.5">
              {[...Array(20)].map((_, i) => {
                const height = 20 + Math.random() * 80;
                const isPlayed = (i / 20) * 100 < audioProgress;
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 rounded-full transition-all',
                      isOwnMessage
                        ? isPlayed ? 'bg-white' : 'bg-white/40'
                        : isPlayed ? 'bg-[#0F4C5C]' : 'bg-[#0F4C5C]/40'
                    )}
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>

            <span className="text-xs font-mono">
              {formatDuration(media.duration || 0)}
            </span>
          </div>
        );

      case 'DOCUMENT':
        return (
          <a
            key={media.id}
            href={media.url}
            download={media.filename}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 max-w-xs',
              isOwnMessage ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isOwnMessage ? 'bg-white/20' : 'bg-[#B88A4F]'
            )}>
              <File className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{media.filename}</p>
              <p className={cn('text-xs', isOwnMessage ? 'text-white/70' : 'text-gray-500')}>
                {formatFileSize(media.size)}
              </p>
            </div>
            <Download className={cn('w-4 h-4', isOwnMessage ? 'text-white/70' : 'text-gray-400')} />
          </a>
        );

      default:
        return null;
    }
  };

  if (message.isDeleted) {
    return (
      <div className={cn('flex mb-3', isOwnMessage ? 'justify-end' : 'justify-start')}>
        <div className={cn(
          'rounded-2xl px-4 py-2 italic text-sm',
          isOwnMessage
            ? 'bg-[#0F4C5C]/50 text-white/70'
            : 'bg-gray-100 text-gray-500'
        )}>
          Message supprime
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn('flex mb-3 group', isOwnMessage ? 'justify-end' : 'justify-start')}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => {
          setShowActions(false);
          setShowReactions(false);
          setShowMoreMenu(false);
        }}
      >
        {/* Actions - Left side for own messages */}
        {isOwnMessage && showActions && (
          <div className="flex items-center gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setShowReactions(!showReactions)}
              className="w-7 h-7 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-50"
            >
              <Smile className="w-4 h-4 text-gray-600" />
            </button>
            <button
              type="button"
              onClick={onReply}
              className="w-7 h-7 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-50"
            >
              <Reply className="w-4 h-4 text-gray-600" />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="w-7 h-7 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-50"
              >
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </button>
              
              {showMoreMenu && (
                <div className="absolute right-0 top-8 w-40 bg-white rounded-lg shadow-lg border py-1 z-10">
                  {canEdit() && (
                    <button
                      type="button"
                      onClick={() => { onEdit(); setShowMoreMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Pencil className="w-4 h-4" />
                      Modifier
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { onPin(); setShowMoreMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Pin className="w-4 h-4" />
                    {message.isPinned ? 'Desepingler' : 'Epingler'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { onDelete(); setShowMoreMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={cn('max-w-[70%] flex flex-col', isOwnMessage ? 'items-end' : 'items-start')}>
          {/* Sender name */}
          {showSender && !isOwnMessage && (
            <span className="text-xs text-gray-500 mb-1 px-3">
              {message.sender.prenom} {message.sender.nom}
            </span>
          )}

          {/* Pinned indicator */}
          {message.isPinned && (
            <div className="flex items-center gap-1 text-xs text-[#B88A4F] mb-1">
              <Pin className="w-3 h-3" />
              Epingle
            </div>
          )}

          {/* Message bubble */}
          <div
            className={cn(
              'rounded-2xl px-4 py-2 relative',
              isOwnMessage
                ? 'bg-[#0F4C5C] text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-900 rounded-bl-sm'
            )}
          >
            {/* Reply preview */}
            {message.replyTo && (
              <div className={cn(
                'mb-2 pb-2 border-b text-sm opacity-70',
                isOwnMessage ? 'border-white/20' : 'border-gray-300'
              )}>
                <p className="font-medium text-xs">
                  {message.replyTo.sender.prenom}
                </p>
                <p className="truncate text-xs">
                  {message.replyTo.content || '[Media]'}
                </p>
              </div>
            )}

            {/* Media */}
            {message.media && message.media.length > 0 && (
              <div className="space-y-2 mb-2">
                {message.media.map(renderMedia)}
              </div>
            )}

            {/* Text content */}
            {message.content && (
              <p className="text-sm whitespace-pre-wrap wrap-break-word">
                {message.content}
              </p>
            )}

            {/* Time & Status */}
            <div className={cn(
              'text-xs mt-1 flex items-center gap-2',
              isOwnMessage ? 'text-white/70 justify-end' : 'text-gray-500'
            )}>
              <span>{formatTime(message.createdAt)}</span>
              {message.isEdited && <span>(modifie)</span>}
              {isOwnMessage && (
                message.readBy && message.readBy.length > 0
                  ? <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
                  : <Check className="w-3.5 h-3.5" />
              )}
            </div>

            {/* Reactions */}
            {message.reactions.length > 0 && (
              <div className={cn(
                'absolute -bottom-4 flex gap-0.5',
                isOwnMessage ? 'right-2' : 'left-2'
              )}>
                {Object.entries(
                  message.reactions.reduce((acc, r) => {
                    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([emoji, count]) => (
                  <span
                    key={emoji}
                    className="bg-white shadow rounded-full px-1.5 py-0.5 text-xs flex items-center gap-0.5"
                  >
                    {emoji}
                    {count > 1 && <span className="text-gray-500">{count}</span>}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions - Right side for other's messages */}
        {!isOwnMessage && showActions && (
          <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setShowReactions(!showReactions)}
              className="w-7 h-7 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-50"
            >
              <Smile className="w-4 h-4 text-gray-600" />
            </button>
            <button
              type="button"
              onClick={onReply}
              className="w-7 h-7 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-50"
            >
              <Reply className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}

        {/* Reaction picker */}
        {showReactions && (
          <div className={cn(
            'absolute mt-10 bg-white rounded-full shadow-lg px-2 py-1 flex gap-1 z-20',
            isOwnMessage ? 'right-0' : 'left-0'
          )}>
            {MESSAGE_REACTIONS.map(({ emoji }) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onReact(emoji);
                  setShowReactions(false);
                }}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-lg transition-transform hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button
            type="button"
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedImage || "/placeholder.svg"}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
