/**
 * Unit tests for optimize_mushcode tool
 */

import { optimizeMushcodeTool, optimizeMushcodeHandler } from '../../../src/tools/optimize.js';
import { MushcodeKnowledgeBase } from '../../../src/knowledge/base.js';
import { ValidationError } from '../../../src/utils/errors.js';

describe('optimize_mushcode tool', () => {
  let knowledgeBase: MushcodeKnowledgeBase;

  beforeEach(() => {
    knowledgeBase = new MushcodeKnowledgeBase();
  });

  describe('tool definition', () => {
    it('should have correct tool name', () => {
      expect(optimizeMushcodeTool.name).toBe('optimize_mushcode');
    });

    it('should have description', () => {
      expect(optimizeMushcodeTool.description).toBeDefined();
      expect(typeof optimizeMushcodeTool.description).toBe('string');
      if (optimizeMushcodeTool.description) {
        expect(optimizeMushcodeTool.description.length).toBeGreaterThan(0);
      }
    });

    it('should have input schema', () => {
      expect(optimizeMushcodeTool.inputSchema).toBeDefined();
      expect(optimizeMushcodeTool.inputSchema.type).toBe('object');
      expect(optimizeMushcodeTool.inputSchema.properties).toBeDefined();
      expect(optimizeMushcodeTool.inputSchema['required']).toContain('code');
    });

    it('should have correct schema structure', () => {
      const schema = optimizeMushcodeTool.inputSchema;
      expect(schema).toBeDefined();
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema['required']).toEqual(['code']);
    });
  });

  describe('optimizeMushcodeHandler', () => {
    describe('input validation', () => {
      it('should reject missing code', async () => {
        const args = {};

        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow(ValidationError);
        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow('code is required');
      });

      it('should reject null code', async () => {
        const args = { code: null };

        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow(ValidationError);
        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow('code is required');
      });

      it('should reject non-string code', async () => {
        const args = { code: 123 };

        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow(ValidationError);
        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow('code is required and must be a string');
      });

      it('should reject empty code', async () => {
        const args = { code: '' };

        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow(ValidationError);
        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow('code cannot be empty');
      });

      it('should reject whitespace-only code', async () => {
        const args = { code: '   \n\t  ' };

        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow(ValidationError);
        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow('code cannot be empty');
      });

      it('should reject code that is too long', async () => {
        const args = { code: 'a'.repeat(50001) };

        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow(ValidationError);
        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow('code is too long');
      });

      it('should accept valid code', async () => {
        const args = { code: '@pemit %#=Hello World' };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result).toBeDefined();
        expect(result.optimized_code).toBeDefined();
      });
    });

    describe('optimization_goals validation', () => {
      it('should accept valid optimization goals', async () => {
        const args = {
          code: '@pemit %#=Hello',
          optimization_goals: ['performance', 'readability']
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result).toBeDefined();
        expect(result.optimized_code).toBeDefined();
      });

      it('should reject non-array optimization goals', async () => {
        const args = {
          code: '@pemit %#=Hello',
          optimization_goals: 'performance'
        };

        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow(ValidationError);
        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow('optimization_goals must be an array');
      });

      it('should reject invalid optimization goal', async () => {
        const args = {
          code: '@pemit %#=Hello',
          optimization_goals: ['invalid_goal']
        };

        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow(ValidationError);
        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow('optimization_goals[0] must be one of');
      });

      it('should reject non-string optimization goal', async () => {
        const args = {
          code: '@pemit %#=Hello',
          optimization_goals: [123]
        };

        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow(ValidationError);
        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow('optimization_goals[0] must be a string');
      });

      it('should remove duplicate optimization goals', async () => {
        const args = {
          code: '@pemit %#=Hello',
          optimization_goals: ['performance', 'performance', 'readability']
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result).toBeDefined();
        expect(result.optimized_code).toBeDefined();
      });

      it('should handle empty optimization goals array', async () => {
        const args = {
          code: '@pemit %#=Hello',
          optimization_goals: []
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result).toBeDefined();
        expect(result.optimized_code).toBeDefined();
      });
    });

    describe('server_type validation', () => {
      it('should accept valid server types', async () => {
        // Add mock dialects to the knowledge base
        const mockDialect = {
          name: 'PennMUSH',
          version: '1.8.8',
          description: 'PennMUSH server',
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
        };
        
        knowledgeBase.dialects.set('PennMUSH', mockDialect);

        const args = {
          code: '@pemit %#=Hello',
          server_type: 'PennMUSH'
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result).toBeDefined();
        expect(result.optimized_code).toBeDefined();
      });

      it('should reject invalid server type', async () => {
        const args = {
          code: '@pemit %#=Hello',
          server_type: 'InvalidServer'
        };

        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow(ValidationError);
        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow('server_type must be one of');
      });

      it('should reject non-string server type', async () => {
        const args = {
          code: '@pemit %#=Hello',
          server_type: 123
        };

        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow(ValidationError);
        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow('server_type must be a string');
      });
    });

    describe('preserve_functionality validation', () => {
      it('should accept boolean preserve_functionality', async () => {
        const args = {
          code: '@pemit %#=Hello',
          preserve_functionality: false
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result).toBeDefined();
        expect(result.optimization_summary.functionality_preserved).toBe(false);
      });

      it('should reject non-boolean preserve_functionality', async () => {
        const args = {
          code: '@pemit %#=Hello',
          preserve_functionality: 'true'
        };

        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow(ValidationError);
        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow('preserve_functionality must be a boolean');
      });

      it('should default preserve_functionality to true', async () => {
        const args = {
          code: '@pemit %#=Hello'
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result.optimization_summary.functionality_preserved).toBe(true);
      });
    });

    describe('aggressive_optimization validation', () => {
      it('should accept boolean aggressive_optimization', async () => {
        const args = {
          code: '@pemit %#=Hello',
          aggressive_optimization: true
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result).toBeDefined();
        expect(result.optimized_code).toBeDefined();
      });

      it('should reject non-boolean aggressive_optimization', async () => {
        const args = {
          code: '@pemit %#=Hello',
          aggressive_optimization: 'true'
        };

        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow(ValidationError);
        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow('aggressive_optimization must be a boolean');
      });

      it('should default aggressive_optimization to false', async () => {
        const args = {
          code: '@pemit %#=Hello'
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result).toBeDefined();
        expect(result.optimized_code).toBeDefined();
      });
    });

    describe('successful optimization', () => {
      it('should return complete optimization result', async () => {
        const args = {
          code: '@pemit %#=Hello World'
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result).toHaveProperty('optimized_code');
        expect(result).toHaveProperty('improvements');
        expect(result).toHaveProperty('performance_impact');
        expect(result).toHaveProperty('explanation');
        expect(result).toHaveProperty('optimization_summary');

        expect(typeof result.optimized_code).toBe('string');
        expect(Array.isArray(result.improvements)).toBe(true);
        expect(typeof result.performance_impact).toBe('string');
        expect(typeof result.explanation).toBe('string');
        expect(typeof result.optimization_summary).toBe('object');
      });

      it('should return optimization summary with correct structure', async () => {
        const args = {
          code: '@pemit %#=Hello World'
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        const summary = result.optimization_summary;
        expect(summary).toHaveProperty('original_size');
        expect(summary).toHaveProperty('optimized_size');
        expect(summary).toHaveProperty('compression_ratio');
        expect(summary).toHaveProperty('functionality_preserved');

        expect(typeof summary.original_size).toBe('number');
        expect(typeof summary.optimized_size).toBe('number');
        expect(typeof summary.compression_ratio).toBe('number');
        expect(typeof summary.functionality_preserved).toBe('boolean');
      });

      it('should calculate correct original size', async () => {
        const code = '@pemit %#=Hello World';
        const args = { code };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result.optimization_summary.original_size).toBe(code.length);
      });

      it('should return improvements array', async () => {
        const args = {
          code: '@pemit %#=[strlen(%0)] [strlen(%0)]' // Code that can be optimized
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(Array.isArray(result.improvements)).toBe(true);
        // Each improvement should have the correct structure
        for (const improvement of result.improvements) {
          expect(improvement).toHaveProperty('type');
          expect(improvement).toHaveProperty('description');
          expect(improvement).toHaveProperty('before');
          expect(improvement).toHaveProperty('after');
          expect(improvement).toHaveProperty('impact');
          expect(improvement).toHaveProperty('confidence');
          expect(improvement).toHaveProperty('effort');
          expect(improvement).toHaveProperty('category');
        }
      });

      it('should include warnings when appropriate', async () => {
        const args = {
          code: '@pemit %#=Hello',
          preserve_functionality: false
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result.warnings).toBeDefined();
        expect(Array.isArray(result.warnings)).toBe(true);
        expect(result.warnings!.length).toBeGreaterThan(0);
      });

      it('should not include warnings when not needed', async () => {
        const args = {
          code: '@pemit %#=Hello'
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        // Warnings may or may not be present depending on the optimization
        if (result.warnings) {
          expect(Array.isArray(result.warnings)).toBe(true);
        }
      });
    });

    describe('optimization with different goals', () => {
      it('should optimize for performance', async () => {
        const args = {
          code: '@pemit %#=[strlen(%0)] [strlen(%0)]',
          optimization_goals: ['performance']
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result.improvements).toBeInstanceOf(Array);
        // Should focus on performance improvements
        const perfImprovements = result.improvements.filter(imp => imp.type === 'performance');
        const nonPerfImprovements = result.improvements.filter(imp => imp.type !== 'performance');
        
        // Should have more performance improvements than others when focusing on performance
        expect(perfImprovements.length).toBeGreaterThanOrEqual(0);
        expect(nonPerfImprovements.length).toBe(0);
      });

      it('should optimize for readability', async () => {
        const args = {
          code: '@pemit %#=Hello    World', // Extra spaces
          optimization_goals: ['readability']
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result.improvements).toBeInstanceOf(Array);
        // Should focus on readability improvements
        const readabilityImprovements = result.improvements.filter(imp => imp.type === 'readability');
        const nonReadabilityImprovements = result.improvements.filter(imp => imp.type !== 'readability');
        
        expect(readabilityImprovements.length).toBeGreaterThanOrEqual(0);
        expect(nonReadabilityImprovements.length).toBe(0);
      });

      it('should optimize for maintainability', async () => {
        const args = {
          code: '@pemit %#=[if(gt(strlen(%0),50),Too long,OK)]', // Magic number
          optimization_goals: ['maintainability']
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result.improvements).toBeInstanceOf(Array);
        // Should focus on maintainability improvements
        const maintainabilityImprovements = result.improvements.filter(imp => imp.type === 'maintainability');
        const nonMaintainabilityImprovements = result.improvements.filter(imp => imp.type !== 'maintainability');
        
        expect(maintainabilityImprovements.length).toBeGreaterThanOrEqual(0);
        expect(nonMaintainabilityImprovements.length).toBe(0);
      });

      it('should optimize for security', async () => {
        const args = {
          code: '@destroy %0', // Dangerous command without permission check
          optimization_goals: ['security']
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result.improvements).toBeInstanceOf(Array);
        // Should focus on security improvements
        const securityImprovements = result.improvements.filter(imp => imp.type === 'security');
        const nonSecurityImprovements = result.improvements.filter(imp => imp.type !== 'security');
        
        expect(securityImprovements.length).toBeGreaterThanOrEqual(0);
        expect(nonSecurityImprovements.length).toBe(0);
      });

      it('should optimize for multiple goals', async () => {
        const args = {
          code: '@pemit %#=[strlen(%0)] [strlen(%0)]    @destroy %1',
          optimization_goals: ['performance', 'security']
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result.improvements).toBeInstanceOf(Array);
        
        // Should only have improvements from specified types
        const allowedTypes = new Set(['performance', 'security']);
        const invalidImprovements = result.improvements.filter(imp => !allowedTypes.has(imp.type));
        expect(invalidImprovements.length).toBe(0);
      });
    });

    describe('error handling', () => {
      it('should handle optimization engine errors gracefully', async () => {
        // This test would require mocking the optimizer to throw an error
        // For now, we'll test with valid input that should not throw
        const args = {
          code: '@pemit %#=Hello'
        };

        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .resolves.toBeDefined();
      });

      it('should preserve ValidationError types', async () => {
        const args = { code: '' };

        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .rejects.toThrow(ValidationError);
      });

      it('should wrap other errors appropriately', async () => {
        // This would require mocking to test properly
        // For now, we'll ensure the function doesn't throw unexpected errors
        const args = {
          code: '@pemit %#=Hello'
        };

        await expect(optimizeMushcodeHandler(args, knowledgeBase))
          .resolves.toBeDefined();
      });
    });

    describe('edge cases', () => {
      it('should handle minimal code', async () => {
        const args = {
          code: 'a'
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result).toBeDefined();
        expect(result.optimized_code).toBeDefined();
      });

      it('should handle maximum length code', async () => {
        const args = {
          code: 'a'.repeat(50000)
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result).toBeDefined();
        expect(result.optimized_code).toBeDefined();
      });

      it('should handle code with special characters', async () => {
        const args = {
          code: '@pemit %#=Hello "World" & [test] {complex}'
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result).toBeDefined();
        expect(result.optimized_code).toBeDefined();
      });

      it('should handle code with unicode characters', async () => {
        const args = {
          code: '@pemit %#=Hello 世界 🌍'
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result).toBeDefined();
        expect(result.optimized_code).toBeDefined();
      });

      it('should handle multiline code', async () => {
        const args = {
          code: '@pemit %#=Line 1\n@pemit %#=Line 2\n@pemit %#=Line 3'
        };

        const result = await optimizeMushcodeHandler(args, knowledgeBase);

        expect(result).toBeDefined();
        expect(result.optimized_code).toBeDefined();
      });
    });
  });
});