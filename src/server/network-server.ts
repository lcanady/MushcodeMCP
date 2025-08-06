#!/usr/bin/env node

import { NetworkMCPServer } from './network-transport.js';
import { getConfig } from '../config/index.js';

async function main(): Promise<void> {
  // Load and validate configuration
  const configManager = getConfig();
  const validation = configManager.validateConfig();
  
  if (!validation.valid) {
    console.error('Configuration validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }

  const config = configManager.getConfig();
  const port = parseInt(process.env.NETWORK_PORT || process.env.PORT || '3001');
  
  console.log(`Starting ${config.server.name} v${config.server.version} (Network Mode)`);
  console.log(`Description: ${config.server.description}`);
  console.log(`Port: ${port}`);
  
  const networkServer = new NetworkMCPServer(configManager, port);
  
  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    await networkServer.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await networkServer.start();
  } catch (error) {
    console.error('Failed to start Network MCP server:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { NetworkMCPServer };