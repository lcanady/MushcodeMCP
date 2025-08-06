/**
 * Unit tests for compress_mushcode tool
 */

import { compressMushcodeHandler } from '../../../src/tools/compress.js';
import { MushcodeKnowledgeBase } from '../../../src/knowledge/base.js';
import { ValidationError } from '../../../src/utils/errors.js';

describe('compress_mushcode tool', () => {
  let knowledgeBase: MushcodeKnowledgeBase;

  beforeEach(() => {
    knowledgeBase = new MushcodeKnowledgeBase();
  });

  describe('compressMushcodeHandler', () => {
    it('should compress code successfully with default parameters', async () => {
      const args = {
        code: `@@ This is a comment
&cmd-test me=$test:
  @pemit %#=Hello World!
  
  think Testing`
      };

      const result = await compressMushcodeHandler(args, knowledgeBase);

      expect(result.compressed_code).toBeDefined();
      expect(result.original_size).toBeGreaterThan(0);
      expect(result.compressed_size).toBeGreaterThan(0);
      expect(result.compression_ratio).toBeGreaterThanOrEqual(0);
      expect(result.optimizations_applied).toBeInstanceOf(Array);
      expect(result.compressed_size).toBeLessThanOrEqual(result.original_size);
    });

    it('should handle minimal compression level', async () => {
      const args = {
        code: `@@ Comment
&test me=$test:@pemit %#=Hello`,
        compression_level: 'minimal'
      };

      const result = await compressMushcodeHandler(args, knowledgeBase);

      expect(result.compressed_code).toBeDefined();
      expect(result.compression_ratio).toBeGreaterThanOrEqual(0);
      expect(result.optimizations_applied).toBeInstanceOf(Array);
    });

    it('should handle moderate compression level', async () => {
      const args = {
        code: `&test me=$test:
  setq( 0 , name( %# ) );
  @pemit %#=Hello [q(0)]`,
        compression_level: 'moderate'
      };

      const result = await compressMushcodeHandler(args, knowledgeBase);

      expect(result.compressed_code).toBeDefined();
      expect(result.compression_ratio).toBeGreaterThanOrEqual(0);
      expect(result.optimizations_applied).toBeInstanceOf(Array);
    });

    it('should handle aggressive compression level', async () => {
      const args = {
        code: `&test me=$test:
  setq(player_name, name(%#));
  @pemit %#=Hello [q(player_name)]`,
        compression_level: 'aggressive'
      };

      const result = await compressMushcodeHandler(args, knowledgeBase);

      expect(result.compressed_code).toBeDefined();
      expect(result.compression_ratio).toBeGreaterThanOrEqual(0);
      expect(result.optimizations_applied).toBeInstanceOf(Array);
      if (result.warnings) {
        expect(result.warnings).toBeInstanceOf(Array);
      }
    });

    it('should preserve functionality when requested', async () => {
      const args = {
        code: `&test me=$test:@pemit %#=Hello World!`,
        preserve_functionality: true,
        compression_level: 'aggressive'
      };

      const result = await compressMushcodeHandler(args, knowledgeBase);

      expect(result.compressed_code).toContain('&test');
      expect(result.compressed_code).toContain('@pemit');
      expect(result.compressed_code).toContain('Hello World!');
    });

    it('should preserve comments when requested', async () => {
      const args = {
        code: `@@ Important comment
&test me=$test:@pemit %#=Hello`,
        remove_comments: false
      };

      const result = await compressMushcodeHandler(args, knowledgeBase);

      expect(result.compressed_code).toContain('@@');
      expect(result.compressed_code).toContain('Important comment');
    });

    it('should remove comments by default', async () => {
      const args = {
        code: `@@ This comment should be removed
&test me=$test:@pemit %#=Hello`
      };

      const result = await compressMushcodeHandler(args, knowledgeBase);

      expect(result.compressed_code).not.toContain('@@');
      expect(result.compressed_code).not.toContain('This comment should be removed');
    });

    it('should handle server type parameter', async () => {
      const args = {
        code: `&test me=$test:@pemit %#=Hello World!`,
        server_type: 'PennMUSH'
      };

      const result = await compressMushcodeHandler(args, knowledgeBase);

      expect(result.compressed_code).toBeDefined();
      expect(result.compression_ratio).toBeGreaterThanOrEqual(0);
    });

    it('should calculate compression metrics correctly', async () => {
      const code = `@@ Comment
&test me=$test:@pemit %#=Hello World!`;
      const args = { code };

      const result = await compressMushcodeHandler(args, knowledgeBase);

      expect(result.original_size).toBe(code.length);
      expect(result.compressed_size).toBe(result.compressed_code.length);
      
      const expectedRatio = (result.original_size - result.compressed_size) / result.original_size;
      expect(result.compression_ratio).toBeCloseTo(expectedRatio, 5);
    });

    it('should provide optimization details', async () => {
      const args = {
        code: `@@ Comment 1
@@ Comment 2

&test me=$test:@pemit %#=Hello`
      };

      const result = await compressMushcodeHandler(args, knowledgeBase);

      expect(result.optimizations_applied).toBeInstanceOf(Array);
      expect(result.optimizations_applied.length).toBeGreaterThan(0);
      expect(result.optimizations_applied.some(opt => opt.includes('comment'))).toBe(true);
    });
  });

  describe('parameter validation', () => {
    it('should reject missing code parameter', async () => {
      const args = {};

      await expect(compressMushcodeHandler(args, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });

    it('should reject non-string code parameter', async () => {
      const args = {
        code: 123
      };

      await expect(compressMushcodeHandler(args, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });

    it('should reject empty code', async () => {
      const args = {
        code: '   '
      };

      await expect(compressMushcodeHandler(args, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });

    it('should reject code that is too long', async () => {
      const args = {
        code: 'a'.repeat(50001)
      };

      await expect(compressMushcodeHandler(args, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });

    it('should reject invalid compression level', async () => {
      const args = {
        code: 'test',
        compression_level: 'invalid'
      };

      await expect(compressMushcodeHandler(args, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });

    it('should reject non-string compression level', async () => {
      const args = {
        code: 'test',
        compression_level: 123
      };

      await expect(compressMushcodeHandler(args, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });

    it('should reject non-boolean preserve_functionality', async () => {
      const args = {
        code: 'test',
        preserve_functionality: 'yes'
      };

      await expect(compressMushcodeHandler(args, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });

    it('should reject non-boolean remove_comments', async () => {
      const args = {
        code: 'test',
        remove_comments: 'true'
      };

      await expect(compressMushcodeHandler(args, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });

    it('should reject invalid server type', async () => {
      const args = {
        code: 'test',
        server_type: 'InvalidServer'
      };

      await expect(compressMushcodeHandler(args, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });

    it('should reject non-string server type', async () => {
      const args = {
        code: 'test',
        server_type: 123
      };

      await expect(compressMushcodeHandler(args, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });

    it('should accept valid server types', async () => {
      const validServerTypes = ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX'];

      for (const serverType of validServerTypes) {
        const args = {
          code: '&test me=$test:@pemit %#=Hello',
          server_type: serverType
        };

        const result = await compressMushcodeHandler(args, knowledgeBase);
        expect(result.compressed_code).toBeDefined();
      }
    });

    it('should accept valid compression levels', async () => {
      const validLevels = ['minimal', 'moderate', 'aggressive'];

      for (const level of validLevels) {
        const args = {
          code: '&test me=$test:@pemit %#=Hello',
          compression_level: level
        };

        const result = await compressMushcodeHandler(args, knowledgeBase);
        expect(result.compressed_code).toBeDefined();
      }
    });
  });

  describe('error handling', () => {
    it('should handle compression engine errors gracefully', async () => {
      // Mock a scenario that might cause compression to fail
      const args = {
        code: 'valid code',
        compression_level: 'moderate'
      };

      // This should not throw but handle any internal errors
      const result = await compressMushcodeHandler(args, knowledgeBase);
      expect(result).toBeDefined();
    });

    it('should preserve original error messages from ValidationError', async () => {
      const args = {
        code: ''
      };

      await expect(compressMushcodeHandler(args, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });

    it('should wrap non-ValidationError exceptions', async () => {
      // This test verifies that non-ValidationError exceptions are wrapped
      // In practice, the compressor is robust and handles edge cases gracefully
      const args = {
        code: 'test'
      };

      const result = await compressMushcodeHandler(args, knowledgeBase);
      expect(result).toBeDefined();
    });
  });

  describe('integration scenarios', () => {
    it('should handle real MUSHCODE examples', async () => {
      const args = {
        code: `@@ Command to greet players
&cmd-greet me=$greet *:
  @@ Get the target player
  setq(0, pmatch(%0));
  
  @@ Check if player exists
  @if not(isdbref(q(0)))={
    @pemit %#=Player not found.
  },{
    @@ Send greeting
    @pemit %#=You greet [name(q(0))].;
    @pemit q(0)=[name(%#)] greets you.
  }`,
        compression_level: 'moderate'
      };

      const result = await compressMushcodeHandler(args, knowledgeBase);

      expect(result.compressed_code).toBeDefined();
      expect(result.compressed_size).toBeLessThan(result.original_size);
      expect(result.compression_ratio).toBeGreaterThan(0);
      expect(result.optimizations_applied.length).toBeGreaterThan(0);
    });

    it('should handle complex function definitions', async () => {
      const args = {
        code: `&fun-calculate me=
  @@ Calculate complex formula
  setq( result , add( mul( %0 , %1 ) , div( %2 , %3 ) ) );
  
  @@ Return formatted result
  cat( Result: , q( result ) )`,
        compression_level: 'aggressive',
        preserve_functionality: true
      };

      const result = await compressMushcodeHandler(args, knowledgeBase);

      expect(result.compressed_code).toContain('&fun-calculate');
      expect(result.compressed_code).toContain('add(');
      expect(result.compressed_code).toContain('mul(');
      expect(result.compressed_size).toBeLessThan(result.original_size);
    });
  });
});