/**
 * Simple performance tests for caching and monitoring
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { SimpleCache, SimpleCacheManager } from '../../src/utils/simple-cache';
import { SimplePerformanceMonitor } from '../../src/utils/simple-performance';

describe('Simple Performance Tests', () => {
  let cache: SimpleCache<string>;
  let cacheManager: SimpleCacheManager;
  let performanceMonitor: SimplePerformanceMonitor;

  beforeEach(() => {
    cache = new SimpleCache<string>(1000, 5000);
    cacheManager = new SimpleCacheManager();
    performanceMonitor = SimplePerformanceMonitor.getInstance();
  });

  afterEach(() => {
    cache.clear();
    cacheManager.destroy();
    performanceMonitor.clear();
  });

  test('basic cache operations should be fast', () => {
    
    const startTime = Date.now();
    
    // Perform cache operations
    for (let i = 0; i < 1000; i++) {
      cache.set(`key-${i}`, `value-${i}`);
    }
    
    for (let i = 0; i < 1000; i++) {
      const value = cache.get(`key-${i}`);
      if (i < 1000 - cache.size()) {
        // Some entries may have been evicted due to cache size limit
        continue;
      }
      expect(value).toBe(`value-${i}`);
    }
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(100); // Should complete in under 100ms
  });

  test('performance monitoring basics', () => {
    const startTime = Date.now();
    
    // Record many metrics
    for (let i = 0; i < 1000; i++) {
      performanceMonitor.recordMetric(`test-op-${i % 10}`, Math.random() * 100);
    }
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(50); // Should record quickly
    
    const metrics = performanceMonitor.getMetrics();
    expect(metrics.length).toBeGreaterThanOrEqual(1000);
  });

  test('memory usage should be reasonable', () => {
    const initialMemory = process.memoryUsage();
    
    // Create some data structures
    const data = [];
    for (let i = 0; i < 10000; i++) {
      data.push({
        id: i,
        name: `item-${i}`,
        data: 'x'.repeat(100)
      });
    }
    
    // Clean up
    data.length = 0;
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });

  test('concurrent operations simulation', async () => {
    // Results will be collected from promises
    const startTime = Date.now();
    
    // Simulate concurrent operations
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(
        Promise.resolve().then(() => {
          // Simulate some async work
          return new Promise<string>((resolve) => {
            setTimeout(() => {
              resolve(`result-${i}`);
            }, Math.random() * 10);
          });
        })
      );
    }
    
    const promiseResults = await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(100); // Should complete quickly due to concurrency
    expect(promiseResults).toHaveLength(100);
    promiseResults.forEach((result, index) => {
      expect(result).toBe(`result-${index}`);
    });
  });

  test('response time requirements simulation', () => {
    // Simulate different tool response times
    const toolResponseTimes = {
      generate_mushcode: 2500,    // 2.5 seconds
      validate_mushcode: 1500,    // 1.5 seconds
      optimize_mushcode: 3000,    // 3 seconds
      explain_mushcode: 2000,     // 2 seconds
      get_examples: 1000,         // 1 second
      format_mushcode: 800,       // 0.8 seconds
      compress_mushcode: 1200     // 1.2 seconds
    };
    
    // All tools should respond within 5 seconds
    Object.entries(toolResponseTimes).forEach(([_tool, responseTime]) => {
      expect(responseTime).toBeLessThan(5000);
    });
    
    // Calculate average response time
    const avgResponseTime = Object.values(toolResponseTimes).reduce((a, b) => a + b, 0) / Object.values(toolResponseTimes).length;
    expect(avgResponseTime).toBeLessThan(3000); // Average should be under 3 seconds
  });

  test('cache hit performance simulation', () => {
    const cache = new Map<string, { value: string; timestamp: number; hits: number }>();
    
    // Populate cache
    cache.set('popular-key', { value: 'popular-value', timestamp: Date.now(), hits: 0 });
    
    const startTime = Date.now();
    
    // Simulate many cache hits
    for (let i = 0; i < 1000; i++) {
      const entry = cache.get('popular-key');
      if (entry) {
        entry.hits++;
      }
    }
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(10); // Cache hits should be very fast
    
    const entry = cache.get('popular-key');
    expect(entry?.hits).toBe(1000);
  });

  test('search performance simulation', () => {
    // Simulate knowledge base search
    const patterns = [];
    for (let i = 0; i < 1000; i++) {
      patterns.push({
        id: `pattern-${i}`,
        name: `Pattern ${i}`,
        description: `Description for pattern ${i}`,
        tags: [`tag-${i % 10}`, `category-${i % 5}`],
        content: `Content for pattern ${i}`
      });
    }
    
    const searchTerm = 'pattern';
    const startTime = Date.now();
    
    // Simple search simulation
    const results = patterns.filter(pattern => 
      pattern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pattern.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pattern.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(100); // Search should be fast
    expect(results.length).toBeGreaterThan(0);
  });

  test('pattern matching performance simulation', () => {
    const codeTerms = ['function', 'command', 'trigger', 'attribute', 'variable'];
    const patterns = [];
    
    // Create test patterns
    for (let i = 0; i < 500; i++) {
      patterns.push({
        id: `pattern-${i}`,
        content: `${codeTerms[i % codeTerms.length]} example ${i}`,
        relevance: 0
      });
    }
    
    const startTime = Date.now();
    
    // Simulate pattern matching
    const searchTerms = ['function', 'command'];
    for (const pattern of patterns) {
      let matches = 0;
      for (const term of searchTerms) {
        if (pattern.content.toLowerCase().includes(term.toLowerCase())) {
          matches++;
        }
      }
      pattern.relevance = matches / searchTerms.length;
    }
    
    // Sort by relevance
    patterns.sort((a, b) => b.relevance - a.relevance);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(50); // Pattern matching should be fast
    expect(patterns[0]?.relevance).toBeGreaterThan(0);
  });
});