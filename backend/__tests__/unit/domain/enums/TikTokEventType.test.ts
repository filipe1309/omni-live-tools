import { TikTokEventType, TwitchEventType, PlatformType, ConnectionStatus, SocketEventType } from '../../../../domain/enums';

describe('Domain Enums', () => {
  describe('PlatformType', () => {
    it('should have all expected platform types', () => {
      expect(PlatformType.TIKTOK).toBe('tiktok');
      expect(PlatformType.TWITCH).toBe('twitch');
    });

    it('should have the correct number of platform types', () => {
      const platforms = Object.values(PlatformType);
      expect(platforms).toHaveLength(2);
    });
  });

  describe('TikTokEventType', () => {
    it('should have all expected event types', () => {
      expect(TikTokEventType.ROOM_USER).toBe('roomUser');
      expect(TikTokEventType.MEMBER).toBe('member');
      expect(TikTokEventType.CHAT).toBe('chat');
      expect(TikTokEventType.GIFT).toBe('gift');
      expect(TikTokEventType.SOCIAL).toBe('social');
      expect(TikTokEventType.LIKE).toBe('like');
      expect(TikTokEventType.QUESTION_NEW).toBe('questionNew');
      expect(TikTokEventType.LINK_MIC_BATTLE).toBe('linkMicBattle');
      expect(TikTokEventType.LINK_MIC_ARMIES).toBe('linkMicArmies');
      expect(TikTokEventType.LIVE_INTRO).toBe('liveIntro');
      expect(TikTokEventType.EMOTE).toBe('emote');
      expect(TikTokEventType.ENVELOPE).toBe('envelope');
      expect(TikTokEventType.SUBSCRIBE).toBe('subscribe');
      expect(TikTokEventType.STREAM_END).toBe('streamEnd');
    });

    it('should have the correct number of event types', () => {
      const eventTypes = Object.values(TikTokEventType);
      expect(eventTypes).toHaveLength(14);
    });
  });

  describe('TwitchEventType', () => {
    it('should have all expected Twitch event types', () => {
      expect(TwitchEventType.CHAT).toBe('chat');
      expect(TwitchEventType.SUB).toBe('sub');
      expect(TwitchEventType.RESUB).toBe('resub');
      expect(TwitchEventType.SUBGIFT).toBe('subgift');
      expect(TwitchEventType.CHEER).toBe('cheer');
      expect(TwitchEventType.RAID).toBe('raid');
      expect(TwitchEventType.BAN).toBe('ban');
      expect(TwitchEventType.TIMEOUT).toBe('timeout');
      expect(TwitchEventType.CONNECTED).toBe('connected');
      expect(TwitchEventType.DISCONNECTED).toBe('disconnected');
    });

    it('should have the correct number of Twitch event types', () => {
      const eventTypes = Object.values(TwitchEventType);
      expect(eventTypes).toHaveLength(10);
    });
  });

  describe('ConnectionStatus', () => {
    it('should have all expected connection statuses', () => {
      expect(ConnectionStatus.DISCONNECTED).toBe('disconnected');
      expect(ConnectionStatus.CONNECTING).toBe('connecting');
      expect(ConnectionStatus.CONNECTED).toBe('connected');
      expect(ConnectionStatus.RECONNECTING).toBe('reconnecting');
    });

    it('should have the correct number of statuses', () => {
      const statuses = Object.values(ConnectionStatus);
      expect(statuses).toHaveLength(4);
    });
  });

  describe('SocketEventType', () => {
    it('should have all expected socket event types', () => {
      // TikTok events
      expect(SocketEventType.TIKTOK_CONNECTED).toBe('tiktokConnected');
      expect(SocketEventType.TIKTOK_DISCONNECTED).toBe('tiktokDisconnected');
      expect(SocketEventType.SET_UNIQUE_ID).toBe('setUniqueId');
      // Twitch events
      expect(SocketEventType.TWITCH_CONNECTED).toBe('twitchConnected');
      expect(SocketEventType.TWITCH_DISCONNECTED).toBe('twitchDisconnected');
      expect(SocketEventType.SET_TWITCH_CHANNEL).toBe('setTwitchChannel');
      // Shared events
      expect(SocketEventType.STREAM_END).toBe('streamEnd');
      expect(SocketEventType.STATISTIC).toBe('statistic');
      expect(SocketEventType.CHAT).toBe('chat');
    });

    it('should have the correct number of socket event types', () => {
      const eventTypes = Object.values(SocketEventType);
      expect(eventTypes).toHaveLength(9);
    });
  });
});
