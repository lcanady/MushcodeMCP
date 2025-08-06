# MUSHCODE MCP Server

A specialized Model Context Protocol (MCP) server that provides AI-powered assistance for MUSHCODE development in Multi-User Dungeon (MUD) environments.

## Features

- Generate syntactically correct MUSHCODE functions and commands
- Validate existing MUSHCODE for syntax errors and security vulnerabilities
- Optimize MUSHCODE for performance and maintainability
- Provide educational resources and examples for MUSHCODE learning
- Support multiple MUD server dialects (PennMUSH, TinyMUSH, RhostMUSH, etc.)
- Configurable server behavior and tool selection
- Production-ready deployment options

## Quick Start

### Installation

```bash
npm install -g mushcode-mcp-server
```

### Configuration

Generate a default configuration file:

```bash
mushcode-mcp-server generate-config
```

Validate your configuration:

```bash
mushcode-mcp-server validate-config
```

### Running the Server

```bash
mushcode-mcp-server
```

## Documentation

- [Installation Guide](docs/INSTALLATION.md) - Detailed installation instructions
- [Configuration Guide](docs/CONFIGURATION.md) - Server configuration options
- [Client Configurations](docs/CLIENT_CONFIGURATIONS.md) - IDE integration examples
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment instructions

## Development

### Prerequisites

- Node.js 18.0.0 or higher
- npm

### Local Development

```bash
git clone https://github.com/your-org/mushcode-mcp-server.git
cd mushcode-mcp-server
npm install
```

### Development Commands

```bash
# Build TypeScript to JavaScript
npm run build

# Start development server with hot reload
npm run dev

# Run in production mode
npm start

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run deployment tests only
npm run test:deployment

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Validate configuration
npm run validate-config

# Generate default configuration
npm run generate-config
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check
```

### Project Structure

```
src/
├── server/          # MCP server implementation
├── tools/           # MCP tool implementations
├── types/           # TypeScript type definitions
└── ...
```

## Usage

This server implements the Model Context Protocol (MCP) and can be used with any MCP-compatible client or IDE.

## License

MITx