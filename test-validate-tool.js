#!/usr/bin/env node

/**
 * Demonstration script for the validate_mushcode tool
 */

import { validateMushcodeHandler } from './dist/tools/validate.js';
import { MushcodeKnowledgeBase } from './dist/knowledge/base.js';
import { MushcodePopulator } from './dist/knowledge/populator.js';

async function demonstrateValidation() {
  console.log('🔍 MUSHCODE Validation Tool Demonstration\n');

  // Set up knowledge base
  console.log('📚 Setting up knowledge base...');
  const knowledgeBase = new MushcodeKnowledgeBase();
  const populator = new MushcodePopulator(knowledgeBase);
  await populator.populateFromMushcodeCom();
  console.log('✅ Knowledge base ready!\n');

  // Test cases
  const testCases = [
    {
      name: 'Valid MUSHCODE',
      code: '@pemit me=Hello, World!;',
      description: 'Simple, well-formed command'
    },
    {
      name: 'Syntax Error',
      code: '@pemit me="Hello World',
      description: 'Unterminated string literal'
    },
    {
      name: 'Security Issue',
      code: 'eval(%0)',
      description: 'Unsafe eval() usage with user input'
    },
    {
      name: 'SQL Injection Risk',
      code: 'sql(SELECT * FROM users WHERE name=\'%0\')',
      description: 'Unsanitized user input in SQL query'
    },
    {
      name: 'Complex Code',
      code: 'switch(%0, hello, @pemit me=Hi there!, goodbye, @pemit me=Bye!, @pemit me=I don\'t understand)',
      description: 'Complex switch statement'
    },
    {
      name: 'Best Practice Issues',
      code: '   @pemit me=You have 12345 points',
      description: 'Bad indentation and magic numbers'
    }
  ];

  for (const testCase of testCases) {
    console.log(`🧪 Testing: ${testCase.name}`);
    console.log(`📝 Description: ${testCase.description}`);
    console.log(`💻 Code: ${testCase.code}`);
    
    try {
      const result = await validateMushcodeHandler({
        code: testCase.code,
        server_type: 'PennMUSH',
        strict_mode: false,
        check_security: true,
        check_best_practices: true
      }, knowledgeBase);

      console.log(`✅ Valid: ${result.is_valid}`);
      console.log(`📊 Analysis Summary:`);
      console.log(`   Lines: ${result.analysis_summary.total_lines}`);
      console.log(`   Complexity: ${result.analysis_summary.complexity_score}/100`);
      console.log(`   Security: ${result.analysis_summary.security_score}/100`);
      console.log(`   Maintainability: ${result.analysis_summary.maintainability_score}/100`);

      if (result.syntax_errors.length > 0) {
        console.log(`❌ Syntax Errors (${result.syntax_errors.length}):`);
        result.syntax_errors.forEach(error => {
          console.log(`   Line ${error.line}, Col ${error.column}: ${error.message} (${error.severity})`);
          if (error.suggestion) {
            console.log(`   💡 Suggestion: ${error.suggestion}`);
          }
        });
      }

      if (result.security_warnings.length > 0) {
        console.log(`🔒 Security Warnings (${result.security_warnings.length}):`);
        result.security_warnings.forEach(warning => {
          console.log(`   ${warning.ruleId}: ${warning.description} (${warning.severity})`);
          console.log(`   🛡️  Mitigation: ${warning.mitigation}`);
        });
      }

      if (result.best_practice_suggestions.length > 0) {
        console.log(`💡 Best Practice Suggestions (${result.best_practice_suggestions.length}):`);
        result.best_practice_suggestions.slice(0, 3).forEach(suggestion => {
          console.log(`   ${suggestion.type}: ${suggestion.description}`);
          console.log(`   📈 Impact: ${suggestion.impact}`);
        });
      }

      if (result.compatibility_notes.length > 0) {
        console.log(`⚠️  Compatibility Notes:`);
        result.compatibility_notes.forEach(note => {
          console.log(`   ${note}`);
        });
      }

    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    console.log('─'.repeat(80));
  }

  console.log('\n🎉 Validation demonstration complete!');
  console.log('\nThe validate_mushcode tool provides:');
  console.log('• Comprehensive syntax validation');
  console.log('• Security vulnerability detection');
  console.log('• Best practice suggestions');
  console.log('• Server compatibility checking');
  console.log('• Quality scoring and metrics');
}

// Run the demonstration
demonstrateValidation().catch(console.error);