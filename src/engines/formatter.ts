/**
 * MUSHCODE code formatting engine
 */

import { ServerDialect } from '../types/knowledge.js';
import { MushcodeKnowledgeBase } from '../knowledge/base.js';
import { ValidationError } from '../utils/errors.js';

export interface FormattingRequest {
  code: string;
  style?: string;
  indentSize?: number;
  lineLength?: number;
  preserveComments?: boolean;
  serverType?: string;
}

export interface FormattingResult {
  formattedCode: string;
  changesMade: string[];
  styleNotes: string;
}

export type FormattingStyle = 'readable' | 'compact' | 'custom';

export class MushcodeFormatter {
  private readonly defaultIndentSize = 2;
  private readonly defaultLineLength = 80;

  constructor(private knowledgeBase: MushcodeKnowledgeBase) {}

  /**
   * Format MUSHCODE according to specified style and options
   */
  async format(request: FormattingRequest): Promise<FormattingResult> {
    this.validateRequest(request);

    const style = (request.style as FormattingStyle) || 'readable';
    const indentSize = request.indentSize ?? this.defaultIndentSize;
    const lineLength = request.lineLength ?? this.defaultLineLength;
    const preserveComments = request.preserveComments ?? true;

    // Get server dialect information
    const dialect = request.serverType ? 
      this.knowledgeBase.dialects.get(request.serverType) : 
      null;

    const changesMade: string[] = [];
    let formattedCode = request.code;

    // Apply formatting based on style
    switch (style) {
      case 'readable':
        formattedCode = this.applyReadableStyle(formattedCode, indentSize, lineLength, preserveComments, changesMade);
        break;
      case 'compact':
        formattedCode = this.applyCompactStyle(formattedCode, preserveComments, changesMade);
        break;
      case 'custom':
        formattedCode = this.applyCustomStyle(formattedCode, indentSize, lineLength, preserveComments, changesMade);
        break;
    }

    // Apply server-specific formatting
    if (dialect) {
      formattedCode = this.applyDialectFormatting(formattedCode, dialect, changesMade);
    }

    // Generate style notes
    const styleNotes = this.generateStyleNotes(style, indentSize, lineLength, preserveComments);

    return {
      formattedCode,
      changesMade,
      styleNotes
    };
  }

  /**
   * Validate the formatting request
   */
  private validateRequest(request: FormattingRequest): void {
    if (!request.code || typeof request.code !== 'string') {
      throw new ValidationError('Code is required and must be a string');
    }

    if (request.code.trim().length === 0) {
      throw new ValidationError('Code cannot be empty');
    }

    if (request.style && !['readable', 'compact', 'custom'].includes(request.style)) {
      throw new ValidationError('Style must be one of: readable, compact, custom');
    }

    if (request.indentSize !== undefined) {
      if (typeof request.indentSize !== 'number' || request.indentSize < 0 || request.indentSize > 8) {
        throw new ValidationError('Indent size must be a number between 0 and 8');
      }
    }

    if (request.lineLength !== undefined) {
      if (typeof request.lineLength !== 'number' || request.lineLength < 40 || request.lineLength > 200) {
        throw new ValidationError('Line length must be a number between 40 and 200');
      }
    }

    if (request.serverType && !this.knowledgeBase.dialects.has(request.serverType)) {
      throw new ValidationError(`Unknown server type: ${request.serverType}`);
    }
  }

  /**
   * Apply readable formatting style
   */
  private applyReadableStyle(
    code: string, 
    indentSize: number, 
    lineLength: number, 
    preserveComments: boolean,
    changesMade: string[]
  ): string {
    let formatted = code;

    // Normalize line endings
    formatted = formatted.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Remove excessive blank lines but preserve intentional spacing
    const originalBlankLines = (formatted.match(/\n\s*\n/g) || []).length;
    formatted = formatted.replace(/\n\s*\n\s*\n+/g, '\n\n');
    const newBlankLines = (formatted.match(/\n\s*\n/g) || []).length;
    if (originalBlankLines !== newBlankLines) {
      changesMade.push('Normalized blank lines');
    }

    // Add proper indentation
    formatted = this.addIndentation(formatted, indentSize, changesMade);

    // Format function calls and nested structures
    formatted = this.formatFunctionCalls(formatted, indentSize, changesMade);

    // Wrap long lines
    formatted = this.wrapLongLines(formatted, lineLength, indentSize, changesMade);

    // Format comments if preserving them
    if (preserveComments) {
      formatted = this.formatComments(formatted, changesMade);
    } else {
      const commentCount = (formatted.match(/@@[^\n]*/g) || []).length;
      formatted = formatted.replace(/@@[^\n]*/g, '');
      if (commentCount > 0) {
        changesMade.push(`Removed ${commentCount} comments`);
      }
    }

    // Add spacing around operators
    formatted = this.addOperatorSpacing(formatted, changesMade);

    return formatted.trim();
  }

