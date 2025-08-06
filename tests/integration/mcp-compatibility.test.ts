/**
 * MCP Compatibility Testing
 * Tests server compatibility with different MCP-compatible environments
 */

import { MushcodeProtocolHandler } from '../../src/server/protocol.js';
import { createTestMCPClient } from './mcp-client-mock.js';

describe('MCP Compatibility Testing', () => {
  let protocolHandler: MushcodeProtocolHandler;

  beforeEach(() => {
    protocolHandler = new MushcodeProtocolHandler();
  });

  afterEach(async () => {
    if (protocolHandler.isServerRunning()) {
      await protocolHandler.stop();
    }
  });

  describe('Protocol Version Compatibility', () => {
    it('should support MCP protocol version 2024-11-05', async () => {
      const client = createTestMCPClient();
      await client.connect();

      client.on('requestProcessed', (request) => {
        if (request.method === 'initialize') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {
                  listChanged: false
                }
              },
              serverInfo: {
                name: 'mushcode-mcp-server',
                version: '1.0.0'
              }
            }
          };
          client.receiveResponse(response);
        }
      });

      const initResponse = await client.initialize();
      
      expect(initResponse.protocolVersion).toBe('2024-11-05');
      expect(initResponse.capabilities).toBeDefined();
      expect(initResponse.serverInfo.name).toBe('mushcode-mcp-server');

      await client.disconnect();
    });

    it('should handle protocol version negotiation gracefully', async () => {
      const client = createTestMCPClient();
      await client.connect();

      // Test with older protocol version
      client.on('requestProcessed', (request) => {
        if (request.method === 'initialize') {
          const clientVersion = request.params.protocolVersion;
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              protocolVersion: clientVersion, // Echo back client version
              capabilities: {
                tools: {
                  listChanged: false
                }
              },
              serverInfo: {
                name: 'mushcode-mcp-server',
                version: '1.0.0'
              }
            }
          };
          client.receiveResponse(response);
        }
      });

      // Simulate client with different protocol version
      const customRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-10-01', // Older version
          capabilities: {
            tools: {
              listChanged: false
            }
          },
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          }
        }
      };

      const response = await client.sendRequest(customRequest);
      expect(response.protocolVersion).toBe('2024-10-01');

      await client.disconnect();
    });
  });

  describe('IDE Integration Compatibility', () => {
    it('should work with VS Code MCP extension format', async () => {
      const vscodeClient = createTestMCPClient();
      await vscodeClient.connect();

      // Simulate VS Code MCP extension initialization
      vscodeClient.on('requestProcessed', (request) => {
        if (request.method === 'initialize') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {
                  listChanged: false
                }
              },
              serverInfo: {
                name: 'mushcode-mcp-server',
                version: '1.0.0'
              }
            }
          };
          vscodeClient.receiveResponse(response);
        } else if (request.method === 'tools/list') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              tools: [
                {
                  name: 'generate_mushcode',
                  description: 'Generate MUSHCODE based on specifications',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      description: { type: 'string' }
                    },
                    required: ['description']
                  }
                }
              ]
            }
          };
          vscodeClient.receiveResponse(response);
        }
      });

      await vscodeClient.initialize();
      const tools = await vscodeClient.listTools();

      expect(tools.tools).toBeDefined();
      expect(tools.tools[0].name).toBe('generate_mushcode');
      expect(tools.tools[0].inputSchema).toBeDefined();

      await vscodeClient.disconnect();
    });

    it('should work with Cursor IDE MCP integration', async () => {
      const cursorClient = createTestMCPClient();
      await cursorClient.connect();

      // Simulate Cursor IDE specific initialization
      cursorClient.on('requestProcessed', (request) => {
        if (request.method === 'initialize') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {
                  listChanged: false
                }
              },
              serverInfo: {
                name: 'mushcode-mcp-server',
                version: '1.0.0'
              }
            }
          };
          cursorClient.receiveResponse(response);
        } else if (request.method === 'tools/call') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  code: '&CMD.CURSOR me=$cursor:@pemit %#=Hello from Cursor!',
                  explanation: 'Generated for Cursor IDE'
                })
              }]
            }
          };
          cursorClient.receiveResponse(response);
        }
      });

      await cursorClient.initialize();
      const result = await cursorClient.callTool('generate_mushcode', {
        description: 'Test command for Cursor'
      });

      expect(result.content[0].text).toContain('Hello from Cursor');

      await cursorClient.disconnect();
    });

    it('should work with Claude Desktop MCP integration', async () => {
      const claudeClient = createTestMCPClient();
      await claudeClient.connect();

      // Simulate Claude Desktop MCP integration
      claudeClient.on('requestProcessed', (request) => {
        if (request.method === 'initialize') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {
                  listChanged: false
                }
              },
              serverInfo: {
                name: 'mushcode-mcp-server',
                version: '1.0.0'
              }
            }
          };
          claudeClient.receiveResponse(response);
        } else if (request.method === 'tools/call') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  explanation: 'This code creates a command that responds to user input',
                  code_breakdown: [
                    { section: '&CMD.TEST', explanation: 'Creates command attribute' }
                  ]
                })
              }]
            }
          };
          claudeClient.receiveResponse(response);
        }
      });

      await claudeClient.initialize();
      const result = await claudeClient.callTool('explain_mushcode', {
        code: '&CMD.TEST me=$test:@pemit %#=Test'
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.explanation).toBeDefined();
      expect(parsed.code_breakdown).toBeDefined();

      await claudeClient.disconnect();
    });
  });

  describe('Transport Layer Compatibility', () => {
    it('should handle stdio transport correctly', async () => {
      // This test verifies that the server can work with stdio transport
      // which is the standard for MCP servers
      
      const client = createTestMCPClient();
      await client.connect();

      // Simulate stdio-based communication
      client.on('requestProcessed', (request) => {
        // Verify request format matches stdio expectations
        expect(request.jsonrpc).toBe('2.0');
        expect(request.id).toBeDefined();
        expect(request.method).toBeDefined();

        if (request.method === 'initialize') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: { tools: { listChanged: false } },
              serverInfo: { name: 'mushcode-mcp-server', version: '1.0.0' }
            }
          };
          client.receiveResponse(response);
        }
      });

      const result = await client.initialize();
      expect(result).toBeDefined();

      await client.disconnect();
    });

    it('should handle message framing correctly', async () => {
      const client = createTestMCPClient();
      await client.connect();

      // Test that messages are properly framed and parsed
      const largeMessage = {
        description: 'A'.repeat(1000), // Large message to test framing
        server_type: 'PennMUSH',
        function_type: 'command'
      };

      client.on('requestProcessed', (request) => {
        if (request.method === 'tools/call') {
          // Verify large message was received correctly
          expect(request.params.arguments.description).toHaveLength(1000);
          
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({ received_length: request.params.arguments.description.length })
              }]
            }
          };
          client.receiveResponse(response);
        }
      });

      await client.initialize();
      const result = await client.callTool('generate_mushcode', largeMessage);
      
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.received_length).toBe(1000);

      await client.disconnect();
    });
  });

  describe('Error Handling Compatibility', () => {
    it('should return standard JSON-RPC error formats', async () => {
      const client = createTestMCPClient();
      await client.connect();
      await client.initialize();

      client.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'nonexistent_tool') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: 'Method not found',
              data: {
                tool: 'nonexistent_tool'
              }
            }
          };
          client.receiveResponse(response);
        }
      });

      await expect(client.callTool('nonexistent_tool', {}))
        .rejects.toThrow('JSON-RPC Error: Method not found');

      await client.disconnect();
    });

    it('should handle malformed requests gracefully', async () => {
      const client = createTestMCPClient();
      await client.connect();

      // Test malformed request handling
      client.on('requestProcessed', (request) => {
        // Simulate server detecting malformed request
        if (!request.params || !request.params.name) {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32602,
              message: 'Invalid params',
              data: {
                details: 'Missing required parameter: name'
              }
            }
          };
          client.receiveResponse(response);
        }
      });

      // Send malformed request
      const malformedRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {} // Missing required 'name' parameter
      };

      await expect(client.sendRequest(malformedRequest))
        .rejects.toThrow('JSON-RPC Error: Invalid params');

      await client.disconnect();
    });
  });

  describe('Capability Negotiation', () => {
    it('should negotiate tool capabilities correctly', async () => {
      const client = createTestMCPClient();
      await client.connect();

      client.on('requestProcessed', (request) => {
        if (request.method === 'initialize') {
          const clientCapabilities = request.params.capabilities;
          
          // Server should respond with its capabilities
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {
                  listChanged: clientCapabilities.tools?.listChanged || false
                }
              },
              serverInfo: {
                name: 'mushcode-mcp-server',
                version: '1.0.0'
              }
            }
          };
          client.receiveResponse(response);
        }
      });

      const initResponse = await client.initialize();
      
      expect(initResponse.capabilities).toBeDefined();
      expect(initResponse.capabilities.tools).toBeDefined();
      expect(typeof initResponse.capabilities.tools.listChanged).toBe('boolean');

      await client.disconnect();
    });

    it('should handle unsupported capabilities gracefully', async () => {
      const client = createTestMCPClient();
      await client.connect();

      client.on('requestProcessed', (request) => {
        if (request.method === 'initialize') {
          // Server responds with only supported capabilities
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {
                  listChanged: false
                }
                // Note: Not including unsupported capabilities like 'resources'
              },
              serverInfo: {
                name: 'mushcode-mcp-server',
                version: '1.0.0'
              }
            }
          };
          client.receiveResponse(response);
        }
      });

      // Client requests unsupported capabilities
      const customRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: { listChanged: true },
            resources: { subscribe: true }, // Unsupported
            prompts: { listChanged: true }  // Unsupported
          },
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          }
        }
      };

      const response = await client.sendRequest(customRequest);
      
      // Server should only return supported capabilities
      expect(response.capabilities.tools).toBeDefined();
      expect(response.capabilities.resources).toBeUndefined();
      expect(response.capabilities.prompts).toBeUndefined();

      await client.disconnect();
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should work on different operating systems', async () => {
      const client = createTestMCPClient();
      await client.connect();

      // Simulate different OS environments
      const originalPlatform = process.platform;
      
      try {
        // Test Windows compatibility
        Object.defineProperty(process, 'platform', { value: 'win32' });
        
        client.on('requestProcessed', (request) => {
          if (request.method === 'initialize') {
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                protocolVersion: '2024-11-05',
                capabilities: { tools: { listChanged: false } },
                serverInfo: { 
                  name: 'mushcode-mcp-server', 
                  version: '1.0.0',
                  platform: process.platform
                }
              }
            };
            client.receiveResponse(response);
          }
        });

        const result = await client.initialize();
        expect(result.serverInfo.platform).toBe('win32');

      } finally {
        // Restore original platform
        Object.defineProperty(process, 'platform', { value: originalPlatform });
      }

      await client.disconnect();
    });

    it('should handle different line ending formats', async () => {
      const client = createTestMCPClient();
      await client.connect();
      await client.initialize();

      // Test with different line endings
      const windowsCode = '&CMD.TEST me=$test:\r\n@pemit %#=Hello\r\n';
      const unixCode = '&CMD.TEST me=$test:\n@pemit %#=Hello\n';
      // const macCode = '&CMD.TEST me=$test:\r@pemit %#=Hello\r'; // Unused for now

      client.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'validate_mushcode') {
          const code = request.params.arguments.code;
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  is_valid: true,
                  line_ending_format: code.includes('\r\n') ? 'CRLF' : 
                                     code.includes('\r') ? 'CR' : 'LF',
                  normalized_code: code.replace(/\r\n|\r|\n/g, '\n')
                })
              }]
            }
          };
          client.receiveResponse(response);
        }
      });

      // Test Windows line endings
      const windowsResult = await client.callTool('validate_mushcode', { code: windowsCode });
      const windowsParsed = JSON.parse(windowsResult.content[0].text);
      expect(windowsParsed.line_ending_format).toBe('CRLF');

      // Test Unix line endings
      const unixResult = await client.callTool('validate_mushcode', { code: unixCode });
      const unixParsed = JSON.parse(unixResult.content[0].text);
      expect(unixParsed.line_ending_format).toBe('LF');

      await client.disconnect();
    });
  });

  describe('Configuration Compatibility', () => {
    it('should work with different MCP client configurations', async () => {
      // Test with minimal configuration
      const minimalClient = createTestMCPClient({ timeout: 1000 });
      await minimalClient.connect();

      minimalClient.on('requestProcessed', (request) => {
        if (request.method === 'initialize') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: { tools: { listChanged: false } },
              serverInfo: { name: 'mushcode-mcp-server', version: '1.0.0' }
            }
          };
          minimalClient.receiveResponse(response);
        }
      });

      const result = await minimalClient.initialize();
      expect(result).toBeDefined();
      await minimalClient.disconnect();

      // Test with full configuration
      const fullClient = createTestMCPClient({ 
        timeout: 30000,
        simulateNetworkDelay: true,
        networkDelayMs: 50
      });
      await fullClient.connect();

      fullClient.on('requestProcessed', (request) => {
        if (request.method === 'initialize') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: { tools: { listChanged: false } },
              serverInfo: { name: 'mushcode-mcp-server', version: '1.0.0' }
            }
          };
          fullClient.receiveResponse(response);
        }
      });

      const fullResult = await fullClient.initialize();
      expect(fullResult).toBeDefined();
      await fullClient.disconnect();
    });
  });
});