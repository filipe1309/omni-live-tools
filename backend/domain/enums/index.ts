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

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
}

export enum SocketEventType {
  TIKTOK_CONNECTED = 'tiktokConnected',
  TIKTOK_DISCONNECTED = 'tiktokDisconnected',
  STREAM_END = 'streamEnd',
  SET_UNIQUE_ID = 'setUniqueId',
  STATISTIC = 'statistic',
}
