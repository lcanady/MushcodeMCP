#!/usr/bin/env node
/**
 * Script to process local help files and add them to the knowledge base
 * Processes all .txt files in the helps/ directory
 */
import 'dotenv/config';
import { MushcodeKnowledgeBase } from '../src/knowledge/base.js';
import { HelpFileProcessor } from '../src/knowledge/help-processor.js';
import { KnowledgeBasePersistence } from '../src/knowledge/persistence.js';
import { logger } from '../src/utils/logger.js';
async function main() {
    console.log('📚 Help File Processor for MUSHCODE MCP Server');
    console.log('===============================================');
    // Initialize knowledge base
    const knowledgeBase = new MushcodeKnowledgeBase();
    const persistence = new KnowledgeBasePersistence();
    const processor = new HelpFileProcessor(knowledgeBase);
    // Load existing knowledge base
    try {
        const existingKB = await persistence.load();
        // Copy existing data
        for (const pattern of existingKB.getAllPatterns()) {
            knowledgeBase.addPattern(pattern);
        }
        for (const example of existingKB.getAllExamples()) {
            knowledgeBase.addExample(example);
        }
        for (const dialect of existingKB.getAllDialects()) {
            knowledgeBase.addDialect(dialect);
        }
        for (const rule of existingKB.getAllSecurityRules()) {
            knowledgeBase.addSecurityRule(rule);
        }
        console.log('✅ Loaded existing knowledge base');
    }
    catch (error) {
        console.log('ℹ️  No existing knowledge base found, starting fresh');
    }
    console.log('\n📁 Processing help files from helps/ directory...');
    console.log('');
    // Get initial stats
    const initialStats = knowledgeBase.getStats();
    console.log('📊 Initial Knowledge Base Stats:');
    console.log(`  - Patterns: ${initialStats.patterns}`);
    console.log(`  - Examples: ${initialStats.examples}`);
    console.log(`  - Dialects: ${initialStats.dialects}`);
    console.log(`  - Security Rules: ${initialStats.securityRules}`);
    console.log('');
    try {
        // Process help files
        await processor.processHelpFiles();
        // Get final stats
        const finalStats = knowledgeBase.getStats();
        console.log('📊 Final Knowledge Base Stats:');
        console.log(`  - Patterns: ${finalStats.patterns} (+${finalStats.patterns - initialStats.patterns})`);
        console.log(`  - Examples: ${finalStats.examples} (+${finalStats.examples - initialStats.examples})`);
        console.log(`  - Dialects: ${finalStats.dialects} (+${finalStats.dialects - initialStats.dialects})`);
        console.log(`  - Security Rules: ${finalStats.securityRules} (+${finalStats.securityRules - initialStats.securityRules})`);
        console.log('');
        // Save updated knowledge base
        console.log('💾 Saving updated knowledge base...');
        await persistence.save(knowledgeBase);
        console.log('✅ Knowledge base saved successfully');
        console.log('\n🎉 Help file processing completed successfully!');
        console.log('\nNext steps:');
        console.log('  1. Run `npm run build` to rebuild the server');
        console.log('  2. Test with `npm run test:tools` to verify new content');
        console.log('  3. Use the enhanced knowledge base with your MCP server');
    }
    catch (error) {
        console.error('❌ Help file processing failed:', error);
        logger.error('Help file processing failed', error, {
            operation: 'help_process_main_error'
        });
        process.exit(1);
    }
}
// Handle errors
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
// Run the script
main().catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
});
//# sourceMappingURL=process-help-files.js.map