/**
 * Unit tests for MUSHCODE formatting engine
 */

import { MushcodeFormatter, FormattingRequest } from '../../../src/engines/formatter.js';
import { MushcodeKnowledgeBase } from '../../../src/knowledge/base.js';
import { ValidationError } from '../../../src/utils/errors.js';

describe('MushcodeFormatter', () => {
  let formatter: MushcodeFormatter;
  let mockKnowledgeBase: jest.Mocked<MushcodeKnowledgeBase>;

  beforeEach(() => {
    mockKnowledgeBase = {
      dialects: new Map(),
      patterns: new Map(),
      securityRules: new Map(),
      examples: new Map(),
      learningPaths: new Map(),
      search: jest.fn(),
      addPattern: jest.fn(),
      addDialect: jest.fn(),
      addSecurityRule: jest.fn(),
      addExample: jest.fn(),
      addLearningPath: jest.fn(),
      getPattern: jest.fn(),
      getDialect: jest.fn(),
      getSecurityRule: jest.fn(),
      getExample: jest.fn(),
      getLearningPath: jest.fn(),
      findPatternsByCategory: jest.fn(),
      findPatternsByServer: jest.fn(),
      findExamplesByCategory: jest.fn(),
      validatePattern: jest.fn(),
      getStats: jest.fn(),
      exportData: jest.fn(),
      importData: jest.fn(),
    } as any;

    formatter = new MushcodeFormatter(mockKnowledgeBase);
  });

  describe('format', () => {
    it('should format code with readable style by default', async () => {
      const request: FormattingRequest = {
        code: '@switch %0=test,{@pemit %#=Success},{@pemit %#=Failed}'
      };

      const result = await formatter.format(request);

      expect(result.formattedCode).toBeTruthy();
      expect(result.styleNotes).toContain('readable formatting style');
    });

    it('should apply compact formatting style', async () => {
      const request: FormattingRequest = {
        code: '@switch %0 = test , { @pemit %# = Success } , { @pemit %# = Failed }',
        style: 'compact'
      };

      const result = await formatter.format(request);

      expect(result.formattedCode).not.toContain('  '); // No double spaces
      expect(result.changesMade).toContain('Removed unnecessary whitespace');
      expect(result.styleNotes).toContain('compact formatting style');
    });

    it('should apply custom formatting style', async () => {
      const request: FormattingRequest = {
        code: '@switch %0=test,{@pemit %#=Success},{@pemit %#=Failed}',
        style: 'custom',
        indentSize: 4
      };

      const result = await formatter.format(request);

      expect(result.styleNotes).toContain('custom formatting style');
    });

    it('should respect indentation size setting', async () => {
      const request: FormattingRequest = {
        code: '@switch %0=test,{@pemit %#=Success}',
        indentSize: 4
      };

      const result = await formatter.format(request);

      expect(result.styleNotes).toContain('4 spaces for indentation');
    });

    it('should respect line length setting', async () => {
      const request: FormattingRequest = {
        code: '@switch %0=test,{@pemit %#=This is a very long message that should be wrapped},{@pemit %#=Failed}',
        lineLength: 50
      };

      const result = await formatter.format(request);

      expect(result.styleNotes).toContain('50 character line length');
    });

    it('should preserve comments when requested', async () => {
      const request: FormattingRequest = {
        code: '@@ This is a comment\n@switch %0=test,{@pemit %#=Success}',
        preserveComments: true
      };

      const result = await formatter.format(request);

      expect(result.formattedCode).toContain('@@ This is a comment');
      expect(result.styleNotes).toContain('Comments were preserved');
    });

    it('should remove comments when not preserving them', async () => {
      const request: FormattingRequest = {
        code: '@@ This is a comment\n@switch %0=test,{@pemit %#=Success}',
        preserveComments: false
      };

      const result = await formatter.format(request);

      expect(result.formattedCode).not.toContain('@@ This is a comment');
      expect(result.changesMade).toContain('Removed 1 comments');
    });

    it('should apply server-specific dialect formatting', async () => {
      const mockDialect = {
        name: 'PennMUSH',
        version: '1.8.8',
        description: 'PennMUSH server dialect',
        syntaxVariations: [
          {
            ruleId: 'test-rule',
            description: 'Test rule',
            pattern: 'old_syntax',
            replacement: 'new_syntax',
            serverSpecific: true,
            examples: { before: 'old', after: 'new' }
          }
        ],
        uniqueFeatures: [],
        securityModel: {
          permissionLevels: ['public', 'player'],
          defaultLevel: 'public',
          escalationRules: [],
          restrictedFunctions: []
        },
        functionLibrary: [],
        commonPatterns: [],
        limitations: [],
        documentation: {}
      };

      mockKnowledgeBase.dialects.set('PennMUSH', mockDialect);

      const request: FormattingRequest = {
        code: 'old_syntax test',
        serverType: 'PennMUSH'
      };

      const result = await formatter.format(request);

      expect(result.formattedCode).toContain('new_syntax');
      expect(result.changesMade).toContain('Applied PennMUSH dialect formatting');
    });

    it('should handle empty code gracefully', async () => {
      const request: FormattingRequest = {
        code: '   \n  \n   '
      };

      await expect(formatter.format(request)).rejects.toThrow(ValidationError);
    });

    it('should normalize line endings', async () => {
      const request: FormattingRequest = {
        code: '@switch %0=test\r\n@pemit %#=Success\r@halt'
      };

      const result = await formatter.format(request);

      expect(result.formattedCode).not.toContain('\r');
      expect(result.formattedCode.split('\n')).toHaveLength(3);
    });

    it('should format function calls with multiple parameters', async () => {
      const request: FormattingRequest = {
        code: 'iter(list,function_with_very_long_name(%i0,%i1,%i2,%i3,%i4))'
      };

      const result = await formatter.format(request);

      expect(result.changesMade).toContain('Formatted complex function calls');
    });

    it('should add spacing around operators', async () => {
      const request: FormattingRequest = {
        code: 'eq(%0,test)!=1'
      };

      const result = await formatter.format(request);

      expect(result.formattedCode).toContain('!=');
    });

    it('should handle nested structures with proper indentation', async () => {
      const request: FormattingRequest = {
        code: '@switch %0={test},{@switch %1={inner},{@pemit %#=Deep}},{@pemit %#=Outer}'
      };

      const result = await formatter.format(request);

      expect(result.formattedCode).toBeTruthy();
      expect(result.styleNotes).toContain('readable formatting style');
    });
  });

  describe('validation', () => {
    it('should reject empty code', async () => {
      const request: FormattingRequest = {
        code: ''
      };

      await expect(formatter.format(request)).rejects.toThrow('Code is required and must be a string');
    });

    it('should reject invalid style', async () => {
      const request: FormattingRequest = {
        code: '@switch %0=test',
        style: 'invalid' as any
      };

      await expect(formatter.format(request)).rejects.toThrow('Style must be one of');
    });

    it('should reject invalid indent size', async () => {
      const request: FormattingRequest = {
        code: '@switch %0=test',
        indentSize: -1
      };

      await expect(formatter.format(request)).rejects.toThrow('Indent size must be a number between 0 and 8');
    });

    it('should reject invalid line length', async () => {
      const request: FormattingRequest = {
        code: '@switch %0=test',
        lineLength: 300
      };

      await expect(formatter.format(request)).rejects.toThrow('Line length must be a number between 40 and 200');
    });

    it('should reject unknown server type', async () => {
      const request: FormattingRequest = {
        code: '@switch %0=test',
        serverType: 'UnknownMUSH'
      };

      await expect(formatter.format(request)).rejects.toThrow('Unknown server type');
    });
  });

  describe('style-specific formatting', () => {
    const testCode = '@@ Comment\n@switch %0=test,{@pemit %#=Success},{@pemit %#=Failed}';

    it('should apply readable style correctly', async () => {
      const request: FormattingRequest = {
        code: testCode,
        style: 'readable'
      };

      const result = await formatter.format(request);

      expect(result.formattedCode).toContain('@@ Comment');
      expect(result.styleNotes).toContain('readable formatting style');
    });

    it('should apply compact style correctly', async () => {
      const request: FormattingRequest = {
        code: testCode,
        style: 'compact',
        preserveComments: false
      };

      const result = await formatter.format(request);

      expect(result.formattedCode).not.toContain('@@ Comment');
      expect(result.changesMade).toContain('Removed unnecessary whitespace');
    });

    it('should apply custom style correctly', async () => {
      const request: FormattingRequest = {
        code: testCode,
        style: 'custom',
        indentSize: 3
      };

      const result = await formatter.format(request);

      expect(result.styleNotes).toContain('custom formatting style');
      expect(result.styleNotes).toContain('3 spaces');
    });
  });

  describe('comment handling', () => {
    it('should format comment syntax correctly', async () => {
      const request: FormattingRequest = {
        code: '@This is a comment\n@switch %0=test'
      };

      const result = await formatter.format(request);

      expect(result.formattedCode).toContain('@@ This is a comment');
      expect(result.changesMade).toContain('Formatted comment syntax');
    });

    it('should normalize comment spacing', async () => {
      const request: FormattingRequest = {
        code: '@@    Multiple    spaces    in    comment'
      };

      const result = await formatter.format(request);

      expect(result.formattedCode).toContain('@@ Multiple spaces in comment');
    });
  });

  describe('line wrapping', () => {
    it('should wrap long lines at logical points', async () => {
      const longCode = '@switch %0=very_long_test_value_that_exceeds_line_length,{@pemit %#=This is a very long success message},{@pemit %#=This is a very long failure message}';
      
      const request: FormattingRequest = {
        code: longCode,
        lineLength: 60
      };

      const result = await formatter.format(request);

      expect(result.changesMade).toContain('Wrapped lines longer than 60 characters');
      const lines = result.formattedCode.split('\n');
      expect(lines.some(line => line.length <= 60)).toBe(true);
    });

    it('should not wrap comment lines', async () => {
      const request: FormattingRequest = {
        code: '@@ This is a very long comment that should not be wrapped even if it exceeds the line length limit',
        lineLength: 50
      };

      const result = await formatter.format(request);

      expect(result.formattedCode).toContain('@@ This is a very long comment');
      const lines = result.formattedCode.split('\n');
      expect(lines).toHaveLength(1);
    });
  });
});