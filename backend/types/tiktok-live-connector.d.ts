// Type definitions for tiktok-live-connector
// This provides TypeScript support for the library

declare module 'tiktok-live-connector' {
  import { EventEmitter } from 'events';

  export interface WebcastPushConnectionOptions {
    sessionId?: string;
    enableExtendedGiftInfo?: boolean;
    requestOptions?: Record<string, unknown>;
    websocketOptions?: Record<string, unknown>;
  }

  export interface ConnectionState {
    roomId: string;
    upgradedToWebsocket: boolean;
    isConnected: boolean;
    roomInfo?: unknown;
  }

  export interface TikTokUser {
    uniqueId: string;
    nickname: string;
    profilePictureUrl: string;
    userId: string;
    followRole: number;
  }

  export interface ChatMessage extends TikTokUser {
    comment: string;
    timestamp: number;
  }

  export interface GiftMessage extends TikTokUser {
    giftId: number;
    giftName: string;
    giftPictureUrl: string;
    giftType: number;
    repeatCount: number;
    repeatEnd: boolean;
    diamondCount: number;
    describe: string;
  }

  export interface LikeMessage extends TikTokUser {
    likeCount: number;
    totalLikeCount: number;
    label: string;
  }

  export interface RoomUserMessage {
    viewerCount: number;
    topViewers: TikTokUser[];
  }

  export interface MemberMessage extends TikTokUser {
    actionId: number;
  }

  export interface SocialMessage extends TikTokUser {
    displayType: string;
    label: string;
  }

  export class WebcastPushConnection extends EventEmitter {
    constructor(uniqueId: string, options?: WebcastPushConnectionOptions);
    
    connect(): Promise<ConnectionState>;
    disconnect(): void;
    
    on(event: 'connected', listener: (state: ConnectionState) => void): this;
    on(event: 'disconnected', listener: () => void): this;
    on(event: 'streamEnd', listener: () => void): this;
    on(event: 'error', listener: (error: Error & { info?: string }) => void): this;
    on(event: 'chat', listener: (data: ChatMessage) => void): this;
    on(event: 'gift', listener: (data: GiftMessage) => void): this;
    on(event: 'like', listener: (data: LikeMessage) => void): this;
    on(event: 'roomUser', listener: (data: RoomUserMessage) => void): this;
    on(event: 'member', listener: (data: MemberMessage) => void): this;
    on(event: 'social', listener: (data: SocialMessage) => void): this;
    on(event: 'questionNew', listener: (data: unknown) => void): this;
    on(event: 'linkMicBattle', listener: (data: unknown) => void): this;
    on(event: 'linkMicArmies', listener: (data: unknown) => void): this;
    on(event: 'liveIntro', listener: (data: unknown) => void): this;
    on(event: 'emote', listener: (data: unknown) => void): this;
    on(event: 'envelope', listener: (data: unknown) => void): this;
    on(event: 'subscribe', listener: (data: unknown) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
  }
}
