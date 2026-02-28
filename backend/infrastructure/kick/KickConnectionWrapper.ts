import { EventEmitter } from 'events';
import { KickConnectionState, createKickUser, createKickUnifiedMessage } from '../../domain/entities';
import type { UnifiedChatMessage } from '../../domain/entities';
import { PlatformType } from '../../domain/enums';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

// Dynamic import for kick-js (ESM module)
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const dynamicImport = new Function('specifier', 'return import(specifier)') as <T>(specifier: string) => Promise<T>;

/**
 * Get the correct import path for @retconned/kick-js
 * When running in Electron asar, modules unpacked via asarUnpack are in app.asar.unpacked
 * ESM requires the full path to the entry file, not just the package directory
 */
function getKickJsPath(): string {
  // Check if running inside an asar archive
  if (__dirname.includes('app.asar')) {
    // Replace app.asar with app.asar.unpacked for unpacked modules
    const unpackedBase = __dirname.replace('app.asar', 'app.asar.unpacked');
    
    // Try multiple possible locations for kick-js
    // 1. backend/node_modules (where it's installed via backend/package.json)
    // 2. root node_modules (if hoisted)
    const candidates = [
      path.resolve(unpackedBase, '../../../node_modules/@retconned/kick-js/dist/index.js'),
      path.resolve(unpackedBase, '../../../../node_modules/@retconned/kick-js/dist/index.js'),
    ];
    
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        console.log(`KICK: Found kick-js at ${candidate}`);
        // Convert to file:// URL for ESM compatibility on Windows
        return pathToFileURL(candidate).href;
      }
    }
    
    // Fallback to backend path even if not found (will error with helpful message)
    console.error('KICK: Could not find kick-js in unpacked modules. Tried:', candidates);
    // Convert to file:// URL for ESM compatibility on Windows
    return pathToFileURL(candidates[0]).href;
  }
  // Development mode - use normal module resolution
  return '@retconned/kick-js';
}

/**
 * Configure puppeteer to use system Chrome browser
 * kick-js uses puppeteer internally - we use the system Chrome instead of bundling
 * Chromium to keep the app size smaller and avoid complex asar unpacking
 * @returns true if Chrome was found, false otherwise
 */
