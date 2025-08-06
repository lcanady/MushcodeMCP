import { logger } from './logger.js';

/**
 * Error severity levels for classification
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  PROTOCOL = 'protocol',
  VALIDATION = 'validation',
  TOOL_EXECUTION = 'tool_execution',
  KNOWLEDGE_BASE = 'knowledge_base',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  CONFIGURATION = 'configuration'
}

/**
 * Interface for actionable error suggestions
 */
export interface ErrorSuggestion {
  action: string;
  description: string;
  documentation?: string;
  example?: string;
}

/**
 * Base class for all MUSHCODE MCP server errors
 */
export abstract class MushcodeError extends Error {
  abstract readonly code: string;
  abstract readonly mcpErrorCode: number;
  abstract readonly severity: ErrorSeverity;
  abstract readonly category: ErrorCategory;
  
  public readonly suggestions: ErrorSuggestion[] = [];
  public readonly userMessage: string;
  public readonly canRecover: boolean = false;
  
  constructor(
    message: string, 
    userMessage?: string,
    public readonly details?: Record<string, unknown>,
    suggestions: ErrorSuggestion[] = []
  ) {
    super(message);
    this.name = this.constructor.name;
    this.userMessage = userMessage || message;
    this.suggestions = suggestions;
  }

  /**
   * Add a suggestion for resolving this error
   */
  public addSuggestion(suggestion: ErrorSuggestion): void {
    this.suggestions.push(suggestion);
  }

  /**
   * Get user-friendly error information
   */
  public getUserInfo(): {
    message: string;
    severity: ErrorSeverity;
    category: ErrorCategory;
    suggestions: ErrorSuggestion[];
    canRecover: boolean;
  } {
    return {
      message: this.userMessage,
      severity: this.severity,
      category: this.category,
      suggestions: this.suggestions,
      canRecover: this.canRecover
    };
  }
}

/**
 * Protocol-level communication errors
 */
export class ProtocolError extends MushcodeError {
  readonly code = 'INTERNAL_ERROR';
  readonly mcpErrorCode = -32603;
  readonly severity = ErrorSeverity.HIGH;
  readonly category = ErrorCategory.PROTOCOL;
  override readonly canRecover = false;

  constructor(message: string, details?: Record<string, unknown>) {
    const userMessage = 'Communication error with the MCP server. Please check your connection and try again.';
    const suggestions: ErrorSuggestion[] = [
      {
        action: 'retry',
        description: 'Wait a moment and try your request again',
      },
      {
        action: 'check_connection',
        description: 'Verify your IDE is properly connected to the MCP server',
        documentation: 'https://modelcontextprotocol.io/docs/concepts/clients'
      }
    ];
    
    super(`Protocol error: ${message}`, userMessage, details, suggestions);
  }
}

/**
 * Input validation errors
 */
export class ValidationError extends MushcodeError {
  readonly code = 'INVALID_PARAMS';
  readonly mcpErrorCode = -32602;
  readonly severity = ErrorSeverity.MEDIUM;
  readonly category = ErrorCategory.VALIDATION;
  override readonly canRecover = true;

  constructor(message: string, details?: Record<string, unknown>) {
    const userMessage = 'Invalid input provided. Please check your parameters and try again.';
    const suggestions: ErrorSuggestion[] = [
      {
        action: 'check_parameters',
        description: 'Review the required parameters for this tool',
      },
      {
        action: 'fix_input',
        description: 'Correct the invalid input and retry your request',
      }
    ];

    // Add specific suggestions based on the error details
    if (details?.['missingParameter']) {
      suggestions.push({
        action: 'add_parameter',
        description: `Add the required parameter: ${details['missingParameter']}`,
        example: `"${details['missingParameter']}": "your_value_here"`
      });
    }

    if (details?.['expectedType'] && details?.['actualType']) {
      suggestions.push({
        action: 'fix_type',
        description: `Change parameter type from ${details['actualType']} to ${details['expectedType']}`,
        example: `Expected: ${details['expectedType']}, Got: ${details['actualType']}`
      });
    }
    
    super(`Validation error: ${message}`, userMessage, details, suggestions);
  }
}

/**
 * Tool execution errors
 */
export class ToolExecutionError extends MushcodeError {
  readonly code = 'INTERNAL_ERROR';
  readonly mcpErrorCode = -32603;
  readonly severity = ErrorSeverity.HIGH;
  readonly category = ErrorCategory.TOOL_EXECUTION;
  override readonly canRecover = true;

