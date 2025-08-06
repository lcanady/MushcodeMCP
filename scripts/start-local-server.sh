#!/bin/bash

# MUSHCODE MCP Server Local Testing Script
# This script sets up and starts the MCP server for local testing with Cline

set -e

echo "🚀 Starting MUSHCODE MCP Server for Local Testing"
echo "=================================================="

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js version 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version check passed: $(node --version)"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the project
echo "🔨 Building TypeScript..."
npm run build

# Check if build was successful
if [ ! -f "dist/src/server/index.js" ]; then
    echo "❌ Build failed - server file not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Create MCP configuration if it doesn't exist
MCP_CONFIG_DIR=".kiro/settings"
MCP_CONFIG_FILE="$MCP_CONFIG_DIR/mcp.json"

if [ ! -f "$MCP_CONFIG_FILE" ]; then
    echo "⚙️  Creating MCP configuration..."
    mkdir -p "$MCP_CONFIG_DIR"
    
    cat > "$MCP_CONFIG_FILE" << 'EOF'
{
  "mcpServers": {
    "mushcode-local": {
      "command": "node",
      "args": ["dist/src/server/index.js"],
      "cwd": ".",
      "env": {
        "MUSHCODE_LOG_LEVEL": "debug",
        "NODE_ENV": "development"
      },
      "disabled": false,
      "autoApprove": [
        "generate_mushcode",
        "validate_mushcode",
        "optimize_mushcode",
        "explain_mushcode",
        "get_examples",
        "format_mushcode",
        "compress_mushcode"
      ]
    }
  }
}
EOF
    echo "✅ MCP configuration created at $MCP_CONFIG_FILE"
else
    echo "✅ MCP configuration already exists"
fi

# Populate knowledge base if needed
if [ ! -f "data/knowledge/populated.flag" ]; then
    echo "📚 Populating knowledge base..."
    npm run populate-knowledge || echo "⚠️  Warning: Knowledge base population failed, continuing anyway"
fi

# Set environment variables for development
export MUSHCODE_LOG_LEVEL=debug
export NODE_ENV=development

echo ""
echo "🎯 Server Configuration:"
echo "   - Log Level: $MUSHCODE_LOG_LEVEL"
echo "   - Environment: $NODE_ENV"
echo "   - MCP Config: $MCP_CONFIG_FILE"
echo ""

# Start the server
echo "🚀 Starting MUSHCODE MCP Server..."
echo "   Press Ctrl+C to stop the server"
echo ""

# Run performance tests first (optional)
if [ "$1" = "--test" ]; then
    echo "🧪 Running performance tests first..."
    npm run test:performance || echo "⚠️  Performance tests failed, continuing anyway"
    echo ""
fi

# Start the server with proper error handling
trap 'echo ""; echo "🛑 Server stopped"; exit 0' INT

node dist/src/server/index.js