/**
 * Unit tests for MUSHCODE explainer engine
 */

import { MushcodeExplainer } from '../../../src/engines/explainer.js';
import { MushcodeKnowledgeBase } from '../../../src/knowledge/base.js';
import { ValidationError } from '../../../src/utils/errors.js';

describe('MushcodeExplainer', () => {
  let explainer: MushcodeExplainer;
  let knowledgeBase: MushcodeKnowledgeBase;

  beforeEach(() => {
    knowledgeBase = new MushcodeKnowledgeBase();
    explainer = new MushcodeExplainer(knowledgeBase);

    // Add test data
    knowledgeBase.addPattern({
      id: 'switch-pattern',
      name: 'Switch Function',
      description: 'Conditional logic using switch',
      category: 'function',
      codeTemplate: 'switch(%0,%1,%2)',
      parameters: [
        { name: 'condition', type: 'string', description: 'Condition to test', required: true },
        { name: 'true_result', type: 'string', description: 'Result if true', required: true },
        { name: 'false_result', type: 'string', description: 'Result if false', required: false }
      ],
      serverCompatibility: ['PennMUSH', 'TinyMUSH'],
      securityLevel: 'public',
      examples: ['switch(eq(%#,#1),You are #1,You are not #1)'],
      relatedPatterns: [],
      tags: ['conditional', 'logic'],
      difficulty: 'intermediate',
      createdAt: new Date(),
      updatedAt: new Date()
    });

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
        restrictedFunctions: ['@shutdown', '@restart']
      },
      functionLibrary: [
        {
          name: 'switch',
          description: 'Conditional evaluation function',
          syntax: 'switch(condition, true_result, false_result)',
          parameters: [
            { name: 'condition', type: 'any', description: 'Condition to evaluate', required: true },
            { name: 'true_result', type: 'any', description: 'Result if condition is true', required: true },
            { name: 'false_result', type: 'any', description: 'Result if condition is false', required: false }
          ],
          returnType: 'any',
          permissions: ['public'],
          examples: ['switch(1,yes,no)', 'switch(eq(%#,#1),admin,user)'],
          deprecated: false
        }
      ],
      commonPatterns: ['switch-pattern'],
      limitations: [],
      documentation: {
        url: 'https://pennmush.org',
        version: '1.8.8'
      }
    });

    knowledgeBase.addSecurityRule({
      ruleId: 'admin-command',
      name: 'Administrative Command',
      description: 'Commands that require administrative privileges',
      severity: 'high',
      category: 'permission',
      pattern: '@(shutdown|restart|dump)',
      recommendation: 'Ensure proper permission checks before using administrative commands',
      examples: {
        vulnerable: '@shutdown',
        secure: '@switch hasflag(%#,GOD)=1,{@shutdown},{@pemit %#=Permission denied}',
        explanation: 'Check for GOD flag before allowing shutdown'
      },
      affectedServers: ['PennMUSH', 'TinyMUSH'],
      references: ['security-guide']
    });

    knowledgeBase.addExample({
      id: 'switch-example',
      title: 'Basic Switch Usage',
      description: 'Simple conditional logic with switch function',
      code: 'switch(eq(%#,#1),You are player #1,You are someone else)',
      explanation: 'This code checks if the current player is #1 and responds accordingly',
      difficulty: 'beginner',
      category: 'conditional',
      tags: ['switch', 'conditional', 'player'],
      serverCompatibility: ['PennMUSH', 'TinyMUSH'],
      relatedConcepts: ['conditional_logic', 'substitutions'],
      learningObjectives: ['Understanding switch function', 'Player identification']
    });
  });

  describe('constructor', () => {
    it('should create explainer with knowledge base', () => {
      expect(explainer).toBeInstanceOf(MushcodeExplainer);
    });
  });

  describe('explain method', () => {
    describe('input validation', () => {
      it('should reject empty code', async () => {
        await expect(explainer.explain({
          code: '',
          detailLevel: 'intermediate'
        })).rejects.toThrow(ValidationError);
      });

      it('should reject code that is too long', async () => {
        const longCode = 'a'.repeat(10001);
        await expect(explainer.explain({
          code: longCode,
          detailLevel: 'intermediate'
        })).rejects.toThrow(ValidationError);
      });

      it('should reject invalid detail level', async () => {
        await expect(explainer.explain({
          code: 'switch(1,yes,no)',
          detailLevel: 'invalid' as any
        })).rejects.toThrow(ValidationError);
      });

      it('should reject unknown server type', async () => {
        await expect(explainer.explain({
          code: 'switch(1,yes,no)',
          detailLevel: 'intermediate',
          serverType: 'UnknownServer'
        })).rejects.toThrow(ValidationError);
      });

      it('should reject invalid focus areas', async () => {
        await expect(explainer.explain({
          code: 'switch(1,yes,no)',
          detailLevel: 'intermediate',
          focusAreas: ['invalid_area']
        })).rejects.toThrow(ValidationError);
      });
    });

    describe('basic functionality', () => {
      it('should explain simple code', async () => {
        const result = await explainer.explain({
          code: 'switch(1,yes,no)',
          detailLevel: 'intermediate'
        });

        expect(result).toHaveProperty('explanation');
        expect(result).toHaveProperty('codeBreakdown');
        expect(result).toHaveProperty('conceptsUsed');
        expect(result).toHaveProperty('relatedExamples');
        expect(result).toHaveProperty('difficultyLevel');

        expect(typeof result.explanation).toBe('string');
        expect(Array.isArray(result.codeBreakdown)).toBe(true);
        expect(Array.isArray(result.conceptsUsed)).toBe(true);
        expect(Array.isArray(result.relatedExamples)).toBe(true);
        expect(['beginner', 'intermediate', 'advanced']).toContain(result.difficultyLevel);
      });

      it('should handle multi-line code', async () => {
        const code = `switch(1,yes,no)
@pemit %#=Hello
setq(0,test)`;

        const result = await explainer.explain({
          code,
          detailLevel: 'intermediate'
        });

        expect(result.codeBreakdown).toHaveLength(3);
        expect(result.codeBreakdown[0]?.lineNumber).toBe(1);
        expect(result.codeBreakdown[1]?.lineNumber).toBe(2);
        expect(result.codeBreakdown[2]?.lineNumber).toBe(3);
      });

      it('should skip empty lines', async () => {
        const code = `switch(1,yes,no)

@pemit %#=Hello`;

        const result = await explainer.explain({
          code,
          detailLevel: 'intermediate'
        });

        expect(result.codeBreakdown).toHaveLength(2);
        expect(result.codeBreakdown[0]?.lineNumber).toBe(1);
        expect(result.codeBreakdown[1]?.lineNumber).toBe(3);
      });
    });

    describe('concept identification', () => {
      it('should identify command concepts', async () => {
        const result = await explainer.explain({
          code: '@pemit %#=Hello',
          detailLevel: 'intermediate'
        });

        expect(result.conceptsUsed).toContain('commands');
      });

      it('should identify attribute concepts', async () => {
        const result = await explainer.explain({
          code: '&TEST me=Hello World',
          detailLevel: 'intermediate'
        });

        expect(result.conceptsUsed).toContain('attributes');
      });

      it('should identify register concepts', async () => {
        const result = await explainer.explain({
          code: 'setq(0,test)',
          detailLevel: 'intermediate'
        });

        expect(result.conceptsUsed).toContain('variable_assignment');
      });

      it('should identify substitution concepts', async () => {
        const result = await explainer.explain({
          code: 'pemit(%#,Hello)',
          detailLevel: 'intermediate'
        });

        expect(result.conceptsUsed).toContain('substitutions');
      });

      it('should identify conditional logic', async () => {
        const result = await explainer.explain({
          code: 'switch(eq(%#,#1),yes,no)',
          detailLevel: 'intermediate'
        });

        expect(result.conceptsUsed).toContain('conditional_logic');
      });

      it('should identify iteration concepts', async () => {
        const result = await explainer.explain({
          code: 'iter(1 2 3,##)',
          detailLevel: 'intermediate'
        });

        expect(result.conceptsUsed).toContain('iteration');
      });
    });

    describe('function identification', () => {
      it('should identify switch function', async () => {
        const result = await explainer.explain({
          code: 'switch(1,yes,no)',
          detailLevel: 'intermediate'
        });

        const section = result.codeBreakdown[0];
        expect(section?.functions).toContain('switch');
      });

      it('should identify multiple functions', async () => {
        const result = await explainer.explain({
          code: 'switch(eq(%#,#1),yes,no)',
          detailLevel: 'intermediate'
        });

        const section = result.codeBreakdown[0];
        expect(section?.functions).toContain('switch');
        expect(section?.functions).toContain('eq');
      });

      it('should identify string functions', async () => {
        const result = await explainer.explain({
          code: 'strlen(mid(test,1,2))',
          detailLevel: 'intermediate'
        });

        const section = result.codeBreakdown[0];
        expect(section?.functions).toContain('strlen');
        expect(section?.functions).toContain('mid');
      });
    });

    describe('complexity assessment', () => {
      it('should identify simple complexity', async () => {
        const result = await explainer.explain({
          code: 'say Hello',
          detailLevel: 'intermediate'
        });

        expect(result.codeBreakdown[0]?.complexity).toBe('simple');
      });

      it('should identify moderate complexity', async () => {
        const result = await explainer.explain({
          code: 'switch(eq(%#,#1),yes,no)',
          detailLevel: 'intermediate'
        });

        expect(result.codeBreakdown[0]?.complexity).toBe('moderate');
      });

      it('should identify complex code', async () => {
        const result = await explainer.explain({
          code: 'switch(iter(lcon(here),switch(eq(type(##),PLAYER),##)),pemit(##,Hello),Nothing)',
          detailLevel: 'intermediate'
        });

        expect(result.codeBreakdown[0]?.complexity).toBe('complex');
      });
    });

    describe('security analysis', () => {
      it('should identify security issues', async () => {
        const result = await explainer.explain({
          code: '@shutdown',
          detailLevel: 'intermediate'
        });

        const section = result.codeBreakdown[0];
        expect(section?.securityNotes).toBeDefined();
        expect(section?.securityNotes!.length).toBeGreaterThan(0);
      });

      it('should identify force command security', async () => {
        const result = await explainer.explain({
          code: '@force %#=say Hello',
          detailLevel: 'intermediate'
        });

        const section = result.codeBreakdown[0];
        expect(section?.securityNotes).toBeDefined();
        expect(section?.securityNotes!.some(note => note.includes('force'))).toBe(true);
      });

      it('should identify executor reference security', async () => {
        const result = await explainer.explain({
          code: 'pemit(%#,Hello)',
          detailLevel: 'intermediate'
        });

        const section = result.codeBreakdown[0];
        expect(section?.securityNotes).toBeDefined();
        expect(section?.securityNotes!.some(note => note.includes('%#'))).toBe(true);
      });
    });

    describe('detail levels', () => {
      it('should provide basic explanations', async () => {
        const result = await explainer.explain({
          code: 'switch(1,yes,no)',
          detailLevel: 'basic'
        });

        expect(result.explanation).toBeDefined();
        expect(result.codeBreakdown[0]?.explanation).toBeDefined();
      });

      it('should provide intermediate explanations', async () => {
        const result = await explainer.explain({
          code: 'switch(eq(%#,#1),yes,no)',
          detailLevel: 'intermediate'
        });

        expect(result.explanation).toBeDefined();
        expect(result.codeBreakdown[0]?.explanation).toContain('function');
      });

      it('should provide advanced explanations', async () => {
        const result = await explainer.explain({
          code: 'switch(eq(%#,#1),yes,no)',
          detailLevel: 'advanced'
        });

        expect(result.explanation).toBeDefined();
        expect(result.codeBreakdown[0]?.explanation).toBeDefined();
      });
    });

    describe('server-specific analysis', () => {
      it('should use server dialect information', async () => {
        const result = await explainer.explain({
          code: 'switch(1,yes,no)',
          detailLevel: 'intermediate',
          serverType: 'PennMUSH'
        });

        expect(result.explanation).toContain('PennMUSH');
      });

      it('should identify dialect-specific functions', async () => {
        const result = await explainer.explain({
          code: 'switch(1,yes,no)',
          detailLevel: 'intermediate',
          serverType: 'PennMUSH'
        });

        const section = result.codeBreakdown[0];
        expect(section?.functions).toContain('switch');
      });
    });

    describe('focus areas', () => {
      it('should focus on syntax', async () => {
        const result = await explainer.explain({
          code: 'switch(1,yes,no)',
          detailLevel: 'intermediate',
          focusAreas: ['syntax']
        });

        expect(result.codeBreakdown[0]?.explanation).toContain('Syntax');
      });

      it('should focus on logic', async () => {
        const result = await explainer.explain({
          code: 'switch(1,yes,no)',
          detailLevel: 'intermediate',
          focusAreas: ['logic']
        });

        expect(result.codeBreakdown[0]?.explanation).toContain('logic');
      });

      it('should focus on security', async () => {
        const result = await explainer.explain({
          code: '@force %#=say Hello',
          detailLevel: 'intermediate',
          focusAreas: ['security']
        });

        expect(result.codeBreakdown[0]?.explanation).toContain('Security');
      });

      it('should focus on performance', async () => {
        const result = await explainer.explain({
          code: 'iter(1 2 3,##)',
          detailLevel: 'intermediate',
          focusAreas: ['performance']
        });

        expect(result.performanceNotes).toBeDefined();
      });
    });

    describe('examples and resources', () => {
      it('should find related examples', async () => {
        const result = await explainer.explain({
          code: 'switch(1,yes,no)',
          detailLevel: 'intermediate',
          includeExamples: true
        });

        expect(result.relatedExamples).toBeDefined();
        expect(Array.isArray(result.relatedExamples)).toBe(true);
      });

      it('should exclude examples when requested', async () => {
        const result = await explainer.explain({
          code: 'switch(1,yes,no)',
          detailLevel: 'intermediate',
          includeExamples: false
        });

        expect(result.relatedExamples).toEqual([]);
      });

      it('should provide learning resources', async () => {
        const result = await explainer.explain({
          code: 'switch(1,yes,no)',
          detailLevel: 'intermediate'
        });

        expect(result.learningResources).toBeDefined();
        expect(Array.isArray(result.learningResources)).toBe(true);
      });

      it('should provide basic resources for basic level', async () => {
        const result = await explainer.explain({
          code: 'switch(1,yes,no)',
          detailLevel: 'basic'
        });

        expect(result.learningResources).toContain('MUSHCODE Basics - Getting started with MUD programming');
      });

      it('should provide advanced resources for advanced level', async () => {
        const result = await explainer.explain({
          code: 'switch(1,yes,no)',
          detailLevel: 'advanced'
        });

        expect(result.learningResources).toContain('Advanced MUSHCODE Techniques - Expert-level programming patterns');
      });
    });

    describe('difficulty assessment', () => {
      it('should assess beginner difficulty', async () => {
        const result = await explainer.explain({
          code: 'say Hello',
          detailLevel: 'intermediate'
        });

        expect(result.difficultyLevel).toBe('beginner');
      });

      it('should assess intermediate difficulty', async () => {
        const result = await explainer.explain({
          code: 'switch(eq(%#,#1),yes,no)',
          detailLevel: 'intermediate'
        });

        expect(result.difficultyLevel).toBe('intermediate');
      });

      it('should assess advanced difficulty', async () => {
        const result = await explainer.explain({
          code: 'switch(iter(lcon(here),switch(eq(type(##),PLAYER),##)),pemit(##,Hello),Nothing)',
          detailLevel: 'intermediate'
        });

        expect(result.difficultyLevel).toBe('advanced');
      });
    });

    describe('performance analysis', () => {
      it('should identify iteration performance issues', async () => {
        const result = await explainer.explain({
          code: 'iter(1 2 3 4 5,switch(##,1,one,2,two,3,three,4,four,5,five))',
          detailLevel: 'intermediate',
          focusAreas: ['performance']
        });

        expect(result.performanceNotes).toBeDefined();
        expect(result.performanceNotes!.some(note => note.includes('iteration'))).toBe(true);
      });

      it('should identify nested function performance issues', async () => {
        const result = await explainer.explain({
          code: 'switch(eq(strlen(mid(get(me/test),1,5)),5),yes,no)',
          detailLevel: 'intermediate',
          focusAreas: ['performance']
        });

        expect(result.performanceNotes).toBeDefined();
        expect(result.performanceNotes!.some(note => note.includes('nested'))).toBe(true);
      });

      it('should identify eval performance issues', async () => {
        const result = await explainer.explain({
          code: 'eval(get(me/code))',
          detailLevel: 'intermediate',
          focusAreas: ['performance']
        });

        expect(result.performanceNotes).toBeDefined();
        expect(result.performanceNotes!.some(note => note.includes('eval'))).toBe(true);
      });
    });
  });
});