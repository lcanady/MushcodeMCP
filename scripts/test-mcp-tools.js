#!/usr/bin/env node

/**
 * Simple test script to verify MCP tools work correctly
 * Run this to test the server before using with Cline
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MCPTester {
  constructor() {
    this.server = null;
    this.messageId = 1;
    this.responses = new Map();
  }

  async startServer() {
    console.log('🚀 Starting MCP server for testing...');
    
    const serverPath = path.join(__dirname, '..', 'dist', 'src', 'server', 'index.js');
    
    this.server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        MUSHCODE_LOG_LEVEL: 'error', // Reduce noise during testing
        NODE_ENV: 'test'
      }
    });

    this.server.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const response = JSON.parse(line);
          if (response.id) {
            this.responses.set(response.id, response);
          }
        } catch (e) {
          // Ignore non-JSON output
        }
      }
    });

    this.server.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('ExperimentalWarning')) {
        console.error('Server error:', error);
      }
    });

    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      const fullMessage = { ...message, id, jsonrpc: '2.0' };
      
      this.server.stdin.write(JSON.stringify(fullMessage) + '\n');
      
      // Wait for response
      const checkResponse = () => {
        if (this.responses.has(id)) {
          const response = this.responses.get(id);
          this.responses.delete(id);
          resolve(response);
        } else {
          setTimeout(checkResponse, 100);
        }
      };
      
      setTimeout(checkResponse, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error(`Timeout waiting for response to message ${id}`));
      }, 10000);
    });
  }

  async initialize() {
    console.log('🔧 Initializing MCP connection...');
    
    const response = await this.sendMessage({
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'mushcode-tester',
          version: '1.0.0'
        }
      }
    });

    if (response.error) {
      throw new Error(`Initialization failed: ${response.error.message}`);
    }

    console.log('✅ MCP connection initialized');
    return response.result;
  }

  async listTools() {
    console.log('📋 Listing available tools...');
    
    const response = await this.sendMessage({
      method: 'tools/list'
    });

    if (response.error) {
      throw new Error(`Failed to list tools: ${response.error.message}`);
    }

    const tools = response.result.tools;
    console.log(`✅ Found ${tools.length} tools:`);
    
    for (const tool of tools) {
      console.log(`   - ${tool.name}: ${tool.description}`);
    }

    return tools;
  }

  async testTool(toolName, args) {
    console.log(`🧪 Testing tool: ${toolName}`);
    
    const startTime = Date.now();
    
    try {
      const response = await this.sendMessage({
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      });

      const duration = Date.now() - startTime;

      if (response.error) {
        console.log(`❌ Tool ${toolName} failed: ${response.error.message}`);
        return false;
      }

      console.log(`✅ Tool ${toolName} succeeded (${duration}ms)`);
      
      // Show result summary
      const result = response.result;
      if (result.content && result.content[0]) {
        const content = result.content[0];
        if (content.text) {
          const preview = content.text.substring(0, 100);
          console.log(`   Result: ${preview}${content.text.length > 100 ? '...' : ''}`);
        }
      }

      return true;
    } catch (error) {
      console.log(`❌ Tool ${toolName} error: ${error.message}`);
      return false;
    }
  }

  async runTests() {
    try {
      await this.startServer();
      await this.initialize();
      const tools = await this.listTools();

      console.log('\n🧪 Running tool tests...\n');

      const testCases = [
        {
          name: 'generate_mushcode',
          args: {
            description: 'Create a simple greeting command',
            serverType: 'pennmush',
            functionType: 'command'
          }
        },
        {
          name: 'validate_mushcode',
          args: {
            code: '@create Test Command\n@set Test Command = COMMANDS\n&CMD Test Command = @pemit %# = Hello!',
            serverType: 'pennmush'
          }
        },
        {
          name: 'get_examples',
          args: {
            category: 'command',
            serverType: 'pennmush',
            limit: 3
          }
        },
        {
          name: 'explain_mushcode',
          args: {
            code: '&TIME_FUNC me = [time()]',
            serverType: 'pennmush'
          }
        },
        {
          name: 'format_mushcode',
          args: {
            code: '&func me=[setq(0,%0)][add(%q0,5)]',
            serverType: 'pennmush'
          }
        }
      ];

      let passed = 0;
      let failed = 0;

      for (const testCase of testCases) {
        const success = await this.testTool(testCase.name, testCase.args);
        if (success) {
          passed++;
        } else {
          failed++;
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log('\n📊 Test Results:');
      console.log(`   ✅ Passed: ${passed}`);
      console.log(`   ❌ Failed: ${failed}`);
      console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

      if (failed === 0) {
        console.log('\n🎉 All tests passed! The MCP server is ready for use with Cline.');
      } else {
        console.log('\n⚠️  Some tests failed. Check the server implementation.');
      }

    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    } finally {
      if (this.server) {
        this.server.kill();
        console.log('\n🛑 Server stopped');
      }
    }
  }
}

// Run tests if this script is executed directly
const tester = new MCPTester();
tester.runTests().catch(console.error);