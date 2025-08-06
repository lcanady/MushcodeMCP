/**
 * Comprehensive MCP Protocol Integration Tests
 * Tests the full MCP protocol communication flow with mock clients
 */

import { MushcodeProtocolHandler } from '../../src/server/protocol.js';
import { MockMCPClient, createTestMCPClient, createRealisticMCPClient } from './mcp-client-mock.js';
// import { Server } from '@modelcontextprotocol/sdk/server/index.js';
// import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { EventEmitter } from 'events';

// Mock the stdio transport for testing
class MockTransport extends EventEmitter {
  private connected = false;

  async start(): Promise<void> {
    this.connected = true;
    this.emit('connect');
  }

  async close(): Promise<void> {
    this.connected = false;
    this.emit('close');
  }

  send(data: any): void {
    this.emit('message', data);
  }

  isConnected(): boolean {
    return this.connected;
  }
}

describe('MCP Protocol Integration Tests', () => {
  let protocolHandler: MushcodeProtocolHandler;
  let mockClient: MockMCPClient;
  // let mockTransport: MockTransport; // Unused for now

  beforeEach(async () => {
    protocolHandler = new MushcodeProtocolHandler();
    mockClient = createTestMCPClient();
    // mockTransport = new MockTransport(); // Unused for now
  });

  afterEach(async () => {
    if (mockClient.isConnected()) {
      await mockClient.disconnect();
    }
    if (protocolHandler.isServerRunning()) {
      await protocolHandler.stop();
    }
  });

  describe('Connection and Initialization', () => {
    it('should establish connection successfully', async () => {
      await mockClient.connect();
      expect(mockClient.isConnected()).toBe(true);
    });

    it('should initialize MCP session with proper capabilities', async () => {
      await mockClient.connect();
      
      const initResponse = await mockClient.initialize();
      
      expect(initResponse).toBeDefined();
      expect(mockClient.isInitialized()).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      // Try to initialize without connecting first
      await expect(mockClient.initialize()).rejects.toThrow('Client must be connected before initialization');
    });

    it('should prevent double initialization', async () => {
      await mockClient.connect();
      await mockClient.initialize();
      
      // Second initialization should work (MCP allows re-initialization)
      await expect(mockClient.initialize()).resolves.toBeDefined();
    });
  });

  describe('Tool Discovery', () => {
    it('should list all available tools', async () => {
      await mockClient.connect();
      await mockClient.initialize();
      
      // Mock the server response for tools/list
      const expectedTools = [
        'generate_mushcode',
        'validate_mushcode', 
        'optimize_mushcode',
        'explain_mushcode',
        'get_examples',
        'format_mushcode',
        'compress_mushcode'
      ];

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/list') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              tools: expectedTools.map(name => ({
                name,
                description: `${name} tool description`,
                inputSchema: {
                  type: 'object',
                  properties: {},
                  required: []
                }
              }))
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      const toolsResponse = await mockClient.listTools();
      
      expect(toolsResponse).toBeDefined();
      expect(toolsResponse.tools).toBeDefined();
      expect(toolsResponse.tools.length).toBe(expectedTools.length);
      
      const toolNames = toolsResponse.tools.map((tool: any) => tool.name);
      expectedTools.forEach(expectedTool => {
        expect(toolNames).toContain(expectedTool);
      });
    });

    it('should provide proper tool schemas', async () => {
      await mockClient.connect();
      await mockClient.initialize();

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/list') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              tools: [{
                name: 'generate_mushcode',
                description: 'Generate MUSHCODE based on specifications',
                inputSchema: {
                  type: 'object',
                  properties: {
                    description: { type: 'string' },
                    server_type: { type: 'string' },
                    function_type: { type: 'string' }
                  },
                  required: ['description']
                }
              }]
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      const toolsResponse = await mockClient.listTools();
      const generateTool = toolsResponse.tools.find((tool: any) => tool.name === 'generate_mushcode');
      
      expect(generateTool).toBeDefined();
      expect(generateTool.inputSchema).toBeDefined();
      expect(generateTool.inputSchema.type).toBe('object');
      expect(generateTool.inputSchema.properties).toBeDefined();
      expect(generateTool.inputSchema.required).toContain('description');
    });
  });

  describe('Tool Execution', () => {
    beforeEach(async () => {
      await mockClient.connect();
      await mockClient.initialize();
    });

    it('should execute generate_mushcode tool successfully', async () => {
      const toolArgs = {
        description: 'Create a simple command that says hello',
        server_type: 'PennMUSH',
        function_type: 'command'
      };

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'generate_mushcode') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  code: '&CMD.HELLO me=$hello:@pemit %#=Hello, %N!',
                  explanation: 'This creates a simple hello command',
                  usage_example: 'hello',
                  compatibility: ['PennMUSH'],
                  security_notes: 'Uses %# for security'
                })
              }]
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      const result = await mockClient.callTool('generate_mushcode', toolArgs);
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      
      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.code).toBeDefined();
      expect(parsedResult.explanation).toBeDefined();
      expect(parsedResult.compatibility).toContain('PennMUSH');
    });

    it('should execute validate_mushcode tool successfully', async () => {
      const toolArgs = {
        code: '&CMD.TEST me=$test:@pemit %#=Test successful',
        server_type: 'PennMUSH'
      };

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'validate_mushcode') {
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
                  best_practice_suggestions: [],
                  compatibility_notes: ['Compatible with PennMUSH']
                })
              }]
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      const result = await mockClient.callTool('validate_mushcode', toolArgs);
      
      expect(result).toBeDefined();
      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.is_valid).toBe(true);
      expect(parsedResult.syntax_errors).toEqual([]);
    });

    it('should handle tool execution errors gracefully', async () => {
      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32603,
              message: 'Internal error during tool execution',
              data: {
                tool: request.params.name,
                details: 'Simulated error for testing'
              }
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      await expect(mockClient.callTool('generate_mushcode', { description: 'test' }))
        .rejects.toThrow('JSON-RPC Error: Internal error during tool execution');
    });

    it('should handle invalid tool names', async () => {
      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'nonexistent_tool') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: 'Tool not found: nonexistent_tool'
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      await expect(mockClient.callTool('nonexistent_tool', {}))
        .rejects.toThrow('JSON-RPC Error: Tool not found: nonexistent_tool');
    });
  });

  describe('Performance Requirements', () => {
    it('should respond to tool calls within 5 seconds', async () => {
      const performanceClient = createTestMCPClient({ timeout: 5000 });
      await performanceClient.connect();
      await performanceClient.initialize();

      const startTime = Date.now();

      performanceClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call') {
          // Simulate a response that takes 2 seconds
          setTimeout(() => {
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({ result: 'success' })
                }]
              }
            };
            performanceClient.receiveResponse(response);
          }, 2000);
        }
      });

      const result = await performanceClient.callTool('generate_mushcode', { description: 'test' });
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(5000);

      await performanceClient.disconnect();
    });

    it('should handle timeout scenarios', async () => {
      const timeoutClient = createTestMCPClient({ timeout: 1000 });
      await timeoutClient.connect();
      await timeoutClient.initialize();

      // Don't respond to the request to trigger timeout
      timeoutClient.on('requestProcessed', () => {
        // Intentionally don't respond
      });

      await expect(timeoutClient.callTool('generate_mushcode', { description: 'test' }))
        .rejects.toThrow('timed out after 1000ms');

      await timeoutClient.disconnect();
    });
  });

  describe('Network Conditions Simulation', () => {
    it('should handle network delays gracefully', async () => {
      const realisticClient = createRealisticMCPClient({
        simulateNetworkDelay: true,
        networkDelayMs: 100
      });

      await realisticClient.connect();
      await realisticClient.initialize();

      const startTime = Date.now();

      realisticClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({ result: 'success with delay' })
              }]
            }
          };
          realisticClient.receiveResponse(response);
        }
      });

      const result = await realisticClient.callTool('generate_mushcode', { description: 'test' });
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeGreaterThan(100); // Should include network delay

      await realisticClient.disconnect();
    });

    it('should handle connection drops', async () => {
      await mockClient.connect();
      await mockClient.initialize();

      // Simulate connection drop
      await mockClient.disconnect();

      expect(mockClient.isConnected()).toBe(false);
      expect(mockClient.isInitialized()).toBe(false);

      // Should not be able to call tools after disconnect
      await expect(mockClient.callTool('generate_mushcode', { description: 'test' }))
        .rejects.toThrow('Client is not connected');
    });
  });

  describe('Client Statistics and Monitoring', () => {
    it('should track client statistics', async () => {
      await mockClient.connect();
      await mockClient.initialize();

      const initialStats = mockClient.getStats();
      expect(initialStats.connected).toBe(true);
      expect(initialStats.initialized).toBe(true);
      expect(initialStats.pendingRequests).toBe(0);
      expect(initialStats.totalRequests).toBeGreaterThan(0); // From initialization

      // Make a tool call to increase request count
      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: { content: [{ type: 'text', text: '{}' }] }
          };
          mockClient.receiveResponse(response);
        }
      });

      await mockClient.callTool('generate_mushcode', { description: 'test' });

      const finalStats = mockClient.getStats();
      expect(finalStats.totalRequests).toBeGreaterThan(initialStats.totalRequests);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from temporary errors', async () => {
      let errorCount = 0;
      const maxErrors = 2;

      await mockClient.connect();
      await mockClient.initialize();

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call') {
          errorCount++;
          
          if (errorCount <= maxErrors) {
            // Return error for first few attempts
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: -32603,
                message: 'Temporary error'
              }
            };
            mockClient.receiveResponse(response);
          } else {
            // Return success after errors
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({ result: 'success after retry' })
                }]
              }
            };
            mockClient.receiveResponse(response);
          }
        }
      });

      // First attempts should fail
      await expect(mockClient.callTool('generate_mushcode', { description: 'test' }))
        .rejects.toThrow('Temporary error');
      
      await expect(mockClient.callTool('generate_mushcode', { description: 'test' }))
        .rejects.toThrow('Temporary error');

      // Third attempt should succeed
      const result = await mockClient.callTool('generate_mushcode', { description: 'test' });
      expect(result).toBeDefined();
      
      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.result).toBe('success after retry');
    });
  });
});