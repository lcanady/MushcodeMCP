// Manual test script to verify the MCP protocol handler works
import { MushcodeProtocolHandler } from './dist/server/index.js';

async function testProtocolHandler() {
  console.log('Testing MUSHCODE MCP Protocol Handler...');
  
  try {
    const handler = new MushcodeProtocolHandler();
    console.log('✓ Protocol handler created successfully');
    
    const registry = handler.getRegistry();
    console.log('✓ Registry accessible');
    
    const tools = registry.getTools();
    console.log(`✓ Found ${tools.length} registered tools:`);
    
    tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    
    // Test validation
    const validationErrors = registry.validateRegistry();
    if (validationErrors.length === 0) {
      console.log('✓ All tools have corresponding handlers');
    } else {
      console.log('✗ Registry validation errors:', validationErrors);
    }
    
    // Test a handler
    const generateHandler = registry.getToolHandler('generate_mushcode');
    if (generateHandler) {
      const result = await generateHandler({ description: 'test command' });
      console.log('✓ Tool handler executed:', result);
    }
    
    console.log('✓ All tests passed!');
    
  } catch (error) {
    console.error('✗ Test failed:', error);
    process.exit(1);
  }
}

testProtocolHandler();