import { IRateLimiterRepository } from '../../domain/repositories';

/**
 * Rate Limiter Configuration
 */
interface RateLimiterConfig {
  maxConnections: number;
  maxRequestsPerMinute: number;
  resetIntervalMs: number;
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  maxConnections: 10,
  maxRequestsPerMinute: 5,
  resetIntervalMs: 60 * 1000, // 1 minute
};

/**
 * In-Memory Rate Limiter Repository
 */
export class InMemoryRateLimiterRepository implements IRateLimiterRepository {
  private requestCounts: Map<string, number> = new Map();
  private connectionCounts: Map<string, number> = new Map();
  private resetInterval: NodeJS.Timeout | null = null;

  constructor(private readonly config: RateLimiterConfig = DEFAULT_CONFIG) {
    this.startResetInterval();
  }

  /**
   * Check if a client is blocked
   */
  isBlocked(clientId: string): boolean {
    const requestCount = this.requestCounts.get(clientId) || 0;
    return requestCount > this.config.maxRequestsPerMinute;
  }

  /**
   * Record a request from a client
   */
  recordRequest(clientId: string): void {
    const currentCount = this.requestCounts.get(clientId) || 0;
    this.requestCounts.set(clientId, currentCount + 1);
  }

  /**
   * Get connection count for a client
   */
  getConnectionCount(clientId: string): number {
    return this.connectionCounts.get(clientId) || 0;
  }

  /**
   * Increment connection count
   */
  incrementConnectionCount(clientId: string): void {
    const currentCount = this.connectionCounts.get(clientId) || 0;
    this.connectionCounts.set(clientId, currentCount + 1);
  }

  /**
   * Decrement connection count
   */
  decrementConnectionCount(clientId: string): void {
    const currentCount = this.connectionCounts.get(clientId) || 0;
    if (currentCount > 0) {
      this.connectionCounts.set(clientId, currentCount - 1);
    }
  }

  /**
   * Reset all rate limit data
   */
  reset(): void {
    this.requestCounts.clear();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.resetInterval) {
      clearInterval(this.resetInterval);
      this.resetInterval = null;
    }
  }

  /**
   * Start the reset interval for request counts
   */
  private startResetInterval(): void {
    this.resetInterval = setInterval(() => {
      this.requestCounts.clear();
    }, this.config.resetIntervalMs);
  }
}
