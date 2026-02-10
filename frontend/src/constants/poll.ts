/**
 * Poll Configuration Constants
 * Centralized constants for poll-related features
 */

// Timer settings
export const POLL_TIMER = {
  DEFAULT: 30 as number,
  MIN: 10 as number,
  MAX: 300 as number,
  STEP: 30 as number,
};

// Options settings
export const POLL_OPTIONS = {
  TOTAL: 12,
  MIN_SELECTED: 2,
} as const;

// Question history settings
export const QUESTION_HISTORY = {
  MAX_ITEMS: 10,
  STORAGE_KEY: 'tiktok-poll-questionHistory',
} as const;

// Default poll options (fixed 12 options)
export const DEFAULT_OPTIONS = [
  'Sim',
  'Não',
  'Correr',
  'Pular',
  'Laboratório',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
] as const;

// Default selected options (indices 0 and 1 - "Sim" and "Não")
export const DEFAULT_SELECTED_OPTIONS = [
  true, true, false, false, false, false, 
  false, false, false, false, false, false,
] as const;

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
