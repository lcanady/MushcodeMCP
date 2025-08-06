# Remote MCP Server Connections

This guide explains how to connect your AI agent to the MushcodeMCP server remotely.

## Connection Methods

### Method 1: stdio Transport (Recommended)

The default MCP server uses stdio transport, which is the standard for MCP servers.

#### For Claude Desktop

Add to your `~/.config/claude-desktop/config.json`:

```json
{
  "mcpServers": {
    "mushcode-mcp-server": {
      "command": "docker",
      "args": ["exec", "-i", "mushcode-mcp-server", "node", "dist/server/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### For Custom AI Agents (Node.js)

```javascript
import { spawn } from 'child_process';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

// Start the MCP server process
const serverProcess = spawn('docker', [
  'exec', '-i', 'mushcode-mcp-server', 
  'node', 'dist/server/index.js'
]);

// Create MCP client
const transport = new StdioClientTransport({
  command: 'docker',
  args: ['exec', '-i', 'mushcode-mcp-server', 'node', 'dist/server/index.js']
});

const client = new Client({
  name: "my-ai-agent",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

await client.connect(transport);

// List available tools
const tools = await client.listTools();
console.log('Available tools:', tools);

// Call a tool
const result = await client.callTool({
  name: 'generate_mushcode',
  arguments: {
    description: 'Create a simple room object',
    serverType: 'PennMUSH'
  }
});
```

#### For Python AI Agents

```python
import subprocess
import json
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Configure server parameters
server_params = StdioServerParameters(
    command="docker",
    args=["exec", "-i", "mushcode-mcp-server", "node", "dist/server/index.js"],
    env={"NODE_ENV": "production"}
)

async def main():
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            # Initialize the connection
            await session.initialize()
            
            # List available tools
            tools = await session.list_tools()
            print(f"Available tools: {[tool.name for tool in tools.tools]}")
            
            # Call a tool
            result = await session.call_tool(
                "generate_mushcode",
                {
                    "description": "Create a simple room object",
                    "serverType": "PennMUSH"
                }
            )
            print(f"Result: {result.content}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

### Method 2: Network Transport (HTTP/REST API)

For scenarios where stdio transport isn't suitable, use the network transport mode.

#### Start Network Mode

```bash
# Using docker-compose
docker-compose -f docker-compose.network.yml up

# Or manually
docker run -p 3001:3001 -e NETWORK_PORT=3001 mushcode-mcp-server:latest node dist/server/network-server.js
```

#### REST API Usage

```bash
# List available tools
curl http://localhost:3001/api/tools

# Call a tool
curl -X POST http://localhost:3001/api/tools/generate_mushcode \
  -H "Content-Type: application/json" \
  -d '{
    "arguments": {
      "description": "Create a simple room object",
      "serverType": "PennMUSH"
    }
  }'

# Health check
curl http://localhost:3001/health
```

#### JavaScript/TypeScript Client

```javascript
class MushcodeMCPClient {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  async listTools() {
    const response = await fetch(`${this.baseUrl}/api/tools`);
    const data = await response.json();
    return data.tools;
  }

  async callTool(toolName, args = {}) {
    const response = await fetch(`${this.baseUrl}/api/tools/${toolName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ arguments: args }),
    });
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error);
    }
    
    return data.result;
  }

  async healthCheck() {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }
}

// Usage
const client = new MushcodeMCPClient();

// Generate mushcode
const result = await client.callTool('generate_mushcode', {
  description: 'Create a teleportation command',
  serverType: 'PennMUSH'
});

console.log(result);
```

#### Python Client

```python
import requests

class MushcodeMCPClient:
    def __init__(self, base_url="http://localhost:3001"):
        self.base_url = base_url
    
    def list_tools(self):
        response = requests.get(f"{self.base_url}/api/tools")
        data = response.json()
        return data.get("tools", [])
    
    def call_tool(self, tool_name, args=None):
        if args is None:
            args = {}
        
        response = requests.post(
            f"{self.base_url}/api/tools/{tool_name}",
            json={"arguments": args}
        )
        
        data = response.json()
        if not data.get("success"):
            raise Exception(data.get("error", "Unknown error"))
        
        return data.get("result")
    
    def health_check(self):
        response = requests.get(f"{self.base_url}/health")
        return response.json()

# Usage
client = MushcodeMCPClient()

# Generate mushcode
result = client.call_tool('generate_mushcode', {
    'description': 'Create a teleportation command',
    'serverType': 'PennMUSH'
})

