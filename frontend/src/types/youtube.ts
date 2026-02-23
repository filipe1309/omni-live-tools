/**
 * YouTube-specific type definitions
 */

/**
 * YouTube Connection State
 */
export interface YouTubeConnectionState {
  videoId: string;
  channelName: string;
  isConnected: boolean;
}

/**
 * YouTube User data from events
 */
export interface YouTubeUser {
  odlUserId: string;
  channelId: string;
  username: string;
  displayName: string;
  profilePictureUrl?: string;
  isMember: boolean;
  isModerator: boolean;
  isOwner: boolean;
  isVerified: boolean;
  badges?: Array<{ id: string; label?: string; iconUrl?: string }>;
}

/**
 * YouTube Super Chat data
 */
export interface YouTubeSuperChat {
  amount: string;
  currency: string;
  color: string;
}