  constructor(toolName: string, message: string, details?: Record<string, unknown>) {
    const userMessage = `The ${toolName} tool encountered an error. Please try again with different parameters.`;
    const suggestions: ErrorSuggestion[] = [
      {
        action: 'retry',
        description: 'Try your request again with the same parameters',
      },
      {
        action: 'simplify_request',
        description: 'Try a simpler version of your request',
      },
      {
        action: 'check_input',
        description: 'Verify your input parameters are correct and complete',
      }
    ];

    // Add tool-specific suggestions
    switch (toolName) {
      case 'generate_mushcode':
        suggestions.push({
          action: 'clarify_description',
          description: 'Provide a more detailed description of what you want to generate',
          example: 'Instead of "make a command", try "create a command that teleports a player to a specific room"'
        });
        break;
      case 'validate_mushcode':
        suggestions.push({
          action: 'check_syntax',
          description: 'Ensure the MUSHCODE you\'re validating has proper syntax',
        });
        break;
      case 'optimize_mushcode':
        suggestions.push({
          action: 'provide_context',
          description: 'Include more context about what the code should do',
        });
        break;
    }
    
    super(`Tool execution error in ${toolName}: ${message}`, userMessage, details, suggestions);
  }
}

/**
 * Tool not found errors
 */
export class ToolNotFoundError extends MushcodeError {
  readonly code = 'METHOD_NOT_FOUND';
  readonly mcpErrorCode = -32601;
  readonly severity = ErrorSeverity.MEDIUM;
  readonly category = ErrorCategory.VALIDATION;
  override readonly canRecover = true;

  constructor(toolName: string) {
    const userMessage = `The tool "${toolName}" is not available. Please check the tool name and try again.`;
    const suggestions: ErrorSuggestion[] = [
      {
        action: 'check_tool_name',
        description: 'Verify you\'re using the correct tool name',
      },
      {
        action: 'list_available_tools',
        description: 'Check which tools are available in your MCP client',
      }
    ];

    // Add suggestions for common misspellings
    const availableTools = [
      'generate_mushcode',
      'validate_mushcode', 
      'optimize_mushcode',
      'explain_mushcode',
      'get_examples',
      'format_mushcode',
      'compress_mushcode'
    ];

    const similarTool = availableTools.find(tool => 
      tool.toLowerCase().includes(toolName.toLowerCase()) ||
      toolName.toLowerCase().includes(tool.toLowerCase())
    );

    if (similarTool) {
      suggestions.push({
        action: 'use_correct_name',
        description: `Did you mean "${similarTool}"?`,
        example: similarTool
      });
    }
    
    super(`Tool not found: ${toolName}`, userMessage, { toolName }, suggestions);
  }
}

/**
 * Knowledge base errors
 */
export class KnowledgeBaseError extends MushcodeError {
  readonly code = 'INTERNAL_ERROR';
  readonly mcpErrorCode = -32603;
  readonly severity = ErrorSeverity.MEDIUM;
  readonly category = ErrorCategory.KNOWLEDGE_BASE;
  override readonly canRecover = true;

  constructor(message: string, details?: Record<string, unknown>) {
    const userMessage = 'The knowledge base is temporarily unavailable or incomplete. The server will use fallback patterns.';
    const suggestions: ErrorSuggestion[] = [
      {
        action: 'retry_later',
        description: 'Try your request again in a few moments',
      },
      {
        action: 'use_generic_patterns',
        description: 'The server will attempt to use generic MUSHCODE patterns',
      },
      {
        action: 'specify_server_type',
        description: 'Try specifying a server type (PennMUSH, TinyMUSH, etc.) for better results',
        example: '"server_type": "PennMUSH"'
      }
    ];
    
    super(`Knowledge base error: ${message}`, userMessage, details, suggestions);
  }
}

/**
 * Performance-related errors
 */
export class PerformanceError extends MushcodeError {
  readonly code = 'INTERNAL_ERROR';
  readonly mcpErrorCode = -32603;
  readonly severity = ErrorSeverity.MEDIUM;
  readonly category = ErrorCategory.PERFORMANCE;
  override readonly canRecover = true;

