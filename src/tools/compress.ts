/**
 * compress_mushcode tool implementation
 * Compresses and minifies MUSHCODE while preserving functionality
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MushcodeCompressor, CompressionRequest } from '../engines/compressor.js';
import { MushcodeKnowledgeBase } from '../knowledge/base.js';
import { ValidationError } from '../utils/errors.js';

interface CompressToolResult {
  compressed_code: string;
  original_size: number;
  compressed_size: number;
  compression_ratio: number;
  optimizations_applied: string[];
  warnings?: string[];
}

// Tool definition
export const compressMushcodeTool: Tool = {
  name: 'compress_mushcode',
  description: 'Compress and minify MUSHCODE while preserving functionality',
  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'MUSHCODE to compress',
        minLength: 1,
        maxLength: 50000
      },
      compression_level: {
        type: 'string',
        description: 'Level of compression to apply',
        enum: ['minimal', 'moderate', 'aggressive'],
        default: 'moderate'
      },
      preserve_functionality: {
        type: 'boolean',
        description: 'Ensure compressed code maintains original functionality',
        default: true
      },
      remove_comments: {
        type: 'boolean',
        description: 'Strip comments for size reduction',
        default: true
      },
      server_type: {
        type: 'string',
        description: 'Target MUD server type for optimization',
        enum: ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX']
      }
    },
    required: ['code']
  }
};

/**
 * Tool handler for compress_mushcode
 */
export async function compressMushcodeHandler(
  args: Record<string, unknown>,
  knowledgeBase: MushcodeKnowledgeBase
): Promise<CompressToolResult> {
  try {
    // Validate and extract arguments
    const request = validateAndExtractArgs(args);
    
    // Create compressor instance
    const compressor = new MushcodeCompressor(knowledgeBase);
    
    // Compress the code
    const result = await compressor.compress(request);
    
    const toolResult: CompressToolResult = {
      compressed_code: result.compressedCode,
      original_size: result.originalSize,
      compressed_size: result.compressedSize,
      compression_ratio: result.compressionRatio,
      optimizations_applied: result.optimizationsApplied
    };

    if (result.warnings) {
      toolResult.warnings = result.warnings;
    }

    return toolResult;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Code compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate and extract arguments from the tool call
 */
function validateAndExtractArgs(args: Record<string, unknown>): CompressionRequest {
  // Validate required fields
  if (!args['code'] || typeof args['code'] !== 'string') {
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
  let compressionLevel: string | undefined = undefined;
  if (args['compression_level'] !== undefined) {
    if (typeof args['compression_level'] !== 'string') {
      throw new ValidationError('compression_level must be a string');
    }
    const validLevels = ['minimal', 'moderate', 'aggressive'];
    if (!validLevels.includes(args['compression_level'])) {
      throw new ValidationError(`compression_level must be one of: ${validLevels.join(', ')}`);
    }
    compressionLevel = args['compression_level'];
  }

  let preserveFunctionality: boolean | undefined = undefined;
  if (args['preserve_functionality'] !== undefined) {
    if (typeof args['preserve_functionality'] !== 'boolean') {
      throw new ValidationError('preserve_functionality must be a boolean');
    }
    preserveFunctionality = args['preserve_functionality'];
  }

  let removeComments: boolean | undefined = undefined;
  if (args['remove_comments'] !== undefined) {
    if (typeof args['remove_comments'] !== 'boolean') {
      throw new ValidationError('remove_comments must be a boolean');
    }
    removeComments = args['remove_comments'];
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

  const request: CompressionRequest = {
    code
  };

  if (compressionLevel !== undefined) {
    request.compressionLevel = compressionLevel;
  }

  if (preserveFunctionality !== undefined) {
    request.preserveFunctionality = preserveFunctionality;
  }

  if (removeComments !== undefined) {
    request.removeComments = removeComments;
  }

  if (serverType !== undefined) {
    request.serverType = serverType;
  }

  return request;
}