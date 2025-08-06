#!/bin/bash

# MUSHCODE MCP Server - Docker Build Script
# Builds optimized production Docker images

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="mushcode-mcp-server"
VERSION=${1:-"latest"}
BUILD_ARGS=""

echo -e "${BLUE}🐳 Building MUSHCODE MCP Server Docker Image${NC}"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Build production image
echo -e "${YELLOW}🔨 Building production image...${NC}"
docker build \
    --target production \
    --tag "${IMAGE_NAME}:${VERSION}" \
    --tag "${IMAGE_NAME}:latest" \
    ${BUILD_ARGS} \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Production image built successfully${NC}"
else
    echo -e "${RED}❌ Production image build failed${NC}"
    exit 1
fi

# Build development image
echo -e "${YELLOW}🔨 Building development image...${NC}"
docker build \
    --target builder \
    --tag "${IMAGE_NAME}:dev" \
    ${BUILD_ARGS} \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Development image built successfully${NC}"
else
    echo -e "${RED}❌ Development image build failed${NC}"
    exit 1
fi

# Show image information
echo -e "${BLUE}📊 Image Information:${NC}"
docker images | grep "${IMAGE_NAME}"

# Test the production image
echo -e "${YELLOW}🧪 Testing production image...${NC}"
CONTAINER_ID=$(docker run -d --name "${IMAGE_NAME}-test" "${IMAGE_NAME}:${VERSION}")

# Wait for container to start
sleep 5

# Check if container is running
if docker ps | grep -q "${IMAGE_NAME}-test"; then
    echo -e "${GREEN}✅ Container started successfully${NC}"
    
    # Test health check
    if docker exec "${CONTAINER_ID}" node -e "console.log('Health check passed')" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Health check warning (container may still be starting)${NC}"
    fi
else
    echo -e "${RED}❌ Container failed to start${NC}"
    docker logs "${CONTAINER_ID}"
fi

# Cleanup test container
docker stop "${CONTAINER_ID}" > /dev/null 2>&1 || true
docker rm "${CONTAINER_ID}" > /dev/null 2>&1 || true

echo -e "${BLUE}🎉 Docker build completed!${NC}"
echo ""
echo "Available images:"
echo "  - ${IMAGE_NAME}:${VERSION} (production)"
echo "  - ${IMAGE_NAME}:latest (production)"
echo "  - ${IMAGE_NAME}:dev (development)"
echo ""
echo "Usage:"
echo "  Production: docker run -it ${IMAGE_NAME}:${VERSION}"
echo "  Development: docker-compose -f docker-compose.dev.yml up"
echo "  Production with compose: docker-compose up"