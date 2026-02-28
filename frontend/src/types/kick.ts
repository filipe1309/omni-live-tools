/**
 * Kick-specific type definitions
 */

/**
 * Kick User data from events
 */
export interface KickUser {
  odlUserId: string;
  odlKickId: number;
  username: string;
  displayName: string;
  color?: string;
  badges?: KickBadge[];
  isMod: boolean;
  isSubscriber: boolean;
  isBroadcaster: boolean;
  isVerified: boolean;
}

export interface KickBadge {
  type: string;
  text?: string;
}

/**
 * Kick Connection State
 */
export interface KickConnectionState {
  channel: string;
  channelId: number;
  isConnected: boolean;
}

/**
 * Kick Chat Message
 */
export interface KickChatMessage extends KickUser {
  message: string;
  timestamp: number;
  messageId?: string;
}
