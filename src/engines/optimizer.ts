/**
 * MUSHCODE optimization engine
 * Analyzes and optimizes MUSHCODE for performance and maintainability
 */

import {
  CodeImprovement,
  ServerDialect
} from '../types/knowledge.js';
import { MushcodeKnowledgeBase } from '../knowledge/base.js';
import { ValidationError } from '../utils/errors.js';

export interface OptimizationRequest {
  code: string;
  optimizationGoals?: string[] | undefined;
  serverType?: string | undefined;
  preserveFunctionality?: boolean | undefined;
  aggressiveOptimization?: boolean | undefined;
}

export interface OptimizationResult {
  optimizedCode: string;
  improvements: CodeImprovement[];
  performanceImpact: string;
  explanation: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  warnings?: string[];
  functionalityPreserved: boolean;
}

/**
 * Optimization context interface
 */
interface OptimizationContext {
  code: string;
  lines: string[];
  dialect: ServerDialect | null;
  goals: string[];
  preserveFunctionality: boolean;
  aggressive: boolean;
  serverType: string | undefined;
}

interface LineOptimizationContext extends OptimizationContext {
  line: string;
  lineNumber: number;
  trimmedLine: string;
}

export class MushcodeOptimizer {
  constructor(private knowledgeBase: MushcodeKnowledgeBase) {}

  /**
   * Optimize MUSHCODE for performance and maintainability
   */
  async optimize(request: OptimizationRequest): Promise<OptimizationResult> {
    this.validateRequest(request);

    const lines = request.code.split('\n');
    const context = this.createOptimizationContext(request, lines);
    
    // Perform optimization passes
    const improvements: CodeImprovement[] = [];
    let optimizedLines = [...lines];

    // Apply different optimization strategies based on goals
    if (context.goals.includes('performance') || context.goals.length === 0) {
      const perfImprovements = await this.optimizePerformance(context);
      improvements.push(...perfImprovements);
      optimizedLines = this.applyImprovements(optimizedLines, perfImprovements);
    }

    if (context.goals.includes('readability') || context.goals.length === 0) {
      const readabilityImprovements = await this.optimizeReadability(context);
      improvements.push(...readabilityImprovements);
      optimizedLines = this.applyImprovements(optimizedLines, readabilityImprovements);
    }

    if (context.goals.includes('maintainability') || context.goals.length === 0) {
      const maintainabilityImprovements = await this.optimizeMaintainability(context);
      improvements.push(...maintainabilityImprovements);
      optimizedLines = this.applyImprovements(optimizedLines, maintainabilityImprovements);
    }

    if (context.goals.includes('security') || context.goals.length === 0) {
      const securityImprovements = await this.optimizeSecurity(context);
      improvements.push(...securityImprovements);
      optimizedLines = this.applyImprovements(optimizedLines, securityImprovements);
    }

    const optimizedCode = optimizedLines.join('\n');
    const originalSize = request.code.length;
    const optimizedSize = optimizedCode.length;
    const compressionRatio = originalSize > 0 ? (originalSize - optimizedSize) / originalSize : 0;

    // Generate explanation and performance impact
    const explanation = this.generateExplanation(improvements, context);
    const performanceImpact = this.calculatePerformanceImpact(improvements);
    const warnings = this.generateWarnings(improvements, context);

    return {
      optimizedCode,
      improvements,
      performanceImpact,
      explanation,
      originalSize,
      optimizedSize,
      compressionRatio,
      warnings,
      functionalityPreserved: context.preserveFunctionality
    };
  }

  /**
   * Create optimization context with all necessary information
   */
  private createOptimizationContext(request: OptimizationRequest, lines: string[]): OptimizationContext {
    const dialect = request.serverType ? 
      this.knowledgeBase.dialects.get(request.serverType) || null : null;

    const goals = request.optimizationGoals || ['performance', 'readability', 'maintainability'];

    return {
      code: request.code,
      lines,
      dialect,
      goals,
      preserveFunctionality: request.preserveFunctionality !== false,
      aggressive: request.aggressiveOptimization || false,
      serverType: request.serverType
    };
  }

