import { MushcodeProtocolHandler } from '../../../src/server/protocol';
import { MushcodeToolRegistry } from '../../../src/server/registry';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { 
  ProtocolError
} from '../../../src/utils/errors';

// Mock the MCP SDK
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');

describe('MushcodeProtocolHandler', () => {
  let protocolHandler: MushcodeProtocolHandler;
  let mockServer: any;
  let mockTransport: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock server
    mockServer = {
      setRequestHandler: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      onerror: null,
    };
    
    // Mock transport
    mockTransport = {};
    
    // Mock the Server constructor
    const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
    Server.mockImplementation(() => mockServer);
    
    // Mock the transport constructor
    const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
    StdioServerTransport.mockImplementation(() => mockTransport);
    
    protocolHandler = new MushcodeProtocolHandler();
  });

  describe('constructor', () => {
    it('should initialize with correct server configuration', () => {
      const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
      
      expect(Server).toHaveBeenCalledWith(
        {
          name: 'mushcode-mcp-server',
          version: '1.0.0',
        },
        {
          capabilities: {
            tools: {
              listChanged: false,
            },
          },
        }
      );
    });

    it('should set up request handlers', () => {
      expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(2);
    });

    it('should register default tools', () => {
      const registry = protocolHandler.getRegistry();
      const tools = registry.getTools();
      
      expect(tools.length).toBeGreaterThan(0);
      expect(tools.some(tool => tool.name === 'generate_mushcode')).toBe(true);
      expect(tools.some(tool => tool.name === 'validate_mushcode')).toBe(true);
    });
  });

  describe('tool listing', () => {
    it('should handle list tools request', async () => {
      const registry = protocolHandler.getRegistry();
      const mockTool: Tool = {
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      };
      
      registry.registerTool(mockTool);
      
      // Get the handler that was registered
      const listToolsHandler = mockServer.setRequestHandler.mock.calls
        .find((call: any) => call[0].method === 'tools/list')[1];
      
      const result = await listToolsHandler();
      
      expect(result).toHaveProperty('tools');
      expect(Array.isArray(result.tools)).toBe(true);
      expect(result.tools.some((tool: Tool) => tool.name === 'test_tool')).toBe(true);
    });

    it('should handle errors in tool listing', async () => {
      // Mock registry to throw error
      const registry = protocolHandler.getRegistry();
      jest.spyOn(registry, 'getTools').mockImplementation(() => {
        throw new Error('Registry error');
      });
      
      const listToolsHandler = mockServer.setRequestHandler.mock.calls
        .find((call: any) => call[0].method === 'tools/list')[1];
      
      await expect(listToolsHandler()).rejects.toThrow();
    });
  });

  describe('tool execution', () => {
    let callToolHandler: any;

    beforeEach(() => {
      // Get the call tool handler
      callToolHandler = mockServer.setRequestHandler.mock.calls
        .find((call: any) => call[0].method === 'tools/call')[1];
    });

    it('should execute a tool successfully', async () => {
      const registry = protocolHandler.getRegistry();
      const mockTool: Tool = {
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: {
          type: 'object',
          properties: {
            input: { type: 'string' },
          },
          required: ['input'],
        },
      };
      
      registry.registerTool(mockTool);
      registry.registerToolHandler('test_tool', async (args) => {
        return { result: `Processed: ${args['input']}` };
      });
      
      const request = {
        params: {
          name: 'test_tool',
          arguments: { input: 'test input' },
        },
      };
      
      const result = await callToolHandler(request);
      
      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content[0]).toHaveProperty('type', 'text');
      
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData).toHaveProperty('result', 'Processed: test input');
    });

    it('should handle tool not found error', async () => {
      const request = {
        params: {
          name: 'nonexistent_tool',
          arguments: {},
        },
      };
      
      await expect(callToolHandler(request)).rejects.toThrow();
    });

    it('should handle validation errors', async () => {
      const registry = protocolHandler.getRegistry();
      const mockTool: Tool = {
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: {
          type: 'object',
          properties: {
            required_param: { type: 'string' },
          },
          required: ['required_param'],
        },
      };
      
      registry.registerTool(mockTool);
      registry.registerToolHandler('test_tool', async () => ({ success: true }));
      
      const request = {
        params: {
          name: 'test_tool',
          arguments: {}, // Missing required parameter
        },
      };
      
      await expect(callToolHandler(request)).rejects.toThrow();
    });

    it('should handle tool execution errors', async () => {
      const registry = protocolHandler.getRegistry();
      const mockTool: Tool = {
        name: 'error_tool',
        description: 'A tool that throws errors',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      };
      
      registry.registerTool(mockTool);
      registry.registerToolHandler('error_tool', async () => {
        throw new Error('Tool execution failed');
      });
      
      const request = {
        params: {
          name: 'error_tool',
          arguments: {},
        },
      };
      
      await expect(callToolHandler(request)).rejects.toThrow();
    });

    it('should handle missing tool handler', async () => {
      const registry = protocolHandler.getRegistry();
      const mockTool: Tool = {
        name: 'no_handler_tool',
        description: 'A tool without handler',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      };
      
      registry.registerTool(mockTool);
      // Don't register handler
      
      const request = {
        params: {
          name: 'no_handler_tool',
          arguments: {},
        },
      };
      
      await expect(callToolHandler(request)).rejects.toThrow();
    });
  });

  describe('server lifecycle', () => {
    it('should start server successfully', async () => {
      expect(protocolHandler.isServerRunning()).toBe(false);
      
      await protocolHandler.start();
      
      expect(mockServer.connect).toHaveBeenCalledWith(mockTransport);
      expect(protocolHandler.isServerRunning()).toBe(true);
    });

    it('should handle start errors', async () => {
      mockServer.connect.mockRejectedValue(new Error('Connection failed'));
      
      await expect(protocolHandler.start()).rejects.toThrow(ProtocolError);
      expect(protocolHandler.isServerRunning()).toBe(false);
    });

    it('should prevent starting already running server', async () => {
      await protocolHandler.start();
      
      await expect(protocolHandler.start()).rejects.toThrow(ProtocolError);
    });

    it('should stop server successfully', async () => {
      await protocolHandler.start();
      expect(protocolHandler.isServerRunning()).toBe(true);
      
      await protocolHandler.stop();
      
      expect(mockServer.close).toHaveBeenCalled();
      expect(protocolHandler.isServerRunning()).toBe(false);
    });

    it('should handle stop when not running', async () => {
      expect(protocolHandler.isServerRunning()).toBe(false);
      
      await expect(protocolHandler.stop()).resolves.not.toThrow();
      expect(mockServer.close).not.toHaveBeenCalled();
    });

    it('should handle stop errors', async () => {
      await protocolHandler.start();
      mockServer.close.mockRejectedValue(new Error('Close failed'));
      
      await expect(protocolHandler.stop()).rejects.toThrow(ProtocolError);
    });
  });

  describe('default tools registration', () => {
    it('should register all expected default tools', () => {
      const registry = protocolHandler.getRegistry();
      const tools = registry.getTools();
      const toolNames = tools.map(tool => tool.name);
      
      const expectedTools = [
        'generate_mushcode',
        'validate_mushcode',
        'optimize_mushcode',
        'explain_mushcode',
        'get_examples',
        'format_mushcode',
        'compress_mushcode',
      ];
      
      for (const expectedTool of expectedTools) {
        expect(toolNames).toContain(expectedTool);
        expect(registry.hasToolHandler(expectedTool)).toBe(true);
      }
    });

    it('should have proper tool schemas', () => {
      const registry = protocolHandler.getRegistry();
      const generateTool = registry.getTool('generate_mushcode');
      
      expect(generateTool).toBeDefined();
      expect(generateTool?.inputSchema).toBeDefined();
      expect(generateTool?.inputSchema.properties).toHaveProperty('description');
      expect((generateTool?.inputSchema as any)?.required).toContain('description');
    });

    it('should execute placeholder handlers', async () => {
      const registry = protocolHandler.getRegistry();
      const handler = registry.getToolHandler('generate_mushcode');
      
      expect(handler).toBeDefined();
      
      const result = await handler!({ description: 'test' });
      expect(result).toHaveProperty('status', 'not_implemented');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('received_args');
    });
  });

  describe('registry access', () => {
    it('should provide access to registry', () => {
      const registry = protocolHandler.getRegistry();
      expect(registry).toBeInstanceOf(MushcodeToolRegistry);
    });
  });
});