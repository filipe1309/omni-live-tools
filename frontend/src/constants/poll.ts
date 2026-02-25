/**
 * Poll Configuration Constants
 * Centralized constants for poll-related features
 */

import type { PollOption } from '@/types';

// Timer settings
export const POLL_TIMER = {
  DEFAULT: 30 as number,
  MIN: 10 as number,
  MAX: 300 as number,
  STEP: 30 as number,
};

// Options settings
export const POLL_OPTIONS = {
  TOTAL: 6,
  MIN_SELECTED: 2,
} as const;

// Storage keys - centralized for consistency
// Use omni-poll- prefix since the app supports multiple platforms
export const STORAGE_KEYS = {
  SETUP_CONFIG: 'omni-poll-setupConfig',
  FULL_OPTIONS: 'omni-poll-fullOptions',
  AUTO_RECONNECT: 'omni-poll-autoReconnect',
  QUESTION_HISTORY: 'omni-poll-questionHistory',
  OPTION_HISTORY: 'omni-poll-optionHistory',
  PROFILES: 'omni-poll-profiles',
  SELECTED_PROFILE: 'omni-poll-selectedProfile',
} as const;

// Question history settings
export const QUESTION_HISTORY = {
  MAX_ITEMS: 10,
  STORAGE_KEY: STORAGE_KEYS.QUESTION_HISTORY,
} as const;

// Option history settings
export const OPTION_HISTORY = {
  MAX_ITEMS: 10,
  STORAGE_KEY: STORAGE_KEYS.OPTION_HISTORY,
} as const;

// Poll profiles settings
export const POLL_PROFILES = {
  STORAGE_KEY: STORAGE_KEYS.PROFILES,
  SELECTED_KEY: STORAGE_KEYS.SELECTED_PROFILE,
  MAX_PROFILES: 20,
} as const;

// Default poll options (fixed 6 options)
export const DEFAULT_OPTIONS = [
  'Sim',
  'Não',
  'Correr',
  'Pular',
  'Atacar',
  'Defender',
] as const;

// Default selected options (indices 0 and 1 - "Sim" and "Não")
export const DEFAULT_SELECTED_OPTIONS = [
  true, true, false, false, false, false,
] as const;

// Default poll options as typed PollOption array (for components)
export const DEFAULT_POLL_OPTIONS: PollOption[] = [
  { id: 1, text: 'Sim' },
  { id: 2, text: 'Não' },
];

// Default poll question
export const DEFAULT_QUESTION = 'Votar agora!';

// Confetti settings
export const CONFETTI = {
  DURATION: 3000,
  INTERVAL: 250,
  PARTICLE_COUNT_MULTIPLIER: 50,
  COLORS: ['#00f2ea', '#ff0050', '#fffc00', '#ee1d52'] as string[], // TikTok colors
} as const;

// Timer warning thresholds
export const TIMER_THRESHOLDS = {
  CRITICAL: 5,  // Red/pulsing
  WARNING: 10,  // Yellow
} as const;

// Keyboard shortcut type with modifier support
export interface KeyboardShortcut {
  key: string;       // The key (e.g., 'm', 'Enter', ' ', 'Escape')
  ctrl?: boolean;    // Require CTRL key
  alt?: boolean;     // Require ALT key
  shift?: boolean;   // Require SHIFT key
  meta?: boolean;    // Require META (Cmd on Mac, Win on Windows)
}

// Keyboard shortcuts for poll control
// Easily configurable - change these values to customize shortcuts
// Examples:
//   { key: 'm', ctrl: true }              -> CTRL+M
//   { key: 'Enter' }                      -> Enter alone
//   { key: 'Escape' }                     -> Escape alone
//   { key: 's', ctrl: true, shift: true } -> CTRL+SHIFT+S
//   { key: ' ' }                          -> Spacebar alone
//   { key: 'R' }                          -> R alone
export const POLL_SHORTCUTS: {
  START: KeyboardShortcut[];
  STOP: KeyboardShortcut[];
  RESET: KeyboardShortcut[];
} = {
  START: [
    { key: 'M', ctrl: true, shift: true },       // CTRL+SHIFT+M to start
  ],
  STOP: [
    { key: ',', ctrl: true, shift: true },      // CTRL+SHIFT+, to stop
  ],
  RESET: [
    { key: '.', ctrl: true, shift: true },           // CTRL+SHIFT+. to reset
  ],
};

// Helper function to check if a keyboard event matches a shortcut
export function matchesShortcut (e: KeyboardEvent, shortcuts: KeyboardShortcut[]): boolean {
  return shortcuts.some(shortcut => {
    // Case-insensitive key matching to handle Caps Lock scenarios
    // (Caps Lock + Shift can produce lowercase letters on some systems)
    const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
    const ctrlMatch = !!shortcut.ctrl === e.ctrlKey;
    const altMatch = !!shortcut.alt === e.altKey;
    const shiftMatch = !!shortcut.shift === e.shiftKey;
    const metaMatch = !!shortcut.meta === e.metaKey;
    return keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch;
  });
}

// Helper function to generate a readable label from a shortcut
function shortcutToLabel (shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.meta) parts.push('⌘');

  // Format special keys for display
  let keyLabel = shortcut.key;
  if (shortcut.key === ' ') keyLabel = 'Space';
  else if (shortcut.key === 'Escape') keyLabel = 'Esc';
  else if (shortcut.key === 'Enter') keyLabel = 'Enter';

  parts.push(keyLabel);
  return parts.join('+');
}

// Generate labels from the first shortcut in each array (auto-updated)
export const POLL_SHORTCUT_LABELS = {
  START: shortcutToLabel(POLL_SHORTCUTS.START[0]),
  STOP: shortcutToLabel(POLL_SHORTCUTS.STOP[0]),
  RESET: shortcutToLabel(POLL_SHORTCUTS.RESET[0]),
};