  /**
   * Apply compact formatting style
   */
  private applyCompactStyle(
    code: string, 
    preserveComments: boolean,
    changesMade: string[]
  ): string {
    let formatted = code;

    // Remove all unnecessary whitespace
    formatted = formatted.replace(/\s+/g, ' ');
    changesMade.push('Removed unnecessary whitespace');

    // Remove blank lines
    formatted = formatted.replace(/\n\s*\n+/g, '\n');
    changesMade.push('Removed blank lines');

    // Remove comments unless preserving them
    if (!preserveComments) {
      const commentCount = (formatted.match(/@@[^\n]*/g) || []).length;
      formatted = formatted.replace(/@@[^\n]*/g, '');
      if (commentCount > 0) {
        changesMade.push(`Removed ${commentCount} comments`);
      }
    }

    // Compact function calls
    formatted = this.compactFunctionCalls(formatted, changesMade);

    return formatted.trim();
  }

  /**
   * Apply custom formatting style
   */
  private applyCustomStyle(
    code: string, 
    indentSize: number, 
    lineLength: number, 
    preserveComments: boolean,
    changesMade: string[]
  ): string {
    // Custom style is a balanced approach between readable and compact
    let formatted = code;

    // Normalize whitespace but keep some structure
    formatted = formatted.replace(/[ \t]+/g, ' ');
    changesMade.push('Normalized whitespace');

    // Add selective indentation for nested structures
    formatted = this.addSelectiveIndentation(formatted, indentSize, changesMade);

    // Format comments based on preference
    if (preserveComments) {
      formatted = this.formatComments(formatted, changesMade);
    } else {
      const commentCount = (formatted.match(/@@[^\n]*/g) || []).length;
      formatted = formatted.replace(/@@[^\n]*/g, '');
      if (commentCount > 0) {
        changesMade.push(`Removed ${commentCount} comments`);
      }
    }

    // Wrap only extremely long lines
    if (lineLength > 100) {
      formatted = this.wrapLongLines(formatted, lineLength, indentSize, changesMade);
    }

    return formatted.trim();
  }

  /**
   * Add proper indentation to code
   */
  private addIndentation(code: string, indentSize: number, changesMade: string[]): string {
    const lines = code.split('\n');
    const indentedLines: string[] = [];
    let currentIndent = 0;
    let indentationAdded = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.length === 0) {
        indentedLines.push('');
        continue;
      }

      // Skip comment lines for indentation logic
      if (trimmedLine.startsWith('@@')) {
        indentedLines.push(line);
        continue;
      }

      // Decrease indent for closing braces/brackets
      if (trimmedLine.startsWith('}') || trimmedLine.startsWith(']')) {
        currentIndent = Math.max(0, currentIndent - 1);
      }

      // Add indentation
      const indent = ' '.repeat(currentIndent * indentSize);
      const originalLine = line;
      const indentedLine = indent + trimmedLine;
      
      if (originalLine.trim() !== trimmedLine || (originalLine.length > 0 && !originalLine.startsWith(indent))) {
        indentationAdded = true;
      }
      
      indentedLines.push(indentedLine);

