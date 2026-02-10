import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { ConnectionState } from '../../domain/entities';
import { TikTokEventType } from '../../domain/enums';

/**
 * TikFinity WebSocket Event Message
 */
interface TikFinityMessage {
  event: string;
  data: unknown;
}

/**
 * TikFinity Connection Configuration
 */
export interface TikFinityConfig {
  endpoint: string;
  reconnectEnabled: boolean;
  reconnectMaxAttempts: number;
  reconnectDelayMs: number;
}

const DEFAULT_TIKFINITY_CONFIG: TikFinityConfig = {
  endpoint: 'ws://localhost:21213/',
  reconnectEnabled: true,
  reconnectMaxAttempts: 3,
  reconnectDelayMs: 2000,
};

/**
 * TikFinity Connection Wrapper
 * Fallback connection using TikFinity WebSocket API when tiktok-live-connector fails
 */
export class TikFinityConnectionWrapper extends EventEmitter {
  private ws: WebSocket | null = null;
  private connected = false;
  private clientDisconnected = false;
  private reconnectCount = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly uniqueId: string,
    private readonly config: TikFinityConfig = DEFAULT_TIKFINITY_CONFIG,
    private readonly enableLog: boolean = true,
    private readonly onConnectionCountChange?: (delta: number) => void
  ) {
    super();
  }

  /**
   * Connect to TikFinity WebSocket
   */
  async connect(): Promise<ConnectionState> {
    return new Promise((resolve, reject) => {
      try {
        // Build WebSocket URL with uniqueId parameter
        const wsUrl = `${this.config.endpoint}?uniqueId=${encodeURIComponent(this.uniqueId)}`;
        
        this.log(`Connecting to TikFinity: ${wsUrl}`);
        
        this.ws = new WebSocket(wsUrl);

        const connectionTimeout = setTimeout(() => {
          if (!this.connected) {
            this.ws?.close();
            reject(new Error('TikFinity connection timeout'));
          }
        }, 15000);

        this.ws.on('open', () => {
          clearTimeout(connectionTimeout);
          this.connected = true;
          this.reconnectCount = 0;
          this.onConnectionCountChange?.(1);
          
          this.log('Connected to TikFinity WebSocket');

          // Set up ping interval to keep connection alive
          this.pingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
              this.ws.ping();
            }
          }, 30000);

          const connectionState: ConnectionState = {
            roomId: `tikfinity_${this.uniqueId}`,
            upgradedToWebsocket: true,
            isConnected: true,
          };

          this.emit('connected', connectionState);
          resolve(connectionState);
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          this.handleMessage(data);
        });

        this.ws.on('close', (code, reason) => {
          clearTimeout(connectionTimeout);
          this.handleClose(code, reason.toString());
        });

        this.ws.on('error', (error) => {
          clearTimeout(connectionTimeout);
          this.log(`WebSocket error: ${error.message}`);
          
          if (!this.connected) {
            reject(error);
          }
          
          this.emit('error', error);
        });

        this.ws.on('pong', () => {
          this.log('Received pong from TikFinity');
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from TikFinity
   */
  disconnect(): void {
    this.log('Disconnecting from TikFinity');
    this.clientDisconnected = true;

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.connected) {
      this.connected = false;
      this.onConnectionCountChange?.(-1);
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && !this.clientDisconnected;
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: WebSocket.Data): void {
    try {
      const message: TikFinityMessage = JSON.parse(data.toString());
      
      // Map TikFinity events to TikTok events
      const eventName = this.mapEventName(message.event);
      
      if (eventName) {
        this.emit(eventName, message.data);
      }
    } catch (error) {
      this.log(`Failed to parse message: ${error}`);
    }
  }

  /**
   * Map TikFinity event names to TikTok event types
   */
  private mapEventName(tikfinityEvent: string): string | null {
    const eventMap: Record<string, TikTokEventType> = {
      'chat': TikTokEventType.CHAT,
      'gift': TikTokEventType.GIFT,
      'share': TikTokEventType.SOCIAL,
      'follow': TikTokEventType.SOCIAL,
      'like': TikTokEventType.LIKE,
      'roomUser': TikTokEventType.ROOM_USER,
      'subscribe': TikTokEventType.SUBSCRIBE,
      'member': TikTokEventType.MEMBER,
      'streamEnd': TikTokEventType.STREAM_END,
      'emote': TikTokEventType.EMOTE,
      'envelope': TikTokEventType.ENVELOPE,
      'questionNew': TikTokEventType.QUESTION_NEW,
      'liveIntro': TikTokEventType.LIVE_INTRO,
      'linkMicBattle': TikTokEventType.LINK_MIC_BATTLE,
      'linkMicArmies': TikTokEventType.LINK_MIC_ARMIES,
    };

    return eventMap[tikfinityEvent] || tikfinityEvent;
  }

  /**
   * Handle WebSocket close
   */
  private handleClose(code: number, reason: string): void {
    this.log(`WebSocket closed: code=${code}, reason=${reason}`);
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.connected) {
      this.connected = false;
      this.onConnectionCountChange?.(-1);
    }

    if (!this.clientDisconnected && this.config.reconnectEnabled) {
      this.scheduleReconnect();
    } else {
      this.emit('disconnected', reason || 'Connection closed');
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectCount >= this.config.reconnectMaxAttempts) {
      this.log('Max reconnect attempts reached');
      this.emit('disconnected', 'Max reconnect attempts exceeded');
      return;
    }

    this.reconnectCount++;
    const delay = this.config.reconnectDelayMs * this.reconnectCount;
    
    this.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectCount})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch((error) => {
        this.log(`Reconnect failed: ${error.message}`);
      });
    }, delay);
  }

  /**
   * Log message with prefix
   */
  private log(message: string): void {
    if (this.enableLog) {
      console.log(`TIKFINITY @${this.uniqueId}: ${message}`);
    }
  }
}

/**
 * Factory function to create TikFinity connection wrapper
 */
export function createTikFinityConnectionWrapper(
  config?: Partial<TikFinityConfig>,
  onConnectionCountChange?: (delta: number) => void,
  enableLog: boolean = true
) {
  const fullConfig = { ...DEFAULT_TIKFINITY_CONFIG, ...config };
  
  return (uniqueId: string): TikFinityConnectionWrapper => {
    return new TikFinityConnectionWrapper(
      uniqueId,
      fullConfig,
      enableLog,
      onConnectionCountChange
    );
  };
}
