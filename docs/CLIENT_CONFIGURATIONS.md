# MCP Client Configurations

This document provides example configurations for integrating the MUSHCODE MCP Server with popular IDEs and development environments.

## Visual Studio Code

### Using Claude Dev Extension

1. Install the Claude Dev extension
2. Add the MUSHCODE MCP server to your MCP configuration:

**File: `.vscode/mcp.json`**

```json
{
  "mcpServers": {
    "mushcode-mcp-server": {
      "command": "npx",
      "args": ["mushcode-mcp-server"],
      "env": {
        "MUSHCODE_LOG_LEVEL": "info",
        "MUSHCODE_DATA_PATH": "./data/knowledge"
      },
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

### Using Continue Extension

**File: `.continue/config.json`**

```json
{
  "models": [
    {
      "title": "Claude with MUSHCODE",
      "provider": "anthropic",
      "model": "claude-3-sonnet-20240229",
      "apiKey": "your-api-key"
    }
  ],
  "mcpServers": [
    {
      "name": "mushcode-mcp-server",
      "command": "npx",
      "args": ["mushcode-mcp-server"],
      "env": {
        "MUSHCODE_LOG_LEVEL": "info"
      }
    }
  ]
}
```

## Cursor IDE

**File: `.cursor/mcp.json`**

```json
{
  "servers": {
    "mushcode": {
      "command": "mushcode-mcp-server",
      "args": [],
      "env": {
        "MUSHCODE_LOG_LEVEL": "info",
        "MUSHCODE_DEFAULT_SERVER_TYPE": "PennMUSH"
      },
      "timeout": 10000,
      "autoRestart": true
    }
  },
  "tools": {
    "autoApprove": [
      "generate_mushcode",
      "validate_mushcode",
      "explain_mushcode"
    ],
    "requireConfirmation": [
      "optimize_mushcode"
    ]
  }
}
```

## Zed Editor

**File: `~/.config/zed/mcp.json`**

```json
{
  "servers": [
    {
      "name": "mushcode-mcp-server",
      "command": ["node", "/path/to/mushcode-mcp-server/dist/server/index.js"],
      "env": {
        "MUSHCODE_LOG_LEVEL": "warn",
        "MUSHCODE_CACHE_ENABLED": "true"
      },
      "workingDirectory": "/path/to/mushcode-mcp-server"
    }
  ]
}
```

## Neovim with MCP Plugin

**File: `~/.config/nvim/lua/mcp-config.lua`**

```lua
require('mcp').setup({
  servers = {
    mushcode = {
      command = 'mushcode-mcp-server',
      args = {},
      env = {
        MUSHCODE_LOG_LEVEL = 'info',
        MUSHCODE_DEFAULT_SERVER_TYPE = 'PennMUSH'
      },
      filetypes = { 'mushcode', 'mush', 'softcode' },
      root_patterns = { '.mushcode', 'mush.config' }
    }
  },
  tools = {
    auto_approve = {
      'generate_mushcode',
      'validate_mushcode',
      'format_mushcode'
    }
  }
})
```

## Emacs with MCP Mode

**File: `~/.emacs.d/init.el`**

```elisp
(use-package mcp-mode
  :config
  (setq mcp-servers
        '((mushcode-mcp-server
           :command "mushcode-mcp-server"
           :args ()
           :env (("MUSHCODE_LOG_LEVEL" . "info")
                 ("MUSHCODE_DEFAULT_SERVER_TYPE" . "TinyMUSH"))
           :auto-approve ("generate_mushcode" "validate_mushcode")))))

(add-hook 'mushcode-mode-hook 'mcp-mode)
```

## JetBrains IDEs (IntelliJ, WebStorm, etc.)

**File: `.idea/mcp.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="MCPConfiguration">
    <servers>
      <server name="mushcode-mcp-server">
        <command>mushcode-mcp-server</command>
        <args></args>
        <env>
          <entry key="MUSHCODE_LOG_LEVEL" value="info" />
          <entry key="MUSHCODE_DEFAULT_SERVER_TYPE" value="PennMUSH" />
        </env>
        <autoApprove>
          <tool>generate_mushcode</tool>
          <tool>validate_mushcode</tool>
          <tool>format_mushcode</tool>
        </autoApprove>
      </server>
    </servers>
  </component>