print(result)
```

## Available Tools

Your MCP server provides these tools:

- `generate_mushcode` - Generate MUSHCODE based on description
- `validate_mushcode` - Validate MUSHCODE syntax and best practices
- `optimize_mushcode` - Optimize existing MUSHCODE for performance
- `explain_mushcode` - Explain how MUSHCODE works
- `get_examples` - Get example MUSHCODE for specific patterns
- `format_mushcode` - Format and beautify MUSHCODE
- `compress_mushcode` - Compress MUSHCODE by removing unnecessary elements

## Configuration

### Environment Variables

- `NODE_ENV` - Set to `production` for production mode
- `NETWORK_PORT` - Port for network mode (default: 3001)
- `ALLOWED_ORIGINS` - CORS origins for network mode (default: *)
- `MUSHCODE_LOG_LEVEL` - Logging level (info, debug, warn, error)
- `MUSHCODE_CACHE_SIZE` - Cache size for knowledge base
- `MUSHCODE_CACHE_TTL` - Cache TTL in milliseconds

### Security Considerations

For production deployments:

1. **Restrict CORS origins**: Set `ALLOWED_ORIGINS` to specific domains
2. **Use HTTPS**: Deploy behind a reverse proxy with SSL
3. **Authentication**: Add API keys or OAuth (see security configuration)
4. **Rate limiting**: Configure rate limits in the server config
5. **Network isolation**: Use Docker networks or VPNs for internal access

### Docker Deployment

#### stdio Mode (Default)
```bash
docker-compose up
```

#### Network Mode
```bash
docker-compose -f docker-compose.network.yml up
```

#### Custom Configuration
```bash
docker run -d \
  --name mushcode-mcp-server \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e NETWORK_PORT=3001 \
  -e ALLOWED_ORIGINS="https://your-domain.com,https://another-domain.com" \
  -v $(pwd)/mushcode-mcp.config.json:/app/mushcode-mcp.config.json:ro \
  mushcode-mcp-server:latest \
  node dist/server/network-server.js
```

## Troubleshooting

### Common Issues

1. **Connection refused**: Ensure the Docker container is running and ports are mapped correctly
2. **Tool not found**: Check that all tools are enabled in `mushcode-mcp.config.json`
3. **CORS errors**: Configure `ALLOWED_ORIGINS` environment variable
4. **Timeout errors**: Increase `responseTimeoutMs` in the configuration

### Debug Mode

Enable debug logging:
```bash
docker-compose up -e MUSHCODE_LOG_LEVEL=debug
```

### Health Checks

Monitor server health:
```bash
# stdio mode (via Docker exec)
docker exec mushcode-mcp-server node -e "console.log('Server is running')"

# Network mode (via HTTP)
curl http://localhost:3001/health
```

## Integration Examples

### LangChain Integration

```python
from langchain.tools import Tool
from langchain.agents import initialize_agent

def mushcode_generator(description: str) -> str:
    client = MushcodeMCPClient()
    result = client.call_tool('generate_mushcode', {
        'description': description,
        'serverType': 'PennMUSH'
    })
    return result.get('content', '')

mushcode_tool = Tool(
    name="mushcode_generator",
    description="Generate MUSHCODE for MUD development",
    func=mushcode_generator
)

# Use in your LangChain agent
tools = [mushcode_tool]
agent = initialize_agent(tools, llm, agent="zero-shot-react-description")
```

### OpenAI Function Calling

```javascript
const tools = [
  {
    type: "function",
    function: {
      name: "generate_mushcode",
      description: "Generate MUSHCODE for MUD development",
      parameters: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "Description of what the MUSHCODE should do"
          },
          serverType: {
            type: "string",
            enum: ["PennMUSH", "TinyMUSH", "RhostMUSH", "TinyMUX"],
            description: "Target MUD server type"
          }
        },
        required: ["description"]
      }
    }
  }
];

// In your OpenAI API call
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: messages,
  tools: tools,
  tool_choice: "auto"
});

// Handle function calls
if (response.choices[0].message.tool_calls) {
  for (const toolCall of response.choices[0].message.tool_calls) {
    if (toolCall.function.name === "generate_mushcode") {
      const args = JSON.parse(toolCall.function.arguments);
      const client = new MushcodeMCPClient();
      const result = await client.callTool('generate_mushcode', args);
      // Use the result...
    }
  }
}
```