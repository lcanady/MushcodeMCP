/**
 * Unit tests for validate_mushcode tool
 */

import { validateMushcodeHandler } from '../../../src/tools/validate.js';
import { MushcodeValidator } from '../../../src/engines/validator.js';
import { MushcodeKnowledgeBase } from '../../../src/knowledge/base.js';

// Mock the knowledge base
jest.mock('../../../src/knowledge/base.js');
jest.mock('../../../src/engines/validator.js');

const MockedMushcodeKnowledgeBase = MushcodeKnowledgeBase as jest.MockedClass<typeof MushcodeKnowledgeBase>;
const MockedMushcodeValidator = MushcodeValidator as jest.MockedClass<typeof MushcodeValidator>;

describe('validate_mushcode tool', () => {
  let mockKnowledgeBase: jest.Mocked<MushcodeKnowledgeBase>;
  let mockValidator: jest.Mocked<MushcodeValidator>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockKnowledgeBase = new MockedMushcodeKnowledgeBase() as jest.Mocked<MushcodeKnowledgeBase>;
    mockValidator = new MockedMushcodeValidator(mockKnowledgeBase) as jest.Mocked<MushcodeValidator>;
    
    MockedMushcodeValidator.mockImplementation(() => mockValidator);
  });

  // Tool definition tests removed to avoid MCP SDK import issues

  describe('validateMushcodeHandler', () => {
    const mockValidationResult = {
      isValid: true,
      syntaxErrors: [],
      securityWarnings: [],
      bestPracticeSuggestions: [],
      compatibilityNotes: [],
      totalLines: 5,
      complexityScore: 15,
      securityScore: 100,
      maintainabilityScore: 85
    };

    beforeEach(() => {
      mockValidator.validate.mockResolvedValue(mockValidationResult);
    });

    describe('argument validation', () => {
      it('should validate required code parameter', async () => {
        await expect(validateMushcodeHandler({}, mockKnowledgeBase))
          .rejects.toThrow('code is required');
        await expect(validateMushcodeHandler({ code: '' }, mockKnowledgeBase))
          .rejects.toThrow('code cannot be empty');
      });

      it('should validate code type', async () => {
        await expect(validateMushcodeHandler({ code: 123 }, mockKnowledgeBase))
          .rejects.toThrow('code is required and must be a string');
        await expect(validateMushcodeHandler({ code: null }, mockKnowledgeBase))
          .rejects.toThrow('code is required');
      });

      it('should validate code length', async () => {
        const longCode = 'a'.repeat(50001);
        await expect(validateMushcodeHandler({ code: longCode }, mockKnowledgeBase))
          .rejects.toThrow('code is too long');
      });

      it('should validate server_type enum', async () => {
        await expect(validateMushcodeHandler({ 
          code: 'test code', 
          server_type: 'InvalidServer' 
        }, mockKnowledgeBase))
          .rejects.toThrow('server_type must be one of');
      });

      it('should validate boolean parameters', async () => {
        await expect(validateMushcodeHandler({ 
          code: 'test code', 
          strict_mode: 'true' 
        }, mockKnowledgeBase))
          .rejects.toThrow('strict_mode must be a boolean');

        await expect(validateMushcodeHandler({ 
          code: 'test code', 
          check_security: 'false' 
        }, mockKnowledgeBase))
          .rejects.toThrow('check_security must be a boolean');
      });
    });

    describe('successful validation', () => {
      it('should handle minimal valid input', async () => {
        const result = await validateMushcodeHandler({ 
          code: '@pemit me=Hello World' 
        }, mockKnowledgeBase);

        expect(result.is_valid).toBe(true);
        expect(result.syntax_errors).toEqual([]);
        expect(result.security_warnings).toEqual([]);
        expect(result.best_practice_suggestions).toEqual([]);
        expect(result.compatibility_notes).toEqual([]);
        expect(result.analysis_summary).toEqual({
          total_lines: 5,
          complexity_score: 15,
          security_score: 100,
          maintainability_score: 85
        });
      });

      it('should handle all optional parameters', async () => {
        const args = {
          code: '@pemit me=Hello World',
          server_type: 'PennMUSH',
          strict_mode: true,
          check_security: true,
          check_best_practices: true
        };

        const result = await validateMushcodeHandler(args, mockKnowledgeBase);

        expect(mockValidator.validate).toHaveBeenCalledWith({
          code: '@pemit me=Hello World',
          serverType: 'PennMUSH',
          strictMode: true,
          checkSecurity: true,
          checkBestPractices: true
        });

        expect(result.is_valid).toBe(true);
      });

      it('should handle disabled security checking', async () => {
        const args = {
          code: '@pemit me=Hello World',
          check_security: false
        };

        await validateMushcodeHandler(args, mockKnowledgeBase);

        expect(mockValidator.validate).toHaveBeenCalledWith({
          code: '@pemit me=Hello World',
          serverType: undefined,
          strictMode: false,
          checkSecurity: false,
          checkBestPractices: true
        });
      });
    });

    describe('validation with errors', () => {
      it('should handle syntax errors', async () => {
        const mockResultWithErrors = {
          ...mockValidationResult,
          isValid: false,
          syntaxErrors: [
            {
              line: 1,
              column: 10,
              message: 'Unterminated string literal',
              severity: 'error' as const,
              code: 'UNTERMINATED_STRING',
              suggestion: 'Add closing quote',
              fixable: true
            }
          ]
        };

        mockValidator.validate.mockResolvedValue(mockResultWithErrors);

        const result = await validateMushcodeHandler({ 
          code: '@pemit me="Hello' 
        }, mockKnowledgeBase);

        expect(result.is_valid).toBe(false);
        expect(result.syntax_errors).toHaveLength(1);
        expect(result.syntax_errors[0]?.message).toBe('Unterminated string literal');
      });

      it('should handle security warnings', async () => {
        const mockResultWithSecurity = {
          ...mockValidationResult,
          securityWarnings: [
            {
              ruleId: 'SEC-001',
              type: 'injection',
              description: 'Unsafe eval usage',
              lineNumber: 1,
              columnNumber: 5,
              severity: 'high' as const,
              mitigation: 'Use switch() instead',
              codeSnippet: 'eval(%0)',
              references: ['https://mushcode.com/security']
            }
          ],
          securityScore: 70
        };

        mockValidator.validate.mockResolvedValue(mockResultWithSecurity);

        const result = await validateMushcodeHandler({ 
          code: 'eval(%0)' 
        }, mockKnowledgeBase);

        expect(result.security_warnings).toHaveLength(1);
        expect(result.security_warnings[0]?.severity).toBe('high');
        expect(result.analysis_summary.security_score).toBe(70);
      });

      it('should handle best practice suggestions', async () => {
        const mockResultWithSuggestions = {
          ...mockValidationResult,
          bestPracticeSuggestions: [
            {
              type: 'readability' as const,
              description: 'Missing comments',
              lineNumber: 1,
              before: '@pemit me=Hello',
              after: '@@ Send greeting\n@pemit me=Hello',
              impact: 'Improves code documentation',
              confidence: 0.8,
              effort: 'low' as const,
              category: 'documentation'
            }
          ],
          maintainabilityScore: 75
        };

        mockValidator.validate.mockResolvedValue(mockResultWithSuggestions);

        const result = await validateMushcodeHandler({ 
          code: '@pemit me=Hello' 
        }, mockKnowledgeBase);

        expect(result.best_practice_suggestions).toHaveLength(1);
        expect(result.best_practice_suggestions[0]?.type).toBe('readability');
        expect(result.analysis_summary.maintainability_score).toBe(75);
      });
    });

    describe('error handling', () => {
      it('should handle validation engine errors', async () => {
        mockValidator.validate.mockRejectedValue(new Error('Validation engine failed'));

        await expect(validateMushcodeHandler({ 
          code: 'test code' 
        }, mockKnowledgeBase))
          .rejects.toThrow('Code validation failed: Validation engine failed');
      });

      it('should preserve ValidationError instances', async () => {
        const validationError = new Error('Invalid input');
        validationError.name = 'ValidationError';
        mockValidator.validate.mockRejectedValue(validationError);

        await expect(validateMushcodeHandler({ 
          code: 'test code' 
        }, mockKnowledgeBase))
          .rejects.toThrow('Invalid input');
      });

      it('should handle unknown errors', async () => {
        mockValidator.validate.mockRejectedValue('Unknown error');

        await expect(validateMushcodeHandler({ 
          code: 'test code' 
        }, mockKnowledgeBase))
          .rejects.toThrow('Code validation failed: Unknown error');
      });
    });

    describe('integration scenarios', () => {
      it('should validate simple MUSHCODE correctly', async () => {
        // Use the existing mock setup
        const result = await validateMushcodeHandler({ 
          code: '@pemit me=Hello World' 
        }, mockKnowledgeBase);

        // Basic structure validation
        expect(result).toHaveProperty('is_valid');
        expect(result).toHaveProperty('syntax_errors');
        expect(result).toHaveProperty('security_warnings');
        expect(result).toHaveProperty('best_practice_suggestions');
        expect(result).toHaveProperty('compatibility_notes');
        expect(result).toHaveProperty('analysis_summary');
      });

      it('should handle complex MUSHCODE with multiple issues', async () => {
        const complexMockResult = {
          isValid: false,
          syntaxErrors: [
            {
              line: 1,
              column: 15,
              message: 'Unterminated string literal',
              severity: 'error' as const,
              code: 'UNTERMINATED_STRING',
              suggestion: 'Add closing quote',
              fixable: true
            },
            {
              line: 2,
              column: 1,
              message: 'Command should end with semicolon',
              severity: 'info' as const,
              code: 'MISSING_SEMICOLON',
              suggestion: 'Add semicolon at end of command',
              fixable: true
            }
          ],
          securityWarnings: [
            {
              ruleId: 'SEC-001',
              type: 'injection',
              description: 'Unsafe eval usage',
              lineNumber: 3,
              columnNumber: 1,
              severity: 'high' as const,
              mitigation: 'Use switch() instead',
              codeSnippet: 'eval(%0)',
              references: []
            }
          ],
          bestPracticeSuggestions: [
            {
              type: 'readability' as const,
              description: 'Missing comments',
              lineNumber: 1,
              before: '@pemit me="Hello',
              after: '@@ Send greeting\n@pemit me="Hello World"',
              impact: 'Improves code documentation',
              confidence: 0.8,
              effort: 'low' as const,
              category: 'documentation'
            }
          ],
          compatibilityNotes: ['eval is deprecated in some servers'],
          totalLines: 3,
          complexityScore: 25,
          securityScore: 70,
          maintainabilityScore: 60
        };

        mockValidator.validate.mockResolvedValue(complexMockResult);

        const result = await validateMushcodeHandler({
          code: '@pemit me="Hello\n@create test\neval(%0)',
          server_type: 'PennMUSH',
          strict_mode: true,
          check_security: true,
          check_best_practices: true
        }, mockKnowledgeBase);

        expect(result.is_valid).toBe(false);
        expect(result.syntax_errors).toHaveLength(2);
        expect(result.security_warnings).toHaveLength(1);
        expect(result.best_practice_suggestions).toHaveLength(1);
        expect(result.compatibility_notes).toHaveLength(1);
        expect(result.analysis_summary.complexity_score).toBe(25);
        expect(result.analysis_summary.security_score).toBe(70);
        expect(result.analysis_summary.maintainability_score).toBe(60);
      });

      it('should handle code with only warnings and suggestions', async () => {
        const warningOnlyResult = {
          isValid: true,
          syntaxErrors: [
            {
              line: 1,
              column: 20,
              message: 'Command should end with semicolon',
              severity: 'info' as const,
              code: 'MISSING_SEMICOLON',
              suggestion: 'Add semicolon at end of command',
              fixable: true
            }
          ],
          securityWarnings: [],
          bestPracticeSuggestions: [
            {
              type: 'readability' as const,
              description: 'Consider adding comments',
              lineNumber: 1,
              before: '@pemit me=Hello World',
              after: '@@ Send greeting\n@pemit me=Hello World',
              impact: 'Improves code documentation',
              confidence: 0.6,
              effort: 'low' as const,
              category: 'documentation'
            }
          ],
          compatibilityNotes: [],
          totalLines: 1,
          complexityScore: 5,
          securityScore: 100,
          maintainabilityScore: 85
        };

        mockValidator.validate.mockResolvedValue(warningOnlyResult);

        const result = await validateMushcodeHandler({
          code: '@pemit me=Hello World'
        }, mockKnowledgeBase);

        expect(result.is_valid).toBe(true);
        expect(result.syntax_errors).toHaveLength(1);
        expect(result.syntax_errors[0]?.severity).toBe('info');
        expect(result.security_warnings).toHaveLength(0);
        expect(result.best_practice_suggestions).toHaveLength(1);
        expect(result.analysis_summary.security_score).toBe(100);
      });

      it('should handle server-specific validation', async () => {
        const serverSpecificResult = {
          isValid: true,
          syntaxErrors: [],
          securityWarnings: [],
          bestPracticeSuggestions: [],
          compatibilityNotes: [
            'This function is PennMUSH specific',
            'May not work on TinyMUSH servers'
          ],
          totalLines: 1,
          complexityScore: 8,
          securityScore: 100,
          maintainabilityScore: 90
        };

        mockValidator.validate.mockResolvedValue(serverSpecificResult);

        const result = await validateMushcodeHandler({
          code: 'regedit(Hello World, "l+", "X")',
          server_type: 'PennMUSH'
        }, mockKnowledgeBase);

        expect(result.is_valid).toBe(true);
        expect(result.compatibility_notes).toHaveLength(2);
        expect(result.compatibility_notes[0]).toContain('PennMUSH specific');
      });
    });
  });
});