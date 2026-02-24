import { EventEmitter } from 'events';
import { YouTubeConnectionState, createYouTubeUser, createYouTubeUnifiedMessage } from '../../domain/entities';
import type { UnifiedChatMessage } from '../../domain/entities';
import { PlatformType } from '../../domain/enums';

// Dynamic import for youtubei.js
type Innertube = InstanceType<typeof import('youtubei.js').Innertube>;
type LiveChat = ReturnType<Awaited<ReturnType<Innertube['getInfo']>>['getLiveChat']>;

// Helper to bypass TypeScript's conversion of dynamic import() to require()
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const dynamicImport = new Function('specifier', 'return import(specifier)') as <T>(specifier: string) => Promise<T>;

/**
 * Reconnection configuration for YouTube
 */
interface YouTubeReconnectConfig {
  enabled: boolean;
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RECONNECT_CONFIG: YouTubeReconnectConfig = {
  enabled: true,
  maxAttempts: 5,
  initialDelayMs: 1000,
  maxDelayMs: 32000,
};

/**
 * YouTube Connection Wrapper - Infrastructure implementation
 * Handles YouTube live chat connection using youtubei.js
 */
export class YouTubeConnectionWrapper extends EventEmitter {
  private innertube: Innertube | null = null;
  private liveChat: LiveChat | null = null;
  private clientDisconnected = false;
  private reconnectEnabled: boolean;
  private reconnectCount = 0;
  private reconnectDelayMs: number;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectResetTimeout: NodeJS.Timeout | null = null;
  private connected = false;
  private connectedAt: number | null = null;
  private channelName: string = '';

  /**
   * Time in milliseconds that a connection must be stable before resetting reconnect counter.
   */
  private static readonly RECONNECT_RESET_DELAY_MS = 10000;

  /**
   * Time in milliseconds that a connection must be stable before auto-reconnect kicks in.
   */
  private static readonly MIN_STABLE_CONNECTION_MS = 3000;

  constructor(
    private videoIdOrUrl: string,
    private readonly reconnectConfig: YouTubeReconnectConfig = DEFAULT_RECONNECT_CONFIG,
    private readonly enableLog: boolean = true,
    private readonly onConnectionCountChange?: (delta: number) => void
  ) {
    super();
    this.reconnectEnabled = reconnectConfig.enabled;
    this.reconnectDelayMs = reconnectConfig.initialDelayMs;

    // Normalize video ID
    this.videoIdOrUrl = this.extractVideoId(videoIdOrUrl);
  }

  /**
   * Extract video ID from URL or return as-is if already an ID
   */
  private extractVideoId(input: string): string {
    const trimmed = input.trim();
    
    // Already a video ID (11 characters, alphanumeric + dash/underscore)
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }

    // Try to extract from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // Return as-is, will fail gracefully if invalid
    return trimmed;
  }

  /**
   * Connect to YouTube live chat
   */
  async connect(): Promise<YouTubeConnectionState> {
    return this.performConnect(false);
  }

  /**
   * Disconnect from YouTube live chat
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

    if (this.liveChat) {
      try {
        this.liveChat.stop();
      } catch {
        // Connection might already be closed
      }
      this.liveChat = null;
    }

    this.innertube = null;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && !this.clientDisconnected;
  }

  /**
   * Perform connection attempt
   */
  private async performConnect(isReconnect: boolean): Promise<YouTubeConnectionState> {
    try {
      // Dynamic import of youtubei.js
      const { Innertube } = await dynamicImport<typeof import('youtubei.js')>('youtubei.js');

      // Create Innertube client
      this.innertube = await Innertube.create();

      // Get video info
      const videoInfo = await this.innertube.getInfo(this.videoIdOrUrl);

      // Check if it's a live stream
      if (!videoInfo.basic_info.is_live) {
        throw new Error('This video is not a live stream');
      }

      // Get channel name from video info
      this.channelName = videoInfo.basic_info.channel?.name || videoInfo.basic_info.author || 'Unknown';

      // Get live chat
      this.liveChat = videoInfo.getLiveChat();

      // Set up event handlers
      this.setupChatEvents();

      // Start listening to chat
      this.liveChat.start();

      this.log(`${isReconnect ? 'Reconnected' : 'Connected'} to ${this.channelName}`);

      this.connected = true;
      this.connectedAt = Date.now();
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
      }, YouTubeConnectionWrapper.RECONNECT_RESET_DELAY_MS);

      // Client disconnected while establishing connection
      if (this.clientDisconnected) {
        this.liveChat?.stop();
        throw new Error('Client disconnected during connection');
      }

