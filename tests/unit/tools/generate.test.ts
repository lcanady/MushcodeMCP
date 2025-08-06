/**
 * Unit tests for generate_mushcode tool
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { generateMushcodeHandler, generateMushcodeTool } from '../../../src/tools/generate.js';
import { MushcodeKnowledgeBase } from '../../../src/knowledge/base.js';
import { MushcodePopulator } from '../../../src/knowledge/populator.js';
import { ValidationError } from '../../../src/utils/errors.js';

describe('generate_mushcode tool', () => {
  let knowledgeBase: MushcodeKnowledgeBase;
  let populator: MushcodePopulator;

  beforeEach(async () => {
    knowledgeBase = new MushcodeKnowledgeBase();
    populator = new MushcodePopulator(knowledgeBase);
    await populator.populateFromMushcodeCom();
  });

  describe('tool definition', () => {
    it('should have correct tool name', () => {
      expect(generateMushcodeTool.name).toBe('generate_mushcode');
    });

    it('should have proper description', () => {
      expect(generateMushcodeTool.description).toContain('Generate MUSHCODE');
    });

    it('should have required input schema', () => {
      expect(generateMushcodeTool.inputSchema).toBeDefined();
      expect(generateMushcodeTool.inputSchema.type).toBe('object');
      expect(generateMushcodeTool.inputSchema['required']).toContain('description');
    });

    it('should have proper parameter definitions', () => {
      const properties = generateMushcodeTool.inputSchema.properties;
      expect(properties).toBeDefined();
      if (properties) {
        expect(properties['description']).toBeDefined();
        expect(properties['server_type']).toBeDefined();
        expect(properties['function_type']).toBeDefined();
        expect(properties['parameters']).toBeDefined();
        expect(properties['security_level']).toBeDefined();
        expect(properties['include_comments']).toBeDefined();
      }
    });
  });

  describe('argument validation', () => {
    it('should require description parameter', async () => {
      await expect(generateMushcodeHandler({}, knowledgeBase))
        .rejects.toThrow(ValidationError);
    });

    it('should reject empty description', async () => {
      await expect(generateMushcodeHandler({ description: '' }, knowledgeBase))
        .rejects.toThrow('description cannot be empty');
    });

    it('should reject non-string description', async () => {
      await expect(generateMushcodeHandler({ description: 123 }, knowledgeBase))
        .rejects.toThrow('description is required and must be a string');
    });

    it('should reject description that is too long', async () => {
      const longDescription = 'a'.repeat(1001);
      await expect(generateMushcodeHandler({ description: longDescription }, knowledgeBase))
        .rejects.toThrow('description is too long');
    });

    it('should validate server_type enum', async () => {
      await expect(generateMushcodeHandler({
        description: 'test command',
        server_type: 'InvalidServer'
      }, knowledgeBase)).rejects.toThrow('server_type must be one of');
    });

    it('should validate function_type enum', async () => {
      await expect(generateMushcodeHandler({
        description: 'test command',
        function_type: 'invalid_type'
      }, knowledgeBase)).rejects.toThrow('function_type must be one of');
    });

    it('should validate security_level enum', async () => {
      await expect(generateMushcodeHandler({
        description: 'test command',
        security_level: 'invalid_level'
      }, knowledgeBase)).rejects.toThrow('security_level must be one of');
    });

    it('should validate parameters array', async () => {
      await expect(generateMushcodeHandler({
        description: 'test command',
        parameters: 'not an array'
      }, knowledgeBase)).rejects.toThrow('parameters must be an array');
    });

    it('should limit parameters array size', async () => {
      const tooManyParams = Array(11).fill('param');
      await expect(generateMushcodeHandler({
        description: 'test command',
        parameters: tooManyParams
      }, knowledgeBase)).rejects.toThrow('parameters array cannot have more than 10 items');
    });

    it('should validate include_comments boolean', async () => {
      await expect(generateMushcodeHandler({
        description: 'test command',
        include_comments: 'not a boolean'
      }, knowledgeBase)).rejects.toThrow('include_comments must be a boolean');
    });
  });

  describe('code generation', () => {
    it('should generate basic command code', async () => {
      const result = await generateMushcodeHandler({
        description: 'create a hello command',
        function_type: 'command'
      }, knowledgeBase);

      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
      expect(result.explanation).toBeDefined();
      expect(result.usage_example).toBeDefined();
      expect(result.compatibility).toBeDefined();
      expect(Array.isArray(result.compatibility)).toBe(true);
    });

    it('should generate function code', async () => {
      const result = await generateMushcodeHandler({
        description: 'create a function that adds two numbers',
        function_type: 'function'
      }, knowledgeBase);

      expect(result.code).toBeDefined();
      expect(result.code.length).toBeGreaterThan(0);
      expect(result.explanation).toContain('function');
    });

    it('should generate trigger code', async () => {
      const result = await generateMushcodeHandler({
        description: 'create a connection trigger',
        function_type: 'trigger'
      }, knowledgeBase);

      expect(result.code).toBeDefined();
      expect(result.explanation).toContain('trigger');
    });

    it('should handle server-specific generation', async () => {
      const result = await generateMushcodeHandler({
        description: 'create a basic command',
        server_type: 'PennMUSH'
      }, knowledgeBase);

      expect(result.compatibility).toContain('PennMUSH');
    });

    it('should include security considerations', async () => {
      const result = await generateMushcodeHandler({
        description: 'create an admin command',
        security_level: 'wizard'
      }, knowledgeBase);

      expect(result.security_notes).toBeDefined();
      expect(result.security_notes).toContain('wizard');
    });

    it('should handle parameters in generation', async () => {
      const result = await generateMushcodeHandler({
        description: 'create a greeting command',
        parameters: ['name', 'message']
      }, knowledgeBase);

      expect(result.code).toBeDefined();
      expect(result.usage_example).toBeDefined();
    });

    it('should include comments by default', async () => {
      const result = await generateMushcodeHandler({
        description: 'create a simple command'
      }, knowledgeBase);

      expect(result.code).toContain('@@');
    });

    it('should exclude comments when requested', async () => {
      const result = await generateMushcodeHandler({
        description: 'create a simple command',
        include_comments: false
      }, knowledgeBase);

      // Should not contain comment markers
      expect(result.code).not.toContain('@@');
    });

    it('should return pattern information', async () => {
      const result = await generateMushcodeHandler({
        description: 'create a basic command'
      }, knowledgeBase);

      expect(result.pattern_used).toBeDefined();
      expect(typeof result.pattern_used).toBe('string');
    });

    it('should provide warnings when appropriate', async () => {
      const result = await generateMushcodeHandler({
        description: 'create an advanced system',
        function_type: 'command'
      }, knowledgeBase);

      // Warnings may or may not be present depending on the pattern matched
      if (result.warnings) {
        expect(Array.isArray(result.warnings)).toBe(true);
      }
    });
  });

  describe('error handling', () => {
    it('should handle no matching patterns gracefully', async () => {
      await expect(generateMushcodeHandler({
        description: 'create something completely impossible and nonexistent'
      }, knowledgeBase)).rejects.toThrow('No suitable pattern found');
    });

    it('should handle invalid server type in generation', async () => {
      // This should be caught by validation, but test the generator directly
      await expect(generateMushcodeHandler({
        description: 'test command',
        server_type: 'NonexistentServer'
      }, knowledgeBase)).rejects.toThrow();
    });
  });

  describe('output format', () => {
    it('should return all required fields', async () => {
      const result = await generateMushcodeHandler({
        description: 'create a test command'
      }, knowledgeBase);

      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('explanation');
      expect(result).toHaveProperty('usage_example');
      expect(result).toHaveProperty('compatibility');
      
      expect(typeof result.code).toBe('string');
      expect(typeof result.explanation).toBe('string');
      expect(typeof result.usage_example).toBe('string');
      expect(Array.isArray(result.compatibility)).toBe(true);
    });

    it('should have optional fields when applicable', async () => {
      const result = await generateMushcodeHandler({
        description: 'create an admin command',
        security_level: 'wizard'
      }, knowledgeBase);

      // These fields should be present for admin commands
      expect(result.security_notes).toBeDefined();
      expect(result.pattern_used).toBeDefined();
    });
  });

  describe('integration with knowledge base', () => {
    it('should use knowledge base patterns', async () => {
      const result = await generateMushcodeHandler({
        description: 'create a basic command'
      }, knowledgeBase);

      // Should find a pattern from the knowledge base
      expect(result.pattern_used).toBeDefined();
      
      // Should have compatibility information from patterns
      expect(result.compatibility.length).toBeGreaterThan(0);
    });

    it('should respect server compatibility', async () => {
      const result = await generateMushcodeHandler({
        description: 'create a command',
        server_type: 'PennMUSH'
      }, knowledgeBase);

      // Should only return PennMUSH-compatible patterns
      expect(result.compatibility).toContain('PennMUSH');
    });

    it('should handle security levels from patterns', async () => {
      const result = await generateMushcodeHandler({
        description: 'create a builder command',
        security_level: 'builder'
      }, knowledgeBase);

      if (result.security_notes) {
        expect(result.security_notes).toContain('builder');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle minimal input', async () => {
      const result = await generateMushcodeHandler({
        description: 'test'
      }, knowledgeBase);

      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
    });

    it('should handle complex descriptions', async () => {
      const complexDescription = 'create a command that takes multiple parameters, validates input, checks permissions, logs actions, and provides detailed feedback to users';
      
      const result = await generateMushcodeHandler({
        description: complexDescription
      }, knowledgeBase);

      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
    });

    it('should handle all function types', async () => {
      const functionTypes = ['command', 'function', 'trigger', 'attribute', 'utility'];
      
      for (const type of functionTypes) {
        const result = await generateMushcodeHandler({
          description: `create a ${type}`,
          function_type: type
        }, knowledgeBase);

        expect(result).toBeDefined();
        expect(result.code).toBeDefined();
      }
    });

    it('should handle all security levels', async () => {
      const securityLevels = ['public', 'player', 'builder', 'wizard', 'god'];
      
      for (const level of securityLevels) {
        const result = await generateMushcodeHandler({
          description: 'create a command',
          security_level: level
        }, knowledgeBase);

        expect(result).toBeDefined();
        expect(result.code).toBeDefined();
      }
    });

    it('should handle all server types', async () => {
      const serverTypes = ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX'];
      
      for (const server of serverTypes) {
        const result = await generateMushcodeHandler({
          description: 'create a command',
          server_type: server
        }, knowledgeBase);

        expect(result).toBeDefined();
        expect(result.code).toBeDefined();
      }
    });
  });
});