// src/components/stats/ReactionsBreakdown.tsx
"use client";

interface ReactionData {
  code: string;
  label: string;
  emoji: string;
  count: number;
}

interface ReactionsBreakdownProps {
  data: ReactionData[];
  total: number;
}

export default function ReactionsBreakdown({
  data,
  total,
}: ReactionsBreakdownProps) {
  const sorted = [...data].sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-3">
      {sorted.map((reaction) => {
        const pct = total > 0 ? Math.round((reaction.count / total) * 100) : 0;

        return (
          <div key={reaction.code} className="flex items-center gap-3">
            {/* Emoji + label */}
            <div className="flex items-center gap-1.5 w-28 shrink-0">
              <span className="text-lg leading-none">{reaction.emoji}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate">
                {reaction.label}
              </span>
            </div>

            {/* Barre de progression */}
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0F4C5C] to-[#B88A4F] rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Valeur + % */}
            <div className="flex items-center gap-1 w-16 shrink-0 justify-end">
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {reaction.count}
              </span>
              <span className="text-xs text-gray-400">({pct}%)</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
