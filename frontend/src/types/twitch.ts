/**
 * Platform Types - Supported streaming platforms
 */
export enum PlatformType {
  TIKTOK = 'tiktok',
  TWITCH = 'twitch',
  YOUTUBE = 'youtube',
}

/**
 * Twitch User data from events
 */
export interface TwitchUser {
  odlUserId: string;
  username: string;
  displayName: string;
  color?: string;
  badges?: TwitchBadge[];
  isMod: boolean;
  isSubscriber: boolean;
  isBroadcaster: boolean;
  isVip: boolean;
}

export interface TwitchBadge {
  id: string;
  version: string;
}

/**
 * Twitch Connection State
 */
export interface TwitchConnectionState {
  channel: string;
  isConnected: boolean;
}

/**
 * Twitch Chat Message
 */
export interface TwitchChatMessage extends TwitchUser {
  message: string;
  timestamp: number;
  messageId?: string;
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
}

/**
 * YouTube Connection State
 */
export interface YouTubeConnectionState {
  videoId: string;
  channelName: string;
  isConnected: boolean;
}
