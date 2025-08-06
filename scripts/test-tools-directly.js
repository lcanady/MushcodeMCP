#!/usr/bin/env node

/**
 * Test individual MCP tools directly
 */

import { generateMushcodeHandler } from '../dist/tools/generate.js';
import { validateMushcodeHandler } from '../dist/tools/validate.js';
import { getExamplesHandler } from '../dist/tools/examples.js';
import { MushcodeKnowledgeBase } from '../dist/knowledge/base.js';
import { MushcodePopulator } from '../dist/knowledge/populator.js';

async function testTools() {
  console.log('🧪 Testing MUSHCODE MCP Tools directly...\n');

  // Initialize and populate knowledge base
  const knowledgeBase = new MushcodeKnowledgeBase();
  const populator = new MushcodePopulator(knowledgeBase);

  console.log('📚 Populating knowledge base...');
  await populator.populateFromMushcodeCom();
  console.log('✅ Knowledge base populated\n');

  // Test generate tool
  console.log('1. Testing generate_mushcode tool...');
  try {
    const generateResult = await generateMushcodeHandler({
      description: 'Create a simple greeting command',
      server_type: 'MUX',
      function_type: 'command'
    }, knowledgeBase);

    console.log('✅ Generate tool result:');
    console.log(JSON.stringify(generateResult, null, 2));
  } catch (error) {
    console.log('❌ Generate tool failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test validate tool
  console.log('2. Testing validate_mushcode tool...');
  try {
    const validateResult = await validateMushcodeHandler({
      code: '@create Test Command\n@set Test Command = COMMANDS\n&CMD Test Command = @pemit %# = Hello, %N!',
      server_type: 'PennMUSH'
    }, knowledgeBase);

    console.log('✅ Validate tool result:');
    console.log(JSON.stringify(validateResult, null, 2));
  } catch (error) {
    console.log('❌ Validate tool failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test examples tool
  console.log('3. Testing get_examples tool...');
  try {
    const examplesResult = await getExamplesHandler({
      topic: 'commands',
      server_type: 'PennMUSH',
      difficulty: 'beginner',
      limit: 3
    }, knowledgeBase);

    console.log('✅ Examples tool result:');
    console.log(JSON.stringify(examplesResult, null, 2));
  } catch (error) {
    console.log('❌ Examples tool failed:', error.message);
  }

  console.log('\n🎉 Tool testing completed!');
}

testTools().catch(console.error);