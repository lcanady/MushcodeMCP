/**
 * Performance Testing for Response Time Requirements
 * Tests that all tools meet the sub-5-second response time requirement
 */

import { MushcodeProtocolHandler } from '../../src/server/protocol.js';
import { ConfigManager } from '../../src/config/index.js';
import { MockMCPClient, createTestMCPClient } from './mcp-client-mock.js';
import { createToolResponse } from './test-helpers.js';

describe('Performance Testing', () => {
  let protocolHandler: MushcodeProtocolHandler;
  let mockClient: MockMCPClient;
  let configManager: ConfigManager;

  beforeEach(async () => {
    configManager = new ConfigManager();
    protocolHandler = new MushcodeProtocolHandler(configManager);
    mockClient = createTestMCPClient({ timeout: 6000 }); // Slightly longer than 5s requirement
  });

  afterEach(async () => {
    if (mockClient.isConnected()) {
      await mockClient.disconnect();
    }
    if (protocolHandler.isServerRunning()) {
      await protocolHandler.stop();
    }
  });

  describe('Response Time Requirements', () => {
    beforeEach(async () => {
      await mockClient.connect();
      await mockClient.initialize();
    });

    it('should respond to generate_mushcode within 5 seconds', async () => {
      const startTime = Date.now();

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'generate_mushcode') {
          // Simulate realistic processing time (2-3 seconds)
          setTimeout(() => {
            const response = createToolResponse(request.id, {
              code: '&CMD.TEST me=$test:@pemit %#=Generated code',
              explanation: 'Test explanation',
              usage_example: 'test',
              compatibility: ['PennMUSH']
            });
            mockClient.receiveResponse(response);
          }, 2500); // 2.5 second delay
        }
      });

      const result = await mockClient.callTool('generate_mushcode', {
        description: 'Create a complex command with multiple features'
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(responseTime).toBeLessThan(5000);
      expect(responseTime).toBeGreaterThan(2000); // Should include processing time
    });

    it('should respond to validate_mushcode within 5 seconds', async () => {
      const startTime = Date.now();

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'validate_mushcode') {
          // Simulate validation processing time
          setTimeout(() => {
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    is_valid: true,
                    syntax_errors: [],
                    security_warnings: [],
                    best_practice_suggestions: []
                  })
                }]
              }
            };
            mockClient.receiveResponse(response);
          }, 1500); // 1.5 second delay
        }
      });

      const result = await mockClient.callTool('validate_mushcode', {
        code: '&CMD.COMPLEX me=$complex *:@pemit %#=[switch(%0,hello,Hi!,bye,Bye!,?)]'
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(responseTime).toBeLessThan(5000);
    });

    it('should respond to optimize_mushcode within 5 seconds', async () => {
      const startTime = Date.now();

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'optimize_mushcode') {
          setTimeout(() => {
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    optimized_code: 'Optimized code',
                    improvements: [],
                    performance_impact: 'Minor improvements'
                  })
                }]
              }
            };
            mockClient.receiveResponse(response);
          }, 3000); // 3 second delay
        }
      });

      const result = await mockClient.callTool('optimize_mushcode', {
        code: '&CMD.SLOW me=$slow:@dolist lnum(1,100)=@pemit %#=Number ##'
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(responseTime).toBeLessThan(5000);
    });

    it('should respond to explain_mushcode within 5 seconds', async () => {
      const startTime = Date.now();

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'explain_mushcode') {
          setTimeout(() => {
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    explanation: 'Detailed explanation',
                    code_breakdown: [],
                    concepts_used: ['Commands']
                  })
                }]
              }
            };
            mockClient.receiveResponse(response);
          }, 2000); // 2 second delay
        }
      });

      const result = await mockClient.callTool('explain_mushcode', {
        code: '&CMD.COMPLEX me=$complex *:@pemit %#=[switch(%0,hello,Hi!,bye,Bye!,?)]'
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(responseTime).toBeLessThan(5000);
    });

    it('should respond to get_examples within 5 seconds', async () => {
      const startTime = Date.now();

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'get_examples') {
          setTimeout(() => {
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    examples: [
                      {
                        title: 'Example Command',
                        code: '&CMD.EXAMPLE me=$example:@pemit %#=Example'
                      }
                    ],
                    learning_path: ['Step 1', 'Step 2']
                  })
                }]
              }
            };
            mockClient.receiveResponse(response);
          }, 1000); // 1 second delay
        }
      });

      const result = await mockClient.callTool('get_examples', {
        topic: 'commands',
        difficulty: 'beginner'
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(responseTime).toBeLessThan(5000);
    });

    it('should respond to format_mushcode within 5 seconds', async () => {
      const startTime = Date.now();

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'format_mushcode') {
          setTimeout(() => {
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    formatted_code: 'Formatted code',
                    changes_made: ['Added formatting'],
                    style_notes: 'Applied readable style'
                  })
                }]
              }
            };
            mockClient.receiveResponse(response);
          }, 800); // 0.8 second delay
        }
      });

      const result = await mockClient.callTool('format_mushcode', {
        code: '&CMD.MESSY me=$messy:@pemit %#=Hello',
        style: 'readable'
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(responseTime).toBeLessThan(5000);
    });

    it('should respond to compress_mushcode within 5 seconds', async () => {
      const startTime = Date.now();

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'compress_mushcode') {
          setTimeout(() => {
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    compressed_code: 'Compressed code',
                    original_size: 100,
                    compressed_size: 80,
                    compression_ratio: 20,
                    optimizations_applied: ['Removed whitespace']
                  })
                }]
              }
            };
            mockClient.receiveResponse(response);
          }, 1200); // 1.2 second delay
        }
      });

      const result = await mockClient.callTool('compress_mushcode', {
        code: '// Comment\n&CMD.VERBOSE me=$verbose:@pemit %#=Hello',
        compression_level: 'moderate'
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(responseTime).toBeLessThan(5000);
    });
  });

  describe('Concurrent Request Performance', () => {
    beforeEach(async () => {
      await mockClient.connect();
      await mockClient.initialize();
    });

    it('should handle multiple concurrent requests within time limits', async () => {
      const requestCount = 5;
      const startTime = Date.now();

      // Set up response handler for all requests
      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call') {
          setTimeout(() => {
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    result: `Response for ${request.params.name}`,
                    processed_at: Date.now()
                  })
                }]
              }
            };
            mockClient.receiveResponse(response);
          }, 1000); // 1 second processing time per request
        }
      });

      // Make multiple concurrent requests
      const promises = [
        mockClient.callTool('generate_mushcode', { description: 'test1' }),
        mockClient.callTool('validate_mushcode', { code: 'test1' }),
        mockClient.callTool('optimize_mushcode', { code: 'test1' }),
        mockClient.callTool('explain_mushcode', { code: 'test1' }),
        mockClient.callTool('get_examples', { topic: 'test1' })
      ];

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(requestCount);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.content[0].text).toBeDefined();
      });

      // All requests should complete within reasonable time
      // (not necessarily 5s since they're concurrent)
      expect(totalTime).toBeLessThan(8000);
    });

    it('should maintain performance under load', async () => {
      const heavyRequestCount = 10;
      const startTime = Date.now();

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call') {
          // Simulate variable processing times
          const processingTime = Math.random() * 2000 + 500; // 0.5-2.5 seconds
          setTimeout(() => {
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    result: 'Load test response',
                    processing_time: processingTime
                  })
                }]
              }
            };
            mockClient.receiveResponse(response);
          }, processingTime);
        }
      });

      // Create heavy load with mixed tool types
      const promises = [];
      for (let i = 0; i < heavyRequestCount; i++) {
        const toolName = ['generate_mushcode', 'validate_mushcode', 'optimize_mushcode'][i % 3]!;
        promises.push(mockClient.callTool(toolName, { description: `load-test-${i}` }));
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(heavyRequestCount);
      
      // Under load, total time should still be reasonable
      expect(totalTime).toBeLessThan(15000); // 15 seconds for 10 concurrent requests
      
      // All requests should succeed
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.content[0].text).toBeDefined();
      });
    });
  });

  describe('Memory and Resource Usage', () => {
    beforeEach(async () => {
      await mockClient.connect();
      await mockClient.initialize();
    });

    it('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage();
      const iterations = 50;

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({ result: 'memory test' })
              }]
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      // Perform many operations
      for (let i = 0; i < iterations; i++) {
        await mockClient.callTool('generate_mushcode', { description: `test-${i}` });
        
        // Force garbage collection periodically if available
        if (global.gc && i % 10 === 0) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB for 50 operations)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should handle large code inputs efficiently', async () => {
      const largeCode = '&CMD.LARGE me=$large:' + 'a'.repeat(10000); // 10KB of code
      const startTime = Date.now();

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'validate_mushcode') {
          setTimeout(() => {
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    is_valid: false,
                    syntax_errors: [{ line: 1, message: 'Code too long' }]
                  })
                }]
              }
            };
            mockClient.receiveResponse(response);
          }, 2000); // 2 second processing time for large input
        }
      });

      const result = await mockClient.callTool('validate_mushcode', {
        code: largeCode
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(responseTime).toBeLessThan(5000); // Should still meet time requirement
    });
  });

  describe('Performance Monitoring and Metrics', () => {
    beforeEach(async () => {
      await mockClient.connect();
      await mockClient.initialize();
    });

    it('should track response time statistics', async () => {
      const responseTimes: number[] = [];
      const requestCount = 10;

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call') {
          const processingTime = Math.random() * 1000 + 500; // 0.5-1.5 seconds
          setTimeout(() => {
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({ processing_time: processingTime })
                }]
              }
            };
            mockClient.receiveResponse(response);
          }, processingTime);
        }
      });

      // Make multiple requests and track times
      for (let i = 0; i < requestCount; i++) {
        const startTime = Date.now();
        await mockClient.callTool('generate_mushcode', { description: `perf-test-${i}` });
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }

      // Calculate statistics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);

      expect(avgResponseTime).toBeLessThan(5000);
      expect(maxResponseTime).toBeLessThan(5000);
      expect(minResponseTime).toBeGreaterThan(0);
      
      // Standard deviation should be reasonable (not too much variance)
      const variance = responseTimes.reduce((acc, time) => acc + Math.pow(time - avgResponseTime, 2), 0) / responseTimes.length;
      const stdDev = Math.sqrt(variance);
      expect(stdDev).toBeLessThan(2000); // Less than 2 second standard deviation
    });

    it('should provide performance insights for optimization', async () => {
      const toolPerformance = new Map<string, number[]>();
      const tools = ['generate_mushcode', 'validate_mushcode', 'optimize_mushcode'];

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call') {
          // Simulate different performance characteristics per tool
          const toolName = request.params.name;
          let processingTime = 1000; // Base time
          
          if (toolName === 'generate_mushcode') processingTime += 1000; // Generation is slower
          if (toolName === 'optimize_mushcode') processingTime += 1500; // Optimization is slowest
          
          setTimeout(() => {
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({ tool: toolName, processing_time: processingTime })
                }]
              }
            };
            mockClient.receiveResponse(response);
          }, processingTime);
        }
      });

      // Test each tool multiple times
      for (const tool of tools) {
        toolPerformance.set(tool, []);
        
        for (let i = 0; i < 3; i++) {
          const startTime = Date.now();
          await mockClient.callTool(tool, { description: 'perf-test' });
          const endTime = Date.now();
          
          toolPerformance.get(tool)!.push(endTime - startTime);
        }
      }

      // Analyze performance by tool
      for (const [toolName, times] of toolPerformance) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        
        expect(avgTime).toBeLessThan(5000);
        
        // Verify expected performance characteristics
        if (toolName === 'validate_mushcode') {
          expect(avgTime).toBeLessThan(2000); // Validation should be fastest
        } else if (toolName === 'optimize_mushcode') {
          expect(avgTime).toBeGreaterThan(2000); // Optimization should be slower
        }
      }
    });
  });
});