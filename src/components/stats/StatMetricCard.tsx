// src/components/stats/StatMetricCard.tsx
"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Color = "teal" | "gold" | "blue" | "pink" | "purple";

interface StatMetricCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  color: Color;
  suffix?: string;
}

const colorMap: Record<
  Color,
  { bg: string; icon: string; text: string; border: string }
> = {
  teal: {
    bg: "bg-[#0F4C5C]/8 dark:bg-[#0F4C5C]/20",
    icon: "text-[#0F4C5C] dark:text-[#4CA8BF]",
    text: "text-[#0F4C5C] dark:text-[#4CA8BF]",
    border: "border-[#0F4C5C]/15",
  },
  gold: {
    bg: "bg-[#B88A4F]/8 dark:bg-[#B88A4F]/20",
    icon: "text-[#B88A4F]",
    text: "text-[#B88A4F]",
    border: "border-[#B88A4F]/15",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    icon: "text-blue-600 dark:text-blue-400",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-100 dark:border-blue-800",
  },
  pink: {
    bg: "bg-pink-50 dark:bg-pink-900/20",
    icon: "text-pink-500 dark:text-pink-400",
    text: "text-pink-500 dark:text-pink-400",
    border: "border-pink-100 dark:border-pink-800",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    icon: "text-purple-600 dark:text-purple-400",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-100 dark:border-purple-800",
  },
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export default function StatMetricCard({
  icon: Icon,
  label,
  value,
  color,
  suffix,
}: StatMetricCardProps) {
  const c = colorMap[color];

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 rounded-xl border p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow",
        c.border
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center",
          c.bg
        )}
      >
        <Icon className={cn("w-4.5 h-4.5", c.icon)} strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {label}
        </p>
        <p className={cn("text-2xl font-bold mt-0.5", c.text)}>
          {formatNumber(value)}
          {suffix && (
            <span className="text-sm font-normal ml-1">{suffix}</span>
          )}
        </p>
      </div>
    </div>
  );
}