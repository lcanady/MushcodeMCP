# MUSHCODE MCP Server Configuration

This document describes how to configure and customize the MUSHCODE MCP Server.

## Configuration File

The server uses a JSON configuration file named `mushcode-mcp.config.json`. The server will look for this file in the following locations (in order):

1. Path specified by `MUSHCODE_CONFIG_PATH` environment variable
2. `./mushcode-mcp.config.json` (current working directory)
3. Default configuration (built-in)

## Generating a Configuration File

To generate a default configuration file:

```bash
npm run generate-config [output-path]
```

This creates a `mushcode-mcp.config.json` file with all default settings that you can customize.

## Configuration Sections

### Server Configuration

```json
{
  "server": {
    "name": "mushcode-mcp-server",
    "version": "1.0.0",
    "description": "A specialized Model Context Protocol server for MUSHCODE development assistance"
  }
}
```

- `name`: Server identifier
- `version`: Server version
- `description`: Human-readable description

### Knowledge Base Configuration

```json
{
  "knowledge": {
    "dataPath": "./data/knowledge",
    "cacheEnabled": true,
    "cacheSize": 1000,
    "lazyLoading": true
  }
}
```

- `dataPath`: Path to knowledge base data files
- `cacheEnabled`: Enable in-memory caching of knowledge base entries
- `cacheSize`: Maximum number of cached entries
- `lazyLoading`: Load knowledge base entries on-demand

### Performance Configuration

```json
{
  "performance": {
    "responseTimeoutMs": 5000,
    "maxConcurrentRequests": 10,
    "enableMetrics": false
  }
}
```

- `responseTimeoutMs`: Maximum time to wait for tool responses (milliseconds)
- `maxConcurrentRequests`: Maximum number of concurrent tool executions
- `enableMetrics`: Enable performance metrics collection

### Logging Configuration

```json
{
  "logging": {
    "level": "info",
    "enableFileLogging": false,
    "logFilePath": "./logs/mushcode-mcp.log"
  }
}
```

- `level`: Log level (`debug`, `info`, `warn`, `error`)
- `enableFileLogging`: Write logs to file in addition to console
- `logFilePath`: Path to log file (when file logging is enabled)

### Security Configuration

```json
{
  "security": {
    "enableInputValidation": true,
    "maxInputLength": 10000,
    "enableRateLimiting": false,
    "rateLimit": {
      "windowMs": 60000,
      "maxRequests": 100
    }
  }
}
```

- `enableInputValidation`: Validate tool input parameters
- `maxInputLength`: Maximum length of input strings
- `enableRateLimiting`: Enable rate limiting for tool requests
- `rateLimit.windowMs`: Rate limiting window in milliseconds
- `rateLimit.maxRequests`: Maximum requests per window

### Tools Configuration

```json
{
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
    "disabled": [],
    "defaultServerType": "PennMUSH",
    "supportedServerTypes": [
      "PennMUSH",
      "TinyMUSH",
      "RhostMUSH",
      "TinyMUX"
    ]
  }
}
```

- `enabled`: List of tools to enable
- `disabled`: List of tools to explicitly disable (overrides enabled)
- `defaultServerType`: Default MUD server type for code generation
- `supportedServerTypes`: List of supported MUD server types

## Environment Variable Overrides

Configuration values can be overridden using environment variables:

### Server Configuration
- `MUSHCODE_SERVER_NAME`: Override server name
- `MUSHCODE_SERVER_PORT`: Override server port
- `MUSHCODE_SERVER_HOST`: Override server host

### Knowledge Base Configuration
- `MUSHCODE_DATA_PATH`: Override knowledge base data path
- `MUSHCODE_CACHE_ENABLED`: Enable/disable caching (`true`/`false`)

### Performance Configuration
- `MUSHCODE_RESPONSE_TIMEOUT`: Override response timeout (milliseconds)
- `MUSHCODE_MAX_CONCURRENT`: Override max concurrent requests

### Logging Configuration
- `MUSHCODE_LOG_LEVEL`: Override log level
- `MUSHCODE_LOG_FILE`: Enable file logging and set log file path

### Security Configuration
- `MUSHCODE_MAX_INPUT_LENGTH`: Override maximum input length

### Tools Configuration
- `MUSHCODE_DEFAULT_SERVER_TYPE`: Override default server type

## Configuration Validation

To validate your configuration file:

```bash
npm run validate-config [config-file-path]
```

This will check for:
- Required fields
- Valid value ranges
- Consistent settings
- Supported server types

## Example Configurations

### Development Configuration

```json
{
  "logging": {
    "level": "debug",
    "enableFileLogging": true,
    "logFilePath": "./logs/dev.log"
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

### Production Configuration

```json
{
  "logging": {
    "level": "warn",
    "enableFileLogging": true,
    "logFilePath": "/var/log/mushcode-mcp/server.log"
  },
  "performance": {
    "responseTimeoutMs": 3000,
    "maxConcurrentRequests": 20,
    "enableMetrics": true
  },
  "security": {
    "enableRateLimiting": true,
    "rateLimit": {
      "windowMs": 60000,
      "maxRequests": 50
    }
  }
}
```

### Minimal Configuration

```json
{
  "tools": {
    "enabled": ["generate_mushcode", "validate_mushcode"],
    "defaultServerType": "TinyMUSH"
  }
}
```