</project>
```

## Sublime Text with MCP Package

**File: `Packages/User/MCP.sublime-settings`**

```json
{
  "servers": [
    {
      "name": "mushcode-mcp-server",
      "command": ["mushcode-mcp-server"],
      "env": {
        "MUSHCODE_LOG_LEVEL": "info",
        "MUSHCODE_DATA_PATH": "${project_path}/data/knowledge"
      },
      "selector": "source.mushcode",
      "auto_approve": [
        "generate_mushcode",
        "validate_mushcode",
        "format_mushcode"
      ]
    }
  ]
}
```

## Command Line Usage

### Direct Usage

```bash
# Start the server
mushcode-mcp-server

# With custom configuration
MUSHCODE_CONFIG_PATH=./custom-config.json mushcode-mcp-server

# With environment overrides
MUSHCODE_LOG_LEVEL=debug MUSHCODE_DEFAULT_SERVER_TYPE=TinyMUSH mushcode-mcp-server
```

### Using with MCP CLI Tools

```bash
# Install MCP CLI
npm install -g @modelcontextprotocol/cli

# Test server connection
mcp-cli connect mushcode-mcp-server

# List available tools
mcp-cli list-tools mushcode-mcp-server

# Call a tool
mcp-cli call-tool mushcode-mcp-server generate_mushcode '{"description": "A simple hello command", "serverType": "PennMUSH"}'
```

## Configuration Options

### Common Environment Variables

```bash
# Server behavior
export MUSHCODE_LOG_LEVEL=info
export MUSHCODE_RESPONSE_TIMEOUT=5000
export MUSHCODE_MAX_CONCURRENT=10

# Knowledge base
export MUSHCODE_DATA_PATH=./data/knowledge
export MUSHCODE_CACHE_ENABLED=true

# Default settings
export MUSHCODE_DEFAULT_SERVER_TYPE=PennMUSH
```

### Auto-Approval Settings

Tools that are typically safe to auto-approve:
- `generate_mushcode`: Code generation
- `validate_mushcode`: Syntax validation
- `format_mushcode`: Code formatting
- `explain_mushcode`: Code explanation
- `get_examples`: Retrieve examples

Tools that may require confirmation:
- `optimize_mushcode`: Code optimization (modifies logic)
- `compress_mushcode`: Code compression (reduces readability)

### File Type Associations

Associate the MCP server with MUSHCODE file types:

```json
{
  "fileAssociations": {
    "*.mush": "mushcode",
    "*.mushcode": "mushcode",
    "*.softcode": "mushcode",
    "*.mu": "mushcode"
  }
}
```

## Troubleshooting Client Configurations

### Server Not Starting

1. Check if the server is installed:
```bash
which mushcode-mcp-server
```

2. Test server manually:
```bash
mushcode-mcp-server --help
```

3. Check configuration syntax:
```bash
npm run validate-config
```

### Connection Issues

1. Verify server is running:
```bash
ps aux | grep mushcode-mcp-server
```

2. Check logs for errors:
```bash
tail -f ~/.local/share/mushcode-mcp/logs/server.log
```

3. Test with minimal configuration:
```json
{
  "mcpServers": {
    "mushcode": {
      "command": "mushcode-mcp-server",
      "args": []
    }
  }
}
```

### Performance Issues

1. Enable caching:
```bash
export MUSHCODE_CACHE_ENABLED=true
```

2. Increase timeout:
```bash
export MUSHCODE_RESPONSE_TIMEOUT=10000
```

3. Reduce concurrent requests:
```bash
export MUSHCODE_MAX_CONCURRENT=5
```

## Best Practices

1. **Use auto-approval judiciously**: Only auto-approve tools you trust completely
2. **Set appropriate timeouts**: Balance responsiveness with reliability
3. **Monitor resource usage**: Watch memory and CPU usage in development
4. **Keep configurations in version control**: Share team configurations
5. **Use environment-specific settings**: Different configs for dev/prod
6. **Test configurations**: Validate before deploying to team