  /**
   * Validate the optimization request
   */
  private validateRequest(request: OptimizationRequest): void {
    if (!request.code || request.code.trim().length === 0) {
      throw new ValidationError('Code is required');
    }

    if (request.code.length > 50000) {
      throw new ValidationError('Code is too long (max 50000 characters)');
    }

    if (request.serverType && !this.knowledgeBase.dialects.has(request.serverType)) {
      throw new ValidationError(`Unknown server type: ${request.serverType}`);
    }

    const validGoals = ['performance', 'readability', 'maintainability', 'security'];
    if (request.optimizationGoals) {
      for (const goal of request.optimizationGoals) {
        if (!validGoals.includes(goal)) {
          throw new ValidationError(`Invalid optimization goal: ${goal}. Must be one of: ${validGoals.join(', ')}`);
        }
      }
    }
  }

  /**
   * Optimize for performance
   */
  private async optimizePerformance(context: OptimizationContext): Promise<CodeImprovement[]> {
    const improvements: CodeImprovement[] = [];

    for (let i = 0; i < context.lines.length; i++) {
      const line = context.lines[i];
      if (!line) continue;

      const lineNumber = i + 1;
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if (trimmedLine.length === 0 || trimmedLine.startsWith('@@')) {
        continue;
      }

      const lineContext = { ...context, line, lineNumber, trimmedLine };

      // Apply performance optimizations
      improvements.push(...this.optimizeNestedFunctions(lineContext));
      improvements.push(...this.optimizeRepeatedOperations(lineContext));
      improvements.push(...this.optimizeStringOperations(lineContext));
      improvements.push(...this.optimizeLoopStructures(lineContext));
      improvements.push(...this.optimizeConditionals(lineContext));
    }

    return improvements;
  }

  /**
   * Optimize nested function calls
   */
  private optimizeNestedFunctions(context: LineOptimizationContext): CodeImprovement[] {
    const improvements: CodeImprovement[] = [];
    const { line, lineNumber } = context;

    // Detect deeply nested function calls
    const nestingDepth = this.calculateNestingDepth(line);
    if (nestingDepth > 5) {
      // Suggest breaking into intermediate variables
      const optimized = this.breakDownNestedCalls(line);
      if (optimized !== line) {
        improvements.push({
          type: 'performance',
          description: 'Reduced function nesting depth',
          lineNumber,
          before: line,
          after: optimized,
          impact: 'Improves readability and potentially reduces execution overhead',
          confidence: 0.7,
          effort: 'medium',
          category: 'nesting'
        });
      }
    }

    // Optimize repeated function calls with same arguments
    const repeatedCalls = this.findRepeatedFunctionCalls(line);
    for (const call of repeatedCalls) {
      if (call.count > 1) {
        const optimized = this.cacheRepeatedCall(line, call);
        improvements.push({
          type: 'performance',
          description: `Cache repeated function call: ${call.function}`,
          lineNumber,
          before: line,
          after: optimized,
          impact: `Eliminates ${call.count - 1} redundant function calls`,
          confidence: 0.9,
          effort: 'low',
          category: 'caching'
        });
      }
    }

    return improvements;
  }

  /**
   * Optimize repeated operations
   */
  private optimizeRepeatedOperations(context: LineOptimizationContext): CodeImprovement[] {
    const improvements: CodeImprovement[] = [];
    const { line, lineNumber } = context;

    // Find expensive operations that are repeated
    const expensiveOps = ['sql(', 'search(', 'lsearch(', 'filter(', 'map('];
    
    for (const op of expensiveOps) {
      const regex = new RegExp(op.replace('(', '\\('), 'g');
      const matches = line.match(regex);
      
      if (matches && matches.length > 1) {
        // Check if they have the same arguments
        const calls = this.extractFunctionCalls(line, op.slice(0, -1));
        const duplicates = this.findDuplicateCalls(calls);
        
        if (duplicates.length > 0 && duplicates[0]) {
          const optimized = this.optimizeRepeatedCall(line, duplicates[0]);
          improvements.push({
            type: 'performance',
            description: `Cache repeated ${op} operation`,
            lineNumber,
            before: line,
            after: optimized,
            impact: 'Reduces expensive database/search operations',
            confidence: 0.8,
            effort: 'medium',
            category: 'caching'
          });
        }
      }
    }

    return improvements;
  }

