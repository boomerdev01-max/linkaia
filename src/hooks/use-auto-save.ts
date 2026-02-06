"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Custom hook for auto-saving profile data with debounce
 *
 * @param callback - Function to call when data needs to be saved
 * @param delay - Debounce delay in milliseconds (default: 2000ms)
 */
export function useAutoSave<T>(
  data: T,
  callback: (data: T) => Promise<void>,
  delay: number = 2000
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousDataRef = useRef<T>(data);

  useEffect(() => {
    // Skip first render
    if (previousDataRef.current === data) {
      previousDataRef.current = data;
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        await callback(data);
        setLastSaved(new Date());
      } catch (error) {
        console.error("❌ Auto-save failed:", error);
      } finally {
        setIsSaving(false);
      }
    }, delay);

    previousDataRef.current = data;

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, callback, delay]);

  return { isSaving, lastSaved };
}
