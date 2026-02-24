import { Socket } from 'socket.io';
import { TikTokEventType, SocketEventType, PlatformType } from '../../domain/enums';
import { ConnectionOptions, sanitizeConnectionOptions, UnifiedChatMessage } from '../../domain/entities';
import { RateLimiterService, StatisticsService } from '../../application/services';
import { 
  TikTokConnectionWrapper, 
  createTikTokConnectionWrapper,
  TikFinityConnectionWrapper,
  createTikFinityConnectionWrapper 
} from '../../infrastructure/tiktok';
import {
  TwitchConnectionWrapper,
  createTwitchConnectionWrapper
} from '../../infrastructure/twitch';
import {
  YouTubeConnectionWrapper,
  createYouTubeConnectionWrapper
} from '../../infrastructure/youtube';

/**
 * Error patterns that indicate eulerstream/rate limit issues
 */
const RATE_LIMIT_ERROR_PATTERNS = [
  'rate limit',
  'too many requests',
  '429',
  'eulerstream',
  'temporarily blocked',
  'quota exceeded',
  'request limit',
];

/**
 * Socket Handler - Handles individual socket connections
 */
export class SocketHandler {
  private connectionWrapper: TikTokConnectionWrapper | null = null;
  private tikfinityWrapper: TikFinityConnectionWrapper | null = null;
  private twitchWrapper: TwitchConnectionWrapper | null = null;
  private youtubeWrapper: YouTubeConnectionWrapper | null = null;
  private clientIp: string;
  private useFallback = false;

  constructor(
    private readonly socket: Socket,
    private readonly rateLimiterService: RateLimiterService,
    private readonly statisticsService: StatisticsService,
    private readonly sessionId?: string
  ) {
    this.clientIp = this.extractClientIp();
    this.setupEventHandlers();
  }

  /**
   * Set up socket event handlers
   */
  private setupEventHandlers(): void {
    this.logConnection();

    // TikTok connection handler
    this.socket.on(SocketEventType.SET_UNIQUE_ID, this.handleSetUniqueId.bind(this));
    this.socket.on('disconnectTikTok', this.handleDisconnectTikTok.bind(this));
    // Twitch connection handler
    this.socket.on(SocketEventType.SET_TWITCH_CHANNEL, this.handleSetTwitchChannel.bind(this));
    this.socket.on('disconnectTwitch', this.handleDisconnectTwitch.bind(this));
    // YouTube connection handler
    this.socket.on(SocketEventType.SET_YOUTUBE_VIDEO, this.handleSetYouTubeVideo.bind(this));
    this.socket.on('disconnectYouTube', this.handleDisconnectYouTube.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));

    // Chat relay handlers for overlay communication
    this.socket.on('join-chat-relay', this.handleJoinChatRelay.bind(this));
    this.socket.on('leave-chat-relay', this.handleLeaveChatRelay.bind(this));
    this.socket.on('relay-chat-update', this.handleRelayChatUpdate.bind(this));
    
