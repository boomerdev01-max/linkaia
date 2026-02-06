// components/chat/TypingIndicator.tsx
'use client';

import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  userNames: string[];
  className?: string;
}

export function TypingIndicator({ userNames, className }: TypingIndicatorProps) {
  if (userNames.length === 0) return null;

  const getText = () => {
    if (userNames.length === 1) {
      return `${userNames[0]} ecrit`;
    }
    if (userNames.length === 2) {
      return `${userNames[0]} et ${userNames[1]} ecrivent`;
    }
    return `${userNames[0]} et ${userNames.length - 1} autres ecrivent`;
  };

  return (
    <div className={cn('flex items-center gap-2 px-4 py-2', className)}>
      <div className="flex gap-1">
        <div
          className="w-2 h-2 bg-[#0F4C5C] rounded-full animate-bounce"
          style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
        />
        <div
          className="w-2 h-2 bg-[#0F4C5C] rounded-full animate-bounce"
          style={{ animationDelay: '200ms', animationDuration: '1.4s' }}
        />
        <div
          className="w-2 h-2 bg-[#0F4C5C] rounded-full animate-bounce"
          style={{ animationDelay: '400ms', animationDuration: '1.4s' }}
        />
      </div>
      <span className="text-sm text-gray-500 italic">{getText()}...</span>
    </div>
  );
}
