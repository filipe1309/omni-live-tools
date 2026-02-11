import { useEffect } from 'react';
import { POLL_SHORTCUTS, matchesShortcut } from '@/constants';

interface UsePollKeyboardShortcutsOptions {
  onStart?: () => void;
  onStop?: () => void;
  onReset?: () => void;
  isConnected?: boolean;
  isRunning: boolean;
  isCountingDown: boolean;
}

/**
 * Hook to handle poll control keyboard shortcuts
 * Provides Start, Stop, and Reset shortcuts with configurable callbacks
 */
export function usePollKeyboardShortcuts ({
  onStart,
  onStop,
  onReset,
  isConnected = true,
  isRunning,
  isCountingDown,
}: UsePollKeyboardShortcutsOptions) {
  useEffect(() => {
    // Skip if no handlers are provided
    if (!onStart && !onStop && !onReset) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Start: Configurable shortcut (default: CTRL+M)
      if (matchesShortcut(e, POLL_SHORTCUTS.START)) {
        e.preventDefault();
        if (onStart && isConnected && !isRunning && !isCountingDown) {
          onStart();
        }
        return;
      }

      // Stop: Configurable shortcut (default: Escape)
      if (matchesShortcut(e, POLL_SHORTCUTS.STOP)) {
        if (onStop && isRunning) {
          onStop();
        }
        return;
      }

      // Reset: Configurable shortcut (default: CTRL+.)
      if (matchesShortcut(e, POLL_SHORTCUTS.RESET)) {
        if (onReset && !isRunning) {
          onReset();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConnected, isRunning, isCountingDown, onStart, onStop, onReset]);
}
