#!/usr/bin/env node

import { writeFileSync } from 'fs';

const DEFAULT_CONFIG = {
  server: {
    name: 'mushcode-mcp-server',
    version: '1.0.0',
    description: 'A specialized Model Context Protocol server for MUSHCODE development assistance'
  },
  knowledge: {
    dataPath: './data/knowledge',
    cacheEnabled: true,
    cacheSize: 1000,
    lazyLoading: true
  },
  performance: {
    responseTimeoutMs: 5000,
    maxConcurrentRequests: 10,
    enableMetrics: false
  },
  logging: {
    level: 'info',
    enableFileLogging: false,
    logFilePath: './logs/mushcode-mcp.log'
  },
  security: {
    enableInputValidation: true,
    maxInputLength: 10000,
    enableRateLimiting: false,
    rateLimit: {
      windowMs: 60000,
      maxRequests: 100
    }
  },
  tools: {
    enabled: [
      'generate_mushcode',
      'validate_mushcode',
      'optimize_mushcode',
      'explain_mushcode',
      'get_examples',
      'format_mushcode',
      'compress_mushcode'
    ],
    disabled: [],
    defaultServerType: 'PennMUSH',
    supportedServerTypes: [
      'PennMUSH',
      'TinyMUSH',
      'RhostMUSH',
      'TinyMUX'
    ]
  }
};

async function main(): Promise<void> {
  try {
    const outputPath = process.argv[2] || 'mushcode-mcp.config.json';
    const configJson = JSON.stringify(DEFAULT_CONFIG, null, 2);
    
    writeFileSync(outputPath, configJson, 'utf-8');
    console.log(`✅ Generated configuration file: ${outputPath}`);
    
    console.log('\nConfiguration options:');
    console.log('  - Edit the file to customize server behavior');
    console.log('  - Use environment variables for runtime overrides');
    console.log('  - Run "npm run validate-config" to validate your changes');
    
    console.log('\nEnvironment variable examples:');
    console.log('  MUSHCODE_LOG_LEVEL=debug');
    console.log('  MUSHCODE_DATA_PATH=/custom/path/to/knowledge');
    console.log('  MUSHCODE_RESPONSE_TIMEOUT=10000');
    console.log('  MUSHCODE_DEFAULT_SERVER_TYPE=TinyMUSH');
    
  } catch (error) {
    console.error('Error generating configuration:', error);
    process.exit(1);
  }
}

main();