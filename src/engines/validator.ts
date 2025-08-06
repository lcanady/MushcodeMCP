/**
 * MUSHCODE validation engine
 * Validates syntax, security, and best practices
 */

import {
  SyntaxError,
  SecurityWarning,
  CodeImprovement,
  ServerDialect
} from '../types/knowledge.js';
import { MushcodeKnowledgeBase } from '../knowledge/base.js';
import { ValidationError } from '../utils/errors.js';

export interface ValidationRequest {
  code: string;
  serverType?: string | undefined;
  strictMode?: boolean | undefined;
  checkSecurity?: boolean | undefined;
  checkBestPractices?: boolean | undefined;
}

export interface ValidationResult {
  isValid: boolean;
  syntaxErrors: SyntaxError[];
  securityWarnings: SecurityWarning[];
  bestPracticeSuggestions: CodeImprovement[];
  compatibilityNotes: string[];
  totalLines: number;
  complexityScore: number;
  securityScore: number;
  maintainabilityScore: number;
}

/**
 * Validation context interface
 */
interface ValidationContext {
  code: string;
  lines: string[];
  dialect: ServerDialect | null;
  strictMode: boolean;
  checkSecurity: boolean;
  checkBestPractices: boolean;
  serverType: string | undefined;
}

interface LineValidationContext extends ValidationContext {
  line: string;
  lineNumber: number;
  trimmedLine: string;
}

export class MushcodeValidator {
  constructor(private knowledgeBase: MushcodeKnowledgeBase) {}

  /**
   * Validate MUSHCODE for syntax, security, and best practices
   */
  async validate(request: ValidationRequest): Promise<ValidationResult> {
    this.validateRequest(request);

    const lines = request.code.split('\n');
    const context = this.createValidationContext(request, lines);
    
    // Perform all validation checks
    const syntaxErrors = await this.validateSyntax(context);
    const securityWarnings = request.checkSecurity ? 
      await this.validateSecurity(context) : [];
    const bestPracticeSuggestions = request.checkBestPractices ? 
      await this.validateBestPractices(context) : [];
    const compatibilityNotes = context.dialect ? 
      this.checkCompatibility(context) : [];

    // Calculate quality scores
    const scores = this.calculateQualityScores(context, {
      syntaxErrors,
      securityWarnings,
      bestPracticeSuggestions
    });

    const isValid = syntaxErrors.filter(e => e.severity === 'error').length === 0;

    return {
      isValid,
      syntaxErrors,
      securityWarnings,
      bestPracticeSuggestions,
      compatibilityNotes,
      totalLines: lines.length,
      ...scores
    };
  }

  /**
   * Create validation context with all necessary information
   */
  private createValidationContext(request: ValidationRequest, lines: string[]): ValidationContext {
    const dialect = request.serverType ? 
      this.knowledgeBase.dialects.get(request.serverType) || null : null;

    return {
      code: request.code,
      lines,
      dialect,
      strictMode: request.strictMode || false,
      checkSecurity: request.checkSecurity !== false,
      checkBestPractices: request.checkBestPractices !== false,
      serverType: request.serverType
    };
  }

  /**
   * Validate the validation request
   */
  private validateRequest(request: ValidationRequest): void {
    if (!request.code || request.code.trim().length === 0) {
      throw new ValidationError('Code is required');
    }

    if (request.code.length > 50000) {
      throw new ValidationError('Code is too long (max 50000 characters)');
    }

    if (request.serverType && !this.knowledgeBase.dialects.has(request.serverType)) {
      throw new ValidationError(`Unknown server type: ${request.serverType}`);
    }
  }

  /**
   * Validate MUSHCODE syntax
   */
  private async validateSyntax(context: ValidationContext): Promise<SyntaxError[]> {
    const errors: SyntaxError[] = [];
    const validators = [
      this.validateBasicSyntax,
      this.validateBracketMatching,
      this.validateFunctionSyntax,
      this.validateAttributeSyntax,
      this.validateCommandSyntax,
      this.validateStringLiterals,
      this.validateRegexPatterns,
      this.validateVariableReferences
    ];

    // Run line-by-line validation
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

      // Run all line validators
      for (const validator of validators) {
        errors.push(...validator.call(this, lineContext));
      }
    }

    // Check for global syntax issues
    errors.push(...this.validateGlobalSyntax(context));

