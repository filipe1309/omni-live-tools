/**
 * Twitch User Entity
 */
export interface TwitchUser {
  readonly odlUserId: string;
  readonly username: string;
  readonly displayName: string;
  readonly color?: string;
  readonly badges?: TwitchBadge[];
  readonly isMod: boolean;
  readonly isSubscriber: boolean;
  readonly isBroadcaster: boolean;
  readonly isVip: boolean;
}

/**
 * Twitch Badge
 */
export interface TwitchBadge {
  readonly id: string;
  readonly version: string;
}

/**
 * Factory function to create a Twitch user
 */
export function createTwitchUser(data: Partial<TwitchUser>): TwitchUser {
  return {
    odlUserId: data.odlUserId ?? '',
    username: data.username ?? '',
    displayName: data.displayName ?? data.username ?? '',
    color: data.color,
    badges: data.badges ?? [],
    isMod: data.isMod ?? false,
    isSubscriber: data.isSubscriber ?? false,
    isBroadcaster: data.isBroadcaster ?? false,
    isVip: data.isVip ?? false,
  };
}

/**
 * Twitch Connection State
 */
export interface TwitchConnectionState {
  readonly channel: string;
  readonly isConnected: boolean;
}
