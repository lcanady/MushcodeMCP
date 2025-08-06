/**
 * Knowledge base storage system for MUSHCODE reference data
 */

import {
  KnowledgeBase,
  MushcodePattern,
  ServerDialect,
  SecurityRule,
  CodeExample,
  LearningPath,
  KnowledgeQuery,
  KnowledgeSearchResult,
  PatternMatch
} from '../types/knowledge.js';

/**
 * In-memory knowledge base implementation
 */
export class MushcodeKnowledgeBase implements KnowledgeBase {
  patterns = new Map<string, MushcodePattern>();
  dialects = new Map<string, ServerDialect>();
  securityRules = new Map<string, SecurityRule>();
  examples = new Map<string, CodeExample>();
  learningPaths = new Map<string, LearningPath>();
  
  // Indexing for fast lookups
  patternsByCategory = new Map<string, string[]>();
  patternsByServer = new Map<string, string[]>();
  patternsByDifficulty = new Map<string, string[]>();
  examplesByCategory = new Map<string, string[]>();
  examplesByDifficulty = new Map<string, string[]>();
  
  version = '1.0.0';
  lastUpdated = new Date();
  sources: string[] = ['mushcode.com'];

  constructor() {
    this.initializeIndexes();
  }

  /**
   * Initialize empty indexes
   */
  private initializeIndexes(): void {
    const categories = ['command', 'function', 'trigger', 'attribute', 'utility'];
    const difficulties = ['beginner', 'intermediate', 'advanced'];
    
    categories.forEach(category => {
      this.patternsByCategory.set(category, []);
      this.examplesByCategory.set(category, []);
    });
    
    difficulties.forEach(difficulty => {
      this.patternsByDifficulty.set(difficulty, []);
      this.examplesByDifficulty.set(difficulty, []);
    });
  }

  /**
   * Add a pattern to the knowledge base
   */
  addPattern(pattern: MushcodePattern): void {
    this.patterns.set(pattern.id, pattern);
    this.updatePatternIndexes(pattern);
    this.lastUpdated = new Date();
  }

  /**
   * Add a server dialect to the knowledge base
   */
  addDialect(dialect: ServerDialect): void {
    this.dialects.set(dialect.name, dialect);
    this.lastUpdated = new Date();
  }

  /**
   * Add a security rule to the knowledge base
   */
  addSecurityRule(rule: SecurityRule): void {
    this.securityRules.set(rule.ruleId, rule);
    this.lastUpdated = new Date();
  }

  /**
   * Add a code example to the knowledge base
   */
  addExample(example: CodeExample): void {
    this.examples.set(example.id, example);
    this.updateExampleIndexes(example);
    this.lastUpdated = new Date();
  }

  /**
   * Add a learning path to the knowledge base
   */
  addLearningPath(path: LearningPath): void {
    this.learningPaths.set(path.id, path);
    this.lastUpdated = new Date();
  }

  /**
   * Update pattern indexes when adding a pattern
   */
  private updatePatternIndexes(pattern: MushcodePattern): void {
    // Update category index
    const categoryPatterns = this.patternsByCategory.get(pattern.category) || [];
    categoryPatterns.push(pattern.id);
    this.patternsByCategory.set(pattern.category, categoryPatterns);

    // Update difficulty index
    const difficultyPatterns = this.patternsByDifficulty.get(pattern.difficulty) || [];
    difficultyPatterns.push(pattern.id);
    this.patternsByDifficulty.set(pattern.difficulty, difficultyPatterns);

    // Update server compatibility index
    pattern.serverCompatibility.forEach(server => {
      const serverPatterns = this.patternsByServer.get(server) || [];
      serverPatterns.push(pattern.id);
      this.patternsByServer.set(server, serverPatterns);
    });
  }

  /**
   * Update example indexes when adding an example
   */
  private updateExampleIndexes(example: CodeExample): void {
    // Update category index
    const categoryExamples = this.examplesByCategory.get(example.category) || [];
    categoryExamples.push(example.id);
    this.examplesByCategory.set(example.category, categoryExamples);

    // Update difficulty index
    const difficultyExamples = this.examplesByDifficulty.get(example.difficulty) || [];
    difficultyExamples.push(example.id);
    this.examplesByDifficulty.set(example.difficulty, difficultyExamples);
  }

  /**
   * Get pattern by ID
   */
  getPattern(id: string): MushcodePattern | undefined {
    return this.patterns.get(id);
  }

  /**
   * Get patterns by category
   */
  getPatternsByCategory(category: string): MushcodePattern[] {
    const patternIds = this.patternsByCategory.get(category) || [];
    return patternIds.map(id => this.patterns.get(id)).filter(Boolean) as MushcodePattern[];
  }

