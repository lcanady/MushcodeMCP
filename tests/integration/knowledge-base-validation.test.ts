/**
 * Integration tests for knowledge base completeness and accuracy
 */

import { MushcodeKnowledgeBase } from '../../src/knowledge/base.js';
import { KnowledgeBasePersistence } from '../../src/knowledge/persistence.js';
// Import types for validation

describe('Knowledge Base Validation', () => {
  let knowledgeBase: MushcodeKnowledgeBase;
  let persistence: KnowledgeBasePersistence;

  beforeAll(async () => {
    persistence = new KnowledgeBasePersistence();
    knowledgeBase = await persistence.load();
  });

  describe('Data Completeness', () => {
    test('should have minimum required patterns', () => {
      const stats = knowledgeBase.getStats();
      expect(stats.patterns).toBeGreaterThanOrEqual(4);
    });

    test('should have minimum required examples', () => {
      const stats = knowledgeBase.getStats();
      expect(stats.examples).toBeGreaterThanOrEqual(3);
    });

    test('should have server dialect definitions', () => {
      const stats = knowledgeBase.getStats();
      expect(stats.dialects).toBeGreaterThanOrEqual(2);
      
      // Check for essential server dialects
      expect(knowledgeBase.getDialect('PennMUSH')).toBeDefined();
      expect(knowledgeBase.getDialect('TinyMUSH')).toBeDefined();
    });

    test('should have security rules', () => {
      const stats = knowledgeBase.getStats();
      expect(stats.securityRules).toBeGreaterThanOrEqual(3);
    });

    test('should have learning paths', () => {
      const stats = knowledgeBase.getStats();
      expect(stats.learningPaths).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Pattern Validation', () => {
    test('all patterns should have required fields', () => {
      const patterns = knowledgeBase.getAllPatterns();
      
      patterns.forEach(pattern => {
        expect(pattern.id).toBeTruthy();
        expect(pattern.name).toBeTruthy();
        expect(pattern.description).toBeTruthy();
        expect(pattern.category).toBeTruthy();
        expect(pattern.codeTemplate).toBeTruthy();
        expect(pattern.serverCompatibility.length).toBeGreaterThan(0);
        expect(pattern.securityLevel).toBeTruthy();
        expect(pattern.difficulty).toMatch(/^(beginner|intermediate|advanced)$/);
        expect(pattern.tags.length).toBeGreaterThan(0);
      });
    });

    test('patterns should cover essential categories', () => {
      const patterns = knowledgeBase.getAllPatterns();
      const categories = new Set(patterns.map(p => p.category));
      
      expect(categories).toContain('command');
      expect(categories).toContain('function');
    });

    test('patterns should cover different difficulty levels', () => {
      const patterns = knowledgeBase.getAllPatterns();
      const difficulties = new Set(patterns.map(p => p.difficulty));
      
      expect(difficulties).toContain('beginner');
      expect(difficulties).toContain('intermediate');
    });

    test('pattern code templates should be valid', () => {
      const patterns = knowledgeBase.getAllPatterns();
      
      patterns.forEach(pattern => {
        // Check that templates contain parameter placeholders
        if (pattern.parameters.length > 0) {
          pattern.parameters.forEach(param => {
            if (param.required) {
              const placeholder = `%{${param.name}}`;
              const upperPlaceholder = `%{${param.name.toUpperCase()}}`;
              const hasPlaceholder = pattern.codeTemplate.includes(placeholder) || 
                                   pattern.codeTemplate.includes(upperPlaceholder);
              expect(hasPlaceholder).toBe(true);
            }
          });
        }
      });
    });
  });

  describe('Example Validation', () => {
    test('all examples should have required fields', () => {
      const examples = knowledgeBase.getAllExamples();
      
      examples.forEach(example => {
        expect(example.id).toBeTruthy();
        expect(example.title).toBeTruthy();
        expect(example.description).toBeTruthy();
        expect(example.code).toBeTruthy();
        expect(example.explanation).toBeTruthy();
        expect(example.category).toBeTruthy();
        expect(example.difficulty).toMatch(/^(beginner|intermediate|advanced)$/);
        expect(example.serverCompatibility.length).toBeGreaterThan(0);
        expect(example.tags.length).toBeGreaterThan(0);
        expect(example.relatedConcepts.length).toBeGreaterThan(0);
        expect(example.learningObjectives.length).toBeGreaterThan(0);
      });
    });

    test('examples should cover essential categories', () => {
      const examples = knowledgeBase.getAllExamples();
      const categories = new Set(examples.map(e => e.category));
      
      expect(categories.size).toBeGreaterThanOrEqual(2);
    });

    test('examples should have valid MUSHCODE syntax', () => {
      const examples = knowledgeBase.getAllExamples();
      
      examples.forEach(example => {
        // Basic syntax validation
        expect(example.code).not.toContain('undefined');
        expect(example.code).not.toContain('null');
        
        // Should contain typical MUSHCODE elements
        const hasMushcodeElements = 
          example.code.includes('@') ||
          example.code.includes('&') ||
          example.code.includes('%') ||
          example.code.includes('switch(') ||
          example.code.includes('$');
          
        expect(hasMushcodeElements).toBe(true);
      });
    });
  });

  describe('Security Rule Validation', () => {
    test('all security rules should have required fields', () => {
      const rules = knowledgeBase.getAllSecurityRules();
      
      rules.forEach(rule => {
        expect(rule.ruleId).toBeTruthy();
        expect(rule.name).toBeTruthy();
        expect(rule.description).toBeTruthy();
        expect(rule.severity).toMatch(/^(low|medium|high|critical)$/);
        expect(rule.category).toBeTruthy();
        expect(rule.pattern).toBeTruthy();
        expect(rule.recommendation).toBeTruthy();
        expect(rule.examples.vulnerable).toBeTruthy();
        expect(rule.examples.secure).toBeTruthy();
        expect(rule.examples.explanation).toBeTruthy();
        expect(rule.affectedServers.length).toBeGreaterThan(0);
      });
    });

    test('security rules should cover critical vulnerabilities', () => {
      const rules = knowledgeBase.getAllSecurityRules();
      const categories = new Set(rules.map(r => r.category));
      
      expect(categories).toContain('injection');
      expect(categories).toContain('permission');
    });

    test('security rule patterns should be valid regex', () => {
      const rules = knowledgeBase.getAllSecurityRules();
      
      rules.forEach(rule => {
        expect(() => new RegExp(rule.pattern)).not.toThrow();
      });
    });
  });

  describe('Server Dialect Validation', () => {
    test('all dialects should have required fields', () => {
      const dialects = knowledgeBase.getAllDialects();
      
      dialects.forEach(dialect => {
        expect(dialect.name).toBeTruthy();
        expect(dialect.version).toBeTruthy();
        expect(dialect.description).toBeTruthy();
        expect(dialect.securityModel).toBeDefined();
        expect(dialect.securityModel.permissionLevels.length).toBeGreaterThan(0);
        expect(dialect.securityModel.defaultLevel).toBeTruthy();
        expect(dialect.documentation).toBeDefined();
        expect(dialect.documentation.url).toBeTruthy();
      });
    });

    test('dialects should have consistent permission models', () => {
      const dialects = knowledgeBase.getAllDialects();
      
      dialects.forEach(dialect => {
        const levels = dialect.securityModel.permissionLevels;
        expect(levels).toContain('player');
        expect(levels).toContain('wizard');
      });
    });
  });

  describe('Learning Path Validation', () => {
    test('all learning paths should have required fields', () => {
      const paths = knowledgeBase.getAllLearningPaths();
      
      paths.forEach(path => {
        expect(path.id).toBeTruthy();
        expect(path.name).toBeTruthy();
        expect(path.description).toBeTruthy();
        expect(path.difficulty).toMatch(/^(beginner|intermediate|advanced)$/);
        expect(path.estimatedTime).toBeTruthy();
        expect(path.steps.length).toBeGreaterThan(0);
        expect(path.resources.length).toBeGreaterThan(0);
      });
    });

    test('learning path steps should be properly structured', () => {
      const paths = knowledgeBase.getAllLearningPaths();
      
      paths.forEach(path => {
        path.steps.forEach(step => {
          expect(step.stepNumber).toBeGreaterThan(0);
          expect(step.title).toBeTruthy();
          expect(step.description).toBeTruthy();
          expect(step.objectives.length).toBeGreaterThan(0);
        });
      });
    });

    test('learning paths should reference valid examples', () => {
      const paths = knowledgeBase.getAllLearningPaths();
      
      paths.forEach(path => {
        path.steps.forEach(step => {
          if (step.exampleIds && step.exampleIds.length > 0) {
            step.exampleIds.forEach(exampleId => {
              const example = knowledgeBase.getExample(exampleId);
              expect(example).toBeDefined();
            });
          }
        });
      });
    });
  });

  describe('Search Functionality', () => {
    test('should find patterns by category', () => {
      const commandPatterns = knowledgeBase.getPatternsByCategory('command');
      expect(commandPatterns.length).toBeGreaterThan(0);
    });

    test('should find examples by difficulty', () => {
      const beginnerExamples = knowledgeBase.getExamplesByDifficulty('beginner');
      expect(beginnerExamples.length).toBeGreaterThan(0);
    });

    test('should search with text queries', () => {
      const results = knowledgeBase.search({
        query: 'command',
        includePatterns: true,
        includeExamples: true,
        limit: 10
      });
      
      expect(results.totalResults).toBeGreaterThanOrEqual(0);
      expect(results.executionTime).toBeGreaterThanOrEqual(0);
    });

    test('should filter by server compatibility', () => {
      const pennPatterns = knowledgeBase.getPatternsByServer('PennMUSH');
      expect(pennPatterns.length).toBeGreaterThan(0);
    });
  });

  describe('Data Integrity', () => {
    test('should have consistent metadata', () => {
      const stats = knowledgeBase.getStats();
      
      expect(stats.version).toBeTruthy();
      expect(stats.lastUpdated).toBeInstanceOf(Date);
      expect(stats.lastUpdated.getTime()).toBeLessThanOrEqual(Date.now());
    });

    test('should have no duplicate IDs', () => {
      const patterns = knowledgeBase.getAllPatterns();
      const examples = knowledgeBase.getAllExamples();
      const rules = knowledgeBase.getAllSecurityRules();
      const dialects = knowledgeBase.getAllDialects();
      const paths = knowledgeBase.getAllLearningPaths();
      
      const patternIds = new Set(patterns.map(p => p.id));
      const exampleIds = new Set(examples.map(e => e.id));
      const ruleIds = new Set(rules.map(r => r.ruleId));
      const dialectNames = new Set(dialects.map(d => d.name));
      const pathIds = new Set(paths.map(p => p.id));
      
      expect(patternIds.size).toBe(patterns.length);
      expect(exampleIds.size).toBe(examples.length);
      expect(ruleIds.size).toBe(rules.length);
      expect(dialectNames.size).toBe(dialects.length);
      expect(pathIds.size).toBe(paths.length);
    });

    test('should have valid cross-references', () => {
      const patterns = knowledgeBase.getAllPatterns();
      
      patterns.forEach(pattern => {
        // Check related patterns exist
        pattern.relatedPatterns.forEach(relatedId => {
          if (relatedId) {
            const relatedPattern = knowledgeBase.getPattern(relatedId);
            expect(relatedPattern).toBeDefined();
          }
        });
      });
    });
  });

  describe('Performance', () => {
    test('search operations should be fast', () => {
      const startTime = Date.now();
      
      knowledgeBase.search({
        query: 'function command pattern',
        includePatterns: true,
        includeExamples: true,
        limit: 50
      });
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('category lookups should be fast', () => {
      const startTime = Date.now();
      
      knowledgeBase.getPatternsByCategory('command');
      knowledgeBase.getExamplesByCategory('function');
      knowledgeBase.getPatternsByDifficulty('beginner');
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(100); // Should complete within 100ms
    });
  });
});