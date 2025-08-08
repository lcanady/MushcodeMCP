#!/usr/bin/env node
/**
 * Comprehensive knowledge base population including GitHub repositories
 * Combines existing mushcode.com data with GitHub repository content
 */
import 'dotenv/config';
import { MushcodeKnowledgeBase } from '../src/knowledge/base.js';
import { MushcodePopulator } from '../src/knowledge/populator.js';
import { KnowledgeBasePersistence } from '../src/knowledge/persistence.js';
import { logger } from '../src/utils/logger.js';
async function main() {
    console.log('🚀 Comprehensive MUSHCODE Knowledge Base Population');
    console.log('==================================================');
    console.log('This will populate the knowledge base with:');
    console.log('  • mushcode.com patterns and examples');
    console.log('  • Local help files from helps/ directory');
    console.log('  • GitHub repository content from:');
    console.log('    - thenomain/GMCCG');
    console.log('    - thenomain/Mu--Support-Systems');
    console.log('    - thenomain/liberation_sandbox');
    console.log('');
    // Initialize components
    const knowledgeBase = new MushcodeKnowledgeBase();
    const populator = new MushcodePopulator(knowledgeBase);
    const persistence = new KnowledgeBasePersistence();
    try {
        // Step 1: Populate from mushcode.com (existing functionality)
        console.log('📚 Step 1: Populating from mushcode.com...');
        await populator.populateFromMushcodeCom();
        const afterMushcodeStats = knowledgeBase.getStats();
        console.log('✅ mushcode.com population completed');
        console.log(`   Patterns: ${afterMushcodeStats.patterns}`);
        console.log(`   Examples: ${afterMushcodeStats.examples}`);
        console.log(`   Dialects: ${afterMushcodeStats.dialects}`);
        console.log(`   Security Rules: ${afterMushcodeStats.securityRules}`);
        console.log('');
        // Step 2: Populate from local help files
        console.log('📚 Step 2: Populating from local help files...');
        await populator.populateFromHelpFiles();
        const afterHelpStats = knowledgeBase.getStats();
        console.log('✅ Help file population completed');
        console.log(`   Patterns: ${afterHelpStats.patterns} (+${afterHelpStats.patterns - afterMushcodeStats.patterns})`);
        console.log(`   Examples: ${afterHelpStats.examples} (+${afterHelpStats.examples - afterMushcodeStats.examples})`);
        console.log(`   Dialects: ${afterHelpStats.dialects} (+${afterHelpStats.dialects - afterMushcodeStats.dialects})`);
        console.log(`   Security Rules: ${afterHelpStats.securityRules} (+${afterHelpStats.securityRules - afterMushcodeStats.securityRules})`);
        console.log('');
        // Step 3: Populate from GitHub repositories
        console.log('🐙 Step 3: Populating from GitHub repositories...');
        await populator.populateFromGitHub();
        const finalStats = knowledgeBase.getStats();
        console.log('✅ GitHub population completed');
        console.log(`   Patterns: ${finalStats.patterns} (+${finalStats.patterns - afterHelpStats.patterns})`);
        console.log(`   Examples: ${finalStats.examples} (+${finalStats.examples - afterHelpStats.examples})`);
        console.log(`   Dialects: ${finalStats.dialects} (+${finalStats.dialects - afterHelpStats.dialects})`);
        console.log(`   Security Rules: ${finalStats.securityRules} (+${finalStats.securityRules - afterHelpStats.securityRules})`);
        console.log('');
        // Step 4: Save the enhanced knowledge base
        console.log('💾 Step 4: Saving enhanced knowledge base...');
        await persistence.save(knowledgeBase);
        console.log('✅ Knowledge base saved successfully');
        console.log('');
        // Summary
        console.log('🎉 Knowledge Base Population Complete!');
        console.log('=====================================');
        console.log('Final Statistics:');
        console.log(`  📋 Patterns: ${finalStats.patterns}`);
        console.log(`  📝 Examples: ${finalStats.examples}`);
        console.log(`  🖥️  Dialects: ${finalStats.dialects}`);
        console.log(`  🔒 Security Rules: ${finalStats.securityRules}`);
        console.log(`  📚 Learning Paths: ${finalStats.learningPaths}`);
        console.log(`  📅 Last Updated: ${finalStats.lastUpdated}`);
        console.log('');
        console.log('Next Steps:');
        console.log('  1. Run `npm run build` to rebuild the server');
        console.log('  2. Test with `npm run test:comprehensive` to verify all functionality');
        console.log('  3. Start the server with enhanced knowledge base');
        console.log('');
        console.log('The knowledge base now includes:');
        console.log('  ✅ Core MUSHCODE patterns and examples');
        console.log('  ✅ All 5 server dialects (PennMUSH, TinyMUSH, RhostMUSH, TinyMUX, MUX)');
        console.log('  ✅ Security rules and best practices');
        console.log('  ✅ Real-world code examples from GitHub repositories');
        console.log('  ✅ Community-contributed patterns and utilities');
    }
    catch (error) {
        console.error('❌ Knowledge base population failed:', error);
        logger.error('Knowledge base population failed', error, {
            operation: 'populate_comprehensive_error'
        });
        process.exit(1);
    }
}
// Handle errors gracefully
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
    console.error('Script execution failed:', error);
    process.exit(1);
});
//# sourceMappingURL=populate-with-github.js.map