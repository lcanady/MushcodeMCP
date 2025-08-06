/**
 * Unit tests for MUSHCODE validation engine
 */

import { MushcodeValidator } from '../../../src/engines/validator.js';
import { MushcodeKnowledgeBase } from '../../../src/knowledge/base.js';
import { ValidationError } from '../../../src/utils/errors.js';
import { SecurityRule, ServerDialect } from '../../../src/types/knowledge.js';

// Mock the knowledge base
jest.mock('../../../src/knowledge/base.js');

const MockedMushcodeKnowledgeBase = MushcodeKnowledgeBase as jest.MockedClass<typeof MushcodeKnowledgeBase>;

describe('MushcodeValidator', () => {
  let mockKnowledgeBase: jest.Mocked<MushcodeKnowledgeBase>;
  let validator: MushcodeValidator;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockKnowledgeBase = new MockedMushcodeKnowledgeBase() as jest.Mocked<MushcodeKnowledgeBase>;
    
    // Setup default mocks
    mockKnowledgeBase.dialects = new Map();
    mockKnowledgeBase.securityRules = new Map();
    
    validator = new MushcodeValidator(mockKnowledgeBase);
  });

  describe('request validation', () => {
    it('should reject empty code', async () => {
      await expect(validator.validate({ code: '' }))
        .rejects.toThrow(ValidationError);
    });

    it('should reject code that is too long', async () => {
      const longCode = 'a'.repeat(50001);
      await expect(validator.validate({ code: longCode }))
        .rejects.toThrow(ValidationError);
    });

    it('should reject unknown server type', async () => {
      await expect(validator.validate({ 
        code: 'test', 
        serverType: 'UnknownServer' 
      })).rejects.toThrow(ValidationError);
    });

    it('should accept valid requests', async () => {
      const result = await validator.validate({ code: '@pemit me=Hello' });
      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
    });
  });

  describe('syntax validation', () => {
    it('should detect unterminated strings', async () => {
      const result = await validator.validate({ 
        code: '@pemit me="Hello World' 
      });

      expect(result.syntaxErrors).toContainEqual(
        expect.objectContaining({
          message: 'Unterminated string literal',
          severity: 'error',
          code: 'UNTERMINATED_STRING'
        })
      );
    });

    it('should detect unmatched brackets', async () => {
      const result = await validator.validate({ 
        code: 'switch(test, case1, action1' 
      });

      expect(result.syntaxErrors).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('Unclosed ('),
          severity: 'error',
          code: 'UNCLOSED_BRACKET'
        })
      );
    });

    it('should detect mismatched brackets', async () => {
      const result = await validator.validate({ 
        code: 'switch(test]' 
      });

      expect(result.syntaxErrors).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('Mismatched brackets'),
          severity: 'error',
          code: 'MISMATCHED_BRACKET'
        })
      );
    });

    it('should detect invalid characters', async () => {
      const result = await validator.validate({ 
        code: '@pemit me=Hello\x00World' 
      });

      expect(result.syntaxErrors).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('Invalid control character'),
          severity: 'error',
          code: 'INVALID_CHAR'
        })
      );
    });

    it('should warn about long lines in strict mode', async () => {
      const longLine = '@pemit me=' + 'a'.repeat(200);
      const result = await validator.validate({ 
        code: longLine,
        strictMode: true 
      });

      expect(result.syntaxErrors).toContainEqual(
        expect.objectContaining({
          message: 'Line too long (>200 characters)',
          severity: 'warning',
          code: 'LINE_TOO_LONG'
        })
      );
    });

    it('should validate attribute names', async () => {
      const result = await validator.validate({ 
        code: '&invalid-attr me=test' 
      });

      expect(result.syntaxErrors).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('Invalid attribute name'),
          severity: 'error',
          code: 'INVALID_ATTR_NAME'
        })
      );
    });

    it('should detect attribute names that are too long', async () => {
      const longAttrName = '&' + 'A'.repeat(33);
      const result = await validator.validate({ 
        code: `${longAttrName} me=test` 
      });

      expect(result.syntaxErrors).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('Attribute name too long'),
          severity: 'error',
          code: 'ATTR_NAME_TOO_LONG'
        })
      );
    });

    it('should suggest adding semicolons to commands', async () => {
      const result = await validator.validate({ 
        code: '@pemit me=Hello' 
      });

      expect(result.syntaxErrors).toContainEqual(
        expect.objectContaining({
          message: 'Command should end with semicolon',
          severity: 'info',
          code: 'MISSING_SEMICOLON'
        })
      );
    });

    it('should detect multiple consecutive spaces', async () => {
      const result = await validator.validate({ 
        code: '@pemit  me=Hello' 
      });

      expect(result.syntaxErrors).toContainEqual(
        expect.objectContaining({
          message: 'Multiple consecutive spaces',
          severity: 'info',
          code: 'MULTIPLE_SPACES'
        })
      );
    });
  });

  describe('security validation', () => {
    beforeEach(() => {
      // Setup security rules
      const securityRule: SecurityRule = {
        ruleId: 'SEC-001',
        name: 'Unsafe Eval',
        description: 'Detects unsafe eval usage',
        severity: 'high',
        category: 'injection',
        pattern: '\\beval\\s*\\(\\s*%[0-9]',
        recommendation: 'Use switch() instead',
        examples: {
          vulnerable: 'eval(%0)',
          secure: 'switch(%0, ...)',
          explanation: 'eval() with user input is dangerous'
        },
        affectedServers: ['PennMUSH', 'TinyMUSH'],
        references: []
      };

      mockKnowledgeBase.securityRules.set('SEC-001', securityRule);
    });

    it('should detect security vulnerabilities', async () => {
      const result = await validator.validate({ 
        code: 'eval(%0)',
        checkSecurity: true 
      });

      expect(result.securityWarnings).toContainEqual(
        expect.objectContaining({
          ruleId: 'SEC-001',
          type: 'injection',
          severity: 'high',
          description: 'Detects unsafe eval usage'
        })
      );
    });

    it('should skip security checking when disabled', async () => {
      const result = await validator.validate({ 
        code: 'eval(%0)',
        checkSecurity: false 
      });

      expect(result.securityWarnings).toHaveLength(0);
    });

    it('should filter rules by server type', async () => {
      const dialect: ServerDialect = {
        name: 'RhostMUSH',
        version: '3.0',
        description: 'RhostMUSH server',
        syntaxVariations: [],
        uniqueFeatures: [],
        securityModel: {
          permissionLevels: [],
          defaultLevel: 'player',
          escalationRules: [],
          restrictedFunctions: []
        },
        functionLibrary: [],
        commonPatterns: [],
        limitations: [],
        documentation: {}
      };

      mockKnowledgeBase.dialects.set('RhostMUSH', dialect);

      const result = await validator.validate({ 
        code: 'eval(%0)',
        serverType: 'RhostMUSH',
        checkSecurity: true 
      });

      // Should not find the rule since it's not in affectedServers for RhostMUSH
      expect(result.securityWarnings).toHaveLength(0);
    });

    it('should calculate security score based on warnings', async () => {
      const result = await validator.validate({ 
        code: 'eval(%0)',
        checkSecurity: true 
      });

      expect(result.securityScore).toBeLessThan(100);
      expect(result.securityScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('best practices validation', () => {
    it('should suggest improvements for code style', async () => {
      const result = await validator.validate({ 
        code: '   @pemit me=Hello', // Bad indentation
        checkBestPractices: true 
      });

      expect(result.bestPracticeSuggestions).toContainEqual(
        expect.objectContaining({
          type: 'readability',
          description: 'Inconsistent indentation',
          category: 'formatting'
        })
      );
    });

    it('should suggest comments for complex code', async () => {
      const result = await validator.validate({ 
        code: 'switch(%0, case1, action1, case2, action2)',
        checkBestPractices: true 
      });

      expect(result.bestPracticeSuggestions).toContainEqual(
        expect.objectContaining({
          type: 'readability',
          description: 'Complex logic without comments',
          category: 'documentation'
        })
      );
    });

    it('should detect magic numbers', async () => {
      const result = await validator.validate({ 
        code: '@pemit me=You have 12345 points',
        checkBestPractices: true 
      });

      expect(result.bestPracticeSuggestions).toContainEqual(
        expect.objectContaining({
          type: 'maintainability',
          description: 'Magic number: 12345',
          category: 'constants'
        })
      );
    });

    it('should detect too many parameters', async () => {
      const result = await validator.validate({ 
        code: '@pemit me=%0 %1 %2 %3 %4 %5 %6',
        checkBestPractices: true 
      });

      expect(result.bestPracticeSuggestions).toContainEqual(
        expect.objectContaining({
          type: 'maintainability',
          description: 'Too many parameters',
          category: 'structure'
        })
      );
    });

    it('should detect performance issues', async () => {
      const result = await validator.validate({ 
        code: 'iter(list1, iter(list2, action))',
        checkBestPractices: true 
      });

      expect(result.bestPracticeSuggestions).toContainEqual(
        expect.objectContaining({
          type: 'performance',
          description: 'Nested iter() functions can be slow',
          category: 'optimization'
        })
      );
    });

    it('should skip best practices checking when disabled', async () => {
      const result = await validator.validate({ 
        code: '   @pemit me=Hello', // Bad indentation
        checkBestPractices: false 
      });

      expect(result.bestPracticeSuggestions).toHaveLength(0);
    });
  });

  describe('server compatibility', () => {
    beforeEach(() => {
      const dialect: ServerDialect = {
        name: 'PennMUSH',
        version: '1.8.8',
        description: 'PennMUSH server',
        syntaxVariations: [],
        uniqueFeatures: [],
        securityModel: {
          permissionLevels: [],
          defaultLevel: 'player',
          escalationRules: [],
          restrictedFunctions: []
        },
        functionLibrary: [
          {
            name: 'oldfunction',
            description: 'Deprecated function',
            syntax: 'oldfunction(args)',
            parameters: [],
            returnType: 'string',
            permissions: [],
            examples: [],
            deprecated: true,
            alternativeTo: 'newfunction'
          }
        ],
        commonPatterns: [],
        limitations: [],
        documentation: {}
      };

      mockKnowledgeBase.dialects.set('PennMUSH', dialect);
    });

    it('should detect deprecated functions', async () => {
      const result = await validator.validate({ 
        code: 'oldfunction(test)',
        serverType: 'PennMUSH' 
      });

      expect(result.syntaxErrors).toContainEqual(
        expect.objectContaining({
          message: 'Deprecated function: oldfunction',
          severity: 'warning',
          code: 'DEPRECATED_FUNCTION'
        })
      );

      expect(result.compatibilityNotes).toContain('oldfunction is deprecated in PennMUSH');
      expect(result.compatibilityNotes).toContain('Consider using newfunction instead');
    });

    it('should warn about unknown functions', async () => {
      const result = await validator.validate({ 
        code: 'unknownfunction(test)',
        serverType: 'PennMUSH' 
      });

      expect(result.syntaxErrors).toContainEqual(
        expect.objectContaining({
          message: 'Unknown function: unknownfunction',
          severity: 'warning',
          code: 'UNKNOWN_FUNCTION'
        })
      );
    });
  });

  describe('scoring calculations', () => {
    it('should calculate complexity score', async () => {
      const simpleCode = '@pemit me=Hello';
      const complexCode = 'switch(iter(list, switch(%i0, case1, action1, case2, action2)), result1, final1)';

      const simpleResult = await validator.validate({ code: simpleCode });
      const complexResult = await validator.validate({ code: complexCode });

      expect(complexResult.complexityScore).toBeGreaterThan(simpleResult.complexityScore);
      expect(simpleResult.complexityScore).toBeGreaterThanOrEqual(0);
      expect(complexResult.complexityScore).toBeLessThanOrEqual(100);
    });

    it('should calculate maintainability score', async () => {
      const wellDocumentedCode = '@@ This is a greeting\n@pemit me=Hello';
      const poorCode = '   @pemit me=Hello'; // Bad indentation, no comments

      const goodResult = await validator.validate({ 
        code: wellDocumentedCode,
        checkBestPractices: true 
      });
      const poorResult = await validator.validate({ 
        code: poorCode,
        checkBestPractices: true 
      });

      expect(goodResult.maintainabilityScore).toBeGreaterThan(poorResult.maintainabilityScore);
      expect(goodResult.maintainabilityScore).toBeLessThanOrEqual(100);
      expect(poorResult.maintainabilityScore).toBeGreaterThanOrEqual(0);
    });

    it('should return perfect security score for clean code', async () => {
      const result = await validator.validate({ 
        code: '@pemit me=Hello',
        checkSecurity: true 
      });

      expect(result.securityScore).toBe(100);
    });
  });

  describe('line and column tracking', () => {
    it('should provide accurate line numbers for errors', async () => {
      const multilineCode = `@pemit me=Line 1
@pemit me="Unterminated string
@pemit me=Line 3`;

      const result = await validator.validate({ code: multilineCode });

      const stringError = result.syntaxErrors.find(e => e.code === 'UNTERMINATED_STRING');
      expect(stringError?.line).toBe(2);
    });

    it('should provide accurate column numbers', async () => {
      const result = await validator.validate({ 
        code: '@pemit me="Hello' 
      });

      const stringError = result.syntaxErrors.find(e => e.code === 'UNTERMINATED_STRING');
      expect(stringError?.column).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty lines and comments', async () => {
      const codeWithComments = `@@ This is a comment

@pemit me=Hello
@@ Another comment
`;

      const result = await validator.validate({ code: codeWithComments });
      
      // Should not error on comments and empty lines
      expect(result.syntaxErrors.filter(e => e.severity === 'error')).toHaveLength(0);
    });

    it('should handle code with only comments', async () => {
      const result = await validator.validate({ 
        code: '@@ This is just a comment\n@@ Another comment' 
      });

      expect(result.isValid).toBe(true);
      expect(result.totalLines).toBe(2);
    });

    it('should handle very short code', async () => {
      const result = await validator.validate({ code: 'hi' });

      expect(result).toBeDefined();
      expect(result.totalLines).toBe(1);
    });

    it('should handle code with special characters', async () => {
      const result = await validator.validate({ 
        code: '@pemit me=Hello 世界! 🌍' 
      });

      // Should handle Unicode characters properly
      expect(result.syntaxErrors.filter(e => e.code === 'INVALID_CHAR')).toHaveLength(0);
    });

    it('should handle complex nested expressions', async () => {
      const complexCode = 'switch(iter(lcon(here), switch(type(%i0), PLAYER, name(%i0), THING, [name(%i0)] ([get(%i0/desc)]))), result1, action1, result2, action2)';
      
      const result = await validator.validate({ code: complexCode });
      
      expect(result).toBeDefined();
      expect(result.complexityScore).toBeGreaterThan(10);
    });

    it('should handle code with escaped characters', async () => {
      const result = await validator.validate({ 
        code: '@pemit me="He said \\"Hello\\" to me"' 
      });

      // Should not report unterminated string for properly escaped quotes
      expect(result.syntaxErrors.filter(e => e.code === 'UNTERMINATED_STRING')).toHaveLength(0);
    });

    it('should handle multiline strings correctly', async () => {
      const multilineCode = `@pemit me="This is line 1
This is line 2
This is line 3"`;

      const result = await validator.validate({ code: multilineCode });
      
      // Should handle multiline strings properly
      expect(result).toBeDefined();
    });

    it('should handle regex patterns in functions', async () => {
      const result = await validator.validate({ 
        code: 'regedit(Hello World, "l+", "X")' 
      });

      // Should not error on valid regex patterns
      expect(result.syntaxErrors.filter(e => e.code === 'INVALID_REGEX')).toHaveLength(0);
    });

    it('should detect invalid regex patterns', async () => {
      const result = await validator.validate({ 
        code: 'regedit(Hello World, "[invalid", "X")' 
      });

      // Should detect invalid regex patterns
      expect(result.syntaxErrors.filter(e => e.code === 'INVALID_REGEX')).toHaveLength(1);
    });

    it('should handle very high variable numbers', async () => {
      const result = await validator.validate({ 
        code: '@pemit me=%150' 
      });

      expect(result.syntaxErrors).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('Variable number too high'),
          code: 'VAR_NUMBER_TOO_HIGH'
        })
      );
    });

    it('should handle mixed bracket types correctly', async () => {
      const result = await validator.validate({ 
        code: 'switch(test, [get(me/attr)], {action}, default)' 
      });

      // Should handle mixed bracket types without errors
      expect(result.syntaxErrors.filter(e => e.code.includes('BRACKET'))).toHaveLength(0);
    });
  });
});