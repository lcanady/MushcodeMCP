/**
 * MUSHCODE code explanation engine
 */

import {
  ServerDialect
} from '../types/knowledge.js';
import { MushcodeKnowledgeBase } from '../knowledge/base.js';
import { ValidationError } from '../utils/errors.js';

export interface ExplanationRequest {
  code: string;
  detailLevel: 'basic' | 'intermediate' | 'advanced';
  focusAreas?: string[];
  serverType?: string;
  includeExamples?: boolean;
}

export interface CodeSection {
  lineNumber: number;
  code: string;
  explanation: string;
  concepts: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  functions?: string[];
  securityNotes?: string[];
}

export interface ExplanationResult {
  explanation: string;
  codeBreakdown: CodeSection[];
  conceptsUsed: string[];
  relatedExamples: string[];
  difficultyLevel: string;
  learningResources?: string[];
  securityConsiderations?: string[];
  performanceNotes?: string[];
}

export class MushcodeExplainer {
  constructor(private knowledgeBase: MushcodeKnowledgeBase) {}

  /**
   * Explain MUSHCODE functionality
   */
  async explain(request: ExplanationRequest): Promise<ExplanationResult> {
    this.validateRequest(request);

    // Get server dialect information if specified
    const dialect = request.serverType ? 
      this.knowledgeBase.dialects.get(request.serverType) : 
      null;

    // Parse the code into sections
    const codeSections = this.parseCodeSections(request.code);
    
    // Analyze each section
    const codeBreakdown = await this.analyzeCodeSections(codeSections, request, dialect);
    
    // Generate overall explanation
    const explanation = this.generateOverallExplanation(codeBreakdown, request);
    
    // Extract concepts used
    const conceptsUsed = this.extractConcepts(codeBreakdown);
    
    // Find related examples
    const relatedExamples = await this.findRelatedExamples(conceptsUsed, request);
    
    // Determine difficulty level
    const difficultyLevel = this.determineDifficultyLevel(codeBreakdown);
    
    // Generate learning resources
    const learningResources = this.generateLearningResources(conceptsUsed, request);
    
    // Extract security considerations
    const securityConsiderations = this.extractSecurityConsiderations(codeBreakdown);
    
    // Extract performance notes
    const performanceNotes = this.extractPerformanceNotes(codeBreakdown, request);

    const result: ExplanationResult = {
      explanation,
      codeBreakdown,
      conceptsUsed,
      relatedExamples,
      difficultyLevel
    };

    if (learningResources.length > 0) {
      result.learningResources = learningResources;
    }

    if (securityConsiderations.length > 0) {
      result.securityConsiderations = securityConsiderations;
    }

    if (performanceNotes.length > 0) {
      result.performanceNotes = performanceNotes;
    }

    return result;
  }

  /**
   * Validate the explanation request
   */
  private validateRequest(request: ExplanationRequest): void {
    if (!request.code || request.code.trim().length === 0) {
      throw new ValidationError('Code is required');
    }

    if (request.code.length > 10000) {
      throw new ValidationError('Code is too long (max 10000 characters)');
    }

    if (request.serverType && !this.knowledgeBase.dialects.has(request.serverType)) {
      throw new ValidationError(`Unknown server type: ${request.serverType}`);
    }

    const validDetailLevels = ['basic', 'intermediate', 'advanced'];
    if (!validDetailLevels.includes(request.detailLevel)) {
      throw new ValidationError(`Invalid detail level. Must be one of: ${validDetailLevels.join(', ')}`);
    }

    if (request.focusAreas) {
      const validFocusAreas = ['syntax', 'logic', 'security', 'performance', 'best_practices', 'concepts'];
      for (const area of request.focusAreas) {
        if (!validFocusAreas.includes(area)) {
          throw new ValidationError(`Invalid focus area: ${area}. Must be one of: ${validFocusAreas.join(', ')}`);
        }
      }
    }
  }