  /**
   * Get patterns by server compatibility
   */
  getPatternsByServer(serverName: string): MushcodePattern[] {
    const patternIds = this.patternsByServer.get(serverName) || [];
    return patternIds.map(id => this.patterns.get(id)).filter(Boolean) as MushcodePattern[];
  }

  /**
   * Get patterns by difficulty
   */
  getPatternsByDifficulty(difficulty: string): MushcodePattern[] {
    const patternIds = this.patternsByDifficulty.get(difficulty) || [];
    return patternIds.map(id => this.patterns.get(id)).filter(Boolean) as MushcodePattern[];
  }

  /**
   * Get server dialect by name
   */
  getDialect(name: string): ServerDialect | undefined {
    return this.dialects.get(name);
  }

  /**
   * Get all available server dialects
   */
  getAllDialects(): ServerDialect[] {
    return Array.from(this.dialects.values());
  }

  /**
   * Get security rule by ID
   */
  getSecurityRule(ruleId: string): SecurityRule | undefined {
    return this.securityRules.get(ruleId);
  }

  /**
   * Get security rules by severity
   */
  getSecurityRulesBySeverity(severity: string): SecurityRule[] {
    return Array.from(this.securityRules.values())
      .filter(rule => rule.severity === severity);
  }

  /**
   * Get security rules by category
   */
  getSecurityRulesByCategory(category: string): SecurityRule[] {
    return Array.from(this.securityRules.values())
      .filter(rule => rule.category === category);
  }

  /**
   * Get example by ID
   */
  getExample(id: string): CodeExample | undefined {
    return this.examples.get(id);
  }

  /**
   * Get examples by category
   */
  getExamplesByCategory(category: string): CodeExample[] {
    const exampleIds = this.examplesByCategory.get(category) || [];
    return exampleIds.map(id => this.examples.get(id)).filter(Boolean) as CodeExample[];
  }

  /**
   * Get examples by difficulty
   */
  getExamplesByDifficulty(difficulty: string): CodeExample[] {
    const exampleIds = this.examplesByDifficulty.get(difficulty) || [];
    return exampleIds.map(id => this.examples.get(id)).filter(Boolean) as CodeExample[];
  }

  /**
   * Get learning path by ID
   */
  getLearningPath(id: string): LearningPath | undefined {
    return this.learningPaths.get(id);
  }

  /**
   * Get learning paths by difficulty
   */
  getLearningPathsByDifficulty(difficulty: string): LearningPath[] {
    return Array.from(this.learningPaths.values())
      .filter(path => path.difficulty === difficulty);
  }

  /**
   * Search the knowledge base
   */
  search(query: KnowledgeQuery): KnowledgeSearchResult {
    const startTime = Date.now();
    const results: KnowledgeSearchResult = {
      patterns: [],
      examples: [],
      suggestions: [],
      totalResults: 0,
      executionTime: 0
    };

    // Search patterns if requested
    if (query.includePatterns !== false) {
      results.patterns = this.searchPatterns(query);
    }

    // Search examples if requested
    if (query.includeExamples !== false) {
      results.examples = this.searchExamples(query);
    }

    results.totalResults = results.patterns.length + results.examples.length;
    results.executionTime = Date.now() - startTime;

    // Apply limit if specified
    if (query.limit !== undefined) {
      const totalResults = results.patterns.length + results.examples.length;
      if (totalResults > query.limit) {
        // Distribute limit between patterns and examples proportionally
        const patternRatio = results.patterns.length / totalResults;
        const patternLimit = Math.ceil(query.limit * patternRatio);
        const exampleLimit = query.limit - patternLimit;
        
        results.patterns = results.patterns.slice(0, patternLimit);
        results.examples = results.examples.slice(0, exampleLimit);
      }
    }

    return results;
  }

  /**
   * Search patterns based on query
   */
  private searchPatterns(query: KnowledgeQuery): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const searchTerms = query.query.toLowerCase().split(/\s+/);

    for (const pattern of this.patterns.values()) {
      // Apply filters
      if (query.category && pattern.category !== query.category) continue;
      if (query.serverType && !pattern.serverCompatibility.includes(query.serverType)) continue;
      if (query.difficulty && pattern.difficulty !== query.difficulty) continue;
      if (query.tags && !query.tags.some(tag => pattern.tags.includes(tag))) continue;

      // Calculate relevance score
      const relevance = this.calculatePatternRelevance(pattern, searchTerms, query.fuzzyMatch);
      if (relevance > 0) {
        matches.push({
          patternId: pattern.id,
          confidence: relevance,
          relevance,
          matchedTerms: this.getMatchedTerms(pattern, searchTerms)
        });
      }
    }

