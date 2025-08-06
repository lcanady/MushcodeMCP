/**
 * MUSHCODE compression engine
 * Compresses and minifies MUSHCODE while preserving functionality
 */

import { ServerDialect } from '../types/knowledge.js';
import { MushcodeKnowledgeBase } from '../knowledge/base.js';
import { ValidationError } from '../utils/errors.js';

export interface CompressionRequest {
  code: string;
  compressionLevel?: string | undefined;
  preserveFunctionality?: boolean | undefined;
  removeComments?: boolean | undefined;
  serverType?: string | undefined;
}

export interface CompressionResult {
  compressedCode: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  optimizationsApplied: string[];
  warnings?: string[];
}

/**
 * Compression context interface
 */
interface CompressionContext {
  code: string;
  lines: string[];
  dialect: ServerDialect | null;
  level: string;
  preserveFunctionality: boolean;
  removeComments: boolean;
  serverType: string | undefined;
}

export class MushcodeCompressor {
  constructor(private knowledgeBase: MushcodeKnowledgeBase) {}

  /**
   * Compress MUSHCODE for size optimization
   */
  async compress(request: CompressionRequest): Promise<CompressionResult> {
    this.validateRequest(request);

    const lines = request.code.split('\n');
    const context = this.createCompressionContext(request, lines);
    
    const optimizationsApplied: string[] = [];
    const warnings: string[] = [];
    let compressedLines = [...lines];

    // Apply compression strategies based on level
    if (context.level === 'minimal' || context.level === 'moderate' || context.level === 'aggressive') {
      // Remove comments if requested
      if (context.removeComments) {
        const commentResult = this.removeComments(compressedLines);
        compressedLines = commentResult.lines;
        if (commentResult.removed > 0) {
          optimizationsApplied.push(`Removed ${commentResult.removed} comment lines`);
        }
      }

      // Remove empty lines
      const emptyLineResult = this.removeEmptyLines(compressedLines);
      compressedLines = emptyLineResult.lines;
      if (emptyLineResult.removed > 0) {
        optimizationsApplied.push(`Removed ${emptyLineResult.removed} empty lines`);
      }

      // Trim whitespace
      const whitespaceResult = this.trimWhitespace(compressedLines);
      compressedLines = whitespaceResult.lines;
      if (whitespaceResult.spacesRemoved > 0) {
        optimizationsApplied.push(`Removed ${whitespaceResult.spacesRemoved} unnecessary spaces`);
      }
    }

    if (context.level === 'moderate' || context.level === 'aggressive') {
      // Compress function calls (remove spaces)
      const functionResult = this.compressFunctionCalls(compressedLines, context);
      compressedLines = functionResult.lines;
      if (functionResult.compressed > 0) {
        optimizationsApplied.push(`Compressed ${functionResult.compressed} function calls`);
        if (functionResult.warnings.length > 0) {
          warnings.push(...functionResult.warnings);
        }
      }

      // Compress variable names
      const variableResult = this.compressVariableNames(compressedLines, context);
      compressedLines = variableResult.lines;
      if (variableResult.compressed > 0) {
        optimizationsApplied.push(`Compressed ${variableResult.compressed} variable names`);
        if (variableResult.warnings.length > 0) {
          warnings.push(...variableResult.warnings);
        }
      }

      // Remove unnecessary parentheses
      const parenResult = this.removeUnnecessaryParentheses(compressedLines);
      compressedLines = parenResult.lines;
      if (parenResult.removed > 0) {
        optimizationsApplied.push(`Removed ${parenResult.removed} unnecessary parentheses`);
      }
    }

    if (context.level === 'aggressive') {
      // Merge lines where possible
      const mergeResult = this.mergeLines(compressedLines, context);
      compressedLines = mergeResult.lines;
      if (mergeResult.merged > 0) {
        optimizationsApplied.push(`Merged ${mergeResult.merged} lines`);
        if (mergeResult.warnings.length > 0) {
          warnings.push(...mergeResult.warnings);
        }
      }
    }

    const compressedCode = compressedLines.join('\n');
    const originalSize = request.code.length;
    const compressedSize = compressedCode.length;
    const compressionRatio = originalSize > 0 ? (originalSize - compressedSize) / originalSize : 0;

    const result: CompressionResult = {
      compressedCode,
      originalSize,
      compressedSize,
      compressionRatio,
      optimizationsApplied
    };

    if (warnings.length > 0) {
      result.warnings = warnings;
    }

    return result;
  }

