/**
 * MUSHCODE code generation engine
 */

import {
  MushcodePattern,
  ServerDialect,
  PatternMatch
} from '../types/knowledge.js';
import { MushcodeKnowledgeBase } from '../knowledge/base.js';
import { ValidationError } from '../utils/test-errors.js';

export interface GenerationRequest {
  description: string;
  serverType?: string | undefined;
  functionType?: string | undefined;
  parameters?: string[] | undefined;
  securityLevel?: string | undefined;
  includeComments?: boolean | undefined;
}

export interface GenerationResult {
  code: string;
  explanation: string;
  usageExample: string;
  compatibility: string[];
  securityNotes?: string | undefined;
  patternUsed?: string | undefined;
  warnings?: string[] | undefined;
}

export class MushcodeGenerator {
  constructor(private knowledgeBase: MushcodeKnowledgeBase) {}

  /**
   * Generate MUSHCODE based on user specifications
   */
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    this.validateRequest(request);

    // Find the best matching pattern
    const pattern = await this.findBestPattern(request);
    
    if (!pattern) {
      throw new ValidationError(`No suitable pattern found for: ${request.description}`);
    }

    // Get server dialect information
    const dialect = request.serverType ? 
      this.knowledgeBase.dialects.get(request.serverType) : 
      null;

    // Generate the code
    const code = this.generateCode(pattern, request, dialect);
    
    // Create explanation
    const explanation = this.generateExplanation(pattern, request);
    
    // Create usage example
    const usageExample = this.generateUsageExample(pattern, request);
    
    // Determine compatibility
    const compatibility = this.determineCompatibility(pattern, dialect);
    
    // Generate security notes
    const securityNotes = this.generateSecurityNotes(pattern, request);
    
    // Check for warnings
    const warnings = this.generateWarnings(pattern, request, dialect);

