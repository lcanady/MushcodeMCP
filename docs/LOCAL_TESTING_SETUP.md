# Local Testing Setup for MUSHCODE MCP Server with Cline

This guide shows you how to set up and test the MUSHCODE MCP server locally with Cline (or other MCP clients).

## Quick Start

```bash
# 1. Build the project
npm run build

# 2. Test that tools work
node scripts/test-tools-directly.js

# 3. Test server startup
node scripts/test-server-startup.js

# 4. Configure Cline (see MCP Configuration section below)
# 5. Use natural language in Cline: "Generate a MUSHCODE greeting command for PennMUSH"
```

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Cline** (VS Code extension or standalone)
4. **TypeScript** (for development)

## Setup Steps

### 1. Install Dependencies

```bash
# Install project dependencies
npm install

# Install development dependencies
npm install --save-dev @types/node typescript ts-node jest
```

### 2. Build the Project

```bash
# Build TypeScript to JavaScript
npm run build

# Or for development with watch mode
npm run dev
```

### 3. Configure MCP Server

Create a local MCP configuration file:

```bash
# Create local config directory
mkdir -p .kiro/settings

# Create MCP configuration
cat > .kiro/settings/mcp.json << 'EOF'
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
```

### 4. Alternative: Global MCP Configuration

If you want to use the server across multiple projects:

```bash
# Create global config directory
mkdir -p ~/.kiro/settings

# Create global MCP configuration
cat > ~/.kiro/settings/mcp.json << 'EOF'
{
  "mcpServers": {
    "mushcode-server": {
      "command": "node",
      "args": ["/path/to/your/mushcode-mcp-server/dist/src/server/index.js"],
      "cwd": "/path/to/your/mushcode-mcp-server",
      "env": {
        "MUSHCODE_LOG_LEVEL": "info",
        "NODE_ENV": "production"
      },
      "disabled": false,
      "autoApprove": [
        "generate_mushcode",
        "validate_mushcode",
        "get_examples"
      ]
    }
  }
}
EOF
```

### 5. Start the Server for Testing

```bash
# Start the MCP server directly for testing
npm start

# Or with debug logging
MUSHCODE_LOG_LEVEL=debug npm start

# Or in development mode with hot reload
npm run dev
```

### 6. Test Server Connectivity

Use the provided test scripts to verify the server works:

```bash
# Test server startup and MCP protocol
node scripts/test-server-startup.js

# Test individual tools directly
node scripts/test-tools-directly.js
```

**Expected output for server startup test:**
```
🧪 Testing MUSHCODE MCP Server startup...
✅ Server startup test passed: Server responded to initialize
📊 Server output preview: Loaded configuration from: ./mushcode-mcp.config.json...
```

**Expected output for tools test:**
```
🧪 Testing MUSHCODE MCP Tools directly...
📚 Populating knowledge base...
✅ Knowledge base populated

1. Testing generate_mushcode tool...
✅ Generate tool result: { "code": "...", "explanation": "..." }

2. Testing validate_mushcode tool...
✅ Validate tool result: { "is_valid": true, "syntax_errors": [...] }

3. Testing get_examples tool...
✅ Examples tool result: { "examples": [...], "total_found": 1 }
```

## Tool Capabilities

The MUSHCODE MCP server provides 7 tools:

| Tool | Purpose | Example Input | Response Time |
|------|---------|---------------|---------------|
| `generate_mushcode` | Creates MUSHCODE from descriptions | "Create a greeting command" | ~2s |
| `validate_mushcode` | Checks syntax and security | Code snippet | ~1s |
| `optimize_mushcode` | Improves code performance | Inefficient code | ~3s |
| `explain_mushcode` | Explains what code does | Code snippet | ~2s |
| `get_examples` | Finds relevant examples | "commands for beginners" | ~1s |
| `format_mushcode` | Pretty-prints code | Messy code | ~1s |
| `compress_mushcode` | Minifies code | Verbose code | ~1s |

All tools support multiple MUD server types: PennMUSH, TinyMUSH, RhostMUSH, TinyMUX, and MUX.

## Using with Cline

### 1. Configure Cline

1. Open VS Code with Cline extension
2. Open the command palette (`Cmd+Shift+P` on macOS)
3. Search for "MCP" and select "Open Kiro MCP UI" or "Configure MCP Servers"
4. Add the MUSHCODE server configuration

### 2. Test MCP Tools in Cline

Once configured, you can test the tools in Cline. Here are working examples:

```
# Test code generation
Generate a MUSHCODE command that displays player information for PennMUSH

# Test code validation  
Validate this MUSHCODE: @create Test Command
@set Test Command = COMMANDS
&CMD Test Command = @pemit %# = Hello, %N!

# Test code optimization
Optimize this inefficient MUSHCODE: [if(eq(%0,1),[if(eq(%1,2),Success,Fail)],Fail)]

# Test code explanation
Explain what this MUSHCODE does: &TIME_FUNC me = [time()]

# Test getting examples
Show me beginner examples of commands for PennMUSH

# Test code formatting
Format this messy MUSHCODE: &func me=[setq(0,%0)][add(%q0,5)]

# Test code compression
Compress this verbose MUSHCODE for better performance
```

