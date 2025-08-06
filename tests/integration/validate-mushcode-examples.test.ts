/**
 * Integration tests for validate_mushcode tool with real-world examples
 */

import { validateMushcodeHandler } from '../../src/tools/validate.js';
import { MushcodeKnowledgeBase } from '../../src/knowledge/base.js';
import { MushcodePopulator } from '../../src/knowledge/populator.js';

describe('validate_mushcode integration tests', () => {
  let knowledgeBase: MushcodeKnowledgeBase;

  beforeAll(async () => {
    // Set up a real knowledge base with security rules
    knowledgeBase = new MushcodeKnowledgeBase();
    const populator = new MushcodePopulator(knowledgeBase);
    
    // Add security rules and basic patterns
    await populator.populateFromMushcodeCom();
  });

  describe('real-world MUSHCODE validation', () => {
    it('should validate a simple greeting command', async () => {
      const code = '@pemit me=Hello, World!;';
      
      const result = await validateMushcodeHandler({ code }, knowledgeBase);
      
      expect(result.is_valid).toBe(true);
      expect(result.syntax_errors.filter(e => e.severity === 'error')).toHaveLength(0);
      expect(result.analysis_summary.total_lines).toBe(1);
    });

    it('should detect security issues in eval usage', async () => {
      const code = 'eval(%0)';
      
      const result = await validateMushcodeHandler({ 
        code,
        check_security: true 
      }, knowledgeBase);
      
      expect(result.security_warnings).toContainEqual(
        expect.objectContaining({
          ruleId: 'SEC-001',
          severity: 'high',
          type: 'injection'
        })
      );
      expect(result.analysis_summary.security_score).toBeLessThan(100);
    });

    it('should detect SQL injection risks', async () => {
      const code = 'sql(SELECT * FROM users WHERE name=\'%0\')';
      
      const result = await validateMushcodeHandler({ 
        code,
        check_security: true 
      }, knowledgeBase);
      
      expect(result.security_warnings).toContainEqual(
        expect.objectContaining({
          ruleId: 'SEC-003',
          severity: 'critical',
          type: 'injection'
        })
      );
      expect(result.analysis_summary.security_score).toBeLessThanOrEqual(70);
    });

    it('should detect missing permission checks', async () => {
      const code = '@create %0=%1';
      
      const result = await validateMushcodeHandler({ 
        code,
        check_security: true 
      }, knowledgeBase);
      
      expect(result.security_warnings).toContainEqual(
        expect.objectContaining({
          ruleId: 'SEC-002',
          severity: 'medium',
          type: 'permission'
        })
      );
    });

    it('should validate complex switch statement', async () => {
      const code = `switch(%0, hello, @pemit me=Hi there!, goodbye, @pemit me=See you later!, help, @pemit me=Available commands: hello\\, goodbye\\, help, @pemit me=I don't understand '%0');`;
      
      const result = await validateMushcodeHandler({ 
        code,
        check_best_practices: true 
      }, knowledgeBase);
      
      // May have warnings but should not have errors
      expect(result.syntax_errors.filter(e => e.severity === 'error')).toHaveLength(0);
      expect(result.analysis_summary.complexity_score).toBeGreaterThan(5);
    });

    it('should detect syntax errors in malformed code', async () => {
      const code = '@pemit me="Hello World';
      
      const result = await validateMushcodeHandler({ code }, knowledgeBase);
      
      expect(result.is_valid).toBe(false);
      expect(result.syntax_errors).toContainEqual(
        expect.objectContaining({
          code: 'UNTERMINATED_STRING',
          severity: 'error'
        })
      );
    });

    it('should detect bracket mismatches', async () => {
      const code = 'switch(test, case1, action1';
      
      const result = await validateMushcodeHandler({ code }, knowledgeBase);
      
      expect(result.is_valid).toBe(false);
      expect(result.syntax_errors).toContainEqual(
        expect.objectContaining({
          code: 'UNCLOSED_BRACKET',
          severity: 'error'
        })
      );
    });

    it('should suggest best practices for uncommented code', async () => {
      const code = 'switch(%0, case1, action1, case2, action2, default)';
      
      const result = await validateMushcodeHandler({ 
        code,
        check_best_practices: true 
      }, knowledgeBase);
      
      expect(result.best_practice_suggestions).toContainEqual(
        expect.objectContaining({
          type: 'readability',
          description: 'Complex logic without comments',
          category: 'documentation'
        })
      );
    });

    it('should handle server-specific validation', async () => {
      const code = 'regedit(Hello World, "l+", "X")';
      
      const result = await validateMushcodeHandler({ 
        code,
        server_type: 'PennMUSH' 
      }, knowledgeBase);
      
      // Should not have syntax errors
      expect(result.syntax_errors.filter(e => e.severity === 'error')).toHaveLength(0);
      // May warn about unknown function if not in knowledge base
      // This is expected behavior until function library is fully populated
    });

    it('should detect performance issues with nested iterations', async () => {
      const code = 'iter(list1, iter(list2, some_action))';
      
      const result = await validateMushcodeHandler({ 
        code,
        check_best_practices: true 
      }, knowledgeBase);
      
      expect(result.best_practice_suggestions).toContainEqual(
        expect.objectContaining({
          type: 'performance',
          description: 'Nested iter() functions can be slow',
          category: 'optimization'
        })
      );
    });

    it('should detect magic numbers', async () => {
      const code = '@pemit me=You have 12345 points and need 67890 more';
      
      const result = await validateMushcodeHandler({ 
        code,
        check_best_practices: true 
      }, knowledgeBase);
      
      const magicNumberSuggestions = result.best_practice_suggestions.filter(
        s => s.description.includes('Magic number')
      );
      expect(magicNumberSuggestions.length).toBeGreaterThan(0);
    });

    it('should handle strict mode validation', async () => {
      const longLine = '@pemit me=' + 'a'.repeat(250);
      
      const result = await validateMushcodeHandler({ 
        code: longLine,
        strict_mode: true 
      }, knowledgeBase);
      
      expect(result.syntax_errors).toContainEqual(
        expect.objectContaining({
          code: 'LINE_TOO_LONG',
          severity: 'warning'
        })
      );
    });

    it('should validate attribute operations', async () => {
      const code = '&GREETING me=Hello, %N! Welcome to our game.';
      
      const result = await validateMushcodeHandler({ code }, knowledgeBase);
      
      expect(result.is_valid).toBe(true);
      expect(result.syntax_errors.filter(e => e.severity === 'error')).toHaveLength(0);
    });

    it('should detect invalid attribute names', async () => {
      const code = '&invalid-attr-name me=test';
      
      const result = await validateMushcodeHandler({ code }, knowledgeBase);
      
      expect(result.syntax_errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_ATTR_NAME',
          severity: 'error'
        })
      );
    });

    it('should handle complex nested expressions', async () => {
      const complexCode = `@@ Complex room description system
@desc here=[switch(time(), morning, The sun rises over the [get(here/terrain)], afternoon, The [get(here/terrain)] basks in warm sunlight, evening, Shadows lengthen across the [get(here/terrain)], night, Moonlight illuminates the [get(here/terrain)])][switch(weather(), rain, %r%rRain falls steadily., snow, %r%rSnow drifts down gently., storm, %r%rThunder rumbles overhead., %r%rThe weather is pleasant.)]`;
      
      const result = await validateMushcodeHandler({ 
        code: complexCode,
        check_best_practices: true 
      }, knowledgeBase);
      
      // Should not have syntax errors (may have warnings)
      expect(result.syntax_errors.filter(e => e.severity === 'error')).toHaveLength(0);
      expect(result.analysis_summary.complexity_score).toBeGreaterThan(15);
      expect(result.analysis_summary.maintainability_score).toBeGreaterThan(50); // Has comments
    });
  });

  describe('comprehensive validation scenarios', () => {
    it('should provide comprehensive analysis for a complete command', async () => {
      const commandCode = `
        @@ +greet command - Greets another player
        @@ Usage: +greet <player>
        &CMD_GREET me=$+greet *:
          @switch [isdbref(pmatch(%0))]=1,
          {
            @pemit %#=You greet [name(pmatch(%0))].;
            @pemit pmatch(%0)=[name(%#)] greets you warmly.;
            @pemit loc(%#)=[name(%#)] greets [name(pmatch(%0))].
          },
          {
            @pemit %#=I don't see anyone by that name here.
          }
      `;
      
      const result = await validateMushcodeHandler({ 
        code: commandCode,
        server_type: 'PennMUSH',
        strict_mode: false,
        check_security: true,
        check_best_practices: true 
      }, knowledgeBase);
      
      expect(result).toHaveProperty('is_valid');
      expect(result).toHaveProperty('syntax_errors');
      expect(result).toHaveProperty('security_warnings');
      expect(result).toHaveProperty('best_practice_suggestions');
      expect(result).toHaveProperty('compatibility_notes');
      expect(result).toHaveProperty('analysis_summary');
      
      // Should have good maintainability due to comments
      expect(result.analysis_summary.maintainability_score).toBeGreaterThan(60);
      
      // Should have reasonable complexity
      expect(result.analysis_summary.complexity_score).toBeGreaterThan(0);
      expect(result.analysis_summary.complexity_score).toBeLessThan(50);
      
      // Should have good security (no obvious vulnerabilities)
      expect(result.analysis_summary.security_score).toBeGreaterThan(80);
    });
  });
});