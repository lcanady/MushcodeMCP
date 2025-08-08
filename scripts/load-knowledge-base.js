#!/usr/bin/env node
/**
 * Script to load and display knowledge base from JSON files
 */
import { KnowledgeBasePersistence } from '../src/knowledge/persistence.js';
async function main() {
    console.log('📂 Loading knowledge base from JSON files...');
    const persistence = new KnowledgeBasePersistence();
    try {
        // Check if knowledge base exists
        const exists = await persistence.exists();
        if (!exists) {
            console.log('❌ No saved knowledge base found.');
            console.log('💡 Run "npm run populate-kb" to create one.');
            process.exit(1);
        }
        // Get info about saved data
        const info = await persistence.getInfo();
        if (info) {
            console.log('\n📋 Knowledge Base Info:');
            console.log(`   Version: ${info.version}`);
            console.log(`   Last Updated: ${info.lastUpdated}`);
            console.log(`   Total Files Processed: ${info.totalFiles}`);
            console.log(`   Sources: ${info.sources.join(', ')}`);
        }
        // Load the knowledge base
        const knowledgeBase = await persistence.load();
        const stats = knowledgeBase.getStats();
        console.log('\n📊 Statistics:');
        console.log(`   Patterns: ${stats.patterns}`);
        console.log(`   Dialects: ${stats.dialects}`);
        console.log(`   Security Rules: ${stats.securityRules}`);
        console.log(`   Examples: ${stats.examples}`);
        console.log(`   Learning Paths: ${stats.learningPaths}`);
        // Show file sizes
        const fileSizes = await persistence.getFileSizes();
        console.log('\n💾 File Sizes:');
        Object.entries(fileSizes).forEach(([file, size]) => {
            const sizeKB = (size / 1024).toFixed(1);
            console.log(`   ${file}: ${sizeKB} KB`);
        });
        // Show some sample data
        console.log('\n🔍 Sample Patterns:');
        const patterns = Array.from(knowledgeBase.patterns.values()).slice(0, 3);
        patterns.forEach(pattern => {
            console.log(`   - ${pattern.name}`);
            console.log(`     Category: ${pattern.category}, Difficulty: ${pattern.difficulty}`);
            console.log(`     Servers: ${pattern.serverCompatibility.join(', ')}`);
            console.log(`     Tags: ${pattern.tags.slice(0, 3).join(', ')}`);
            console.log('');
        });
        console.log('📚 Sample Examples:');
        const examples = Array.from(knowledgeBase.examples.values()).slice(0, 3);
        examples.forEach(example => {
            console.log(`   - ${example.title}`);
            console.log(`     Category: ${example.category}, Difficulty: ${example.difficulty}`);
            console.log(`     Servers: ${example.serverCompatibility.join(', ')}`);
            console.log(`     Code Preview: ${example.code.substring(0, 60)}...`);
            console.log('');
        });
        // Show search capabilities
        console.log('🔍 Search Examples:');
        // Search for creation patterns
        const createResults = knowledgeBase.search({
            query: 'create object',
            includePatterns: true,
            includeExamples: false,
            limit: 3
        });
        console.log(`   "create object" found ${createResults.patterns.length} patterns:`);
        createResults.patterns.forEach(match => {
            const pattern = knowledgeBase.getPattern(match.patternId);
            console.log(`     - ${pattern?.name} (relevance: ${match.relevance.toFixed(2)})`);
        });
        // Search for function examples
        const functionResults = knowledgeBase.search({
            query: 'function',
            category: 'function',
            includePatterns: false,
            includeExamples: true,
            limit: 3
        });
        console.log(`\n   "function" examples found ${functionResults.examples.length}:`);
        functionResults.examples.forEach(match => {
            const example = knowledgeBase.getExample(match.exampleId);
            console.log(`     - ${example?.title} (relevance: ${match.relevance.toFixed(2)})`);
        });
        console.log('\n✅ Knowledge base loaded successfully!');
    }
    catch (error) {
        console.error('❌ Error loading knowledge base:', error);
        process.exit(1);
    }
}
// Run the main function
main().catch(console.error);
export { main };
//# sourceMappingURL=load-knowledge-base.js.map