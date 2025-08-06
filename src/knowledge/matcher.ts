/**
 * Pattern matching algorithms for code generation and validation
 */

import {
  MushcodePattern,
  PatternMatch,
  KnowledgeQuery,
  SecurityRule,
  CodeExample
} from '../types/knowledge.js';
import { MushcodeKnowledgeBase } from './base.js';
// Base pattern matcher implementation

/**
 * Pattern matching service for MUSHCODE knowledge base
 */
export class PatternMatcher {
  constructor(private knowledgeBase: MushcodeKnowledgeBase) {}

  /**
   * Find patterns matching a natural language description
   */
  findPatternsForGeneration(
    description: string,
    serverType?: string,
    functionType?: string,
    difficulty?: string
  ): PatternMatch[] {
    const query: KnowledgeQuery = {
      query: description,
      ...(serverType && { serverType }),
      ...(functionType && { category: functionType }),
      ...(difficulty && { difficulty }),
      includePatterns: true,
      includeExamples: false,
      fuzzyMatch: true,
      limit: 10
    };

    const results = this.knowledgeBase.search(query);
    return results.patterns;
  }

  /**
   * Find security rules that match code patterns
   */
  findSecurityViolations(code: string, serverType?: string): SecurityRule[] {
    const violations: SecurityRule[] = [];
    const codeLines = code.split('\n');

    for (const rule of this.knowledgeBase.securityRules.values()) {
      // Skip rules that don't apply to this server type
      if (serverType && rule.affectedServers.length > 0 && 
          !rule.affectedServers.includes(serverType)) {
        continue;
      }

      try {
        const pattern = new RegExp(rule.pattern, 'gi');
        
        // Check each line for pattern matches
        for (let i = 0; i < codeLines.length; i++) {
          const line = codeLines[i];
          if (line && pattern.test(line)) {
            violations.push(rule);
            break; // Don't add the same rule multiple times
          }
        }
      } catch (error) {
        // Invalid regex pattern, skip this rule
        console.warn(`Invalid regex pattern in security rule ${rule.ruleId}: ${rule.pattern}`);
      }
    }

    return violations.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Find patterns similar to existing code for optimization suggestions
   */
  findOptimizationPatterns(code: string, serverType?: string): PatternMatch[] {
    const matches: PatternMatch[] = [];
    
    // Extract key terms from the code for pattern matching
    const codeTerms = this.extractCodeTerms(code);
    
    for (const pattern of this.knowledgeBase.patterns.values()) {
      // Skip patterns not compatible with server type
      if (serverType && !pattern.serverCompatibility.includes(serverType)) {
        continue;
      }

      const relevance = this.calculateCodePatternRelevance(codeTerms, pattern);
      if (relevance > 0.3) { // Threshold for relevance
        matches.push({
          patternId: pattern.id,
          confidence: relevance,
          relevance,
          matchedTerms: this.getCodeMatchedTerms(codeTerms, pattern)
        });
      }
    }

    return matches.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
  }

  /**
   * Find examples that demonstrate similar functionality
   */
  findSimilarExamples(code: string, serverType?: string, limit = 5): CodeExample[] {
    const codeTerms = this.extractCodeTerms(code);
    const matches: Array<{example: CodeExample; relevance: number}> = [];

    for (const example of this.knowledgeBase.examples.values()) {
      // Skip examples not compatible with server type
      if (serverType && !example.serverCompatibility.includes(serverType)) {
        continue;
      }

      const relevance = this.calculateExampleCodeRelevance(codeTerms, example);
      if (relevance > 0.2) {
        matches.push({ example, relevance });
      }
    }

    return matches
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)
      .map(match => match.example);
  }

