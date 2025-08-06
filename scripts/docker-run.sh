#!/bin/bash

# MUSHCODE MCP Server - Docker Run Script
# Runs the Docker container with proper configuration

set -e

echo "🐳 Running MUSHCODE MCP Server in Docker"
echo "========================================"

# Configuration
IMAGE_NAME="mushcode-mcp-server:latest"
CONTAINER_NAME="mushcode-mcp-server"
LOG_LEVEL="${MUSHCODE_LOG_LEVEL:-info}"
PORT="${PORT:-3000}"

# Parse command line arguments
DETACHED=false
REMOVE=true
INTERACTIVE=true

while [[ $# -gt 0 ]]; do
  case $1 in
    -d|--detach)
      DETACHED=true
      INTERACTIVE=false
      shift
      ;;
    --no-rm)
      REMOVE=false
      shift
      ;;
    --log-level)
      LOG_LEVEL="$2"
      shift 2
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -d, --detach     Run container in background"
      echo "  --no-rm          Don't remove container when it exits"
      echo "  --log-level      Set log level (debug, info, warn, error)"
      echo "  --port           Set port number (default: 3000)"
      echo "  -h, --help       Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo "📋 Configuration:"
echo "  Image: ${IMAGE_NAME}"
echo "  Container: ${CONTAINER_NAME}"
echo "  Log Level: ${LOG_LEVEL}"
echo "  Port: ${PORT}"
echo "  Detached: ${DETACHED}"
echo "  Remove on exit: ${REMOVE}"
echo ""

# Stop existing container if running
if docker ps -q -f name="${CONTAINER_NAME}" | grep -q .; then
  echo "🛑 Stopping existing container..."
  docker stop "${CONTAINER_NAME}" >/dev/null
fi

# Remove existing container if it exists
if docker ps -aq -f name="${CONTAINER_NAME}" | grep -q .; then
  echo "🗑️  Removing existing container..."
  docker rm "${CONTAINER_NAME}" >/dev/null
fi

# Build run command
RUN_CMD="docker run"

if [ "$REMOVE" = true ]; then
  RUN_CMD="$RUN_CMD --rm"
fi

if [ "$INTERACTIVE" = true ]; then
  RUN_CMD="$RUN_CMD -it"
fi

if [ "$DETACHED" = true ]; then
  RUN_CMD="$RUN_CMD -d"
fi

RUN_CMD="$RUN_CMD --name ${CONTAINER_NAME}"
RUN_CMD="$RUN_CMD -p ${PORT}:3000"
RUN_CMD="$RUN_CMD -e NODE_ENV=production"
RUN_CMD="$RUN_CMD -e MUSHCODE_LOG_LEVEL=${LOG_LEVEL}"
RUN_CMD="$RUN_CMD -e PORT=3000"

# Add volume mounts for logs and config
RUN_CMD="$RUN_CMD -v mushcode-logs:/app/logs"
RUN_CMD="$RUN_CMD -v mushcode-config:/app/.kiro/settings"

# Add security options
RUN_CMD="$RUN_CMD --security-opt no-new-privileges:true"
RUN_CMD="$RUN_CMD --read-only"
RUN_CMD="$RUN_CMD --tmpfs /tmp:noexec,nosuid,size=100m"

# Add resource limits
RUN_CMD="$RUN_CMD --memory=512m"
RUN_CMD="$RUN_CMD --cpus=0.5"

RUN_CMD="$RUN_CMD ${IMAGE_NAME}"

echo "🚀 Starting container..."
echo "Command: ${RUN_CMD}"
echo ""

# Execute the run command
eval $RUN_CMD

if [ "$DETACHED" = true ]; then
  echo ""
  echo "✅ Container started in background"
  echo ""
  echo "📋 Management commands:"
  echo "  • View logs: docker logs -f ${CONTAINER_NAME}"
  echo "  • Stop container: docker stop ${CONTAINER_NAME}"
  echo "  • Container status: docker ps -f name=${CONTAINER_NAME}"
  echo "  • Execute shell: docker exec -it ${CONTAINER_NAME} sh"
else
  echo ""
  echo "✅ Container finished"
fi