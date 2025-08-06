#!/usr/bin/env node

import { MushcodeProtocolHandler } from './protocol.js';
import { HealthCheckServer } from './health.js';
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
  console.log(`Starting ${config.server.name} v${config.server.version}`);
  console.log(`Description: ${config.server.description}`);
  
  const protocolHandler = new MushcodeProtocolHandler(configManager);
  
  // Start health check server for Docker/monitoring
  const healthServer = new HealthCheckServer(parseInt(process.env['PORT'] || '3000'));
  if (process.env['NODE_ENV'] === 'production' || process.env['ENABLE_HEALTH_CHECK'] === 'true') {
    healthServer.start();
  }
  
  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    await protocolHandler.stop();
    await healthServer.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await protocolHandler.start();
  } catch (error) {
    console.error('Failed to start MUSHCODE MCP server:', error);
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

export { MushcodeProtocolHandler };
export * from './protocol.js';
export * from './registry.js';