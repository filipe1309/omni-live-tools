import { EventEmitter } from 'events';
import { TwitchConnectionState, UnifiedChatMessage, createTwitchUser } from '../../domain/entities';
import { PlatformType } from '../../domain/enums';

// Dynamic import types for ESM-only @twurple packages
type ChatClient = InstanceType<typeof import('@twurple/chat').ChatClient>;
type ChatMessage = import('@twurple/chat').ChatMessage;

// Helper to bypass TypeScript's conversion of dynamic import() to require()
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const dynamicImport = new Function('specifier', 'return import(specifier)') as <T>(specifier: string) => Promise<T>;

/**
 * Reconnection configuration for Twitch
 */
interface TwitchReconnectConfig {
  enabled: boolean;
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RECONNECT_CONFIG: TwitchReconnectConfig = {
  enabled: true,
  maxAttempts: 5,
  initialDelayMs: 1000,
  maxDelayMs: 32000,
};

/**
 * Twitch Connection Wrapper - Infrastructure implementation
 * Handles Twitch chat connection using @twurple/chat
 * Supports anonymous connections for read-only chat access
 */
export class TwitchConnectionWrapper extends EventEmitter {
  private chatClient: ChatClient | null = null;
  private clientDisconnected = false;
  private reconnectEnabled: boolean;
  private reconnectCount = 0;
  private reconnectDelayMs: number;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connected = false;

  constructor(
    private channel: string,
    private readonly reconnectConfig: TwitchReconnectConfig = DEFAULT_RECONNECT_CONFIG,
    private readonly enableLog: boolean = true,
    private readonly onConnectionCountChange?: (delta: number) => void
  ) {
    super();
    this.reconnectEnabled = reconnectConfig.enabled;
    this.reconnectDelayMs = reconnectConfig.initialDelayMs;
    
    // Normalize channel name (remove # if present, lowercase)
    this.channel = this.normalizeChannel(channel);
  }

