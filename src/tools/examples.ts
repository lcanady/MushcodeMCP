/**
 * get_examples tool implementation
 * Retrieves relevant MUSHCODE examples with categorization and learning paths
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MushcodeKnowledgeBase } from '../knowledge/base.js';
import { ValidationError } from '../utils/errors.js';
import { CodeExample, LearningPath } from '../types/knowledge.js';

interface GetExamplesRequest {
  topic: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  serverType?: string;
  category?: string;
  maxResults?: number;
  includeLearningPath?: boolean;
}

interface GetExamplesResult {
  examples: ExampleResult[];
  learning_path?: LearningPathStep[];
  additional_resources: ResourceLink[];
  total_found: number;
  search_metadata: {
    query: string;
    filters_applied: string[];
    execution_time_ms: number;
  };
}

interface ExampleResult {
  id: string;
  title: string;
  description: string;
  code: string;
  explanation: string;
  difficulty: string;
  category: string;
  tags: string[];
  server_compatibility: string[];
  related_concepts: string[];
  learning_objectives: string[];
  source?: {
    url: string;
    author?: string;
  } | undefined;
  relevance_score: number;
}

interface LearningPathStep {
  step_number: number;
  title: string;
  description: string;
  example_ids: string[];
  objectives: string[];
  estimated_time?: string;
}

interface ResourceLink {
  type: 'documentation' | 'tutorial' | 'reference' | 'community';
  title: string;
  url: string;
  description?: string;
}

// Tool definition
export const getExamplesTool: Tool = {
  name: 'get_examples',
  description: 'Retrieve relevant MUSHCODE examples with categorization, difficulty filtering, and learning path generation',
  inputSchema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'Topic or concept to find examples for (e.g., "object creation", "conditionals", "functions")',
        minLength: 1,
        maxLength: 200
      },
      difficulty: {
        type: 'string',
        description: 'Filter examples by difficulty level',
        enum: ['beginner', 'intermediate', 'advanced']
      },
      server_type: {
        type: 'string',
        description: 'Filter examples by MUD server compatibility',
        enum: ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX']
      },
      category: {
        type: 'string',
        description: 'Filter examples by category',
        enum: ['building', 'administration', 'functions', 'commands', 'triggers', 'utilities', 'security']
      },
      max_results: {
        type: 'integer',
        description: 'Maximum number of examples to return',
        minimum: 1,
        maximum: 50,
        default: 10
      },
      include_learning_path: {
        type: 'boolean',
        description: 'Whether to include a suggested learning path for progressive skill development',
        default: true
      }
    },
    required: ['topic']
  }
};

/**
 * Tool handler for get_examples
 */