  /**
   * Create compression context with all necessary information
   */
  private createCompressionContext(request: CompressionRequest, lines: string[]): CompressionContext {
    const dialect = request.serverType ? 
      this.knowledgeBase.dialects.get(request.serverType) || null : null;

    const level = request.compressionLevel || 'moderate';

    return {
      code: request.code,
      lines,
      dialect,
      level,
      preserveFunctionality: request.preserveFunctionality !== false,
      removeComments: request.removeComments !== false,
      serverType: request.serverType
    };
  }

  /**
   * Validate the compression request
   */
  private validateRequest(request: CompressionRequest): void {
    if (!request.code || request.code.trim().length === 0) {
      throw new ValidationError('Code is required');
    }

    if (request.code.length > 50000) {
      throw new ValidationError('Code is too long (max 50000 characters)');
    }

    if (request.serverType && this.knowledgeBase.dialects.size > 0 && !this.knowledgeBase.dialects.has(request.serverType)) {
      throw new ValidationError(`Unknown server type: ${request.serverType}`);
    }

    const validLevels = ['minimal', 'moderate', 'aggressive'];
    if (request.compressionLevel && !validLevels.includes(request.compressionLevel)) {
      throw new ValidationError(`Invalid compression level: ${request.compressionLevel}. Must be one of: ${validLevels.join(', ')}`);
    }
  }

