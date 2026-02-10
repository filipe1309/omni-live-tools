import { Socket } from 'socket.io';
import { TikTokEventType, SocketEventType } from '../../domain/enums';
import { ConnectionOptions, sanitizeConnectionOptions } from '../../domain/entities';
import { RateLimiterService, StatisticsService } from '../../application/services';
import { 
  TikTokConnectionWrapper, 
  createTikTokConnectionWrapper,
  TikFinityConnectionWrapper,
  createTikFinityConnectionWrapper 
} from '../../infrastructure/tiktok';

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

    this.socket.on(SocketEventType.SET_UNIQUE_ID, this.handleSetUniqueId.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
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
    });

    // Get underlying connection for message events
    const connection = this.connectionWrapper.getConnection();

    // Stream end event
    connection.on(TikTokEventType.STREAM_END, () => {
      this.socket.emit(SocketEventType.STREAM_END);
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
      this.socket.emit(SocketEventType.TIKTOK_CONNECTED, {
        ...state,
        fallback: 'tikfinity',
      });
    });

    this.tikfinityWrapper.once('disconnected', (reason) => {
      this.socket.emit(SocketEventType.TIKTOK_DISCONNECTED, reason);
    });

    // Stream end event
    this.tikfinityWrapper.on(TikTokEventType.STREAM_END, () => {
      this.socket.emit(SocketEventType.STREAM_END);
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
      });
    }
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
