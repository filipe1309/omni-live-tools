import { ConnectionOptions, ConnectionState } from '../entities';

/**
 * TikTok Connection Repository Interface
 * Defines the contract for TikTok connection management
 */
export interface ITikTokConnectionRepository {
  /**
   * Connect to a TikTok live stream
   */
  connect(uniqueId: string, options: ConnectionOptions): Promise<ConnectionState>;

  /**
   * Disconnect from the current stream
   */
  disconnect(): void;

  /**
   * Check if currently connected
   */
  isConnected(): boolean;

  /**
   * Subscribe to TikTok events
   */
  on(event: string, handler: (data: unknown) => void): void;

  /**
   * Subscribe to TikTok events (once)
   */
  once(event: string, handler: (data: unknown) => void): void;

  /**
   * Remove event subscription
   */
  off(event: string, handler: (data: unknown) => void): void;
}
