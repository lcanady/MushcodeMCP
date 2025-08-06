# MUSHCODE MCP Server Installation Guide

This guide covers how to install and set up the MUSHCODE MCP Server.

## Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- An MCP-compatible IDE or client

## Installation Methods

### Method 1: npm Global Installation (Recommended)

Install the server globally using npm:

```bash
npm install -g mushcode-mcp-server
```

Verify installation:

```bash
mushcode-mcp-server --version
```

### Method 2: Local Project Installation

Install as a project dependency:

```bash
npm install mushcode-mcp-server
```

Run using npx:

```bash
npx mushcode-mcp-server
```

### Method 3: From Source

Clone and build from source:

```bash
git clone https://github.com/your-org/mushcode-mcp-server.git
cd mushcode-mcp-server
npm install
npm run build
npm start
```

## Initial Setup

### 1. Generate Configuration

Create a default configuration file:

```bash
mushcode-mcp-server generate-config
```

This creates `mushcode-mcp.config.json` in your current directory.

### 2. Validate Configuration

Ensure your configuration is valid:

```bash
mushcode-mcp-server validate-config
```

### 3. Test Server

Test that the server starts correctly:

```bash
mushcode-mcp-server
```

The server should start and display:
```
✅ Configuration is valid
Starting mushcode-mcp-server v1.0.0
Description: A specialized Model Context Protocol server for MUSHCODE development assistance
```

Press `Ctrl+C` to stop the server.

## IDE Integration

### Visual Studio Code

1. Install an MCP-compatible extension (e.g., Claude Dev)
2. Add server configuration to `.vscode/mcp.json`:

```json
{
  "mcpServers": {
    "mushcode-mcp-server": {
      "command": "mushcode-mcp-server",
      "args": [],
      "disabled": false,
      "autoApprove": [
        "generate_mushcode",
        "validate_mushcode",
        "format_mushcode"
      ]
    }
  }
}
```

3. Restart VS Code
4. The server should appear in your MCP servers list

### Other IDEs

See [CLIENT_CONFIGURATIONS.md](CLIENT_CONFIGURATIONS.md) for detailed setup instructions for other IDEs.

## Configuration

### Basic Configuration

The default configuration works for most users. Key settings you might want to customize:

```json
{
  "tools": {
    "defaultServerType": "PennMUSH",
    "enabled": [
      "generate_mushcode",
      "validate_mushcode",
      "optimize_mushcode",
      "explain_mushcode",
      "get_examples",
      "format_mushcode",
      "compress_mushcode"
    ]
  },
  "logging": {
    "level": "info"
  }
}
```

### Environment Variables

Override configuration with environment variables:

```bash
export MUSHCODE_LOG_LEVEL=debug
export MUSHCODE_DEFAULT_SERVER_TYPE=TinyMUSH
export MUSHCODE_DATA_PATH=/custom/path/to/knowledge
```

### Advanced Configuration

See [CONFIGURATION.md](CONFIGURATION.md) for detailed configuration options.

## Verification

### Test Tools

Verify that tools are working correctly:

```bash
# Test with MCP CLI (if available)
mcp-cli list-tools mushcode-mcp-server

# Or test through your IDE's MCP interface
```

### Check Logs

Monitor server logs for issues:

```bash
# If file logging is enabled
tail -f ~/.local/share/mushcode-mcp/logs/server.log

# Or check console output when running the server
```

## Troubleshooting

### Common Issues

1. **Command not found**
   ```bash
   # Ensure npm global bin is in PATH
   npm config get prefix
   export PATH=$PATH:$(npm config get prefix)/bin
   ```

2. **Permission errors**
   ```bash
   # Fix npm permissions
   npm config set prefix ~/.npm-global
   export PATH=~/.npm-global/bin:$PATH
   ```

3. **Server won't start**
   ```bash
   # Check configuration
   mushcode-mcp-server validate-config
   
   # Check for port conflicts
   lsof -i :3000  # If using port mode
   ```

4. **Missing dependencies**
   ```bash
   # Reinstall dependencies
   npm uninstall -g mushcode-mcp-server
   npm install -g mushcode-mcp-server
   ```

### Debug Mode

Enable debug logging for troubleshooting:

```bash
export MUSHCODE_LOG_LEVEL=debug
mushcode-mcp-server
```

### Getting Help

1. Check the logs for error messages
2. Validate your configuration file
3. Try with minimal configuration
4. Check GitHub issues for similar problems
5. Create a new issue with:
   - Your configuration file
   - Error messages
   - System information (OS, Node.js version)

## Updating

### Update Global Installation

```bash
npm update -g mushcode-mcp-server
```

### Update Local Installation

```bash
npm update mushcode-mcp-server
```

### Update from Source

```bash
cd mushcode-mcp-server
git pull origin main
npm install
npm run build
```

## Uninstallation

### Remove Global Installation

```bash
npm uninstall -g mushcode-mcp-server
```

### Remove Local Installation

```bash
npm uninstall mushcode-mcp-server
```

### Clean Up Configuration

```bash
# Remove configuration files
rm mushcode-mcp.config.json

# Remove logs (if file logging was enabled)
rm -rf ~/.local/share/mushcode-mcp/logs/
```

## System Requirements

### Minimum Requirements

- Node.js 18.0.0+
- 512 MB RAM
- 100 MB disk space

### Recommended Requirements

- Node.js 20.0.0+
- 1 GB RAM
- 500 MB disk space (for knowledge base caching)

### Supported Platforms

- macOS 10.15+
- Linux (Ubuntu 18.04+, CentOS 7+, etc.)
- Windows 10+

## Performance Tuning

### For Development

```json
{
  "logging": {
    "level": "debug"
  },
  "performance": {
    "responseTimeoutMs": 10000,
    "enableMetrics": true
  },
  "knowledge": {
    "cacheEnabled": false
  }
}
```

### For Production

```json
{
  "logging": {
    "level": "warn",
    "enableFileLogging": true
  },
  "performance": {
    "responseTimeoutMs": 3000,
    "maxConcurrentRequests": 20
  },
  "knowledge": {
    "cacheEnabled": true,
    "cacheSize": 2000
  }
}
```

## Next Steps

1. Read [CONFIGURATION.md](CONFIGURATION.md) for detailed configuration options
2. See [CLIENT_CONFIGURATIONS.md](CLIENT_CONFIGURATIONS.md) for IDE-specific setup
3. Check [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
4. Review the [README.md](../README.md) for usage examples