  /**
   * Normalize channel name
   */
  private normalizeChannel(channel: string): string {
    return channel.replace(/^#/, '').toLowerCase().trim();
  }

  /**
   * Connect to Twitch chat (anonymous mode)
   */
  async connect(): Promise<TwitchConnectionState> {
    return this.performConnect(false);
  }

  /**
   * Disconnect from Twitch chat
   */
  disconnect(): void {
    this.log('Client connection disconnected');

    this.clientDisconnected = true;
    this.reconnectEnabled = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.chatClient) {
      try {
        this.chatClient.quit();
      } catch {
        // Connection might already be closed
      }
      this.chatClient = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && !this.clientDisconnected;
  }

  /**
   * Get the underlying chat client
   */
  getChatClient(): ChatClient | null {
    return this.chatClient;
  }

  /**
   * Perform connection attempt
   */
  private async performConnect(isReconnect: boolean): Promise<TwitchConnectionState> {
    try {
      // Dynamic import of ESM-only @twurple packages (using helper to bypass TypeScript's require() conversion)
      const [twurpleChat] = await Promise.all([
        dynamicImport<typeof import('@twurple/chat')>('@twurple/chat'),
      ]);

      const { ChatClient } = twurpleChat;

      // Create chat client with anonymous connection (no authProvider = anonymous/read-only)
      this.chatClient = new ChatClient({
        channels: [this.channel],
      }) as ChatClient;

      // Set up event handlers before connecting
      this.setupChatEvents();

      // Connect to Twitch
      await this.chatClient.connect();

      this.log(`${isReconnect ? 'Reconnected' : 'Connected'} to channel #${this.channel}`);

      this.connected = true;
      this.onConnectionCountChange?.(1);

      // Reset reconnect state
      this.reconnectCount = 0;
      this.reconnectDelayMs = this.reconnectConfig.initialDelayMs;

      // Client disconnected while establishing connection
      if (this.clientDisconnected) {
        this.chatClient.quit();
        throw new Error('Client disconnected during connection');
      }

      const connectionState: TwitchConnectionState = {
        channel: this.channel,
        isConnected: true,
      };

      if (!isReconnect) {
        this.emit('connected', connectionState);
      }

      return connectionState;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.log(`${isReconnect ? 'Reconnect' : 'Connection'} failed: ${errorMessage}`);

      if (isReconnect) {
        this.scheduleReconnect(errorMessage);
        throw err;
      } else {
        this.emit('disconnected', errorMessage);
        throw err;
      }
    }
  }

  /**
   * Set up Twitch chat event handlers
   */
  private setupChatEvents(): void {
    if (!this.chatClient) return;

    // Handle incoming chat messages
    this.chatClient.onMessage((channel: string, user: string, message: string, msg: ChatMessage) => {
      const twitchUser = createTwitchUser({
        odlUserId: msg.userInfo.userId,
        username: msg.userInfo.userName,
        displayName: msg.userInfo.displayName,
        color: msg.userInfo.color,
        isMod: msg.userInfo.isMod,
        isSubscriber: msg.userInfo.isSubscriber,
        isBroadcaster: msg.userInfo.isBroadcaster,
        isVip: msg.userInfo.isVip,
        badges: Array.from(msg.userInfo.badges.entries()).map(([id, version]) => ({ id, version })),
      });

      // Convert to unified chat message format
      const unifiedMessage: UnifiedChatMessage = {
        platform: PlatformType.TWITCH,
        odlUserId: twitchUser.odlUserId,
        username: twitchUser.username,
        displayName: twitchUser.displayName,
        message: message,
        timestamp: Date.now(),
        badges: twitchUser.badges?.map(b => ({ id: b.id, name: b.id })),
        isMod: twitchUser.isMod,
        isSubscriber: twitchUser.isSubscriber,
        metadata: {
          color: twitchUser.color,
          isBroadcaster: twitchUser.isBroadcaster,
          isVip: twitchUser.isVip,
          messageId: msg.id,
        },
      };

      this.emit('chat', unifiedMessage);
    });

    // Handle disconnection
    this.chatClient.onDisconnect((manually, reason) => {
      this.connected = false;
      this.onConnectionCountChange?.(-1);
      this.log(`Twitch chat disconnected${manually ? ' (manually)' : ''}: ${reason || 'Unknown reason'}`);
      
      if (!manually && !this.clientDisconnected) {
        this.scheduleReconnect(reason?.message);
      }
    });

    // Handle subscription events (optional - for future use)
    this.chatClient.onSub((channel, user, subInfo) => {
      this.emit('sub', { channel, user, subInfo });
    });

    this.chatClient.onResub((channel, user, subInfo) => {
      this.emit('resub', { channel, user, subInfo });
    });

    // Handle raids (optional - for future use)
    this.chatClient.onRaid((channel, user, raidInfo) => {
      this.emit('raid', { channel, user, raidInfo });
    });
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(reason?: string): void {
    if (!this.reconnectEnabled) {
      return;
    }

    if (this.reconnectCount >= this.reconnectConfig.maxAttempts) {
      this.log('Max reconnect attempts exceeded, giving up');
      this.emit('disconnected', `Connection lost. ${reason || 'Max reconnect attempts exceeded'}`);
      return;
    }

    this.log(`Scheduling reconnect in ${this.reconnectDelayMs}ms`);

    this.reconnectTimeout = setTimeout(() => {
      if (!this.reconnectEnabled || this.reconnectCount >= this.reconnectConfig.maxAttempts) {
        return;
      }

      this.reconnectCount += 1;
      this.reconnectDelayMs = Math.min(
        this.reconnectDelayMs * 2,
        this.reconnectConfig.maxDelayMs
      );

      this.performConnect(true).catch(() => {
        // Error handling is done in performConnect
      });
    }, this.reconnectDelayMs);
  }

  /**
   * Log message with prefix
   */
  private log(message: string): void {
    if (this.enableLog) {
      console.log(`TWITCH #${this.channel}: ${message}`);
    }
  }
}

/**
 * Factory function to create Twitch connection wrapper
 */
export function createTwitchConnectionWrapper(
  onConnectionCountChange?: (delta: number) => void,
  enableLog: boolean = true
) {
  return (channel: string): TwitchConnectionWrapper => {
    return new TwitchConnectionWrapper(
      channel,
      DEFAULT_RECONNECT_CONFIG,
      enableLog,
      onConnectionCountChange
    );
  };
}
