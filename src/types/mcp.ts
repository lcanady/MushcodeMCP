import { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface MCPCapabilities {
  tools?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
}

export interface MCPServerInfo {
  name: string;
  version: string;
  capabilities: MCPCapabilities;
}

/**
 * Tool handler function type
 */
export type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

/**
 * Tool registry interface
 */
export interface ToolRegistry {
  registerTool(tool: Tool): void;
  registerToolHandler(name: string, handler: ToolHandler): void;
  getTools(): Tool[];
  getTool(name: string): Tool | undefined;
  getToolHandler(name: string): ToolHandler | undefined;
  hasTool(name: string): boolean;
  hasToolHandler(name: string): boolean;
  clear(): void;
}

/**
 * MCP request context for tool execution
 */
export interface MCPRequestContext {
  requestId?: string;
  timestamp: Date;
  toolName: string;
  parameters: Record<string, unknown>;
}

/**
 * MCP response wrapper
 */
export interface MCPResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    executionTime?: number;
    toolVersion?: string;
    serverVersion?: string;
  };
}