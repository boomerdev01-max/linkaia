// components/chat/MessageInput.tsx
'use client';

import React from "react"

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  Send, ImageIcon, Smile, Mic, X, 
  Paperclip, StopCircle, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import type { Message } from '@/types/chat';

interface MessageInputProps {
  conversationId: string;
  onSendMessage: (
    content: string,
    type: 'TEXT' | 'MEDIA' | 'VOICE' | 'MIXED',
    media?: any[],
    replyToId?: string
  ) => Promise<void>;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  onTyping?: () => void;
  disabled?: boolean;
}

export function MessageInput({
  conversationId,
  onSendMessage,
  replyTo,
  onCancelReply,
  onTyping,
  disabled,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [pendingMedia, setPendingMedia] = useState<{
    file: File;
    preview: string;
    type: string;
  }[]>([]);
  const [isSending, setIsSending] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newMedia: typeof pendingMedia = [];
    
    for (const file of files) {
      // Validate file size
      const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 :
                     file.type.startsWith('image/') ? 10 * 1024 * 1024 :
                     file.type.startsWith('audio/') ? 5 * 1024 * 1024 :
                     20 * 1024 * 1024;

      if (file.size > maxSize) {
        toast.error(`Fichier trop volumineux: ${file.name}`);
        continue;
      }

      const preview = file.type.startsWith('image/') || file.type.startsWith('video/')
        ? URL.createObjectURL(file)
        : '';

      newMedia.push({
        file,
        preview,
        type: file.type.startsWith('image/') ? 'IMAGE' :
              file.type.startsWith('video/') ? 'VIDEO' :
              file.type.startsWith('audio/') ? 'AUDIO' : 'DOCUMENT',
      });
    }

    setPendingMedia(prev => [...prev, ...newMedia]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const removePendingMedia = useCallback((index: number) => {
    setPendingMedia(prev => {
      const item = prev[index];
      if (item.preview) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);
      
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 120) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      toast.error('Impossible d\'acceder au microphone');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      
      // Create blob and add to pending
      setTimeout(() => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        
        setPendingMedia(prev => [...prev, {
          file,
          preview: '',
          type: 'VOICE',
        }]);
      }, 100);
    }
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingDuration(0);
    chunksRef.current = [];
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
  }, []);

  const uploadMedia = async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);

    const response = await fetch('/api/chat/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Erreur upload');
    }

    return response.json();
  };

  const handleSend = useCallback(async () => {
    if (isSending || disabled) return;
    if (!message.trim() && pendingMedia.length === 0) return;

    setIsSending(true);

    try {
      // Upload media files
      const uploadedMedia: any[] = [];
      
      for (const item of pendingMedia) {
        try {
          const uploaded = await uploadMedia(item.file);
          uploadedMedia.push({
            type: uploaded.type,
            url: uploaded.url,
            filename: uploaded.filename,
            size: uploaded.size,
            mimeType: uploaded.mimeType,
          });
        } catch (error) {
          toast.error(`Erreur upload: ${item.file.name}`);
        }
      }

      // Determine message type
      let type: 'TEXT' | 'MEDIA' | 'VOICE' | 'MIXED' = 'TEXT';
      if (uploadedMedia.length > 0) {
        if (uploadedMedia.some(m => m.type === 'VOICE')) {
          type = 'VOICE';
        } else if (message.trim()) {
          type = 'MIXED';
        } else {
          type = 'MEDIA';
        }
      }

      await onSendMessage(
        message.trim(),
        type,
        uploadedMedia.length > 0 ? uploadedMedia : undefined,
        replyTo?.id
      );

      // Clear state
      setMessage('');
      pendingMedia.forEach(item => {
        if (item.preview) URL.revokeObjectURL(item.preview);
      });
      setPendingMedia([]);
      onCancelReply?.();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setIsSending(false);
    }
  }, [message, pendingMedia, conversationId, replyTo, onSendMessage, onCancelReply, isSending, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">
              Repondre a {replyTo.sender.prenom}
            </p>
            <p className="text-sm text-gray-700 truncate">
              {replyTo.content || '[Media]'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded hover:bg-gray-200"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}

      {/* Pending media preview */}
      {pendingMedia.length > 0 && (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto bg-gray-50 border-b border-gray-200">
          {pendingMedia.map((item, index) => (
            <div key={index} className="relative shrink-0">
              {item.preview ? (
                <img
                  src={item.preview || "/placeholder.svg"}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Paperclip className="w-6 h-6 text-gray-500" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removePendingMedia(index)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recording UI */}
      {isRecording && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border-b border-red-100">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm text-red-700 font-medium">
            Enregistrement... {formatDuration(recordingDuration)}
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={cancelRecording}
            className="p-2 rounded-full hover:bg-red-100 text-red-600"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={stopRecording}
            className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
          >
            <StopCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Input area */}
      {!isRecording && (
        <div className="flex items-end gap-2 p-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            disabled={disabled}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            disabled={disabled}
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                onTyping?.();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ecrivez un message..."
              disabled={disabled}
              rows={1}
              className={cn(
                'w-full resize-none rounded-2xl border border-gray-200 px-4 py-2.5',
                'focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/20 focus:border-[#0F4C5C]',
                'max-h-32 text-sm',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              style={{ minHeight: '42px' }}
            />
          </div>

          {!message.trim() && pendingMedia.length === 0 ? (
            <button
              type="button"
              onClick={startRecording}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              disabled={disabled}
            >
              <Mic className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || disabled}
              className={cn(
                'p-2 rounded-full transition-colors',
                isSending
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-[#0F4C5C] text-white hover:bg-[#0F4C5C]/90'
              )}
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
