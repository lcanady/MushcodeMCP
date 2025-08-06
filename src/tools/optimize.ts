/**
 * optimize_mushcode tool implementation
 * Optimizes MUSHCODE for performance and maintainability
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MushcodeOptimizer, OptimizationRequest } from '../engines/optimizer.js';
import { MushcodeKnowledgeBase } from '../knowledge/base.js';
import { ValidationError } from '../utils/errors.js';
import { CodeImprovement } from '../types/knowledge.js';

interface OptimizeToolResult {
  optimized_code: string;
  improvements: CodeImprovement[];
  performance_impact: string;
  explanation: string;
  optimization_summary: {
    original_size: number;
    optimized_size: number;
    compression_ratio: number;
    functionality_preserved: boolean;
  };
  warnings?: string[];
}

// Tool definition
export const optimizeMushcodeTool: Tool = {
  name: 'optimize_mushcode',
  description: 'Optimize MUSHCODE for performance, readability, and maintainability',
  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'MUSHCODE to optimize',
        minLength: 1,
        maxLength: 50000
      },
      optimization_goals: {
        type: 'array',
        description: 'Specific optimization goals to focus on',
        items: {
          type: 'string',
          enum: ['performance', 'readability', 'maintainability', 'security']
        },
        uniqueItems: true,
        default: ['performance', 'readability', 'maintainability']
      },
      server_type: {
        type: 'string',
        description: 'Target MUD server type for optimization',
        enum: ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX']
      },
      preserve_functionality: {
        type: 'boolean',
        description: 'Ensure optimizations maintain original functionality',
        default: true
      },
      aggressive_optimization: {
        type: 'boolean',
        description: 'Enable more aggressive optimizations that may change code structure significantly',
        default: false
      }
    },
    required: ['code']
  }
};

/**
 * Tool handler for optimize_mushcode
 */
export async function optimizeMushcodeHandler(
  args: Record<string, unknown>,
  knowledgeBase: MushcodeKnowledgeBase
): Promise<OptimizeToolResult> {
  try {
    // Validate and extract arguments
    const request = validateAndExtractArgs(args);
    
    // Create optimizer instance
    const optimizer = new MushcodeOptimizer(knowledgeBase);
    
    // Perform optimization
    const result = await optimizer.optimize(request);
    
    const toolResult: OptimizeToolResult = {
      optimized_code: result.optimizedCode,
      improvements: result.improvements,
      performance_impact: result.performanceImpact,
      explanation: result.explanation,
      optimization_summary: {
        original_size: result.originalSize,
        optimized_size: result.optimizedSize,
        compression_ratio: result.compressionRatio,
        functionality_preserved: result.functionalityPreserved
      }
    };

    if (result.warnings && result.warnings.length > 0) {
      toolResult.warnings = result.warnings;
    }

    return toolResult;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Code optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate and extract arguments from the tool call
 */
function validateAndExtractArgs(args: Record<string, unknown>): OptimizationRequest {
  // Validate required fields
  if (args['code'] === undefined || args['code'] === null) {
    throw new ValidationError('code is required');
  }
  
  if (typeof args['code'] !== 'string') {
    throw new ValidationError('code is required and must be a string');
  }

  const code = args['code'].trim();
  if (code.length === 0) {
    throw new ValidationError('code cannot be empty');
  }

  if (code.length > 50000) {
    throw new ValidationError('code is too long (max 50000 characters)');
  }

  // Validate optional fields
  let optimizationGoals: string[] | undefined = undefined;
  if (args['optimization_goals'] !== undefined) {
    if (!Array.isArray(args['optimization_goals'])) {
      throw new ValidationError('optimization_goals must be an array');
    }
    
    const validGoals = ['performance', 'readability', 'maintainability', 'security'];
    optimizationGoals = [];
    
    for (let i = 0; i < args['optimization_goals'].length; i++) {
      const goal = args['optimization_goals'][i];
      if (typeof goal !== 'string') {
        throw new ValidationError(`optimization_goals[${i}] must be a string`);
      }
      if (!validGoals.includes(goal)) {
        throw new ValidationError(`optimization_goals[${i}] must be one of: ${validGoals.join(', ')}`);
      }
      if (!optimizationGoals.includes(goal)) {
        optimizationGoals.push(goal);
      }
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

  let preserveFunctionality: boolean = true; // default value
  if (args['preserve_functionality'] !== undefined) {
    if (typeof args['preserve_functionality'] !== 'boolean') {
      throw new ValidationError('preserve_functionality must be a boolean');
    }
    preserveFunctionality = args['preserve_functionality'];
  }

  let aggressiveOptimization: boolean = false; // default value
  if (args['aggressive_optimization'] !== undefined) {
    if (typeof args['aggressive_optimization'] !== 'boolean') {
      throw new ValidationError('aggressive_optimization must be a boolean');
    }
    aggressiveOptimization = args['aggressive_optimization'];
  }

  return {
    code,
    optimizationGoals,
    serverType,
    preserveFunctionality,
    aggressiveOptimization
  };
}