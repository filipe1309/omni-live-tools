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
  private reconnectResetTimeout: NodeJS.Timeout | null = null;
  private connected = false;
  private connectedAt: number | null = null;

  /**
   * Time in milliseconds that a connection must be stable before resetting reconnect counter.
   * This prevents infinite reconnect loops when connection succeeds but immediately drops.
   */
  private static readonly RECONNECT_RESET_DELAY_MS = 10000;

  /**
   * Time in milliseconds that a connection must be stable before auto-reconnect kicks in.
   * If disconnect happens before this, treat it as a connection failure.
   */
  private static readonly MIN_STABLE_CONNECTION_MS = 3000;

  constructor (
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
  async connect (uniqueId?: string, options?: ConnectionOptions): Promise<ConnectionState> {
    return this.performConnect(false);
  }

  /**
   * Disconnect from TikTok
   */
  disconnect (): void {
    this.log('Client connection disconnected');

    this.clientDisconnected = true;
    this.reconnectEnabled = false;
    this.connectedAt = null;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.reconnectResetTimeout) {
      clearTimeout(this.reconnectResetTimeout);
      this.reconnectResetTimeout = null;
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
  isConnected (): boolean {
    return this.connected && !this.clientDisconnected;
  }

  /**
   * Get the underlying connection for event forwarding
   */
  getConnection (): WebcastPushConnection {
    return this.connection;
  }

  /**
   * Set up connection event handlers
   */
  private setupConnectionEvents (): void {
    this.connection.on('streamEnd', () => {
      this.log('Stream ended, giving up connection');
      this.reconnectEnabled = false;
    });

    this.connection.on('disconnected', () => {
      const wasConnectedAt = this.connectedAt;
      this.connected = false;
      this.connectedAt = null;
      this.onConnectionCountChange?.(-1);
      this.log('TikTok connection disconnected');

      // Cancel reconnect state reset - connection was not stable
      if (this.reconnectResetTimeout) {
        clearTimeout(this.reconnectResetTimeout);
        this.reconnectResetTimeout = null;
      }

      // Check if connection was stable enough for auto-reconnect
      const connectionDuration = wasConnectedAt ? Date.now() - wasConnectedAt : 0;
      const wasConnectionStable = connectionDuration >= TikTokConnectionWrapper.MIN_STABLE_CONNECTION_MS;

      if (!wasConnectionStable && !this.clientDisconnected) {
        // Connection dropped too quickly - treat as connection failure
        this.log(`Connection was unstable (${connectionDuration}ms < ${TikTokConnectionWrapper.MIN_STABLE_CONNECTION_MS}ms), not auto-reconnecting`);
        this.emit('disconnected', 'Connection was not stable');
        return;
      }

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
  private async performConnect (isReconnect: boolean): Promise<ConnectionState> {
    try {
      const state = await this.connection.connect();

      this.log(
        `${isReconnect ? 'Reconnected' : 'Connected'} to roomId ${state.roomId}`
      );

      this.connected = true;
      this.connectedAt = Date.now();
      this.onConnectionCountChange?.(1);

      // Cancel any pending reconnect reset from previous connection
      if (this.reconnectResetTimeout) {
        clearTimeout(this.reconnectResetTimeout);
        this.reconnectResetTimeout = null;
      }

      // Delay resetting reconnect state to prevent infinite loops
      // Only reset after connection has been stable for a while
      // This prevents rapid reconnect/disconnect cycles from looping forever
      this.reconnectResetTimeout = setTimeout(() => {
        this.reconnectCount = 0;
        this.reconnectDelayMs = this.reconnectConfig.initialDelayMs;
        this.reconnectResetTimeout = null;
        this.log('Reconnect state reset after stable connection');
      }, TikTokConnectionWrapper.RECONNECT_RESET_DELAY_MS);

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

      if (isReconnect) {
        this.emit('reconnected', connectionState);
      } else {
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
  private scheduleReconnect (reason?: string): void {
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
  private log (message: string): void {
    if (this.enableLog) {
      console.log(`WRAPPER @${this.uniqueId}: ${message}`);
    }
  }
}

/**
 * Factory function to create TikTok connection wrapper
 */
export function createTikTokConnectionWrapper (
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
