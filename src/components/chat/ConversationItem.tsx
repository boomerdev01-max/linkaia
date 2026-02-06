// components/chat/ConversationItem.tsx
'use client';

import { cn } from '@/lib/utils';
import type { ConversationListItem } from '@/types/chat';

interface ConversationItemProps {
  conversation: ConversationListItem;
  isSelected?: boolean;
  onClick: () => void;
}

export function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: ConversationItemProps) {
  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `${diffDays} j`;
    
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks} sem.`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 hover:bg-gray-100 transition-colors text-left',
        isSelected && 'bg-gray-100'
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-full bg-[#0F4C5C] flex items-center justify-center overflow-hidden">
          {conversation.avatarUrl ? (
            <img
              src={conversation.avatarUrl || "/placeholder.svg"}
              alt={conversation.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white font-semibold text-lg">
              {conversation.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        {conversation.type === 'group' && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#B88A4F] rounded-full flex items-center justify-center">
            <span className="text-white text-xs">
              {conversation.participants.length}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className={cn(
            'font-medium text-gray-900 truncate',
            conversation.unreadCount > 0 && 'font-semibold'
          )}>
            {conversation.name}
          </h3>
          <span className={cn(
            'text-xs shrink-0',
            conversation.unreadCount > 0 ? 'text-[#0F4C5C] font-medium' : 'text-gray-500'
          )}>
            {formatTime(conversation.lastMessageTime)}
          </span>
        </div>
        
        <div className="flex items-center gap-2 mt-0.5">
          <p className={cn(
            'text-sm truncate flex-1',
            conversation.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
          )}>
            {conversation.lastMessage || 'Aucun message'}
          </p>
          
          {conversation.unreadCount > 0 && (
            <span className="shrink-0 min-w-5 h-5 rounded-full bg-[#0F4C5C] text-white text-xs font-medium flex items-center justify-center px-1.5">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
