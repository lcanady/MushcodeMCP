#!/usr/bin/env node

/**
 * Simple test to verify the server can start up correctly
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testServerStartup() {
  console.log('🧪 Testing MUSHCODE MCP Server startup...');
  
  const serverPath = path.join(__dirname, '..', 'dist', 'server', 'index.js');
  
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      MUSHCODE_LOG_LEVEL: 'error' // Reduce noise
    }
  });

  let serverOutput = '';
  let serverError = '';

  server.stdout.on('data', (data) => {
    serverOutput += data.toString();
  });

  server.stderr.on('data', (data) => {
    serverError += data.toString();
  });

  // Send a simple MCP initialize message
  const initMessage = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  server.stdin.write(JSON.stringify(initMessage) + '\n');

  // Wait for response or timeout
  const result = await Promise.race([
    new Promise((resolve) => {
      server.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('"result"') && output.includes('"capabilities"')) {
          resolve({ success: true, message: 'Server responded to initialize' });
        }
      });
    }),
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: false, message: 'Timeout waiting for server response' });
      }, 5000);
    })
  ]);

  server.kill();

  if (result.success) {
    console.log('✅ Server startup test passed:', result.message);
    console.log('📊 Server output preview:', serverOutput.substring(0, 200));
  } else {
    console.log('❌ Server startup test failed:', result.message);
    if (serverError) {
      console.log('🔍 Server errors:', serverError);
    }
    if (serverOutput) {
      console.log('📋 Server output:', serverOutput.substring(0, 500));
    }
  }

  return result.success;
}

// Run the test
testServerStartup()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  });