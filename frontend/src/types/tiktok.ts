// TikTok User data from events
export interface TikTokUser {
  userId: string;
  uniqueId: string;
  nickname: string;
  profilePictureUrl: string;
  followRole: number;
  userBadges: UserBadge[];
  isModerator: boolean;
  isNewGifter: boolean;
  isSubscriber: boolean;
  topGifterRank: number | null;
}

export interface UserBadge {
  type: string;
  name: string;
}

// Room state after connection
export interface RoomState {
  roomId: string;
  roomInfo?: RoomInfo;
}

export interface RoomInfo {
  title: string;
  hostName: string;
  viewerCount: number;
}

// Event types
export interface ChatMessage extends TikTokUser {
  comment: string;
  timestamp: number;
}

export interface GiftMessage extends TikTokUser {
  giftId: number;
  giftName: string;
  giftPictureUrl: string;
  diamondCount: number;
  repeatCount: number;
  repeatEnd: boolean;
  giftType: number;
  describe: string;
}

export interface LikeMessage extends TikTokUser {
  likeCount: number;
  totalLikeCount: number;
  label: string;
}

export interface MemberMessage extends TikTokUser {
  label: string;
  timestamp: number;
}

export interface RoomUserMessage {
  viewerCount: number;
  topViewers: TikTokUser[];
}

export interface SocialMessage extends TikTokUser {
  displayType: string;
  label: string;
}

export interface StreamEndMessage {
  timestamp: number;
}

// Connection options
export interface ConnectionOptions {
  enableExtendedGiftInfo?: boolean;
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
  platform?: 'tiktok' | 'twitch';
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
  platform?: 'tiktok' | 'twitch';
}