    return {
      code,
      explanation,
      usageExample,
      compatibility,
      securityNotes,
      patternUsed: pattern.id,
      warnings
    };
  }

  /**
   * Validate the generation request
   */
  private validateRequest(request: GenerationRequest): void {
    if (!request.description || request.description.trim().length === 0) {
      throw new ValidationError('Description is required');
    }

    if (request.description.length > 1000) {
      throw new ValidationError('Description is too long (max 1000 characters)');
    }

    if (request.serverType && !this.knowledgeBase.dialects.has(request.serverType)) {
      throw new ValidationError(`Unknown server type: ${request.serverType}`);
    }

    const validFunctionTypes = ['command', 'function', 'trigger', 'attribute', 'utility'];
    if (request.functionType && !validFunctionTypes.includes(request.functionType)) {
      throw new ValidationError(`Invalid function type. Must be one of: ${validFunctionTypes.join(', ')}`);
    }

    const validSecurityLevels = ['public', 'player', 'builder', 'wizard', 'god'];
    if (request.securityLevel && !validSecurityLevels.includes(request.securityLevel)) {
      throw new ValidationError(`Invalid security level. Must be one of: ${validSecurityLevels.join(', ')}`);
    }
  }

  /**
   * Find the best matching pattern for the request
   */
  private async findBestPattern(request: GenerationRequest): Promise<MushcodePattern | null> {
    // Search for patterns matching the description
    const searchQuery: any = {
      query: request.description,
      includePatterns: true,
      includeExamples: false,
      fuzzyMatch: true,
      limit: 10
    };

    if (request.functionType) {
      searchQuery.category = request.functionType;
    }

    if (request.serverType) {
      searchQuery.serverType = request.serverType;
    }

    const searchResult = this.knowledgeBase.search(searchQuery);

    if (searchResult.patterns.length === 0) {
      // Try a broader search without category filter
      const broadSearchQuery: any = {
        query: request.description,
        includePatterns: true,
        includeExamples: false,
        fuzzyMatch: true,
        limit: 10
      };

      if (request.serverType) {
        broadSearchQuery.serverType = request.serverType;
      }

      const broadSearchResult = this.knowledgeBase.search(broadSearchQuery);

      if (broadSearchResult.patterns.length === 0) {
        return null;
      }

      return this.selectBestPattern(broadSearchResult.patterns, request);
    }

    return this.selectBestPattern(searchResult.patterns, request);
  }

  /**
   * Select the best pattern from search results
   */
  private selectBestPattern(matches: PatternMatch[], request: GenerationRequest): MushcodePattern | null {
    // Sort by relevance and confidence
    const sortedMatches = matches.sort((a, b) => {
      const scoreA = (a.relevance * 0.7) + (a.confidence * 0.3);
      const scoreB = (b.relevance * 0.7) + (b.confidence * 0.3);
      return scoreB - scoreA;
    });

    for (const match of sortedMatches) {
      const pattern = this.knowledgeBase.patterns.get(match.patternId);
      if (!pattern) continue;

      // Check server compatibility
      if (request.serverType && !pattern.serverCompatibility.includes(request.serverType)) {
        continue;
      }

      // Check security level compatibility
      if (request.securityLevel) {
        const securityLevels = ['public', 'player', 'builder', 'wizard', 'god'];
        const requestLevel = securityLevels.indexOf(request.securityLevel);
        const patternLevel = securityLevels.indexOf(pattern.securityLevel);
        
        if (requestLevel < patternLevel) {
          continue; // Pattern requires higher permissions than requested
        }
      }

      return pattern;
    }

    return null;
  }

  /**
   * Generate code from pattern and request
   */
  private generateCode(
    pattern: MushcodePattern, 
    request: GenerationRequest, 
    dialect?: ServerDialect | null
  ): string {
    let code = pattern.codeTemplate;

    // Apply server-specific syntax variations
    if (dialect) {
      for (const rule of dialect.syntaxVariations) {
        if (rule.replacement) {
          code = code.replace(new RegExp(rule.pattern, 'g'), rule.replacement);
        }
      }
    }

    // Replace parameter placeholders
    if (request.parameters && request.parameters.length > 0) {
      request.parameters.forEach((param, index) => {
        const placeholder = `%${index}`;
        code = code.replace(new RegExp(`\\${placeholder}`, 'g'), param);
      });
    }

    // Add comments if requested
    if (request.includeComments !== false) {
      code = this.addComments(code, pattern, request);
    }

    // Apply security considerations
    code = this.applySecurityConsiderations(code, pattern, request);

    return code.trim();
  }

  /**
   * Add explanatory comments to the code
   */
  private addComments(code: string, pattern: MushcodePattern, request: GenerationRequest): string {
    const lines = code.split('\n');
    const commentedLines: string[] = [];

    // Add header comment
    commentedLines.push(`@@ ${pattern.name} - ${pattern.description}`);
    commentedLines.push(`@@ Generated for: ${request.description}`);
    if (request.serverType) {
      commentedLines.push(`@@ Server: ${request.serverType}`);
    }
    commentedLines.push(`@@ Security Level: ${pattern.securityLevel}`);
    commentedLines.push('@@');

    // Add the original code with inline comments for complex sections
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line !== undefined) {
        commentedLines.push(line);

        // Add inline comments for complex patterns
        if (line.includes('switch(') && !line.includes('@@')) {
          commentedLines.push('@@ Switch statement for conditional logic');
        } else if (line.includes('iter(') && !line.includes('@@')) {
          commentedLines.push('@@ Iterate over list elements');
        } else if (line.includes('setq(') && !line.includes('@@')) {
          commentedLines.push('@@ Set register variable for later use');
        }
      }
    }

    return commentedLines.join('\n');
  }

  /**
   * Apply security considerations to the generated code
   */
  private applySecurityConsiderations(
    code: string, 
    pattern: MushcodePattern, 
    request: GenerationRequest
  ): string {
    let secureCode = code;

    // Add permission checks for elevated security levels
    if (pattern.securityLevel !== 'public') {
      const permissionCheck = this.generatePermissionCheck(pattern.securityLevel);
      secureCode = `${permissionCheck}\n${secureCode}`;
    }

    // Add input validation for user parameters
    if (request.parameters && request.parameters.length > 0) {
      const validationCode = this.generateInputValidation(request.parameters);
      secureCode = `${validationCode}\n${secureCode}`;
    }

    return secureCode;
  }

  /**
   * Generate permission check code
   */
  private generatePermissionCheck(securityLevel: string): string {
    const checks: Record<string, string> = {
      'player': '@switch hasflag(%#,PLAYER)=0,{@pemit %#=Permission denied.;@halt}',
      'builder': '@switch orflags(%#,Bb)=0,{@pemit %#=Permission denied.;@halt}',
      'wizard': '@switch orflags(%#,Ww)=0,{@pemit %#=Permission denied.;@halt}',
      'god': '@switch hasflag(%#,ROYALTY)=0,{@pemit %#=Permission denied.;@halt}'
    };

    return checks[securityLevel] || '';
  }

  /**
   * Generate input validation code
   */
  private generateInputValidation(parameters: string[]): string {
    const validations: string[] = [];

    parameters.forEach((param, index) => {
      if (param && param.trim().length > 0) {
        validations.push(
          `@switch strlen(%${index})=0,{@pemit %#=Error: Parameter ${index + 1} is required.;@halt}`
        );
      }
    });

    return validations.join('\n');
  }

  /**
   * Generate explanation for the code
   */
  private generateExplanation(pattern: MushcodePattern, _request: GenerationRequest): string {
    const parts: string[] = [];

    parts.push(`This code implements ${pattern.name.toLowerCase()}: ${pattern.description}`);
    
    if (pattern.parameters.length > 0) {
      parts.push('\nParameters:');
      pattern.parameters.forEach((param, index) => {
        parts.push(`  %${index} - ${param.name}: ${param.description}${param.required ? ' (required)' : ' (optional)'}`);
      });
    }

    parts.push(`\nSecurity Level: ${pattern.securityLevel} - ${this.getSecurityLevelDescription(pattern.securityLevel)}`);

    if (pattern.tags.length > 0) {
      parts.push(`\nTags: ${pattern.tags.join(', ')}`);
    }

    parts.push(`\nThis pattern is compatible with: ${pattern.serverCompatibility.join(', ')}`);

    return parts.join('');
  }

  /**
   * Get description for security level
   */
  private getSecurityLevelDescription(level: string): string {
    const descriptions: Record<string, string> = {
      'public': 'Can be used by any player',
      'player': 'Requires player-level permissions',
      'builder': 'Requires builder-level permissions or higher',
      'wizard': 'Requires wizard-level permissions or higher',
      'god': 'Requires god-level permissions'
    };

    return descriptions[level] || 'Unknown security level';
  }

  /**
   * Generate usage example
   */
  private generateUsageExample(pattern: MushcodePattern, request: GenerationRequest): string {
    if (pattern.examples.length > 0 && pattern.examples[0]) {
      return pattern.examples[0];
    }

    // Generate a basic usage example
    const exampleParts: string[] = [];
    
    if (pattern.category === 'command') {
      exampleParts.push(`+${pattern.name.toLowerCase()}`);
      if (request.parameters && request.parameters.length > 0) {
        exampleParts.push(request.parameters.join(' '));
      }
    } else {
      exampleParts.push(`[${pattern.name.toLowerCase()}(`);
      if (request.parameters && request.parameters.length > 0) {
        exampleParts.push(request.parameters.join(', '));
      }
      exampleParts.push(')]');
    }

    return exampleParts.join('');
  }

  /**
   * Determine server compatibility
   */
  private determineCompatibility(pattern: MushcodePattern, dialect?: ServerDialect | null): string[] {
    if (dialect) {
      // Check if pattern is compatible with the specific dialect
      return pattern.serverCompatibility.includes(dialect.name) ? 
        [dialect.name] : 
        pattern.serverCompatibility;
    }

    return pattern.serverCompatibility;
  }

  /**
   * Generate security notes
   */
  private generateSecurityNotes(pattern: MushcodePattern, request: GenerationRequest): string | undefined {
    const notes: string[] = [];

    if (pattern.securityLevel !== 'public') {
      notes.push(`This code requires ${pattern.securityLevel} level permissions to execute.`);
    }

    if (request.parameters && request.parameters.length > 0) {
      notes.push('Input validation has been added to prevent common security issues.');
    }

    // Check for potentially dangerous functions
    const dangerousFunctions = ['@shutdown', '@restart', '@dump', '@pcreate', '@destroy'];
    const codeTemplate = pattern.codeTemplate.toLowerCase();
    
    for (const func of dangerousFunctions) {
      if (codeTemplate.includes(func)) {
        notes.push(`WARNING: This code uses ${func} which can have significant system impact.`);
      }
    }

    return notes.length > 0 ? notes.join(' ') : undefined;
  }

  /**
   * Generate warnings for potential issues
   */
  private generateWarnings(
    pattern: MushcodePattern, 
    request: GenerationRequest, 
    dialect?: ServerDialect | null
  ): string[] {
    const warnings: string[] = [];

    // Check server compatibility
    if (request.serverType && !pattern.serverCompatibility.includes(request.serverType)) {
      warnings.push(`This pattern may not be fully compatible with ${request.serverType}`);
    }

    // Check for deprecated features
    if (dialect) {
      for (const func of dialect.functionLibrary) {
        if (func.deprecated && pattern.codeTemplate.includes(func.name)) {
          warnings.push(`Function ${func.name} is deprecated in ${dialect.name}`);
          if (func.alternativeTo) {
            warnings.push(`Consider using ${func.alternativeTo} instead`);
          }
        }
      }
    }

    // Check complexity level
    if (pattern.difficulty === 'advanced' && request.functionType === 'command') {
      warnings.push('This is an advanced pattern that may require additional customization');
    }

    return warnings;
  }
}