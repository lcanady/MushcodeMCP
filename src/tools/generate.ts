/**
 * generate_mushcode tool implementation
 * Generates MUSHCODE based on user specifications
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MushcodeGenerator, GenerationRequest } from '../engines/generator.js';
import { MushcodeKnowledgeBase } from '../knowledge/base.js';
import { ValidationError } from '../utils/errors.js';

interface GenerateToolResult {
  code: string;
  explanation: string;
  usage_example: string;
  compatibility: string[];
  security_notes?: string;
  pattern_used?: string;
  warnings?: string[];
}

// Tool definition
export const generateMushcodeTool: Tool = {
  name: 'generate_mushcode',
  description: 'Generate MUSHCODE functions and commands based on natural language descriptions',
  inputSchema: {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: 'What the code should do (natural language description)',
        minLength: 1,
        maxLength: 1000
      },
      server_type: {
        type: 'string',
        description: 'Target MUD server type (PennMUSH, TinyMUSH, RhostMUSH, etc.)',
        enum: ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX']
      },
      function_type: {
        type: 'string',
        description: 'Type of MUSHCODE to generate',
        enum: ['command', 'function', 'trigger', 'attribute', 'utility']
      },
      parameters: {
        type: 'array',
        description: 'Expected parameters for the function/command',
        items: {
          type: 'string'
        },
        maxItems: 10
      },
      security_level: {
        type: 'string',
        description: 'Required permission level',
        enum: ['public', 'player', 'builder', 'wizard', 'god']
      },
      include_comments: {
        type: 'boolean',
        description: 'Whether to include explanatory comments in the generated code',
        default: true
      }
    },
    required: ['description']
  }
};

/**
 * Tool handler for generate_mushcode
 */
export async function generateMushcodeHandler(
  args: Record<string, unknown>,
  knowledgeBase: MushcodeKnowledgeBase
): Promise<GenerateToolResult> {
  try {
    // Validate and extract arguments
    const request = validateAndExtractArgs(args);
    
    // Create generator instance
    const generator = new MushcodeGenerator(knowledgeBase);
    
    // Generate the code
    const result = await generator.generate(request);
    
    const toolResult: GenerateToolResult = {
      code: result.code,
      explanation: result.explanation,
      usage_example: result.usageExample,
      compatibility: result.compatibility
    };

    if (result.securityNotes) {
      toolResult.security_notes = result.securityNotes;
    }

    if (result.patternUsed) {
      toolResult.pattern_used = result.patternUsed;
    }

    if (result.warnings && result.warnings.length > 0) {
      toolResult.warnings = result.warnings;
    }

    return toolResult;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate and extract arguments from the tool call
 */
function validateAndExtractArgs(args: Record<string, unknown>): GenerationRequest {
  // Validate required fields
  if (!args['description'] || typeof args['description'] !== 'string') {
    throw new ValidationError('description is required and must be a string');
  }

  const description = args['description'].trim();
  if (description.length === 0) {
    throw new ValidationError('description cannot be empty');
  }

  if (description.length > 1000) {
    throw new ValidationError('description is too long (max 1000 characters)');
  }

  // Validate optional fields
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

  let functionType: string | undefined = undefined;
  if (args['function_type'] !== undefined) {
    if (typeof args['function_type'] !== 'string') {
      throw new ValidationError('function_type must be a string');
    }
    const validFunctionTypes = ['command', 'function', 'trigger', 'attribute', 'utility'];
    if (!validFunctionTypes.includes(args['function_type'])) {
      throw new ValidationError(`function_type must be one of: ${validFunctionTypes.join(', ')}`);
    }
    functionType = args['function_type'];
  }

  let parameters: string[] | undefined = undefined;
  if (args['parameters'] !== undefined) {
    if (!Array.isArray(args['parameters'])) {
      throw new ValidationError('parameters must be an array');
    }
    if (args['parameters'].length > 10) {
      throw new ValidationError('parameters array cannot have more than 10 items');
    }
    
    parameters = [];
    for (let i = 0; i < args['parameters'].length; i++) {
      const param = args['parameters'][i];
      if (typeof param !== 'string') {
        throw new ValidationError(`parameters[${i}] must be a string`);
      }
      parameters.push(param);
    }
  }

  let securityLevel: string | undefined = undefined;
  if (args['security_level'] !== undefined) {
    if (typeof args['security_level'] !== 'string') {
      throw new ValidationError('security_level must be a string');
    }
    const validSecurityLevels = ['public', 'player', 'builder', 'wizard', 'god'];
    if (!validSecurityLevels.includes(args['security_level'])) {
      throw new ValidationError(`security_level must be one of: ${validSecurityLevels.join(', ')}`);
    }
    securityLevel = args['security_level'];
  }

  let includeComments: boolean | undefined = true; // default value
  if (args['include_comments'] !== undefined) {
    if (typeof args['include_comments'] !== 'boolean') {
      throw new ValidationError('include_comments must be a boolean');
    }
    includeComments = args['include_comments'];
  }

  return {
    description,
    serverType,
    functionType,
    parameters,
    securityLevel,
    includeComments
  };
}