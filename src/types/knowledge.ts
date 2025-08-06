/**
 * Knowledge base type definitions for MUSHCODE patterns, dialects, and security rules
 */

/**
 * Parameter definition for MUSHCODE functions
 */
export interface Parameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: string;
  validation?: string; // Regex pattern for validation
}

/**
 * MUSHCODE pattern template for code generation
 */
export interface MushcodePattern {
  id: string;
  name: string;
  description: string;
  category: 'command' | 'function' | 'trigger' | 'attribute' | 'utility';
  codeTemplate: string;
  parameters: Parameter[];
  serverCompatibility: string[];
  securityLevel: 'public' | 'player' | 'builder' | 'wizard' | 'god';
  examples: string[];
  relatedPatterns: string[];
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Syntax rule for server-specific variations
 */
export interface SyntaxRule {
  ruleId: string;
  description: string;
  pattern: string; // Regex pattern
  replacement?: string;
  serverSpecific: boolean;
  examples: {
    before: string;
    after: string;
  };
}

/**
 * Feature definition for server capabilities
 */
export interface Feature {
  name: string;
  description: string;
  syntax: string;
  availability: string[]; // Server versions that support this
  examples: string[];
  limitations?: string[];
}

/**
 * Security model for server permissions
 */
export interface SecurityModel {
  permissionLevels: string[];
  defaultLevel: string;
  escalationRules: {
    from: string;
    to: string;
    conditions: string[];
  }[];
  restrictedFunctions: string[];
}

/**
 * Function definition in server library
 */
export interface FunctionDefinition {
  name: string;
  description: string;
  syntax: string;
  parameters: Parameter[];
  returnType: string;
  permissions: string[];
  examples: string[];
  notes?: string[];
  deprecated?: boolean;
  alternativeTo?: string;
}

/**
 * Server dialect definition
 */
export interface ServerDialect {
  name: string;
  version: string;
  description: string;
  syntaxVariations: SyntaxRule[];
  uniqueFeatures: Feature[];
  securityModel: SecurityModel;
  functionLibrary: FunctionDefinition[];
  commonPatterns: string[]; // References to pattern IDs
  limitations: string[];
  documentation: {
    url?: string;
    version?: string;
    lastUpdated?: Date;
  };
}

/**
 * Security rule for vulnerability detection
 */
export interface SecurityRule {
  ruleId: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'injection' | 'permission' | 'resource' | 'logic' | 'data';
  pattern: string; // Regex pattern to match vulnerable code
  recommendation: string;
  examples: {
    vulnerable: string;
    secure: string;
    explanation: string;
  };
  affectedServers: string[];
  cweId?: string; // Common Weakness Enumeration ID
  references: string[];
}

/**
 * Code analysis result types
 */
export interface SyntaxError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code: string; // Error code for categorization
  suggestion?: string;
  fixable: boolean;
}

export interface SecurityWarning {
  ruleId: string;
  type: string;
  description: string;
  lineNumber?: number;
  columnNumber?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
  codeSnippet?: string;
  references: string[];
}

export interface CodeImprovement {
  type: 'performance' | 'readability' | 'security' | 'best_practice' | 'maintainability';
  description: string;
  lineNumber?: number;
  before: string;
  after: string;
  impact: string;
  confidence: number; // 0-1 scale
  effort: 'low' | 'medium' | 'high';
  category: string;
}

/**
 * Code example for educational purposes
 */
export interface CodeExample {
  id: string;
  title: string;
  description: string;
  code: string;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  tags: string[];
  serverCompatibility: string[];
  relatedConcepts: string[];
  prerequisites?: string[];
  learningObjectives: string[];
  source?: {
    url: string;
    author?: string;
    license?: string;
  };
}

/**
 * Learning path for progressive skill development
 */
export interface LearningPath {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  prerequisites: string[];
  steps: {
    stepNumber: number;
    title: string;
    description: string;
    exampleIds: string[];
    exercises?: string[];
    objectives: string[];
  }[];
  resources: {
    type: 'documentation' | 'tutorial' | 'reference' | 'community';
    title: string;
    url: string;
    description?: string;
  }[];
}

/**
 * Knowledge base storage interface
 */
export interface KnowledgeBase {
  patterns: Map<string, MushcodePattern>;
  dialects: Map<string, ServerDialect>;
  securityRules: Map<string, SecurityRule>;
  examples: Map<string, CodeExample>;
  learningPaths: Map<string, LearningPath>;
  
  // Indexing for fast lookups
  patternsByCategory: Map<string, string[]>;
  patternsByServer: Map<string, string[]>;
  patternsByDifficulty: Map<string, string[]>;
  examplesByCategory: Map<string, string[]>;
  examplesByDifficulty: Map<string, string[]>;
  
  // Metadata
  version: string;
  lastUpdated: Date;
  sources: string[];
}

/**
 * Pattern matching result
 */
export interface PatternMatch {
  patternId: string;
  confidence: number; // 0-1 scale
  relevance: number; // 0-1 scale
  matchedTerms: string[];
  context?: Record<string, unknown>;
}

/**
 * Search query for knowledge base
 */
export interface KnowledgeQuery {
  query: string;
  category?: string;
  serverType?: string;
  difficulty?: string;
  tags?: string[];
  limit?: number;
  includeExamples?: boolean;
  includePatterns?: boolean;
  fuzzyMatch?: boolean;
}

/**
 * Search result from knowledge base
 */
export interface KnowledgeSearchResult {
  patterns: PatternMatch[];
  examples: {
    exampleId: string;
    relevance: number;
    matchedTerms: string[];
  }[];
  suggestions: string[];
  totalResults: number;
  executionTime: number;
}