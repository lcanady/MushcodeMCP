/**
 * Performance tests to ensure sub-5-second response times
 * Tests knowledge base and caching performance
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { OptimizedKnowledgeBase } from '../../src/knowledge/optimized-base.js';
import { OptimizedPatternMatcher } from '../../src/knowledge/optimized-matcher.js';
import { performanceMonitor } from '../../src/utils/performance.js';
import { cacheManager } from '../../src/utils/cache.js';
import { logger } from '../../src/utils/logger.js';
import type { MushcodePattern, CodeExample, SecurityRule } from '../../src/types/knowledge.js';

describe('Performance Tests - Response Time Requirements', () => {
  let knowledgeBase: OptimizedKnowledgeBase;
  let patternMatcher: OptimizedPatternMatcher;

  beforeAll(async () => {
    // Initialize optimized knowledge base
    knowledgeBase = new OptimizedKnowledgeBase();
    patternMatcher = new OptimizedPatternMatcher(knowledgeBase);

    // Populate with test data
    await populateTestData(knowledgeBase);
    
    // Warm up caches
    knowledgeBase.warmupCaches();
    
    logger.info('Performance test setup completed', {
      operation: 'performance_test_setup'
    });
  });

  afterAll(() => {
    // Clean up
    cacheManager.destroy();
    performanceMonitor.clearMetrics();
  });

  describe('Knowledge Base Performance', () => {
    test('search operations should complete within 1 second', async () => {
      const queries = [
        'create command player information',
        'trigger system room events',
        'inventory management function',
        'combat calculation system',
        'database query optimization'
      ];

      for (const query of queries) {
        const startTime = Date.now();
        
        const result = knowledgeBase.search({
          query,
          includePatterns: true,
          includeExamples: true,
          fuzzyMatch: true,
          limit: 10
        });
        
        const duration = Date.now() - startTime;
        
        expect(duration).toBeLessThan(1000);
        expect(result.totalResults).toBeGreaterThanOrEqual(0);
        
        logger.info(`Knowledge base search completed`, {
          operation: 'performance_test',
          component: 'knowledge_search',
          duration,
          query: query.substring(0, 30),
          results: result.totalResults
        });
      }
    });

    test('pattern matching should complete within 500ms', async () => {
      const descriptions = [
        'simple player command',
        'complex trigger system',
        'database function',
        'security validation',
        'optimization pattern'
      ];

      for (const description of descriptions) {
        const startTime = Date.now();
        
        const patterns = patternMatcher.findPatternsForGeneration(
          description,
          'pennmush',
          'command'
        );
        
        const duration = Date.now() - startTime;
        
        expect(duration).toBeLessThan(500);
        expect(Array.isArray(patterns)).toBe(true);
        
        logger.info(`Pattern matching completed`, {
          operation: 'performance_test',
          component: 'pattern_matching',
          duration,
          description: description.substring(0, 30),
          matches: patterns.length
        });
      }
    });

    test('security violation detection should complete within 300ms', async () => {
      const testCodes = [
        `@create Test Command\n@set Test Command = COMMANDS`,
        `&FUNC me = [setq(0, %0)][add(%q0, 5)]`,
        `@force %# = @password %1`,
        `&COMPLEX me = [iter(lnum(1,100), ##)]`,
        `@create Security Test\n&LISTEN Security Test = *password*`
      ];

      for (const code of testCodes) {
        const startTime = Date.now();
        
        const violations = patternMatcher.findSecurityViolations(code, 'pennmush');
        
        const duration = Date.now() - startTime;
        
        expect(duration).toBeLessThan(300);
        expect(Array.isArray(violations)).toBe(true);
        
        logger.info(`Security violation check completed`, {
          operation: 'performance_test',
          component: 'security_check',
          duration,
          codeLength: code.length,
          violations: violations.length
        });
      }
    });
  });

  describe('Cache Performance', () => {
    test('cache hit operations should complete within 10ms', async () => {
      // First, populate cache
      const query = 'test cache performance';
      knowledgeBase.search({ query, includePatterns: true });
      
      // Now test cache hits
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        
        const result = knowledgeBase.search({ query, includePatterns: true });
        
        const duration = Date.now() - startTime;
        
        expect(duration).toBeLessThan(10);
        expect(result).toBeDefined();
        
        logger.debug(`Cache hit test completed`, {
          operation: 'performance_test',
          component: 'cache_hit',
          duration,
          iteration: i + 1
        });
      }
    });

    test('cache statistics should be accessible quickly', () => {
      const startTime = Date.now();
      
      const stats = knowledgeBase.getCacheStats();
      
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5);
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
      
      logger.info(`Cache statistics retrieved`, {
        operation: 'performance_test',
        component: 'cache_stats',
        duration,
        stats
      });
    });
  });

  describe('Load Testing', () => {
    test('concurrent search operations should maintain performance', async () => {
      const queries = Array.from({ length: 20 }, (_, i) => `concurrent test query ${i}`);
      
      const startTime = Date.now();
      
      const promises = queries.map(query => 
        knowledgeBase.search({
          query,
          includePatterns: true,
          includeExamples: true,
          limit: 5
        })
      );
      
      const results = await Promise.all(promises);
      
      const totalDuration = Date.now() - startTime;
      const averageDuration = totalDuration / queries.length;
      
      expect(averageDuration).toBeLessThan(2000); // Average should be under 2 seconds
      expect(results).toHaveLength(queries.length);
      
      logger.info(`Concurrent load test completed`, {
        operation: 'performance_test',
        component: 'concurrent_load',
        totalDuration,
        averageDuration,
        queryCount: queries.length
      });
    });

    test('memory usage should remain stable under load', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        knowledgeBase.search({
          query: `load test query ${i}`,
          includePatterns: true,
          includeExamples: true
        });
        
        patternMatcher.findPatternsForGeneration(`load test ${i}`, 'pennmush');
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;
      
      // Memory increase should be reasonable (less than 50%)
      expect(memoryIncreasePercent).toBeLessThan(50);
      
      logger.info(`Memory usage test completed`, {
        operation: 'performance_test',
        component: 'memory_usage',
        initialMemory: initialMemory.heapUsed,
        finalMemory: finalMemory.heapUsed,
        memoryIncrease,
        memoryIncreasePercent
      });
    });
  });

  describe('Performance Monitoring', () => {
    test('performance metrics should be collected', () => {
      const summary = performanceMonitor.getPerformanceSummary();
      
      expect(summary).toBeDefined();
      expect(summary.operations).toBeDefined();
      expect(summary.totalRequests).toBeGreaterThan(0);
      expect(summary.averageResponseTime).toBeGreaterThan(0);
      
      logger.info(`Performance summary retrieved`, {
        operation: 'performance_test',
        component: 'performance_monitoring',
        summary
      });
    });

    test('slow operations should be identified', () => {
      const slowOps = performanceMonitor.getSlowOperations();
      
      expect(Array.isArray(slowOps)).toBe(true);
      
      // Log any slow operations for analysis
      if (slowOps.length > 0) {
        logger.warn(`Slow operations detected`, {
          operation: 'performance_test',
          component: 'slow_operations',
          slowOperations: slowOps
        });
      }
    });
  });
});

/**
 * Populate knowledge base with test data
 */
