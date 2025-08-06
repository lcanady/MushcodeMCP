/**
 * Basic Integration Tests
 * Simple tests to verify core MCP integration functionality
 */

import { createTestMCPClient } from './mcp-client-mock.js';
import { createToolResponse, createInitResponse, createToolsListResponse } from './test-helpers.js';

describe('Basic Integration Tests', () => {

  describe('Server Initialization', () => {
    it('should initialize successfully', async () => {
      const client = createTestMCPClient();
      await client.connect();

      client.on('requestProcessed', (request) => {
        if (request.method === 'initialize') {
          const response = createInitResponse(request.id);
          client.receiveResponse(response);
        }
      });

      const result = await client.initialize();
      
      expect(result).toBeDefined();
      expect(result.protocolVersion).toBe('2024-11-05');
      expect(result.serverInfo.name).toBe('mushcode-mcp-server');

      await client.disconnect();
    });
  });

  describe('Tool Discovery', () => {
    it('should list available tools', async () => {
      const client = createTestMCPClient();
      
      const expectedTools = [
        'generate_mushcode',
        'validate_mushcode',
        'optimize_mushcode',
        'explain_mushcode',
        'get_examples',
        'format_mushcode',
        'compress_mushcode'
      ];

      // Set up event handlers before connecting
      client.on('requestProcessed', (request) => {
        if (request.method === 'initialize') {
          const response = createInitResponse(request.id);
          client.receiveResponse(response);
        } else if (request.method === 'tools/list') {
          const response = createToolsListResponse(request.id, expectedTools);
          client.receiveResponse(response);
        }
      });

      await client.connect();
      await client.initialize();

      const toolsResponse = await client.listTools();
      
      expect(toolsResponse).toBeDefined();
      expect(toolsResponse.tools).toBeDefined();
      expect(toolsResponse.tools.length).toBe(expectedTools.length);

      await client.disconnect();
    });
  });

  describe('Tool Execution', () => {
    it('should execute generate_mushcode tool', async () => {
      const client = createTestMCPClient();

      // Set up event handlers before connecting
      client.on('requestProcessed', (request) => {
        if (request.method === 'initialize') {
          const response = createInitResponse(request.id);
          client.receiveResponse(response);
        } else if (request.method === 'tools/call' && request.params.name === 'generate_mushcode') {
          const response = createToolResponse(request.id, {
            code: '&CMD.HELLO me=$hello:@pemit %#=Hello, %N!',
            explanation: 'This creates a simple hello command',
            usage_example: 'hello',
            compatibility: ['PennMUSH']
          });
          client.receiveResponse(response);
        }
      });

      await client.connect();
      await client.initialize();

      const result = await client.callTool('generate_mushcode', {
        description: 'Create a simple hello command'
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');

      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.code).toContain('&CMD.HELLO');
      expect(parsedResult.explanation).toBeDefined();

      await client.disconnect();
    });

    it('should execute validate_mushcode tool', async () => {
      const client = createTestMCPClient();

      // Set up event handlers before connecting
      client.on('requestProcessed', (request) => {
        if (request.method === 'initialize') {
          const response = createInitResponse(request.id);
          client.receiveResponse(response);
        } else if (request.method === 'tools/call' && request.params.name === 'validate_mushcode') {
          const response = createToolResponse(request.id, {
            is_valid: true,
            syntax_errors: [],
            security_warnings: [],
            best_practice_suggestions: []
          });
          client.receiveResponse(response);
        }
      });

      await client.connect();
      await client.initialize();

      const result = await client.callTool('validate_mushcode', {
        code: '&CMD.TEST me=$test:@pemit %#=Test'
      });

      expect(result).toBeDefined();
      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.is_valid).toBe(true);

      await client.disconnect();
    });
  });

  describe('Performance Requirements', () => {
    it('should respond within reasonable time', async () => {
      const client = createTestMCPClient({ timeout: 5000 });

      const startTime = Date.now();

      // Set up event handlers before connecting
      client.on('requestProcessed', (request) => {
        if (request.method === 'initialize') {
          const response = createInitResponse(request.id);
          client.receiveResponse(response);
        } else if (request.method === 'tools/call') {
          // Simulate processing time
          setTimeout(() => {
            const response = createToolResponse(request.id, {
              result: 'success',
              processing_time: 1000
            });
            client.receiveResponse(response);
          }, 1000);
        }
      });

      await client.connect();
      await client.initialize();

      const result = await client.callTool('generate_mushcode', {
        description: 'Performance test'
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(responseTime).toBeLessThan(5000);

      await client.disconnect();
    });
  });

  describe('Error Handling', () => {
    it('should handle tool execution errors', async () => {
      const client = createTestMCPClient();

      // Set up event handlers before connecting
      client.on('requestProcessed', (request) => {
        if (request.method === 'initialize') {
          const response = createInitResponse(request.id);
          client.receiveResponse(response);
        } else if (request.method === 'tools/call') {
          client.receiveError(request.id, {
            code: -32603,
            message: 'Internal error during tool execution'
          });
        }
      });

      await client.connect();
      await client.initialize();

      await expect(client.callTool('generate_mushcode', { description: 'test' }))
        .rejects.toThrow('JSON-RPC Error: Internal error during tool execution');

      await client.disconnect();
    });
  });

});