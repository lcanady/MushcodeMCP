# MushcodeMCP Server

> A specialized Model Context Protocol server for MUSHCODE development assistance

[![npm version](https://badge.fury.io/js/mushcode-mcp-server.svg)](https://badge.fury.io/js/mushcode-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/lcanady/MushcodeMCP/workflows/Node.js%20CI/badge.svg)](https://github.com/lcanady/MushcodeMCP/actions)

## 🚀 Quick Start

### Installation

```bash
# Global installation (recommended)
npm install -g mushcode-mcp-server

# Or local installation
npm install mushcode-mcp-server
```

### Usage

```bash
# Start MCP server (stdio mode for Claude Desktop)
mushcode-mcp-server start

# Start network server (HTTP/REST API)
mushcode-mcp-server network --port 3001

# List available tools
mushcode-mcp-server tools

# Create default configuration
mushcode-mcp-server init
```

## 🛠️ Available Tools

The server provides 7 specialized MUSHCODE tools:

- **`generate_mushcode`** - Generate MUSHCODE from natural language descriptions
- **`validate_mushcode`** - Validate syntax, security, and best practices
- **`optimize_mushcode`** - Optimize code for performance and readability
- **`explain_mushcode`** - Explain how MUSHCODE works with detailed breakdowns
- **`get_examples`** - Get relevant examples with learning paths
- **`format_mushcode`** - Format code for improved readability
- **`compress_mushcode`** - Minify code while preserving functionality

## 📋 MUD Server Support

- **PennMUSH** - Full support
- **TinyMUSH** - Full support  
- **RhostMUSH** - Full support
- **TinyMUX** - Full support

## 🔌 Integration Options

### Option 1: Claude Desktop (MCP Protocol)

Add to your `~/.config/claude-desktop/config.json`:

```json
{
  "mcpServers": {
    "mushcode-mcp-server": {
      "command": "mushcode-mcp-server",
      "args": ["start"]
    }
  }
}
```

### Option 2: REST API

```bash
# Start network server
mushcode-mcp-server network --port 3001

# Use REST API
curl -X POST http://localhost:3001/api/tools/generate_mushcode \
  -H "Content-Type: application/json" \
  -d '{
    "arguments": {
      "description": "Create a teleportation command",
      "server_type": "PennMUSH"
    }
  }'
```

### Option 3: Programmatic Usage

```javascript
import { MushcodeProtocolHandler } from 'mushcode-mcp-server';
import { getConfig } from 'mushcode-mcp-server/config';

const configManager = getConfig();
const handler = new MushcodeProtocolHandler(configManager);
await handler.registerDefaultTools();

const registry = handler.getRegistry();
const result = await registry.callTool('generate_mushcode', {
  description: 'Create a room object',
  server_type: 'PennMUSH'
});
```

## ⚙️ Configuration

### Create Configuration File

```bash
# Create default config
mushcode-mcp-server init

# Validate configuration
mushcode-mcp-server config
```

### Example Configuration

```json
{
  "server": {
    "name": "mushcode-mcp-server",
    "version": "1.0.0"
  },
  "tools": {
    "enabled": [
      "generate_mushcode",
      "validate_mushcode", 
      "optimize_mushcode",
      "explain_mushcode",
      "get_examples",
      "format_mushcode",
      "compress_mushcode"
    ],
    "defaultServerType": "PennMUSH"
  },
  "knowledge": {
    "cacheEnabled": true,
    "cacheSize": 1000
  }
}
```

## 🌐 Network Mode Features

When running in network mode, you get:

- **REST API** endpoints for all tools
- **Server-Sent Events** for MCP over HTTP
- **CORS support** for web applications
- **Rate limiting** and security features
- **Health checks** for monitoring

### API Endpoints

- `GET /health` - Health check
- `GET /api/tools` - List available tools
- `POST /api/tools/{toolName}` - Execute a tool
- `GET /sse` - MCP over Server-Sent Events

## 🔒 Security Features

- **Input validation** and sanitization
- **Rate limiting** (configurable)
- **API key authentication** (optional)
- **CORS protection**
- **Security vulnerability detection**

## 📊 Performance

- **Knowledge base caching** for fast responses
- **Lazy loading** of resources
- **Response time optimization**
- **Memory-efficient processing**

## 🐳 Docker Support

```bash
# Using the published Docker image
docker run -p 3001:3001 mushcode-mcp-server:latest

# Or build locally
docker build -t mushcode-mcp-server .
docker run -p 3001:3001 mushcode-mcp-server
```

## 📚 Examples

### Generate a Command

```bash
mushcode-mcp-server network --port 3001 &

curl -X POST http://localhost:3001/api/tools/generate_mushcode \
  -H "Content-Type: application/json" \
  -d '{
    "arguments": {
      "description": "Create a command that teleports players to a random room",
      "server_type": "PennMUSH",
      "function_type": "command",
      "security_level": "builder"
    }
  }'
```

### Validate Code

```bash
curl -X POST http://localhost:3001/api/tools/validate_mushcode \
  -H "Content-Type: application/json" \
  -d '{
    "arguments": {
      "code": "&CMD.TELEPORT me=$+teleport *:@tel %#=[random(rooms())]",
      "server_type": "PennMUSH",
      "check_security": true
    }
  }'
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/lcanady/MushcodeMCP/blob/main/CONTRIBUTING.md).

## 📄 License

MIT © [lcanady](https://github.com/lcanady/MushcodeMCP)

## 🔗 Links

- [GitHub Repository](https://github.com/lcanady/MushcodeMCP)
- [Documentation](https://github.com/lcanady/MushcodeMCP/tree/main/docs)
- [Issues](https://github.com/lcanady/MushcodeMCP/issues)
- [Changelog](https://github.com/lcanady/MushcodeMCP/blob/main/CHANGELOG.md)

## ⭐ Support

If you find this package helpful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting features
- 🤝 Contributing code

---

**Made with ❤️ for the MUD development community**
