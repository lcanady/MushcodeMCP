#!/usr/bin/env node

/**
 * Manual test for the compress_mushcode tool
 */

import { compressMushcodeHandler } from './dist/tools/compress.js';
import { MushcodeKnowledgeBase } from './dist/knowledge/base.js';

async function testCompress() {
  console.log('Testing compress_mushcode tool...\n');

  const knowledgeBase = new MushcodeKnowledgeBase();

  // Test 1: Basic compression
  console.log('=== Test 1: Basic Compression ===');
  const testCode1 = `@@ This is a comment
&cmd-greet me=$greet *:
  @@ Get the target player
  setq( 0 , pmatch( %0 ) );
  
  @@ Check if player exists
  @if not(isdbref(q(0)))={
    @pemit %#=Player not found.
  },{
    @@ Send greeting
    @pemit %#=You greet [name(q(0))].;
    @pemit q(0)=[name(%#)] greets you.
  }`;

  try {
    const result1 = await compressMushcodeHandler({
      code: testCode1,
      compression_level: 'moderate'
    }, knowledgeBase);

    console.log('Original size:', result1.original_size);
    console.log('Compressed size:', result1.compressed_size);
    console.log('Compression ratio:', (result1.compression_ratio * 100).toFixed(2) + '%');
    console.log('Optimizations applied:', result1.optimizations_applied);
    console.log('Compressed code:');
    console.log(result1.compressed_code);
    console.log('\n');
  } catch (error) {
    console.error('Test 1 failed:', error.message);
  }

  // Test 2: Aggressive compression
  console.log('=== Test 2: Aggressive Compression ===');
  const testCode2 = `&fun-calculate me=
  @@ Calculate complex formula
  setq( result , add( mul( %0 , %1 ) , div( %2 , %3 ) ) );
  
  @@ Return formatted result
  cat( Result: , q( result ) )`;

  try {
    const result2 = await compressMushcodeHandler({
      code: testCode2,
      compression_level: 'aggressive',
      preserve_functionality: true
    }, knowledgeBase);

    console.log('Original size:', result2.original_size);
    console.log('Compressed size:', result2.compressed_size);
    console.log('Compression ratio:', (result2.compression_ratio * 100).toFixed(2) + '%');
    console.log('Optimizations applied:', result2.optimizations_applied);
    if (result2.warnings) {
      console.log('Warnings:', result2.warnings);
    }
    console.log('Compressed code:');
    console.log(result2.compressed_code);
    console.log('\n');
  } catch (error) {
    console.error('Test 2 failed:', error.message);
  }

  // Test 3: Minimal compression with comment preservation
  console.log('=== Test 3: Minimal Compression (Preserve Comments) ===');
  const testCode3 = `@@ Important: This command requires wizard permissions
&cmd-shutdown me=$shutdown:
  @@ Check permissions
  @if not(hasflag(%#,W))={
    @pemit %#=Permission denied.
  },{
    @@ Shutdown the game
    @shutdown
  }`;

  try {
    const result3 = await compressMushcodeHandler({
      code: testCode3,
      compression_level: 'minimal',
      remove_comments: false
    }, knowledgeBase);

    console.log('Original size:', result3.original_size);
    console.log('Compressed size:', result3.compressed_size);
    console.log('Compression ratio:', (result3.compression_ratio * 100).toFixed(2) + '%');
    console.log('Optimizations applied:', result3.optimizations_applied);
    console.log('Compressed code:');
    console.log(result3.compressed_code);
    console.log('\n');
  } catch (error) {
    console.error('Test 3 failed:', error.message);
  }

  console.log('All tests completed!');
}

testCompress().catch(console.error);