/**
 * Integration tests for optimize_mushcode tool
 */

import { MushcodeKnowledgeBase } from '../../src/knowledge/base.js';
import { optimizeMushcodeHandler } from '../../src/tools/optimize.js';

describe('optimize_mushcode integration', () => {
  let knowledgeBase: MushcodeKnowledgeBase;

  beforeEach(() => {
    knowledgeBase = new MushcodeKnowledgeBase();
  });

  describe('end-to-end optimization', () => {
    it('should optimize simple MUSHCODE', async () => {
      const args = {
        code: '@pemit %#=Hello World'
      };

      const result = await optimizeMushcodeHandler(args, knowledgeBase);

      expect(result).toBeDefined();
      expect(result.optimized_code).toBeDefined();
      expect(result.improvements).toBeInstanceOf(Array);
      expect(result.performance_impact).toBeDefined();
      expect(result.explanation).toBeDefined();
      expect(result.optimization_summary).toBeDefined();
    });

    it('should optimize code with performance issues', async () => {
      const args = {
        code: '@pemit %#=[strlen(%0)] [strlen(%0)] [strlen(%0)]',
        optimization_goals: ['performance']
      };

      const result = await optimizeMushcodeHandler(args, knowledgeBase);

      expect(result).toBeDefined();
      expect(result.optimized_code).toBeDefined();
      expect(result.improvements).toBeInstanceOf(Array);
      
      // Should have performance improvements for repeated function calls
      const perfImprovements = result.improvements.filter(imp => imp.type === 'performance');
      expect(perfImprovements.length).toBeGreaterThan(0);
    });

    it('should optimize code with readability issues', async () => {
      const args = {
        code: '@pemit %#=Hello    World   with   extra   spaces',
        optimization_goals: ['readability']
      };

      const result = await optimizeMushcodeHandler(args, knowledgeBase);

      expect(result).toBeDefined();
      expect(result.optimized_code).toBeDefined();
      expect(result.improvements).toBeInstanceOf(Array);
    });

    it('should optimize code with maintainability issues', async () => {
      const args = {
        code: '@pemit %#=[if(gt(strlen(%0),50),Too long,OK)]',
        optimization_goals: ['maintainability']
      };

      const result = await optimizeMushcodeHandler(args, knowledgeBase);

      expect(result).toBeDefined();
      expect(result.optimized_code).toBeDefined();
      expect(result.improvements).toBeInstanceOf(Array);
      
      // Should suggest replacing magic number
      const maintainabilityImprovements = result.improvements.filter(imp => 
        imp.type === 'maintainability' && imp.category === 'constants'
      );
      expect(maintainabilityImprovements.length).toBeGreaterThan(0);
    });

    it('should optimize code with security issues', async () => {
      const args = {
        code: '@destroy %0',
        optimization_goals: ['security']
      };

      const result = await optimizeMushcodeHandler(args, knowledgeBase);

      expect(result).toBeDefined();
      expect(result.optimized_code).toBeDefined();
      expect(result.improvements).toBeInstanceOf(Array);
      
      // Should suggest adding permission checks
      const securityImprovements = result.improvements.filter(imp => 
        imp.type === 'security' && imp.category === 'permissions'
      );
      expect(securityImprovements.length).toBeGreaterThan(0);
    });

    it('should handle complex multi-line code', async () => {
      const args = {
        code: `@@ Complex MUSHCODE example
@switch [strlen(%0)]=0,{@pemit %#=Error: No input provided.;@halt}
@pemit %#=[strlen(%0)] characters: %0
@switch [gt(strlen(%0),100)]=1,{@pemit %#=Warning: Input is very long}
@pemit %#=Processing complete.`
      };

      const result = await optimizeMushcodeHandler(args, knowledgeBase);

      expect(result).toBeDefined();
      expect(result.optimized_code).toBeDefined();
      expect(result.improvements).toBeInstanceOf(Array);
      expect(result.optimization_summary.original_size).toBeGreaterThan(0);
      expect(result.optimization_summary.optimized_size).toBeGreaterThan(0);
    });

    it('should preserve functionality when requested', async () => {
      const args = {
        code: '@pemit %#=Hello World',
        preserve_functionality: true
      };

      const result = await optimizeMushcodeHandler(args, knowledgeBase);

      expect(result.optimization_summary.functionality_preserved).toBe(true);
    });

    it('should allow disabling functionality preservation', async () => {
      const args = {
        code: '@pemit %#=Hello World',
        preserve_functionality: false
      };

      const result = await optimizeMushcodeHandler(args, knowledgeBase);

      expect(result.optimization_summary.functionality_preserved).toBe(false);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
    });

    it('should handle aggressive optimization', async () => {
      const args = {
        code: '@pemit %#=[strlen(%0)] [strlen(%0)] [strlen(%0)]',
        aggressive_optimization: true
      };

      const result = await optimizeMushcodeHandler(args, knowledgeBase);

      expect(result).toBeDefined();
      expect(result.optimized_code).toBeDefined();
      expect(result.improvements).toBeInstanceOf(Array);
    });

    it('should calculate compression ratio correctly', async () => {
      const code = '@pemit %#=Hello    World    with    extra    spaces';
      const args = { code };

      const result = await optimizeMushcodeHandler(args, knowledgeBase);

      expect(result.optimization_summary.original_size).toBe(code.length);
      expect(result.optimization_summary.optimized_size).toBe(result.optimized_code.length);
      
      const expectedRatio = (code.length - result.optimized_code.length) / code.length;
      expect(result.optimization_summary.compression_ratio).toBeCloseTo(expectedRatio, 5);
    });

    it('should provide meaningful explanations', async () => {
      const args = {
        code: '@pemit %#=[strlen(%0)] [strlen(%0)]'
      };

      const result = await optimizeMushcodeHandler(args, knowledgeBase);

      expect(result.explanation).toBeDefined();
      expect(result.explanation.length).toBeGreaterThan(0);
      expect(result.explanation).toContain('optimization');
      
      expect(result.performance_impact).toBeDefined();
      expect(result.performance_impact.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle invalid input gracefully', async () => {
      const args = {
        code: '',
        optimization_goals: ['invalid']
      };

      await expect(optimizeMushcodeHandler(args, knowledgeBase))
        .rejects.toThrow();
    });

    it('should handle very large code input', async () => {
      const args = {
        code: '@pemit %#=Hello\n'.repeat(1000) // Large but not too large
      };

      const result = await optimizeMushcodeHandler(args, knowledgeBase);

      expect(result).toBeDefined();
      expect(result.optimized_code).toBeDefined();
    });
  });

  describe('performance', () => {
    it('should complete optimization in reasonable time', async () => {
      const args = {
        code: '@pemit %#=[strlen(%0)] [strlen(%0)] [strlen(%0)]'
      };

      const startTime = Date.now();
      const result = await optimizeMushcodeHandler(args, knowledgeBase);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });
});