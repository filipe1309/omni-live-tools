import { useEffect, useRef } from 'react';
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
 * 
 * Uses refs for callbacks to avoid event listener churn during rapid re-renders
 * (which was causing shortcuts to stop working during live sessions with many votes)
 */
export function usePollKeyboardShortcuts ({
  onStart,
  onStop,
  onReset,
  isConnected = true,
  isRunning,
  isCountingDown,
}: UsePollKeyboardShortcutsOptions) {
  // Store callbacks in refs to avoid recreating the event listener on every render
  // This fixes the bug where shortcuts stopped working during rapid state updates
  const onStartRef = useRef(onStart);
  const onStopRef = useRef(onStop);
  const onResetRef = useRef(onReset);

  // Keep refs up to date with latest callbacks
  useEffect(() => {
    onStartRef.current = onStart;
    onStopRef.current = onStop;
    onResetRef.current = onReset;
  });

  useEffect(() => {
    // Skip if no handlers are provided
    if (!onStart && !onStop && !onReset) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow shortcuts with modifier keys (Ctrl, Alt, Meta) even in input fields
      // Only block plain keypresses without modifiers when typing
      const target = e.target as HTMLElement;
      const isInInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      const hasModifier = e.ctrlKey || e.altKey || e.metaKey;

      if (isInInputField && !hasModifier) {
        return;
      }

      // Start: Configurable shortcut (default: CTRL+SHIFT+M)
      if (matchesShortcut(e, POLL_SHORTCUTS.START)) {
        e.preventDefault();
        if (onStartRef.current && isConnected && !isRunning && !isCountingDown) {
          onStartRef.current();
        }
        return;
      }

      // Stop: Configurable shortcut (default: CTRL+SHIFT+,)
      if (matchesShortcut(e, POLL_SHORTCUTS.STOP)) {
        e.preventDefault();
        if (onStopRef.current && isRunning) {
          onStopRef.current();
        }
        return;
      }

      // Reset: Configurable shortcut (default: CTRL+SHIFT+.)
      if (matchesShortcut(e, POLL_SHORTCUTS.RESET)) {
        e.preventDefault();
        if (onResetRef.current && !isRunning) {
          onResetRef.current();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // Note: callbacks are stored in refs, so we don't need them in deps
    // This prevents event listener churn during rapid re-renders
  }, [isConnected, isRunning, isCountingDown]);
}