function configurePuppeteerForElectron(): boolean {
  // Skip puppeteer's own browser download
  process.env.PUPPETEER_SKIP_DOWNLOAD = 'true';
  
  // System Chrome locations by platform
  const systemChromePaths: Record<string, string[]> = {
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      `${process.env.HOME}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
    ],
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    ],
    linux: [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
    ],
  };

  const chromeCandidates = systemChromePaths[process.platform] || [];
  
  for (const chromePath of chromeCandidates) {
    if (fs.existsSync(chromePath)) {
      process.env.PUPPETEER_EXECUTABLE_PATH = chromePath;
      console.log(`KICK: Using system Chrome at ${chromePath}`);
      return true;
    }
  }
  
  console.warn('KICK: No Chrome browser found. Kick chat requires Google Chrome or Chromium installed.');
  return false;
}

/**
 * Reconnection configuration for Kick
 */
interface KickReconnectConfig {
  enabled: boolean;
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RECONNECT_CONFIG: KickReconnectConfig = {
  enabled: true,
  maxAttempts: 5,
  initialDelayMs: 1000,
  maxDelayMs: 32000,
};

/**
 * Kick Connection Wrapper - Infrastructure implementation
 * Handles Kick chat connection using @retconned/kick-js
 */
export class KickConnectionWrapper extends EventEmitter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private kickClient: any = null;
  private clientDisconnected = false;
  private reconnectEnabled: boolean;
  private reconnectCount = 0;
  private reconnectDelayMs: number;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectResetTimeout: NodeJS.Timeout | null = null;
  private connected = false;
  private connectedAt: number | null = null;
  private channelId: number = 0;

  /**
   * Time in milliseconds that a connection must be stable before resetting reconnect counter.
   */
  private static readonly RECONNECT_RESET_DELAY_MS = 10000;

  /**
   * Time in milliseconds that a connection must be stable before auto-reconnect kicks in.
   */
  private static readonly MIN_STABLE_CONNECTION_MS = 3000;

  /**
   * Time in milliseconds to wait after connect() to verify connection is stable.
   */
  private static readonly CONNECTION_VERIFY_DELAY_MS = 1500;

  constructor(
    private channel: string,
    private readonly reconnectConfig: KickReconnectConfig = DEFAULT_RECONNECT_CONFIG,
    private readonly enableLog: boolean = true,
    private readonly onConnectionCountChange?: (delta: number) => void
  ) {
    super();
    this.reconnectEnabled = reconnectConfig.enabled;
    this.reconnectDelayMs = reconnectConfig.initialDelayMs;

    // Normalize channel name (lowercase, trim)
    this.channel = this.normalizeChannel(channel);
  }

  /**
   * Normalize channel name
   */
  private normalizeChannel(channel: string): string {
    return channel.toLowerCase().trim();
  }

  /**
   * Connect to Kick chat
   */
  async connect(): Promise<KickConnectionState> {
    return this.performConnect(false);
  }

  /**
   * Disconnect from Kick chat
   */
  disconnect(): void {
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

    if (this.kickClient) {
      try {
        this.kickClient.disconnect();
      } catch {
        // Connection might already be closed
      }
      this.kickClient = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && !this.clientDisconnected;
  }

  /**
   * Get the underlying Kick client
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getKickClient(): any {
    return this.kickClient;
  }

  /**
   * Perform connection attempt
   */
  private async performConnect(isReconnect: boolean): Promise<KickConnectionState> {
    return new Promise(async (resolve, reject) => {
      let connectionResolved = false;
      
      // Helper to mark connection as successful (called by 'ready' or first message)
      const markConnected = (source: string, channelId?: number) => {
        if (connectionResolved || this.connected) return;
        connectionResolved = true;
        
        this.log(`${isReconnect ? 'Reconnected' : 'Connected'} to channel ${this.channel} via ${source}${channelId ? ` (id: ${channelId})` : ''}`);

        this.connected = true;
        this.connectedAt = Date.now();
        this.channelId = channelId || 0;
        this.onConnectionCountChange?.(1);

        // Cancel any pending reconnect reset from previous connection
        if (this.reconnectResetTimeout) {
          clearTimeout(this.reconnectResetTimeout);
          this.reconnectResetTimeout = null;
        }

        // Delay resetting reconnect state to prevent infinite loops
        this.reconnectResetTimeout = setTimeout(() => {
          this.reconnectCount = 0;
          this.reconnectDelayMs = this.reconnectConfig.initialDelayMs;
          this.reconnectResetTimeout = null;
          this.log('Reconnect state reset after stable connection');
        }, KickConnectionWrapper.RECONNECT_RESET_DELAY_MS);

        // Client disconnected while establishing connection
        if (this.clientDisconnected) {
          this.kickClient = null;
          reject(new Error('Client disconnected during connection'));
          return;
        }

        const connectionState: KickConnectionState = {
          channel: this.channel,
          channelId: this.channelId,
          isConnected: true,
        };

        if (!isReconnect) {
          this.emit('connected', connectionState);
        } else {
          this.emit('reconnected', connectionState);
        }

        resolve(connectionState);
      };
      
      try {
        // Configure puppeteer for Electron before importing kick-js
        const chromeFound = configurePuppeteerForElectron();
        if (!chromeFound) {
          reject(new Error('CHROME_NOT_INSTALLED: Kick requires Google Chrome or Chromium browser installed on your system.'));
          return;
        }
        
        // Dynamic import of kick-js with correct path for Electron asar
        const kickJsPath = getKickJsPath();
        let kickModule;
        try {
          kickModule = await dynamicImport<typeof import('@retconned/kick-js')>(kickJsPath);
        } catch (importError) {
          this.log(`Failed to import kick-js: ${importError}`);
          reject(new Error(`Failed to load kick-js module: ${importError}`));
          return;
        }
        const { createClient } = kickModule;

        // Create Kick client with readOnly mode (auto-initializes)
        try {
          this.kickClient = createClient(this.channel, {
            readOnly: true,
            plainEmote: true,
            logger: this.enableLog,
          });
        } catch (createError) {
          this.log(`Failed to create Kick client: ${createError}`);
          reject(new Error(`Failed to create Kick client: ${createError}`));
          return;
        }

        // Set up event handlers before waiting for ready
        this.setupChatEvents(markConnected);

        // Wait for the 'ready' event to resolve the connection
        this.kickClient.on('ready', (user: { id: number; username: string; tag: string }) => {
          markConnected('ready', user?.id);
        });

        // Handle errors during connection
        this.kickClient.on('error', (error: Error) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.log(`${isReconnect ? 'Reconnect' : 'Connection'} error: ${errorMessage}`);

          if (!this.connected && !connectionResolved) {
            // Error during initial connection
            if (isReconnect) {
              this.scheduleReconnect(errorMessage);
            } else {
              this.emit('disconnected', errorMessage);
            }
            connectionResolved = true;
            reject(error);
          }
        });

        // Set a longer timeout for connection - Kick uses puppeteer which can be slow
        // especially on Windows. Messages may start arriving before 'ready' event fires,
        // in which case the first-message fallback in setupChatEvents will resolve.
        setTimeout(() => {
          if (!this.connected && !this.clientDisconnected && !connectionResolved) {
            const errorMessage = 'Connection timeout';
            this.log(errorMessage);
            if (isReconnect) {
              this.scheduleReconnect(errorMessage);
            } else {
              this.emit('disconnected', errorMessage);
            }
            connectionResolved = true;
            reject(new Error(errorMessage));
          }
        }, 120000); // 120 second timeout (2 minutes)

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        this.log(`${isReconnect ? 'Reconnect' : 'Connection'} failed: ${errorMessage}`);

        if (isReconnect) {
          this.scheduleReconnect(errorMessage);
          reject(err);
        } else {
          this.emit('disconnected', errorMessage);
          reject(err);
        }
      }
    });
  }

  /**
   * Set up Kick chat event handlers
   * @param onFirstMessage - Callback to mark connection as successful when first message arrives
   */
  private setupChatEvents(onFirstMessage?: (source: string, channelId?: number) => void): void {
    if (!this.kickClient) return;
    
    this.log(`Setting up chat events (onFirstMessage callback: ${onFirstMessage ? 'provided' : 'not provided'})`);

    // Handle incoming chat messages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.kickClient.on('ChatMessage', (message: any) => {
      try {
        // If 'ready' event never fired but we're receiving messages, mark as connected
        // This is a fallback for platforms/versions where 'ready' doesn't fire
        if (onFirstMessage && !this.connected) {
          this.log('First message received before ready event - marking as connected');
          onFirstMessage('first-message');
        }
        
        const kickUser = createKickUser({
          odlUserId: `kick-${message.sender?.id || message.id}`,
          odlKickId: message.sender?.id || 0,
          username: message.sender?.username || 'unknown',
          displayName: message.sender?.username || 'Unknown',
          color: message.sender?.identity?.color || undefined,
          isMod: message.sender?.isModerator || false,
          isSubscriber: message.sender?.isSubscriber || false,
          isBroadcaster: message.sender?.isBroadcaster || false,
          isVerified: message.sender?.isVerified || false,
          badges: message.sender?.badges?.map((b: { type: string; text?: string }) => ({
            type: b.type,
            text: b.text,
          })) || [],
        });

        // Convert to unified chat message format
        const unifiedMessage: UnifiedChatMessage = {
          platform: PlatformType.KICK,
          odlUserId: kickUser.odlUserId,
          username: kickUser.username,
          displayName: kickUser.displayName,
          message: message.content || '',
          timestamp: Date.now(),
          badges: kickUser.badges?.map(b => ({ id: b.type, name: b.type })),
          isMod: kickUser.isMod,
          isSubscriber: kickUser.isSubscriber,
          metadata: {
            color: kickUser.color,
            isBroadcaster: kickUser.isBroadcaster,
            isVerified: kickUser.isVerified,
            messageId: message.id,
          },
        };

        this.emit('chat', unifiedMessage);
      } catch (err) {
        this.log(`Error processing chat message: ${err}`);
      }
    });

    // Handle subscription events
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.kickClient.on('Subscription', (data: any) => {
      this.emit('sub', data);
    });

    // Handle gifted subscriptions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.kickClient.on('GiftedSubscription', (data: any) => {
      this.emit('giftedSub', data);
    });

    // Handle host events
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.kickClient.on('Host', (data: any) => {
      this.emit('host', data);
    });

    // Handle stream stop (end of stream)
    this.kickClient.on('StreamStop', () => {
      this.log('Stream has ended');
      this.emit('streamEnd');
    });

    // Handle disconnection/errors
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.kickClient.on('error', (error: any) => {
      const wasConnectedAt = this.connectedAt;
      this.connected = false;
      this.connectedAt = null;
      this.onConnectionCountChange?.(-1);
      
      const errorMessage = error?.message || String(error);
      this.log(`Kick chat error: ${errorMessage}`);

      // Cancel reconnect state reset
      if (this.reconnectResetTimeout) {
        clearTimeout(this.reconnectResetTimeout);
        this.reconnectResetTimeout = null;
      }

      this.emit('earlyDisconnect');

      if (!this.clientDisconnected) {
        const connectionDuration = wasConnectedAt ? Date.now() - wasConnectedAt : 0;
        const wasConnectionStable = connectionDuration >= KickConnectionWrapper.MIN_STABLE_CONNECTION_MS;

        if (!wasConnectionStable) {
          this.log(`Connection was unstable (${connectionDuration}ms), not auto-reconnecting`);
          this.emit('disconnected', errorMessage);
          return;
        }

        this.scheduleReconnect(errorMessage);
      }
    });

    // Handle WebSocket close
    this.kickClient.on('close', () => {
      const wasConnectedAt = this.connectedAt;
      this.connected = false;
      this.connectedAt = null;
      this.onConnectionCountChange?.(-1);
      this.log('Kick WebSocket closed');

      if (this.reconnectResetTimeout) {
        clearTimeout(this.reconnectResetTimeout);
        this.reconnectResetTimeout = null;
      }

      this.emit('earlyDisconnect');

      if (!this.clientDisconnected) {
        const connectionDuration = wasConnectedAt ? Date.now() - wasConnectedAt : 0;
        const wasConnectionStable = connectionDuration >= KickConnectionWrapper.MIN_STABLE_CONNECTION_MS;

        if (!wasConnectionStable) {
          this.emit('disconnected', 'Connection closed unexpectedly');
          return;
        }

        this.scheduleReconnect('WebSocket closed');
      }
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
      console.log(`KICK ${this.channel}: ${message}`);
    }
  }
}

/**
 * Factory function to create Kick connection wrapper
 */
export function createKickConnectionWrapper(
  onConnectionCountChange?: (delta: number) => void,
  enableLog: boolean = true
) {
  return (channel: string): KickConnectionWrapper => {
    return new KickConnectionWrapper(
      channel,
      DEFAULT_RECONNECT_CONFIG,
      enableLog,
      onConnectionCountChange
    );
  };
}