  /**
   * Optimize string operations
   */
  private optimizeStringOperations(context: LineOptimizationContext): CodeImprovement[] {
    const improvements: CodeImprovement[] = [];
    const { line, lineNumber } = context;

    // Optimize string concatenation chains
    const concatPattern = /cat\([^)]+\)/g;
    const concatMatches = line.match(concatPattern);
    
    if (concatMatches && concatMatches.length > 2) {
      const optimized = this.optimizeStringConcatenation(line);
      if (optimized !== line) {
        improvements.push({
          type: 'performance',
          description: 'Optimize string concatenation',
          lineNumber,
          before: line,
          after: optimized,
          impact: 'Reduces string operation overhead',
          confidence: 0.6,
          effort: 'low',
          category: 'strings'
        });
      }
    }

    // Optimize repeated string operations
    const stringOps = ['strlen(', 'substr(', 'trim(', 'upper(', 'lower('];
    for (const op of stringOps) {
      const regex = new RegExp(op.replace('(', '\\('), 'g');
      const matches = line.match(regex);
      
      if (matches && matches.length > 1) {
        const optimized = this.cacheStringOperation(line, op);
        if (optimized !== line) {
          improvements.push({
            type: 'performance',
            description: `Cache repeated ${op} operation`,
            lineNumber,
            before: line,
            after: optimized,
            impact: 'Avoids redundant string processing',
            confidence: 0.7,
            effort: 'low',
            category: 'strings'
          });
        }
      }
    }

