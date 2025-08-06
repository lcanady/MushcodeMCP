/**
 * Cache and performance optimization tests
 * Tests the caching system and performance monitoring utilities
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { LRUCache, CacheManager } from '../../src/utils/cache';
import { PerformanceMonitor } from '../../src/utils/performance';

describe('Cache Performance Tests', () => {
  let cache: LRUCache<string>;
  let cacheManager: CacheManager;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    cacheManager = new CacheManager();
    cache = cacheManager.getCache<string>('test-cache', {
      maxSize: 100,
      defaultTtl: 5000,
      cleanupInterval: 1000
    });
    performanceMonitor = PerformanceMonitor.getInstance();
  });

  afterEach(() => {
    cacheManager.destroy();
    performanceMonitor.clearMetrics();
  });

  describe('LRU Cache Performance', () => {
    test('cache operations should be fast', () => {
      const startTime = Date.now();
      
      // Perform many cache operations
      for (let i = 0; i < 1000; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }
      
      const setDuration = Date.now() - startTime;
      expect(setDuration).toBeLessThan(100); // Should complete in under 100ms
      
      const getStartTime = Date.now();
      
      // Test cache retrieval performance
      for (let i = 0; i < 1000; i++) {
        const value = cache.get(`key-${i}`);
        expect(value).toBe(`value-${i}`);
      }
      
      const getDuration = Date.now() - getStartTime;
      expect(getDuration).toBeLessThan(50); // Gets should be even faster
    });

    test('cache hit operations should be under 10ms', () => {
      // Populate cache
      cache.set('test-key', 'test-value');
      
      // Test multiple cache hits
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        const value = cache.get('test-key');
        const duration = Date.now() - startTime;
        
        expect(value).toBe('test-value');
        expect(duration).toBeLessThan(10);
      }
    });

    test('cache statistics should be accessible quickly', () => {
      // Populate cache with some data
      for (let i = 0; i < 50; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }
      
      const startTime = Date.now();
      const stats = cache.getStats();
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5);
      expect(stats.size).toBe(50);
      expect(stats.hits).toBeGreaterThanOrEqual(0);
      expect(stats.misses).toBeGreaterThanOrEqual(0);
    });

    test('cache eviction should maintain performance', () => {
      const maxSize = 10;
      const smallCache = cacheManager.getCache<string>('small-cache', {
        maxSize,
        defaultTtl: 5000
      });
      
      const startTime = Date.now();
      
      // Add more items than cache can hold
      for (let i = 0; i < maxSize * 2; i++) {
        smallCache.set(`key-${i}`, `value-${i}`);
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(50); // Should handle eviction quickly
      
      const stats = smallCache.getStats();
      expect(stats.size).toBeLessThanOrEqual(maxSize);
      expect(stats.evictions).toBeGreaterThan(0);
    });
  });

  describe('Performance Monitor Tests', () => {
    test('performance recording should be fast', () => {
      const startTime = Date.now();
      
      // Record many performance metrics
      for (let i = 0; i < 1000; i++) {
        performanceMonitor.recordMetric(`test-operation-${i % 10}`, Math.random() * 100, true);
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100); // Should record 1000 metrics in under 100ms
    });

    test('performance timer should work correctly', () => {
      const timer = performanceMonitor.startTimer('test-timer');
      
      // Simulate some work
      const workStartTime = Date.now();
      while (Date.now() - workStartTime < 10) {
        // Busy wait for 10ms
      }
      
      timer(); // Complete the timer (success defaults to true)
      
      const stats = performanceMonitor.getOperationStats('test-timer');
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(1);
      expect(stats!.averageDuration).toBeGreaterThanOrEqual(10);
      expect(stats!.averageDuration).toBeLessThan(50); // Should be close to 10ms
    });

    test('performance statistics should be calculated quickly', () => {
      // Record some test metrics
      for (let i = 0; i < 100; i++) {
        performanceMonitor.recordMetric('test-op', Math.random() * 1000, true);
      }
      
      const startTime = Date.now();
      const stats = performanceMonitor.getAllOperationStats();
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(10);
      expect(stats.length).toBeGreaterThan(0);
      
      const testOpStats = stats.find(s => s.operation === 'test-op');
      expect(testOpStats).toBeDefined();
      expect(testOpStats!.count).toBe(100);
    });

    test('slow operation detection should work', () => {
      // Record some slow operations
      performanceMonitor.recordMetric('slow-op', 6000, true); // 6 seconds
      performanceMonitor.recordMetric('fast-op', 100, true);  // 100ms
      
      const slowOps = performanceMonitor.getSlowOperations(5000); // 5 second threshold
      
      expect(slowOps.length).toBeGreaterThan(0);
      expect(slowOps[0]?.operation).toBe('slow-op');
      expect(slowOps[0]?.stats.averageDuration).toBe(6000);
    });

    test('performance summary should be comprehensive', () => {
      // Record various metrics
      performanceMonitor.recordMetric('op1', 1000, true);
      performanceMonitor.recordMetric('op1', 1500, true);
      performanceMonitor.recordMetric('op2', 500, false); // Failed operation
      
      const startTime = Date.now();
      const summary = performanceMonitor.getPerformanceSummary();
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(10);
      expect(summary.operations.length).toBeGreaterThan(0);
      expect(summary.totalRequests).toBe(3);
      expect(summary.averageResponseTime).toBeGreaterThan(0);
      expect(summary.errorRate).toBeCloseTo(1/3, 2); // One failed out of three
    });
  });

  describe('Cache Manager Performance', () => {
    test('multiple cache management should be efficient', () => {
      const startTime = Date.now();
      
      // Create multiple caches
      const caches = [];
      for (let i = 0; i < 10; i++) {
        caches.push(cacheManager.getCache<string>(`cache-${i}`, {
          maxSize: 50,
          defaultTtl: 5000
        }));
      }
      
      // Populate all caches
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 50; j++) {
          caches[i]?.set(`key-${j}`, `value-${j}`);
        }
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(200); // Should handle 10 caches with 50 items each quickly
      
      // Test statistics collection
      const statsStartTime = Date.now();
      const allStats = cacheManager.getAllStats();
      const statsDuration = Date.now() - statsStartTime;
      
      expect(statsDuration).toBeLessThan(10);
      expect(Object.keys(allStats)).toHaveLength(11); // 10 + test-cache from beforeEach
    });

    test('cache cleanup should be performant', () => {
      // Create cache with short TTL
      const shortTtlCache = cacheManager.getCache<string>('short-ttl-cache', {
        maxSize: 100,
        defaultTtl: 1, // 1ms TTL
        cleanupInterval: 10
      });
      
      // Add items that will expire quickly
      for (let i = 0; i < 50; i++) {
        shortTtlCache.set(`key-${i}`, `value-${i}`);
      }
      
      // Wait for items to expire
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const stats = shortTtlCache.getStats();
          // Items should have been cleaned up
          expect(stats.size).toBeLessThan(50);
          resolve();
        }, 50); // Wait 50ms for cleanup
      });
    });
  });

  describe('Memory Usage Tests', () => {
    test('cache should not leak memory under load', () => {
      const initialMemory = process.memoryUsage();
      
      // Perform many cache operations
      for (let i = 0; i < 10000; i++) {
        cache.set(`key-${i}`, `value-${i}-${'x'.repeat(100)}`); // 100 char values
        
        // Occasionally read and delete
        if (i % 100 === 0) {
          cache.get(`key-${i - 50}`);
          cache.delete(`key-${i - 75}`);
        }
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 10MB for this test)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    test('performance monitor should not leak memory', () => {
      const initialMemory = process.memoryUsage();
      
      // Record many metrics
      for (let i = 0; i < 10000; i++) {
        performanceMonitor.recordMetric(`test-op-${i % 100}`, Math.random() * 1000, true, {
          metadata: `test-${i}`,
          iteration: i
        });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
    });
  });

  describe('Concurrent Operations', () => {
    test('concurrent cache operations should maintain performance', async () => {
      const promises = [];
      const startTime = Date.now();
      
      // Create many concurrent cache operations
      for (let i = 0; i < 100; i++) {
        promises.push(
          Promise.resolve().then(() => {
            cache.set(`concurrent-key-${i}`, `value-${i}`);
            return cache.get(`concurrent-key-${i}`);
          })
        );
      }
      
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(100); // Should complete quickly
      expect(results).toHaveLength(100);
      results.forEach((result, index) => {
        expect(result).toBe(`value-${index}`);
      });
    });

    test('concurrent performance monitoring should work', async () => {
      const promises = [];
      const startTime = Date.now();
      
      // Create many concurrent performance recordings
      for (let i = 0; i < 100; i++) {
        promises.push(
          Promise.resolve().then(() => {
            const timer = performanceMonitor.startTimer(`concurrent-op-${i % 10}`);
            // Simulate some work
            setTimeout(() => timer(), Math.random() * 10);
          })
        );
      }
      
      await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(200); // Should handle concurrent operations quickly
      
      // Wait a bit for all timers to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const stats = performanceMonitor.getAllOperationStats();
      expect(stats.length).toBeGreaterThan(0);
    });
  });
});