  /**
   * Remove comment lines
   */
  private removeComments(lines: string[]): { lines: string[], removed: number } {
    let removed = 0;
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('@@') || trimmed.startsWith('//')) {
        removed++;
        return false;
      }
      return true;
    });

    return { lines: filteredLines, removed };
  }

  /**
   * Remove empty lines
   */
  private removeEmptyLines(lines: string[]): { lines: string[], removed: number } {
    let removed = 0;
    const filteredLines = lines.filter(line => {
      if (line.trim().length === 0) {
        removed++;
        return false;
      }
      return true;
    });

    return { lines: filteredLines, removed };
  }

  /**
   * Trim unnecessary whitespace
   */
  private trimWhitespace(lines: string[]): { lines: string[], spacesRemoved: number } {
    let spacesRemoved = 0;
    const trimmedLines = lines.map(line => {
      const originalLength = line.length;
      const trimmed = line.trim();
      spacesRemoved += originalLength - trimmed.length;
      return trimmed;
    });

    return { lines: trimmedLines, spacesRemoved };
  }

  /**
   * Compress variable names (registers)
   */
  private compressVariableNames(lines: string[], context: CompressionContext): { 
    lines: string[], 
    compressed: number, 
    warnings: string[] 
  } {
    const warnings: string[] = [];
    let compressed = 0;

    // Find all register variables (q0-q9, qa-qz)
    const registerMap = new Map<string, string>();
    const usedRegisters = new Set<string>();
    
    // First pass: collect all used registers
    for (const line of lines) {
      const registers = line.match(/q[0-9a-z]/g);
      if (registers) {
        registers.forEach(reg => usedRegisters.add(reg));
      }
    }

    // Create mapping to shorter register names
    const availableShort = ['q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9'];
    let shortIndex = 0;

    // Sort registers by usage frequency (longer names first for compression)
    const sortedRegisters = Array.from(usedRegisters).sort((a, b) => {
      if (a.length !== b.length) return b.length - a.length;
      return a.localeCompare(b);
    });

    for (const register of sortedRegisters) {
      if (register.length > 2 && shortIndex < availableShort.length) {
        const shortReg = availableShort[shortIndex];
        if (shortReg && !usedRegisters.has(shortReg)) {
          registerMap.set(register, shortReg);
          shortIndex++;
          compressed++;
        }
      }
    }

    // Second pass: apply replacements
    const compressedLines = lines.map(line => {
      let compressedLine = line;
      for (const [longReg, shortReg] of registerMap) {
        const regex = new RegExp(`\\b${longReg}\\b`, 'g');
        compressedLine = compressedLine.replace(regex, shortReg);
      }
      return compressedLine;
    });

    if (context.preserveFunctionality && compressed > 0) {
      warnings.push('Variable name compression may affect code readability');
    }

    return { lines: compressedLines, compressed, warnings };
  }

  /**
   * Remove unnecessary parentheses
   */
  private removeUnnecessaryParentheses(lines: string[]): { lines: string[], removed: number } {
    let removed = 0;
    
    const processedLines = lines.map(line => {
      let processed = line;
      
      // Remove parentheses around single values in simple contexts
      // Be very conservative to preserve functionality
      const patterns = [
        // Remove parentheses around single numbers: (123) -> 123
        /\((\d+)\)/g,
        // Remove parentheses around single register variables: (q0) -> q0
        /\((q[0-9a-z])\)/g
      ];

      for (const pattern of patterns) {
        const matches = processed.match(pattern);
        if (matches) {
          removed += matches.length;
          processed = processed.replace(pattern, '$1');
        }
      }

      return processed;
    });

    return { lines: processedLines, removed };
  }

  /**
   * Compress function calls by removing unnecessary spaces
   */
  private compressFunctionCalls(lines: string[], context: CompressionContext): { 
    lines: string[], 
    compressed: number, 
    warnings: string[] 
  } {
    const warnings: string[] = [];
    let compressed = 0;

    const compressedLines = lines.map(line => {
      let compressedLine = line;
      const originalLength = compressedLine.length;
      
      // Remove spaces around commas in function calls
      compressedLine = compressedLine.replace(/\s*,\s*/g, ',');
      
      // Remove spaces around equals in assignments
      compressedLine = compressedLine.replace(/\s*=\s*/g, '=');
      
      // Remove spaces around colons
      compressedLine = compressedLine.replace(/\s*:\s*/g, ':');
      
      // Remove spaces inside parentheses
      compressedLine = compressedLine.replace(/\(\s+/g, '(');
      compressedLine = compressedLine.replace(/\s+\)/g, ')');
      
      if (originalLength > compressedLine.length) {
        compressed++;
      }

      return compressedLine;
    });

    if (context.preserveFunctionality && compressed > 0) {
      warnings.push('Function call compression may affect readability');
    }

    return { lines: compressedLines, compressed, warnings };
  }

  /**
   * Merge lines where safe to do so
   */
  private mergeLines(lines: string[], context: CompressionContext): { 
    lines: string[], 
    merged: number, 
    warnings: string[] 
  } {
    const warnings: string[] = [];
    let merged = 0;
    const mergedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i];
      const nextLine = lines[i + 1];

      // Only merge very simple cases to preserve functionality
      if (currentLine && nextLine && 
          currentLine.length + nextLine.length < 80 &&
          !currentLine.includes('@@') &&
          !nextLine.includes('@@') &&
          this.canSafelyMerge(currentLine, nextLine)) {
        
        mergedLines.push(currentLine + nextLine);
        i++; // Skip the next line since we merged it
        merged++;
      } else if (currentLine !== undefined) {
        mergedLines.push(currentLine);
      }
    }

    if (context.preserveFunctionality && merged > 0) {
      warnings.push('Line merging may affect code structure and debugging');
    }

    return { lines: mergedLines, merged, warnings };
  }

  /**
   * Check if two lines can be safely merged
   */
  private canSafelyMerge(line1: string, line2: string): boolean {
    // Very conservative merging rules
    const trimmed1 = line1.trim();
    const trimmed2 = line2.trim();

    // Don't merge if either line is empty
    if (trimmed1.length === 0 || trimmed2.length === 0) {
      return false;
    }

    // Don't merge if either line contains control structures
    const controlStructures = ['@if', '@switch', '@while', '@dolist', '@break', '@assert'];
    for (const control of controlStructures) {
      if (trimmed1.includes(control) || trimmed2.includes(control)) {
        return false;
      }
    }

    // Don't merge if either line contains function definitions
    if (trimmed1.includes('&') || trimmed2.includes('&')) {
      return false;
    }

    // Don't merge if either line contains complex expressions
    if (this.calculateNestingDepth(trimmed1) > 2 || this.calculateNestingDepth(trimmed2) > 2) {
      return false;
    }

    return true;
  }

  /**
   * Calculate nesting depth of parentheses/brackets
   */
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
}