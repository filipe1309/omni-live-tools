/**
 * Poll-related type definitions
 * Centralized types for poll state synchronization and configuration
 */

import type { PollOption } from './shared';

/**
 * Serializable version of PollState for BroadcastChannel communication.
 * Set uses votersArray instead of Set<string> for serialization.
 */
export interface SerializablePollState {
  isRunning: boolean;
  finished: boolean;
  question: string;
  options: PollOption[];
  votes: Record<number, number>;
  votersArray: string[];
  timer: number;
  timeLeft: number;
  countdown?: number;
}

/**
 * Poll setup configuration for preview and initialization
 */
export interface SetupConfig {
  question: string;
  options: PollOption[];
  timer: number;
  showStatusBar?: boolean;
  showBorder?: boolean;
  resultsFontSize?: number;
}

/**
 * Full options configuration including all 4 options and selection state
 */
export interface FullOptionsConfig {
  allOptions: string[];
  selectedOptions: boolean[];
}

/**
 * Poll control commands sent via BroadcastChannel
 */
export type PollCommand = 'start' | 'stop' | 'reset';

/**
 * Handler functions for poll control commands
 */
export interface SyncCommandHandlers {
  start: () => void;
  stop: () => void;
  reset: () => void;
}
