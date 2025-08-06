import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ToolRegistry, ToolHandler } from '../types/mcp.js';
import { ValidationError } from '../utils/errors.js';

export class MushcodeToolRegistry implements ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private handlers: Map<string, ToolHandler> = new Map();

  /**
   * Register a tool definition
   */
  registerTool(tool: Tool): void {
    if (!tool.name || typeof tool.name !== 'string') {
      throw new ValidationError('Tool name is required and must be a string');
    }
    
    if (!tool.description || typeof tool.description !== 'string') {
      throw new ValidationError('Tool description is required and must be a string');
    }

    this.tools.set(tool.name, tool);
  }

  /**
   * Register a tool handler function
   */
  registerToolHandler(name: string, handler: ToolHandler): void {
    if (!name || typeof name !== 'string') {
      throw new ValidationError('Tool name is required and must be a string');
    }
    
    if (typeof handler !== 'function') {
      throw new ValidationError('Tool handler must be a function');
    }

    this.handlers.set(name, handler);
  }

  /**
   * Get all registered tools
   */
  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get a specific tool by name
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get a tool handler by name
   */
  getToolHandler(name: string): ToolHandler | undefined {
    return this.handlers.get(name);
  }

  /**
   * Check if a tool is registered
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Check if a tool handler is registered
   */
  hasToolHandler(name: string): boolean {
    return this.handlers.has(name);
  }

  /**
   * Get the names of all registered tools
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get the count of registered tools
   */
  getToolCount(): number {
    return this.tools.size;
  }

  /**
   * Unregister a tool and its handler
   */
  unregisterTool(name: string): boolean {
    const toolRemoved = this.tools.delete(name);
    const handlerRemoved = this.handlers.delete(name);
    return toolRemoved || handlerRemoved;
  }

  /**
   * Clear all tools and handlers
   */
  clear(): void {
    this.tools.clear();
    this.handlers.clear();
  }

  /**
   * Validate that all registered tools have corresponding handlers
   */
  validateRegistry(): string[] {
    const errors: string[] = [];
    
    for (const toolName of this.tools.keys()) {
      if (!this.handlers.has(toolName)) {
        errors.push(`Tool '${toolName}' has no registered handler`);
      }
    }
    
    for (const handlerName of this.handlers.keys()) {
      if (!this.tools.has(handlerName)) {
        errors.push(`Handler '${handlerName}' has no corresponding tool definition`);
      }
    }
    
    return errors;
  }
}