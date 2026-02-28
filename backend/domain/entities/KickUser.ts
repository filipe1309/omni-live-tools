import { PlatformType } from '../enums';

/**
 * Kick User Entity
 */
export interface KickUser {
  readonly odlUserId: string;
  readonly odlKickId: number;
  readonly username: string;
  readonly displayName: string;
  readonly color?: string;
  readonly badges?: KickBadge[];
  readonly isMod: boolean;
  readonly isSubscriber: boolean;
  readonly isBroadcaster: boolean;
  readonly isVerified: boolean;
}

/**
 * Kick Badge
 */
export interface KickBadge {
  readonly type: string;
  readonly text?: string;
}

/**
 * Factory function to create a Kick user
 */
export function createKickUser(data: Partial<KickUser>): KickUser {
  return {
    odlUserId: data.odlUserId ?? '',
    odlKickId: data.odlKickId ?? 0,
    username: data.username ?? '',
    displayName: data.displayName ?? data.username ?? '',
    color: data.color,
    badges: data.badges ?? [],
    isMod: data.isMod ?? false,
    isSubscriber: data.isSubscriber ?? false,
    isBroadcaster: data.isBroadcaster ?? false,
    isVerified: data.isVerified ?? false,
  };
}

/**
 * Kick Connection State
 */
export interface KickConnectionState {
  readonly channel: string;
  readonly channelId: number;
  readonly isConnected: boolean;
}

/**
 * Factory function to create Kick unified message
 */
export function createKickUnifiedMessage(
  user: KickUser,
  message: string,
  messageId: string,
  timestamp: number = Date.now()
): import('./TwitchUser').UnifiedChatMessage {
  return {
    platform: PlatformType.KICK,
    odlUserId: user.odlUserId,
    username: user.username,
    displayName: user.displayName,
    message,
    timestamp,
    badges: user.badges?.map(b => ({ id: b.type, name: b.text || undefined })) ?? [],
    isMod: user.isMod,
    isSubscriber: user.isSubscriber,
    metadata: {
      color: user.color,
      messageId,
      isBroadcaster: user.isBroadcaster,
    },
  };
}