  constructor(operation: string, timeout: number, details?: Record<string, unknown>) {
    const userMessage = `The operation took too long to complete. Please try a simpler request.`;
    const suggestions: ErrorSuggestion[] = [
      {
        action: 'simplify_request',
        description: 'Try breaking your request into smaller parts',
      },
      {
        action: 'retry',
        description: 'Wait a moment and try again',
      },
      {
        action: 'reduce_complexity',
        description: 'Use fewer parameters or a shorter description',
      }
    ];
    
    super(
      `Performance error: ${operation} exceeded timeout of ${timeout}ms`, 
      userMessage, 
      { operation, timeout, ...details }, 
      suggestions
    );
  }
}

/**
 * Security-related errors
 */
export class SecurityError extends MushcodeError {
  readonly code = 'INTERNAL_ERROR';
  readonly mcpErrorCode = -32603;
  readonly severity = ErrorSeverity.HIGH;
  readonly category = ErrorCategory.SECURITY;
  override readonly canRecover = true;

  constructor(message: string, details?: Record<string, unknown>) {
    const userMessage = 'Security concern detected in the request. Please review and modify your input.';
    const suggestions: ErrorSuggestion[] = [
      {
        action: 'review_input',
        description: 'Check your input for potentially unsafe patterns',
      },
      {
        action: 'use_safe_patterns',
        description: 'Use established MUSHCODE security best practices',
        documentation: 'https://mushcode.com/security'
      },
      {
        action: 'specify_security_level',
        description: 'Explicitly specify the required security level for your code',
        example: '"security_level": "player"'
      }
    ];
    
    super(`Security error: ${message}`, userMessage, details, suggestions);
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends MushcodeError {
  readonly code = 'INTERNAL_ERROR';
  readonly mcpErrorCode = -32603;
  readonly severity = ErrorSeverity.HIGH;
  readonly category = ErrorCategory.CONFIGURATION;
  override readonly canRecover = false;

  constructor(message: string, details?: Record<string, unknown>) {
    const userMessage = 'Server configuration error. Please contact your administrator.';
    const suggestions: ErrorSuggestion[] = [
      {
        action: 'contact_admin',
        description: 'Contact your system administrator for assistance',
      },
      {
        action: 'check_config',
        description: 'Verify the MCP server configuration is correct',
        documentation: 'https://modelcontextprotocol.io/docs/concepts/servers'
      }
    ];
    
    super(`Configuration error: ${message}`, userMessage, details, suggestions);
  }
}

/**
 * Graceful degradation options
 */
export interface DegradationOptions {
  useGenericPatterns?: boolean;
  skipOptionalFeatures?: boolean;
  reduceComplexity?: boolean;
  fallbackToBasicMode?: boolean;
}

/**
 * Graceful degradation manager
 */
export class GracefulDegradation {
  private static degradationLevel: number = 0;
  private static maxDegradationLevel: number = 3;

  /**
   * Check if we should degrade functionality
   */
  public static shouldDegrade(): boolean {
    return this.degradationLevel > 0;
  }

  /**
   * Get current degradation level
   */
  public static getDegradationLevel(): number {
    return this.degradationLevel;
  }

  /**
   * Increase degradation level
   */
  public static increaseDegradation(): void {
    if (this.degradationLevel < this.maxDegradationLevel) {
      this.degradationLevel++;
    }
  }

  /**
   * Reset degradation level
   */
  public static resetDegradation(): void {
    this.degradationLevel = 0;
  }

  /**
   * Get degradation options for current level
   */
  public static getDegradationOptions(): DegradationOptions {
    switch (this.degradationLevel) {
      case 1:
        return {
          skipOptionalFeatures: true
        };
      case 2:
        return {
          skipOptionalFeatures: true,
          useGenericPatterns: true
        };
      case 3:
        return {
          skipOptionalFeatures: true,
          useGenericPatterns: true,
          reduceComplexity: true,
          fallbackToBasicMode: true
        };
      default:
        return {};
    }
  }

  /**
   * Execute operation with graceful degradation
   */
  public static async executeWithDegradation<T>(
    operation: () => Promise<T>,
    fallback: (options: DegradationOptions) => Promise<T>,
    _context?: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Increase degradation level on failure
      this.increaseDegradation();
      
      const options = this.getDegradationOptions();
      
      try {
        return await fallback(options);
      } catch (fallbackError) {
        // If fallback also fails, throw the original error with degradation info
        if (error instanceof MushcodeError) {
          error.addSuggestion({
            action: 'degraded_mode',
            description: `Server is operating in degraded mode (level ${this.degradationLevel})`,
          });
        }
        throw error;
      }
    }
  }
}

/**
 * Enhanced error handling with user-friendly messages and logging
 */
export function handleError(error: unknown, context?: string): {
  code: string;
  message: string;
  userMessage: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  suggestions: ErrorSuggestion[];
  canRecover: boolean;
  details?: Record<string, unknown>;
} {
  if (error instanceof MushcodeError) {
    // Log the error with context
    logger.error(
      `${error.category} error: ${error.message}`,
      error,
      { context, errorCode: error.code, severity: error.severity }
    );

    const userInfo = error.getUserInfo();
    
    return {
      code: error.code,
      message: error.message,
      userMessage: userInfo.message,
      severity: userInfo.severity,
      category: userInfo.category,
      suggestions: userInfo.suggestions,
      canRecover: userInfo.canRecover,
      ...(error.details && { details: error.details })
    };
  }
  
  if (error instanceof Error) {
    // Log unknown errors
    logger.error(`Unknown error: ${error.message}`, error, { context });
    
    return {
      code: 'INTERNAL_ERROR',
      message: error.message,
      userMessage: 'An unexpected error occurred. Please try again.',
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.TOOL_EXECUTION,
      suggestions: [
        {
          action: 'retry',
          description: 'Try your request again'
        },
        {
          action: 'contact_support',
          description: 'If the problem persists, contact support'
        }
      ],
      canRecover: true
    };
  }
  
  // Log completely unknown errors
  logger.error(`Unknown error type: ${typeof error}`, undefined, { context, errorValue: error });
  
  return {
    code: 'INTERNAL_ERROR',
    message: 'Unknown error occurred',
    userMessage: 'An unexpected error occurred. Please try again.',
    severity: ErrorSeverity.HIGH,
    category: ErrorCategory.TOOL_EXECUTION,
    suggestions: [
      {
        action: 'retry',
        description: 'Try your request again'
      }
    ],
    canRecover: true
  };
}

/**
 * Create user-friendly error response for MCP protocol
 */
export function createMCPErrorResponse(error: unknown, context?: string): {
  error: {
    code: number;
    message: string;
    data?: {
      userMessage: string;
      severity: ErrorSeverity;
      category: ErrorCategory;
      suggestions: ErrorSuggestion[];
      canRecover: boolean;
      details?: Record<string, unknown>;
    };
  };
} {
  const errorInfo = handleError(error, context);
  
  return {
    error: {
      code: error instanceof MushcodeError ? error.mcpErrorCode : -32603,
      message: errorInfo.message,
      data: {
        userMessage: errorInfo.userMessage,
        severity: errorInfo.severity,
        category: errorInfo.category,
        suggestions: errorInfo.suggestions,
        canRecover: errorInfo.canRecover,
        ...(errorInfo.details && { details: errorInfo.details })
      }
    }
  };
}

/**
 * Validate tool parameters against schema
 */
export function validateToolParameters(
  toolName: string,
  parameters: unknown,
  schema: Record<string, unknown>
): void {
  if (!parameters || typeof parameters !== 'object') {
    throw new ValidationError(`Invalid parameters for tool ${toolName}: expected object`);
  }

  // Basic validation - in a real implementation, you'd use a JSON schema validator
  const params = parameters as Record<string, unknown>;
  const schemaProps = schema['properties'] as Record<string, unknown> || {};
  const required = schema['required'] as string[] || [];

  // Check required parameters
  for (const requiredParam of required) {
    if (!(requiredParam in params)) {
      throw new ValidationError(
        `Missing required parameter '${requiredParam}' for tool ${toolName}`,
        { toolName, missingParameter: requiredParam }
      );
    }
  }

  // Check parameter types (basic validation)
  for (const [paramName, paramValue] of Object.entries(params)) {
    if (paramName in schemaProps) {
      const paramSchema = schemaProps[paramName] as Record<string, unknown>;
      const expectedType = paramSchema['type'] as string;
      
      if (expectedType && typeof paramValue !== expectedType && paramValue !== null) {
        throw new ValidationError(
          `Invalid type for parameter '${paramName}' in tool ${toolName}: expected ${expectedType}, got ${typeof paramValue}`,
          { toolName, parameter: paramName, expectedType, actualType: typeof paramValue }
        );
      }
    }
  }
}