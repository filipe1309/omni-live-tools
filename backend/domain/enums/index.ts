/**
 * Platform Types - Supported streaming platforms
 */
export enum PlatformType {
  TIKTOK = 'tiktok',
  TWITCH = 'twitch',
}

/**
 * TikTok Event Types - Domain enums
 */
export enum TikTokEventType {
  ROOM_USER = 'roomUser',
  MEMBER = 'member',
  CHAT = 'chat',
  GIFT = 'gift',
  SOCIAL = 'social',
  LIKE = 'like',
  QUESTION_NEW = 'questionNew',
  LINK_MIC_BATTLE = 'linkMicBattle',
  LINK_MIC_ARMIES = 'linkMicArmies',
  LIVE_INTRO = 'liveIntro',
  EMOTE = 'emote',
  ENVELOPE = 'envelope',
  SUBSCRIBE = 'subscribe',
  STREAM_END = 'streamEnd',
}

/**
 * Twitch Event Types
 */
export enum TwitchEventType {
  CHAT = 'chat',
  SUB = 'sub',
  RESUB = 'resub',
  SUBGIFT = 'subgift',
  CHEER = 'cheer',
  RAID = 'raid',
  BAN = 'ban',
  TIMEOUT = 'timeout',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
}

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
}

export enum SocketEventType {
  // TikTok events
  TIKTOK_CONNECTED = 'tiktokConnected',
  TIKTOK_DISCONNECTED = 'tiktokDisconnected',
  SET_UNIQUE_ID = 'setUniqueId',
  // Twitch events
  TWITCH_CONNECTED = 'twitchConnected',
  TWITCH_DISCONNECTED = 'twitchDisconnected',
  SET_TWITCH_CHANNEL = 'setTwitchChannel',
  // Shared events
  STREAM_END = 'streamEnd',
  STATISTIC = 'statistic',
  // Unified chat event (from any platform)
  CHAT = 'chat',
}
