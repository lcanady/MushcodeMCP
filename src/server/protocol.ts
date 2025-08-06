import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolRequest,
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import { MushcodeToolRegistry } from './registry.js';
import { 
  ProtocolError, 
  ToolExecutionError, 
  ToolNotFoundError,
  handleError,
  validateToolParameters 
} from '../utils/errors.js';
import { ConfigManager } from '../config/index.js';

export class MushcodeProtocolHandler {
  private server: Server;
  private registry: MushcodeToolRegistry;
  private configManager: ConfigManager;
  private isRunning: boolean = false;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    this.registry = new MushcodeToolRegistry();
    
    const config = configManager.getConfig();
    this.server = new Server(
      {
        name: config.server.name,
        version: config.server.version,
      },
      {
        capabilities: {
          tools: {
            listChanged: false, // We don't support dynamic tool changes yet
          },
        },
      }
    );

    this.setupHandlers();
    // Note: registerDefaultTools is async, so we'll call it in start()
  }

  private setupHandlers(): void {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        const tools = this.registry.getTools();
        return {
          tools,
        };
      } catch (error) {
        throw handleError(error);
      }
    });

    // Handle tool calls with comprehensive error handling
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest): Promise<CallToolResult> => {
      try {
        const { name, arguments: args } = request.params;
        
        // Get tool from registry
        const tool = this.registry.getTool(name);
        if (!tool) {
          throw new ToolNotFoundError(name);
        }

        // Validate parameters against tool schema
        if (tool.inputSchema) {
          validateToolParameters(name, args, tool.inputSchema);
        }

        // Get tool handler
        const handler = this.registry.getToolHandler(name);
        if (!handler) {
          throw new ToolExecutionError(name, 'No handler registered for tool');
        }

        // Execute tool with error handling
        const result = await this.executeToolSafely(name, handler, args || {});
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        throw handleError(error);
      }
    });

    // Handle server errors
    this.server.onerror = (error) => {
      console.error('MCP Server error:', error);
    };
  }

  /**
   * Execute a tool handler with comprehensive error handling
   */
  private async executeToolSafely(
    toolName: string,
    handler: (args: Record<string, unknown>) => Promise<unknown>,
    args: Record<string, unknown>
  ): Promise<unknown> {
    try {
      return await handler(args);
    } catch (error) {
      if (error instanceof Error) {
        throw new ToolExecutionError(toolName, error.message, { originalError: error.message });
      }
      throw new ToolExecutionError(toolName, 'Unknown error during tool execution');
    }
  }

  /**
   * Register default MUSHCODE tools
   */
  public async registerDefaultTools(): Promise<void> {
    const config = this.configManager.getConfig();
    
    // Initialize knowledge base with configuration
    const { MushcodeKnowledgeBase } = await import('../knowledge/base.js');
    const { MushcodePopulator } = await import('../knowledge/populator.js');
    const { generateMushcodeTool, generateMushcodeHandler } = await import('../tools/generate.js');
    const { validateMushcodeTool, validateMushcodeHandler } = await import('../tools/validate.js');
    const { optimizeMushcodeTool, optimizeMushcodeHandler } = await import('../tools/optimize.js');
    const { explainMushcodeTool, explainMushcodeHandler } = await import('../tools/explain.js');
    const { getExamplesTool, getExamplesHandler } = await import('../tools/examples.js');
    const { formatMushcodeTool, formatMushcodeHandler } = await import('../tools/format.js');
    const { compressMushcodeTool, compressMushcodeHandler } = await import('../tools/compress.js');
    
    const knowledgeBase = new MushcodeKnowledgeBase();
    const populator = new MushcodePopulator(knowledgeBase);
    await populator.populateFromMushcodeCom();
    
    // Register tools based on configuration
    const toolsConfig = config.tools;
    const enabledTools = toolsConfig.enabled.filter(tool => !toolsConfig.disabled.includes(tool));
    
    if (enabledTools.includes('generate_mushcode')) {
      this.registry.registerTool(generateMushcodeTool);
      this.registry.registerToolHandler('generate_mushcode', async (args) => {
        return await generateMushcodeHandler(args, knowledgeBase);
      });
    }
    
    if (enabledTools.includes('validate_mushcode')) {
      this.registry.registerTool(validateMushcodeTool);
      this.registry.registerToolHandler('validate_mushcode', async (args) => {
        return await validateMushcodeHandler(args, knowledgeBase);
      });
    }
    
    if (enabledTools.includes('optimize_mushcode')) {
      this.registry.registerTool(optimizeMushcodeTool);
      this.registry.registerToolHandler('optimize_mushcode', async (args) => {
        return await optimizeMushcodeHandler(args, knowledgeBase);
      });
    }
    
    if (enabledTools.includes('explain_mushcode')) {
      this.registry.registerTool(explainMushcodeTool);
      this.registry.registerToolHandler('explain_mushcode', async (args) => {
        return await explainMushcodeHandler(args, knowledgeBase);
      });
    }
    
    if (enabledTools.includes('get_examples')) {
      this.registry.registerTool(getExamplesTool);
      this.registry.registerToolHandler('get_examples', async (args) => {
        return await getExamplesHandler(args, knowledgeBase);
      });
    }
    
    if (enabledTools.includes('format_mushcode')) {
      this.registry.registerTool(formatMushcodeTool);
      this.registry.registerToolHandler('format_mushcode', async (args) => {
        return await formatMushcodeHandler(args, knowledgeBase);
      });
    }
    
    if (enabledTools.includes('compress_mushcode')) {
      this.registry.registerTool(compressMushcodeTool);
      this.registry.registerToolHandler('compress_mushcode', async (args) => {
        return await compressMushcodeHandler(args, knowledgeBase);
      });
    }
  }

  /**
   * Get the tool registry instance
   */
  getRegistry(): MushcodeToolRegistry {
    return this.registry;
  }

  /**
   * Check if the server is currently running
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new ProtocolError('Server is already running');
    }

    try {
      // Register tools before starting
      await this.registerDefaultTools();
      
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      this.isRunning = true;
    } catch (error) {
      throw new ProtocolError('Failed to start server', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      await this.server.close();
      this.isRunning = false;
    } catch (error) {
      throw new ProtocolError('Failed to stop server', { error: error instanceof Error ? error.message : String(error) });
    }
  }
}