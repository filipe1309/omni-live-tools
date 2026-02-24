import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'omni-live-tools-recent-poll-options';
const MAX_RECENT_OPTIONS = 20;

interface UseRecentPollOptionsReturn {
  recentOptions: string[];
  addRecentOption: (option: string) => void;
  clearRecentOptions: () => void;
  getFilteredSuggestions: (query: string) => string[];
}

/**
 * Hook for managing recently used poll options with localStorage persistence.
 * Provides autocomplete suggestions from previously used option texts.
 */
export function useRecentPollOptions(): UseRecentPollOptionsReturn {
  const [recentOptions, setRecentOptions] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentOptions(parsed);
        }
      }
    } catch {
      console.warn('Failed to load recent poll options from localStorage');
    }
  }, []);

  // Save to localStorage whenever recentOptions changes
  const saveToStorage = useCallback((options: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch {
      console.warn('Failed to save recent poll options to localStorage');
    }
  }, []);

  const addRecentOption = useCallback((option: string) => {
    const trimmed = option.trim();
    if (!trimmed) return;

    setRecentOptions((prev) => {
      // Remove existing entry if present (to move it to the top)
      const filtered = prev.filter(
        (item) => item.toLowerCase() !== trimmed.toLowerCase()
      );
      // Add to the beginning and limit to max
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_OPTIONS);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const clearRecentOptions = useCallback(() => {
    setRecentOptions([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      console.warn('Failed to clear recent poll options from localStorage');
    }
  }, []);

  const getFilteredSuggestions = useCallback(
    (query: string): string[] => {
      const trimmedQuery = query.trim().toLowerCase();
      if (!trimmedQuery) {
        return recentOptions; // Return all if no query
      }
      return recentOptions.filter((option) =>
        option.toLowerCase().includes(trimmedQuery)
      );
    },
    [recentOptions]
  );

  return {
    recentOptions,
    addRecentOption,
    clearRecentOptions,
    getFilteredSuggestions,
  };
}
