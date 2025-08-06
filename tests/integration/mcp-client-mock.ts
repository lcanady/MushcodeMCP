/**
 * Mock MCP client for testing MCP protocol integration
 */

import { EventEmitter } from 'events';
// Using any types to avoid MCP SDK import issues in tests

export interface MockMCPClientOptions {
  timeout?: number;
  simulateNetworkDelay?: boolean;
  networkDelayMs?: number;
  simulateErrors?: boolean;
  errorRate?: number;
}

export class MockMCPClient extends EventEmitter {
  private requestId = 1;
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeout: NodeJS.Timeout;
  }>();
  private options: Required<MockMCPClientOptions>;
  private connected = false;
  private initialized = false;

  constructor(options: MockMCPClientOptions = {}) {
    super();
    this.options = {
      timeout: options.timeout ?? 30000,
      simulateNetworkDelay: options.simulateNetworkDelay ?? false,
      networkDelayMs: options.networkDelayMs ?? 100,
      simulateErrors: options.simulateErrors ?? false,
      errorRate: options.errorRate ?? 0.1,
    };
  }

  /**
   * Connect to the MCP server (simulated)
   */
  async connect(): Promise<void> {
    if (this.connected) {
      throw new Error('Client is already connected');
    }

    await this.simulateDelay();
    this.connected = true;
    this.emit('connected');
  }

  /**
   * Initialize the MCP session
   */
  async initialize(): Promise<any> {
    if (!this.connected) {
      throw new Error('Client must be connected before initialization');
    }

    const request: any = {
      jsonrpc: '2.0',
      id: this.getNextRequestId(),
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
        clientInfo: {
          name: 'mock-mcp-client',
          version: '1.0.0',
        },
      },
    };

    const response = await this.sendRequest(request);
    this.initialized = true;
    
    // Send initialized notification
    await this.sendNotification({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {},
    });

    return response;
  }

  /**
   * List available tools
   */
  async listTools(): Promise<any> {
    this.ensureInitialized();

    const request: any = {
      jsonrpc: '2.0',
      id: this.getNextRequestId(),
      method: 'tools/list',
      params: {},
    };

    return await this.sendRequest(request);
  }

  /**
   * Call a tool
   */
  async callTool(name: string, args: Record<string, unknown> = {}): Promise<any> {
    this.ensureInitialized();

    const request: any = {
      jsonrpc: '2.0',
      id: this.getNextRequestId(),
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    };

    return await this.sendRequest(request);
  }

  /**
   * Send a raw JSON-RPC request
   */
  async sendRequest(request: any): Promise<any> {
    this.ensureConnected();

    if (this.options.simulateErrors && Math.random() < this.options.errorRate) {
      throw new Error(`Simulated network error for request ${request.id}`);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(request.id as number);
        reject(new Error(`Request ${request.id} timed out after ${this.options.timeout}ms`));
      }, this.options.timeout);

      this.pendingRequests.set(request.id as number, {
        resolve,
        reject,
        timeout,
      });

      // Simulate sending the request
      this.emit('request', request);

      // Simulate processing delay
      if (this.options.simulateNetworkDelay) {
        setTimeout(() => {
          this.processRequest(request);
        }, this.options.networkDelayMs);
      } else {
        this.processRequest(request);
      }
    });
  }

  /**
   * Send a notification (no response expected)
   */
  async sendNotification(notification: any): Promise<void> {
    this.ensureConnected();
    await this.simulateDelay();
    this.emit('notification', notification);
  }

  /**
   * Simulate receiving a response from the server
   */
  receiveResponse(response: any): void {
    const pending = this.pendingRequests.get(response.id as number);
    if (!pending) {
      this.emit('error', new Error(`Received response for unknown request ${response.id}`));
      return;
    }

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(response.id as number);

    if ('error' in response && response.error) {
      pending.reject(new Error(`JSON-RPC Error: ${response.error.message}`));
    } else {
      pending.resolve(response.result);
    }
  }

  /**
   * Simulate receiving an error response
   */
  receiveError(id: number, error: any): void {
    const pending = this.pendingRequests.get(id);
    if (!pending) {
      this.emit('error', new Error(`Received error for unknown request ${id}`));
      return;
    }

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(id);
    pending.reject(new Error(`JSON-RPC Error: ${error.message}`));
  }

  /**
   * Disconnect from the server
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    // Reject all pending requests
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Client disconnected'));
    }
    this.pendingRequests.clear();

    this.connected = false;
    this.initialized = false;
    this.emit('disconnected');
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Check if client is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    connected: boolean;
    initialized: boolean;
    pendingRequests: number;
    totalRequests: number;
  } {
    return {
      connected: this.connected,
      initialized: this.initialized,
      pendingRequests: this.pendingRequests.size,
      totalRequests: this.requestId - 1,
    };
  }

  private getNextRequestId(): number {
    return this.requestId++;
  }

  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('Client is not connected');
    }
  }

  private ensureInitialized(): void {
    this.ensureConnected();
    if (!this.initialized) {
      throw new Error('Client is not initialized');
    }
  }

  private async simulateDelay(): Promise<void> {
    if (this.options.simulateNetworkDelay) {
      await new Promise(resolve => setTimeout(resolve, this.options.networkDelayMs));
    }
  }

  private processRequest(request: any): void {
    // This would normally send the request to the server
    // For testing, we'll emit it so test code can handle it
    this.emit('requestProcessed', request);
  }
}

/**
 * Helper function to create a mock client with common test settings
 */
export function createTestMCPClient(options: MockMCPClientOptions = {}): MockMCPClient {
  return new MockMCPClient({
    timeout: 5000,
    simulateNetworkDelay: false,
    simulateErrors: false,
    ...options,
  });
}

/**
 * Helper function to create a mock client that simulates network conditions
 */
export function createRealisticMCPClient(options: MockMCPClientOptions = {}): MockMCPClient {
  return new MockMCPClient({
    timeout: 10000,
    simulateNetworkDelay: true,
    networkDelayMs: 50,
    simulateErrors: false,
    errorRate: 0.02, // 2% error rate
    ...options,
  });
}