/**
 * Persistence layer for knowledge base data
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { MushcodeKnowledgeBase } from './base.js';
import {
  MushcodePattern,
  ServerDialect,
  SecurityRule,
  CodeExample,
  LearningPath
} from '../types/knowledge.js';

/**
 * Knowledge base data structure for serialization
 */
export interface SerializedKnowledgeBase {
  patterns: MushcodePattern[];
  dialects: ServerDialect[];
  securityRules: SecurityRule[];
  examples: CodeExample[];
  learningPaths: LearningPath[];
  metadata: {
    version: string;
    lastUpdated: string;
    sources: string[];
    totalFiles: number;
  };
}

/**
 * Persistence manager for knowledge base
 */
export class KnowledgeBasePersistence {
  private dataDir: string;

  constructor(dataDir = 'data/knowledge') {
    this.dataDir = dataDir;
  }

  /**
   * Save knowledge base to JSON files
   */
  async save(knowledgeBase: MushcodeKnowledgeBase): Promise<void> {
    console.log('💾 Saving knowledge base to JSON files...');
    
    // Ensure data directory exists
    await this.ensureDataDirectory();

    const stats = knowledgeBase.getStats();
    
    // Convert Maps to arrays for serialization
    const data: SerializedKnowledgeBase = {
      patterns: Array.from(knowledgeBase.patterns.values()),
      dialects: Array.from(knowledgeBase.dialects.values()),
      securityRules: Array.from(knowledgeBase.securityRules.values()),
      examples: Array.from(knowledgeBase.examples.values()),
      learningPaths: Array.from(knowledgeBase.learningPaths.values()),
      metadata: {
        version: stats.version,
        lastUpdated: stats.lastUpdated.toISOString(),
        sources: knowledgeBase.sources,
        totalFiles: stats.patterns + stats.examples
      }
    };

    // Save individual files for better organization
    await Promise.all([
      this.saveJsonFile('patterns.json', data.patterns),
      this.saveJsonFile('dialects.json', data.dialects),
      this.saveJsonFile('security-rules.json', data.securityRules),
      this.saveJsonFile('examples.json', data.examples),
      this.saveJsonFile('learning-paths.json', data.learningPaths),
      this.saveJsonFile('metadata.json', data.metadata)
    ]);

    // Also save a complete combined file
    await this.saveJsonFile('knowledge-base.json', data);

    console.log('✅ Knowledge base saved successfully!');
    console.log(`📁 Data directory: ${this.dataDir}`);
    console.log(`📊 Saved ${data.patterns.length} patterns, ${data.examples.length} examples`);
  }