async function populateTestData(knowledgeBase: OptimizedKnowledgeBase): Promise<void> {
  // Add test patterns with all required fields
  const testPatterns: MushcodePattern[] = [
    {
      id: 'test-pattern-1',
      name: 'Simple Command',
      description: 'A basic command pattern',
      category: 'command',
      difficulty: 'beginner',
      serverCompatibility: ['pennmush', 'tinymush'],
      codeTemplate: '@create {{name}}\n@set {{name}} = COMMANDS',
      parameters: [{ name: 'name', type: 'string', description: 'Command name', required: true }],
      tags: ['command', 'basic'],
      relatedPatterns: [],
      examples: [],
      notes: 'Basic command creation pattern',
      securityLevel: 'safe',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'test-pattern-2',
      name: 'Function Pattern',
      description: 'A function creation pattern',
      category: 'function',
      difficulty: 'intermediate',
      serverCompatibility: ['pennmush'],
      codeTemplate: '&{{name}} me = [{{code}}]',
      parameters: [
        { name: 'name', type: 'string', description: 'Function name', required: true },
        { name: 'code', type: 'string', description: 'Function code', required: true }
      ],
      tags: ['function', 'intermediate'],
      relatedPatterns: [],
      examples: [],
      notes: 'Function creation pattern',
      securityLevel: 'safe',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  for (const pattern of testPatterns) {
    knowledgeBase.addPattern(pattern);
  }

  // Add test examples with all required fields
  const testExamples: CodeExample[] = [
    {
      id: 'test-example-1',
      title: 'Hello Command',
      description: 'Simple greeting command',
      category: 'command',
      difficulty: 'beginner',
      serverCompatibility: ['pennmush'],
      code: '@create Hello Command\n@set Hello Command = COMMANDS\n&CMD Hello Command = @pemit %# = Hello, %N!',
      tags: ['greeting', 'simple'],
      explanation: 'Creates a simple greeting command',
      relatedConcepts: ['commands', 'messaging'],
      learningObjectives: ['Learn basic command creation', 'Understand messaging']
    }
  ];

  for (const example of testExamples) {
    knowledgeBase.addExample(example);
  }

  // Add test security rules with all required fields
  const testSecurityRules: SecurityRule[] = [
    {
      ruleId: 'test-security-1',
      name: 'Force Command Detection',
      description: 'Detects potentially dangerous @force commands',
      category: 'permissions',
      severity: 'high',
      pattern: '@force.*@password',
      explanation: 'The @force command combined with @password can be dangerous',
      recommendation: 'Use proper permission checks instead of @force',
      affectedServers: ['pennmush', 'tinymush'],
      examples: ['@force %# = @password %1'],
      references: ['https://example.com/security-guide']
    }
  ];

  for (const rule of testSecurityRules) {
    knowledgeBase.addSecurityRule(rule);
  }

  logger.info('Test data populated', {
    operation: 'populate_test_data',
    patterns: testPatterns.length,
    examples: testExamples.length,
    securityRules: testSecurityRules.length
  });
}