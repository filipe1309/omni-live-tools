/**
 * Rate Limiter Repository Interface
 * Defines the contract for rate limiting
 */
export interface IRateLimiterRepository {
  /**
   * Check if a client should be blocked
   */
  isBlocked(clientId: string): boolean;

  /**
   * Record a request from a client
   */
  recordRequest(clientId: string): void;

  /**
   * Get current connection count for a client
   */
  getConnectionCount(clientId: string): number;

  /**
   * Increment connection count
   */
  incrementConnectionCount(clientId: string): void;

  /**
   * Decrement connection count
   */
  decrementConnectionCount(clientId: string): void;

  /**
   * Reset all rate limit data
   */
  reset(): void;
}
