/**
 * Statistics Service - Handles global statistics
 */
export class StatisticsService {
  private globalConnectionCount = 0;

  /**
   * Get global connection count
   */
  getGlobalConnectionCount(): number {
    return this.globalConnectionCount;
  }

  /**
   * Increment global connection count
   */
  incrementConnectionCount(): void {
    this.globalConnectionCount += 1;
  }

  /**
   * Decrement global connection count
   */
  decrementConnectionCount(): void {
    if (this.globalConnectionCount > 0) {
      this.globalConnectionCount -= 1;
    }
  }

  /**
   * Get statistics object
   */
  getStatistics(): { globalConnectionCount: number } {
    return {
      globalConnectionCount: this.globalConnectionCount,
    };
  }
}
