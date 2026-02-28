import { PlatformType } from '../enums';

/**
 * Unified Chat Message - Works across all platforms (TikTok, Twitch, YouTube, Kick)
 */
export interface UnifiedChatMessage {
  readonly platform: PlatformType;
  readonly odlUserId: string;
  readonly username: string;
  readonly displayName: string;
  readonly message: string;
  readonly timestamp: number;
  readonly profilePictureUrl?: string;
  readonly badges?: Array<{ id: string; name?: string }>;
  readonly isMod?: boolean;
  readonly isSubscriber?: boolean;
  readonly metadata?: Record<string, unknown>;
}
