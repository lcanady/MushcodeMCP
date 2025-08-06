# Technology Stack

## Core Technologies
- **Language**: TypeScript for type safety and better development experience
- **Runtime**: Node.js for MCP server execution
- **Protocol**: JSON-RPC 2.0 for MCP communication
- **Architecture**: Model Context Protocol (MCP) server implementation

## Key Dependencies
- MCP SDK for protocol handling and tool registration
- TypeScript compiler and configuration
- Jest for unit and integration testing
- Standard Node.js modules for file system and networking

## Development Tools
- TypeScript for static typing and compilation
- ESLint for code quality and consistency
- Prettier for code formatting
- Jest for comprehensive testing framework

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Start development server with hot reload
npm run dev

# Run in production mode
npm start
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check
```

## Performance Requirements
- Response times under 5 seconds for most operations
- Efficient pattern matching for code generation
- Caching for frequently requested examples
- Lazy loading of server-specific knowledge

## Security Considerations
- Input validation for all MCP tool parameters
- Security vulnerability detection in generated code
- Proper error handling without information leakage
- Safe code execution patterns in examples