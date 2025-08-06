/**
 * explain_mushcode tool implementation
 * Provides detailed explanations of MUSHCODE functionality
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MushcodeExplainer, ExplanationRequest } from '../engines/explainer.js';
import { MushcodeKnowledgeBase } from '../knowledge/base.js';
import { ValidationError } from '../utils/errors.js';

interface ExplainToolResult {
  explanation: string;
  code_breakdown: CodeSection[];
  concepts_used: string[];
  related_examples: string[];
  difficulty_level: string;
  learning_resources?: string[];
}

interface CodeSection {
  line_number: number;
  code: string;
  explanation: string;
  concepts: string[];
  complexity: 'simple' | 'moderate' | 'complex';
}

// Tool definition
export const explainMushcodeTool: Tool = {
  name: 'explain_mushcode',
  description: 'Analyze and explain MUSHCODE functionality with detailed breakdowns and educational content',
  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'MUSHCODE to analyze and explain',
        minLength: 1,
        maxLength: 10000
      },
      detail_level: {
        type: 'string',
        description: 'Level of detail for the explanation',
        enum: ['basic', 'intermediate', 'advanced'],
        default: 'intermediate'
      },
      focus_areas: {
        type: 'array',
        description: 'Specific aspects to focus on in the explanation',
        items: {
          type: 'string',
          enum: ['syntax', 'logic', 'security', 'performance', 'best_practices', 'concepts']
        },
        maxItems: 6
      },
      server_type: {
        type: 'string',
        description: 'Target MUD server type for dialect-specific explanations',
        enum: ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX']
      },
      include_examples: {
        type: 'boolean',
        description: 'Whether to include related examples in the explanation',
        default: true
      }
    },
    required: ['code']
  }
};

/**
 * Tool handler for explain_mushcode
 */
export async function explainMushcodeHandler(
  args: Record<string, unknown>,
  knowledgeBase: MushcodeKnowledgeBase
): Promise<ExplainToolResult> {
  try {
    // Validate and extract arguments
    const request = validateAndExtractArgs(args);
    
    // Create explainer instance
    const explainer = new MushcodeExplainer(knowledgeBase);
    
    // Generate the explanation
    const result = await explainer.explain(request);
    
    const toolResult: ExplainToolResult = {
      explanation: result.explanation,
      code_breakdown: result.codeBreakdown.map(section => ({
        line_number: section.lineNumber,
        code: section.code,
        explanation: section.explanation,
        concepts: section.concepts,
        complexity: section.complexity
      })),
      concepts_used: result.conceptsUsed,
      related_examples: result.relatedExamples,
      difficulty_level: result.difficultyLevel
    };

    if (result.learningResources && result.learningResources.length > 0) {
      toolResult.learning_resources = result.learningResources;
    }

    return toolResult;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Code explanation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate and extract arguments from the tool call
 */
function validateAndExtractArgs(args: Record<string, unknown>): ExplanationRequest {
  // Validate required fields
  if (!args['code'] || typeof args['code'] !== 'string') {
    throw new ValidationError('code is required and must be a string');
  }

  const code = args['code'].trim();
  if (code.length === 0) {
    throw new ValidationError('code cannot be empty');
  }

  if (code.length > 10000) {
    throw new ValidationError('code is too long (max 10000 characters)');
  }

  // Validate optional fields
  let detailLevel: 'basic' | 'intermediate' | 'advanced' = 'intermediate';
  if (args['detail_level'] !== undefined) {
    if (typeof args['detail_level'] !== 'string') {
      throw new ValidationError('detail_level must be a string');
    }
    const validDetailLevels = ['basic', 'intermediate', 'advanced'];
    if (!validDetailLevels.includes(args['detail_level'])) {
      throw new ValidationError(`detail_level must be one of: ${validDetailLevels.join(', ')}`);
    }
    detailLevel = args['detail_level'] as 'basic' | 'intermediate' | 'advanced';
  }

  let focusAreas: string[] | undefined = undefined;
  if (args['focus_areas'] !== undefined) {
    if (!Array.isArray(args['focus_areas'])) {
      throw new ValidationError('focus_areas must be an array');
    }
    if (args['focus_areas'].length > 6) {
      throw new ValidationError('focus_areas array cannot have more than 6 items');
    }
    
    const validFocusAreas = ['syntax', 'logic', 'security', 'performance', 'best_practices', 'concepts'];
    focusAreas = [];
    for (let i = 0; i < args['focus_areas'].length; i++) {
      const area = args['focus_areas'][i];
      if (typeof area !== 'string') {
        throw new ValidationError(`focus_areas[${i}] must be a string`);
      }
      if (!validFocusAreas.includes(area)) {
        throw new ValidationError(`focus_areas[${i}] must be one of: ${validFocusAreas.join(', ')}`);
      }
      focusAreas.push(area);
    }
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

  let includeExamples: boolean = true; // default value
  if (args['include_examples'] !== undefined) {
    if (typeof args['include_examples'] !== 'boolean') {
      throw new ValidationError('include_examples must be a boolean');
    }
    includeExamples = args['include_examples'];
  }

  const request: ExplanationRequest = {
    code,
    detailLevel,
    includeExamples
  };

  if (focusAreas !== undefined) {
    request.focusAreas = focusAreas;
  }

  if (serverType !== undefined) {
    request.serverType = serverType;
  }

  return request;
}