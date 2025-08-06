#!/usr/bin/env node

/**
 * Simple test script to verify the optimize_mushcode tool works
 */

import { optimizeMushcodeHandler } from './dist/tools/optimize.js';
import { MushcodeKnowledgeBase } from './dist/knowledge/base.js';

async function testOptimizeTool() {
  console.log('Testing optimize_mushcode tool...');
  
  const knowledgeBase = new MushcodeKnowledgeBase();
  
  // Test 1: Basic optimization
  console.log('\n1. Testing basic optimization:');
  try {
    const result = await optimizeMushcodeHandler({
      code: '@pemit %#=Hello World'
    }, knowledgeBase);
    
    console.log('✓ Basic optimization successful');
    console.log('  Original size:', result.optimization_summary.original_size);
    console.log('  Optimized size:', result.optimization_summary.optimized_size);
    console.log('  Improvements found:', result.improvements.length);
    console.log('  Performance impact:', result.performance_impact);
  } catch (error) {
    console.log('✗ Basic optimization failed:', error.message);
  }
  
  // Test 2: Performance optimization
  console.log('\n2. Testing performance optimization:');
  try {
    const result = await optimizeMushcodeHandler({
      code: '@pemit %#=[strlen(%0)] [strlen(%0)] [strlen(%0)]',
      optimization_goals: ['performance']
    }, knowledgeBase);
    
    console.log('✓ Performance optimization successful');
    console.log('  Improvements found:', result.improvements.length);
    const perfImprovements = result.improvements.filter(imp => imp.type === 'performance');
    console.log('  Performance improvements:', perfImprovements.length);
    if (perfImprovements.length > 0) {
      console.log('  First improvement:', perfImprovements[0].description);
    }
  } catch (error) {
    console.log('✗ Performance optimization failed:', error.message);
  }
  
  // Test 3: Security optimization
  console.log('\n3. Testing security optimization:');
  try {
    const result = await optimizeMushcodeHandler({
      code: '@destroy %0',
      optimization_goals: ['security']
    }, knowledgeBase);
    
    console.log('✓ Security optimization successful');
    console.log('  Improvements found:', result.improvements.length);
    const securityImprovements = result.improvements.filter(imp => imp.type === 'security');
    console.log('  Security improvements:', securityImprovements.length);
    if (securityImprovements.length > 0) {
      console.log('  First improvement:', securityImprovements[0].description);
    }
  } catch (error) {
    console.log('✗ Security optimization failed:', error.message);
  }
  
  // Test 4: Maintainability optimization
  console.log('\n4. Testing maintainability optimization:');
  try {
    const result = await optimizeMushcodeHandler({
      code: '@pemit %#=[if(gt(strlen(%0),50),Too long,OK)]',
      optimization_goals: ['maintainability']
    }, knowledgeBase);
    
    console.log('✓ Maintainability optimization successful');
    console.log('  Improvements found:', result.improvements.length);
    const maintainabilityImprovements = result.improvements.filter(imp => imp.type === 'maintainability');
    console.log('  Maintainability improvements:', maintainabilityImprovements.length);
    if (maintainabilityImprovements.length > 0) {
      console.log('  First improvement:', maintainabilityImprovements[0].description);
    }
  } catch (error) {
    console.log('✗ Maintainability optimization failed:', error.message);
  }
  
  // Test 5: Error handling
  console.log('\n5. Testing error handling:');
  try {
    await optimizeMushcodeHandler({
      code: ''
    }, knowledgeBase);
    console.log('✗ Error handling failed - should have thrown error');
  } catch (error) {
    console.log('✓ Error handling successful:', error.message);
  }
  
  console.log('\nOptimize tool testing completed!');
}

testOptimizeTool().catch(console.error);