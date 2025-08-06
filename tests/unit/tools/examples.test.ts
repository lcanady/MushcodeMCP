/**
 * Unit tests for get_examples tool
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { getExamplesHandler, getExamplesTool } from '../../../src/tools/examples.js';
import { MushcodeKnowledgeBase } from '../../../src/knowledge/base.js';
import { ValidationError } from '../../../src/utils/errors.js';
import { CodeExample, LearningPath } from '../../../src/types/knowledge.js';

describe('get_examples tool', () => {
  let knowledgeBase: MushcodeKnowledgeBase;

  beforeEach(() => {
    knowledgeBase = new MushcodeKnowledgeBase();
    
    // Add test examples
    const testExamples: CodeExample[] = [
      {
        id: 'basic-object-creation',
        title: 'Basic Object Creation',
        description: 'Learn how to create basic objects in MUSHCODE',
        code: '@create Test Object\n@desc Test Object=This is a test object.',
        explanation: 'This code creates a basic object and sets its description.',
        difficulty: 'beginner',
        category: 'building',
        tags: ['object', 'creation', 'basic'],
        serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
        relatedConcepts: ['objects', 'descriptions'],
        learningObjectives: ['Create objects', 'Set descriptions'],
        source: {
          url: 'https://mushcode.com/example/basic-object',
          author: 'Test Author'
        }
      },
      {
        id: 'switch-conditional',
        title: 'Switch Conditional Logic',
        description: 'Using switch() for conditional programming',
        code: '&CMD.TEST me=$test *:@pemit %#=switch(%0,hello,Hello there!,goodbye,Goodbye!,I don\'t understand.)',
        explanation: 'This demonstrates using switch() for conditional responses.',
        difficulty: 'intermediate',
        category: 'functions',
        tags: ['switch', 'conditional', 'logic'],
        serverCompatibility: ['PennMUSH', 'TinyMUSH'],
        relatedConcepts: ['conditionals', 'functions', 'commands'],
        learningObjectives: ['Use switch function', 'Handle user input', 'Create conditional logic']
      },
      {
        id: 'advanced-security',
        title: 'Advanced Security Patterns',
        description: 'Implementing secure MUSHCODE with proper permission checks',
        code: '&CMD.ADMIN me=$admin *:@switch haspower(%#,wizard)=1,{@pemit %#=Admin command executed},{@pemit %#=Access denied}',
        explanation: 'This shows proper permission checking for administrative commands.',
        difficulty: 'advanced',
        category: 'security',
        tags: ['security', 'permissions', 'admin'],
        serverCompatibility: ['PennMUSH'],
        relatedConcepts: ['security', 'permissions', 'administration'],
        learningObjectives: ['Implement security checks', 'Use haspower function', 'Create admin commands']
      }
    ];

    testExamples.forEach(example => knowledgeBase.addExample(example));

    // Add test learning path
    const testLearningPath: LearningPath = {
      id: 'mushcode-basics',
      name: 'MUSHCODE Fundamentals',
      description: 'Learn the essential concepts and syntax of MUSHCODE programming',
      difficulty: 'beginner',
      estimatedTime: '4-6 hours',
      prerequisites: ['Basic understanding of MUD/MUSH concepts'],
      steps: [
        {
          stepNumber: 1,
          title: 'Object Creation and Management',
          description: 'Learn to create and manage basic objects',
          exampleIds: ['basic-object-creation'],
          objectives: ['Create objects using @create', 'Set object descriptions with @desc']
        },
        {
          stepNumber: 2,
          title: 'Conditional Logic with Switch',
          description: 'Master conditional programming with switch()',
          exampleIds: ['switch-conditional'],
          objectives: ['Understand switch() function syntax', 'Implement conditional logic safely']
        }
      ],
      resources: [
        {
          type: 'documentation',
          title: 'MUSHCode.com Archive',
          url: 'https://mushcode.com',
          description: 'Comprehensive archive of MUSHCODE examples and tutorials'
        }
      ]
    };

    knowledgeBase.addLearningPath(testLearningPath);
  });

  describe('tool definition', () => {
    it('should have correct name and description', () => {
      expect(getExamplesTool.name).toBe('get_examples');
      expect(getExamplesTool.description).toContain('Retrieve relevant MUSHCODE examples');
    });

    it('should have proper input schema', () => {
      expect(getExamplesTool.inputSchema).toBeDefined();
      expect(getExamplesTool.inputSchema.type).toBe('object');
      expect(getExamplesTool.inputSchema['required']).toContain('topic');
    });
  });

  describe('argument validation', () => {
    it('should require topic parameter', async () => {
      await expect(getExamplesHandler({}, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });

    it('should validate topic is a string', async () => {
      await expect(getExamplesHandler({ topic: 123 }, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });

    it('should validate topic is not empty', async () => {
      await expect(getExamplesHandler({ topic: '' }, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });

    it('should validate topic length', async () => {
      const longTopic = 'a'.repeat(201);
      await expect(getExamplesHandler({ topic: longTopic }, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });

    it('should validate difficulty enum', async () => {
      await expect(getExamplesHandler({ 
        topic: 'objects', 
        difficulty: 'invalid' 
      }, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });

    it('should validate server_type enum', async () => {
      await expect(getExamplesHandler({ 
        topic: 'objects', 
        server_type: 'InvalidMUSH' 
      }, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });

    it('should validate category enum', async () => {
      await expect(getExamplesHandler({ 
        topic: 'objects', 
        category: 'invalid_category' 
      }, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });

    it('should validate max_results range', async () => {
      await expect(getExamplesHandler({ 
        topic: 'objects', 
        max_results: 0 
      }, knowledgeBase))
        .rejects.toThrow(ValidationError);

      await expect(getExamplesHandler({ 
        topic: 'objects', 
        max_results: 51 
      }, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });

    it('should validate include_learning_path is boolean', async () => {
      await expect(getExamplesHandler({ 
        topic: 'objects', 
        include_learning_path: 'yes' 
      }, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('example retrieval', () => {
    it('should find examples by topic', async () => {
      const result = await getExamplesHandler({ topic: 'object' }, knowledgeBase);
      
      expect(result.examples).toBeDefined();
      expect(result.examples.length).toBeGreaterThan(0);
      expect(result.examples[0]?.title).toContain('Object');
    });

    it('should filter by difficulty', async () => {
      const result = await getExamplesHandler({ 
        topic: 'object', 
        difficulty: 'beginner' 
      }, knowledgeBase);
      
      expect(result.examples).toBeDefined();
      expect(result.examples.length).toBeGreaterThan(0);
      expect(result.examples.every(e => e.difficulty === 'beginner')).toBe(true);
    });

    it('should filter by category', async () => {
      const result = await getExamplesHandler({ 
        topic: 'switch', 
        category: 'functions' 
      }, knowledgeBase);
      
      expect(result.examples).toBeDefined();
      expect(result.examples.length).toBeGreaterThan(0);
      expect(result.examples.every(e => e.category === 'functions')).toBe(true);
    });

    it('should filter by server type', async () => {
      const result = await getExamplesHandler({ 
        topic: 'object', 
        server_type: 'PennMUSH' 
      }, knowledgeBase);
      
      expect(result.examples).toBeDefined();
      expect(result.examples.length).toBeGreaterThan(0);
      expect(result.examples.every(e => e.server_compatibility.includes('PennMUSH'))).toBe(true);
    });

    it('should limit results based on max_results', async () => {
      const result = await getExamplesHandler({ 
        topic: 'object', 
        max_results: 1 
      }, knowledgeBase);
      
      expect(result.examples.length).toBeLessThanOrEqual(1);
    });

    it('should sort results by relevance', async () => {
      const result = await getExamplesHandler({ topic: 'object' }, knowledgeBase);
      
      expect(result.examples.length).toBeGreaterThan(0);
      
      // Check that relevance scores are in descending order
      for (let i = 1; i < result.examples.length; i++) {
        expect(result.examples[i]?.relevance_score).toBeLessThanOrEqual(
          result.examples[i - 1]?.relevance_score || 0
        );
      }
    });

    it('should include relevance scores', async () => {
      const result = await getExamplesHandler({ topic: 'object' }, knowledgeBase);
      
      expect(result.examples.length).toBeGreaterThan(0);
      expect(result.examples[0]?.relevance_score).toBeDefined();
      expect(typeof result.examples[0]?.relevance_score).toBe('number');
      expect(result.examples[0]?.relevance_score).toBeGreaterThan(0);
    });
  });

  describe('learning path generation', () => {
    it('should include learning path by default', async () => {
      const result = await getExamplesHandler({ topic: 'mushcode' }, knowledgeBase);
      
      expect(result.learning_path).toBeDefined();
      expect(Array.isArray(result.learning_path)).toBe(true);
    });

    it('should exclude learning path when requested', async () => {
      const result = await getExamplesHandler({ 
        topic: 'object', 
        include_learning_path: false 
      }, knowledgeBase);
      
      expect(result.learning_path).toBeUndefined();
    });

    it('should find matching learning paths', async () => {
      const result = await getExamplesHandler({ topic: 'mushcode' }, knowledgeBase);
      
      expect(result.learning_path).toBeDefined();
      expect(result.learning_path!.length).toBeGreaterThan(0);
      expect(result.learning_path![0]?.title).toBeDefined();
      expect(result.learning_path![0]?.description).toBeDefined();
      expect(result.learning_path![0]?.objectives).toBeDefined();
    });

    it('should generate custom learning path from examples', async () => {
      const result = await getExamplesHandler({ topic: 'conditional' }, knowledgeBase);
      
      expect(result.learning_path).toBeDefined();
      expect(result.learning_path!.length).toBeGreaterThan(0);
    });
  });

  describe('additional resources', () => {
    it('should include additional resources', async () => {
      const result = await getExamplesHandler({ topic: 'object' }, knowledgeBase);
      
      expect(result.additional_resources).toBeDefined();
      expect(Array.isArray(result.additional_resources)).toBe(true);
      expect(result.additional_resources.length).toBeGreaterThan(0);
    });

    it('should include mushcode.com reference', async () => {
      const result = await getExamplesHandler({ topic: 'object' }, knowledgeBase);
      
      const mushcodeResource = result.additional_resources.find(
        r => r.url.includes('mushcode.com')
      );
      expect(mushcodeResource).toBeDefined();
    });

    it('should include category-specific resources', async () => {
      const result = await getExamplesHandler({ 
        topic: 'object', 
        category: 'building' 
      }, knowledgeBase);
      
      const buildingResource = result.additional_resources.find(
        r => r.description?.toLowerCase().includes('building')
      );
      expect(buildingResource).toBeDefined();
    });
  });

  describe('search metadata', () => {
    it('should include search metadata', async () => {
      const result = await getExamplesHandler({ topic: 'object' }, knowledgeBase);
      
      expect(result.search_metadata).toBeDefined();
      expect(result.search_metadata.query).toBe('object');
      expect(result.search_metadata.filters_applied).toBeDefined();
      expect(result.search_metadata.execution_time_ms).toBeDefined();
      expect(typeof result.search_metadata.execution_time_ms).toBe('number');
    });

    it('should track applied filters', async () => {
      const result = await getExamplesHandler({ 
        topic: 'object', 
        difficulty: 'beginner',
        category: 'building',
        max_results: 5
      }, knowledgeBase);
      
      expect(result.search_metadata.filters_applied).toContain('difficulty: beginner');
      expect(result.search_metadata.filters_applied).toContain('category: building');
      expect(result.search_metadata.filters_applied).toContain('max_results: 5');
    });

    it('should include total found count', async () => {
      const result = await getExamplesHandler({ topic: 'object' }, knowledgeBase);
      
      expect(result.total_found).toBeDefined();
      expect(typeof result.total_found).toBe('number');
      expect(result.total_found).toBeGreaterThanOrEqual(result.examples.length);
    });
  });

  describe('edge cases', () => {
    it('should handle empty knowledge base', async () => {
      const emptyKnowledgeBase = new MushcodeKnowledgeBase();
      const result = await getExamplesHandler({ topic: 'object' }, emptyKnowledgeBase);
      
      expect(result.examples).toBeDefined();
      expect(result.examples.length).toBe(0);
      expect(result.total_found).toBe(0);
    });

    it('should handle no matching examples', async () => {
      const result = await getExamplesHandler({ topic: 'nonexistent' }, knowledgeBase);
      
      expect(result.examples).toBeDefined();
      expect(result.examples.length).toBe(0);
      expect(result.total_found).toBe(0);
    });

    it('should handle special characters in topic', async () => {
      const result = await getExamplesHandler({ topic: 'object@#$%' }, knowledgeBase);
      
      expect(result).toBeDefined();
      expect(result.examples).toBeDefined();
    });

    it('should handle very long topic strings', async () => {
      const longTopic = 'object creation and management in mushcode environments';
      const result = await getExamplesHandler({ topic: longTopic }, knowledgeBase);
      
      expect(result).toBeDefined();
      expect(result.search_metadata.query).toBe(longTopic);
    });
  });

  describe('error handling', () => {
    it('should handle knowledge base errors gracefully', async () => {
      // Mock a knowledge base method to throw an error
      const mockKnowledgeBase = {
        getAllExamples: () => { throw new Error('Database error'); },
        getAllLearningPaths: () => []
      } as any;

      await expect(getExamplesHandler({ topic: 'object' }, mockKnowledgeBase))
        .rejects.toThrow('Example retrieval failed');
    });

    it('should preserve validation errors', async () => {
      await expect(getExamplesHandler({ topic: '' }, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });
  });
});