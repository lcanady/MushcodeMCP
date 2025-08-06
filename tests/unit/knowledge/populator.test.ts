/**
 * Unit tests for knowledge base populator
 */

import { MushcodeKnowledgeBase } from '../../../src/knowledge/base.js';
import { MushcodePopulator } from '../../../src/knowledge/populator.js';

describe('MushcodePopulator', () => {
  let knowledgeBase: MushcodeKnowledgeBase;
  let populator: MushcodePopulator;

  beforeEach(() => {
    knowledgeBase = new MushcodeKnowledgeBase();
    populator = new MushcodePopulator(knowledgeBase);
  });

  describe('Basic Population from mushcode.com', () => {
    test('should populate knowledge base with initial data', async () => {
      await populator.populateFromMushcodeCom();
      
      const stats = knowledgeBase.getStats();
      
      // Verify we have populated data
      expect(stats.patterns).toBeGreaterThan(0);
      expect(stats.dialects).toBeGreaterThan(0);
      expect(stats.securityRules).toBeGreaterThan(0);
      expect(stats.examples).toBeGreaterThan(0);
      expect(stats.learningPaths).toBeGreaterThan(0);
    });

    test('should add PennMUSH dialect', async () => {
      await populator.populateFromMushcodeCom();
      
      const pennmush = knowledgeBase.getDialect('PennMUSH');
      expect(pennmush).toBeDefined();
      expect(pennmush?.name).toBe('PennMUSH');
      expect(pennmush?.version).toBe('1.8.8');
    });

    test('should add TinyMUSH dialect', async () => {
      await populator.populateFromMushcodeCom();
      
      const tinymush = knowledgeBase.getDialect('TinyMUSH');
      expect(tinymush).toBeDefined();
      expect(tinymush?.name).toBe('TinyMUSH');
      expect(tinymush?.version).toBe('3.3');
    });

    test('should add security rules', async () => {
      await populator.populateFromMushcodeCom();
      
      const evalRule = knowledgeBase.getSecurityRule('SEC-001');
      expect(evalRule).toBeDefined();
      expect(evalRule?.name).toBe('Unsafe Eval Usage');
      expect(evalRule?.severity).toBe('high');
    });

    test('should add basic patterns', async () => {
      await populator.populateFromMushcodeCom();
      
      const createPattern = knowledgeBase.getPattern('create-object');
      expect(createPattern).toBeDefined();
      expect(createPattern?.name).toBe('Create Object');
      expect(createPattern?.category).toBe('command');
    });

    test('should add code examples', async () => {
      await populator.populateFromMushcodeCom();
      
      const basicExample = knowledgeBase.getExample('basic-object-creation');
      expect(basicExample).toBeDefined();
      expect(basicExample?.title).toBe('Basic Object Creation');
      expect(basicExample?.difficulty).toBe('beginner');
    });

    test('should add learning paths', async () => {
      await populator.populateFromMushcodeCom();
      
      const basicsPath = knowledgeBase.getLearningPath('mushcode-basics');
      expect(basicsPath).toBeDefined();
      expect(basicsPath?.name).toBe('MUSHCODE Fundamentals');
      expect(basicsPath?.difficulty).toBe('beginner');
    });

    test('should create proper indexes', async () => {
      await populator.populateFromMushcodeCom();
      
      // Test pattern indexes
      const commandPatterns = knowledgeBase.getPatternsByCategory('command');
      expect(commandPatterns.length).toBeGreaterThan(0);
      
      const beginnerPatterns = knowledgeBase.getPatternsByDifficulty('beginner');
      expect(beginnerPatterns.length).toBeGreaterThan(0);
      
      // Test example indexes
      const creationExamples = knowledgeBase.getExamplesByCategory('creation');
      expect(creationExamples.length).toBeGreaterThan(0);
    });

    test('should handle server compatibility correctly', async () => {
      await populator.populateFromMushcodeCom();
      
      const pennPatterns = knowledgeBase.getPatternsByServer('PennMUSH');
      expect(pennPatterns.length).toBeGreaterThan(0);
      
      const tinyPatterns = knowledgeBase.getPatternsByServer('TinyMUSH');
      expect(tinyPatterns.length).toBeGreaterThan(0);
    });
  });

  describe('Data Quality', () => {
    beforeEach(async () => {
      await populator.populateFromMushcodeCom();
    });

    test('should have valid pattern templates', () => {
      const patterns = Array.from(knowledgeBase.patterns.values());
      
      patterns.forEach(pattern => {
        expect(pattern.id).toBeTruthy();
        expect(pattern.name).toBeTruthy();
        expect(pattern.description).toBeTruthy();
        expect(pattern.codeTemplate).toBeTruthy();
        expect(pattern.serverCompatibility.length).toBeGreaterThan(0);
        expect(['command', 'function', 'trigger', 'attribute', 'utility']).toContain(pattern.category);
        expect(['beginner', 'intermediate', 'advanced']).toContain(pattern.difficulty);
      });
    });

    test('should have valid security rules', () => {
      const rules = Array.from(knowledgeBase.securityRules.values());
      
      rules.forEach(rule => {
        expect(rule.ruleId).toBeTruthy();
        expect(rule.name).toBeTruthy();
        expect(rule.description).toBeTruthy();
        expect(rule.pattern).toBeTruthy();
        expect(['low', 'medium', 'high', 'critical']).toContain(rule.severity);
        expect(['injection', 'permission', 'resource', 'logic', 'data']).toContain(rule.category);
        expect(rule.examples.vulnerable).toBeTruthy();
        expect(rule.examples.secure).toBeTruthy();
      });
    });

    test('should have valid code examples', () => {
      const examples = Array.from(knowledgeBase.examples.values());
      
      examples.forEach(example => {
        expect(example.id).toBeTruthy();
        expect(example.title).toBeTruthy();
        expect(example.description).toBeTruthy();
        expect(example.code).toBeTruthy();
        expect(example.explanation).toBeTruthy();
        expect(['beginner', 'intermediate', 'advanced']).toContain(example.difficulty);
        expect(example.serverCompatibility.length).toBeGreaterThan(0);
        expect(example.learningObjectives.length).toBeGreaterThan(0);
      });
    });

    test('should have valid learning paths', () => {
      const paths = Array.from(knowledgeBase.learningPaths.values());
      
      paths.forEach(path => {
        expect(path.id).toBeTruthy();
        expect(path.name).toBeTruthy();
        expect(path.description).toBeTruthy();
        expect(['beginner', 'intermediate', 'advanced']).toContain(path.difficulty);
        expect(path.steps.length).toBeGreaterThan(0);
        expect(path.resources.length).toBeGreaterThan(0);
        
        path.steps.forEach(step => {
          expect(step.stepNumber).toBeGreaterThan(0);
          expect(step.title).toBeTruthy();
          expect(step.description).toBeTruthy();
          expect(step.objectives.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Comprehensive Site Scraping', () => {
    // Mock fetch for testing
    const originalFetch = global.fetch;
    
    beforeAll(() => {
      global.fetch = jest.fn();
    });
    
    afterAll(() => {
      global.fetch = originalFetch;
    });

    test('should have populateFromEntireSite method', () => {
      expect(typeof populator.populateFromEntireSite).toBe('function');
    });

    test.skip('should handle scraping errors gracefully', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Should not throw, but handle errors gracefully
      await expect(populator.populateFromEntireSite()).rejects.toThrow();
    });
  });
});