  /**
   * Parse code into logical sections
   */
  private parseCodeSections(code: string): Array<{lineNumber: number; code: string}> {
    const lines = code.split('\n');
    const sections: Array<{lineNumber: number; code: string}> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && line.trim().length > 0) {
        sections.push({
          lineNumber: i + 1,
          code: line.trim()
        });
      }
    }

    return sections;
  }

  /**
   * Analyze each code section
   */
  private async analyzeCodeSections(
    sections: Array<{lineNumber: number; code: string}>,
    request: ExplanationRequest,
    dialect?: ServerDialect | null
  ): Promise<CodeSection[]> {
    const analyzedSections: CodeSection[] = [];

    for (const section of sections) {
      const analysis = await this.analyzeCodeSection(section, request, dialect);
      analyzedSections.push(analysis);
    }

    return analyzedSections;
  }

  /**
   * Analyze a single code section
   */
  private async analyzeCodeSection(
    section: {lineNumber: number; code: string},
    request: ExplanationRequest,
    dialect?: ServerDialect | null
  ): Promise<CodeSection> {
    const code = section.code;
    const concepts: string[] = [];
    const functions: string[] = [];
    const securityNotes: string[] = [];

    // Identify MUSHCODE functions and concepts
    const identifiedFunctions = this.identifyFunctions(code, dialect);
    functions.push(...identifiedFunctions);

    // Identify concepts based on code patterns
    const identifiedConcepts = this.identifyConcepts(code);
    concepts.push(...identifiedConcepts);

    // Check for security considerations
    const securityIssues = this.checkSecurity(code);
    securityNotes.push(...securityIssues);

    // Generate explanation based on detail level
    const context: {
      functions: string[];
      concepts: string[];
      focusAreas?: string[];
      dialect?: ServerDialect | null;
    } = {
      functions: identifiedFunctions,
      concepts: identifiedConcepts
    };

    if (request.focusAreas !== undefined) {
      context.focusAreas = request.focusAreas;
    }

    if (dialect !== undefined) {
      context.dialect = dialect;
    }

    const explanation = this.generateSectionExplanation(code, request.detailLevel, context);

    // Determine complexity
    const complexity = this.determineComplexity(code, identifiedFunctions, identifiedConcepts);

    const result: CodeSection = {
      lineNumber: section.lineNumber,
      code,
      explanation,
      concepts,
      complexity
    };

    if (functions.length > 0) {
      result.functions = functions;
    }

    if (securityNotes.length > 0) {
      result.securityNotes = securityNotes;
    }

    return result;
  }

  /**
   * Identify MUSHCODE functions in code
   */
  private identifyFunctions(code: string, dialect?: ServerDialect | null): string[] {
    const functions: string[] = [];
    
    // Common MUSHCODE function patterns
    const functionPatterns = [
      /\b(switch|if|iter|map|filter|fold|setq|r|v|get|set|add|sub|mul|div|mod|eq|neq|lt|gt|lte|gte|and|or|not|strlen|mid|left|right|words|first|rest|last|match|grab|extract|sort|shuffle|reverse|unique|union|intersect|diff|member|index|replace|edit|tr|secure|escape|unescape|encrypt|decrypt|hash|rand|die|time|secs|convsecs|convtime|strftime|gmtime|localtime|tz|mudname|version|config|default|null|space|repeat|center|ljust|rjust|wrap|columns|table|ansi|strip|stripansi|accent|unaccent|art|beep|conn|doing|finger|fullname|hasflag|haspower|hastype|idle|last|locate|lwho|money|name|num|objeval|owner|parent|pmatch|powers|room|type|where|who|zone|create|destroy|clone|dig|open|link|unlink|lock|unlock|set|wipe|mvattr|cpattr|lattr|nattr|hasattr|get_eval|u|ulocal|ufun|ulambda|udefault|trigger|pemit|remit|oemit|emit|say|pose|semipose|think|page|mail|channel|chat|addcom|delcom|comlist|comtitle|alias|unalias|home|move|teleport|go|look|examine|inventory|score|quit|who|doing|page|whisper|say|pose|think|help|news|events|motd|connect|disconnect|create|destroy|@admin|@boot|@chown|@clone|@cpattr|@create|@destroy|@dig|@doing|@dump|@edit|@emit|@entrances|@examine|@find|@force|@halt|@kick|@link|@list|@lock|@log|@mail|@mvattr|@name|@newpassword|@notify|@oemit|@open|@parent|@password|@pcreate|@pemit|@poll|@poor|@ps|@purge|@quota|@remit|@restart|@search|@set|@shutdown|@stats|@sweep|@switch|@teleport|@trigger|@unlink|@unlock|@uptime|@version|@wall|@wipe|@zone)\b/gi
    ];

    for (const pattern of functionPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        functions.push(...matches.map(match => match.toLowerCase()));
      }
    }

    // Check dialect-specific functions
    if (dialect) {
      for (const func of dialect.functionLibrary) {
        const funcPattern = new RegExp(`\\b${func.name}\\b`, 'gi');
        if (funcPattern.test(code)) {
          functions.push(func.name.toLowerCase());
        }
      }
    }

    return [...new Set(functions)]; // Remove duplicates
  }

  /**
   * Identify MUSHCODE concepts in code
   */
  private identifyConcepts(code: string): string[] {
    const concepts: string[] = [];

    // Pattern matching for different concepts
    const conceptPatterns = [
      { pattern: /@\w+/, concept: 'commands' },
      { pattern: /&\w+/, concept: 'attributes' },
      { pattern: /%[0-9qrv]/, concept: 'registers' },
      { pattern: /%#|%!|%@|%\*|%\+/, concept: 'substitutions' },
      { pattern: /\$\w+/, concept: 'functions' },
      { pattern: /switch\(/, concept: 'conditional_logic' },
      { pattern: /iter\(/, concept: 'iteration' },
      { pattern: /setq\(/, concept: 'variable_assignment' },
      { pattern: /u\(/, concept: 'user_functions' },
      { pattern: /trigger\(/, concept: 'triggers' },
      { pattern: /pemit|remit|oemit/, concept: 'messaging' },
      { pattern: /lock\(|unlock\(/, concept: 'security' },
      { pattern: /create\(|destroy\(/, concept: 'object_management' },
      { pattern: /get\(|set\(/, concept: 'attribute_manipulation' },
      { pattern: /match\(|grab\(/, concept: 'pattern_matching' },
      { pattern: /ansi\(/, concept: 'formatting' },
      { pattern: /rand\(|die\(/, concept: 'randomization' },
      { pattern: /time\(|secs\(/, concept: 'time_functions' },
      { pattern: /strlen\(|mid\(|left\(|right\(/, concept: 'string_manipulation' },
      { pattern: /add\(|sub\(|mul\(|div\(/, concept: 'arithmetic' },
      { pattern: /eq\(|neq\(|lt\(|gt\(/, concept: 'comparison' },
      { pattern: /and\(|or\(|not\(/, concept: 'boolean_logic' }
    ];

    for (const { pattern, concept } of conceptPatterns) {
      if (pattern.test(code)) {
        concepts.push(concept);
      }
    }

    return [...new Set(concepts)]; // Remove duplicates
  }

  /**
   * Check for security considerations
   */
  private checkSecurity(code: string): string[] {
    const securityNotes: string[] = [];

    // Check against security rules
    for (const rule of this.knowledgeBase.securityRules.values()) {
      try {
        const pattern = new RegExp(rule.pattern, 'gi');
        if (pattern.test(code)) {
          securityNotes.push(`${rule.severity.toUpperCase()}: ${rule.description} - ${rule.recommendation}`);
        }
      } catch (error) {
        // Skip invalid regex patterns
        console.warn(`Invalid regex pattern in security rule ${rule.ruleId}: ${rule.pattern}`);
      }
    }

    // Additional security checks
    const securityPatterns = [
      { pattern: /@shutdown|@restart/i, note: 'CRITICAL: Administrative commands that affect server operation' },
      { pattern: /@force/i, note: 'HIGH: force command can bypass normal security restrictions' },
      { pattern: /@newpassword|@password/i, note: 'HIGH: Password manipulation requires careful permission checking' },
      { pattern: /eval\(|ufun\(/i, note: 'MEDIUM: Dynamic code execution - validate inputs carefully' },
      { pattern: /%#/i, note: 'LOW: Using %# executor reference - ensure proper permission checks' }
    ];

    for (const { pattern, note } of securityPatterns) {
      if (pattern.test(code)) {
        securityNotes.push(note);
      }
    }

    return securityNotes;
  }

  /**
   * Generate explanation for a code section
   */
  private generateSectionExplanation(
    code: string,
    detailLevel: 'basic' | 'intermediate' | 'advanced',
    context: {
      functions: string[];
      concepts: string[];
      focusAreas?: string[];
      dialect?: ServerDialect | null;
    }
  ): string {
    const explanationParts: string[] = [];

    // Basic explanation
    if (code.startsWith('@')) {
      explanationParts.push(`This is a MUSHCODE command: ${code.split(' ')[0]}`);
    } else if (code.includes('(') && code.includes(')')) {
      explanationParts.push('This line contains function calls that process data and return results.');
    } else if (code.startsWith('&')) {
      explanationParts.push('This sets an attribute on an object to store data or code.');
    } else {
      explanationParts.push('This is a MUSHCODE expression that performs operations.');
    }

    // Add function-specific explanations
    if (context.functions.length > 0) {
      const functionExplanations = this.getFunctionExplanations(context.functions, context.dialect);
      if (functionExplanations.length > 0) {
        explanationParts.push(`Functions used: ${functionExplanations.join(', ')}`);
      }
    }

    // Add concept explanations based on detail level
    if (detailLevel !== 'basic' && context.concepts.length > 0) {
      const conceptExplanations = this.getConceptExplanations(context.concepts, detailLevel);
      if (conceptExplanations.length > 0) {
        explanationParts.push(conceptExplanations.join(' '));
      }
    }

    // Add focus area specific explanations
    if (context.focusAreas) {
      const focusExplanations = this.getFocusAreaExplanations(code, context.focusAreas, detailLevel);
      if (focusExplanations.length > 0) {
        explanationParts.push(focusExplanations.join(' '));
      }
    }

    return explanationParts.join(' ');
  }

  /**
   * Get explanations for functions
   */
  private getFunctionExplanations(functions: string[], dialect?: ServerDialect | null): string[] {
    const explanations: string[] = [];

    const functionDescriptions: Record<string, string> = {
      'switch': 'evaluates conditions and returns different results',
      'if': 'performs conditional logic',
      'iter': 'loops through a list of items',
      'setq': 'stores a value in a register for later use',
      'get': 'retrieves an attribute value from an object',
      'set': 'assigns a value to an attribute',
      'pemit': 'sends a private message to a player',
      'remit': 'sends a message to all players in a room',
      'u': 'calls a user-defined function',
      'strlen': 'returns the length of a string',
      'mid': 'extracts a substring from a string',
      'add': 'performs addition',
      'eq': 'tests for equality',
      'and': 'performs logical AND operation',
      'or': 'performs logical OR operation'
    };

    for (const func of functions) {
      if (functionDescriptions[func]) {
        explanations.push(`${func}() ${functionDescriptions[func]}`);
      } else if (dialect) {
        // Check dialect-specific function library
        const funcDef = dialect.functionLibrary.find(f => f.name.toLowerCase() === func);
        if (funcDef) {
          explanations.push(`${func}() ${funcDef.description}`);
        }
      }
    }

    return explanations;
  }

  /**
   * Get explanations for concepts
   */
  private getConceptExplanations(concepts: string[], detailLevel: 'basic' | 'intermediate' | 'advanced'): string[] {
    const explanations: string[] = [];

    const conceptDescriptions: Record<string, Record<string, string>> = {
      'registers': {
        'intermediate': 'Uses registers (%q, %r, %v) to store temporary values during execution.',
        'advanced': 'Utilizes MUSHCODE registers for efficient data storage and manipulation, allowing complex calculations and data passing between function calls.'
      },
      'substitutions': {
        'intermediate': 'Uses substitution patterns (%#, %!, etc.) to reference dynamic values.',
        'advanced': 'Employs MUSHCODE substitution patterns for context-aware programming, enabling code that adapts to different execution environments.'
      },
      'conditional_logic': {
        'intermediate': 'Implements conditional logic to make decisions based on data.',
        'advanced': 'Uses sophisticated conditional branching to create complex decision trees and program flow control.'
      },
      'iteration': {
        'intermediate': 'Loops through data to process multiple items.',
        'advanced': 'Implements iterative processing patterns for efficient bulk data manipulation and transformation.'
      },
      'messaging': {
        'intermediate': 'Sends messages to players or rooms.',
        'advanced': 'Utilizes MUSHCODE messaging system for player communication and game event notification.'
      },
      'security': {
        'intermediate': 'Implements security measures and permission checks.',
        'advanced': 'Employs comprehensive security patterns including permission validation, input sanitization, and access control.'
      }
    };

    for (const concept of concepts) {
      const descriptions = conceptDescriptions[concept];
      if (descriptions && descriptions[detailLevel]) {
        explanations.push(descriptions[detailLevel]);
      }
    }

    return explanations;
  }

  /**
   * Get explanations for specific focus areas
   */
  private getFocusAreaExplanations(code: string, focusAreas: string[], detailLevel: 'basic' | 'intermediate' | 'advanced'): string[] {
    const explanations: string[] = [];

    for (const area of focusAreas) {
      switch (area) {
        case 'syntax':
          if (detailLevel !== 'basic') {
            explanations.push('Syntax follows MUSHCODE conventions with function calls, attribute references, and command structures.');
          }
          break;
        case 'logic':
          if (code.includes('switch(') || code.includes('if(')) {
            explanations.push('The logic flow uses conditional statements to control program execution.');
          }
          break;
        case 'security':
          if (code.includes('%#') || code.includes('lock(') || code.includes('@force') || code.includes('@shutdown')) {
            explanations.push('Security considerations include permission checking and input validation.');
          }
          break;
        case 'performance':
          if (code.includes('iter(') || code.includes('map(')) {
            explanations.push('Performance can be optimized by minimizing iterations and using efficient functions.');
          }
          break;
        case 'best_practices':
          explanations.push('Follows MUSHCODE best practices for readability and maintainability.');
          break;
      }
    }

    return explanations;
  }

  /**
   * Determine complexity of a code section
   */
  private determineComplexity(code: string, functions: string[], concepts: string[]): 'simple' | 'moderate' | 'complex' {
    let complexityScore = 0;

    // Function complexity (reduced weight)
    complexityScore += functions.length * 0.5;

    // Concept complexity (reduced weight)
    complexityScore += concepts.length * 0.5;

    // Nesting complexity
    const nestingLevel = (code.match(/\(/g) || []).length;
    complexityScore += nestingLevel * 0.5;

    // Special patterns that increase complexity
    if (code.includes('switch(')) complexityScore += 1;
    if (code.includes('iter(')) complexityScore += 2;
    if (code.includes('u(')) complexityScore += 1;
    if (code.includes('eval(')) complexityScore += 3;

    if (complexityScore <= 2) return 'simple';
    if (complexityScore <= 5) return 'moderate';
    return 'complex';
  }

  /**
   * Generate overall explanation
   */
  private generateOverallExplanation(codeBreakdown: CodeSection[], request: ExplanationRequest): string {
    const parts: string[] = [];

    // Determine overall purpose
    const hasCommands = codeBreakdown.some(section => section.code.startsWith('@'));
    const hasFunctions = codeBreakdown.some(section => section.functions && section.functions.length > 0);
    const hasAttributes = codeBreakdown.some(section => section.code.startsWith('&'));

    if (hasCommands) {
      parts.push('This MUSHCODE contains administrative or action commands that perform operations on the MUD.');
    } else if (hasAttributes) {
      parts.push('This MUSHCODE defines attributes that store data or executable code on objects.');
    } else if (hasFunctions) {
      parts.push('This MUSHCODE consists of function calls that process data and return results.');
    } else {
      parts.push('This MUSHCODE performs various operations and calculations.');
    }

    // Add complexity assessment
    const complexSections = codeBreakdown.filter(section => section.complexity === 'complex').length;
    const moderateSections = codeBreakdown.filter(section => section.complexity === 'moderate').length;

    if (complexSections > 0) {
      parts.push(`The code contains ${complexSections} complex section${complexSections > 1 ? 's' : ''} that require advanced MUSHCODE knowledge.`);
    } else if (moderateSections > 0) {
      parts.push(`The code has ${moderateSections} moderately complex section${moderateSections > 1 ? 's' : ''} suitable for intermediate developers.`);
    } else {
      parts.push('The code is relatively straightforward and suitable for beginners.');
    }

    // Add server-specific notes
    if (request.serverType) {
      parts.push(`This explanation is tailored for ${request.serverType} server dialect.`);
    }

    return parts.join(' ');
  }

  /**
   * Extract all concepts used in the code
   */
  private extractConcepts(codeBreakdown: CodeSection[]): string[] {
    const allConcepts = new Set<string>();

    for (const section of codeBreakdown) {
      for (const concept of section.concepts) {
        allConcepts.add(concept);
      }
    }

    return Array.from(allConcepts);
  }

  /**
   * Find related examples
   */
  private async findRelatedExamples(concepts: string[], request: ExplanationRequest): Promise<string[]> {
    if (!request.includeExamples) {
      return [];
    }

    const examples: string[] = [];

    // Search for examples that match the concepts
    for (const concept of concepts.slice(0, 3)) { // Limit to top 3 concepts
      const searchQuery: any = {
        query: concept,
        includeExamples: true,
        includePatterns: false,
        limit: 2
      };

      if (request.serverType !== undefined) {
        searchQuery.serverType = request.serverType;
      }

      const searchResult = this.knowledgeBase.search(searchQuery);
      
      for (const exampleMatch of searchResult.examples) {
        const example = this.knowledgeBase.examples.get(exampleMatch.exampleId);
        if (example) {
          examples.push(`${example.title}: ${example.description}`);
        }
      }
    }

    return [...new Set(examples)]; // Remove duplicates
  }

  /**
   * Determine overall difficulty level
   */
  private determineDifficultyLevel(codeBreakdown: CodeSection[]): string {
    const complexityScores = codeBreakdown.map(section => {
      switch (section.complexity) {
        case 'simple': return 1;
        case 'moderate': return 2;
        case 'complex': return 3;
        default: return 1;
      }
    });

    const averageComplexity = complexityScores.reduce((sum, score) => sum + score, 0) / complexityScores.length;

    if (averageComplexity <= 1.3) return 'beginner';
    if (averageComplexity <= 2.3) return 'intermediate';
    return 'advanced';
  }

  /**
   * Generate learning resources
   */
  private generateLearningResources(concepts: string[], request: ExplanationRequest): string[] {
    const resources: string[] = [];

    // Add concept-specific resources
    const resourceMap: Record<string, string> = {
      'commands': 'MUSHCODE Command Reference - Learn about administrative and action commands',
      'attributes': 'Attribute System Guide - Understanding object data storage',
      'functions': 'Function Library - Complete reference of MUSHCODE functions',
      'conditional_logic': 'Control Flow Tutorial - Mastering if/switch statements',
      'iteration': 'Looping and Iteration - Processing lists and data sets',
      'messaging': 'Player Communication - Sending messages and notifications',
      'security': 'Security Best Practices - Protecting your MUSHCODE',
      'registers': 'Register Usage Guide - Efficient data storage techniques'
    };

    for (const concept of concepts.slice(0, 5)) { // Limit to top 5 concepts
      if (resourceMap[concept]) {
        resources.push(resourceMap[concept]);
      }
    }

    // Add general resources based on difficulty
    if (request.detailLevel === 'basic') {
      resources.push('MUSHCODE Basics - Getting started with MUD programming');
    } else if (request.detailLevel === 'advanced') {
      resources.push('Advanced MUSHCODE Techniques - Expert-level programming patterns');
    }

    return resources;
  }

  /**
   * Extract security considerations
   */
  private extractSecurityConsiderations(codeBreakdown: CodeSection[]): string[] {
    const considerations = new Set<string>();

    for (const section of codeBreakdown) {
      if (section.securityNotes) {
        for (const note of section.securityNotes) {
          considerations.add(note);
        }
      }
    }

    return Array.from(considerations);
  }

  /**
   * Extract performance notes
   */
  private extractPerformanceNotes(codeBreakdown: CodeSection[], request: ExplanationRequest): string[] {
    const notes: string[] = [];

    if (!request.focusAreas || request.focusAreas.includes('performance')) {
      const hasIteration = codeBreakdown.some(section => 
        section.functions && section.functions.includes('iter')
      );
      
      const hasNestedFunctions = codeBreakdown.some(section => 
        (section.code.match(/\(/g) || []).length > 3
      );

      if (hasIteration) {
        notes.push('Consider optimizing iterations for better performance with large datasets.');
      }

      if (hasNestedFunctions) {
        notes.push('Deeply nested functions may impact performance - consider breaking into smaller parts.');
      }

      const hasEval = codeBreakdown.some(section => 
        section.functions && section.functions.includes('eval') ||
        section.code.includes('eval(')
      );

      if (hasEval) {
        notes.push('Dynamic evaluation can be slow - use sparingly and cache results when possible.');
      }
    }

    return notes;
  }
}