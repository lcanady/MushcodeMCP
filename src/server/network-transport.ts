import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import cors from 'cors';
import { MushcodeProtocolHandler } from './protocol.js';
import { ConfigManager } from '../config/index.js';

export class NetworkMCPServer {
  private app: express.Application;
  private server: any;
  private protocolHandler: MushcodeProtocolHandler;
  private configManager: ConfigManager;
  private port: number;

  constructor(configManager: ConfigManager, port: number = 3001) {
    this.configManager = configManager;
    this.port = port;
    this.app = express();
    this.protocolHandler = new MushcodeProtocolHandler(configManager);
    this.setupExpress();
  }

  private setupExpress(): void {
    // Enable CORS for cross-origin requests
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-API-Key'],
    }));

    // Parse JSON bodies
    this.app.use(express.json({ limit: '10mb' }));

    // Basic API key authentication middleware (if API_KEY is set)
    if (process.env.API_KEY) {
      this.app.use('/api', (req, res, next) => {
        const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
        
        if (!apiKey || apiKey !== process.env.API_KEY) {
          return res.status(401).json({
            success: false,
            error: 'Invalid or missing API key',
            timestamp: new Date().toISOString()
          });
        }
        
        next();
      });
    }

    // Rate limiting middleware (basic implementation)
    if (process.env.ENABLE_RATE_LIMITING === 'true') {
      const rateLimitMap = new Map();
      const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
      const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

      this.app.use('/api', (req, res, next) => {
        const clientId = req.ip || 'unknown';
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean old entries
        if (rateLimitMap.has(clientId)) {
          const requests = rateLimitMap.get(clientId).filter((time: number) => time > windowStart);
          rateLimitMap.set(clientId, requests);
        }

        const requests = rateLimitMap.get(clientId) || [];
        
        if (requests.length >= maxRequests) {
          return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil((requests[0] + windowMs - now) / 1000),
            timestamp: new Date().toISOString()
          });
        }

        requests.push(now);
        rateLimitMap.set(clientId, requests);
        next();
      });
    }

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        server: this.configManager.getConfig().server.name,
        version: this.configManager.getConfig().server.version,
        timestamp: new Date().toISOString()
      });
    });

    // MCP over Server-Sent Events endpoint
    this.app.get('/sse', async (req, res) => {
      const transport = new SSEServerTransport('/sse', res);
      
      // Create a new server instance for this connection
      const config = this.configManager.getConfig();
      const server = new Server(
        {
          name: config.server.name,
          version: config.server.version,
        },
        {
          capabilities: {
            tools: {
              listChanged: false,
            },
          },
        }
      );

      // Set up the same handlers as the protocol handler
      await this.setupMCPHandlers(server);
      
      try {
        await server.connect(transport);
        console.log('New SSE MCP connection established');
      } catch (error) {
        console.error('Failed to establish SSE MCP connection:', error);
        res.status(500).json({ error: 'Failed to establish MCP connection' });
      }
    });

    // REST API endpoint for direct tool calls (alternative to MCP)
    this.app.post('/api/tools/:toolName', async (req, res) => {
      try {
        const { toolName } = req.params;
        const { arguments: args } = req.body;

        // Get the registry from protocol handler
        const registry = this.protocolHandler.getRegistry();
        const result = await registry.executeTool(toolName, args || {});

        res.json({
          success: true,
          result: result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Tool execution error:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });

    // List available tools
    this.app.get('/api/tools', async (req, res) => {
      try {
        const registry = this.protocolHandler.getRegistry();
        const tools = registry.listTools();
        
        res.json({
          success: true,
          tools: tools,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to list tools:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  private async setupMCPHandlers(server: Server): Promise<void> {
    // Import the same handler setup logic from the protocol handler
    // This is a simplified version - in practice, you'd want to extract
    // the handler setup into a shared utility
    const registry = this.protocolHandler.getRegistry();
    
    server.setRequestHandler('tools/list', async () => {
      return { tools: registry.listTools() };
    });

    server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;
      const result = await registry.executeTool(name, args || {});
      return result;
    });
  }

  async start(): Promise<void> {
    // Initialize the protocol handler first
    await this.protocolHandler.registerDefaultTools();

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`Network MCP Server running on port ${this.port}`);
        console.log(`Health check: http://localhost:${this.port}/health`);
        console.log(`MCP over SSE: http://localhost:${this.port}/sse`);
        console.log(`REST API: http://localhost:${this.port}/api/tools`);
        resolve();
      });

      this.server.on('error', (error: Error) => {
        reject(error);
      });
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('Network MCP Server stopped');
          resolve();
        });
      });
    }
  }
}