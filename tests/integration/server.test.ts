import { MushcodeProtocolHandler } from '../../src/server/protocol';

describe('MushcodeProtocolHandler Integration', () => {
  let handler: MushcodeProtocolHandler;

  beforeEach(() => {
    handler = new MushcodeProtocolHandler();
  });

  afterEach(async () => {
    if (handler.isServerRunning()) {
      await handler.stop();
    }
  });

  it('should initialize with default tools', () => {
    const registry = handler.getRegistry();
    const tools = registry.getTools();
    
    expect(tools.length).toBeGreaterThan(0);
    
    const toolNames = tools.map(tool => tool.name);
    expect(toolNames).toContain('generate_mushcode');
    expect(toolNames).toContain('validate_mushcode');
    expect(toolNames).toContain('optimize_mushcode');
    expect(toolNames).toContain('explain_mushcode');
    expect(toolNames).toContain('get_examples');
    expect(toolNames).toContain('format_mushcode');
    expect(toolNames).toContain('compress_mushcode');
  });

  it('should have handlers for all registered tools', () => {
    const registry = handler.getRegistry();
    const validationErrors = registry.validateRegistry();
    
    expect(validationErrors).toHaveLength(0);
  });

  it('should register tools with proper schemas', () => {
    const registry = handler.getRegistry();
    const generateTool = registry.getTool('generate_mushcode');
    
    expect(generateTool).toBeDefined();
    expect(generateTool?.name).toBe('generate_mushcode');
    expect(generateTool?.description).toContain('Generate MUSHCODE');
    expect(generateTool?.inputSchema).toBeDefined();
    expect(generateTool?.inputSchema?.type).toBe('object');
  });

  it('should have placeholder handlers that return not_implemented status', async () => {
    const registry = handler.getRegistry();
    const handler_fn = registry.getToolHandler('generate_mushcode');
    
    expect(handler_fn).toBeDefined();
    
    const result = await handler_fn!({ description: 'test' });
    expect(result).toHaveProperty('status', 'not_implemented');
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('received_args');
  });

  it('should track server running state', () => {
    expect(handler.isServerRunning()).toBe(false);
  });

  it('should provide access to registry', () => {
    const registry = handler.getRegistry();
    expect(registry).toBeDefined();
    expect(typeof registry.registerTool).toBe('function');
    expect(typeof registry.registerToolHandler).toBe('function');
    expect(typeof registry.getTools).toBe('function');
  });
});