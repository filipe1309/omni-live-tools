/**
 * TikTok User Entity
 */
export interface TikTokUser {
  readonly uniqueId: string;
  readonly nickname?: string;
  readonly profilePictureUrl?: string;
  readonly userId?: string;
  readonly followRole?: number;
}

/**
 * Factory function to create a TikTok user
 */
export function createTikTokUser(data: Partial<TikTokUser>): TikTokUser {
  return {
    uniqueId: data.uniqueId ?? '',
    nickname: data.nickname,
    profilePictureUrl: data.profilePictureUrl,
    userId: data.userId,
    followRole: data.followRole,
  };
}
