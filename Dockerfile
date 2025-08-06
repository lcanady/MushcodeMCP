# MUSHCODE MCP Server - Production Dockerfile
# Multi-stage build for optimized production image

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --include=dev

# Copy source code
COPY src/ ./src/
COPY data/ ./data/
COPY mushcode-mcp.config.json ./

# Build the application
RUN npm run build

# Skip tests in production build as test files are excluded by .dockerignore
# RUN npm run test -- tests/performance/simple-performance.test.ts

# Remove dev dependencies and clean up
RUN npm prune --production && \
    npm cache clean --force

# Stage 2: Production stage
FROM node:20-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S mushcode && \
    adduser -S mushcode -u 1001 -G mushcode

# Set working directory
WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache \
    dumb-init \
    tini

# Copy built application from builder stage
COPY --from=builder --chown=mushcode:mushcode /app/dist ./dist
COPY --from=builder --chown=mushcode:mushcode /app/node_modules ./node_modules
COPY --from=builder --chown=mushcode:mushcode /app/data ./data
COPY --from=builder --chown=mushcode:mushcode /app/package.json ./
COPY --from=builder --chown=mushcode:mushcode /app/mushcode-mcp.config.json ./

# Create directories for runtime data
RUN mkdir -p /app/logs /app/cache && \
    chown -R mushcode:mushcode /app/logs /app/cache

# Set environment variables for production
ENV NODE_ENV=production \
    MUSHCODE_LOG_LEVEL=info \
    MUSHCODE_CACHE_SIZE=1000 \
    MUSHCODE_CACHE_TTL=300000 \
    PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "import('./dist/server/index.js').then(() => process.exit(0)).catch(() => process.exit(1))" || exit 1

# Switch to non-root user
USER mushcode

# Expose port
EXPOSE 3000

# Use tini as init system for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "dist/server/index.js"]

# Labels for metadata
LABEL maintainer="MUSHCODE MCP Server Team" \
      version="1.0.0" \
      description="Production-ready MUSHCODE MCP Server" \
      org.opencontainers.image.title="MUSHCODE MCP Server" \
      org.opencontainers.image.description="A specialized Model Context Protocol server for MUSHCODE development assistance" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.vendor="MUSHCODE MCP Server Team" \
      org.opencontainers.image.licenses="MIT"