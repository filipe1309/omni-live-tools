import { IRateLimiterRepository } from '../../domain/repositories';

/**
 * Rate Limiter Service - Handles rate limiting business logic
 */
export class RateLimiterService {
  constructor(
    private readonly rateLimiterRepository: IRateLimiterRepository,
    private readonly maxConnections: number = 10,
    private readonly maxRequestsPerMinute: number = 5,
    private readonly enabled: boolean = false
  ) {}

  /**
   * Check if a client should be blocked
   */
  shouldBlockClient(clientId: string): boolean {
    if (!this.enabled) {
      return false;
    }

    const connectionCount = this.rateLimiterRepository.getConnectionCount(clientId);
    
    if (connectionCount > this.maxConnections) {
      console.info(`LIMITER: Max connection count of ${this.maxConnections} exceeded for client ${clientId}`);
      return true;
    }

    if (this.rateLimiterRepository.isBlocked(clientId)) {
      console.info(`LIMITER: Max request count of ${this.maxRequestsPerMinute} exceeded for client ${clientId}`);
      return true;
    }

    return false;
  }

  /**
   * Record a request from a client
   */
  recordRequest(clientId: string): void {
    this.rateLimiterRepository.recordRequest(clientId);
  }

  /**
   * Increment connection count for a client
   */
  incrementConnection(clientId: string): void {
    this.rateLimiterRepository.incrementConnectionCount(clientId);
  }

  /**
   * Decrement connection count for a client
   */
  decrementConnection(clientId: string): void {
    this.rateLimiterRepository.decrementConnectionCount(clientId);
  }

  /**
   * Get rate limit exceeded message
   */
  getRateLimitMessage(): string {
    return 'You have opened too many connections or made too many connection requests. ' +
           'Please reduce the number of connections/requests or host your own server instance. ' +
           'The connections are limited to avoid that the server IP gets blocked by TikTok.';
  }
}
