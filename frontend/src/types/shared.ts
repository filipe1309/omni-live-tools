/**
 * Shared types used across all platforms
 * Platform-agnostic types for multi-platform features
 */

import type { TikTokUser, GiftMessage } from './tiktok';

/**
 * Platform Types - Supported streaming platforms
 */
export enum PlatformType {
  TIKTOK = 'tiktok',
  TWITCH = 'twitch',
  YOUTUBE = 'youtube',
  KICK = 'kick',
}

/**
 * Unified Chat Message - Works across all platforms
 * Used for polls and features that need to process chat from any platform
 */
export interface UnifiedChatMessage {
  platform: PlatformType;
  odlUserId: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: number;
  profilePictureUrl?: string;
  badges?: Array<{ id: string; name?: string }>;
  isMod?: boolean;
  isSubscriber?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Platform Connection Config
 */
export interface PlatformConnectionConfig {
  tiktok?: {
    username: string;
  };
  twitch?: {
    channel: string;
  };
  youtube?: {
    videoId: string;
  };
  kick?: {
    channel: string;
  };
}

// Poll types
export interface PollOption {
  id: number;
  text: string;
}

export interface PollState {
  isRunning: boolean;
  finished: boolean;
  question: string;
  options: PollOption[];
  votes: Record<number, number>;
  voters: Set<string>;
  timer: number;
  timeLeft: number;
  countdown?: number; // 3, 2, 1, 0 (0 = GO!)
}

export interface VoteEntry {
  id: string;
  user: TikTokUser;
  optionId: number;
  optionText: string;
  timestamp: Date;
  platform?: PlatformType;
}

// Chat item for display
export interface ChatItem {
  id: string;
  type: 'chat' | 'gift' | 'like' | 'member' | 'social';
  user: TikTokUser;
  content: string;
  color?: string;
  timestamp: Date;
  isTemporary?: boolean;
  giftData?: GiftMessage;
  isPendingStreak?: boolean;
  platform?: PlatformType;
  isSuperchat?: boolean;
}
