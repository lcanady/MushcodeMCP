/**
 * Unit tests for format_mushcode tool
 */

import { formatMushcodeTool, formatMushcodeHandler } from '../../../src/tools/format.js';
import { MushcodeKnowledgeBase } from '../../../src/knowledge/base.js';
import { ValidationError } from '../../../src/utils/errors.js';

describe('format_mushcode tool', () => {
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
  });

  describe('tool definition', () => {
    it('should have correct tool name', () => {
      expect(formatMushcodeTool.name).toBe('format_mushcode');
    });

    it('should have proper description', () => {
      expect(formatMushcodeTool.description).toContain('Format MUSHCODE');
    });

    it('should require code parameter', () => {
      expect(formatMushcodeTool.inputSchema['required']).toContain('code');
    });

    it('should have correct parameter types', () => {
      const properties = formatMushcodeTool.inputSchema.properties as any;
      expect(properties['code'].type).toBe('string');
      expect(properties['style'].type).toBe('string');
      expect(properties['indent_size'].type).toBe('number');
      expect(properties['line_length'].type).toBe('number');
      expect(properties['preserve_comments'].type).toBe('boolean');
      expect(properties['server_type'].type).toBe('string');
    });

    it('should have valid style enum values', () => {
      const properties = formatMushcodeTool.inputSchema.properties as any;
      const styleEnum = properties['style'].enum;
      expect(styleEnum).toContain('readable');
      expect(styleEnum).toContain('compact');
      expect(styleEnum).toContain('custom');
    });

    it('should have valid server type enum values', () => {
      const properties = formatMushcodeTool.inputSchema.properties as any;
      const serverEnum = properties['server_type'].enum;
      expect(serverEnum).toContain('PennMUSH');
      expect(serverEnum).toContain('TinyMUSH');
      expect(serverEnum).toContain('RhostMUSH');
    });
  });

  describe('formatMushcodeHandler', () => {
    it('should format code successfully with minimal parameters', async () => {
      const args = {
        code: '@switch %0=test,{@pemit %#=Success}'
      };

      const result = await formatMushcodeHandler(args, mockKnowledgeBase);

      expect(result).toHaveProperty('formatted_code');
      expect(result).toHaveProperty('changes_made');
      expect(result).toHaveProperty('style_notes');
      expect(typeof result.formatted_code).toBe('string');
      expect(Array.isArray(result.changes_made)).toBe(true);
      expect(typeof result.style_notes).toBe('string');
    });

    it('should format code with all parameters', async () => {
      // Add mock dialect to knowledge base
      const mockDialect = {
        name: 'PennMUSH',
        version: '1.8.8',
        description: 'PennMUSH server dialect',
        syntaxVariations: [],
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

      const args = {
        code: '@switch %0=test,{@pemit %#=Success},{@pemit %#=Failed}',
        style: 'readable',
        indent_size: 4,
        line_length: 100,
        preserve_comments: true,
        server_type: 'PennMUSH'
      };

      const result = await formatMushcodeHandler(args, mockKnowledgeBase);

      expect(result.formatted_code).toBeTruthy();
      expect(result.changes_made).toBeTruthy();
      expect(result.style_notes).toContain('readable formatting style');
    });

    it('should handle compact style', async () => {
      const args = {
        code: '@switch %0 = test , { @pemit %# = Success }',
        style: 'compact'
      };

      const result = await formatMushcodeHandler(args, mockKnowledgeBase);

      expect(result.style_notes).toContain('compact formatting style');
      expect(result.changes_made).toContain('Removed unnecessary whitespace');
    });

    it('should handle custom style with specific settings', async () => {
      const args = {
        code: '@switch %0=test,{@pemit %#=Success}',
        style: 'custom',
        indent_size: 3,
        line_length: 120
      };

      const result = await formatMushcodeHandler(args, mockKnowledgeBase);

      expect(result.style_notes).toContain('custom formatting style');
      expect(result.style_notes).toContain('3 spaces');
    });

    it('should preserve comments when requested', async () => {
      const args = {
        code: '@@ This is a comment\n@switch %0=test',
        preserve_comments: true
      };

      const result = await formatMushcodeHandler(args, mockKnowledgeBase);

      expect(result.formatted_code).toContain('@@ This is a comment');
      expect(result.style_notes).toContain('Comments were preserved');
    });

    it('should remove comments when not preserving them', async () => {
      const args = {
        code: '@@ This is a comment\n@switch %0=test',
        preserve_comments: false
      };

      const result = await formatMushcodeHandler(args, mockKnowledgeBase);

      expect(result.formatted_code).not.toContain('@@ This is a comment');
      expect(result.style_notes).toContain('Comments were removed');
    });
  });

  describe('parameter validation', () => {
    it('should reject missing code parameter', async () => {
      const args = {};

      await expect(formatMushcodeHandler(args, mockKnowledgeBase))
        .rejects.toThrow('code is required and must be a string');
    });

    it('should reject non-string code parameter', async () => {
      const args = {
        code: 123
      };

      await expect(formatMushcodeHandler(args, mockKnowledgeBase))
        .rejects.toThrow('code is required and must be a string');
    });

    it('should reject empty code', async () => {
      const args = {
        code: '   '
      };

      await expect(formatMushcodeHandler(args, mockKnowledgeBase))
        .rejects.toThrow('code cannot be empty');
    });

    it('should reject code that is too long', async () => {
      const args = {
        code: 'x'.repeat(10001)
      };

      await expect(formatMushcodeHandler(args, mockKnowledgeBase))
        .rejects.toThrow('code is too long (max 10000 characters)');
    });

    it('should reject invalid style', async () => {
      const args = {
        code: '@switch %0=test',
        style: 'invalid'
      };

      await expect(formatMushcodeHandler(args, mockKnowledgeBase))
        .rejects.toThrow('style must be one of: readable, compact, custom');
    });

    it('should reject non-string style', async () => {
      const args = {
        code: '@switch %0=test',
        style: 123
      };

      await expect(formatMushcodeHandler(args, mockKnowledgeBase))
        .rejects.toThrow('style must be a string');
    });

    it('should reject invalid indent_size', async () => {
      const args = {
        code: '@switch %0=test',
        indent_size: -1
      };

      await expect(formatMushcodeHandler(args, mockKnowledgeBase))
        .rejects.toThrow('indent_size must be between 0 and 8');
    });

    it('should reject non-number indent_size', async () => {
      const args = {
        code: '@switch %0=test',
        indent_size: 'four'
      };

      await expect(formatMushcodeHandler(args, mockKnowledgeBase))
        .rejects.toThrow('indent_size must be a number');
    });

    it('should reject invalid line_length', async () => {
      const args = {
        code: '@switch %0=test',
        line_length: 300
      };

      await expect(formatMushcodeHandler(args, mockKnowledgeBase))
        .rejects.toThrow('line_length must be between 40 and 200');
    });

    it('should reject non-number line_length', async () => {
      const args = {
        code: '@switch %0=test',
        line_length: 'long'
      };

      await expect(formatMushcodeHandler(args, mockKnowledgeBase))
        .rejects.toThrow('line_length must be a number');
    });

    it('should reject non-boolean preserve_comments', async () => {
      const args = {
        code: '@switch %0=test',
        preserve_comments: 'yes'
      };

      await expect(formatMushcodeHandler(args, mockKnowledgeBase))
        .rejects.toThrow('preserve_comments must be a boolean');
    });

    it('should reject invalid server_type', async () => {
      const args = {
        code: '@switch %0=test',
        server_type: 'UnknownMUSH'
      };

      await expect(formatMushcodeHandler(args, mockKnowledgeBase))
        .rejects.toThrow('server_type must be one of: PennMUSH, TinyMUSH, RhostMUSH, TinyMUX, MUX');
    });

    it('should reject non-string server_type', async () => {
      const args = {
        code: '@switch %0=test',
        server_type: 123
      };

      await expect(formatMushcodeHandler(args, mockKnowledgeBase))
        .rejects.toThrow('server_type must be a string');
    });
  });

  describe('edge cases', () => {
    it('should handle code with only whitespace after trimming', async () => {
      const args = {
        code: '   \n  \t  \n   '
      };

      await expect(formatMushcodeHandler(args, mockKnowledgeBase))
        .rejects.toThrow('code cannot be empty');
    });

    it('should handle code with mixed line endings', async () => {
      const args = {
        code: '@switch %0=test\r\n@pemit %#=Success\r@halt'
      };

      const result = await formatMushcodeHandler(args, mockKnowledgeBase);

      expect(result.formatted_code).not.toContain('\r');
    });

    it('should handle code with complex nested structures', async () => {
      const args = {
        code: '@switch %0={test},{@switch %1={inner},{@pemit %#=Deep},{@pemit %#=NotDeep}},{@pemit %#=Outer}'
      };

      const result = await formatMushcodeHandler(args, mockKnowledgeBase);

      expect(result.formatted_code).toBeTruthy();
      expect(result.changes_made.length).toBeGreaterThan(0);
    });

    it('should handle code with various comment styles', async () => {
      const args = {
        code: '@This is a comment\n@@This is also a comment\n@switch %0=test'
      };

      const result = await formatMushcodeHandler(args, mockKnowledgeBase);

      expect(result.formatted_code).toContain('@@');
    });

    it('should handle minimum valid parameters', async () => {
      const args = {
        code: '@',
        indent_size: 0,
        line_length: 40
      };

      const result = await formatMushcodeHandler(args, mockKnowledgeBase);

      expect(result.formatted_code).toBe('@');
    });

    it('should handle maximum valid parameters', async () => {
      // Add mock dialect to knowledge base
      const mockDialect = {
        name: 'PennMUSH',
        version: '1.8.8',
        description: 'PennMUSH server dialect',
        syntaxVariations: [],
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

      const args = {
        code: '@switch %0=test,{@pemit %#=Success}',
        style: 'readable',
        indent_size: 8,
        line_length: 200,
        preserve_comments: true,
        server_type: 'PennMUSH'
      };

      const result = await formatMushcodeHandler(args, mockKnowledgeBase);

      expect(result.formatted_code).toBeTruthy();
      expect(result.style_notes).toContain('8 spaces for indentation');
      expect(result.style_notes).toContain('200 character line length');
    });
  });

  describe('error handling', () => {
    it('should wrap non-ValidationError exceptions', async () => {
      // Mock the formatter to throw a non-ValidationError
      const originalFormat = require('../../../src/engines/formatter.js').MushcodeFormatter.prototype.format;
      require('../../../src/engines/formatter.js').MushcodeFormatter.prototype.format = jest.fn()
        .mockRejectedValue(new Error('Unexpected error'));

      const args = {
        code: '@switch %0=test'
      };

      await expect(formatMushcodeHandler(args, mockKnowledgeBase))
        .rejects.toThrow('Code formatting failed: Unexpected error');

      // Restore original method
      require('../../../src/engines/formatter.js').MushcodeFormatter.prototype.format = originalFormat;
    });

    it('should preserve ValidationError exceptions', async () => {
      const args = {
        code: ''
      };

      await expect(formatMushcodeHandler(args, mockKnowledgeBase))
        .rejects.toThrow(ValidationError);
    });
  });
});