      const connectionState: YouTubeConnectionState = {
        videoId: this.videoIdOrUrl,
        channelName: this.channelName,
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
   * Set up YouTube live chat event handlers
   */
  private setupChatEvents(): void {
    if (!this.liveChat) return;

    // Handle chat updates
    this.liveChat.on('chat-update', (chatAction: unknown) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chatActionObj = chatAction as any;
        
        // Debug: log the incoming chat action structure
        if (this.enableLog) {
          this.log(`chat-update received: ${JSON.stringify({
            type: chatActionObj?.type || chatActionObj?.constructor?.name,
            hasActions: !!chatActionObj?.actions,
            actionsLength: chatActionObj?.actions?.length,
            hasItem: !!chatActionObj?.item,
            keys: Object.keys(chatActionObj || {}).slice(0, 10),
          })}`);
        }

        // youtubei.js might emit ChatAction with an actions array OR individual actions
        if (chatActionObj?.actions && Array.isArray(chatActionObj.actions)) {
          // It's a ChatAction container with multiple actions
          for (const action of chatActionObj.actions) {
            this.handleChatAction(action);
          }
        } else {
          // It's a single action
          this.handleChatAction(chatAction);
        }
      } catch (err) {
        this.log(`Error handling chat action: ${err}`);
      }
    });

    // Handle errors
    this.liveChat.on('error', (err: Error) => {
      const wasConnectedAt = this.connectedAt;
      this.connected = false;
      this.connectedAt = null;
      this.onConnectionCountChange?.(-1);
      this.log(`YouTube live chat error: ${err.message}`);

      // Cancel reconnect state reset
      if (this.reconnectResetTimeout) {
        clearTimeout(this.reconnectResetTimeout);
        this.reconnectResetTimeout = null;
      }

      if (!this.clientDisconnected) {
        const connectionDuration = wasConnectedAt ? Date.now() - wasConnectedAt : 0;
        const wasConnectionStable = connectionDuration >= YouTubeConnectionWrapper.MIN_STABLE_CONNECTION_MS;

        if (!wasConnectionStable) {
          this.log(`Connection was unstable, not auto-reconnecting`);
          this.emit('disconnected', err.message);
          return;
        }

        this.scheduleReconnect(err.message);
      }
    });

