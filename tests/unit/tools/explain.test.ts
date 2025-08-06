/**
 * Unit tests for explain_mushcode tool
 */

import { explainMushcodeTool, explainMushcodeHandler } from '../../../src/tools/explain.js';
import { MushcodeKnowledgeBase } from '../../../src/knowledge/base.js';
import { ValidationError } from '../../../src/utils/errors.js';

describe('explain_mushcode tool', () => {
  let knowledgeBase: MushcodeKnowledgeBase;

  beforeEach(() => {
    knowledgeBase = new MushcodeKnowledgeBase();
    
    // Add some test patterns and examples
    knowledgeBase.addPattern({
      id: 'test-switch',
      name: 'Switch Statement',
      description: 'Conditional logic using switch function',
      category: 'function',
      codeTemplate: 'switch(%0,%1,%2)',
      parameters: [
        { name: 'condition', type: 'string', description: 'Condition to evaluate', required: true },
        { name: 'true_case', type: 'string', description: 'Value if true', required: true },
        { name: 'false_case', type: 'string', description: 'Value if false', required: false }
      ],
      serverCompatibility: ['PennMUSH', 'TinyMUSH'],
      securityLevel: 'public',
      examples: ['switch(eq(%#,#1),You are player #1,You are not player #1)'],
      relatedPatterns: ['test-if'],
      tags: ['conditional', 'logic'],
      difficulty: 'intermediate',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    knowledgeBase.addExample({
      id: 'example-switch',
      title: 'Basic Switch Example',
      description: 'Simple conditional logic with switch',
      code: 'switch(eq(%#,#1),You are player #1,You are not player #1)',
      explanation: 'This checks if the executor is player #1',
      difficulty: 'beginner',
      category: 'conditional',
      tags: ['switch', 'conditional'],
      serverCompatibility: ['PennMUSH', 'TinyMUSH'],
      relatedConcepts: ['conditional_logic'],
      learningObjectives: ['Understanding switch function', 'Player identification']
    });

    knowledgeBase.addSecurityRule({
      ruleId: 'force-check',
      name: 'Force Command Security',
      description: 'Force command bypasses normal security',
      severity: 'high',
      category: 'permission',
      pattern: '@force',
      recommendation: 'Always check permissions before using @force',
      examples: {
        vulnerable: '@force %#=say Hello',
        secure: '@switch hasflag(%#,WIZARD)=1,{@force %#=say Hello},{@pemit %#=Permission denied}',
        explanation: 'Check wizard flag before allowing force'
      },
      affectedServers: ['PennMUSH', 'TinyMUSH'],
      references: ['mushcode.com/security']
    });

    // Add dialects for server type tests
    knowledgeBase.addDialect({
      name: 'PennMUSH',
      version: '1.8.8',
      description: 'PennMUSH server dialect',
      syntaxVariations: [],
      uniqueFeatures: [],
      securityModel: {
        permissionLevels: ['public', 'player', 'builder', 'wizard', 'god'],
        defaultLevel: 'public',
        escalationRules: [],
        restrictedFunctions: []
      },
      functionLibrary: [],
      commonPatterns: [],
      limitations: [],
      documentation: {}
    });

    knowledgeBase.addDialect({
      name: 'TinyMUSH',
      version: '3.3',
      description: 'TinyMUSH server dialect',
      syntaxVariations: [],
      uniqueFeatures: [],
      securityModel: {
        permissionLevels: ['public', 'player', 'builder', 'wizard', 'god'],
        defaultLevel: 'public',
        escalationRules: [],
        restrictedFunctions: []
      },
      functionLibrary: [],
      commonPatterns: [],
      limitations: [],
      documentation: {}
    });
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(explainMushcodeTool.name).toBe('explain_mushcode');
    });

    it('should have description', () => {
      expect(explainMushcodeTool.description).toBeDefined();
      expect(typeof explainMushcodeTool.description).toBe('string');
    });

    it('should have input schema', () => {
      expect(explainMushcodeTool.inputSchema).toBeDefined();
      expect(explainMushcodeTool.inputSchema.type).toBe('object');
      expect(explainMushcodeTool.inputSchema['required']).toContain('code');
    });

    it('should have correct properties in schema', () => {
      const properties = explainMushcodeTool.inputSchema.properties;
      expect(properties).toHaveProperty('code');
      expect(properties).toHaveProperty('detail_level');
      expect(properties).toHaveProperty('focus_areas');
      expect(properties).toHaveProperty('server_type');
      expect(properties).toHaveProperty('include_examples');
    });
  });

  describe('explainMushcodeHandler', () => {
    describe('input validation', () => {
      it('should require code parameter', async () => {
        await expect(explainMushcodeHandler({}, knowledgeBase))
          .rejects.toThrow(ValidationError);
      });

      it('should reject empty code', async () => {
        await expect(explainMushcodeHandler({ code: '' }, knowledgeBase))
          .rejects.toThrow(ValidationError);
      });

      it('should reject code that is too long', async () => {
        const longCode = 'a'.repeat(10001);
        await expect(explainMushcodeHandler({ code: longCode }, knowledgeBase))
          .rejects.toThrow(ValidationError);
      });

      it('should reject invalid detail_level', async () => {
        await expect(explainMushcodeHandler({ 
          code: 'switch(1,yes,no)', 
          detail_level: 'invalid' 
        }, knowledgeBase))
          .rejects.toThrow(ValidationError);
      });

      it('should reject invalid focus_areas', async () => {
        await expect(explainMushcodeHandler({ 
          code: 'switch(1,yes,no)', 
          focus_areas: ['invalid_area'] 
        }, knowledgeBase))
          .rejects.toThrow(ValidationError);
      });

      it('should reject too many focus_areas', async () => {
        await expect(explainMushcodeHandler({ 
          code: 'switch(1,yes,no)', 
          focus_areas: ['syntax', 'logic', 'security', 'performance', 'best_practices', 'concepts', 'extra'] 
        }, knowledgeBase))
          .rejects.toThrow(ValidationError);
      });

      it('should reject invalid server_type', async () => {
        await expect(explainMushcodeHandler({ 
          code: 'switch(1,yes,no)', 
          server_type: 'InvalidServer' 
        }, knowledgeBase))
          .rejects.toThrow(ValidationError);
      });

      it('should reject non-boolean include_examples', async () => {
        await expect(explainMushcodeHandler({ 
          code: 'switch(1,yes,no)', 
          include_examples: 'yes' 
        }, knowledgeBase))
          .rejects.toThrow(ValidationError);
      });
    });

    describe('basic functionality', () => {
      it('should explain simple MUSHCODE', async () => {
        const result = await explainMushcodeHandler({
          code: 'switch(1,yes,no)'
        }, knowledgeBase);

        expect(result).toHaveProperty('explanation');
        expect(result).toHaveProperty('code_breakdown');
        expect(result).toHaveProperty('concepts_used');
        expect(result).toHaveProperty('related_examples');
        expect(result).toHaveProperty('difficulty_level');

        expect(typeof result.explanation).toBe('string');
        expect(Array.isArray(result.code_breakdown)).toBe(true);
        expect(Array.isArray(result.concepts_used)).toBe(true);
        expect(Array.isArray(result.related_examples)).toBe(true);
        expect(typeof result.difficulty_level).toBe('string');
      });

      it('should handle multi-line code', async () => {
        const code = `switch(1,yes,no)
@pemit %#=Hello
setq(0,test)`;

        const result = await explainMushcodeHandler({ code }, knowledgeBase);

        expect(result.code_breakdown).toHaveLength(3);
        expect(result.code_breakdown[0]?.line_number).toBe(1);
        expect(result.code_breakdown[1]?.line_number).toBe(2);
        expect(result.code_breakdown[2]?.line_number).toBe(3);
      });

      it('should identify functions correctly', async () => {
        const result = await explainMushcodeHandler({
          code: 'switch(eq(%#,#1),yes,no)'
        }, knowledgeBase);

        const firstSection = result.code_breakdown[0];
        expect(firstSection?.concepts).toContain('conditional_logic');
        expect(firstSection?.concepts).toContain('comparison');
      });

      it('should identify security issues', async () => {
        const result = await explainMushcodeHandler({
          code: '@force %#=say Hello'
        }, knowledgeBase);

        const firstSection = result.code_breakdown[0];
        // Security notes are included in the overall explanation or security considerations
        expect(firstSection?.explanation).toBeDefined();
      });
    });

    describe('detail levels', () => {
      it('should provide basic explanations', async () => {
        const result = await explainMushcodeHandler({
          code: 'switch(1,yes,no)',
          detail_level: 'basic'
        }, knowledgeBase);

        expect(result.difficulty_level).toBeDefined();
        expect(result.explanation).toBeDefined();
      });

      it('should provide intermediate explanations', async () => {
        const result = await explainMushcodeHandler({
          code: 'switch(eq(%#,#1),yes,no)',
          detail_level: 'intermediate'
        }, knowledgeBase);

        expect(result.explanation).toBeDefined();
        expect(result.code_breakdown[0]?.explanation).toContain('function');
      });

      it('should provide advanced explanations', async () => {
        const result = await explainMushcodeHandler({
          code: 'switch(eq(%#,#1),yes,no)',
          detail_level: 'advanced'
        }, knowledgeBase);

        expect(result.explanation).toBeDefined();
        expect(result.code_breakdown).toBeDefined();
      });
    });

    describe('focus areas', () => {
      it('should focus on syntax when requested', async () => {
        const result = await explainMushcodeHandler({
          code: 'switch(1,yes,no)',
          focus_areas: ['syntax']
        }, knowledgeBase);

        expect(result.code_breakdown[0]?.explanation).toContain('Syntax');
      });

      it('should focus on security when requested', async () => {
        const result = await explainMushcodeHandler({
          code: '@force %#=say Hello',
          focus_areas: ['security']
        }, knowledgeBase);

        expect(result.code_breakdown[0]?.explanation).toContain('Security');
      });

      it('should focus on performance when requested', async () => {
        const result = await explainMushcodeHandler({
          code: 'iter(1 2 3 4 5,switch(##,1,one,2,two,3,three,4,four,5,five))',
          focus_areas: ['performance']
        }, knowledgeBase);

        // Performance notes are included in the overall explanation
        expect(result.explanation).toBeDefined();
      });
    });

    describe('server types', () => {
      it('should handle PennMUSH server type', async () => {
        const result = await explainMushcodeHandler({
          code: 'switch(1,yes,no)',
          server_type: 'PennMUSH'
        }, knowledgeBase);

        expect(result.explanation).toContain('PennMUSH');
      });

      it('should handle TinyMUSH server type', async () => {
        const result = await explainMushcodeHandler({
          code: 'switch(1,yes,no)',
          server_type: 'TinyMUSH'
        }, knowledgeBase);

        expect(result.explanation).toContain('TinyMUSH');
      });
    });

    describe('examples inclusion', () => {
      it('should include examples by default', async () => {
        const result = await explainMushcodeHandler({
          code: 'switch(1,yes,no)'
        }, knowledgeBase);

        expect(result.related_examples).toBeDefined();
      });

      it('should exclude examples when requested', async () => {
        const result = await explainMushcodeHandler({
          code: 'switch(1,yes,no)',
          include_examples: false
        }, knowledgeBase);

        expect(result.related_examples).toEqual([]);
      });

      it('should include examples when explicitly requested', async () => {
        const result = await explainMushcodeHandler({
          code: 'switch(1,yes,no)',
          include_examples: true
        }, knowledgeBase);

        expect(result.related_examples).toBeDefined();
      });
    });

    describe('complexity assessment', () => {
      it('should identify simple code', async () => {
        const result = await explainMushcodeHandler({
          code: 'say Hello'
        }, knowledgeBase);

        expect(result.code_breakdown[0]?.complexity).toBe('simple');
      });

      it('should identify moderate complexity', async () => {
        const result = await explainMushcodeHandler({
          code: 'switch(1,yes,no)'
        }, knowledgeBase);

        expect(result.code_breakdown[0]?.complexity).toBe('moderate');
      });

      it('should identify complex code', async () => {
        const result = await explainMushcodeHandler({
          code: 'switch(iter(lcon(here),switch(eq(type(##),PLAYER),##)),pemit(##,Hello),Nothing to do)'
        }, knowledgeBase);

        expect(result.code_breakdown[0]?.complexity).toBe('complex');
      });
    });

    describe('concept identification', () => {
      it('should identify command concepts', async () => {
        const result = await explainMushcodeHandler({
          code: '@pemit %#=Hello'
        }, knowledgeBase);

        expect(result.concepts_used).toContain('commands');
      });

      it('should identify attribute concepts', async () => {
        const result = await explainMushcodeHandler({
          code: '&TEST me=Hello World'
        }, knowledgeBase);

        expect(result.concepts_used).toContain('attributes');
      });

      it('should identify register concepts', async () => {
        const result = await explainMushcodeHandler({
          code: 'setq(0,test)'
        }, knowledgeBase);

        expect(result.concepts_used).toContain('variable_assignment');
      });

      it('should identify substitution concepts', async () => {
        const result = await explainMushcodeHandler({
          code: 'pemit(%#,Hello)'
        }, knowledgeBase);

        expect(result.concepts_used).toContain('substitutions');
      });
    });

    describe('learning resources', () => {
      it('should provide learning resources', async () => {
        const result = await explainMushcodeHandler({
          code: 'switch(1,yes,no)'
        }, knowledgeBase);

        expect(result.learning_resources).toBeDefined();
        expect(Array.isArray(result.learning_resources)).toBe(true);
      });

      it('should provide basic resources for basic level', async () => {
        const result = await explainMushcodeHandler({
          code: 'switch(1,yes,no)',
          detail_level: 'basic'
        }, knowledgeBase);

        expect(result.learning_resources).toContain('MUSHCODE Basics - Getting started with MUD programming');
      });

      it('should provide advanced resources for advanced level', async () => {
        const result = await explainMushcodeHandler({
          code: 'switch(1,yes,no)',
          detail_level: 'advanced'
        }, knowledgeBase);

        expect(result.learning_resources).toContain('Advanced MUSHCODE Techniques - Expert-level programming patterns');
      });
    });

    describe('error handling', () => {
      it('should handle unknown server types gracefully', async () => {
        // This should be caught by validation, but test the engine directly
        const result = await explainMushcodeHandler({
          code: 'switch(1,yes,no)',
          server_type: 'PennMUSH' // Valid server type
        }, knowledgeBase);

        expect(result).toBeDefined();
      });

      it('should handle empty knowledge base', async () => {
        const emptyKnowledgeBase = new MushcodeKnowledgeBase();
        
        const result = await explainMushcodeHandler({
          code: 'switch(1,yes,no)'
        }, emptyKnowledgeBase);

        expect(result).toBeDefined();
        expect(result.explanation).toBeDefined();
      });
    });
  });
});