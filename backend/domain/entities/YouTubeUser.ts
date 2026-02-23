import { PlatformType } from '../enums';

/**
 * YouTube User Entity
 */
export interface YouTubeUser {
  readonly odlUserId: string;
  readonly channelId: string;
  readonly username: string;
  readonly displayName: string;
  readonly profilePictureUrl?: string;
  readonly isMember: boolean;
  readonly isModerator: boolean;
  readonly isOwner: boolean;
  readonly isVerified: boolean;
  readonly badges?: YouTubeBadge[];
}

/**
 * YouTube Badge
 */
export interface YouTubeBadge {
  readonly id: string;
  readonly label?: string;
  readonly iconUrl?: string;
}

/**
 * Factory function to create a YouTube user
 */
export function createYouTubeUser(data: Partial<YouTubeUser>): YouTubeUser {
  return {
    odlUserId: data.odlUserId ?? '',
    channelId: data.channelId ?? '',
    username: data.username ?? '',
    displayName: data.displayName ?? data.username ?? '',
    profilePictureUrl: data.profilePictureUrl,
    isMember: data.isMember ?? false,
    isModerator: data.isModerator ?? false,
    isOwner: data.isOwner ?? false,
    isVerified: data.isVerified ?? false,
    badges: data.badges ?? [],
  };
}

/**
 * YouTube Connection State
 */
export interface YouTubeConnectionState {
  readonly videoId: string;
  readonly channelName: string;
  readonly isConnected: boolean;
}

/**
 * YouTube Chat Message
 */
export interface YouTubeChatMessage extends YouTubeUser {
  readonly message: string;
  readonly timestamp: number;
  readonly messageId?: string;
  readonly superchat?: YouTubeSuperchat;
}

/**
 * YouTube Superchat (Super Chat / Super Sticker)
 */
export interface YouTubeSuperchat {
  readonly amount: string;
  readonly currency: string;
  readonly color: string;
  readonly sticker?: {
    readonly id: string;
    readonly url: string;
  };
}

/**
 * Create a UnifiedChatMessage from YouTube chat
 */
export function createYouTubeUnifiedMessage(
  user: YouTubeUser,
  message: string,
  timestamp: number,
  messageId?: string
): import('./TwitchUser').UnifiedChatMessage {
  return {
    platform: PlatformType.YOUTUBE,
    odlUserId: user.odlUserId,
    username: user.username,
    displayName: user.displayName,
    message,
    timestamp,
    profilePictureUrl: user.profilePictureUrl,
    badges: user.badges?.map(b => ({ id: b.id, name: b.label })),
    isMod: user.isModerator,
    isSubscriber: user.isMember,
    metadata: { messageId },
  };
}
