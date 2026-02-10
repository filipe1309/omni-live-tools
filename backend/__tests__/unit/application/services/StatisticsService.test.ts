import { StatisticsService } from '../../../../application/services/StatisticsService';

describe('StatisticsService', () => {
  let service: StatisticsService;

  beforeEach(() => {
    service = new StatisticsService();
  });

  describe('initial state', () => {
    it('should start with zero global connection count', () => {
      expect(service.getGlobalConnectionCount()).toBe(0);
    });

    it('should return statistics object with zero count', () => {
      const stats = service.getStatistics();
      expect(stats).toEqual({ globalConnectionCount: 0 });
    });
  });

  describe('incrementConnectionCount', () => {
    it('should increment connection count by 1', () => {
      service.incrementConnectionCount();

      expect(service.getGlobalConnectionCount()).toBe(1);
    });

    it('should increment multiple times correctly', () => {
      service.incrementConnectionCount();
      service.incrementConnectionCount();
      service.incrementConnectionCount();

      expect(service.getGlobalConnectionCount()).toBe(3);
    });
  });

  describe('decrementConnectionCount', () => {
    it('should decrement connection count by 1', () => {
      service.incrementConnectionCount();
      service.incrementConnectionCount();
      service.decrementConnectionCount();

      expect(service.getGlobalConnectionCount()).toBe(1);
    });

    it('should not go below zero', () => {
      service.decrementConnectionCount();
      service.decrementConnectionCount();

      expect(service.getGlobalConnectionCount()).toBe(0);
    });

    it('should handle decrement from zero gracefully', () => {
      expect(service.getGlobalConnectionCount()).toBe(0);
      
      service.decrementConnectionCount();
      
      expect(service.getGlobalConnectionCount()).toBe(0);
    });
  });

  describe('getStatistics', () => {
    it('should return current statistics', () => {
      service.incrementConnectionCount();
      service.incrementConnectionCount();

      const stats = service.getStatistics();

      expect(stats).toEqual({ globalConnectionCount: 2 });
    });

    it('should return a new object each time', () => {
      const stats1 = service.getStatistics();
      const stats2 = service.getStatistics();

      expect(stats1).not.toBe(stats2);
      expect(stats1).toEqual(stats2);
    });

    it('should reflect changes after modification', () => {
      const initialStats = service.getStatistics();
      expect(initialStats.globalConnectionCount).toBe(0);

      service.incrementConnectionCount();

      const updatedStats = service.getStatistics();
      expect(updatedStats.globalConnectionCount).toBe(1);
    });
  });

  describe('concurrent operations simulation', () => {
    it('should handle rapid increment and decrement', () => {
      // Simulate 100 connections
      for (let i = 0; i < 100; i++) {
        service.incrementConnectionCount();
      }

      // Disconnect 50
      for (let i = 0; i < 50; i++) {
        service.decrementConnectionCount();
      }

      expect(service.getGlobalConnectionCount()).toBe(50);
    });
  });
});
