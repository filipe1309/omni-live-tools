import path from 'path';

/**
 * Environment Configuration
 */
export interface EnvConfig {
  port: number;
  sessionId?: string;
  enableRateLimit: boolean;
  maxConnections: number;
  maxRequestsPerMinute: number;
  nodeEnv: string;
  staticFilesPath: string;
}

/**
 * Load configuration from environment variables
 */
export function loadConfig (): EnvConfig {
  return {
    port: parseInt(process.env.PORT || '8081', 10),
    sessionId: process.env.SESSIONID,
    enableRateLimit: process.env.ENABLE_RATE_LIMIT === 'true',
    maxConnections: parseInt(process.env.MAX_CONNECTIONS || '10', 10),
    maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '5', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    staticFilesPath: process.env.STATIC_FILES_PATH || path.join(__dirname, '../../dist-frontend'),
  };
}

/**
 * Validate configuration
 */
export function validateConfig (config: EnvConfig): void {
  if (config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid port number: ${config.port}`);
  }

  if (config.maxConnections < 1) {
    throw new Error(`Invalid max connections: ${config.maxConnections}`);
  }

  if (config.maxRequestsPerMinute < 1) {
    throw new Error(`Invalid max requests per minute: ${config.maxRequestsPerMinute}`);
  }
}
