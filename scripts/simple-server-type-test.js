#!/usr/bin/env node

/**
 * Simple test to verify server type handling
 */

import { generateMushcodeHandler } from '../dist/tools/generate.js';
import { validateMushcodeHandler } from '../dist/tools/validate.js';
import { MushcodeKnowledgeBase } from '../dist/knowledge/base.js';
import { MushcodePopulator } from '../dist/knowledge/populator.js';

async function testServerTypes() {
  console.log('🧪 Testing Server Type Handling...\n');

  // Initialize knowledge base
  const knowledgeBase = new MushcodeKnowledgeBase();
  const populator = new MushcodePopulator(knowledgeBase);
  await populator.populateFromMushcodeCom();

  const serverTypes = ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX'];
  
  console.log('📊 Available dialects in knowledge base:');
  for (const dialect of knowledgeBase.getAllDialects()) {
    console.log(`  - ${dialect.name}: ${dialect.description}`);
  }
  console.log('');

  // Test each server type
  for (const serverType of serverTypes) {
    console.log(`🔍 Testing server type: ${serverType}`);
    
    try {
      // Test generate tool
      const generateResult = await generateMushcodeHandler({
        description: 'Create a simple test command',
        server_type: serverType,
        function_type: 'command'
      }, knowledgeBase);
      
      console.log(`  ✅ Generate: ${generateResult.compatibility.join(', ')}`);
      
      // Test validate tool
      const validateResult = await validateMushcodeHandler({
        code: '@create Test\n@set Test = COMMANDS',
        server_type: serverType
      }, knowledgeBase);
      
      console.log(`  ✅ Validate: ${validateResult.is_valid ? 'Valid' : 'Invalid'}`);
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }

  // Test invalid server type
  console.log('🔍 Testing invalid server type: InvalidServer');
  try {
    await generateMushcodeHandler({
      description: 'Create a test command',
      server_type: 'InvalidServer',
      function_type: 'command'
    }, knowledgeBase);
    console.log('  ❌ Should have failed but didn\'t');
  } catch (error) {
    console.log(`  ✅ Correctly rejected: ${error.message}`);
  }
}

testServerTypes().catch(console.error);