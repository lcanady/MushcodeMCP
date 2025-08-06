# Project Structure

## Directory Organization

```
/
├── src/                          # Source code
│   ├── server/                   # MCP server implementation
│   │   ├── index.ts             # Main server entry point
│   │   ├── protocol.ts          # MCP protocol handling
│   │   └── registry.ts          # Tool registration system
│   ├── tools/                   # MCP tool implementations
│   │   ├── generate.ts          # generate_mushcode tool
│   │   ├── validate.ts          # validate_mushcode tool
│   │   ├── optimize.ts          # optimize_mushcode tool
│   │   ├── explain.ts           # explain_mushcode tool
│   │   ├── examples.ts          # get_examples tool
│   │   ├── format.ts            # format_mushcode tool
│   │   └── compress.ts          # compress_mushcode tool
│   ├── knowledge/               # Knowledge base and data
│   │   ├── patterns/            # MUSHCODE patterns and templates
│   │   ├── dialects/            # Server-specific dialect definitions
│   │   ├── security/            # Security rules and vulnerability patterns
│   │   └── examples/            # Educational examples and samples
│   ├── engines/                 # Core processing engines
│   │   ├── generator.ts         # Code generation engine
│   │   ├── validator.ts         # Code validation engine
│   │   ├── optimizer.ts         # Code optimization engine
│   │   └── formatter.ts         # Code formatting engine
│   ├── types/                   # TypeScript type definitions
│   │   ├── mcp.ts              # MCP protocol types
│   │   ├── mushcode.ts         # MUSHCODE-specific types
│   │   └── knowledge.ts        # Knowledge base types
│   └── utils/                   # Utility functions
│       ├── errors.ts           # Error handling utilities
│       ├── cache.ts            # Caching utilities
│       └── logger.ts           # Logging utilities
├── tests/                       # Test files
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── fixtures/               # Test data and fixtures
├── docs/                       # Documentation
├── package.json                # Node.js dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── jest.config.js             # Jest testing configuration
└── .eslintrc.js               # ESLint configuration
```

## File Naming Conventions
- Use kebab-case for directories and files
- TypeScript files use `.ts` extension
- Test files use `.test.ts` or `.spec.ts` suffix
- Type definition files use descriptive names in `/types/`

## Code Organization Principles
- **Separation of Concerns**: Each tool in separate file with focused responsibility
- **Layered Architecture**: Server → Tools → Engines → Knowledge Base
- **Type Safety**: Comprehensive TypeScript interfaces for all data structures
- **Modular Design**: Independent engines that can be tested and maintained separately

## Import Patterns
- Use absolute imports from `src/` root
- Group imports: external libraries, internal modules, types
- Prefer named exports over default exports for better tree-shaking

## Configuration Files
- `tsconfig.json`: TypeScript compiler settings with strict mode
- `jest.config.js`: Test configuration with coverage reporting
- `.eslintrc.js`: Code quality rules and TypeScript integration
- `package.json`: Dependencies, scripts, and project metadata

## Knowledge Base Structure
- **Patterns**: Reusable MUSHCODE templates organized by function type
- **Dialects**: Server-specific syntax variations and feature sets
- **Security**: Vulnerability patterns and security best practices
- **Examples**: Educational samples organized by difficulty and topic