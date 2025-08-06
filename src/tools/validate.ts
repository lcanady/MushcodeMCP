/**
 * validate_mushcode tool implementation
 * Validates MUSHCODE for syntax errors and security vulnerabilities
 */

import { MushcodeValidator, ValidationRequest } from '../engines/validator.js';
import { MushcodeKnowledgeBase } from '../knowledge/base.js';
import { ValidationError } from '../utils/errors.js';
import { SyntaxError, SecurityWarning, CodeImprovement } from '../types/knowledge.js';

interface ValidateToolResult {
  is_valid: boolean;
  syntax_errors: SyntaxError[];
  security_warnings: SecurityWarning[];
  best_practice_suggestions: CodeImprovement[];
  compatibility_notes: string[];
  analysis_summary: {
    total_lines: number;
    complexity_score: number;
    security_score: number;
    maintainability_score: number;
  };
}

// Tool definition
export const validateMushcodeTool = {
  name: 'validate_mushcode',
  description: 'Validate MUSHCODE for syntax errors, security vulnerabilities, and best practices',
  inputSchema: {
    type: 'object' as const,
    properties: {
      code: {
        type: 'string',
        description: 'MUSHCODE to validate',
        minLength: 1,
        maxLength: 50000
      },
      server_type: {
        type: 'string',
        description: 'Target MUD server type for validation',
        enum: ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX']
      },
      strict_mode: {
        type: 'boolean',
        description: 'Enable strict validation rules',
        default: false
      },
      check_security: {
        type: 'boolean',
        description: 'Enable security vulnerability checking',
        default: true
      },
      check_best_practices: {
        type: 'boolean',
        description: 'Enable best practices checking',
        default: true
      }
    },
    required: ['code']
  }
};

/**
 * Tool handler for validate_mushcode
 */
export async function validateMushcodeHandler(
  args: Record<string, unknown>,
  knowledgeBase: MushcodeKnowledgeBase
): Promise<ValidateToolResult> {
  try {
    // Validate and extract arguments
    const request = validateAndExtractArgs(args);
    
    // Create validator instance
    const validator = new MushcodeValidator(knowledgeBase);
    
    // Perform validation
    const result = await validator.validate(request);
    
    const toolResult: ValidateToolResult = {
      is_valid: result.isValid,
      syntax_errors: result.syntaxErrors,
      security_warnings: result.securityWarnings,
      best_practice_suggestions: result.bestPracticeSuggestions,
      compatibility_notes: result.compatibilityNotes,
      analysis_summary: {
        total_lines: result.totalLines,
        complexity_score: result.complexityScore,
        security_score: result.securityScore,
        maintainability_score: result.maintainabilityScore
      }
    };

    return toolResult;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Code validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate and extract arguments from the tool call
 */
function validateAndExtractArgs(args: Record<string, unknown>): ValidationRequest {
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

  let strictMode: boolean = false;
  if (args['strict_mode'] !== undefined) {
    if (typeof args['strict_mode'] !== 'boolean') {
      throw new ValidationError('strict_mode must be a boolean');
    }
    strictMode = args['strict_mode'];
  }

  let checkSecurity: boolean = true;
  if (args['check_security'] !== undefined) {
    if (typeof args['check_security'] !== 'boolean') {
      throw new ValidationError('check_security must be a boolean');
    }
    checkSecurity = args['check_security'];
  }

  let checkBestPractices: boolean = true;
  if (args['check_best_practices'] !== undefined) {
    if (typeof args['check_best_practices'] !== 'boolean') {
      throw new ValidationError('check_best_practices must be a boolean');
    }
    checkBestPractices = args['check_best_practices'];
  }

  return {
    code,
    serverType,
    strictMode,
    checkSecurity,
    checkBestPractices
  };
}