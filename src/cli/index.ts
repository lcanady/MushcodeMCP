#!/usr/bin/env node

import { program } from 'commander';
import { getConfig } from '../config/index.js';
import { MushcodeProtocolHandler } from '../server/protocol.js';
import { NetworkMCPServer } from '../server/network-transport.js';

// Package info
const packageJson = {
  name: 'mushcode-mcp-server',
  version: '1.0.0',
  description: 'A specialized Model Context Protocol server for MUSHCODE development assistance'
};

program
  .name('mushcode-mcp-server')
  .description('MushcodeMCP Server - AI-powered MUSHCODE development assistance')
  .version(packageJson.version);

// Start command (stdio mode - standard MCP)
program
  .command('start')
  .description('Start the MCP server in stdio mode (default)')
  .option('-c, --config <path>', 'Path to configuration file', './mushcode-mcp.config.json')
  .action(async (options) => {
    try {
      console.log(`🚀 Starting ${packageJson.name} v${packageJson.version}`);
      console.log('📡 Mode: stdio (Model Context Protocol)');
      
      const configManager = getConfig(options.config);
      const validation = configManager.validateConfig();
      
      if (!validation.valid) {
        console.error('❌ Configuration validation failed:');
        validation.errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
      }

      const protocolHandler = new MushcodeProtocolHandler(configManager);
      
      // Handle graceful shutdown
      const shutdown = async () => {
        console.log('🛑 Shutting down gracefully...');
        await protocolHandler.stop();
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

      await protocolHandler.start();
    } catch (error) {
      console.error('❌ Failed to start MCP server:', error);
      process.exit(1);
    }
  });

// Network command (HTTP/REST API mode)
program
  .command('network')
  .description('Start the MCP server in network mode (HTTP/REST API)')
  .option('-p, --port <port>', 'Port to listen on', '3001')
  .option('-c, --config <path>', 'Path to configuration file', './mushcode-mcp.config.json')
  .action(async (options) => {
    try {
      console.log(`🚀 Starting ${packageJson.name} v${packageJson.version}`);
      console.log('🌐 Mode: Network (HTTP/REST API)');
      console.log(`📡 Port: ${options.port}`);
      
      const configManager = getConfig(options.config);
      const validation = configManager.validateConfig();
      
      if (!validation.valid) {
        console.error('❌ Configuration validation failed:');
        validation.errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
      }

      const networkServer = new NetworkMCPServer(configManager, parseInt(options.port));
      
      // Handle graceful shutdown
      const shutdown = async () => {
        console.log('🛑 Shutting down gracefully...');
        await networkServer.stop();
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

      await networkServer.start();
    } catch (error) {
      console.error('❌ Failed to start Network MCP server:', error);
      process.exit(1);
    }
  });

// Tools command (list available tools)
program
  .command('tools')
  .description('List available MUSHCODE tools')
  .option('-c, --config <path>', 'Path to configuration file', './mushcode-mcp.config.json')
  .action(async (options) => {
    try {
      const configManager = getConfig(options.config);
      const protocolHandler = new MushcodeProtocolHandler(configManager);
      
      // Initialize tools
      await protocolHandler.registerDefaultTools();
      const registry = protocolHandler.getRegistry();
      const tools = registry.getTools();

      console.log(`🛠️  Available MUSHCODE Tools (${tools.length}):`);
      console.log('');
      
      tools.forEach((tool, index) => {
        console.log(`${index + 1}. ${tool.name}`);
        console.log(`   📝 ${tool.description}`);
        const required = tool.inputSchema?.['required'];
        const params = Array.isArray(required) ? required.join(', ') : 'None';
        console.log(`   🔧 Parameters: ${params}`);
        console.log('');
      });
      
      console.log('💡 Use these tools via:');
      console.log('   • Claude Desktop (MCP protocol)');
      console.log('   • REST API (network mode)');
      console.log('   • Direct integration (npm package)');
    } catch (error) {
      console.error('❌ Failed to list tools:', error);
      process.exit(1);
    }
  });

// Config command (validate configuration)
program
  .command('config')
  .description('Validate configuration file')
  .option('-c, --config <path>', 'Path to configuration file', './mushcode-mcp.config.json')
  .action(async (options) => {
    try {
      const configManager = getConfig(options.config);
      const validation = configManager.validateConfig();
      
      if (validation.valid) {
        console.log('✅ Configuration is valid');
        
        const config = configManager.getConfig();
        console.log('');
        console.log('📋 Configuration Summary:');
        console.log(`   Server: ${config.server.name} v${config.server.version}`);
        console.log(`   Tools enabled: ${config.tools.enabled.length}`);
        console.log(`   Cache enabled: ${config.knowledge.cacheEnabled}`);
        console.log(`   Security validation: ${config.security.enableInputValidation}`);
      } else {
        console.error('❌ Configuration validation failed:');
        validation.errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Failed to validate configuration:', error);
      process.exit(1);
    }
  });

// Init command (create default configuration)
program
  .command('init')
  .description('Create a default configuration file')
  .option('-f, --force', 'Overwrite existing configuration file')
  .action(async (options) => {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const configPath = './mushcode-mcp.config.json';
    
    try {
      // Check if config already exists
      if (!options.force) {
        try {
          await fs.access(configPath);
          console.log('❌ Configuration file already exists. Use --force to overwrite.');
          process.exit(1);
        } catch {
          // File doesn't exist, continue
        }
      }
      
      // Copy default config
      const defaultConfig = path.join(process.cwd(), 'node_modules/mushcode-mcp-server/mushcode-mcp.config.json');
      await fs.copyFile(defaultConfig, configPath);
      
      console.log('✅ Created default configuration file: mushcode-mcp.config.json');
      console.log('');
      console.log('📝 Next steps:');
      console.log('   1. Edit the configuration file as needed');
      console.log('   2. Run: mushcode-mcp-server start');
      console.log('   3. Or: mushcode-mcp-server network --port 3001');
    } catch (error) {
      console.error('❌ Failed to create configuration file:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