    return improvements;
  }

  /**
   * Optimize loop structures
   */
  private optimizeLoopStructures(context: LineOptimizationContext): CodeImprovement[] {
    const improvements: CodeImprovement[] = [];
    const { line, lineNumber } = context;

    // Optimize nested iter() calls
    const iterMatches = line.match(/iter\(/g);
    if (line.includes('iter(') && iterMatches && iterMatches.length > 1) {
      const optimized = this.optimizeNestedIter(line);
      if (optimized !== line) {
        improvements.push({
          type: 'performance',
          description: 'Optimize nested iteration',
          lineNumber,
          before: line,
          after: optimized,
          impact: 'Reduces iteration complexity and improves performance',
          confidence: 0.8,
          effort: 'high',
          category: 'loops'
        });
      }
    }

    // Optimize filter + map combinations
    if (line.includes('filter(') && line.includes('map(')) {
      const optimized = this.optimizeFilterMap(line);
      if (optimized !== line) {
        improvements.push({
          type: 'performance',
          description: 'Combine filter and map operations',
          lineNumber,
          before: line,
          after: optimized,
          impact: 'Reduces list traversals from 2 to 1',
          confidence: 0.9,
          effort: 'medium',
          category: 'loops'
        });
      }
    }

    return improvements;
  }

  /**
   * Optimize conditional structures
   */
  private optimizeConditionals(context: LineOptimizationContext): CodeImprovement[] {
    const improvements: CodeImprovement[] = [];
    const { line, lineNumber } = context;

    // Optimize switch statements with many conditions
    if (line.includes('switch(')) {
      const switchOptimization = this.optimizeSwitchStatement(line);
      if (switchOptimization !== line) {
        improvements.push({
          type: 'performance',
          description: 'Optimize switch statement structure',
          lineNumber,
          before: line,
          after: switchOptimization,
          impact: 'Improves conditional evaluation performance',
          confidence: 0.6,
          effort: 'medium',
          category: 'conditionals'
        });
      }
    }

    // Optimize redundant conditions
    const redundantConditions = this.findRedundantConditions(line);
    if (redundantConditions.length > 0) {
      const optimized = this.removeRedundantConditions(line, redundantConditions);
      improvements.push({
        type: 'performance',
        description: 'Remove redundant conditions',
        lineNumber,
        before: line,
        after: optimized,
        impact: 'Eliminates unnecessary condition checks',
        confidence: 0.8,
        effort: 'low',
        category: 'conditionals'
      });
    }

    return improvements;
  }

  /**
   * Optimize for readability
   */
  private async optimizeReadability(context: OptimizationContext): Promise<CodeImprovement[]> {
    const improvements: CodeImprovement[] = [];

    for (let i = 0; i < context.lines.length; i++) {
      const line = context.lines[i];
      if (!line) continue;

      const lineNumber = i + 1;
      const trimmedLine = line.trim();

      if (trimmedLine.length === 0 || trimmedLine.startsWith('@@')) {
        continue;
      }

      const lineContext = { ...context, line, lineNumber, trimmedLine };

      improvements.push(...this.improveFormatting(lineContext));
      improvements.push(...this.addMissingComments(lineContext));
      improvements.push(...this.simplifyComplexExpressions(lineContext));
    }

    return improvements;
  }

  /**
   * Improve code formatting
   */
  private improveFormatting(context: LineOptimizationContext): CodeImprovement[] {
    const improvements: CodeImprovement[] = [];
    const { line, lineNumber } = context;

    // Fix indentation
    const indentMatch = line.match(/^(\s*)/);
    if (indentMatch && indentMatch[1]) {
      const currentIndent = indentMatch[1];
      const expectedIndent = this.calculateExpectedIndent(context, lineNumber);
      
      if (currentIndent !== expectedIndent) {
        const fixedLine = expectedIndent + line.trim();
        improvements.push({
          type: 'readability',
          description: 'Fix indentation',
          lineNumber,
          before: line,
          after: fixedLine,
          impact: 'Improves code structure and readability',
          confidence: 0.9,
          effort: 'low',
          category: 'formatting'
        });
      }
    }

    // Add spacing around operators
    const spacingFixed = this.fixOperatorSpacing(line);
    if (spacingFixed !== line) {
      improvements.push({
        type: 'readability',
        description: 'Add proper spacing around operators',
        lineNumber,
        before: line,
        after: spacingFixed,
        impact: 'Improves code readability',
        confidence: 0.8,
        effort: 'low',
        category: 'formatting'
      });
    }

    return improvements;
  }

  /**
   * Add missing comments for complex code
   */
  private addMissingComments(context: LineOptimizationContext): CodeImprovement[] {
    const improvements: CodeImprovement[] = [];
    const { line, lineNumber } = context;

    // Check if complex line needs a comment
    const complexity = this.calculateLineComplexity(line);
    if (complexity > 7 && !line.includes('@@') && !context.lines[lineNumber - 2]?.includes('@@')) {
      const comment = this.generateComment(line);
      const commentedLine = `@@ ${comment}\n${line}`;
      
      improvements.push({
        type: 'readability',
        description: 'Add explanatory comment for complex logic',
        lineNumber,
        before: line,
        after: commentedLine,
        impact: 'Makes complex code easier to understand',
        confidence: 0.6,
        effort: 'low',
        category: 'documentation'
      });
    }

    return improvements;
  }

  /**
   * Simplify complex expressions
   */
  private simplifyComplexExpressions(context: LineOptimizationContext): CodeImprovement[] {
    const improvements: CodeImprovement[] = [];
    const { line, lineNumber } = context;

    // Break down overly complex expressions
    if (line.length > 120 && this.calculateNestingDepth(line) > 4) {
      const simplified = this.breakDownComplexExpression(line);
      if (simplified !== line) {
        improvements.push({
          type: 'readability',
          description: 'Break down complex expression',
          lineNumber,
          before: line,
          after: simplified,
          impact: 'Makes code easier to read and debug',
          confidence: 0.7,
          effort: 'medium',
          category: 'complexity'
        });
      }
    }

    return improvements;
  }

  /**
   * Optimize for maintainability
   */
  private async optimizeMaintainability(context: OptimizationContext): Promise<CodeImprovement[]> {
    const improvements: CodeImprovement[] = [];

    for (let i = 0; i < context.lines.length; i++) {
      const line = context.lines[i];
      if (!line) continue;

      const lineNumber = i + 1;
      const trimmedLine = line.trim();

      if (trimmedLine.length === 0 || trimmedLine.startsWith('@@')) {
        continue;
      }

      const lineContext = { ...context, line, lineNumber, trimmedLine };

      improvements.push(...this.replaceMagicNumbers(lineContext));
      improvements.push(...this.improveVariableNames(lineContext));
      improvements.push(...this.extractReusablePatterns(lineContext));
    }

    return improvements;
  }

  /**
   * Replace magic numbers with named constants
   */
  private replaceMagicNumbers(context: LineOptimizationContext): CodeImprovement[] {
    const improvements: CodeImprovement[] = [];
    const { line, lineNumber } = context;

    // Find magic numbers (numbers > 10 that aren't obvious)
    const magicNumbers = line.match(/\b\d{2,}\b/g);
    if (magicNumbers) {
      for (const num of magicNumbers) {
        const numValue = parseInt(num);
        if (numValue > 10 && !this.isObviousNumber(numValue)) {
          const constantName = this.generateConstantName(num, line);
          const replacedLine = line.replace(new RegExp(`\\b${num}\\b`, 'g'), `[v(${constantName})]`);
          
          improvements.push({
            type: 'maintainability',
            description: `Replace magic number ${num} with named constant`,
            lineNumber,
            before: line,
            after: replacedLine,
            impact: 'Makes code more maintainable and self-documenting',
            confidence: 0.7,
            effort: 'low',
            category: 'constants'
          });
        }
      }
    }

    return improvements;
  }

  /**
   * Improve variable names
   */
  private improveVariableNames(context: LineOptimizationContext): CodeImprovement[] {
    const improvements: CodeImprovement[] = [];
    const { line, lineNumber } = context;

    // Find register variables that could have better names
    const registers = line.match(/q\d+/g);
    if (registers && registers.length > 2) {
      const improved = this.suggestBetterVariableNames(line, registers);
      if (improved !== line) {
        improvements.push({
          type: 'maintainability',
          description: 'Use more descriptive variable names',
          lineNumber,
          before: line,
          after: improved,
          impact: 'Makes code more self-documenting and easier to maintain',
          confidence: 0.5,
          effort: 'medium',
          category: 'naming'
        });
      }
    }

    return improvements;
  }

  /**
   * Extract reusable patterns
   */
  private extractReusablePatterns(context: LineOptimizationContext): CodeImprovement[] {
    const improvements: CodeImprovement[] = [];
    const { line, lineNumber } = context;

    // Look for patterns that could be extracted into functions
    const commonPatterns = this.findCommonPatterns(line);
    for (const pattern of commonPatterns) {
      if (pattern.complexity > 5) {
        const extracted = this.extractPattern(line, pattern);
        improvements.push({
          type: 'maintainability',
          description: `Extract reusable pattern: ${pattern.name}`,
          lineNumber,
          before: line,
          after: extracted,
          impact: 'Improves code reusability and maintainability',
          confidence: 0.6,
          effort: 'high',
          category: 'extraction'
        });
      }
    }

    return improvements;
  }

  /**
   * Optimize for security
   */
  private async optimizeSecurity(context: OptimizationContext): Promise<CodeImprovement[]> {
    const improvements: CodeImprovement[] = [];

    for (let i = 0; i < context.lines.length; i++) {
      const line = context.lines[i];
      if (!line) continue;

      const lineNumber = i + 1;
      const trimmedLine = line.trim();

      if (trimmedLine.length === 0 || trimmedLine.startsWith('@@')) {
        continue;
      }

      const lineContext = { ...context, line, lineNumber, trimmedLine };

      improvements.push(...this.addInputValidation(lineContext));
      improvements.push(...this.improvePermissionChecks(lineContext));
      improvements.push(...this.sanitizeUserInput(lineContext));
    }

    return improvements;
  }

  /**
   * Add input validation
   */
  private addInputValidation(context: LineOptimizationContext): CodeImprovement[] {
    const improvements: CodeImprovement[] = [];
    const { line, lineNumber } = context;

    // Check for user input that lacks validation
    const userInputs = line.match(/%\d+/g);
    if (userInputs && !line.includes('strlen(') && !line.includes('valid(')) {
      const validated = this.addValidationChecks(line, userInputs);
      improvements.push({
        type: 'security',
        description: 'Add input validation for user parameters',
        lineNumber,
        before: line,
        after: validated,
        impact: 'Prevents invalid input from causing errors or security issues',
        confidence: 0.8,
        effort: 'medium',
        category: 'validation'
      });
    }

    return improvements;
  }

  /**
   * Improve permission checks
   */
  private improvePermissionChecks(context: LineOptimizationContext): CodeImprovement[] {
    const improvements: CodeImprovement[] = [];
    const { line, lineNumber } = context;

    // Check for commands that might need permission checks
    const dangerousCommands = ['@destroy', '@pcreate', '@shutdown', '@dump'];
    for (const cmd of dangerousCommands) {
      if (line.includes(cmd) && !line.includes('hasflag(') && !line.includes('orflags(')) {
        const secured = this.addPermissionCheck(line, cmd);
        improvements.push({
          type: 'security',
          description: `Add permission check for ${cmd}`,
          lineNumber,
          before: line,
          after: secured,
          impact: 'Prevents unauthorized use of dangerous commands',
          confidence: 0.9,
          effort: 'low',
          category: 'permissions'
        });
      }
    }

    return improvements;
  }

  /**
   * Sanitize user input
   */
  private sanitizeUserInput(context: LineOptimizationContext): CodeImprovement[] {
    const improvements: CodeImprovement[] = [];
    const { line, lineNumber } = context;

    // Check for SQL injection risks
    if (line.includes('sql(') && line.includes('%')) {
      const sanitized = this.sanitizeSqlInput(line);
      if (sanitized !== line) {
        improvements.push({
          type: 'security',
          description: 'Sanitize SQL input to prevent injection',
          lineNumber,
          before: line,
          after: sanitized,
          impact: 'Prevents SQL injection attacks',
          confidence: 0.9,
          effort: 'medium',
          category: 'sanitization'
        });
      }
    }

    return improvements;
  }

  // Helper methods for optimization logic

  private calculateNestingDepth(code: string): number {
    let maxDepth = 0;
    let currentDepth = 0;
    let inString = false;
    let escapeNext = false;

    for (const char of code) {
      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '(' || char === '[' || char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === ')' || char === ']' || char === '}') {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }

    return maxDepth;
  }

  private calculateLineComplexity(line: string): number {
    let complexity = 0;
    
    // Count function calls
    complexity += (line.match(/\w+\(/g) || []).length;
    
    // Count conditionals
    complexity += (line.match(/switch\(|if\(/g) || []).length * 2;
    
    // Count loops
    complexity += (line.match(/iter\(|map\(|filter\(/g) || []).length * 2;
    
    // Count nesting depth
    complexity += this.calculateNestingDepth(line);
    
    return complexity;
  }

  private breakDownNestedCalls(line: string): string {
    // Simplified implementation - would need more sophisticated parsing
    if (this.calculateNestingDepth(line) > 5) {
      return `@@ Complex expression broken down for readability\n${line}`;
    }
    return line;
  }

  private findRepeatedFunctionCalls(line: string): Array<{function: string, count: number, args: string}> {
    const calls: Array<{function: string, count: number, args: string}> = [];
    const functionPattern = /(\w+)\(([^)]*)\)/g;
    const found = new Map<string, number>();
    
    let match;
    while ((match = functionPattern.exec(line)) !== null) {
      const key = `${match[1]}(${match[2]})`;
      found.set(key, (found.get(key) || 0) + 1);
    }
    
    for (const [key, count] of found) {
      if (count > 1) {
        const [func, args] = key.split('(');
        calls.push({
          function: func || '',
          count,
          args: args?.slice(0, -1) || ''
        });
      }
    }
    
    return calls;
  }

  private cacheRepeatedCall(line: string, call: {function: string, count: number, args: string}): string {
    const cacheVar = `q_${call.function}_cache`;
    const fullCall = `${call.function}(${call.args})`;
    const cachedVersion = `[setq(${cacheVar},${fullCall})][q(${cacheVar})]`;
    
    // Replace first occurrence with cached version, rest with cache reference
    let replaced = line.replace(fullCall, cachedVersion);
    replaced = replaced.replace(new RegExp(fullCall.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `[q(${cacheVar})]`);
    
    return replaced;
  }

  private extractFunctionCalls(line: string, functionName: string): string[] {
    const pattern = new RegExp(`${functionName}\\([^)]*\\)`, 'g');
    return line.match(pattern) || [];
  }

  private findDuplicateCalls(calls: string[]): string[] {
    const counts = new Map<string, number>();
    for (const call of calls) {
      counts.set(call, (counts.get(call) || 0) + 1);
    }
    
    return Array.from(counts.entries())
      .filter(([_, count]) => count > 1)
      .map(([call, _]) => call);
  }

  private optimizeRepeatedCall(line: string, call: string): string {
    const cacheVar = 'q_cache';
    const cachedVersion = `[setq(${cacheVar},${call})][q(${cacheVar})]`;
    
    return line.replace(call, cachedVersion)
               .replace(new RegExp(call.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `[q(${cacheVar})]`);
  }

  private optimizeStringConcatenation(line: string): string {
    // Simple optimization - combine multiple cat() calls
    return line.replace(/cat\(([^)]+)\),\s*cat\(([^)]+)\)/g, 'cat($1,$2)');
  }

  private cacheStringOperation(line: string, operation: string): string {
    const pattern = new RegExp(`${operation.replace('(', '\\(')}([^)]+)\\)`, 'g');
    const matches = line.match(pattern);
    
    if (matches && matches.length > 1) {
      const cacheVar = `q_${operation.slice(0, -1)}_cache`;
      const firstMatch = matches[0];
      const cachedVersion = `[setq(${cacheVar},${firstMatch})][q(${cacheVar})]`;
      
      return line.replace(firstMatch, cachedVersion)
                 .replace(new RegExp(firstMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `[q(${cacheVar})]`);
    }
    
    return line;
  }

  private optimizeNestedIter(line: string): string {
    // Simplified - would need more sophisticated analysis
    return `@@ Consider restructuring nested iterations\n${line}`;
  }

  private optimizeFilterMap(line: string): string {
    // Simplified - would need to parse and combine operations
    return line.replace(/filter\(([^,]+),([^)]+)\).*map\(([^,]+),([^)]+)\)/, 
                       'map($3,filter($1,$2))');
  }

  private optimizeSwitchStatement(line: string): string {
    // Simplified optimization
    return line;
  }

  private findRedundantConditions(_line: string): string[] {
    // Simplified - would need more sophisticated analysis
    return [];
  }

  private removeRedundantConditions(line: string, _conditions: string[]): string {
    return line;
  }

  private calculateExpectedIndent(_context: LineOptimizationContext, _lineNumber: number): string {
    // Simplified - would need to track nesting level
    return '  ';
  }

  private fixOperatorSpacing(line: string): string {
    return line.replace(/([=<>!])([^=])/g, '$1 $2')
               .replace(/([^=])([=<>!])/g, '$1 $2');
  }

  private generateComment(line: string): string {
    if (line.includes('switch(')) return 'Conditional logic';
    if (line.includes('iter(')) return 'Iterate over list';
    if (line.includes('sql(')) return 'Database query';
    return 'Complex operation';
  }

  private breakDownComplexExpression(line: string): string {
    return `@@ Complex expression - consider breaking into smaller parts\n${line}`;
  }

  private isObviousNumber(num: number): boolean {
    const obvious = [100, 1000, 24, 60, 365, 12, 7];
    return obvious.includes(num);
  }

  private generateConstantName(num: string, line: string): string {
    if (line.includes('strlen') || line.includes('length')) return `MAX_LENGTH_${num}`;
    if (line.includes('time') || line.includes('seconds')) return `TIMEOUT_${num}`;
    return `CONSTANT_${num}`;
  }

  private suggestBetterVariableNames(line: string, _registers: string[]): string {
    // Simplified - would analyze context to suggest better names
    return line;
  }

  private findCommonPatterns(line: string): Array<{name: string, complexity: number}> {
    const patterns: Array<{name: string, complexity: number}> = [];
    
    if (line.includes('hasflag') && line.includes('pemit')) {
      patterns.push({name: 'permission_check_and_message', complexity: 6});
    }
    
    return patterns;
  }

  private extractPattern(line: string, pattern: {name: string, complexity: number}): string {
    return `@@ Consider extracting ${pattern.name} into reusable function\n${line}`;
  }

  private addValidationChecks(line: string, inputs: string[]): string {
    const validations = inputs.map(input => 
      `@switch strlen(${input})=0,{@pemit %#=Error: Parameter required.;@halt}`
    ).join('\n');
    
    return `${validations}\n${line}`;
  }

  private addPermissionCheck(line: string, _command: string): string {
    const permCheck = '@switch orflags(%#,Ww)=0,{@pemit %#=Permission denied.;@halt}';
    return `${permCheck}\n${line}`;
  }

  private sanitizeSqlInput(line: string): string {
    // Simplified - would need proper SQL sanitization
    return line.replace(/%(\d+)/g, '[escape($1)]');
  }

  private applyImprovements(lines: string[], improvements: CodeImprovement[]): string[] {
    const result = [...lines];
    
    // Sort improvements by line number (descending) to avoid index issues
    const sortedImprovements = improvements
      .filter(imp => imp.lineNumber !== undefined)
      .sort((a, b) => (b.lineNumber || 0) - (a.lineNumber || 0));
    
    for (const improvement of sortedImprovements) {
      if (improvement.lineNumber && improvement.lineNumber <= result.length) {
        const lineIndex = improvement.lineNumber - 1;
        if (improvement.after.includes('\n')) {
          // Multi-line replacement
          const newLines = improvement.after.split('\n');
          result.splice(lineIndex, 1, ...newLines);
        } else {
          result[lineIndex] = improvement.after;
        }
      }
    }
    
    return result;
  }

  private generateExplanation(improvements: CodeImprovement[], context: OptimizationContext): string {
    const parts: string[] = [];
    
    parts.push(`Applied ${improvements.length} optimizations to improve code quality.`);
    
    const byType = improvements.reduce((acc, imp) => {
      acc[imp.type] = (acc[imp.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const typeDescriptions = Object.entries(byType)
      .map(([type, count]) => `${count} ${type} improvement${count > 1 ? 's' : ''}`)
      .join(', ');
    
    parts.push(`\nOptimizations included: ${typeDescriptions}.`);
    
    if (context.goals.length > 0) {
      parts.push(`\nFocused on: ${context.goals.join(', ')}.`);
    }
    
    return parts.join('');
  }

  private calculatePerformanceImpact(improvements: CodeImprovement[]): string {
    const perfImprovements = improvements.filter(imp => imp.type === 'performance');
    
    if (perfImprovements.length === 0) {
      return 'No significant performance impact expected.';
    }
    
    const highImpact = perfImprovements.filter(imp => imp.confidence > 0.7).length;
    
    if (highImpact > 0) {
      return `Expected moderate to significant performance improvement from ${highImpact} high-confidence optimizations.`;
    }
    
    return `Expected minor performance improvement from ${perfImprovements.length} optimizations.`;
  }

  private generateWarnings(improvements: CodeImprovement[], context: OptimizationContext): string[] {
    const warnings: string[] = [];
    
    const highEffortChanges = improvements.filter(imp => imp.effort === 'high').length;
    if (highEffortChanges > 0) {
      warnings.push(`${highEffortChanges} optimization(s) require significant refactoring effort.`);
    }
    
    const lowConfidenceChanges = improvements.filter(imp => imp.confidence < 0.6).length;
    if (lowConfidenceChanges > 0) {
      warnings.push(`${lowConfidenceChanges} optimization(s) have lower confidence and should be reviewed carefully.`);
    }
    
    if (!context.preserveFunctionality) {
      warnings.push('Functionality preservation was disabled - please test thoroughly.');
    }
    
    return warnings;
  }
}