  /**
   * Extract meaningful terms from MUSHCODE for pattern matching
   */
  private extractCodeTerms(code: string): string[] {
    const terms: string[] = [];
    
    // Extract function names (words followed by parentheses)
    const functionMatches = code.match(/\b\w+(?=\()/g);
    if (functionMatches) {
      terms.push(...functionMatches);
    }

    // Extract attribute references (&attribute)
    const attributeMatches = code.match(/&\w+/g);
    if (attributeMatches) {
      terms.push(...attributeMatches.map(attr => attr.substring(1)));
    }

    // Extract variable references (%variable)
    const variableMatches = code.match(/%\w+/g);
    if (variableMatches) {
      terms.push(...variableMatches.map(var_ => var_.substring(1)));
    }

    // Extract command patterns (@command)
    const commandMatches = code.match(/@\w+/g);
    if (commandMatches) {
      terms.push(...commandMatches.map(cmd => cmd.substring(1)));
    }

    // Extract quoted strings (potential messages or descriptions)
    const stringMatches = code.match(/"[^"]*"/g);
    if (stringMatches) {
      terms.push(...stringMatches.map(str => str.slice(1, -1)));
    }

    // Extract common MUSHCODE keywords
    const keywords = ['if', 'then', 'else', 'switch', 'case', 'default', 'for', 'while', 'do'];
    const codeWords = code.toLowerCase().split(/\W+/);
    terms.push(...codeWords.filter(word => keywords.includes(word)));

    return [...new Set(terms)]; // Remove duplicates
  }

  /**
   * Calculate relevance between code terms and a pattern
   */
  private calculateCodePatternRelevance(codeTerms: string[], pattern: MushcodePattern): number {
    const patternContent = `${pattern.name} ${pattern.description} ${pattern.codeTemplate} ${pattern.tags.join(' ')}`.toLowerCase();
    let matches = 0;

    for (const term of codeTerms) {
      if (patternContent.includes(term.toLowerCase())) {
        matches++;
      }
    }

    return codeTerms.length > 0 ? matches / codeTerms.length : 0;
  }

  /**
   * Calculate relevance between code terms and an example
   */
  private calculateExampleCodeRelevance(codeTerms: string[], example: CodeExample): number {
    const exampleContent = `${example.title} ${example.description} ${example.code} ${example.tags.join(' ')}`.toLowerCase();
    let matches = 0;

    for (const term of codeTerms) {
      if (exampleContent.includes(term.toLowerCase())) {
        matches++;
      }
    }

    return codeTerms.length > 0 ? matches / codeTerms.length : 0;
  }

  /**
   * Get matched terms between code and pattern
   */
  private getCodeMatchedTerms(codeTerms: string[], pattern: MushcodePattern): string[] {
    const patternContent = `${pattern.name} ${pattern.description} ${pattern.codeTemplate} ${pattern.tags.join(' ')}`.toLowerCase();
    return codeTerms.filter(term => patternContent.includes(term.toLowerCase()));
  }

  /**
   * Find patterns by exact name match
   */
  findPatternByName(name: string): MushcodePattern | undefined {
    for (const pattern of this.knowledgeBase.patterns.values()) {
      if (pattern.name.toLowerCase() === name.toLowerCase()) {
        return pattern;
      }
    }
    return undefined;
  }

  /**
   * Find patterns by tag
   */
  findPatternsByTag(tag: string): MushcodePattern[] {
    const matches: MushcodePattern[] = [];
    
    for (const pattern of this.knowledgeBase.patterns.values()) {
      if (pattern.tags.some(t => t.toLowerCase() === tag.toLowerCase())) {
        matches.push(pattern);
      }
    }

    return matches;
  }

  /**
   * Find patterns that are related to a given pattern
   */
  findRelatedPatterns(patternId: string): MushcodePattern[] {
    const pattern = this.knowledgeBase.getPattern(patternId);
    if (!pattern) {
      return [];
    }

    const related: MushcodePattern[] = [];
    
    // Find patterns explicitly marked as related
    for (const relatedId of pattern.relatedPatterns) {
      const relatedPattern = this.knowledgeBase.getPattern(relatedId);
      if (relatedPattern) {
        related.push(relatedPattern);
      }
    }

    // Find patterns with similar tags
    const similarByTags = this.findPatternsBySimilarTags(pattern.tags, pattern.id);
    related.push(...similarByTags.slice(0, 3)); // Limit to 3 additional

    return [...new Set(related)]; // Remove duplicates
  }

  /**
   * Find patterns with similar tags
   */
  private findPatternsBySimilarTags(tags: string[], excludeId: string): MushcodePattern[] {
    const matches: Array<{pattern: MushcodePattern; commonTags: number}> = [];

    for (const pattern of this.knowledgeBase.patterns.values()) {
      if (pattern.id === excludeId) continue;

      const commonTags = pattern.tags.filter(tag => 
        tags.some(t => t.toLowerCase() === tag.toLowerCase())
      ).length;

      if (commonTags > 0) {
        matches.push({ pattern, commonTags });
      }
    }

    return matches
      .sort((a, b) => b.commonTags - a.commonTags)
      .map(match => match.pattern);
  }

  /**
   * Validate pattern template syntax
   */
  validatePatternTemplate(template: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for balanced braces
    const braceCount = (template.match(/{/g) || []).length - (template.match(/}/g) || []).length;
    if (braceCount !== 0) {
      errors.push('Unbalanced braces in template');
    }

    // Check for valid parameter placeholders
    const parameterMatches = template.match(/\{\{(\w+)\}\}/g);
    if (parameterMatches) {
      for (const match of parameterMatches) {
        const paramName = match.slice(2, -2);
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(paramName)) {
          errors.push(`Invalid parameter name: ${paramName}`);
        }
      }
    }

    // Check for common MUSHCODE syntax issues
    if (template.includes('@@')) {
      errors.push('Double @ symbols detected - potential syntax error');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}