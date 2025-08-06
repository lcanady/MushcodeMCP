/**
 * format_mushcode tool implementation
 * Formats MUSHCODE for improved readability and consistency
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MushcodeFormatter, FormattingRequest } from '../engines/formatter.js';
import { MushcodeKnowledgeBase } from '../knowledge/base.js';
import { ValidationError } from '../utils/errors.js';

interface FormatToolResult {
  formatted_code: string;
  changes_made: string[];
  style_notes: string;
}

// Tool definition
export const formatMushcodeTool: Tool = {
  name: 'format_mushcode',
  description: 'Format MUSHCODE for improved readability and consistency',
  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'MUSHCODE to format',
        minLength: 1,
        maxLength: 10000
      },
      style: {
        type: 'string',
        description: 'Formatting style to apply',
        enum: ['readable', 'compact', 'custom'],
        default: 'readable'
      },
      indent_size: {
        type: 'number',
        description: 'Number of spaces for indentation',
        minimum: 0,
        maximum: 8,
        default: 2
      },
      line_length: {
        type: 'number',
        description: 'Maximum line length before wrapping',
        minimum: 40,
        maximum: 200,
        default: 80
      },
      preserve_comments: {
        type: 'boolean',
        description: 'Whether to keep existing comments',
        default: true
      },
      server_type: {
        type: 'string',
        description: 'Target MUD server type for dialect-specific formatting',
        enum: ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX']
      }
    },
    required: ['code']
  }
};

/**
 * Tool handler for format_mushcode
 */
export async function formatMushcodeHandler(
  args: Record<string, unknown>,
  knowledgeBase: MushcodeKnowledgeBase
): Promise<FormatToolResult> {
  try {
    // Validate and extract arguments
    const request = validateAndExtractArgs(args);
    
    // Create formatter instance
    const formatter = new MushcodeFormatter(knowledgeBase);
    
    // Format the code
    const result = await formatter.format(request);
    
    return {
      formatted_code: result.formattedCode,
      changes_made: result.changesMade,
      style_notes: result.styleNotes
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Code formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate and extract arguments from the tool call
 */
function validateAndExtractArgs(args: Record<string, unknown>): FormattingRequest {
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
  let style: string | undefined = undefined;
  if (args['style'] !== undefined) {
    if (typeof args['style'] !== 'string') {
      throw new ValidationError('style must be a string');
    }
    const validStyles = ['readable', 'compact', 'custom'];
    if (!validStyles.includes(args['style'])) {
      throw new ValidationError(`style must be one of: ${validStyles.join(', ')}`);
    }
    style = args['style'];
  }

  let indentSize: number | undefined = undefined;
  if (args['indent_size'] !== undefined) {
    if (typeof args['indent_size'] !== 'number') {
      throw new ValidationError('indent_size must be a number');
    }
    if (args['indent_size'] < 0 || args['indent_size'] > 8) {
      throw new ValidationError('indent_size must be between 0 and 8');
    }
    indentSize = args['indent_size'];
  }

  let lineLength: number | undefined = undefined;
  if (args['line_length'] !== undefined) {
    if (typeof args['line_length'] !== 'number') {
      throw new ValidationError('line_length must be a number');
    }
    if (args['line_length'] < 40 || args['line_length'] > 200) {
      throw new ValidationError('line_length must be between 40 and 200');
    }
    lineLength = args['line_length'];
  }

  let preserveComments: boolean | undefined = undefined;
  if (args['preserve_comments'] !== undefined) {
    if (typeof args['preserve_comments'] !== 'boolean') {
      throw new ValidationError('preserve_comments must be a boolean');
    }
    preserveComments = args['preserve_comments'];
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

  const request: FormattingRequest = {
    code
  };

  if (style !== undefined) {
    request.style = style;
  }

  if (indentSize !== undefined) {
    request.indentSize = indentSize;
  }

  if (lineLength !== undefined) {
    request.lineLength = lineLength;
  }

  if (preserveComments !== undefined) {
    request.preserveComments = preserveComments;
  }

  if (serverType !== undefined) {
    request.serverType = serverType;
  }

  return request;
}