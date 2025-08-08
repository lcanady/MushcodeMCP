#!/usr/bin/env node
/**
 * Script to scrape MUSHCODE content from GitHub repositories
 * Adds content from specified repositories to the knowledge base
 */
import 'dotenv/config';
import { MushcodeKnowledgeBase } from '../src/knowledge/base.js';
import { GitHubScraper } from '../src/knowledge/github-scraper.js';
import { KnowledgeBasePersistence } from '../src/knowledge/persistence.js';
import { logger } from '../src/utils/logger.js';
async function main() {
    console.log('🐙 GitHub Repository Scraper for MUSHCODE MCP Server');
    console.log('====================================================');
    // Initialize knowledge base
    const knowledgeBase = new MushcodeKnowledgeBase();
    const persistence = new KnowledgeBasePersistence();
    // Get GitHub token from environment variable
    const githubToken = process.env['GITHUB_TOKEN'];
    if (!githubToken) {
        console.log('⚠️  No GITHUB_TOKEN environment variable found.');
        console.log('   This will use unauthenticated requests (60 requests/hour limit).');
        console.log('   For better rate limits (5000 requests/hour), create a GitHub Personal Access Token:');
        console.log('   1. Go to https://github.com/settings/tokens');
        console.log('   2. Click "Generate new token (classic)"');
        console.log('   3. Select "public_repo" scope');
        console.log('   4. Set GITHUB_TOKEN environment variable: export GITHUB_TOKEN=your_token_here');
        console.log('');
    }
    else {
        console.log('✅ Using GitHub token for authenticated requests (5000 requests/hour limit)');
        console.log('');
    }
    const scraper = new GitHubScraper(knowledgeBase, githubToken);
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
    // Define repositories to scrape
    const repositories = [
        {
            owner: 'thenomain',
            name: 'GMCCG',
            description: 'Game Master\'s Creative Coding Guide - MUSHCODE examples and utilities'
        },
        {
            owner: 'thenomain',
            name: 'Mu--Support-Systems',
            description: 'MU* Support Systems - Comprehensive MUSHCODE support systems'
        },
        {
            owner: 'thenomain',
            name: 'liberation_sandbox',
            description: 'Liberation MUSH sandbox - Additional MUSHCODE examples and systems'
        }
    ];
    console.log(`\n📚 Scraping ${repositories.length} repositories:`);
    for (const repo of repositories) {
        console.log(`  - ${repo.owner}/${repo.name}: ${repo.description}`);
    }
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
        // Scrape repositories
        await scraper.scrapeRepositories(repositories);
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
        console.log('\n🎉 GitHub scraping completed successfully!');
        console.log('\nNext steps:');
        console.log('  1. Run `npm run build` to rebuild the server');
        console.log('  2. Test with `npm run test:tools` to verify new content');
        console.log('  3. Use the enhanced knowledge base with your MCP server');
    }
    catch (error) {
        console.error('❌ GitHub scraping failed:', error);
        logger.error('GitHub scraping failed', error, {
            operation: 'github_scrape_main_error'
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
//# sourceMappingURL=scrape-github-repos.js.map