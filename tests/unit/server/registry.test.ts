import { MushcodeToolRegistry } from '../../../src/server/registry';
import { ValidationError } from '../../../src/utils/errors';

// Mock Tool interface to avoid MCP SDK import issues in tests
interface MockTool {
  name: string;
  description: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

describe('MushcodeToolRegistry', () => {
  let registry: MushcodeToolRegistry;

  beforeEach(() => {
    registry = new MushcodeToolRegistry();
  });

  describe('tool registration', () => {
    it('should register and retrieve tools', () => {
      const mockTool: MockTool = {
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      };

      registry.registerTool(mockTool as any);
      
      expect(registry.getTool('test_tool')).toEqual(mockTool);
      expect(registry.getTools()).toHaveLength(1);
      expect(registry.hasTool('test_tool')).toBe(true);
    });

    it('should validate tool name during registration', () => {
      const invalidTool = {
        name: '',
        description: 'A test tool',
        inputSchema: { type: 'object', properties: {} },
      };

      expect(() => registry.registerTool(invalidTool as any)).toThrow(ValidationError);
    });

    it('should validate tool description during registration', () => {
      const invalidTool = {
        name: 'test_tool',
        description: '',
        inputSchema: { type: 'object', properties: {} },
      };

      expect(() => registry.registerTool(invalidTool as any)).toThrow(ValidationError);
    });

    it('should return undefined for non-existent tools', () => {
      expect(registry.getTool('non_existent')).toBeUndefined();
      expect(registry.hasTool('non_existent')).toBe(false);
    });
  });

  describe('tool handler registration', () => {
    it('should register and retrieve tool handlers', () => {
      const mockHandler = jest.fn().mockResolvedValue({ success: true });
      
      registry.registerToolHandler('test_tool', mockHandler);
      
      expect(registry.getToolHandler('test_tool')).toBe(mockHandler);
      expect(registry.hasToolHandler('test_tool')).toBe(true);
    });

    it('should validate handler name during registration', () => {
      const mockHandler = jest.fn();
      
      expect(() => registry.registerToolHandler('', mockHandler)).toThrow(ValidationError);
    });

    it('should validate handler function during registration', () => {
      expect(() => registry.registerToolHandler('test_tool', 'not a function' as any)).toThrow(ValidationError);
    });

    it('should return undefined for non-existent handlers', () => {
      expect(registry.getToolHandler('non_existent')).toBeUndefined();
      expect(registry.hasToolHandler('non_existent')).toBe(false);
    });
  });

  describe('registry management', () => {
    beforeEach(() => {
      const mockTool: MockTool = {
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: { type: 'object', properties: {} },
      };
      const mockHandler = jest.fn().mockResolvedValue({ success: true });
      
      registry.registerTool(mockTool as any);
      registry.registerToolHandler('test_tool', mockHandler);
    });

    it('should get tool names', () => {
      const names = registry.getToolNames();
      expect(names).toContain('test_tool');
      expect(names).toHaveLength(1);
    });

    it('should get tool count', () => {
      expect(registry.getToolCount()).toBe(1);
    });

    it('should unregister tools and handlers', () => {
      expect(registry.unregisterTool('test_tool')).toBe(true);
      expect(registry.hasTool('test_tool')).toBe(false);
      expect(registry.hasToolHandler('test_tool')).toBe(false);
    });

    it('should return false when unregistering non-existent tool', () => {
      expect(registry.unregisterTool('non_existent')).toBe(false);
    });

    it('should clear all tools and handlers', () => {
      expect(registry.getTools()).toHaveLength(1);
      expect(registry.hasToolHandler('test_tool')).toBe(true);
      
      registry.clear();
      
      expect(registry.getTools()).toHaveLength(0);
      expect(registry.hasToolHandler('test_tool')).toBe(false);
    });
  });

  describe('registry validation', () => {
    it('should validate complete registry (tools with handlers)', () => {
      const mockTool: MockTool = {
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: { type: 'object', properties: {} },
      };
      const mockHandler = jest.fn().mockResolvedValue({ success: true });
      
      registry.registerTool(mockTool as any);
      registry.registerToolHandler('test_tool', mockHandler);
      
      const errors = registry.validateRegistry();
      expect(errors).toHaveLength(0);
    });

    it('should detect tools without handlers', () => {
      const mockTool: MockTool = {
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: { type: 'object', properties: {} },
      };
      
      registry.registerTool(mockTool as any);
      // Don't register handler
      
      const errors = registry.validateRegistry();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('test_tool');
      expect(errors[0]).toContain('no registered handler');
    });

    it('should detect handlers without tools', () => {
      const mockHandler = jest.fn().mockResolvedValue({ success: true });
      
      registry.registerToolHandler('test_tool', mockHandler);
      // Don't register tool
      
      const errors = registry.validateRegistry();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('test_tool');
      expect(errors[0]).toContain('no corresponding tool definition');
    });

    it('should detect multiple validation issues', () => {
      const mockTool: MockTool = {
        name: 'tool_without_handler',
        description: 'A test tool',
        inputSchema: { type: 'object', properties: {} },
      };
      const mockHandler = jest.fn().mockResolvedValue({ success: true });
      
      registry.registerTool(mockTool as any);
      registry.registerToolHandler('handler_without_tool', mockHandler);
      
      const errors = registry.validateRegistry();
      expect(errors).toHaveLength(2);
    });
  });
});