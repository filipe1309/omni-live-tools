import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY_PREFIX = 'omni-poll-option-history';
const MAX_RECENT_OPTIONS = 20;

interface UseRecentPollOptionsReturn {
  recentOptions: string[];
  addRecentOption: (option: string) => void;
  clearRecentOptions: () => void;
  getFilteredSuggestions: (query: string) => string[];
}

/**
 * Helper function to get the storage key for a specific option slot.
 */
function getStorageKey(optionId: number): string {
  return `${STORAGE_KEY_PREFIX}-${String(optionId)}`;
}

/**
 * Helper function to load recent options from localStorage synchronously.
 */
function loadFromStorage(optionId: number): string[] {
  try {
    const key = getStorageKey(optionId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    console.warn('Failed to load recent poll options from localStorage');
  }
  return [];
}

/**
 * Hook for managing recently used poll options with localStorage persistence.
 * Each option slot (1-6) has its own separate history.
 * @param optionId - Required option ID (1-6) for per-option history.
 */
export function useRecentPollOptions(optionId: number): UseRecentPollOptionsReturn {
  // Initialize state with data from this option's storage key
  const [recentOptions, setRecentOptions] = useState<string[]>(() => loadFromStorage(optionId));

  // Re-sync if optionId changes (shouldn't happen but just in case)
  useEffect(() => {
    setRecentOptions(loadFromStorage(optionId));
  }, [optionId]);

  // Save to localStorage whenever recentOptions changes
  const saveToStorage = useCallback((options: string[]) => {
    try {
      localStorage.setItem(getStorageKey(optionId), JSON.stringify(options));
    } catch {
      console.warn('Failed to save recent poll options to localStorage');
    }
  }, [optionId]);

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
  }, [saveToStorage, optionId]);

  const clearRecentOptions = useCallback(() => {
    setRecentOptions([]);
    try {
      localStorage.removeItem(getStorageKey(optionId));
    } catch {
      console.warn('Failed to clear recent poll options from localStorage');
    }
  }, [optionId]);

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
