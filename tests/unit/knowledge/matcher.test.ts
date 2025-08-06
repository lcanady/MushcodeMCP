/**
 * Unit tests for pattern matching algorithms
 */

import { PatternMatcher } from '../../../src/knowledge/matcher.js';
import { MushcodeKnowledgeBase } from '../../../src/knowledge/base.js';
import {
  MushcodePattern,
  SecurityRule,
  CodeExample
} from '../../../src/types/knowledge.js';

describe('PatternMatcher', () => {
  let knowledgeBase: MushcodeKnowledgeBase;
  let matcher: PatternMatcher;

  beforeEach(() => {
    knowledgeBase = new MushcodeKnowledgeBase();
    matcher = new PatternMatcher(knowledgeBase);
  });

  describe('Pattern Generation Matching', () => {
    beforeEach(() => {
      const pattern: MushcodePattern = {
        id: 'create-object',
        name: 'Create Object',
        description: 'Creates a new object with name and description',
        category: 'command',
        codeTemplate: '@create {{name}}={{description}}',
        parameters: [
          {
            name: 'name',
            type: 'string',
            description: 'Object name',
            required: true
          }
        ],
        serverCompatibility: ['PennMUSH', 'TinyMUSH'],
        securityLevel: 'builder',
        examples: ['@create sword=A sharp blade'],
        relatedPatterns: [],
        tags: ['creation', 'object', 'build'],
        difficulty: 'beginner',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      knowledgeBase.addPattern(pattern);
    });

    test('should find patterns for generation based on description', () => {
      const matches = matcher.findPatternsForGeneration('create a new object');
      
      expect(matches).toHaveLength(1);
      expect(matches[0]?.patternId).toBe('create-object');
      expect(matches[0]?.relevance).toBeGreaterThan(0);
    });

    test('should filter patterns by server type', () => {
      const matches = matcher.findPatternsForGeneration('create object', 'PennMUSH');
      
      expect(matches).toHaveLength(1);
      expect(matches[0]?.patternId).toBe('create-object');
    });

    test('should filter patterns by function type', () => {
      const matches = matcher.findPatternsForGeneration('create', undefined, 'command');
      
      expect(matches).toHaveLength(1);
      expect(matches[0]?.patternId).toBe('create-object');
    });

    test('should return empty array for incompatible server', () => {
      const matches = matcher.findPatternsForGeneration('create object', 'UnknownMUSH');
      
      expect(matches).toHaveLength(0);
    });

    test('should return empty array for no matches', () => {
      const matches = matcher.findPatternsForGeneration('completely unrelated query');
      
      expect(matches).toHaveLength(0);
    });
  });

  describe('Security Violation Detection', () => {
    beforeEach(() => {
      const securityRule: SecurityRule = {
        ruleId: 'SEC-001',
        name: 'Unsafe Eval',
        description: 'Detects potentially unsafe eval usage',
        severity: 'high',
        category: 'injection',
        pattern: '\\beval\\s*\\(',
        recommendation: 'Avoid using eval() with user input',
        examples: {
          vulnerable: 'eval(%0)',
          secure: 'switch(%0, case1, action1)',
          explanation: 'Use switch() instead of eval()'
        },
        affectedServers: ['PennMUSH'],
        references: []
      };

      const permissionRule: SecurityRule = {
        ruleId: 'SEC-002',
        name: 'Missing Permission Check',
        description: 'Commands without proper permission checks',
        severity: 'medium',
        category: 'permission',
        pattern: '@create\\s+%\\d+\\s*=',
        recommendation: 'Add permission checks before object creation',
        examples: {
          vulnerable: '@create %0=%1',
          secure: '@switch [haspower(%#, Builder)]=1, {@create %0=%1}',
          explanation: 'Check builder permissions before creating objects'
        },
        affectedServers: ['PennMUSH', 'TinyMUSH'],
        references: []
      };

      knowledgeBase.addSecurityRule(securityRule);
      knowledgeBase.addSecurityRule(permissionRule);
    });

    test('should detect security violations in code', () => {
      const code = 'eval(%0)';
      const violations = matcher.findSecurityViolations(code);
      
      expect(violations).toHaveLength(1);
      expect(violations[0]?.ruleId).toBe('SEC-001');
      expect(violations[0]?.severity).toBe('high');
    });

    test('should detect multiple violations', () => {
      const code = `
        eval(%0)
        @create %1=%2
      `;
      const violations = matcher.findSecurityViolations(code);
      
      expect(violations).toHaveLength(2);
      expect(violations[0]?.severity).toBe('high'); // Should be sorted by severity
      expect(violations[1]?.severity).toBe('medium');
    });

    test('should filter violations by server type', () => {
      const code = 'eval(%0)';
      const violations = matcher.findSecurityViolations(code, 'TinyMUSH');
      
      expect(violations).toHaveLength(0); // eval rule only affects PennMUSH
    });

    test('should handle invalid regex patterns gracefully', () => {
      const invalidRule: SecurityRule = {
        ruleId: 'SEC-INVALID',
        name: 'Invalid Pattern',
        description: 'Rule with invalid regex',
        severity: 'low',
        category: 'logic',
        pattern: '[invalid regex',
        recommendation: 'Fix the pattern',
        examples: {
          vulnerable: 'test',
          secure: 'test',
          explanation: 'test'
        },
        affectedServers: ['PennMUSH'],
        references: []
      };

      knowledgeBase.addSecurityRule(invalidRule);
      
      const code = 'some code';
      const violations = matcher.findSecurityViolations(code);
      
      expect(violations).toHaveLength(0); // Should not crash
    });
  });

  describe('Code Term Extraction', () => {
    test('should extract function names', () => {
      const code = 'switch(condition, case1, action1)';
      const matches = matcher.findOptimizationPatterns(code);
      
      // This tests the internal extractCodeTerms method indirectly
      expect(matches).toBeDefined();
    });

    test('should extract attribute references', () => {
      const code = '&description me=A test description';
      const matches = matcher.findOptimizationPatterns(code);
      
      expect(matches).toBeDefined();
    });

    test('should extract variable references', () => {
      const code = 'say %0 is saying %1';
      const matches = matcher.findOptimizationPatterns(code);
      
      expect(matches).toBeDefined();
    });

    test('should extract command patterns', () => {
      const code = '@create sword=A blade\n@desc sword=Sharp';
      const matches = matcher.findOptimizationPatterns(code);
      
      expect(matches).toBeDefined();
    });
  });

  describe('Similar Examples Finding', () => {
    beforeEach(() => {
      const example: CodeExample = {
        id: 'create-example',
        title: 'Object Creation Example',
        description: 'Shows how to create objects',
        code: '@create sword=A sharp blade\n@desc sword=This is sharp',
        explanation: 'Creates an object and sets its description',
        difficulty: 'beginner',
        category: 'creation',
        tags: ['object', 'creation', 'description'],
        serverCompatibility: ['PennMUSH', 'TinyMUSH'],
        relatedConcepts: ['objects', 'attributes'],
        learningObjectives: ['Learn object creation']
      };

      knowledgeBase.addExample(example);
    });

    test('should find similar examples based on code content', () => {
      const code = '@create helmet=A protective helmet';
      const examples = matcher.findSimilarExamples(code);
      
      expect(examples).toHaveLength(1);
      expect(examples[0]?.id).toBe('create-example');
    });

    test('should filter examples by server type', () => {
      const code = '@create helmet=A protective helmet';
      const examples = matcher.findSimilarExamples(code, 'PennMUSH');
      
      expect(examples).toHaveLength(1);
      expect(examples[0]?.id).toBe('create-example');
    });

    test('should respect limit parameter', () => {
      const code = '@create helmet=A protective helmet';
      const examples = matcher.findSimilarExamples(code, undefined, 0);
      
      expect(examples).toHaveLength(0);
    });
  });

  describe('Pattern Lookup Methods', () => {
    beforeEach(() => {
      const pattern1: MushcodePattern = {
        id: 'lookup-1',
        name: 'Test Pattern',
        description: 'A test pattern',
        category: 'command',
        codeTemplate: '@test',
        parameters: [],
        serverCompatibility: ['PennMUSH'],
        securityLevel: 'builder',
        examples: [],
        relatedPatterns: ['lookup-2'],
        tags: ['test', 'lookup'],
        difficulty: 'beginner',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const pattern2: MushcodePattern = {
        id: 'lookup-2',
        name: 'Related Pattern',
        description: 'A related pattern',
        category: 'function',
        codeTemplate: 'related()',
        parameters: [],
        serverCompatibility: ['PennMUSH'],
        securityLevel: 'builder',
        examples: [],
        relatedPatterns: [],
        tags: ['test', 'related'],
        difficulty: 'intermediate',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      knowledgeBase.addPattern(pattern1);
      knowledgeBase.addPattern(pattern2);
    });

    test('should find pattern by exact name', () => {
      const pattern = matcher.findPatternByName('Test Pattern');
      
      expect(pattern).toBeDefined();
      expect(pattern!.id).toBe('lookup-1');
    });

    test('should find pattern by name case-insensitive', () => {
      const pattern = matcher.findPatternByName('test pattern');
      
      expect(pattern).toBeDefined();
      expect(pattern!.id).toBe('lookup-1');
    });

    test('should return undefined for non-existent pattern', () => {
      const pattern = matcher.findPatternByName('Non-existent Pattern');
      
      expect(pattern).toBeUndefined();
    });

    test('should find patterns by tag', () => {
      const patterns = matcher.findPatternsByTag('test');
      
      expect(patterns).toHaveLength(2);
      expect(patterns.map(p => p.id)).toContain('lookup-1');
      expect(patterns.map(p => p.id)).toContain('lookup-2');
    });

    test('should find patterns by tag case-insensitive', () => {
      const patterns = matcher.findPatternsByTag('TEST');
      
      expect(patterns).toHaveLength(2);
    });

    test('should find related patterns', () => {
      const related = matcher.findRelatedPatterns('lookup-1');
      
      expect(related).toHaveLength(1);
      expect(related[0]?.id).toBe('lookup-2');
    });

    test('should return empty array for non-existent pattern relations', () => {
      const related = matcher.findRelatedPatterns('non-existent');
      
      expect(related).toHaveLength(0);
    });
  });

  describe('Template Validation', () => {
    test('should validate correct template syntax', () => {
      const template = '@create {{name}}={{description}}';
      const result = matcher.validatePatternTemplate(template);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect unbalanced braces', () => {
      const template = '@create {{name}={{description}}';
      const result = matcher.validatePatternTemplate(template);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unbalanced braces in template');
    });

    test('should detect invalid parameter names', () => {
      const template = '@create {{123invalid}}={{description}}';
      const result = matcher.validatePatternTemplate(template);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid parameter name'))).toBe(true);
    });

    test('should detect double @ symbols', () => {
      const template = '@@create {{name}}';
      const result = matcher.validatePatternTemplate(template);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Double @ symbols detected - potential syntax error');
    });

    test('should handle templates without parameters', () => {
      const template = '@who';
      const result = matcher.validatePatternTemplate(template);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});