    // Handle end of stream
    this.liveChat.on('end', () => {
      this.connected = false;
      this.connectedAt = null;
      this.onConnectionCountChange?.(-1);
      this.log('YouTube live stream ended');
      this.emit('streamEnd');
      this.emit('disconnected', 'Stream ended');
    });
  }

  /**
   * Handle incoming chat actions
   */
  private handleChatAction(action: unknown): void {
    // Type guard for action object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actionObj = action as any;

    // Debug log to see the action structure
    if (this.enableLog) {
      const actionType = actionObj?.type || actionObj?.constructor?.name || 'unknown';
      this.log(`Chat action received: ${actionType}`);
    }

    // Check if it's an AddChatItemAction - try multiple detection methods
    const isAddChatItemAction = 
      (typeof actionObj?.is === 'function' && actionObj.is('AddChatItemAction')) ||
      actionObj?.type === 'AddChatItemAction' ||
      actionObj?.constructor?.name === 'AddChatItemAction' ||
      actionObj?.item !== undefined; // Fallback: if it has an item property

    if (isAddChatItemAction) {
      const item = actionObj.item;
      
      if (!item) {
        this.log('AddChatItemAction has no item');
        return;
      }

      // Debug log item type
      if (this.enableLog) {
        const itemType = item?.type || item?.constructor?.name || 'unknown';
        this.log(`Chat item type: ${itemType}`);
      }

      // Handle text messages - try multiple detection methods
      const isTextMessage = 
        (typeof item?.is === 'function' && item.is('LiveChatTextMessage')) ||
        item?.type === 'LiveChatTextMessage' ||
        item?.constructor?.name === 'LiveChatTextMessage';
      
      // Handle Super Chat
      const isSuperChat = 
        (typeof item?.is === 'function' && item.is('LiveChatPaidMessage')) ||
        item?.type === 'LiveChatPaidMessage' ||
        item?.constructor?.name === 'LiveChatPaidMessage';
      
      // Handle membership messages
      const isMembership = 
        (typeof item?.is === 'function' && item.is('LiveChatMembershipItem')) ||
        item?.type === 'LiveChatMembershipItem' ||
        item?.constructor?.name === 'LiveChatMembershipItem';

      if (isTextMessage) {
        this.handleTextMessage(item);
      } else if (isSuperChat) {
        this.handleSuperChat(item);
      } else if (isMembership) {
        this.handleMembership(item);
      } else if (item?.message && item?.author) {
        // Fallback: if it has message and author, treat as text message
        this.log('Treating unknown item with message/author as text message');
        this.handleTextMessage(item);
      }
    }
  }

  /**
   * Handle text messages
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleTextMessage(item: any): void {
    const author = item.author;
    const message = item.message?.toString() || '';

    // Check membership from multiple sources
    const isMember = this.checkMemberStatus(author);

    const youtubeUser = createYouTubeUser({
      odlUserId: author?.id || '',
      channelId: author?.id || '',
      username: author?.name || '',
      displayName: author?.name || '',
      profilePictureUrl: this.getBestThumbnail(author?.thumbnails),
      isMember,
      isModerator: author?.is_moderator || false,
      isOwner: author?.is_owner || false,
      isVerified: author?.is_verified || false,
      badges: this.extractBadges(author?.badges),
    });

    const unifiedMessage = createYouTubeUnifiedMessage(
      youtubeUser,
      message,
      Date.now(),
      item.id
    );

    this.emit('chat', unifiedMessage);
  }

  /**
   * Handle Super Chat messages
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleSuperChat(item: any): void {
    const author = item.author;
    const message = item.message?.toString() || '';

    // Check membership from multiple sources
    const isMember = this.checkMemberStatus(author);

    const youtubeUser = createYouTubeUser({
      odlUserId: author?.id || '',
      channelId: author?.id || '',
      username: author?.name || '',
      displayName: author?.name || '',
      profilePictureUrl: this.getBestThumbnail(author?.thumbnails),
      isMember,
      isModerator: author?.is_moderator || false,
      isOwner: author?.is_owner || false,
      isVerified: author?.is_verified || false,
      badges: this.extractBadges(author?.badges),
    });

    const superchatData = {
      amount: item.purchase_amount_text?.toString() || '',
      currency: '',
      color: item.header_background_color?.toString() || '',
    };

    const unifiedMessage: UnifiedChatMessage = {
      platform: PlatformType.YOUTUBE,
      odlUserId: youtubeUser.odlUserId,
      username: youtubeUser.username,
      displayName: youtubeUser.displayName,
      message,
      timestamp: Date.now(),
      profilePictureUrl: youtubeUser.profilePictureUrl,
      badges: youtubeUser.badges?.map(b => ({ id: b.id, name: b.label })),
      isMod: youtubeUser.isModerator,
      isSubscriber: youtubeUser.isMember,
      metadata: {
        messageId: item.id,
        superchat: superchatData,
      },
    };

    this.emit('chat', unifiedMessage);
    this.emit('superchat', { user: youtubeUser, superchat: superchatData, message });
  }

  /**
   * Handle membership messages
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleMembership(item: any): void {
    const author = item.author;

    const youtubeUser = createYouTubeUser({
      odlUserId: author?.id || '',
      channelId: author?.id || '',
      username: author?.name || '',
      displayName: author?.name || '',
      profilePictureUrl: this.getBestThumbnail(author?.thumbnails),
      isMember: true,
      isModerator: author?.is_moderator || false,
      isOwner: author?.is_owner || false,
      isVerified: author?.is_verified || false,
      badges: this.extractBadges(author?.badges),
    });

    this.emit('member', { user: youtubeUser, item });
  }

  /**
   * Get best thumbnail URL
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getBestThumbnail(thumbnails: any): string | undefined {
    if (!thumbnails || !Array.isArray(thumbnails)) return undefined;
    // Get the largest thumbnail
    const sorted = [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
    return sorted[0]?.url;
  }

  /**
   * Extract badges from author
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractBadges(badges: any): Array<{ id: string; label?: string; iconUrl?: string }> {
    if (!badges || !Array.isArray(badges)) return [];
    return badges.map((badge: { label?: string; icon_url?: string }) => ({
      id: badge.label || 'badge',
      label: badge.label,
      iconUrl: badge.icon_url,
    }));
  }

  /**
   * Check if author is a channel member
   * Checks multiple sources: direct property, membership object, and badges
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkMemberStatus(author: any): boolean {
    if (!author) return false;
    
    // Direct property check (youtubei.js uses is_member)
    if (author.is_member === true) return true;
    
    // Check membership object (some versions may use this)
    if (author.membership) return true;
    
    // Check badges for member indication
    // youtubei.js badge structure: { type: "LiveChatAuthorBadge", tooltip: "Member (2 months)", custom_thumbnail: [...] }
    if (Array.isArray(author.badges)) {
      const hasMemberBadge = author.badges.some((badge: { label?: string; type?: string; tooltip?: string }) => {
        const tooltip = badge.tooltip?.toLowerCase() || '';
        const label = badge.label?.toLowerCase() || '';
        return tooltip.includes('member') || label.includes('member') || 
               tooltip.includes('membro') || label.includes('membro'); // Portuguese support
      });
      if (hasMemberBadge) return true;
    }
    
    return false;
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
      console.log(`YOUTUBE ${this.videoIdOrUrl}: ${message}`);
    }
  }
}

/**
 * Factory function to create YouTube connection wrapper
 */
export function createYouTubeConnectionWrapper(
  onConnectionCountChange?: (delta: number) => void,
  enableLog: boolean = true
) {
  return (videoIdOrUrl: string): YouTubeConnectionWrapper => {
    return new YouTubeConnectionWrapper(
      videoIdOrUrl,
      DEFAULT_RECONNECT_CONFIG,
      enableLog,
      onConnectionCountChange
    );
  };
}
