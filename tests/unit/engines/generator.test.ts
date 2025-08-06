/**
 * Unit tests for MushcodeGenerator engine
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { MushcodeGenerator } from '../../../src/engines/generator.js';
import { MushcodeKnowledgeBase } from '../../../src/knowledge/base.js';
import { MushcodePopulator } from '../../../src/knowledge/populator.js';

describe('MushcodeGenerator', () => {
  let generator: MushcodeGenerator;
  let knowledgeBase: MushcodeKnowledgeBase;

  beforeEach(async () => {
    knowledgeBase = new MushcodeKnowledgeBase();
    const populator = new MushcodePopulator(knowledgeBase);
    await populator.populateFromMushcodeCom();
    generator = new MushcodeGenerator(knowledgeBase);
  });

  describe('basic generation', () => {
    it('should generate code for simple description', async () => {
      const result = await generator.generate({
        description: 'create a hello command'
      });

      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
      expect(result.explanation).toBeDefined();
      expect(result.usageExample).toBeDefined();
      expect(result.compatibility).toBeDefined();
      expect(Array.isArray(result.compatibility)).toBe(true);
    });

    it('should handle function type specification', async () => {
      const result = await generator.generate({
        description: 'create a greeting function',
        functionType: 'function'
      });

      expect(result.code).toBeDefined();
      expect(result.explanation).toContain('function');
    });

    it('should handle server type specification', async () => {
      const result = await generator.generate({
        description: 'create a basic command',
        serverType: 'PennMUSH'
      });

      expect(result.compatibility).toContain('PennMUSH');
    });

    it('should include comments by default', async () => {
      const result = await generator.generate({
        description: 'create a simple command'
      });

      expect(result.code).toContain('@@');
    });

    it('should exclude comments when requested', async () => {
      const result = await generator.generate({
        description: 'create a simple command',
        includeComments: false
      });

      expect(result.code).not.toContain('@@');
    });
  });

  describe('error handling', () => {
    it('should throw error for empty description', async () => {
      await expect(generator.generate({
        description: ''
      })).rejects.toThrow('Description is required');
    });

    it('should throw error for too long description', async () => {
      const longDescription = 'a'.repeat(1001);
      await expect(generator.generate({
        description: longDescription
      })).rejects.toThrow('Description is too long');
    });

    it('should throw error for unknown server type', async () => {
      await expect(generator.generate({
        description: 'test command',
        serverType: 'UnknownServer'
      })).rejects.toThrow('Unknown server type');
    });
  });
});