  /**
   * Load knowledge base from JSON files
   */
  async load(): Promise<MushcodeKnowledgeBase> {
    console.log('📂 Loading knowledge base from JSON files...');
    
    const knowledgeBase = new MushcodeKnowledgeBase();
    
    try {
      // Try to load from individual files first
      const [patterns, dialects, securityRules, examples, learningPaths, metadata] = await Promise.all([
        this.loadJsonFile<MushcodePattern[]>('patterns.json'),
        this.loadJsonFile<ServerDialect[]>('dialects.json'),
        this.loadJsonFile<SecurityRule[]>('security-rules.json'),
        this.loadJsonFile<CodeExample[]>('examples.json'),
        this.loadJsonFile<LearningPath[]>('learning-paths.json'),
        this.loadJsonFile<SerializedKnowledgeBase['metadata']>('metadata.json')
      ]);

      // Populate the knowledge base
      patterns.forEach(pattern => knowledgeBase.addPattern(pattern));
      dialects.forEach(dialect => knowledgeBase.addDialect(dialect));
      securityRules.forEach(rule => knowledgeBase.addSecurityRule(rule));
      examples.forEach(example => knowledgeBase.addExample(example));
      learningPaths.forEach(path => knowledgeBase.addLearningPath(path));

      // Update metadata
      knowledgeBase.version = metadata.version;
      knowledgeBase.lastUpdated = new Date(metadata.lastUpdated);
      knowledgeBase.sources = metadata.sources;

      console.log('✅ Knowledge base loaded successfully!');
      console.log(`📊 Loaded ${patterns.length} patterns, ${examples.length} examples`);
      
    } catch (error) {
      // Fallback to combined file
      console.log('⚠️  Individual files not found, trying combined file...');
      
      try {
        const data = await this.loadJsonFile<SerializedKnowledgeBase>('knowledge-base.json');
        
        data.patterns.forEach(pattern => knowledgeBase.addPattern(pattern));
        data.dialects.forEach(dialect => knowledgeBase.addDialect(dialect));
        data.securityRules.forEach(rule => knowledgeBase.addSecurityRule(rule));
        data.examples.forEach(example => knowledgeBase.addExample(example));
        data.learningPaths.forEach(path => knowledgeBase.addLearningPath(path));

        knowledgeBase.version = data.metadata.version;
        knowledgeBase.lastUpdated = new Date(data.metadata.lastUpdated);
        knowledgeBase.sources = data.metadata.sources;

        console.log('✅ Knowledge base loaded from combined file!');
        
      } catch (combinedError) {
        console.log('⚠️  No existing knowledge base found, starting with empty base');
      }
    }

    return knowledgeBase;
  }

  /**
   * Check if knowledge base files exist
   */
  async exists(): Promise<boolean> {
    try {
      await fs.access(join(this.dataDir, 'knowledge-base.json'));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get information about saved knowledge base
   */
  async getInfo(): Promise<SerializedKnowledgeBase['metadata'] | null> {
    try {
      return await this.loadJsonFile<SerializedKnowledgeBase['metadata']>('metadata.json');
    } catch {
      try {
        const data = await this.loadJsonFile<SerializedKnowledgeBase>('knowledge-base.json');
        return data.metadata;
      } catch {
        return null;
      }
    }
  }

  /**
   * Export knowledge base to a specific directory
   */
  async exportTo(targetDir: string, knowledgeBase: MushcodeKnowledgeBase): Promise<void> {
    const originalDataDir = this.dataDir;
    this.dataDir = targetDir;
    
    try {
      await this.save(knowledgeBase);
    } finally {
      this.dataDir = originalDataDir;
    }
  }

  /**
   * Import knowledge base from a specific directory
   */
  async importFrom(sourceDir: string): Promise<MushcodeKnowledgeBase> {
    const originalDataDir = this.dataDir;
    this.dataDir = sourceDir;
    
    try {
      return await this.load();
    } finally {
      this.dataDir = originalDataDir;
    }
  }

  /**
   * Ensure data directory exists
   */
  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create data directory:', error);
      throw error;
    }
  }

  /**
   * Save data to JSON file
   */
  private async saveJsonFile(filename: string, data: unknown): Promise<void> {
    const filePath = join(this.dataDir, filename);
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonData, 'utf8');
  }

  /**
   * Load data from JSON file
   */
  private async loadJsonFile<T>(filename: string): Promise<T> {
    const filePath = join(this.dataDir, filename);
    const jsonData = await fs.readFile(filePath, 'utf8');
    return JSON.parse(jsonData) as T;
  }

  /**
   * List all saved knowledge base files
   */
  async listFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.dataDir);
      return files.filter(file => file.endsWith('.json'));
    } catch {
      return [];
    }
  }

  /**
   * Get file sizes for saved knowledge base
   */
  async getFileSizes(): Promise<Record<string, number>> {
    const files = await this.listFiles();
    const sizes: Record<string, number> = {};
    
    for (const file of files) {
      try {
        const stats = await fs.stat(join(this.dataDir, file));
        sizes[file] = stats.size;
      } catch {
        sizes[file] = 0;
      }
    }
    
    return sizes;
  }
}