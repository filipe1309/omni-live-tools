/**
 * Connection State Entity
 */
export interface ConnectionState {
  readonly roomId: string;
  readonly upgradedToWebsocket: boolean;
  readonly isConnected: boolean;
}

/**
 * Connection Options
 */
export interface ConnectionOptions {
  sessionId?: string;
  enableExtendedGiftInfo?: boolean;
  requestOptions?: Record<string, unknown>;
  websocketOptions?: Record<string, unknown>;
}

/**
 * Sanitize connection options for security
 */
export function sanitizeConnectionOptions(options: unknown): ConnectionOptions {
  if (typeof options !== 'object' || options === null) {
    return {};
  }

  const sanitized = { ...options } as ConnectionOptions;
  
  // Remove potentially dangerous options
  delete sanitized.requestOptions;
  delete sanitized.websocketOptions;
  
  return sanitized;
}
