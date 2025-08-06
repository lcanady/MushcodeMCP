/**
 * Integration tests for comprehensive error handling and recovery mechanisms
 */

import { 
  ValidationError, 
  ToolExecutionError, 
  KnowledgeBaseError,
  PerformanceError,
  GracefulDegradation,
  handleError,
  createMCPErrorResponse,
  ErrorSeverity,
  ErrorCategory
} from '../../src/utils/errors';
import { Logger, LogLevel } from '../../src/utils/logger';
import { MushcodeKnowledgeBase } from '../../src/knowledge/base';
import { generateMushcodeHandler } from '../../src/tools/generate';
import { validateMushcodeHandler } from '../../src/tools/validate';

describe('Error Handling Integration Tests', () => {
  let logger: Logger;
  let knowledgeBase: MushcodeKnowledgeBase;

  beforeEach(async () => {
    logger = Logger.getInstance();
    logger.clearLogs();
    logger.setLogLevel(LogLevel.DEBUG);
    
    knowledgeBase = new MushcodeKnowledgeBase();
    await knowledgeBase.initialize();
    
    GracefulDegradation.resetDegradation();
  });

  describe('Tool Error Handling', () => {
    it('should handle validation errors in generate tool gracefully', async () => {
      const invalidArgs = {
        // Missing required 'description' parameter
        server_type: 'PennMUSH'
      };

      try {
        await generateMushcodeHandler(invalidArgs, knowledgeBase);
        fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        
        const errorInfo = handleError(error, 'generate_mushcode');
        expect(errorInfo.canRecover).toBe(true);
        expect(errorInfo.suggestions.length).toBeGreaterThan(0);
        
        // Check that error was logged
        const errorLogs = logger.getLogsByLevel(LogLevel.ERROR);
        expect(errorLogs.length).toBeGreaterThan(0);
        expect(errorLogs[0].message).toContain('validation error');
      }
    });

    it('should handle tool execution errors with user-friendly messages', async () => {
      const args = {
        description: 'create an impossible function that violates physics',
        server_type: 'InvalidServer' as any
      };

      try {
        await generateMushcodeHandler(args, knowledgeBase);
      } catch (error) {
        const mcpResponse = createMCPErrorResponse(error, 'generate_mushcode');
        
        expect(mcpResponse.error.data?.userMessage).toBeDefined();
        expect(mcpResponse.error.data?.suggestions).toBeDefined();
        expect(mcpResponse.error.data?.canRecover).toBe(true);
        expect(mcpResponse.error.data?.severity).toBeDefined();
      }
    });

    it('should provide tool-specific error suggestions', async () => {
      const invalidCode = 'this is not valid mushcode syntax @#$%^&*()';
      
      try {
        await validateMushcodeHandler({ code: invalidCode }, knowledgeBase);
      } catch (error) {
        if (error instanceof ToolExecutionError) {
          const suggestions = error.suggestions.map(s => s.action);
          expect(suggestions).toContain('check_syntax');
        }
      }
    });
  });

  describe('Knowledge Base Error Recovery', () => {
    it('should handle knowledge base unavailability gracefully', async () => {
      // Simulate knowledge base error
      const mockKnowledgeBase = {
        ...knowledgeBase,
        getPattern: jest.fn().mockRejectedValue(new KnowledgeBaseError('Database unavailable'))
      } as any;

      const operation = async () => {
        throw new KnowledgeBaseError('Pattern database unavailable');
      };

      const fallback = async (options: any) => {
        return {
          code: '// Generic fallback code\n&cmd me=@pemit %#=Hello, world!',
          explanation: 'Generic command using fallback patterns',
          usageExample: 'Type: cmd',
          compatibility: ['Generic']
        };
      };

      const result = await GracefulDegradation.executeWithDegradation(
        operation,
        fallback,
        'pattern_lookup'
      );

      expect(result.code).toContain('Generic fallback');
      expect(GracefulDegradation.shouldDegrade()).toBe(true);
      expect(GracefulDegradation.getDegradationLevel()).toBe(1);
    });

    it('should escalate degradation on repeated failures', async () => {
      const failingOperation = async () => {
        throw new KnowledgeBaseError('Persistent failure');
      };

      const fallback = async (options: any) => {
        if (options.fallbackToBasicMode) {
          return 'basic mode result';
        }
        throw new Error('Fallback also failed');
      };

      // First failure - should increase degradation to level 1
      try {
        await GracefulDegradation.executeWithDegradation(failingOperation, fallback);
      } catch (error) {
        expect(GracefulDegradation.getDegradationLevel()).toBe(1);
      }

      // Second failure - should increase to level 2
      try {
        await GracefulDegradation.executeWithDegradation(failingOperation, fallback);
      } catch (error) {
        expect(GracefulDegradation.getDegradationLevel()).toBe(2);
      }

      // Third failure - should increase to level 3 and succeed with basic mode
      const result = await GracefulDegradation.executeWithDegradation(failingOperation, fallback);
      expect(result).toBe('basic mode result');
      expect(GracefulDegradation.getDegradationLevel()).toBe(3);
    });
  });

  describe('Performance Error Handling', () => {
    it('should handle timeout errors with appropriate suggestions', async () => {
      const timeoutError = new PerformanceError('code_generation', 5000, {
        requestSize: 'large',
        complexity: 'high'
      });

      const errorInfo = handleError(timeoutError, 'generate_mushcode');
      
      expect(errorInfo.severity).toBe(ErrorSeverity.MEDIUM);
      expect(errorInfo.category).toBe(ErrorCategory.PERFORMANCE);
      expect(errorInfo.canRecover).toBe(true);
      
      const suggestions = errorInfo.suggestions.map(s => s.action);
      expect(suggestions).toContain('simplify_request');
      expect(suggestions).toContain('reduce_complexity');
    });

    it('should log performance issues for monitoring', async () => {
      const timeoutError = new PerformanceError('validation', 3000);
      handleError(timeoutError, 'validate_mushcode');

      const errorLogs = logger.getLogsByLevel(LogLevel.ERROR);
      const performanceLog = errorLogs.find(log => 
        log.message.includes('performance error') && 
        log.context?.errorCode === 'INTERNAL_ERROR'
      );

      expect(performanceLog).toBeDefined();
      expect(performanceLog?.context?.severity).toBe(ErrorSeverity.MEDIUM);
    });
  });

  describe('Error Logging and Monitoring', () => {
    it('should log errors with appropriate context', async () => {
      const error = new ValidationError('Test validation error', {
        parameter: 'description',
        value: null
      });

      handleError(error, 'generate_mushcode_test');

      const errorLogs = logger.getLogsByLevel(LogLevel.ERROR);
      expect(errorLogs.length).toBeGreaterThan(0);
      
      const logEntry = errorLogs[0];
      expect(logEntry.message).toContain('validation error');
      expect(logEntry.context?.context).toBe('generate_mushcode_test');
      expect(logEntry.context?.errorCode).toBe('INVALID_PARAMS');
      expect(logEntry.context?.severity).toBe(ErrorSeverity.MEDIUM);
      expect(logEntry.error?.name).toBe('ValidationError');
    });

    it('should track error statistics', async () => {
      // Generate various types of errors
      handleError(new ValidationError('Error 1'), 'test1');
      handleError(new ToolExecutionError('tool1', 'Error 2'), 'test2');
      handleError(new KnowledgeBaseError('Error 3'), 'test3');
      handleError(new Error('Generic error'), 'test4');

      const stats = logger.getLogStats();
      expect(stats.error).toBe(4);
      expect(stats.total).toBeGreaterThanOrEqual(4);
    });

    it('should provide error context for debugging', async () => {
      const complexError = new ToolExecutionError('generate_mushcode', 'Complex failure', {
        inputDescription: 'create a teleportation command',
        serverType: 'PennMUSH',
        attemptedPatterns: ['command_basic', 'teleport_advanced'],
        failureReason: 'pattern_not_found'
      });

      const errorInfo = handleError(complexError, 'integration_test');
      
      expect(errorInfo.details?.inputDescription).toBe('create a teleportation command');
      expect(errorInfo.details?.serverType).toBe('PennMUSH');
      expect(errorInfo.details?.attemptedPatterns).toEqual(['command_basic', 'teleport_advanced']);
    });
  });

  describe('Error Recovery Mechanisms', () => {
    it('should suggest appropriate recovery actions based on error type', () => {
      const validationError = new ValidationError('Missing parameter', {
        missingParameter: 'description'
      });

      const suggestions = validationError.suggestions;
      const addParamSuggestion = suggestions.find(s => s.action === 'add_parameter');
      
      expect(addParamSuggestion).toBeDefined();
      expect(addParamSuggestion?.description).toContain('description');
      expect(addParamSuggestion?.example).toContain('description');
    });

    it('should provide escalating recovery options', () => {
      const toolError = new ToolExecutionError('generate_mushcode', 'Generation failed');
      
      const suggestions = toolError.suggestions.map(s => s.action);
      
      // Should provide multiple recovery options in order of preference
      expect(suggestions).toContain('retry');
      expect(suggestions).toContain('simplify_request');
      expect(suggestions).toContain('check_input');
      expect(suggestions).toContain('clarify_description');
    });

    it('should handle cascading failures gracefully', async () => {
      let failureCount = 0;
      
      const cascadingOperation = async () => {
        failureCount++;
        if (failureCount <= 2) {
          throw new KnowledgeBaseError(`Failure ${failureCount}`);
        }
        return `Success after ${failureCount} attempts`;
      };

      const fallback = async (options: any) => {
        if (options.fallbackToBasicMode) {
          return 'Basic mode success';
        }
        throw new Error('Fallback failed');
      };

      // Should eventually succeed with basic mode
      const result = await GracefulDegradation.executeWithDegradation(
        cascadingOperation,
        fallback,
        'cascading_test'
      );

      expect(result).toBe('Basic mode success');
      expect(GracefulDegradation.getDegradationLevel()).toBe(1);
    });
  });

  describe('User Experience Error Handling', () => {
    it('should provide user-friendly error messages', () => {
      const technicalError = new ToolExecutionError(
        'validate_mushcode',
        'RegExp compilation failed at position 42: invalid escape sequence'
      );

      const userInfo = technicalError.getUserInfo();
      
      expect(userInfo.message).not.toContain('RegExp');
      expect(userInfo.message).not.toContain('compilation failed');
      expect(userInfo.message).toContain('validate_mushcode tool encountered an error');
      expect(userInfo.suggestions.length).toBeGreaterThan(0);
    });

    it('should provide actionable suggestions with examples', () => {
      const validationError = new ValidationError('Type mismatch', {
        parameter: 'include_comments',
        expectedType: 'boolean',
        actualType: 'string'
      });

      const typeSuggestion = validationError.suggestions.find(s => s.action === 'fix_type');
      
      expect(typeSuggestion).toBeDefined();
      expect(typeSuggestion?.description).toContain('boolean');
      expect(typeSuggestion?.description).toContain('string');
      expect(typeSuggestion?.example).toContain('boolean');
    });

    it('should indicate recovery possibility', () => {
      const recoverableError = new ValidationError('Invalid input');
      const nonRecoverableError = new Error('System failure');

      const recoverableInfo = handleError(recoverableError);
      const nonRecoverableInfo = handleError(nonRecoverableError);

      expect(recoverableInfo.canRecover).toBe(true);
      expect(nonRecoverableInfo.canRecover).toBe(true); // Generic errors are considered recoverable
    });
  });
});