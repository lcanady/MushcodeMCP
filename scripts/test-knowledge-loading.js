#!/usr/bin/env node
/**
 * Test script to verify the knowledge base loading in the MCP server
 */
import 'dotenv/config';
import { MushcodeProtocolHandler } from '../src/server/protocol.js';
import { getConfig } from '../src/config/index.js';
async function testKnowledgeLoading() {
    console.log('🧪 Testing Knowledge Base Loading');
    console.log('=================================');
    try {
        // Initialize the protocol handler (this will load the knowledge base)
        const configManager = getConfig();
        const protocolHandler = new MushcodeProtocolHandler(configManager);
        console.log('📚 Registering tools and loading knowledge base...');
        await protocolHandler.registerDefaultTools();
        const registry = protocolHandler.getRegistry();
        const tools = registry.getTools();
        console.log(`✅ Successfully loaded ${tools.length} tools`);
        console.log('Available tools:');
        for (const tool of tools) {
            console.log(`  - ${tool.name}: ${tool.description}`);
        }
        console.log('\n🎉 Knowledge base loading test completed successfully!');
        console.log('The MCP server should now have access to:');
        console.log('  • Basic MUSHCODE patterns');
        console.log('  • RhostMUSH help file content (2000+ examples)');
        console.log('  • GitHub repository patterns');
    }
    catch (error) {
        console.error('❌ Knowledge base loading test failed:', error);
        process.exit(1);
    }
}
testKnowledgeLoading().catch(console.error);
//# sourceMappingURL=test-knowledge-loading.js.map