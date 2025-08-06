/**
 * Unit tests for knowledge base operations
 */

import { MushcodeKnowledgeBase } from '../../../src/knowledge/base.js';
import {
  MushcodePattern,
  ServerDialect,
  SecurityRule,
  CodeExample,
  LearningPath,
  KnowledgeQuery
} from '../../../src/types/knowledge.js';

describe('MushcodeKnowledgeBase', () => {
  let knowledgeBase: MushcodeKnowledgeBase;

  beforeEach(() => {
    knowledgeBase = new MushcodeKnowledgeBase();
  });

  describe('Pattern Management', () => {
    const mockPattern: MushcodePattern = {
      id: 'test-pattern-1',
      name: 'Test Command',
      description: 'A test command pattern',
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
      tags: ['creation', 'object'],
      difficulty: 'beginner',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    test('should add and retrieve patterns', () => {
      knowledgeBase.addPattern(mockPattern);
      
      const retrieved = knowledgeBase.getPattern('test-pattern-1');
      expect(retrieved).toEqual(mockPattern);
    });

    test('should index patterns by category', () => {
      knowledgeBase.addPattern(mockPattern);
      
      const commandPatterns = knowledgeBase.getPatternsByCategory('command');
      expect(commandPatterns).toHaveLength(1);
      expect(commandPatterns[0]).toEqual(mockPattern);
    });

    test('should index patterns by server compatibility', () => {
      knowledgeBase.addPattern(mockPattern);
      
      const pennPatterns = knowledgeBase.getPatternsByServer('PennMUSH');
      expect(pennPatterns).toHaveLength(1);
      expect(pennPatterns[0]).toEqual(mockPattern);
    });

    test('should index patterns by difficulty', () => {
      knowledgeBase.addPattern(mockPattern);
      
      const beginnerPatterns = knowledgeBase.getPatternsByDifficulty('beginner');
      expect(beginnerPatterns).toHaveLength(1);
      expect(beginnerPatterns[0]).toEqual(mockPattern);
    });

    test('should handle multiple patterns in same category', () => {
      const pattern2: MushcodePattern = {
        ...mockPattern,
        id: 'test-pattern-2',
        name: 'Another Command'
      };

      knowledgeBase.addPattern(mockPattern);
      knowledgeBase.addPattern(pattern2);
      
      const commandPatterns = knowledgeBase.getPatternsByCategory('command');
      expect(commandPatterns).toHaveLength(2);
    });
  });

  describe('Dialect Management', () => {
    const mockDialect: ServerDialect = {
      name: 'PennMUSH',
      version: '1.8.8',
      description: 'PennMUSH server dialect',
      syntaxVariations: [],
      uniqueFeatures: [],
      securityModel: {
        permissionLevels: ['guest', 'player', 'builder', 'wizard', 'god'],
        defaultLevel: 'player',
        escalationRules: [],
        restrictedFunctions: []
      },
      functionLibrary: [],
      commonPatterns: [],
      limitations: [],
      documentation: {
        url: 'https://pennmush.org',
        version: '1.8.8'
      }
    };

    test('should add and retrieve dialects', () => {
      knowledgeBase.addDialect(mockDialect);
      
      const retrieved = knowledgeBase.getDialect('PennMUSH');
      expect(retrieved).toEqual(mockDialect);
    });

    test('should get all dialects', () => {
      knowledgeBase.addDialect(mockDialect);
      
      const allDialects = knowledgeBase.getAllDialects();
      expect(allDialects).toHaveLength(1);
      expect(allDialects[0]).toEqual(mockDialect);
    });
  });

  describe('Security Rule Management', () => {
    const mockSecurityRule: SecurityRule = {
      ruleId: 'SEC-001',
      name: 'Unsafe Eval',
      description: 'Detects potentially unsafe eval usage',
      severity: 'high',
      category: 'injection',
      pattern: '\\beval\\s*\\(',
      recommendation: 'Avoid using eval() with user input',
      examples: {
        vulnerable: 'eval(%0)',
        secure: 'switch(%0, case1, action1, case2, action2)',
        explanation: 'Use switch() instead of eval() for user input'
      },
      affectedServers: ['PennMUSH', 'TinyMUSH'],
      references: ['https://security.example.com/eval-risks']
    };

    test('should add and retrieve security rules', () => {
      knowledgeBase.addSecurityRule(mockSecurityRule);
      
      const retrieved = knowledgeBase.getSecurityRule('SEC-001');
      expect(retrieved).toEqual(mockSecurityRule);
    });

    test('should filter security rules by severity', () => {
      knowledgeBase.addSecurityRule(mockSecurityRule);
      
      const highSeverityRules = knowledgeBase.getSecurityRulesBySeverity('high');
      expect(highSeverityRules).toHaveLength(1);
      expect(highSeverityRules[0]).toEqual(mockSecurityRule);
    });

    test('should filter security rules by category', () => {
      knowledgeBase.addSecurityRule(mockSecurityRule);
      
      const injectionRules = knowledgeBase.getSecurityRulesByCategory('injection');
      expect(injectionRules).toHaveLength(1);
      expect(injectionRules[0]).toEqual(mockSecurityRule);
    });
  });

  describe('Example Management', () => {
    const mockExample: CodeExample = {
      id: 'example-1',
      title: 'Basic Object Creation',
      description: 'Shows how to create a simple object',
      code: '@create sword=A sharp blade\n@desc sword=This is a very sharp sword.',
      explanation: 'The @create command creates a new object with a name and description',
      difficulty: 'beginner',
      category: 'creation',
      tags: ['object', 'creation', 'basic'],
      serverCompatibility: ['PennMUSH', 'TinyMUSH'],
      relatedConcepts: ['objects', 'descriptions'],
      learningObjectives: ['Understand object creation', 'Learn basic syntax']
    };

    test('should add and retrieve examples', () => {
      knowledgeBase.addExample(mockExample);
      
      const retrieved = knowledgeBase.getExample('example-1');
      expect(retrieved).toEqual(mockExample);
    });

    test('should index examples by category', () => {
      knowledgeBase.addExample(mockExample);
      
      const creationExamples = knowledgeBase.getExamplesByCategory('creation');
      expect(creationExamples).toHaveLength(1);
      expect(creationExamples[0]).toEqual(mockExample);
    });

    test('should index examples by difficulty', () => {
      knowledgeBase.addExample(mockExample);
      
      const beginnerExamples = knowledgeBase.getExamplesByDifficulty('beginner');
      expect(beginnerExamples).toHaveLength(1);
      expect(beginnerExamples[0]).toEqual(mockExample);
    });
  });

  describe('Learning Path Management', () => {
    const mockLearningPath: LearningPath = {
      id: 'path-1',
      name: 'MUSHCODE Basics',
      description: 'Learn the fundamentals of MUSHCODE',
      difficulty: 'beginner',
      estimatedTime: '2 hours',
      prerequisites: [],
      steps: [
        {
          stepNumber: 1,
          title: 'Object Creation',
          description: 'Learn to create objects',
          exampleIds: ['example-1'],
          objectives: ['Create objects', 'Set descriptions']
        }
      ],
      resources: [
        {
          type: 'documentation',
          title: 'MUSHCODE Reference',
          url: 'https://mushcode.com'
        }
      ]
    };

    test('should add and retrieve learning paths', () => {
      knowledgeBase.addLearningPath(mockLearningPath);
      
      const retrieved = knowledgeBase.getLearningPath('path-1');
      expect(retrieved).toEqual(mockLearningPath);
    });

    test('should filter learning paths by difficulty', () => {
      knowledgeBase.addLearningPath(mockLearningPath);
      
      const beginnerPaths = knowledgeBase.getLearningPathsByDifficulty('beginner');
      expect(beginnerPaths).toHaveLength(1);
      expect(beginnerPaths[0]).toEqual(mockLearningPath);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      // Add test data
      const pattern: MushcodePattern = {
        id: 'search-pattern',
        name: 'Search Test',
        description: 'A pattern for testing search functionality',
        category: 'command',
        codeTemplate: '@test {{param}}',
        parameters: [],
        serverCompatibility: ['PennMUSH'],
        securityLevel: 'builder',
        examples: [],
        relatedPatterns: [],
        tags: ['test', 'search'],
        difficulty: 'beginner',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const example: CodeExample = {
        id: 'search-example',
        title: 'Search Example',
        description: 'An example for testing search',
        code: '@test hello',
        explanation: 'This tests the search functionality',
        difficulty: 'beginner',
        category: 'test',
        tags: ['test', 'example'],
        serverCompatibility: ['PennMUSH'],
        relatedConcepts: [],
        learningObjectives: []
      };

      knowledgeBase.addPattern(pattern);
      knowledgeBase.addExample(example);
    });

    test('should search patterns by query', () => {
      const query: KnowledgeQuery = {
        query: 'search test',
        includePatterns: true,
        includeExamples: false
      };

      const results = knowledgeBase.search(query);
      expect(results.patterns).toHaveLength(1);
      expect(results.patterns[0]?.patternId).toBe('search-pattern');
    });

    test('should search examples by query', () => {
      const query: KnowledgeQuery = {
        query: 'search example',
        includePatterns: false,
        includeExamples: true
      };

      const results = knowledgeBase.search(query);
      expect(results.examples).toHaveLength(1);
      expect(results.examples[0]?.exampleId).toBe('search-example');
    });

    test('should filter search by category', () => {
      const query: KnowledgeQuery = {
        query: 'test',
        category: 'command',
        includePatterns: true,
        includeExamples: false
      };

      const results = knowledgeBase.search(query);
      expect(results.patterns).toHaveLength(1);
    });

    test('should filter search by server type', () => {
      const query: KnowledgeQuery = {
        query: 'test',
        serverType: 'PennMUSH',
        includePatterns: true,
        includeExamples: true
      };

      const results = knowledgeBase.search(query);
      expect(results.patterns).toHaveLength(1);
      expect(results.examples).toHaveLength(1);
    });

    test('should limit search results', () => {
      const query: KnowledgeQuery = {
        query: 'test',
        limit: 1
      };

      const results = knowledgeBase.search(query);
      expect(results.patterns.length + results.examples.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Statistics and Metadata', () => {
    test('should provide accurate statistics', () => {
      const pattern: MushcodePattern = {
        id: 'stats-pattern',
        name: 'Stats Pattern',
        description: 'Pattern for stats testing',
        category: 'command',
        codeTemplate: '@stats',
        parameters: [],
        serverCompatibility: ['PennMUSH'],
        securityLevel: 'builder',
        examples: [],
        relatedPatterns: [],
        tags: ['stats'],
        difficulty: 'beginner',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      knowledgeBase.addPattern(pattern);

      const stats = knowledgeBase.getStats();
      expect(stats.patterns).toBe(1);
      expect(stats.dialects).toBe(0);
      expect(stats.securityRules).toBe(0);
      expect(stats.examples).toBe(0);
      expect(stats.learningPaths).toBe(0);
      expect(stats.version).toBe('1.0.0');
    });

    test('should update lastUpdated when adding data', () => {
      const initialTime = knowledgeBase.lastUpdated;
      
      // Wait a bit to ensure time difference
      setTimeout(() => {
        const pattern: MushcodePattern = {
          id: 'time-pattern',
          name: 'Time Pattern',
          description: 'Pattern for time testing',
          category: 'command',
          codeTemplate: '@time',
          parameters: [],
          serverCompatibility: ['PennMUSH'],
          securityLevel: 'builder',
          examples: [],
          relatedPatterns: [],
          tags: ['time'],
          difficulty: 'beginner',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        knowledgeBase.addPattern(pattern);
        expect(knowledgeBase.lastUpdated.getTime()).toBeGreaterThan(initialTime.getTime());
      }, 10);
    });
  });

  describe('Clear Functionality', () => {
    test('should clear all data and reset indexes', () => {
      // Add some test data
      const pattern: MushcodePattern = {
        id: 'clear-pattern',
        name: 'Clear Pattern',
        description: 'Pattern for clear testing',
        category: 'command',
        codeTemplate: '@clear',
        parameters: [],
        serverCompatibility: ['PennMUSH'],
        securityLevel: 'builder',
        examples: [],
        relatedPatterns: [],
        tags: ['clear'],
        difficulty: 'beginner',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      knowledgeBase.addPattern(pattern);
      expect(knowledgeBase.getStats().patterns).toBe(1);

      knowledgeBase.clear();
      
      const stats = knowledgeBase.getStats();
      expect(stats.patterns).toBe(0);
      expect(stats.dialects).toBe(0);
      expect(stats.securityRules).toBe(0);
      expect(stats.examples).toBe(0);
      expect(stats.learningPaths).toBe(0);
    });
  });
});