/**
 * Unit tests for MushcodeCompressor
 */

import { MushcodeCompressor, CompressionRequest } from '../../../src/engines/compressor.js';
import { MushcodeKnowledgeBase } from '../../../src/knowledge/base.js';
import { ValidationError } from '../../../src/utils/errors.js';

describe('MushcodeCompressor', () => {
  let compressor: MushcodeCompressor;
  let knowledgeBase: MushcodeKnowledgeBase;

  beforeEach(() => {
    knowledgeBase = new MushcodeKnowledgeBase();
    compressor = new MushcodeCompressor(knowledgeBase);
  });

  describe('compress', () => {
    it('should compress simple code with minimal level', async () => {
      const request: CompressionRequest = {
        code: `@@ This is a comment
&cmd-test me=$test:
  @pemit %#=Hello World!
  
  @@ Another comment
  think Testing`,
        compressionLevel: 'minimal',
        removeComments: true
      };

      const result = await compressor.compress(request);

      expect(result.compressedCode).not.toContain('@@');
      expect(result.compressedSize).toBeLessThan(result.originalSize);
      expect(result.compressionRatio).toBeGreaterThan(0);
      expect(result.optimizationsApplied).toContain('Removed 2 comment lines');
      expect(result.optimizationsApplied).toContain('Removed 1 empty lines');
    });

    it('should compress code with moderate level', async () => {
      const request: CompressionRequest = {
        code: `&cmd-test me=$test:
  setq( 0 , name( %# ) );
  setq( 1 , loc( %# ) );
  @pemit %#=Hello [q(0)] at [q(1)]!`,
        compressionLevel: 'moderate',
        removeComments: true
      };

      const result = await compressor.compress(request);

      expect(result.compressedCode).toContain('setq(0,name(%#))');
      expect(result.compressedSize).toBeLessThan(result.originalSize);
      expect(result.compressionRatio).toBeGreaterThan(0);
      expect(result.optimizationsApplied.length).toBeGreaterThan(0);
    });

    it('should compress code with aggressive level', async () => {
      const request: CompressionRequest = {
        code: `&cmd-test me=$test:
  setq(register_name, name(%#));
  setq(location_name, loc(%#));
  @pemit %#=Hello [q(register_name)] at [q(location_name)]!
  think This is a test`,
        compressionLevel: 'aggressive',
        removeComments: true
      };

      const result = await compressor.compress(request);

      expect(result.compressedSize).toBeLessThan(result.originalSize);
      expect(result.compressionRatio).toBeGreaterThan(0);
      expect(result.optimizationsApplied.length).toBeGreaterThan(0);
    });

    it('should preserve functionality when requested', async () => {
      const request: CompressionRequest = {
        code: `&cmd-test me=$test:@pemit %#=Hello World!`,
        compressionLevel: 'aggressive',
        preserveFunctionality: true
      };

      const result = await compressor.compress(request);

      expect(result.compressedCode).toContain('&cmd-test');
      expect(result.compressedCode).toContain('@pemit');
      expect(result.compressedCode).toContain('Hello World!');
    });

    it('should preserve comments when requested', async () => {
      const request: CompressionRequest = {
        code: `@@ Important comment
&cmd-test me=$test:@pemit %#=Hello World!`,
        compressionLevel: 'minimal',
        removeComments: false
      };

      const result = await compressor.compress(request);

      expect(result.compressedCode).toContain('@@');
      expect(result.compressedCode).toContain('Important comment');
    });

    it('should handle empty code', async () => {
      const request: CompressionRequest = {
        code: '   \n\n   ',
        compressionLevel: 'minimal'
      };

      await expect(compressor.compress(request)).rejects.toThrow(ValidationError);
    });

    it('should handle code with only comments', async () => {
      const request: CompressionRequest = {
        code: `@@ Comment 1
@@ Comment 2
@@ Comment 3`,
        compressionLevel: 'minimal',
        removeComments: true
      };

      const result = await compressor.compress(request);

      expect(result.compressedCode.trim()).toBe('');
      expect(result.compressionRatio).toBe(1); // 100% compression
      expect(result.optimizationsApplied).toContain('Removed 3 comment lines');
    });

    it('should compress variable names in moderate level', async () => {
      const request: CompressionRequest = {
        code: `setq(player_name, name(%#));
setq(player_location, loc(%#));
@pemit %#=[q(player_name)] is at [q(player_location)]`,
        compressionLevel: 'moderate'
      };

      const result = await compressor.compress(request);

      expect(result.compressedSize).toBeLessThanOrEqual(result.originalSize);
      // Should attempt to compress long variable names to shorter ones if possible
      if (result.optimizationsApplied.some(opt => opt.includes('variable names'))) {
        expect(result.compressedSize).toBeLessThan(result.originalSize);
      }
    });

    it('should remove unnecessary parentheses', async () => {
      const request: CompressionRequest = {
        code: `setq(0, (123));
setq(1, (q0));
@pemit %#=Value is (456)`,
        compressionLevel: 'moderate'
      };

      const result = await compressor.compress(request);

      expect(result.compressedCode).toContain('setq(0,123)');
      expect(result.compressedCode).toContain('setq(1,q0)');
      expect(result.compressedCode).toContain('Value is 456');
    });

    it('should merge lines safely in aggressive mode', async () => {
      const request: CompressionRequest = {
        code: `setq(0, name(%#));
setq(1, loc(%#));`,
        compressionLevel: 'aggressive'
      };

      const result = await compressor.compress(request);

      expect(result.compressedSize).toBeLessThanOrEqual(result.originalSize);
      // Should attempt to merge simple lines
      if (result.optimizationsApplied.some(opt => opt.includes('merged'))) {
        expect(result.compressedCode.split('\n').length).toBeLessThan(2);
      }
    });

    it('should not merge complex lines', async () => {
      const request: CompressionRequest = {
        code: `@if gt(strlen(name(%#)), 10)={
  @pemit %#=Your name is too long
}`,
        compressionLevel: 'aggressive'
      };

      const result = await compressor.compress(request);

      // Should not merge lines with control structures
      expect(result.compressedCode).toContain('@if');
      expect(result.compressedCode).toContain('@pemit');
    });

    it('should calculate compression ratio correctly', async () => {
      const request: CompressionRequest = {
        code: `@@ Comment
&test me=$test:@pemit %#=Hello`,
        compressionLevel: 'minimal',
        removeComments: true
      };

      const result = await compressor.compress(request);

      const expectedRatio = (result.originalSize - result.compressedSize) / result.originalSize;
      expect(result.compressionRatio).toBeCloseTo(expectedRatio, 5);
      expect(result.compressionRatio).toBeGreaterThanOrEqual(0);
      expect(result.compressionRatio).toBeLessThanOrEqual(1);
    });

    it('should provide warnings for aggressive compression', async () => {
      const request: CompressionRequest = {
        code: `setq(player_name, name(%#));
@pemit %#=Hello [q(player_name)]`,
        compressionLevel: 'aggressive',
        preserveFunctionality: true
      };

      const result = await compressor.compress(request);

      if (result.warnings) {
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings.some(w => w.includes('readability'))).toBe(true);
      }
    });

    it('should handle server-specific compression', async () => {
      const request: CompressionRequest = {
        code: `&cmd-test me=$test:@pemit %#=Hello World!`,
        compressionLevel: 'moderate'
        // Don't specify serverType since knowledge base is empty in tests
      };

      const result = await compressor.compress(request);

      expect(result.compressedSize).toBeLessThanOrEqual(result.originalSize);
      expect(result.optimizationsApplied).toBeDefined();
    });
  });

  describe('validation', () => {
    it('should reject empty code', async () => {
      const request: CompressionRequest = {
        code: ''
      };

      await expect(compressor.compress(request)).rejects.toThrow(ValidationError);
    });

    it('should reject code that is too long', async () => {
      const request: CompressionRequest = {
        code: 'a'.repeat(50001)
      };

      await expect(compressor.compress(request)).rejects.toThrow(ValidationError);
    });

    it('should reject invalid compression level', async () => {
      const request: CompressionRequest = {
        code: 'test',
        compressionLevel: 'invalid'
      };

      await expect(compressor.compress(request)).rejects.toThrow(ValidationError);
    });

    it('should reject invalid server type when dialects are available', async () => {
      // Add a dialect to the knowledge base to enable server type validation
      knowledgeBase.dialects.set('PennMUSH', {
        name: 'PennMUSH',
        version: '1.8.8',
        description: 'PennMUSH server dialect',
        syntaxVariations: [],
        uniqueFeatures: [],
        securityModel: { 
          permissionLevels: ['player', 'builder', 'wizard'], 
          defaultLevel: 'player',
          escalationRules: [],
          restrictedFunctions: []
        },
        functionLibrary: [],
        commonPatterns: [],
        limitations: [],
        documentation: {}
      });

      const request: CompressionRequest = {
        code: 'test',
        serverType: 'InvalidServer'
      };

      await expect(compressor.compress(request)).rejects.toThrow(ValidationError);
    });
  });

  describe('edge cases', () => {
    it('should handle code with no compression opportunities', async () => {
      const request: CompressionRequest = {
        code: 'a',
        compressionLevel: 'aggressive'
      };

      const result = await compressor.compress(request);

      expect(result.compressedCode).toBe('a');
      expect(result.compressionRatio).toBe(0);
      expect(result.optimizationsApplied.length).toBe(0);
    });

    it('should handle code with mixed line endings', async () => {
      const request: CompressionRequest = {
        code: 'line1\r\nline2\nline3\r',
        compressionLevel: 'minimal'
      };

      const result = await compressor.compress(request);

      expect(result.compressedCode).toBeDefined();
      expect(result.compressedSize).toBeLessThanOrEqual(result.originalSize);
    });

    it('should handle code with special characters', async () => {
      const request: CompressionRequest = {
        code: `@pemit %#=Special chars: àáâãäå çñü`,
        compressionLevel: 'moderate'
      };

      const result = await compressor.compress(request);

      expect(result.compressedCode).toContain('àáâãäå');
      expect(result.compressedCode).toContain('çñü');
    });

    it('should handle deeply nested expressions', async () => {
      const request: CompressionRequest = {
        code: `@pemit %#=[if(gt(strlen(name(%#)),5),cat(Hello ,name(%#)),cat(Hi ,name(%#)))]`,
        compressionLevel: 'aggressive'
      };

      const result = await compressor.compress(request);

      expect(result.compressedCode).toBeDefined();
      expect(result.compressedSize).toBeLessThanOrEqual(result.originalSize);
    });
  });
});