    return matches.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Search examples based on query
   */
  private searchExamples(query: KnowledgeQuery): Array<{exampleId: string; relevance: number; matchedTerms: string[]}> {
    const matches: Array<{exampleId: string; relevance: number; matchedTerms: string[]}> = [];
    const searchTerms = query.query.toLowerCase().split(/\s+/);

    for (const example of this.examples.values()) {
      // Apply filters
      if (query.category && example.category !== query.category) continue;
      if (query.serverType && !example.serverCompatibility.includes(query.serverType)) continue;
      if (query.difficulty && example.difficulty !== query.difficulty) continue;
      if (query.tags && !query.tags.some(tag => example.tags.includes(tag))) continue;

      // Calculate relevance score
      const relevance = this.calculateExampleRelevance(example, searchTerms, query.fuzzyMatch);
      if (relevance > 0) {
        matches.push({
          exampleId: example.id,
          relevance,
          matchedTerms: this.getExampleMatchedTerms(example, searchTerms)
        });
      }
    }

    return matches.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Calculate pattern relevance score
   */
  private calculatePatternRelevance(pattern: MushcodePattern, searchTerms: string[], fuzzyMatch = false): number {
    let score = 0;
    const content = `${pattern.name} ${pattern.description} ${pattern.tags.join(' ')}`.toLowerCase();

    for (const term of searchTerms) {
      if (fuzzyMatch) {
        // Simple fuzzy matching - check if term is substring
        if (content.includes(term)) {
          score += 1;
        }
      } else {
        // Exact word matching
        const words = content.split(/\s+/);
        if (words.includes(term)) {
          score += 1;
        }
      }
    }

    return score / searchTerms.length; // Normalize by number of search terms
  }

  /**
   * Calculate example relevance score
   */
  private calculateExampleRelevance(example: CodeExample, searchTerms: string[], fuzzyMatch = false): number {
    let score = 0;
    const content = `${example.title} ${example.description} ${example.tags.join(' ')}`.toLowerCase();

    for (const term of searchTerms) {
      if (fuzzyMatch) {
        if (content.includes(term)) {
          score += 1;
        }
      } else {
        const words = content.split(/\s+/);
        if (words.includes(term)) {
          score += 1;
        }
      }
    }

    return score / searchTerms.length;
  }

  /**
   * Get matched terms for a pattern
   */
  private getMatchedTerms(pattern: MushcodePattern, searchTerms: string[]): string[] {
    const content = `${pattern.name} ${pattern.description} ${pattern.tags.join(' ')}`.toLowerCase();
    return searchTerms.filter(term => content.includes(term));
  }

  /**
   * Get matched terms for an example
   */
  private getExampleMatchedTerms(example: CodeExample, searchTerms: string[]): string[] {
    const content = `${example.title} ${example.description} ${example.tags.join(' ')}`.toLowerCase();
    return searchTerms.filter(term => content.includes(term));
  }

  /**
   * Clear all data from the knowledge base
   */
  clear(): void {
    this.patterns.clear();
    this.dialects.clear();
    this.securityRules.clear();
    this.examples.clear();
    this.learningPaths.clear();
    
    this.patternsByCategory.clear();
    this.patternsByServer.clear();
    this.patternsByDifficulty.clear();
    this.examplesByCategory.clear();
    this.examplesByDifficulty.clear();
    
    this.initializeIndexes();
    this.lastUpdated = new Date();
  }

  /**
   * Get all examples
   */
  getAllExamples(): CodeExample[] {
    return Array.from(this.examples.values());
  }

  /**
   * Get all learning paths
   */
  getAllLearningPaths(): LearningPath[] {
    return Array.from(this.learningPaths.values());
  }

  /**
   * Get all patterns
   */
  getAllPatterns(): MushcodePattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get all security rules
   */
  getAllSecurityRules(): SecurityRule[] {
    return Array.from(this.securityRules.values());
  }

  /**
   * Get knowledge base statistics
   */
  getStats(): {
    patterns: number;
    dialects: number;
    securityRules: number;
    examples: number;
    learningPaths: number;
    lastUpdated: Date;
    version: string;
  } {
    return {
      patterns: this.patterns.size,
      dialects: this.dialects.size,
      securityRules: this.securityRules.size,
      examples: this.examples.size,
      learningPaths: this.learningPaths.size,
      lastUpdated: this.lastUpdated,
      version: this.version
    };
  }
}