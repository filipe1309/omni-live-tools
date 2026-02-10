/**
 * Safe localStorage utilities with error handling
 */

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Safely get an item from localStorage with JSON parsing
 */
export function safeGetItem<T>(key: string, defaultValue: T): StorageResult<T> {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return { success: true, data: defaultValue };
    }
    const parsed = JSON.parse(item) as T;
    return { success: true, data: parsed };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to read from localStorage';
    console.error(`[Storage] Error reading "${key}":`, message);
    return { success: false, error: message, data: defaultValue };
  }
}

/**
 * Safely set an item in localStorage with JSON stringification
 * Handles quota exceeded errors gracefully
 */
export function safeSetItem<T>(key: string, value: T): StorageResult<void> {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return { success: true };
  } catch (error) {
    let message = 'Failed to save to localStorage';
    
    if (error instanceof Error) {
      // Check for quota exceeded error
      if (
        error.name === 'QuotaExceededError' ||
        error.message.includes('quota') ||
        error.message.includes('exceeded')
      ) {
        message = 'Armazenamento local cheio. Algumas configurações podem não ser salvas.';
        
        // Try to clear old data to make space
        try {
          cleanupOldStorage();
          // Retry after cleanup
          localStorage.setItem(key, JSON.stringify(value));
          return { success: true };
        } catch {
          // Still failed after cleanup
        }
      } else {
        message = error.message;
      }
    }
    
    console.error(`[Storage] Error writing "${key}":`, message);
    return { success: false, error: message };
  }
}

/**
 * Safely remove an item from localStorage
 */
export function safeRemoveItem(key: string): StorageResult<void> {
  try {
    localStorage.removeItem(key);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove from localStorage';
    console.error(`[Storage] Error removing "${key}":`, message);
    return { success: false, error: message };
  }
}

/**
 * Clean up old or less important storage items to free space
 */
function cleanupOldStorage(): void {
  const keysToCleanFirst = [
    'tiktok-poll-questionHistory', // Question history is not critical
  ];
  
  for (const key of keysToCleanFirst) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors during cleanup
    }
  }
}

/**
 * Get current localStorage usage estimate
 */
export function getStorageUsage(): { used: number; available: number; percentage: number } {
  let used = 0;
  
  try {
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        used += localStorage.getItem(key)?.length || 0;
      }
    }
  } catch {
    // Ignore errors
  }
  
  // Most browsers allow 5MB
  const available = 5 * 1024 * 1024;
  const percentage = (used / available) * 100;
  
  return { used, available, percentage };
}
