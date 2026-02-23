/**
 * Twitch-specific type definitions
 */

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