export async function getExamplesHandler(
  args: Record<string, unknown>,
  knowledgeBase: MushcodeKnowledgeBase
): Promise<GetExamplesResult> {
  const startTime = Date.now();
  
  try {
    // Validate and extract arguments
    const request = validateAndExtractArgs(args);
    
    // Search for relevant examples
    const searchResults = await searchExamples(request, knowledgeBase);
    
    // Generate learning path if requested
    let learningPath: LearningPathStep[] | undefined;
    if (request.includeLearningPath) {
      learningPath = await generateLearningPath(request, searchResults, knowledgeBase);
    }
    
    // Get additional resources
    const additionalResources = getAdditionalResources(request.topic, request.category);
    
    const executionTime = Date.now() - startTime;
    
    const result: GetExamplesResult = {
      examples: searchResults.examples,
      additional_resources: additionalResources,
      total_found: searchResults.totalFound,
      search_metadata: {
        query: request.topic,
        filters_applied: buildFiltersApplied(request),
        execution_time_ms: executionTime
      }
    };

    if (learningPath && learningPath.length > 0) {
      result.learning_path = learningPath;
    }

    return result;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Example retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate and extract arguments from the tool call
 */
function validateAndExtractArgs(args: Record<string, unknown>): GetExamplesRequest {
  // Validate required fields
  if (!args['topic'] || typeof args['topic'] !== 'string') {
    throw new ValidationError('topic is required and must be a string');
  }

  const topic = args['topic'].trim();
  if (topic.length === 0) {
    throw new ValidationError('topic cannot be empty');
  }

  if (topic.length > 200) {
    throw new ValidationError('topic is too long (max 200 characters)');
  }

  // Validate optional fields
  let difficulty: 'beginner' | 'intermediate' | 'advanced' | undefined = undefined;
  if (args['difficulty'] !== undefined) {
    if (typeof args['difficulty'] !== 'string') {
      throw new ValidationError('difficulty must be a string');
    }
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficulties.includes(args['difficulty'])) {
      throw new ValidationError(`difficulty must be one of: ${validDifficulties.join(', ')}`);
    }
    difficulty = args['difficulty'] as 'beginner' | 'intermediate' | 'advanced';
  }

  let serverType: string | undefined = undefined;
  if (args['server_type'] !== undefined) {
    if (typeof args['server_type'] !== 'string') {
      throw new ValidationError('server_type must be a string');
    }
    const validServerTypes = ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX'];
    if (!validServerTypes.includes(args['server_type'])) {
      throw new ValidationError(`server_type must be one of: ${validServerTypes.join(', ')}`);
    }
    serverType = args['server_type'];
  }

  let category: string | undefined = undefined;
  if (args['category'] !== undefined) {
    if (typeof args['category'] !== 'string') {
      throw new ValidationError('category must be a string');
    }
    const validCategories = ['building', 'administration', 'functions', 'commands', 'triggers', 'utilities', 'security'];
    if (!validCategories.includes(args['category'])) {
      throw new ValidationError(`category must be one of: ${validCategories.join(', ')}`);
    }
    category = args['category'];
  }

  let maxResults: number = 10; // default value
  if (args['max_results'] !== undefined) {
    if (typeof args['max_results'] !== 'number' || !Number.isInteger(args['max_results'])) {
      throw new ValidationError('max_results must be an integer');
    }
    if (args['max_results'] < 1 || args['max_results'] > 50) {
      throw new ValidationError('max_results must be between 1 and 50');
    }
    maxResults = args['max_results'];
  }

  let includeLearningPath: boolean = true; // default value
  if (args['include_learning_path'] !== undefined) {
    if (typeof args['include_learning_path'] !== 'boolean') {
      throw new ValidationError('include_learning_path must be a boolean');
    }
    includeLearningPath = args['include_learning_path'];
  }

  const request: GetExamplesRequest = {
    topic,
    maxResults,
    includeLearningPath
  };

  if (difficulty !== undefined) {
    request.difficulty = difficulty;
  }

  if (serverType !== undefined) {
    request.serverType = serverType;
  }

  if (category !== undefined) {
    request.category = category;
  }

  return request;
}

/**
 * Search for examples based on the request parameters
 */
async function searchExamples(
  request: GetExamplesRequest,
  knowledgeBase: MushcodeKnowledgeBase
): Promise<{ examples: ExampleResult[]; totalFound: number }> {
  const examples = knowledgeBase.getAllExamples();
  const matchedExamples: { example: CodeExample; score: number }[] = [];

  // Search through examples
  for (const example of examples) {
    // Apply hard filters first
    if (request.difficulty && example.difficulty !== request.difficulty) {
      continue;
    }
    
    if (request.category && example.category !== request.category) {
      continue;
    }
    
    if (request.serverType && !example.serverCompatibility.includes(request.serverType)) {
      continue;
    }
    
    const score = calculateRelevanceScore(example, request);
    if (score > 0) {
      matchedExamples.push({ example, score });
    }
  }

  // Sort by relevance score (descending)
  matchedExamples.sort((a, b) => b.score - a.score);

  // Apply limit
  const limitedResults = matchedExamples.slice(0, request.maxResults);

  // Convert to result format
  const exampleResults: ExampleResult[] = limitedResults.map(({ example, score }) => ({
    id: example.id,
    title: example.title,
    description: example.description,
    code: example.code,
    explanation: example.explanation,
    difficulty: example.difficulty,
    category: example.category,
    tags: example.tags,
    server_compatibility: example.serverCompatibility,
    related_concepts: example.relatedConcepts,
    learning_objectives: example.learningObjectives,
    source: example.source ? {
      url: example.source.url,
      ...(example.source.author && { author: example.source.author })
    } : undefined,
    relevance_score: Math.round(score * 100) / 100
  }));

  return {
    examples: exampleResults,
    totalFound: matchedExamples.length
  };
}

/**
 * Calculate relevance score for an example based on search criteria
 */
function calculateRelevanceScore(example: CodeExample, request: GetExamplesRequest): number {
  let score = 0;
  const topic = request.topic.toLowerCase();

  // Title match (highest weight)
  if (example.title.toLowerCase().includes(topic)) {
    score += 10;
  }

  // Description match
  if (example.description.toLowerCase().includes(topic)) {
    score += 8;
  }

  // Tags match
  for (const tag of example.tags) {
    if (tag.toLowerCase().includes(topic) || topic.includes(tag.toLowerCase())) {
      score += 6;
    }
  }

  // Related concepts match
  for (const concept of example.relatedConcepts) {
    if (concept.toLowerCase().includes(topic) || topic.includes(concept.toLowerCase())) {
      score += 5;
    }
  }

  // Category match
  if (example.category.toLowerCase().includes(topic) || topic.includes(example.category.toLowerCase())) {
    score += 4;
  }

  // Learning objectives match
  for (const objective of example.learningObjectives) {
    if (objective.toLowerCase().includes(topic)) {
      score += 3;
    }
  }

  // Code content match (lower weight to avoid false positives)
  if (example.code.toLowerCase().includes(topic)) {
    score += 2;
  }

  // Note: Hard filters are now applied before calling this function

  return score;
}

/**
 * Generate a learning path based on the search results
 */
async function generateLearningPath(
  request: GetExamplesRequest,
  searchResults: { examples: ExampleResult[] },
  knowledgeBase: MushcodeKnowledgeBase
): Promise<LearningPathStep[]> {
  // Try to find existing learning paths that match the topic
  const learningPaths = knowledgeBase.getAllLearningPaths();
  const matchingPath = findMatchingLearningPath(request.topic, learningPaths);

  if (matchingPath) {
    return matchingPath.steps.map(step => ({
      step_number: step.stepNumber,
      title: step.title,
      description: step.description,
      example_ids: step.exampleIds,
      objectives: step.objectives
    }));
  }

  // Generate a custom learning path from search results
  return generateCustomLearningPath(searchResults.examples, request);
}

/**
 * Find a learning path that matches the topic
 */
function findMatchingLearningPath(topic: string, learningPaths: LearningPath[]): LearningPath | null {
  const topicLower = topic.toLowerCase();
  
  for (const path of learningPaths) {
    if (path.name.toLowerCase().includes(topicLower) ||
        path.description.toLowerCase().includes(topicLower) ||
        path.id.toLowerCase().includes(topicLower)) {
      return path;
    }
  }
  
  return null;
}

/**
 * Generate a custom learning path from examples
 */
function generateCustomLearningPath(examples: ExampleResult[], request: GetExamplesRequest): LearningPathStep[] {
  if (examples.length === 0) {
    return [];
  }

  // Group examples by difficulty
  const beginnerExamples = examples.filter(e => e.difficulty === 'beginner');
  const intermediateExamples = examples.filter(e => e.difficulty === 'intermediate');
  const advancedExamples = examples.filter(e => e.difficulty === 'advanced');

  const steps: LearningPathStep[] = [];
  let stepNumber = 1;

  // Add beginner step if we have beginner examples
  if (beginnerExamples.length > 0) {
    steps.push({
      step_number: stepNumber++,
      title: `Introduction to ${request.topic}`,
      description: `Learn the basics of ${request.topic} with simple examples`,
      example_ids: beginnerExamples.slice(0, 3).map(e => e.id),
      objectives: [
        `Understand basic ${request.topic} concepts`,
        'Practice with simple examples',
        'Build foundational knowledge'
      ]
    });
  }

  // Add intermediate step if we have intermediate examples
  if (intermediateExamples.length > 0) {
    steps.push({
      step_number: stepNumber++,
      title: `Intermediate ${request.topic}`,
      description: `Explore more complex ${request.topic} patterns and techniques`,
      example_ids: intermediateExamples.slice(0, 3).map(e => e.id),
      objectives: [
        `Apply ${request.topic} in practical scenarios`,
        'Understand common patterns and best practices',
        'Handle more complex use cases'
      ]
    });
  }

  // Add advanced step if we have advanced examples
  if (advancedExamples.length > 0) {
    steps.push({
      step_number: stepNumber++,
      title: `Advanced ${request.topic}`,
      description: `Master advanced ${request.topic} techniques and optimization`,
      example_ids: advancedExamples.slice(0, 3).map(e => e.id),
      objectives: [
        `Implement complex ${request.topic} solutions`,
        'Optimize for performance and maintainability',
        'Understand edge cases and advanced patterns'
      ]
    });
  }

  return steps;
}

/**
 * Get additional educational resources
 */
function getAdditionalResources(_topic: string, category?: string): ResourceLink[] {
  const resources: ResourceLink[] = [
    {
      type: 'reference',
      title: 'MUSHCode.com Archive',
      url: 'https://mushcode.com',
      description: 'Comprehensive archive of MUSHCODE examples and tutorials'
    },
    {
      type: 'documentation',
      title: 'PennMUSH Function Reference',
      url: 'https://pennmush.org/help',
      description: 'Official PennMUSH function documentation'
    },
    {
      type: 'community',
      title: 'MUSH Development Community',
      url: 'https://reddit.com/r/MUD',
      description: 'Community discussions and help for MUD development'
    }
  ];

  // Add category-specific resources
  if (category === 'building') {
    resources.push({
      type: 'tutorial',
      title: 'MUSH Building Guide',
      url: 'https://mushcode.com/Category/Building',
      description: 'Comprehensive guide to building in MUSH environments'
    });
  } else if (category === 'administration') {
    resources.push({
      type: 'tutorial',
      title: 'MUSH Administration Best Practices',
      url: 'https://mushcode.com/Category/Administration',
      description: 'Best practices for MUSH administration and management'
    });
  } else if (category === 'functions') {
    resources.push({
      type: 'reference',
      title: 'MUSHCODE Function Library',
      url: 'https://mushcode.com/Category/Functions',
      description: 'Complete reference of MUSHCODE functions and utilities'
    });
  }

  return resources;
}

/**
 * Build list of filters that were applied
 */
function buildFiltersApplied(request: GetExamplesRequest): string[] {
  const filters: string[] = [];
  
  if (request.difficulty) {
    filters.push(`difficulty: ${request.difficulty}`);
  }
  
  if (request.serverType) {
    filters.push(`server: ${request.serverType}`);
  }
  
  if (request.category) {
    filters.push(`category: ${request.category}`);
  }
  
  filters.push(`max_results: ${request.maxResults}`);
  
  return filters;
}