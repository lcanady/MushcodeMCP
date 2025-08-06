# MUSHCODE MCP Server Deployment Guide

This guide covers how to deploy and run the MUSHCODE MCP Server in different environments.

## Installation

### From npm (Recommended)

```bash
npm install -g mushcode-mcp-server
```

### From Source

```bash
git clone https://github.com/your-org/mushcode-mcp-server.git
cd mushcode-mcp-server
npm install
npm run build
```

## Quick Start

1. Generate a configuration file:
```bash
mushcode-mcp-server generate-config
```

2. Start the server:
```bash
mushcode-mcp-server
```

The server will start and listen for MCP connections via stdio.

## Deployment Environments

### Development Environment

For development, use the built-in development server:

```bash
npm run dev
```

This starts the server with:
- Hot reloading on file changes
- Debug logging enabled
- Development-friendly error messages

### Production Environment

For production deployment:

1. Build the project:
```bash
npm run build
```

2. Create a production configuration:
```bash
cat > mushcode-mcp.config.json << EOF
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
EOF
```

3. Start the server:
```bash
npm start
```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mushcode -u 1001

# Create log directory
RUN mkdir -p /var/log/mushcode-mcp && chown mushcode:nodejs /var/log/mushcode-mcp

USER mushcode

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t mushcode-mcp-server .
docker run -p 3000:3000 mushcode-mcp-server
```

### Systemd Service

Create `/etc/systemd/system/mushcode-mcp.service`:

```ini
[Unit]
Description=MUSHCODE MCP Server
After=network.target

[Service]
Type=simple
User=mushcode
WorkingDirectory=/opt/mushcode-mcp-server
ExecStart=/usr/bin/node dist/server/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=MUSHCODE_LOG_LEVEL=info
Environment=MUSHCODE_LOG_FILE=/var/log/mushcode-mcp/server.log

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable mushcode-mcp
sudo systemctl start mushcode-mcp
```

## Environment Variables

Key environment variables for deployment:

```bash
# Server configuration
export MUSHCODE_SERVER_NAME="mushcode-mcp-server"
export MUSHCODE_CONFIG_PATH="/etc/mushcode-mcp/config.json"

# Performance tuning
export MUSHCODE_RESPONSE_TIMEOUT=5000
export MUSHCODE_MAX_CONCURRENT=10

# Logging
export MUSHCODE_LOG_LEVEL=info
export MUSHCODE_LOG_FILE=/var/log/mushcode-mcp/server.log

# Knowledge base
export MUSHCODE_DATA_PATH=/opt/mushcode-mcp/data
export MUSHCODE_CACHE_ENABLED=true

# Security
export MUSHCODE_MAX_INPUT_LENGTH=10000
```

## Health Checks

The server provides several ways to monitor health:

### Process Health

Check if the server process is running:

```bash
ps aux | grep mushcode-mcp-server
```

### Configuration Validation

Validate configuration before starting:

```bash
npm run validate-config
```

### Log Monitoring

Monitor server logs for errors:

```bash
tail -f /var/log/mushcode-mcp/server.log
```

## Troubleshooting

### Common Issues

1. **Server won't start**
   - Check configuration file syntax
   - Verify file permissions
   - Check available ports

2. **High memory usage**
   - Reduce cache size in configuration
   - Disable caching if not needed
   - Monitor knowledge base size

3. **Slow responses**
   - Increase response timeout
   - Enable caching
   - Check knowledge base performance

4. **Permission errors**
   - Ensure proper file permissions
   - Check log directory permissions
   - Verify user has access to data files

### Debug Mode

Enable debug logging:

```bash
export MUSHCODE_LOG_LEVEL=debug
npm start
```

### Performance Monitoring

Enable metrics collection:

```json
{
  "performance": {
    "enableMetrics": true
  }
}
```

## Security Considerations

### Input Validation

Always enable input validation in production:

```json
{
  "security": {
    "enableInputValidation": true,
    "maxInputLength": 10000
  }
}
```

### Rate Limiting

Enable rate limiting for public deployments:

```json
{
  "security": {
    "enableRateLimiting": true,
    "rateLimit": {
      "windowMs": 60000,
      "maxRequests": 100
    }
  }
}
```

### File Permissions

Secure file permissions:

```bash
# Configuration files
chmod 600 /etc/mushcode-mcp/config.json

# Log files
chmod 644 /var/log/mushcode-mcp/server.log

# Data directory
chmod -R 755 /opt/mushcode-mcp/data
```

## Backup and Recovery

### Configuration Backup

Backup configuration files:

```bash
cp mushcode-mcp.config.json mushcode-mcp.config.json.backup
```

### Knowledge Base Backup

Backup knowledge base data:

```bash
tar -czf knowledge-backup-$(date +%Y%m%d).tar.gz data/knowledge/
```

### Recovery Procedure

1. Stop the server
2. Restore configuration and data files
3. Validate configuration
4. Restart the server

## Monitoring and Alerting

### Log Analysis

Monitor for error patterns:

```bash
grep -i error /var/log/mushcode-mcp/server.log
```

### Performance Metrics

If metrics are enabled, monitor:
- Response times
- Request rates
- Error rates
- Memory usage

### Alerting Rules

Set up alerts for:
- Server process down
- High error rates
- Memory usage above threshold
- Disk space low