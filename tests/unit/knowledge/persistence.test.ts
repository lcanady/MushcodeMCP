/**
 * Unit tests for knowledge base persistence
 */

import { promises as fs } from 'fs';
import { MushcodeKnowledgeBase } from '../../../src/knowledge/base.js';
import { KnowledgeBasePersistence } from '../../../src/knowledge/persistence.js';
import { MushcodePattern } from '../../../src/types/knowledge.js';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
    access: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn()
  }
}));

describe('KnowledgeBasePersistence', () => {
  let persistence: KnowledgeBasePersistence;
  let knowledgeBase: MushcodeKnowledgeBase;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(() => {
    persistence = new KnowledgeBasePersistence('/test/data');
    knowledgeBase = new MushcodeKnowledgeBase();
    mockFs = fs as jest.Mocked<typeof fs>;
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Save Operations', () => {
    test('should save knowledge base to JSON files', async () => {
      // Add test data
      const pattern: MushcodePattern = {
        id: 'test-pattern',
        name: 'Test Pattern',
        description: 'A test pattern',
        category: 'command',
        codeTemplate: '@test {{param}}',
        parameters: [],
        serverCompatibility: ['PennMUSH'],
        securityLevel: 'public',
        examples: [],
        relatedPatterns: [],
        tags: ['test'],
        difficulty: 'beginner',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      knowledgeBase.addPattern(pattern);

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await persistence.save(knowledgeBase);

      // Verify directory creation
      expect(mockFs.mkdir).toHaveBeenCalledWith('/test/data', { recursive: true });

      // Verify file writes (5 individual files + 1 combined + 1 metadata)
      expect(mockFs.writeFile).toHaveBeenCalledTimes(7);
      
      // Check that patterns.json was written
      const patternsCall = (mockFs.writeFile as jest.Mock).mock.calls.find(
        call => call[0].endsWith('patterns.json')
      );
      expect(patternsCall).toBeDefined();
      
      const patternsData = JSON.parse(patternsCall[1]);
      expect(patternsData).toHaveLength(1);
      expect(patternsData[0].id).toBe('test-pattern');
    });

    test('should handle save errors gracefully', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      await expect(persistence.save(knowledgeBase)).rejects.toThrow('Permission denied');
    });
  });

  describe('Load Operations', () => {
    test('should load knowledge base from individual files', async () => {
      const mockPattern: MushcodePattern = {
        id: 'loaded-pattern',
        name: 'Loaded Pattern',
        description: 'A loaded pattern',
        category: 'function',
        codeTemplate: 'loaded({{param}})',
        parameters: [],
        serverCompatibility: ['TinyMUSH'],
        securityLevel: 'builder',
        examples: [],
        relatedPatterns: [],
        tags: ['loaded'],
        difficulty: 'intermediate',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockMetadata = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        sources: ['test'],
        totalFiles: 1
      };

      // Mock successful file reads
      mockFs.readFile.mockImplementation((filePath: any) => {
        const filename = filePath.toString().split('/').pop();
        
        switch (filename) {
          case 'patterns.json':
            return Promise.resolve(JSON.stringify([mockPattern]));
          case 'dialects.json':
            return Promise.resolve(JSON.stringify([]));
          case 'security-rules.json':
            return Promise.resolve(JSON.stringify([]));
          case 'examples.json':
            return Promise.resolve(JSON.stringify([]));
          case 'learning-paths.json':
            return Promise.resolve(JSON.stringify([]));
          case 'metadata.json':
            return Promise.resolve(JSON.stringify(mockMetadata));
          default:
            return Promise.reject(new Error('File not found'));
        }
      });

      const loadedKB = await persistence.load();

      expect(loadedKB.getPattern('loaded-pattern')).toBeDefined();
      expect(loadedKB.getStats().patterns).toBe(1);
    });

    test('should fallback to combined file if individual files fail', async () => {
      const mockData = {
        patterns: [],
        dialects: [],
        securityRules: [],
        examples: [],
        learningPaths: [],
        metadata: {
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          sources: ['test'],
          totalFiles: 0
        }
      };

      // Mock individual files failing, combined file succeeding
      mockFs.readFile.mockImplementation((filePath: any) => {
        const filename = filePath.toString().split('/').pop();
        
        if (filename === 'knowledge-base.json') {
          return Promise.resolve(JSON.stringify(mockData));
        }
        
        return Promise.reject(new Error('File not found'));
      });

      const loadedKB = await persistence.load();
      expect(loadedKB).toBeInstanceOf(MushcodeKnowledgeBase);
    });

    test('should return empty knowledge base if no files exist', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const loadedKB = await persistence.load();
      expect(loadedKB).toBeInstanceOf(MushcodeKnowledgeBase);
      expect(loadedKB.getStats().patterns).toBe(0);
    });
  });

  describe('Utility Operations', () => {
    test('should check if knowledge base exists', async () => {
      mockFs.access.mockResolvedValue(undefined);
      
      const exists = await persistence.exists();
      expect(exists).toBe(true);
      expect(mockFs.access).toHaveBeenCalledWith('/test/data/knowledge-base.json');
    });

    test('should return false if knowledge base does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));
      
      const exists = await persistence.exists();
      expect(exists).toBe(false);
    });

    test('should get knowledge base info', async () => {
      const mockMetadata = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        sources: ['test'],
        totalFiles: 5
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockMetadata));

      const info = await persistence.getInfo();
      expect(info).toEqual(mockMetadata);
    });

    test('should list saved files', async () => {
      const mockFiles = ['patterns.json', 'examples.json', 'metadata.json', 'other.txt'];
      mockFs.readdir.mockResolvedValue(mockFiles as any);

      const files = await persistence.listFiles();
      expect(files).toEqual(['patterns.json', 'examples.json', 'metadata.json']);
    });

    test('should get file sizes', async () => {
      const mockFiles = ['patterns.json', 'examples.json'];
      mockFs.readdir.mockResolvedValue(mockFiles as any);
      mockFs.stat.mockImplementation((filePath: any) => {
        const filename = filePath.toString().split('/').pop();
        return Promise.resolve({ size: filename === 'patterns.json' ? 1024 : 2048 } as any);
      });

      const sizes = await persistence.getFileSizes();
      expect(sizes).toEqual({
        'patterns.json': 1024,
        'examples.json': 2048
      });
    });
  });

  describe('Export/Import Operations', () => {
    test('should export to specific directory', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await persistence.exportTo('/export/path', knowledgeBase);

      expect(mockFs.mkdir).toHaveBeenCalledWith('/export/path', { recursive: true });
    });

    test('should import from specific directory', async () => {
      mockFs.readFile.mockImplementation((filePath: any) => {
        const filename = filePath.toString().split('/').pop();
        
        switch (filename) {
          case 'patterns.json':
            return Promise.resolve(JSON.stringify([]));
          case 'dialects.json':
            return Promise.resolve(JSON.stringify([]));
          case 'security-rules.json':
            return Promise.resolve(JSON.stringify([]));
          case 'examples.json':
            return Promise.resolve(JSON.stringify([]));
          case 'learning-paths.json':
            return Promise.resolve(JSON.stringify([]));
          case 'metadata.json':
            return Promise.resolve(JSON.stringify({
              version: '1.0.0',
              lastUpdated: new Date().toISOString(),
              sources: ['test'],
              totalFiles: 0
            }));
          default:
            return Promise.reject(new Error('File not found'));
        }
      });

      const importedKB = await persistence.importFrom('/import/path');
      expect(importedKB).toBeInstanceOf(MushcodeKnowledgeBase);
    });
  });
});