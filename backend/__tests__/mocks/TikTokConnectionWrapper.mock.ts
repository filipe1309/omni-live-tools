import { EventEmitter } from 'events';
import { ConnectionState, ConnectionOptions } from '../../domain/entities';
import { ITikTokConnectionRepository } from '../../domain/repositories';

/**
 * Mock TikTok Connection Wrapper for testing
 */
export class MockTikTokConnectionWrapper extends EventEmitter implements ITikTokConnectionRepository {
  private connected = false;
  private shouldFail = false;
  private failureReason = 'Connection failed';

  constructor(
    private readonly uniqueId: string,
    private readonly options: ConnectionOptions = {}
  ) {
    super();
  }

  /**
   * Configure the mock to fail on connect
   */
  setFailure(shouldFail: boolean, reason = 'Connection failed'): void {
    this.shouldFail = shouldFail;
    this.failureReason = reason;
  }

  async connect(): Promise<ConnectionState> {
    return new Promise((resolve, reject) => {
      if (this.shouldFail) {
        setTimeout(() => {
          this.emit('disconnected', this.failureReason);
          reject(new Error(this.failureReason));
        }, 10);
        return;
      }

      setTimeout(() => {
        this.connected = true;
        const state: ConnectionState = {
          roomId: `room_${this.uniqueId}`,
          upgradedToWebsocket: true,
          isConnected: true,
        };
        this.emit('connected', state);
        resolve(state);
      }, 10);
    });
  }

  disconnect(): void {
    this.connected = false;
    this.emit('disconnected', 'Client disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Simulate receiving a chat message
   */
  simulateChatMessage(message: unknown): void {
    this.emit('chat', message);
  }

  /**
   * Simulate receiving a gift
   */
  simulateGiftMessage(message: unknown): void {
    this.emit('gift', message);
  }

  /**
   * Simulate stream end
   */
  simulateStreamEnd(): void {
    this.emit('streamEnd');
  }
}

/**
 * Factory function to create mock connection wrappers
 */
export function createMockConnectionWrapperFactory(
  onConnectionCountChange?: (delta: number) => void
): (uniqueId: string, options: ConnectionOptions) => MockTikTokConnectionWrapper {
  return (uniqueId: string, options: ConnectionOptions) => {
    const wrapper = new MockTikTokConnectionWrapper(uniqueId, options);
    
    wrapper.on('connected', () => {
      onConnectionCountChange?.(1);
    });

    wrapper.on('disconnected', () => {
      onConnectionCountChange?.(-1);
    });

    return wrapper;
  };
}
