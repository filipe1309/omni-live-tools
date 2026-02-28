/**
 * Platform Types - Supported streaming platforms
 */
export enum PlatformType {
  TIKTOK = 'tiktok',
  TWITCH = 'twitch',
  YOUTUBE = 'youtube',
  KICK = 'kick',
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

/**
 * YouTube Event Types
 */
export enum YouTubeEventType {
  CHAT = 'chat',
  SUPERCHAT = 'superchat',
  MEMBER = 'member',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  STREAM_END = 'streamEnd',
}

/**
 * Kick Event Types
 */
export enum KickEventType {
  CHAT = 'chat',
  SUB = 'sub',
  GIFTED_SUB = 'giftedSub',
  HOST = 'host',
  BAN = 'ban',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTED = 'reconnected',
  STREAM_END = 'streamEnd',
}

export enum SocketEventType {
  // TikTok events
  TIKTOK_CONNECTED = 'tiktokConnected',
  TIKTOK_DISCONNECTED = 'tiktokDisconnected',
  TIKTOK_RECONNECTED = 'tiktokReconnected',
  SET_UNIQUE_ID = 'setUniqueId',
  // Twitch events
  TWITCH_CONNECTED = 'twitchConnected',
  TWITCH_DISCONNECTED = 'twitchDisconnected',
  TWITCH_RECONNECTED = 'twitchReconnected',
  SET_TWITCH_CHANNEL = 'setTwitchChannel',
  // YouTube events
  YOUTUBE_CONNECTED = 'youtubeConnected',
  YOUTUBE_DISCONNECTED = 'youtubeDisconnected',
  YOUTUBE_RECONNECTED = 'youtubeReconnected',
  SET_YOUTUBE_VIDEO = 'setYouTubeVideo',
  // Kick events
  KICK_CONNECTED = 'kickConnected',
  KICK_DISCONNECTED = 'kickDisconnected',
  KICK_RECONNECTED = 'kickReconnected',
  SET_KICK_CHANNEL = 'setKickChannel',
  // Shared events
  STREAM_END = 'streamEnd',
  STATISTIC = 'statistic',
  // Unified chat event (from any platform)
  CHAT = 'chat',
}
