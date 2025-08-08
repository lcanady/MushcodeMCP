#!/usr/bin/env node

/**
 * Node.js version of the populate script (no tsx dependency)
 */

import 'dotenv/config';
import { MushcodeKnowledgeBase } from '../dist/knowledge/base.js';
import { MushcodePopulator } from '../dist/knowledge/populator.js';
import { KnowledgeBasePersistence } from '../dist/knowledge/persistence.js';

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
    // Step 1: Populate from mushcode.com
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

  } catch (error) {
    console.error('❌ Knowledge base population failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);