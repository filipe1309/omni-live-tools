import { EventEmitter } from 'events';
import { WebcastPushConnection } from 'tiktok-live-connector';
import { ConnectionOptions, ConnectionState } from '../../domain/entities';
import { ITikTokConnectionRepository } from '../../domain/repositories';

/**
 * Reconnection configuration
 */
interface ReconnectConfig {
  enabled: boolean;
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RECONNECT_CONFIG: ReconnectConfig = {
  enabled: true,
  maxAttempts: 5,
  initialDelayMs: 1000,
  maxDelayMs: 32000,
};

/**
 * TikTok Connection Wrapper - Infrastructure implementation
 * Handles connection management with reconnect functionality
 */
export class TikTokConnectionWrapper extends EventEmitter implements ITikTokConnectionRepository {
  private readonly connection: WebcastPushConnection;
  private clientDisconnected = false;
  private reconnectEnabled: boolean;
  private reconnectCount = 0;
  private reconnectDelayMs: number;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connected = false;

  constructor(
    private readonly uniqueId: string,
    options: ConnectionOptions,
    private readonly reconnectConfig: ReconnectConfig = DEFAULT_RECONNECT_CONFIG,
    private readonly enableLog: boolean = true,
    private readonly onConnectionCountChange?: (delta: number) => void
  ) {
    super();

    this.reconnectEnabled = reconnectConfig.enabled;
    this.reconnectDelayMs = reconnectConfig.initialDelayMs;

    this.connection = new WebcastPushConnection(uniqueId, options);
    this.setupConnectionEvents();
  }

  /**
   * Connect to TikTok live stream
   */
  async connect(uniqueId?: string, options?: ConnectionOptions): Promise<ConnectionState> {
    return this.performConnect(false);
  }

  /**
   * Disconnect from TikTok
   */
  disconnect(): void {
    this.log('Client connection disconnected');

    this.clientDisconnected = true;
    this.reconnectEnabled = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    try {
      this.connection.disconnect();
    } catch {
      // Connection might already be closed
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && !this.clientDisconnected;
  }

  /**
   * Get the underlying connection for event forwarding
   */
  getConnection(): WebcastPushConnection {
    return this.connection;
  }

  /**
   * Set up connection event handlers
   */
  private setupConnectionEvents(): void {
    this.connection.on('streamEnd', () => {
      this.log('Stream ended, giving up connection');
      this.reconnectEnabled = false;
    });

    this.connection.on('disconnected', () => {
      this.connected = false;
      this.onConnectionCountChange?.(-1);
      this.log('TikTok connection disconnected');
      this.scheduleReconnect();
    });

    this.connection.on('error', (err: Error & { info?: string }) => {
      this.log(`Error event triggered: ${err.info || err.message}`);
      console.error(err);
    });
  }

  /**
   * Perform connection attempt
   */
  private async performConnect(isReconnect: boolean): Promise<ConnectionState> {
    try {
      const state = await this.connection.connect();
      
      this.log(
        `${isReconnect ? 'Reconnected' : 'Connected'} to roomId ${state.roomId}`
      );

      this.connected = true;
      this.onConnectionCountChange?.(1);

      // Reset reconnect state
      this.reconnectCount = 0;
      this.reconnectDelayMs = this.reconnectConfig.initialDelayMs;

      // Client disconnected while establishing connection
      if (this.clientDisconnected) {
        this.connection.disconnect();
        throw new Error('Client disconnected during connection');
      }

      const connectionState: ConnectionState = {
        roomId: state.roomId,
        upgradedToWebsocket: true, // WebSocket is always used in v2.x of tiktok-live-connector
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
      console.log(`WRAPPER @${this.uniqueId}: ${message}`);
    }
  }
}

/**
 * Factory function to create TikTok connection wrapper
 */
export function createTikTokConnectionWrapper(
  onConnectionCountChange?: (delta: number) => void,
  enableLog: boolean = true
) {
  return (uniqueId: string, options: ConnectionOptions): TikTokConnectionWrapper => {
    return new TikTokConnectionWrapper(
      uniqueId,
      options,
      DEFAULT_RECONNECT_CONFIG,
      enableLog,
      onConnectionCountChange
    );
  };
}
