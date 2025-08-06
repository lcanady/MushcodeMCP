#!/usr/bin/env node

/**
 * Example script to test MCP server connections
 * Run with: node examples/test-connection.js
 */

class MushcodeMCPClient {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  async listTools() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tools`);
      const data = await response.json();
      return data.tools;
    } catch (error) {
      console.error('Failed to list tools:', error.message);
      return null;
    }
  }

  async callTool(toolName, args = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/tools/${toolName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Uncomment if using API key authentication:
          // 'X-API-Key': 'your-api-key-here',
        },
        body: JSON.stringify({ arguments: args }),
      });
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }
      
      return data.result;
    } catch (error) {
      console.error(`Failed to call tool ${toolName}:`, error.message);
      return null;
    }
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error.message);
      return null;
    }
  }
}

async function testConnection() {
  console.log('🔌 Testing MushcodeMCP Server Connection...\n');
  
  const client = new MushcodeMCPClient();
  
  // Test health check
  console.log('📊 Health Check...');
  const health = await client.healthCheck();
  if (health) {
    console.log(`✅ Server is healthy: ${health.server} v${health.version}`);
  } else {
    console.log('❌ Server health check failed');
    console.log('💡 Make sure the server is running with: docker-compose -f docker-compose.network.yml up');
    return;
  }
  
  console.log('');
  
  // Test tool listing
  console.log('🛠️  Listing Available Tools...');
  const tools = await client.listTools();
  if (tools) {
    console.log(`✅ Found ${tools.length} tools:`);
    tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
  } else {
    console.log('❌ Failed to list tools');
    return;
  }
  
  console.log('');
  
  // Test tool execution
  console.log('🚀 Testing Tool Execution...');
  const result = await client.callTool('generate_mushcode', {
    description: 'Create a simple greeting command that says hello to players',
    serverType: 'PennMUSH'
  });
  
  if (result) {
    console.log('✅ Tool execution successful:');
    console.log('📝 Generated MUSHCODE:');
    console.log('─'.repeat(50));
    console.log(result.content || result);
    console.log('─'.repeat(50));
  } else {
    console.log('❌ Tool execution failed');
  }
  
  console.log('\n🎉 Connection test completed!');
  console.log('\n💡 To connect your AI agent:');
  console.log('   1. Use the REST API examples in docs/REMOTE_CONNECTIONS.md');
  console.log('   2. Or use stdio transport for standard MCP clients');
  console.log('   3. Check the documentation for integration examples');
}

// Run the test
testConnection().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});