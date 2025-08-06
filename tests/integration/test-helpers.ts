/**
 * Test helpers for integration tests
 */

export function createMockResponse(id: any, result: any) {
  return {
    jsonrpc: '2.0' as const,
    id,
    result
  };
}

export function createMockError(id: any, code: number, message: string, data?: any) {
  return {
    jsonrpc: '2.0' as const,
    id,
    error: {
      code,
      message,
      data
    }
  };
}

export function createToolResponse(id: any, content: any) {
  return createMockResponse(id, {
    content: [{
      type: 'text',
      text: typeof content === 'string' ? content : JSON.stringify(content)
    }]
  });
}

export function createInitResponse(id: any, serverInfo?: any) {
  return createMockResponse(id, {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {
        listChanged: false
      }
    },
    serverInfo: {
      name: 'mushcode-mcp-server',
      version: '1.0.0',
      ...serverInfo
    }
  });
}

export function createToolsListResponse(id: any, tools: string[]) {
  return createMockResponse(id, {
    tools: tools.map(name => ({
      name,
      description: `${name} tool description`,
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    }))
  });
}