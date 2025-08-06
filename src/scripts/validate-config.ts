#!/usr/bin/env node

import { getConfig } from '../config/index.js';

async function main(): Promise<void> {
  try {
    const configPath = process.argv[2];
    const configManager = getConfig(configPath);
    const validation = configManager.validateConfig();
    
    if (validation.valid) {
      console.log('✅ Configuration is valid');
      const config = configManager.getConfig();
      console.log('\nConfiguration summary:');
      console.log(`  Server: ${config.server.name} v${config.server.version}`);
      console.log(`  Tools enabled: ${config.tools.enabled.length}`);
      console.log(`  Default server type: ${config.tools.defaultServerType}`);
      console.log(`  Log level: ${config.logging.level}`);
      console.log(`  Response timeout: ${config.performance.responseTimeoutMs}ms`);
      process.exit(0);
    } else {
      console.error('❌ Configuration validation failed:');
      validation.errors.forEach((error: string) => console.error(`  - ${error}`));
      process.exit(1);
    }
  } catch (error) {
    console.error('Error validating configuration:', error);
    process.exit(1);
  }
}

main();