      // Increase indent for opening braces/brackets and certain MUSHCODE constructs
      if (trimmedLine.endsWith('{') || 
          trimmedLine.endsWith('[') ||
          (trimmedLine.includes('switch(') && trimmedLine.includes('{'))) {
        currentIndent++;
      }
    }

    if (indentationAdded) {
      changesMade.push(`Added ${indentSize}-space indentation`);
    }

    return indentedLines.join('\n');
  }

  /**
   * Format function calls for better readability
   */
  private formatFunctionCalls(code: string, indentSize: number, changesMade: string[]): string {
    let formatted = code;
    let functionsFormatted = false;

    // Format complex function calls with multiple parameters
    const functionPattern = /(\w+)\(([^)]{20,})\)/g;
    formatted = formatted.replace(functionPattern, (match, funcName, params) => {
      if (params.includes(',')) {
        const paramList = params.split(',').map((p: string) => p.trim());
        if (paramList.length > 2) {
          functionsFormatted = true;
          const indent = ' '.repeat(indentSize);
          return `${funcName}(\n${indent}${paramList.join(',\n' + indent)}\n)`;
        }
      }
      return match;
    });

    if (functionsFormatted) {
      changesMade.push('Formatted complex function calls');
    }

    return formatted;
  }

  /**
   * Wrap long lines
   */
  private wrapLongLines(code: string, lineLength: number, indentSize: number, changesMade: string[]): string {
    const lines = code.split('\n');
    const wrappedLines: string[] = [];
    let linesWrapped = false;

    for (const line of lines) {
      if (line.length <= lineLength) {
        wrappedLines.push(line);
        continue;
      }

      // Don't wrap comment lines
      if (line.trim().startsWith('@@')) {
        wrappedLines.push(line);
        continue;
      }

      // Try to wrap at logical points
      const wrapped = this.wrapLineAtLogicalPoints(line, lineLength, indentSize);
      if (wrapped.length > 1) {
        linesWrapped = true;
        wrappedLines.push(...wrapped);
      } else {
        wrappedLines.push(line);
      }
    }

    if (linesWrapped) {
      changesMade.push(`Wrapped lines longer than ${lineLength} characters`);
    }

    return wrappedLines.join('\n');
  }

  /**
   * Wrap a line at logical points
   */
  private wrapLineAtLogicalPoints(line: string, lineLength: number, indentSize: number): string[] {
    const indent = line.match(/^\s*/)?.[0] || '';
    const content = line.substring(indent.length);
    
    // Try to break at commas, semicolons, or logical operators
    const breakPoints = [',', ';', '&', '|'];
    
    for (const breakPoint of breakPoints) {
      const parts = content.split(breakPoint);
      if (parts.length > 1) {
        const wrapped: string[] = [];
        let currentLine = indent + parts[0];
        
        for (let i = 1; i < parts.length; i++) {
          const part = parts[i];
          const addition = breakPoint + part;
          
          if (currentLine.length + addition.length <= lineLength) {
            currentLine += addition;
          } else {
            wrapped.push(currentLine);
            currentLine = indent + ' '.repeat(indentSize) + (part?.trim() || '');
          }
        }
        
        if (currentLine.trim().length > 0) {
          wrapped.push(currentLine);
        }
        
        if (wrapped.length > 1) {
          return wrapped;
        }
      }
    }

    return [line];
  }

  /**
   * Format comments for consistency
   */
  private formatComments(code: string, changesMade: string[]): string {
    let formatted = code;
    let commentsFormatted = false;

    // Ensure comments start with @@ and have proper spacing
    formatted = formatted.replace(/^(\s*)@([^@\n])/gm, (_match, indent, content) => {
      commentsFormatted = true;
      return `${indent}@@ ${content}`;
    });

    // Ensure single space after @@ and normalize multiple spaces within comments
    formatted = formatted.replace(/@@\s{2,}/g, '@@ ');
    formatted = formatted.replace(/@@\s+([^\n]*)/g, (_match, content) => {
      return `@@ ${content.replace(/\s+/g, ' ')}`;
    });
    
    if (commentsFormatted) {
      changesMade.push('Formatted comment syntax');
    }

    return formatted;
  }

  /**
   * Add spacing around operators
   */
  private addOperatorSpacing(code: string, changesMade: string[]): string {
    let formatted = code;
    let spacingAdded = false;

    // Add spaces around comparison operators, but avoid breaking MUSHCODE syntax
    const operators = ['!=', '<=', '>=', '<', '>'];
    for (const op of operators) {
      const pattern = new RegExp(`(\\w)${op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\w)`, 'g');
      const replacement = `$1 ${op} $2`;
      const before = formatted;
      formatted = formatted.replace(pattern, replacement);
      if (before !== formatted) {
        spacingAdded = true;
      }
    }

    // Handle = operator more carefully to avoid breaking MUSHCODE syntax
    const equalPattern = /(eq\(%[^,]+),([^)]+)\)/g;
    const before = formatted;
    formatted = formatted.replace(equalPattern, '$1, $2)');
    if (before !== formatted) {
      spacingAdded = true;
    }

    if (spacingAdded) {
      changesMade.push('Added spacing around operators');
    }

    return formatted;
  }

  /**
   * Compact function calls for compact style
   */
  private compactFunctionCalls(code: string, changesMade: string[]): string {
    let formatted = code;

    // Remove unnecessary spaces in function calls
    formatted = formatted.replace(/(\w+)\s*\(\s*/g, '$1(');
    formatted = formatted.replace(/\s*\)/g, ')');
    formatted = formatted.replace(/,\s+/g, ',');
    
    changesMade.push('Compacted function calls');

    return formatted;
  }

  /**
   * Add selective indentation for custom style
   */
  private addSelectiveIndentation(code: string, indentSize: number, changesMade: string[]): string {
    const lines = code.split('\n');
    const indentedLines: string[] = [];
    let indentationAdded = false;
    let inNestedContext = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.length === 0) {
        indentedLines.push('');
        continue;
      }

      // Skip comment lines
      if (trimmedLine.startsWith('@@')) {
        indentedLines.push(line);
        continue;
      }

      // Check if we're entering a nested context
      if (trimmedLine.includes('switch(') || trimmedLine.includes('iter(')) {
        inNestedContext = true;
        indentedLines.push(line);
        continue;
      }

      // Check if we're in a nested context and should indent
      if (inNestedContext && (trimmedLine.startsWith('@pemit') || trimmedLine.startsWith('@halt'))) {
        if (!line.startsWith(' ')) {
          const indent = ' '.repeat(indentSize);
          indentedLines.push(indent + trimmedLine);
          indentationAdded = true;
        } else {
          indentedLines.push(line);
        }
      } else {
        indentedLines.push(line);
        // Reset nested context if we encounter a line that doesn't look nested
        if (!trimmedLine.includes('{') && !trimmedLine.includes('}')) {
          inNestedContext = false;
        }
      }
    }

    if (indentationAdded) {
      changesMade.push('Added selective indentation');
    }

    return indentedLines.join('\n');
  }

  /**
   * Apply server-specific dialect formatting
   */
  private applyDialectFormatting(code: string, dialect: ServerDialect, changesMade: string[]): string {
    let formatted = code;
    let dialectChanges = false;

    // Apply syntax variations specific to the dialect
    for (const rule of dialect.syntaxVariations) {
      if (rule.replacement) {
        const before = formatted;
        formatted = formatted.replace(new RegExp(rule.pattern, 'g'), rule.replacement);
        if (before !== formatted) {
          dialectChanges = true;
        }
      }
    }

    // Apply dialect-specific function formatting
    for (const func of dialect.functionLibrary) {
      // For now, we'll apply basic formatting based on function syntax
      if (func.syntax && func.syntax !== func.name) {
        const pattern = new RegExp(`\\b${func.name}\\b`, 'g');
        const before = formatted;
        // Use the syntax as the preferred format if it's different from the name
        formatted = formatted.replace(pattern, func.syntax);
        if (before !== formatted) {
          dialectChanges = true;
        }
      }
    }

    if (dialectChanges) {
      changesMade.push(`Applied ${dialect.name} dialect formatting`);
    }

    return formatted;
  }

  /**
   * Generate style notes explaining formatting choices
   */
  private generateStyleNotes(
    style: FormattingStyle, 
    indentSize: number, 
    lineLength: number, 
    preserveComments: boolean
  ): string {
    const notes: string[] = [];

    switch (style) {
      case 'readable':
        notes.push('Applied readable formatting style with proper indentation and line wrapping.');
        notes.push(`Used ${indentSize} spaces for indentation and ${lineLength} character line length.`);
        break;
      case 'compact':
        notes.push('Applied compact formatting style to minimize code size.');
        notes.push('Removed unnecessary whitespace and blank lines.');
        break;
      case 'custom':
        notes.push('Applied custom formatting style with balanced readability and compactness.');
        notes.push(`Used selective indentation with ${indentSize} spaces.`);
        break;
    }

    if (preserveComments) {
      notes.push('Comments were preserved and formatted for consistency.');
    } else {
      notes.push('Comments were removed to reduce code size.');
    }

    return notes.join(' ');
  }
}