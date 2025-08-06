# Docker Deployment Guide for MUSHCODE MCP Server

This guide covers deploying the MUSHCODE MCP server using Docker in production environments.

## Quick Start

```bash
# Build the Docker image
./scripts/docker-build.sh

# Run with Docker Compose (recommended)
docker-compose up -d

# Or run directly
docker run -d --name mushcode-mcp-server mushcode-mcp-server:latest
```

## Docker Images

The project provides optimized Docker images for different environments:

| Image Tag | Purpose | Size | Use Case |
|-----------|---------|------|----------|
| `mushcode-mcp-server:latest` | Production | ~150MB | Production deployment |
| `mushcode-mcp-server:dev` | Development | ~300MB | Development with hot reload |
| `mushcode-mcp-server:test` | Testing | ~300MB | CI/CD testing |

## Production Deployment

### Using Docker Compose (Recommended)

```bash
# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down

# Update the service
docker-compose pull
docker-compose up -d
```

### Using Docker Run

```bash
# Run production container
docker run -d \
  --name mushcode-mcp-server \
  --restart unless-stopped \
  -p 3000:3000 \
  -v mushcode-logs:/app/logs \
  -v mushcode-cache:/app/cache \
  -e NODE_ENV=production \
  -e MUSHCODE_LOG_LEVEL=info \
  mushcode-mcp-server:latest
```

## Development Setup

### Using Development Compose

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Run tests
docker-compose -f docker-compose.dev.yml --profile test up mushcode-test

# Access development container
docker-compose -f docker-compose.dev.yml exec mushcode-mcp-server-dev sh
```

### Development Features

- **Hot Reload**: Code changes automatically restart the server
- **Debug Port**: Node.js debugger available on port 9229
- **Volume Mounting**: Source code mounted for live editing
- **Extended Logging**: Debug-level logging enabled

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Runtime environment |
| `MUSHCODE_LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |
| `MUSHCODE_CACHE_SIZE` | `1000` | Maximum cache entries |
| `MUSHCODE_CACHE_TTL` | `300000` | Cache TTL in milliseconds (5 minutes) |
| `PORT` | `3000` | Server port (for HTTP health checks) |

### Volume Mounts

| Path | Purpose | Recommended |
|------|---------|-------------|
| `/app/logs` | Application logs | Yes |
| `/app/cache` | Performance cache | Yes |
| `/app/mushcode-mcp.config.json` | Configuration file | Optional |

### Custom Configuration

```bash
# Mount custom configuration
docker run -d \
  --name mushcode-mcp-server \
  -v ./custom-config.json:/app/mushcode-mcp.config.json:ro \
  mushcode-mcp-server:latest
```

## Health Monitoring

### Health Check

The Docker image includes a built-in health check:

```bash
# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"

# View health check logs
docker inspect --format='{{json .State.Health}}' mushcode-mcp-server
```

### Monitoring Commands

```bash
# View real-time logs
docker logs -f mushcode-mcp-server

# Check resource usage
docker stats mushcode-mcp-server

# Execute health check manually
docker exec mushcode-mcp-server node -e "import('./dist/server/index.js').then(() => console.log('OK')).catch(() => process.exit(1))"
```

## Performance Optimization

### Resource Limits

```yaml
# docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
```

### Cache Configuration

```bash
# High-performance cache settings
docker run -d \
  -e MUSHCODE_CACHE_SIZE=2000 \
  -e MUSHCODE_CACHE_TTL=600000 \
  mushcode-mcp-server:latest
```

### Multi-Container Scaling

```yaml
# docker-compose.yml
services:
  mushcode-mcp-server:
    deploy:
      replicas: 3
    ports:
      - "3000-3002:3000"
```

## Security

### Security Features

- **Non-root user**: Runs as user `mushcode` (UID 1001)
- **Read-only filesystem**: Root filesystem is read-only
- **No new privileges**: Security option prevents privilege escalation
- **Minimal base image**: Alpine Linux for reduced attack surface

### Security Best Practices

```bash
# Run with additional security options
docker run -d \
  --name mushcode-mcp-server \
  --security-opt no-new-privileges:true \
  --read-only \
  --tmpfs /tmp:noexec,nosuid,size=100m \
  --user 1001:1001 \
  mushcode-mcp-server:latest
```

## Troubleshooting

### Common Issues

1. **Container won't start**
   ```bash
   # Check logs
   docker logs mushcode-mcp-server
   
   # Check configuration
   docker exec mushcode-mcp-server cat /app/mushcode-mcp.config.json
   ```

2. **Performance issues**
   ```bash
   # Check resource usage
   docker stats mushcode-mcp-server
   
   # Increase memory limit
   docker update --memory=1g mushcode-mcp-server
   ```

3. **Permission errors**
   ```bash
   # Check file permissions
   docker exec mushcode-mcp-server ls -la /app/
   
   # Fix ownership
   docker exec --user root mushcode-mcp-server chown -R mushcode:mushcode /app/logs
   ```

### Debug Mode

```bash
# Run in debug mode
docker run -it \
  -e NODE_ENV=development \
  -e MUSHCODE_LOG_LEVEL=debug \
  mushcode-mcp-server:dev
```

### Performance Testing

```bash
# Run performance tests in container
docker run --rm \
  mushcode-mcp-server:test \
  npm run test -- tests/performance/simple-performance.test.ts
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: ./scripts/docker-build.sh
      
      - name: Run tests
        run: docker run --rm mushcode-mcp-server:test npm test
      
      - name: Deploy to production
        run: docker-compose up -d
```

### Build Arguments

```bash
# Custom build with build arguments
docker build \
  --build-arg NODE_VERSION=20 \
  --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  --tag mushcode-mcp-server:custom \
  .
```

## Backup and Recovery

### Data Backup

```bash
# Backup logs and cache
docker run --rm \
  -v mushcode-logs:/source/logs \
  -v mushcode-cache:/source/cache \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/mushcode-backup-$(date +%Y%m%d).tar.gz -C /source .
```

### Recovery

```bash
# Restore from backup
docker run --rm \
  -v mushcode-logs:/target/logs \
  -v mushcode-cache:/target/cache \
  -v $(pwd)/backup:/backup \
  alpine tar xzf /backup/mushcode-backup-20240101.tar.gz -C /target
```

## Production Checklist

- [ ] Resource limits configured
- [ ] Health checks enabled
- [ ] Logging configured
- [ ] Volumes mounted for persistent data
- [ ] Security options applied
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Update strategy defined

## Support

For Docker-specific issues:

1. Check container logs: `docker logs mushcode-mcp-server`
2. Verify configuration: `docker exec mushcode-mcp-server cat /app/mushcode-mcp.config.json`
3. Test health check: `docker exec mushcode-mcp-server node -e "console.log('Health OK')"`
4. Review resource usage: `docker stats mushcode-mcp-server`