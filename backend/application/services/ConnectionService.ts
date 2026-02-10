import { ConnectionOptions, ConnectionState, sanitizeConnectionOptions } from '../../domain/entities';
import { ITikTokConnectionRepository } from '../../domain/repositories';
import { TikTokEventType } from '../../domain/enums';

/**
 * Connection Service - Handles TikTok connection business logic
 */
export class ConnectionService {
  private connectionWrapper: ITikTokConnectionRepository | null = null;
  private readonly eventHandlers: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor(
    private readonly createConnectionWrapper: (
      uniqueId: string,
      options: ConnectionOptions
    ) => ITikTokConnectionRepository
  ) {}

  /**
   * Connect to a TikTok live stream
   */
  async connect(uniqueId: string, options: unknown, sessionId?: string): Promise<ConnectionState> {
    // Sanitize options for security
    const sanitizedOptions = sanitizeConnectionOptions(options);

    // Add session ID if provided
    if (sessionId) {
      sanitizedOptions.sessionId = sessionId;
    }

    // Create new connection wrapper
    this.connectionWrapper = this.createConnectionWrapper(uniqueId, sanitizedOptions);

    // Set up event forwarding
    this.setupEventForwarding();

    return new Promise((resolve, reject) => {
      if (!this.connectionWrapper) {
        reject(new Error('Connection wrapper not initialized'));
        return;
      }

      this.connectionWrapper.once('connected', (state) => {
        resolve(state as ConnectionState);
      });

      this.connectionWrapper.once('disconnected', (reason) => {
        reject(new Error(String(reason)));
      });
    });
  }

  /**
   * Disconnect from the current stream
   */
  disconnect(): void {
    if (this.connectionWrapper) {
      this.connectionWrapper.disconnect();
      this.connectionWrapper = null;
    }
  }

  /**
   * Subscribe to connection events
   */
  on(event: string, handler: (data: unknown) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    // If already connected, also subscribe to the wrapper
    if (this.connectionWrapper) {
      this.connectionWrapper.on(event, handler);
    }
  }

  /**
   * Unsubscribe from connection events
   */
  off(event: string, handler: (data: unknown) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }

    if (this.connectionWrapper) {
      this.connectionWrapper.off(event, handler);
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionWrapper?.isConnected() ?? false;
  }

  /**
   * Set up event forwarding from the connection wrapper
   */
  private setupEventForwarding(): void {
    if (!this.connectionWrapper) return;

    const events = Object.values(TikTokEventType);
    
    for (const event of events) {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        for (const handler of handlers) {
          this.connectionWrapper.on(event, handler);
        }
      }
    }
  }
}
