#!/usr/bin/env node

import { MushcodeKnowledgeBase } from './dist/knowledge/base.js';
import { MushcodePopulator } from './dist/knowledge/populator.js';
import { generateMushcodeHandler } from './dist/tools/generate.js';

async function testGenerateTool() {
  console.log('Testing generate_mushcode tool...');
  
  try {
    // Initialize knowledge base
    const knowledgeBase = new MushcodeKnowledgeBase();
    const populator = new MushcodePopulator(knowledgeBase);
    await populator.populateFromMushcodeCom();
    
    // Test basic command generation
    console.log('\n=== Testing basic command generation ===');
    const result1 = await generateMushcodeHandler({
      description: 'create a hello command that greets players'
    }, knowledgeBase);
    
    console.log('Generated code:');
    console.log(result1.code);
    console.log('\nExplanation:');
    console.log(result1.explanation);
    console.log('\nUsage example:');
    console.log(result1.usage_example);
    console.log('\nCompatibility:', result1.compatibility);
    
    // Test function generation
    console.log('\n=== Testing function generation ===');
    const result2 = await generateMushcodeHandler({
      description: 'create a function that adds two numbers',
      function_type: 'function',
      parameters: ['num1', 'num2']
    }, knowledgeBase);
    
    console.log('Generated code:');
    console.log(result2.code);
    console.log('\nExplanation:');
    console.log(result2.explanation);
    
    // Test server-specific generation
    console.log('\n=== Testing PennMUSH-specific generation ===');
    const result3 = await generateMushcodeHandler({
      description: 'create an admin command',
      server_type: 'PennMUSH',
      security_level: 'wizard'
    }, knowledgeBase);
    
    console.log('Generated code:');
    console.log(result3.code);
    console.log('\nSecurity notes:');
    console.log(result3.security_notes);
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testGenerateTool();