    // Platform events room - allows overlay to receive events from any connected platform
    this.socket.on('join-platform-events', this.handleJoinPlatformEvents.bind(this));
    this.socket.on('leave-platform-events', this.handleLeavePlatformEvents.bind(this));
  }

  /**
   * Handle disconnectTikTok event
   */
  private handleDisconnectTikTok(): void {
    if (this.connectionWrapper) {
      console.info('Disconnecting TikTok by client request');
      this.connectionWrapper.disconnect();
      this.connectionWrapper = null;
    }
    if (this.tikfinityWrapper) {
      this.tikfinityWrapper.disconnect();
      this.tikfinityWrapper = null;
    }
  }

  /**
   * Handle disconnectTwitch event
   */
  private handleDisconnectTwitch(): void {
    if (this.twitchWrapper) {
      console.info('Disconnecting Twitch by client request');
      this.twitchWrapper.disconnect();
      this.twitchWrapper = null;
    }
  }

  /**
   * Handle disconnectYouTube event
   */
  private handleDisconnectYouTube(): void {
    if (this.youtubeWrapper) {
      console.info('Disconnecting YouTube by client request');
      this.youtubeWrapper.disconnect();
      this.youtubeWrapper = null;
    }
  }

  /**
   * Handle join-chat-relay event - overlay joins the relay room
   */
  private handleJoinChatRelay(): void {
    console.info('Client joining chat-relay room');
    this.socket.join('chat-relay');
  }

  /**
   * Handle leave-chat-relay event - overlay leaves the relay room
   */
  private handleLeaveChatRelay(): void {
    console.info('Client leaving chat-relay room');
    this.socket.leave('chat-relay');
  }

  /**
   * Handle relay-chat-update event - main app broadcasts chat items to overlays
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleRelayChatUpdate(data: any): void {
    // Broadcast to all clients in the chat-relay room except sender
    this.socket.to('chat-relay').emit('chat-relay-update', data);
  }

  /**
   * Handle join-platform-events event - overlay joins room to receive platform events
   */
  private handleJoinPlatformEvents(): void {
    console.info('Client joining platform-events room');
    this.socket.join('platform-events');
  }

  /**
   * Handle leave-platform-events event - overlay leaves the platform events room
   */
  private handleLeavePlatformEvents(): void {
    console.info('Client leaving platform-events room');
    this.socket.leave('platform-events');
  }

  /**
   * Handle setUniqueId event
   */
  private handleSetUniqueId(uniqueId: string, options: unknown): void {
    // Sanitize options for security
    const sanitizedOptions = sanitizeConnectionOptions(options);

    // Add session ID if available
    if (this.sessionId) {
      sanitizedOptions.sessionId = this.sessionId;
      console.info('Using SessionId');
    }

    // Check rate limiting
    this.rateLimiterService.recordRequest(this.clientIp);
    
    if (this.rateLimiterService.shouldBlockClient(this.clientIp)) {
      this.socket.emit(
        SocketEventType.TIKTOK_DISCONNECTED,
        this.rateLimiterService.getRateLimitMessage()
      );
      return;
    }

    // Create connection
    this.connectToTikTok(uniqueId, sanitizedOptions);
  }

  /**
   * Connect to TikTok live stream
   */
  private connectToTikTok(uniqueId: string, options: ConnectionOptions): void {
    try {
      const connectionFactory = createTikTokConnectionWrapper(
        (delta) => {
          if (delta > 0) {
            this.statisticsService.incrementConnectionCount();
          } else {
            this.statisticsService.decrementConnectionCount();
          }
        }
      );

      this.connectionWrapper = connectionFactory(uniqueId, options);
      
      // Set up event forwarding
      this.setupTikTokEventForwarding();

      // Handle connection errors to trigger fallback
      this.connectionWrapper.once('disconnected', (reason: string) => {
        const reasonLower = String(reason).toLowerCase();
        const isRateLimitError = RATE_LIMIT_ERROR_PATTERNS.some(
          pattern => reasonLower.includes(pattern)
        );

        if (isRateLimitError && !this.useFallback) {
          console.info(`Rate limit detected, attempting TikFinity fallback for @${uniqueId}`);
          this.useFallback = true;
          this.connectToTikFinity(uniqueId);
        } else {
          this.socket.emit(SocketEventType.TIKTOK_DISCONNECTED, reason);
        }
      });

      // Connect
      this.connectionWrapper.connect().catch((err) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorLower = errorMessage.toLowerCase();
        const isRateLimitError = RATE_LIMIT_ERROR_PATTERNS.some(
          pattern => errorLower.includes(pattern)
        );

        if (isRateLimitError && !this.useFallback) {
          console.info(`Rate limit detected on connect, attempting TikFinity fallback for @${uniqueId}`);
          this.useFallback = true;
          this.connectToTikFinity(uniqueId);
        } else {
          this.socket.emit(SocketEventType.TIKTOK_DISCONNECTED, errorMessage);
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.socket.emit(SocketEventType.TIKTOK_DISCONNECTED, errorMessage);
    }
  }

  /**
   * Connect to TikFinity as fallback
   */
  private connectToTikFinity(uniqueId: string): void {
    try {
      console.info(`Connecting to TikFinity fallback for @${uniqueId}`);
      
      const tikfinityFactory = createTikFinityConnectionWrapper(
        {
          endpoint: process.env.TIKFINITY_WS_ENDPOINT || 'wss://tikfinity.zerody.one/tiktok/dapi',
        },
        (delta) => {
          if (delta > 0) {
            this.statisticsService.incrementConnectionCount();
          } else {
            this.statisticsService.decrementConnectionCount();
          }
        }
      );

      this.tikfinityWrapper = tikfinityFactory(uniqueId);
      
      // Set up event forwarding for TikFinity
      this.setupTikFinityEventForwarding();

      // Connect
      this.tikfinityWrapper.connect().catch((err) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        this.socket.emit(
          SocketEventType.TIKTOK_DISCONNECTED, 
          `Both TikTok and TikFinity connections failed: ${errorMessage}`
        );
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.socket.emit(
        SocketEventType.TIKTOK_DISCONNECTED, 
        `TikFinity fallback failed: ${errorMessage}`
      );
    }
  }

  /**
   * Set up TikTok event forwarding to the socket
   */
  private setupTikTokEventForwarding(): void {
    if (!this.connectionWrapper) return;

    // Control events (once)
    this.connectionWrapper.once('connected', (state) => {
      this.socket.emit(SocketEventType.TIKTOK_CONNECTED, state);
      // Also broadcast to platform-events room
      this.socket.to('platform-events').emit(SocketEventType.TIKTOK_CONNECTED, state);
    });

    // Handle reconnection events (can happen multiple times during auto-reconnect)
    this.connectionWrapper.on('reconnected', (state) => {
      this.socket.emit(SocketEventType.TIKTOK_RECONNECTED, state);
      this.socket.to('platform-events').emit(SocketEventType.TIKTOK_RECONNECTED, state);
    });

    // Get underlying connection for message events
    const connection = this.connectionWrapper.getConnection();

    // Stream end event
    connection.on(TikTokEventType.STREAM_END, () => {
      this.socket.emit(SocketEventType.STREAM_END);
      this.socket.to('platform-events').emit(SocketEventType.STREAM_END);
    });

    // Forward all TikTok message events
    const messageEvents: TikTokEventType[] = [
      TikTokEventType.ROOM_USER,
      TikTokEventType.MEMBER,
      TikTokEventType.CHAT,
      TikTokEventType.GIFT,
      TikTokEventType.SOCIAL,
      TikTokEventType.LIKE,
      TikTokEventType.QUESTION_NEW,
      TikTokEventType.LINK_MIC_BATTLE,
      TikTokEventType.LINK_MIC_ARMIES,
      TikTokEventType.LIVE_INTRO,
      TikTokEventType.EMOTE,
      TikTokEventType.ENVELOPE,
      TikTokEventType.SUBSCRIBE,
    ];

    for (const event of messageEvents) {
      connection.on(event, (msg: unknown) => {
        this.socket.emit(event, msg);
        // Also broadcast to platform-events room
        this.socket.to('platform-events').emit(event, msg);
      });
    }
  }

  /**
   * Set up TikFinity event forwarding to the socket
   */
  private setupTikFinityEventForwarding(): void {
    if (!this.tikfinityWrapper) return;

    // Control events (once)
    this.tikfinityWrapper.once('connected', (state) => {
      console.info('Connected via TikFinity fallback');
      const stateWithFallback = { ...state, fallback: 'tikfinity' };
      this.socket.emit(SocketEventType.TIKTOK_CONNECTED, stateWithFallback);
      this.socket.to('platform-events').emit(SocketEventType.TIKTOK_CONNECTED, stateWithFallback);
    });

    this.tikfinityWrapper.once('disconnected', (reason) => {
      this.socket.emit(SocketEventType.TIKTOK_DISCONNECTED, reason);
      this.socket.to('platform-events').emit(SocketEventType.TIKTOK_DISCONNECTED, reason);
    });

    // Stream end event
    this.tikfinityWrapper.on(TikTokEventType.STREAM_END, () => {
      this.socket.emit(SocketEventType.STREAM_END);
      this.socket.to('platform-events').emit(SocketEventType.STREAM_END);
    });

    // Forward all TikTok message events
    const messageEvents: TikTokEventType[] = [
      TikTokEventType.ROOM_USER,
      TikTokEventType.MEMBER,
      TikTokEventType.CHAT,
      TikTokEventType.GIFT,
      TikTokEventType.SOCIAL,
      TikTokEventType.LIKE,
      TikTokEventType.QUESTION_NEW,
      TikTokEventType.LINK_MIC_BATTLE,
      TikTokEventType.LINK_MIC_ARMIES,
      TikTokEventType.LIVE_INTRO,
      TikTokEventType.EMOTE,
      TikTokEventType.ENVELOPE,
      TikTokEventType.SUBSCRIBE,
    ];

    for (const event of messageEvents) {
      this.tikfinityWrapper.on(event, (msg: unknown) => {
        this.socket.emit(event, msg);
        this.socket.to('platform-events').emit(event, msg);
      });
    }
  }

  /**
   * Handle setTwitchChannel event
   */
  private handleSetTwitchChannel(channel: string): void {
    // Check rate limiting
    this.rateLimiterService.recordRequest(this.clientIp);
    
    if (this.rateLimiterService.shouldBlockClient(this.clientIp)) {
      this.socket.emit(
        SocketEventType.TWITCH_DISCONNECTED,
        this.rateLimiterService.getRateLimitMessage()
      );
      return;
    }

    // Create Twitch connection
    this.connectToTwitch(channel);
  }

  /**
   * Connect to Twitch chat
   */
  private connectToTwitch(channel: string): void {
    try {
      // Disconnect existing Twitch connection if any
      if (this.twitchWrapper) {
        this.twitchWrapper.disconnect();
        this.twitchWrapper = null;
      }

      const twitchFactory = createTwitchConnectionWrapper(
        (delta) => {
          if (delta > 0) {
            this.statisticsService.incrementConnectionCount();
          } else {
            this.statisticsService.decrementConnectionCount();
          }
        }
      );

      this.twitchWrapper = twitchFactory(channel);
      
      // Set up event forwarding
      this.setupTwitchEventForwarding();

      // Handle connection events
      this.twitchWrapper.once('connected', (state) => {
        this.socket.emit(SocketEventType.TWITCH_CONNECTED, state);
        this.socket.to('platform-events').emit(SocketEventType.TWITCH_CONNECTED, state);
      });

      // Handle reconnection events (can happen multiple times during auto-reconnect)
      this.twitchWrapper.on('reconnected', (state) => {
        this.socket.emit(SocketEventType.TWITCH_RECONNECTED, state);
        this.socket.to('platform-events').emit(SocketEventType.TWITCH_RECONNECTED, state);
      });

      this.twitchWrapper.once('disconnected', (reason: string) => {
        this.socket.emit(SocketEventType.TWITCH_DISCONNECTED, reason);
        this.socket.to('platform-events').emit(SocketEventType.TWITCH_DISCONNECTED, reason);
      });

      // Connect
      this.twitchWrapper.connect().catch((err) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        this.socket.emit(SocketEventType.TWITCH_DISCONNECTED, errorMessage);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.socket.emit(SocketEventType.TWITCH_DISCONNECTED, errorMessage);
    }
  }

  /**
   * Set up Twitch event forwarding to the socket
   */
  private setupTwitchEventForwarding(): void {
    if (!this.twitchWrapper) return;

    // Forward chat messages as twitch-specific event (not unified 'chat' to avoid collision with TikTok)
    this.twitchWrapper.on('chat', (msg: UnifiedChatMessage) => {
      this.socket.emit('twitchChat', msg);
      this.socket.to('platform-events').emit('twitchChat', msg);
    });

    // Forward subscription events (optional)
    this.twitchWrapper.on('sub', (data: unknown) => {
      this.socket.emit('twitchSub', data);
      this.socket.to('platform-events').emit('twitchSub', data);
    });

    this.twitchWrapper.on('resub', (data: unknown) => {
      this.socket.emit('twitchResub', data);
      this.socket.to('platform-events').emit('twitchResub', data);
    });

    this.twitchWrapper.on('raid', (data: unknown) => {
      this.socket.emit('twitchRaid', data);
      this.socket.to('platform-events').emit('twitchRaid', data);
    });
  }

  /**
   * Handle setYouTubeVideo event
   */
  private handleSetYouTubeVideo(videoIdOrUrl: string): void {
    // Check rate limiting
    this.rateLimiterService.recordRequest(this.clientIp);
    
    if (this.rateLimiterService.shouldBlockClient(this.clientIp)) {
      this.socket.emit(
        SocketEventType.YOUTUBE_DISCONNECTED,
        this.rateLimiterService.getRateLimitMessage()
      );
      return;
    }

    // Create YouTube connection
    this.connectToYouTube(videoIdOrUrl);
  }

  /**
   * Connect to YouTube live chat
   */
  private connectToYouTube(videoIdOrUrl: string): void {
    try {
      // Disconnect existing YouTube connection if any
      if (this.youtubeWrapper) {
        this.youtubeWrapper.disconnect();
        this.youtubeWrapper = null;
      }

      const youtubeFactory = createYouTubeConnectionWrapper(
        (delta) => {
          if (delta > 0) {
            this.statisticsService.incrementConnectionCount();
          } else {
            this.statisticsService.decrementConnectionCount();
          }
        }
      );

      this.youtubeWrapper = youtubeFactory(videoIdOrUrl);
      
      // Set up event forwarding
      this.setupYouTubeEventForwarding();

      // Handle connection events
      this.youtubeWrapper.once('connected', (state) => {
        this.socket.emit(SocketEventType.YOUTUBE_CONNECTED, state);
        this.socket.to('platform-events').emit(SocketEventType.YOUTUBE_CONNECTED, state);
      });

      // Handle reconnection events (can happen multiple times during auto-reconnect)
      this.youtubeWrapper.on('reconnected', (state) => {
        this.socket.emit(SocketEventType.YOUTUBE_RECONNECTED, state);
        this.socket.to('platform-events').emit(SocketEventType.YOUTUBE_RECONNECTED, state);
      });

      this.youtubeWrapper.once('disconnected', (reason: string) => {
        this.socket.emit(SocketEventType.YOUTUBE_DISCONNECTED, reason);
        this.socket.to('platform-events').emit(SocketEventType.YOUTUBE_DISCONNECTED, reason);
      });

      // Connect
      this.youtubeWrapper.connect().catch((err) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        this.socket.emit(SocketEventType.YOUTUBE_DISCONNECTED, errorMessage);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.socket.emit(SocketEventType.YOUTUBE_DISCONNECTED, errorMessage);
    }
  }

  /**
   * Set up YouTube event forwarding to the socket
   */
  private setupYouTubeEventForwarding(): void {
    if (!this.youtubeWrapper) return;

    // Forward chat messages
    this.youtubeWrapper.on('chat', (msg: UnifiedChatMessage) => {
      this.socket.emit('youtubeChat', msg);
      this.socket.to('platform-events').emit('youtubeChat', msg);
    });

    // Forward Super Chat events
    this.youtubeWrapper.on('superchat', (data: unknown) => {
      this.socket.emit('youtubeSuperchat', data);
      this.socket.to('platform-events').emit('youtubeSuperchat', data);
    });

    // Forward membership events
    this.youtubeWrapper.on('member', (data: unknown) => {
      this.socket.emit('youtubeMember', data);
      this.socket.to('platform-events').emit('youtubeMember', data);
    });

    // Forward stream end event
    this.youtubeWrapper.on('streamEnd', () => {
      this.socket.emit('youtubeStreamEnd');
      this.socket.to('platform-events').emit('youtubeStreamEnd');
    });
  }

  /**
   * Handle socket disconnect
   */
  private handleDisconnect(): void {
    if (this.connectionWrapper) {
      this.connectionWrapper.disconnect();
      this.connectionWrapper = null;
    }
    
    if (this.tikfinityWrapper) {
      this.tikfinityWrapper.disconnect();
      this.tikfinityWrapper = null;
    }

    if (this.twitchWrapper) {
      this.twitchWrapper.disconnect();
      this.twitchWrapper = null;
    }

    if (this.youtubeWrapper) {
      this.youtubeWrapper.disconnect();
      this.youtubeWrapper = null;
    }
  }

  /**
   * Extract client IP from socket
   */
  private extractClientIp(): string {
    const address = this.socket.handshake.address;
    
    // Handle localhost/proxy scenarios
    if (['::1', '::ffff:127.0.0.1'].includes(address)) {
      return this.socket.handshake.headers['x-forwarded-for'] as string || address;
    }
    
    return address;
  }

  /**
   * Log new connection
   */
  private logConnection(): void {
    const origin = this.socket.handshake.headers['origin'] || 
                   this.socket.handshake.headers['referer'] || 
                   'unknown';
    console.info('New connection from origin', origin);
  }
}
