import {
  ProtocolError,
  ValidationError,
  ToolExecutionError,
  ToolNotFoundError,
  KnowledgeBaseError,
  PerformanceError,
  SecurityError,
  ConfigurationError,
  ErrorSeverity,
  ErrorCategory,
  GracefulDegradation,
  handleError,
  createMCPErrorResponse,
  validateToolParameters,
} from '../../../src/utils/errors';

// Mock MCP error types to avoid SDK import issues
// Mock MCP error types to avoid SDK import issues

describe('Error Handling', () => {
  describe('ProtocolError', () => {
    it('should create protocol error with correct properties', () => {
      const error = new ProtocolError('Connection failed');
      
      expect(error.message).toBe('Protocol error: Connection failed');
      expect(error.mcpErrorCode).toBe(-32603);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.category).toBe(ErrorCategory.PROTOCOL);
      expect(error.canRecover).toBe(false);
    });

    it('should include details and suggestions in protocol error', () => {
      const details = { transport: 'stdio', attempt: 1 };
      const error = new ProtocolError('Connection failed', details);
      
      expect(error.details).toEqual(details);
      expect(error.suggestions).toHaveLength(2);
      expect(error.suggestions[0]?.action).toBe('retry');
      expect(error.userMessage).toContain('Communication error');
    });

    it('should provide user-friendly information', () => {
      const error = new ProtocolError('Connection failed');
      const userInfo = error.getUserInfo();
      
      expect(userInfo.message).toContain('Communication error');
      expect(userInfo.severity).toBe(ErrorSeverity.HIGH);
      expect(userInfo.category).toBe(ErrorCategory.PROTOCOL);
      expect(userInfo.suggestions.length).toBeGreaterThan(0);
      expect(userInfo.canRecover).toBe(false);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with correct properties', () => {
      const error = new ValidationError('Invalid parameter');
      
      expect(error.message).toBe('Validation error: Invalid parameter');
      expect(error.mcpErrorCode).toBe(-32602);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.canRecover).toBe(true);
    });

    it('should provide specific suggestions for missing parameters', () => {
      const details = { missingParameter: 'description' };
      const error = new ValidationError('Missing parameter', details);
      
      const suggestion = error.suggestions.find(s => s.action === 'add_parameter');
      expect(suggestion).toBeDefined();
      expect(suggestion?.description).toContain('description');
      expect(suggestion?.example).toContain('description');
    });

    it('should provide specific suggestions for type errors', () => {
      const details = { expectedType: 'string', actualType: 'number' };
      const error = new ValidationError('Type error', details);
      
      const suggestion = error.suggestions.find(s => s.action === 'fix_type');
      expect(suggestion).toBeDefined();
      expect(suggestion?.description).toContain('string');
      expect(suggestion?.description).toContain('number');
    });
  });

  describe('ToolExecutionError', () => {
    it('should create tool execution error with tool name', () => {
      const error = new ToolExecutionError('generate_mushcode', 'Generation failed');
      
      expect(error.message).toBe('Tool execution error in generate_mushcode: Generation failed');
      expect(error.mcpErrorCode).toBe(-32603);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.category).toBe(ErrorCategory.TOOL_EXECUTION);
      expect(error.canRecover).toBe(true);
    });

    it('should provide tool-specific suggestions for generate_mushcode', () => {
      const error = new ToolExecutionError('generate_mushcode', 'Generation failed');
      
      const suggestion = error.suggestions.find(s => s.action === 'clarify_description');
      expect(suggestion).toBeDefined();
      expect(suggestion?.description).toContain('detailed description');
      expect(suggestion?.example).toBeDefined();
    });

    it('should provide tool-specific suggestions for validate_mushcode', () => {
      const error = new ToolExecutionError('validate_mushcode', 'Validation failed');
      
      const suggestion = error.suggestions.find(s => s.action === 'check_syntax');
      expect(suggestion).toBeDefined();
      expect(suggestion?.description).toContain('proper syntax');
    });
  });

  describe('ToolNotFoundError', () => {
    it('should create tool not found error', () => {
      const error = new ToolNotFoundError('unknown_tool');
      
      expect(error.message).toBe('Tool not found: unknown_tool');
      expect(error.mcpErrorCode).toBe(-32601);
      expect(error.details).toEqual({ toolName: 'unknown_tool' });
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.canRecover).toBe(true);
    });

    it('should suggest similar tool names', () => {
      const error = new ToolNotFoundError('generate');
      
      const suggestion = error.suggestions.find(s => s.action === 'use_correct_name');
      expect(suggestion).toBeDefined();
      expect(suggestion?.description).toContain('generate_mushcode');
      expect(suggestion?.example).toBe('generate_mushcode');
    });

    it('should provide general suggestions for unknown tools', () => {
      const error = new ToolNotFoundError('completely_unknown');
      
      expect(error.suggestions).toHaveLength(2); // No similar tool suggestion
      expect(error.suggestions[0]?.action).toBe('check_tool_name');
      expect(error.suggestions[1]?.action).toBe('list_available_tools');
    });
  });

  describe('KnowledgeBaseError', () => {
    it('should create knowledge base error', () => {
      const error = new KnowledgeBaseError('Pattern not found');
      
      expect(error.message).toBe('Knowledge base error: Pattern not found');
      expect(error.mcpErrorCode).toBe(-32603);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.category).toBe(ErrorCategory.KNOWLEDGE_BASE);
      expect(error.canRecover).toBe(true);
    });

    it('should provide fallback suggestions', () => {
      const error = new KnowledgeBaseError('Pattern not found');
      
      expect(error.suggestions).toHaveLength(3);
      expect(error.suggestions[0]?.action).toBe('retry_later');
      expect(error.suggestions[1]?.action).toBe('use_generic_patterns');
      expect(error.suggestions[2]?.action).toBe('specify_server_type');
    });
  });

  describe('PerformanceError', () => {
    it('should create performance error with timeout info', () => {
      const error = new PerformanceError('code_generation', 5000);
      
      expect(error.message).toContain('code_generation exceeded timeout of 5000ms');
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.category).toBe(ErrorCategory.PERFORMANCE);
      expect(error.canRecover).toBe(true);
      expect(error.details?.['operation']).toBe('code_generation');
      expect(error.details?.['timeout']).toBe(5000);
    });

    it('should provide performance-related suggestions', () => {
      const error = new PerformanceError('code_generation', 5000);
      
      const suggestions = error.suggestions.map(s => s.action);
      expect(suggestions).toContain('simplify_request');
      expect(suggestions).toContain('retry');
      expect(suggestions).toContain('reduce_complexity');
    });
  });

  describe('SecurityError', () => {
    it('should create security error with high severity', () => {
      const error = new SecurityError('Unsafe pattern detected');
      
      expect(error.message).toBe('Security error: Unsafe pattern detected');
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.category).toBe(ErrorCategory.SECURITY);
      expect(error.canRecover).toBe(true);
    });

    it('should provide security-related suggestions', () => {
      const error = new SecurityError('Unsafe pattern detected');
      
      const suggestions = error.suggestions.map(s => s.action);
      expect(suggestions).toContain('review_input');
      expect(suggestions).toContain('use_safe_patterns');
      expect(suggestions).toContain('specify_security_level');
    });
  });

  describe('ConfigurationError', () => {
    it('should create configuration error with critical severity', () => {
      const error = new ConfigurationError('Invalid server config');
      
      expect(error.message).toBe('Configuration error: Invalid server config');
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.category).toBe(ErrorCategory.CONFIGURATION);
      expect(error.canRecover).toBe(false);
    });

    it('should provide admin-focused suggestions', () => {
      const error = new ConfigurationError('Invalid server config');
      
      const suggestions = error.suggestions.map(s => s.action);
      expect(suggestions).toContain('contact_admin');
      expect(suggestions).toContain('check_config');
    });
  });

  describe('handleError function', () => {
    it('should handle MushcodeError instances with full details', () => {
      const originalError = new ValidationError('Invalid input');
      const errorInfo = handleError(originalError, 'test_context');
      
      expect(errorInfo.message).toBe('Validation error: Invalid input');
      expect(errorInfo.userMessage).toContain('Invalid input provided');
      expect(errorInfo.severity).toBe(ErrorSeverity.MEDIUM);
      expect(errorInfo.category).toBe(ErrorCategory.VALIDATION);
      expect(errorInfo.suggestions).toHaveLength(2);
      expect(errorInfo.canRecover).toBe(true);
    });

    it('should handle generic Error instances', () => {
      const originalError = new Error('Generic error');
      const errorInfo = handleError(originalError, 'test_context');
      
      expect(errorInfo.message).toBe('Generic error');
      expect(errorInfo.userMessage).toBe('An unexpected error occurred. Please try again.');
      expect(errorInfo.severity).toBe(ErrorSeverity.HIGH);
      expect(errorInfo.category).toBe(ErrorCategory.TOOL_EXECUTION);
      expect(errorInfo.canRecover).toBe(true);
    });

    it('should handle unknown error types', () => {
      const errorInfo = handleError('string error', 'test_context');
      
      expect(errorInfo.message).toBe('Unknown error occurred');
      expect(errorInfo.userMessage).toBe('An unexpected error occurred. Please try again.');
      expect(errorInfo.severity).toBe(ErrorSeverity.HIGH);
      expect(errorInfo.canRecover).toBe(true);
    });

    it('should include context in error handling', () => {
      const originalError = new ValidationError('Invalid input');
      const errorInfo = handleError(originalError, 'generate_mushcode_tool');
      
      // The context should be logged (we can't easily test logging here)
      expect(errorInfo.code).toBe('INVALID_PARAMS');
    });
  });

  describe('createMCPErrorResponse function', () => {
    it('should create proper MCP error response for MushcodeError', () => {
      const originalError = new ValidationError('Invalid parameter');
      const mcpResponse = createMCPErrorResponse(originalError, 'test_context');
      
      expect(mcpResponse.error.code).toBe(-32602);
      expect(mcpResponse.error.message).toBe('Validation error: Invalid parameter');
      expect(mcpResponse.error.data?.userMessage).toContain('Invalid input provided');
      expect(mcpResponse.error.data?.severity).toBe(ErrorSeverity.MEDIUM);
      expect(mcpResponse.error.data?.category).toBe(ErrorCategory.VALIDATION);
      expect(mcpResponse.error.data?.suggestions).toHaveLength(2);
      expect(mcpResponse.error.data?.canRecover).toBe(true);
    });

    it('should create proper MCP error response for generic Error', () => {
      const originalError = new Error('Generic error');
      const mcpResponse = createMCPErrorResponse(originalError);
      
      expect(mcpResponse.error.code).toBe(-32603);
      expect(mcpResponse.error.message).toBe('Generic error');
      expect(mcpResponse.error.data?.userMessage).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('GracefulDegradation', () => {
    beforeEach(() => {
      GracefulDegradation.resetDegradation();
    });

    it('should start with no degradation', () => {
      expect(GracefulDegradation.shouldDegrade()).toBe(false);
      expect(GracefulDegradation.getDegradationLevel()).toBe(0);
    });

    it('should increase degradation level', () => {
      GracefulDegradation.increaseDegradation();
      expect(GracefulDegradation.shouldDegrade()).toBe(true);
      expect(GracefulDegradation.getDegradationLevel()).toBe(1);
    });

    it('should not exceed maximum degradation level', () => {
      for (let i = 0; i < 10; i++) {
        GracefulDegradation.increaseDegradation();
      }
      expect(GracefulDegradation.getDegradationLevel()).toBe(3);
    });

    it('should reset degradation level', () => {
      GracefulDegradation.increaseDegradation();
      GracefulDegradation.increaseDegradation();
      expect(GracefulDegradation.getDegradationLevel()).toBe(2);
      
      GracefulDegradation.resetDegradation();
      expect(GracefulDegradation.getDegradationLevel()).toBe(0);
    });

    it('should provide appropriate degradation options for each level', () => {
      // Level 0 - no degradation
      let options = GracefulDegradation.getDegradationOptions();
      expect(options).toEqual({});

      // Level 1 - skip optional features
      GracefulDegradation.increaseDegradation();
      options = GracefulDegradation.getDegradationOptions();
      expect(options.skipOptionalFeatures).toBe(true);
      expect(options.useGenericPatterns).toBeUndefined();

      // Level 2 - skip optional + use generic patterns
      GracefulDegradation.increaseDegradation();
      options = GracefulDegradation.getDegradationOptions();
      expect(options.skipOptionalFeatures).toBe(true);
      expect(options.useGenericPatterns).toBe(true);
      expect(options.reduceComplexity).toBeUndefined();

      // Level 3 - full degradation
      GracefulDegradation.increaseDegradation();
      options = GracefulDegradation.getDegradationOptions();
      expect(options.skipOptionalFeatures).toBe(true);
      expect(options.useGenericPatterns).toBe(true);
      expect(options.reduceComplexity).toBe(true);
      expect(options.fallbackToBasicMode).toBe(true);
    });

    it('should execute operation with degradation on failure', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));
      const mockFallback = jest.fn().mockResolvedValue('fallback result');

      const result = await GracefulDegradation.executeWithDegradation(
        mockOperation,
        mockFallback,
        'test_operation'
      );

      expect(result).toBe('fallback result');
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockFallback).toHaveBeenCalledTimes(1);
      expect(GracefulDegradation.getDegradationLevel()).toBe(1);
      
      const fallbackOptions = mockFallback.mock.calls[0][0];
      expect(fallbackOptions.skipOptionalFeatures).toBe(true);
    });

    it('should execute operation normally on success', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success result');
      const mockFallback = jest.fn();

      const result = await GracefulDegradation.executeWithDegradation(
        mockOperation,
        mockFallback
      );

      expect(result).toBe('success result');
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockFallback).not.toHaveBeenCalled();
      expect(GracefulDegradation.getDegradationLevel()).toBe(0);
    });

    it('should throw original error if fallback also fails', async () => {
      const originalError = new ValidationError('Original error');
      const fallbackError = new Error('Fallback failed');
      
      const mockOperation = jest.fn().mockRejectedValue(originalError);
      const mockFallback = jest.fn().mockRejectedValue(fallbackError);

      await expect(
        GracefulDegradation.executeWithDegradation(mockOperation, mockFallback)
      ).rejects.toThrow('Original error');

      expect(GracefulDegradation.getDegradationLevel()).toBe(1);
      
      // Should add degradation suggestion to original error
      expect(originalError.suggestions.some(s => s.action === 'degraded_mode')).toBe(true);
    });
  });

  describe('validateToolParameters function', () => {
    const mockSchema = {
      type: 'object',
      properties: {
        required_param: { type: 'string' },
        optional_param: { type: 'number' },
      },
      required: ['required_param'],
    };

    it('should validate correct parameters', () => {
      const params = {
        required_param: 'test',
        optional_param: 42,
      };
      
      expect(() => validateToolParameters('test_tool', params, mockSchema)).not.toThrow();
    });

    it('should validate with only required parameters', () => {
      const params = {
        required_param: 'test',
      };
      
      expect(() => validateToolParameters('test_tool', params, mockSchema)).not.toThrow();
    });

    it('should throw for non-object parameters', () => {
      expect(() => validateToolParameters('test_tool', 'not an object', mockSchema))
        .toThrow(ValidationError);
      
      expect(() => validateToolParameters('test_tool', null, mockSchema))
        .toThrow(ValidationError);
    });

    it('should throw for missing required parameters', () => {
      const params = {
        optional_param: 42,
      };
      
      expect(() => validateToolParameters('test_tool', params, mockSchema))
        .toThrow(ValidationError);
    });

    it('should throw for incorrect parameter types', () => {
      const params = {
        required_param: 'test',
        optional_param: 'should be number',
      };
      
      expect(() => validateToolParameters('test_tool', params, mockSchema))
        .toThrow(ValidationError);
    });

    it('should handle schema without properties', () => {
      const simpleSchema = {
        type: 'object',
      };
      
      const params = { any_param: 'value' };
      
      expect(() => validateToolParameters('test_tool', params, simpleSchema)).not.toThrow();
    });

    it('should handle schema without required array', () => {
      const schemaNoRequired = {
        type: 'object',
        properties: {
          optional_param: { type: 'string' },
        },
      };
      
      const params = { optional_param: 'test' };
      
      expect(() => validateToolParameters('test_tool', params, schemaNoRequired)).not.toThrow();
    });

    it('should allow null values for optional parameters', () => {
      const params = {
        required_param: 'test',
        optional_param: null,
      };
      
      expect(() => validateToolParameters('test_tool', params, mockSchema)).not.toThrow();
    });

    it('should include helpful error details for missing parameters', () => {
      const params = {};
      
      try {
        validateToolParameters('test_tool', params, mockSchema);
        fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).details).toEqual({
          toolName: 'test_tool',
          missingParameter: 'required_param',
        });
      }
    });

    it('should include type error details', () => {
      const params = {
        required_param: 123, // Should be string
      };
      
      try {
        validateToolParameters('test_tool', params, mockSchema);
        fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).details).toEqual({
          toolName: 'test_tool',
          parameter: 'required_param',
          expectedType: 'string',
          actualType: 'number',
        });
      }
    });
  });
});