    return errors;
  }



  /**
   * Validate basic syntax rules
   */
  private validateBasicSyntax(context: LineValidationContext): SyntaxError[] {
    const errors: SyntaxError[] = [];
    const { line, lineNumber, strictMode } = context;

    // Check for invalid characters
    errors.push(...this.checkInvalidCharacters(line, lineNumber));
    
    // Check for excessive line length in strict mode
    if (strictMode && line.length > 200) {
      errors.push({
        line: lineNumber,
        column: 201,
        message: 'Line too long (>200 characters)',
        severity: 'warning',
        code: 'LINE_TOO_LONG',
        suggestion: 'Break long lines for better readability',
        fixable: false
      });
    }

    // Check for trailing whitespace
    if (line.endsWith(' ') || line.endsWith('\t')) {
      errors.push({
        line: lineNumber,
        column: line.length,
        message: 'Trailing whitespace',
        severity: 'info',
        code: 'TRAILING_WHITESPACE',
        suggestion: 'Remove trailing whitespace',
        fixable: true
      });
    }

    return errors;
  }

  /**
   * Check for invalid characters
   */
  private checkInvalidCharacters(line: string, lineNumber: number): SyntaxError[] {
    const errors: SyntaxError[] = [];
    // Allow Unicode characters - only flag actual control characters
    const invalidChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
    let match;

    while ((match = invalidChars.exec(line)) !== null) {
      errors.push({
        line: lineNumber,
        column: match.index + 1,
        message: `Invalid control character: ${match[0].charCodeAt(0).toString(16)}`,
        severity: 'error',
        code: 'INVALID_CHAR',
        suggestion: 'Remove or replace invalid characters',
        fixable: true
      });
    }

    return errors;
  }

  /**
   * Validate bracket and parentheses matching
   */
  private validateBracketMatching(context: LineValidationContext): SyntaxError[] {
    const errors: SyntaxError[] = [];
    const { line, lineNumber } = context;
    const stack: { char: string; pos: number }[] = [];
    const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' };

    // Track brackets while respecting string literals
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
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

      // Skip bracket checking inside strings
      if (inString) continue;
      
      if (char && Object.keys(pairs).includes(char)) {
        stack.push({ char, pos: i });
      } else if (char && Object.values(pairs).includes(char)) {
        if (stack.length === 0) {
          errors.push({
            line: lineNumber,
            column: i + 1,
            message: `Unmatched closing ${char}`,
            severity: 'error',
            code: 'UNMATCHED_BRACKET',
            suggestion: `Add opening ${Object.keys(pairs).find(k => pairs[k] === char)}`,
            fixable: true
          });
        } else {
          const last = stack.pop();
          if (last && pairs[last.char] !== char) {
            errors.push({
              line: lineNumber,
              column: i + 1,
              message: `Mismatched brackets: expected ${pairs[last.char]}, got ${char}`,
              severity: 'error',
              code: 'MISMATCHED_BRACKET',
              suggestion: `Change ${char} to ${pairs[last.char]}`,
              fixable: true
            });
          }
        }
      }
    }

    // Check for unclosed brackets
    for (const item of stack) {
      errors.push({
        line: lineNumber,
        column: item.pos + 1,
        message: `Unclosed ${item.char}`,
        severity: 'error',
        code: 'UNCLOSED_BRACKET',
        suggestion: `Add closing ${pairs[item.char]}`,
        fixable: true
      });
    }

    return errors;
  }

  /**
   * Validate function syntax
   */
  private validateFunctionSyntax(context: LineValidationContext): SyntaxError[] {
    const errors: SyntaxError[] = [];
    const { line, lineNumber, dialect } = context;

    // Match function calls: functionname(args)
    const functionPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
    let match;

    while ((match = functionPattern.exec(line)) !== null) {
      const functionName = match[1];
      if (!functionName) continue;

      // Check if function exists in dialect
      if (dialect) {
        const func = dialect.functionLibrary.find(f => 
          f.name.toLowerCase() === functionName.toLowerCase()
        );
        
        if (!func) {
          errors.push({
            line: lineNumber,
            column: match.index + 1,
            message: `Unknown function: ${functionName}`,
            severity: 'warning',
            code: 'UNKNOWN_FUNCTION',
            suggestion: 'Check function name spelling or server compatibility',
            fixable: false
          });
        } else if (func.deprecated) {
          errors.push({
            line: lineNumber,
            column: match.index + 1,
            message: `Deprecated function: ${functionName}`,
            severity: 'warning',
            code: 'DEPRECATED_FUNCTION',
            suggestion: func.alternativeTo ? 
              `Use ${func.alternativeTo} instead` : 
              'Consider using alternative function',
            fixable: false
          });
        }
      }

      // Check for common function syntax errors
      const afterParen = line.substring(match.index + match[0].length);
      if (afterParen.startsWith(' ')) {
        errors.push({
          line: lineNumber,
          column: match.index + match[0].length + 1,
          message: 'Unexpected space after opening parenthesis',
          severity: 'warning',
          code: 'SPACE_AFTER_PAREN',
          suggestion: 'Remove space after opening parenthesis',
          fixable: true
        });
      }
    }

    return errors;
  }

  /**
   * Validate attribute syntax
   */
  private validateAttributeSyntax(context: LineValidationContext): SyntaxError[] {
    const errors: SyntaxError[] = [];
    const { line, lineNumber } = context;

    // Match attribute references: &ATTR (more flexible pattern)
    const attrPattern = /&([a-zA-Z_][a-zA-Z0-9_-]*)/g;
    let match;

    while ((match = attrPattern.exec(line)) !== null) {
      const attrName = match[1];
      if (!attrName) continue;

      // Check attribute naming conventions
      if (attrName.length > 32) {
        errors.push({
          line: lineNumber,
          column: match.index + 1,
          message: `Attribute name too long: ${attrName} (max 32 characters)`,
          severity: 'error',
          code: 'ATTR_NAME_TOO_LONG',
          suggestion: 'Shorten attribute name',
          fixable: false
        });
      }

      // Check for invalid characters in attribute names
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(attrName)) {
        errors.push({
          line: lineNumber,
          column: match.index + 1,
          message: `Invalid attribute name: ${attrName}`,
          severity: 'error',
          code: 'INVALID_ATTR_NAME',
          suggestion: 'Use only letters, numbers, and underscores',
          fixable: false
        });
      }
    }

    return errors;
  }

  /**
   * Validate string literals
   */
  private validateStringLiterals(context: LineValidationContext): SyntaxError[] {
    const errors: SyntaxError[] = [];
    const { line, lineNumber } = context;

    // Check for unterminated strings
    let inString = false;
    let escapeNext = false;
    let stringStart = -1;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        if (!inString) {
          inString = true;
          stringStart = i;
        } else {
          inString = false;
          stringStart = -1;
        }
      }
    }

    // Check for unterminated string
    if (inString && stringStart >= 0) {
      errors.push({
        line: lineNumber,
        column: stringStart + 1,
        message: 'Unterminated string literal',
        severity: 'error',
        code: 'UNTERMINATED_STRING',
        suggestion: 'Add closing quote',
        fixable: true
      });
    }

    return errors;
  }

  /**
   * Validate regex patterns
   */
  private validateRegexPatterns(context: LineValidationContext): SyntaxError[] {
    const errors: SyntaxError[] = [];
    const { line, lineNumber } = context;

    // Check for regex functions with potentially invalid patterns
    const regexFunctions = ['regedit', 'regmatch', 'regsub'];
    
    for (const func of regexFunctions) {
      const pattern = new RegExp(`\\b${func}\\s*\\(([^,]+),\\s*([^,)]+)`, 'g');
      let match;

      while ((match = pattern.exec(line)) !== null) {
        const regexPattern = match[2]?.trim();
        if (regexPattern && regexPattern.startsWith('"') && regexPattern.endsWith('"')) {
          const regex = regexPattern.slice(1, -1);
          try {
            new RegExp(regex);
          } catch (e) {
            errors.push({
              line: lineNumber,
              column: match.index + match[0].indexOf(regexPattern) + 1,
              message: `Invalid regex pattern: ${e instanceof Error ? e.message : 'Unknown error'}`,
              severity: 'error',
              code: 'INVALID_REGEX',
              suggestion: 'Fix regex pattern syntax',
              fixable: false
            });
          }
        }
      }
    }

    return errors;
  }

  /**
   * Validate variable references
   */
  private validateVariableReferences(context: LineValidationContext): SyntaxError[] {
    const errors: SyntaxError[] = [];
    const { line, lineNumber } = context;

    // Check for invalid variable references
    const varPattern = /%([0-9]+|[a-zA-Z_][a-zA-Z0-9_]*)/g;
    let match;

    while ((match = varPattern.exec(line)) !== null) {
      const varName = match[1];
      if (!varName) continue;

      // Check for numeric variables that are too high
      if (/^\d+$/.test(varName)) {
        const num = parseInt(varName, 10);
        if (num > 99) {
          errors.push({
            line: lineNumber,
            column: match.index + 1,
            message: `Variable number too high: %${varName} (max %99)`,
            severity: 'warning',
            code: 'VAR_NUMBER_TOO_HIGH',
            suggestion: 'Use variables %0-%99 or named variables',
            fixable: false
          });
        }
      }

      // Check for invalid variable names
      if (!/^[0-9]+$/.test(varName) && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
        errors.push({
          line: lineNumber,
          column: match.index + 1,
          message: `Invalid variable name: %${varName}`,
          severity: 'error',
          code: 'INVALID_VAR_NAME',
          suggestion: 'Use alphanumeric characters and underscores only',
          fixable: false
        });
      }
    }

    return errors;
  }

  /**
   * Validate command syntax
   */
  private validateCommandSyntax(context: LineValidationContext): SyntaxError[] {
    const errors: SyntaxError[] = [];
    const { line, lineNumber, trimmedLine } = context;

    // Match commands starting with @
    const commandPattern = /^@([a-zA-Z_][a-zA-Z0-9_]*)/;
    const match = commandPattern.exec(trimmedLine);

    if (match) {
      const commandName = match[1];
      if (!commandName) return errors;

      // Check for common command syntax issues
      if (line.includes('  ')) {
        errors.push({
          line: lineNumber,
          column: line.indexOf('  ') + 1,
          message: 'Multiple consecutive spaces',
          severity: 'info',
          code: 'MULTIPLE_SPACES',
          suggestion: 'Use single spaces for better readability',
          fixable: true
        });
      }

      // Check for missing semicolon at end of command
      if (!trimmedLine.endsWith(';') && !trimmedLine.endsWith('}')) {
        errors.push({
          line: lineNumber,
          column: line.length + 1,
          message: 'Command should end with semicolon',
          severity: 'info',
          code: 'MISSING_SEMICOLON',
          suggestion: 'Add semicolon at end of command',
          fixable: true
        });
      }

      // Check for invalid command names
      if (commandName.length > 32) {
        errors.push({
          line: lineNumber,
          column: match.index + 1,
          message: `Command name too long: ${commandName} (max 32 characters)`,
          severity: 'warning',
          code: 'COMMAND_NAME_TOO_LONG',
          suggestion: 'Shorten command name',
          fixable: false
        });
      }
    }

    return errors;
  }

  /**
   * Validate global syntax issues
   */
  private validateGlobalSyntax(context: ValidationContext): SyntaxError[] {
    const errors: SyntaxError[] = [];
    const { code } = context;

    // Check for overall bracket balance
    const brackets = { '(': 0, '[': 0, '{': 0 };
    const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
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

      // Skip bracket checking inside strings
      if (inString) continue;

      if (char && Object.keys(brackets).includes(char)) {
        brackets[char as keyof typeof brackets]++;
      } else if (char && Object.values(pairs).includes(char)) {
        const openChar = Object.keys(pairs).find(k => pairs[k] === char);
        if (openChar && brackets[openChar as keyof typeof brackets] > 0) {
          brackets[openChar as keyof typeof brackets]--;
        }
      }
    }

    for (const [bracket, count] of Object.entries(brackets)) {
      if (count > 0) {
        errors.push({
          line: 1,
          column: 1,
          message: `${count} unclosed ${bracket} bracket(s)`,
          severity: 'error',
          code: 'GLOBAL_UNCLOSED_BRACKET',
          suggestion: `Add ${count} closing ${pairs[bracket]} bracket(s)`,
          fixable: true
        });
      }
    }

    // Check for excessive nesting depth
    const maxDepth = this.calculateMaxNestingDepth(code);
    if (maxDepth > 10) {
      errors.push({
        line: 1,
        column: 1,
        message: `Excessive nesting depth: ${maxDepth} levels`,
        severity: 'warning',
        code: 'EXCESSIVE_NESTING',
        suggestion: 'Consider breaking complex expressions into smaller parts',
        fixable: false
      });
    }

    return errors;
  }

  /**
   * Calculate maximum nesting depth
   */
  private calculateMaxNestingDepth(code: string): number {
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

  /**
   * Validate security vulnerabilities
   */
  private async validateSecurity(context: ValidationContext): Promise<SecurityWarning[]> {
    const warnings: SecurityWarning[] = [];
    const { code, lines, dialect } = context;

    // Get all security rules
    const securityRules = Array.from(this.knowledgeBase.securityRules.values());

    for (const rule of securityRules) {
      // Skip rules not applicable to current server
      if (dialect && !rule.affectedServers.includes(dialect.name)) {
        continue;
      }

      try {
        const pattern = new RegExp(rule.pattern, 'gi');
        let match;

        while ((match = pattern.exec(code)) !== null) {
          const lineNumber = this.getLineNumber(code, match.index);
          const columnNumber = this.getColumnNumber(code, match.index);

          warnings.push({
            ruleId: rule.ruleId,
            type: rule.category,
            description: rule.description,
            lineNumber,
            columnNumber,
            severity: rule.severity,
            mitigation: rule.recommendation,
            codeSnippet: this.getCodeSnippet(lines, lineNumber),
            references: rule.references
          });
        }
      } catch (error) {
        // Log invalid regex patterns but don't fail validation
        console.warn(`Invalid regex pattern in security rule ${rule.ruleId}: ${rule.pattern}`);
      }
    }

    // Add additional security checks
    warnings.push(...this.checkCommonSecurityIssues(context));

    return warnings;
  }

  /**
   * Check for common security issues not covered by rules
   */
  private checkCommonSecurityIssues(context: ValidationContext): SecurityWarning[] {
    const warnings: SecurityWarning[] = [];
    const { code, lines } = context;

    // Check for hardcoded passwords or sensitive data
    const sensitivePatterns = [
      { pattern: /password\s*=\s*["']([^"']+)["']/gi, type: 'hardcoded_password' },
      { pattern: /secret\s*=\s*["']([^"']+)["']/gi, type: 'hardcoded_secret' },
      { pattern: /api[_-]?key\s*=\s*["']([^"']+)["']/gi, type: 'hardcoded_api_key' }
    ];

    for (const { pattern, type } of sensitivePatterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const lineNumber = this.getLineNumber(code, match.index);
        const columnNumber = this.getColumnNumber(code, match.index);

        warnings.push({
          ruleId: `BUILTIN_${type.toUpperCase()}`,
          type: 'data',
          description: `Potential hardcoded sensitive data: ${type.replace('_', ' ')}`,
          lineNumber,
          columnNumber,
          severity: 'medium',
          mitigation: 'Use configuration files or environment variables for sensitive data',
          codeSnippet: this.getCodeSnippet(lines, lineNumber),
          references: []
        });
      }
    }

    return warnings;
  }

  /**
   * Validate best practices
   */
  private async validateBestPractices(context: ValidationContext): Promise<CodeImprovement[]> {
    const improvements: CodeImprovement[] = [];
    const { lines } = context;

    // Check for common best practice violations
    improvements.push(...this.checkCodeStyle(lines));
    improvements.push(...this.checkPerformance(lines));
    improvements.push(...this.checkMaintainability(lines));
    improvements.push(...this.checkReadability(lines));

    return improvements;
  }

  /**
   * Check code style best practices
   */
  private checkCodeStyle(lines: string[]): CodeImprovement[] {
    const improvements: CodeImprovement[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const lineNumber = i + 1;

      // Check for inconsistent indentation (not using 2 spaces)
      const indentMatch = line.match(/^(\s+)/);
      if (indentMatch && indentMatch[1]) {
        const indent = indentMatch[1];
        // Check if indentation is not multiples of 2 spaces
        if (indent.includes('\t') || (indent.length % 2 !== 0)) {
          improvements.push({
            type: 'readability',
            description: 'Inconsistent indentation',
            lineNumber,
            before: line,
            after: line.replace(/^\s+/, '  '.repeat(Math.ceil(indent.length / 2))),
            impact: 'Improves code readability and consistency',
            confidence: 0.8,
            effort: 'low',
            category: 'formatting'
          });
        }
      }

      // Check for missing comments on complex lines
      if (line.includes('switch(') && !line.includes('@@') && !lines[i - 1]?.includes('@@')) {
        improvements.push({
          type: 'readability',
          description: 'Complex logic without comments',
          lineNumber,
          before: line,
          after: `@@ Conditional logic\n${line}`,
          impact: 'Makes code easier to understand and maintain',
          confidence: 0.6,
          effort: 'low',
          category: 'documentation'
        });
      }
    }

    return improvements;
  }

  /**
   * Check performance best practices
   */
  private checkPerformance(lines: string[]): CodeImprovement[] {
    const improvements: CodeImprovement[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const lineNumber = i + 1;

      // Check for inefficient nested loops
      if (line.includes('iter(') && line.includes('iter(')) {
        improvements.push({
          type: 'performance',
          description: 'Nested iter() functions can be slow',
          lineNumber,
          before: line,
          after: line, // Would need more context for actual improvement
          impact: 'Reduces execution time for large datasets',
          confidence: 0.7,
          effort: 'medium',
          category: 'optimization'
        });
      }

      // Check for repeated expensive operations
      const expensiveOps = ['sql(', 'search(', 'lsearch('];
      for (const op of expensiveOps) {
        const count = (line.match(new RegExp(op.replace('(', '\\('), 'g')) || []).length;
        if (count > 1) {
          improvements.push({
            type: 'performance',
            description: `Multiple ${op} calls in single line`,
            lineNumber,
            before: line,
            after: line, // Would need more context for actual improvement
            impact: 'Cache results to avoid repeated expensive operations',
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
   * Check maintainability best practices
   */
  private checkMaintainability(lines: string[]): CodeImprovement[] {
    const improvements: CodeImprovement[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const lineNumber = i + 1;

      // Check for magic numbers
      const magicNumbers = line.match(/\b\d{2,}\b/g);
      if (magicNumbers) {
        for (const num of magicNumbers) {
          if (parseInt(num) > 10) { // Ignore small numbers
            improvements.push({
              type: 'maintainability',
              description: `Magic number: ${num}`,
              lineNumber,
              before: line,
              after: line.replace(num, `[v(CONSTANT_${num})]`),
              impact: 'Makes code more maintainable by using named constants',
              confidence: 0.6,
              effort: 'low',
              category: 'constants'
            });
          }
        }
      }

      // Check for long parameter lists
      const paramCount = (line.match(/%\d/g) || []).length;
      if (paramCount > 5) {
        improvements.push({
          type: 'maintainability',
          description: 'Too many parameters',
          lineNumber,
          before: line,
          after: line, // Would need restructuring
          impact: 'Consider using a data structure or breaking into smaller functions',
          confidence: 0.7,
          effort: 'high',
          category: 'structure'
        });
      }
    }

    return improvements;
  }

  /**
   * Check readability best practices
   */
  private checkReadability(lines: string[]): CodeImprovement[] {
    const improvements: CodeImprovement[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const lineNumber = i + 1;

      // Check for overly complex expressions
      const complexity = this.calculateLineComplexity(line);
      if (complexity > 10) {
        improvements.push({
          type: 'readability',
          description: 'Complex expression',
          lineNumber,
          before: line,
          after: line, // Would need breaking down
          impact: 'Break complex expressions into smaller, more readable parts',
          confidence: 0.8,
          effort: 'medium',
          category: 'complexity'
        });
      }

      // Check for unclear variable names
      const registers = line.match(/q\d+/g);
      if (registers && registers.length > 3) {
        improvements.push({
          type: 'readability',
          description: 'Many register variables',
          lineNumber,
          before: line,
          after: line, // Would need better naming
          impact: 'Use descriptive register names or comments to clarify purpose',
          confidence: 0.6,
          effort: 'low',
          category: 'naming'
        });
      }
    }

    return improvements;
  }

  /**
   * Check server compatibility
   */
  private checkCompatibility(context: ValidationContext): string[] {
    const notes: string[] = [];
    const { code, dialect } = context;

    if (!dialect) return notes;

    // Check for server-specific functions
    for (const func of dialect.functionLibrary) {
      if (func.name && code.includes(func.name) && func.notes) {
        for (const note of func.notes) {
          if (note.includes('compatibility') || note.includes('version')) {
            notes.push(`${func.name}: ${note}`);
          }
        }
      }
    }

    // Check for deprecated features
    for (const func of dialect.functionLibrary) {
      if (func.deprecated && func.name && code.includes(func.name)) {
        notes.push(`${func.name} is deprecated in ${dialect.name}`);
        if (func.alternativeTo) {
          notes.push(`Consider using ${func.alternativeTo} instead`);
        }
      }
    }

    return notes;
  }

  /**
   * Calculate quality scores for the code
   */
  private calculateQualityScores(
    context: ValidationContext,
    results: {
      syntaxErrors: SyntaxError[];
      securityWarnings: SecurityWarning[];
      bestPracticeSuggestions: CodeImprovement[];
    }
  ): {
    complexityScore: number;
    securityScore: number;
    maintainabilityScore: number;
  } {
    return {
      complexityScore: this.calculateComplexityScore(context),
      securityScore: this.calculateSecurityScore(results.securityWarnings),
      maintainabilityScore: this.calculateMaintainabilityScore(context, results.bestPracticeSuggestions)
    };
  }

  /**
   * Calculate complexity score (0-100)
   */
  private calculateComplexityScore(context: ValidationContext): number {
    const { code, lines } = context;
    let complexity = 0;

    // Base complexity from line count
    complexity += Math.min(lines.length * 0.5, 20);

    // Add complexity for control structures
    const controlStructures = ['switch(', 'iter(', 'fold(', 'filter(', 'map(', 'select('];
    for (const structure of controlStructures) {
      const count = (code.match(new RegExp(structure.replace('(', '\\('), 'g')) || []).length;
      complexity += count * 2;
    }

    // Add complexity for nesting depth
    const maxDepth = this.calculateMaxNestingDepth(code);
    complexity += maxDepth * 3;

    // Add complexity for function calls
    const functionCalls = (code.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\s*\(/g) || []).length;
    complexity += functionCalls * 0.5;

    return Math.min(Math.round(complexity), 100);
  }

  /**
   * Calculate security score (0-100, higher is better)
   */
  private calculateSecurityScore(warnings: SecurityWarning[]): number {
    if (warnings.length === 0) return 100;

    let deductions = 0;
    const severityWeights = {
      critical: 30,
      high: 20,
      medium: 10,
      low: 5
    };

    for (const warning of warnings) {
      deductions += severityWeights[warning.severity] || 5;
    }

    return Math.max(0, 100 - deductions);
  }

  /**
   * Calculate maintainability score (0-100)
   */
  private calculateMaintainabilityScore(
    context: ValidationContext,
    suggestions: CodeImprovement[]
  ): number {
    const { lines } = context;
    let score = 100;

    // Deduct for length
    if (lines.length > 50) score -= 10;
    if (lines.length > 100) score -= 20;
    if (lines.length > 200) score -= 30;

    // Deduct for lack of comments
    const commentLines = lines.filter(line => line.trim().startsWith('@@')).length;
    const commentRatio = lines.length > 0 ? commentLines / lines.length : 0;
    if (commentRatio < 0.1) score -= 15;
    if (commentRatio < 0.05) score -= 10;

    // Deduct for suggestions
    const suggestionWeights = {
      maintainability: 5,
      readability: 3,
      performance: 4,
      security: 6,
      best_practice: 2
    };

    for (const suggestion of suggestions) {
      score -= suggestionWeights[suggestion.type] || 1;
    }

    // Bonus for good practices
    if (commentRatio > 0.2) score += 5;
    if (lines.length > 0 && lines.length < 50) score += 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate line complexity
   */
  private calculateLineComplexity(line: string): number {
    let complexity = 1;

    // Count operators and functions
    const operators = ['switch(', 'if(', 'iter(', 'fold(', 'filter(', 'map('];
    for (const op of operators) {
      complexity += (line.match(new RegExp(op.replace('(', '\\('), 'g')) || []).length;
    }

    // Count nesting
    let depth = 0;
    for (const char of line) {
      if (char === '(' || char === '[') depth++;
    }
    complexity += Math.floor(depth / 2);

    return complexity;
  }

  /**
   * Get line number from character index
   */
  private getLineNumber(code: string, index: number): number {
    return code.substring(0, index).split('\n').length;
  }

  /**
   * Get column number from character index
   */
  private getColumnNumber(code: string, index: number): number {
    const lines = code.substring(0, index).split('\n');
    return lines[lines.length - 1]?.length ?? 0 + 1;
  }

  /**
   * Get code snippet around a line
   */
  private getCodeSnippet(lines: string[], lineNumber: number): string {
    const start = Math.max(0, lineNumber - 2);
    const end = Math.min(lines.length, lineNumber + 1);
    return lines.slice(start, end).join('\n');
  }
}