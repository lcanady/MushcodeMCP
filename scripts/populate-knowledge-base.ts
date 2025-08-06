#!/usr/bin/env node

/**
 * Script to populate the knowledge base from mushcode.com
 */

import { MushcodeKnowledgeBase } from '../src/knowledge/base.js';
import { MushcodePopulator } from '../src/knowledge/populator.js';

async function main() {
  console.log('🚀 Starting knowledge base population...');

  const knowledgeBase = new MushcodeKnowledgeBase();
  const populator = new MushcodePopulator(knowledgeBase);

  try {
    // Check if we already have saved data
    const hasSaved = await populator.hasSavedData();
    if (hasSaved) {
      const savedInfo = await populator.getSavedInfo();
      console.log('\n📁 Found existing knowledge base:');
      console.log(`   Version: ${savedInfo?.version}`);
      console.log(`   Last Updated: ${savedInfo?.lastUpdated}`);
      console.log(`   Total Files: ${savedInfo?.totalFiles}`);

      const answer = process.argv.includes('--force') ? 'y' :
        await askQuestion('\n❓ Do you want to re-scrape the entire site? (y/N): ');

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('\n📂 Loading existing knowledge base...');
        const loadedKB = await populator.loadFromFiles();
        displayStats(loadedKB);
        return;
      }
    }

    // Populate from the entire site
    console.log('\n🌐 Scraping entire mushcode.com site...');
    await populator.populateFromEntireSite();

    console.log('\n✅ Knowledge base population completed successfully!');
    displayStats(knowledgeBase);

  } catch (error) {
    console.error('❌ Error during population:', error);
    process.exit(1);
  }
}

function displayStats(knowledgeBase: MushcodeKnowledgeBase) {
  const stats = knowledgeBase.getStats();
  console.log('\n📊 Final Statistics:');
  console.log(`   Patterns: ${stats.patterns}`);
  console.log(`   Dialects: ${stats.dialects}`);
  console.log(`   Security Rules: ${stats.securityRules}`);
  console.log(`   Examples: ${stats.examples}`);
  console.log(`   Learning Paths: ${stats.learningPaths}`);
  console.log(`   Last Updated: ${stats.lastUpdated}`);
  console.log(`   Version: ${stats.version}`);

  // Show some sample data
  console.log('\n🔍 Sample Patterns:');
  const patterns = Array.from(knowledgeBase.patterns.values()).slice(0, 5);
  patterns.forEach(pattern => {
    console.log(`   - ${pattern.name} (${pattern.category}, ${pattern.difficulty})`);
  });

  console.log('\n📚 Sample Examples:');
  const examples = Array.from(knowledgeBase.examples.values()).slice(0, 5);
  examples.forEach(example => {
    console.log(`   - ${example.title} (${example.category}, ${example.difficulty})`);
  });
}

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });
}

// Run the main function
main().catch(console.error);

export { main };