**Important Notes:**
- Don't use `@mushcode` prefix - just describe what you want in natural language
- The MCP server will automatically be invoked by Cline when you ask MUSHCODE-related questions
- **All server types now fully supported**: `PennMUSH`, `TinyMUSH`, `RhostMUSH`, `TinyMUX`, and `MUX`
- For examples, use `topic` parameter (not `category`): `commands`, `functions`, `triggers`, etc.
- Run `npm run test:servers` to verify all server types work correctly

### 3. Monitor Performance

Check the server logs and performance metrics:

```bash
# View server logs
tail -f logs/mushcode-mcp-server.log

# Check performance metrics (if implemented)
curl http://localhost:3000/metrics  # If you add HTTP endpoint

# Or check internal performance monitoring
# (This would be exposed through MCP tools or logging)
```

## Available Scripts

```bash
# Build and test
npm run build                                    # Build TypeScript to JavaScript
npm run test -- tests/performance/simple-performance.test.ts  # Test performance

# Server testing
npm run test:tools                              # Test individual tools with real examples
npm run test:servers                            # Test all server types (PennMUSH, TinyMUSH, etc.)
npm run test:comprehensive                      # Comprehensive test of all tools + server types
node scripts/test-server-startup.js            # Test server startup and MCP protocol

# Server management  
npm run start:local                             # Start server with full setup script
node dist/server/index.js                       # Start server directly
npm run dev                                     # Development mode with watch

# Code quality
npm run type-check                              # TypeScript validation
npm run lint                                    # Code linting
npm run format                                  # Code formatting
```

## Troubleshooting

### Common Issues

1. **Server won't start**
   ```bash
   # Check if port is in use
   lsof -i :3000
   
   # Check Node.js version
   node --version  # Should be v18+
   
   # Rebuild dependencies
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **MCP connection fails**
   ```bash
   # Check MCP configuration
   cat .kiro/settings/mcp.json
   
   # Test server manually
   node scripts/test-server-startup.js
   ```

3. **Tools not working**
   ```bash
   # Test tools directly
   npm run test:tools
   
   # Test server type support
   npm run test:servers
   
   # Run comprehensive test
   npm run test:comprehensive
   
   # Check for TypeScript errors
   npm run type-check
   
   # Rebuild if needed
   npm run build
   ```

4. **Performance issues**
   ```bash
   # Run performance tests
   npm run test -- tests/performance/simple-performance.test.ts
   
   # Test server response times
   node scripts/test-server-startup.js
   
   # Monitor memory usage
   node --inspect dist/src/server/index.js
   ```

### Debug Mode

Enable detailed debugging:

```bash
# Set debug environment variables
export MUSHCODE_LOG_LEVEL=debug
export NODE_ENV=development
export DEBUG=mushcode:*

# Start server with debugging
npm run dev
```

### Testing Individual Tools

Use the provided test script to test individual tools:

```bash
# Test all tools with working examples
node scripts/test-tools-directly.js
```

This script tests:
- **generate_mushcode**: Creates MUSHCODE from natural language descriptions
- **validate_mushcode**: Checks code for syntax errors and security issues  
- **get_examples**: Retrieves relevant code examples from the knowledge base

**Sample tool outputs:**

**Generate Tool:**
```json
{
  "code": "&CMD.%{COMMAND_NAME} %{OBJECT}=$+%{command_name} *:@pemit %#=%{response_message}",
  "explanation": "This code implements basic command: A simple command that responds to user input",
  "usage_example": "&CMD.HELLO me=$+hello *:@pemit %#=Hello, %0!",
  "compatibility": ["PennMUSH"],
  "pattern_used": "basic-command"
}
```

**Validate Tool:**
```json
{
  "is_valid": true,
  "syntax_errors": [
    {
      "line": 1,
      "message": "Command should end with semicolon",
      "severity": "info",
      "fixable": true
    }
  ],
  "security_warnings": [
    {
      "type": "permission",
      "description": "Administrative commands without proper permission validation",
      "severity": "medium"
    }
  ],
  "analysis_summary": {
    "complexity_score": 2,
    "security_score": 90,
    "maintainability_score": 80
  }
}
```

## Development Workflow

1. **Make changes** to source code in `src/`
2. **Build** with `npm run build` or `npm run dev` (watch mode)
3. **Test tools** with `node scripts/test-tools-directly.js`
4. **Test server** with `node scripts/test-server-startup.js`
5. **Test performance** with `npm run test -- tests/performance/simple-performance.test.ts`
6. **Use with Cline** - the server will auto-restart when files change in dev mode

## Performance Monitoring

The server includes built-in performance monitoring:

- Response times are tracked for all operations
- Cache hit/miss ratios are monitored
- Memory usage is tracked
- Slow operations are logged

Check the logs for performance metrics and alerts.

## Next Steps

1. **Populate Knowledge Base**: Run `npm run populate-knowledge` to add comprehensive MUSHCODE patterns and examples
2. **Configure Security Rules**: Add security patterns for your specific MUD server
3. **Customize for Your Server**: Modify dialect configurations for your specific MUD server type
4. **Add Custom Patterns**: Extend the knowledge base with your own MUSHCODE patterns and examples

## Support

If you encounter issues:

1. Check the server logs for error messages
2. Verify your MCP configuration is correct
3. Test the server independently of Cline
4. Check that all dependencies are installed correctly
5. Ensure you're using a supported Node.js version