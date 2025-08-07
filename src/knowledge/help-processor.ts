/**
 * Help file processor for local MUSHCODE help files
 * Processes help files from the helps/ directory and adds them to the knowledge base
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { MushcodeKnowledgeBase } from './base.js';
import { CodeExample, MushcodePattern } from '../types/knowledge.js';
import { logger } from '../utils/logger.js';

export interface HelpEntry {
  topic: string;
  content: string;
  aliases: string[];
}

export class HelpFileProcessor {
  private knowledgeBase: MushcodeKnowledgeBase;
  private helpsDirectory: string;

  constructor(knowledgeBase: MushcodeKnowledgeBase, helpsDirectory = 'helps') {
    this.knowledgeBase = knowledgeBase;
    this.helpsDirectory = helpsDirectory;
  }

  /**
   * Process all help files in the helps directory
   */
  async processHelpFiles(): Promise<void> {
    logger.info('Starting help file processing', {
      operation: 'help_process_start',
      directory: this.helpsDirectory
    });

    try {
      const files = await readdir(this.helpsDirectory);
      const helpFiles = files.filter(file => file.endsWith('.txt'));

      logger.info(`Found ${helpFiles.length} help files`, {
        operation: 'help_files_found',
        count: helpFiles.length,
        files: helpFiles
      });

      for (const file of helpFiles) {
        try {
          await this.processHelpFile(file);
        } catch (error) {
          logger.error(`Failed to process help file ${file}`, error as Error, {
            operation: 'help_file_error',
            file
          });
        }
      }

      logger.info('Help file processing completed', {
        operation: 'help_process_complete'
      });

    } catch (error) {
      logger.error('Failed to process help files', error as Error, {
        operation: 'help_process_error'
      });
      throw error;
    }
  }

  /**
   * Process a single help file
   */
  private async processHelpFile(filename: string): Promise<void> {
    const filePath = join(this.helpsDirectory, filename);
    const content = await readFile(filePath, 'utf-8');
    
    logger.info(`Processing help file: ${filename}`, {
      operation: 'help_file_process',
      file: filename,
      size: content.length
    });

    // Parse help entries from the file
    const entries = this.parseHelpFile(content, filename);
    
    logger.info(`Extracted ${entries.length} help entries from ${filename}`, {
      operation: 'help_entries_extracted',
      file: filename,
      count: entries.length
    });

    // Convert help entries to knowledge base items
    for (const entry of entries) {
      this.addHelpEntryToKnowledgeBase(entry, filename);
    }
  }

  /**
   * Parse help file content into individual help entries
   */
  private parseHelpFile(content: string, _filename: string): HelpEntry[] {
    const entries: HelpEntry[] = [];
    const lines = content.split('\n');
    
    let currentEntry: HelpEntry | null = null;
    let contentLines: string[] = [];

    for (const line of lines) {
      // Check if this is a new help entry (starts with &)
      if (line.startsWith('& ')) {
        // Save previous entry if it exists
        if (currentEntry) {
          currentEntry.content = contentLines.join('\n').trim();
          entries.push(currentEntry);
        }

        // Start new entry
        const topicLine = line.substring(2).trim();
        const topics = topicLine.split(/\s+/);
        const mainTopic = topics[0];
        const aliases = topics.slice(1);

        if (mainTopic) {
          currentEntry = {
            topic: mainTopic,
            content: '',
            aliases: aliases
          };
        }
        contentLines = [];
      } else if (currentEntry) {
        // Add content line to current entry
        contentLines.push(line);
      }
    }

    // Don't forget the last entry
    if (currentEntry) {
      currentEntry.content = contentLines.join('\n').trim();
      entries.push(currentEntry);
    }

    return entries.filter(entry => entry.topic && entry.content);
  }

  /**
   * Add a help entry to the knowledge base
   */
  private addHelpEntryToKnowledgeBase(entry: HelpEntry, filename: string): void {
    const serverType = this.inferServerType(filename);
    
    // Create a code example from the help entry
    const example: CodeExample = {
      id: `help-${serverType}-${entry.topic.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      title: `${entry.topic} - ${serverType} Help`,
      description: `Help documentation for ${entry.topic} command/function in ${serverType}`,
      code: this.extractCodeFromHelp(entry.content),
      explanation: entry.content,
      difficulty: this.inferDifficulty(entry.content),
      category: this.inferCategory(entry.topic, entry.content),
      tags: this.extractTags(entry.topic, entry.content, entry.aliases),
      serverCompatibility: [serverType],
      relatedConcepts: this.extractConcepts(entry.content),
      learningObjectives: [
        `Understand the ${entry.topic} command/function`,
        `Learn ${serverType}-specific syntax and usage`,
        'Apply help documentation in practical scenarios'
      ],
      source: {
        url: `file://${filename}`,
        author: `${serverType} Documentation`
      }
    };

    this.knowledgeBase.addExample(example);

    // If the help entry contains command syntax, create a pattern too
    const pattern = this.createPatternFromHelp(entry, serverType);
    if (pattern) {
      this.knowledgeBase.addPattern(pattern);
    }
  }

  /**
   * Infer server type from filename
   */
  private inferServerType(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.includes('rhost')) return 'RhostMUSH';
    if (lower.includes('penn')) return 'PennMUSH';
    if (lower.includes('tiny')) return 'TinyMUSH';
    if (lower.includes('mux')) return 'TinyMUX';
    return 'Generic';
  }

  /**
   * Extract code examples from help content
   */
  private extractCodeFromHelp(content: string): string {
    // Look for lines that appear to be code examples
    const lines = content.split('\n');
    const codeLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Look for lines that start with common MUSHCODE patterns
      if (trimmed.match(/^[@&$+]/)) {
        codeLines.push(trimmed);
      }
      // Look for syntax examples
      else if (trimmed.includes('Syntax:') || trimmed.includes('Usage:')) {
        const nextLines = lines.slice(lines.indexOf(line) + 1, lines.indexOf(line) + 5);
        for (const nextLine of nextLines) {
          const nextTrimmed = nextLine.trim();
          if (nextTrimmed && !nextTrimmed.startsWith('See also:')) {
            codeLines.push(nextTrimmed);
          }
        }
      }
    }

    return codeLines.length > 0 ? codeLines.join('\n') : content.substring(0, 200) + '...';
  }

  /**
   * Create a pattern from help entry if it contains command syntax
   */
  private createPatternFromHelp(entry: HelpEntry, serverType: string): MushcodePattern | null {
    const content = entry.content.toLowerCase();
    
    // Skip if this doesn't look like a command/function
    if (!content.includes('syntax') && !entry.topic.startsWith('@') && !entry.topic.startsWith('&')) {
      return null;
    }

    return {
      id: `help-pattern-${serverType.toLowerCase()}-${entry.topic.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: `${entry.topic} Pattern`,
      description: `${entry.topic} command/function pattern from ${serverType} help`,
      category: this.inferPatternCategory(entry.topic, entry.content),
      difficulty: this.inferDifficulty(entry.content),
      serverCompatibility: [serverType],
      codeTemplate: this.extractTemplate(entry.content),
      parameters: this.extractParameters(entry.content),
      tags: this.extractTags(entry.topic, entry.content, entry.aliases),
      relatedPatterns: [],
      examples: [this.extractCodeFromHelp(entry.content)],
      securityLevel: this.inferSecurityLevel(entry.topic, entry.content),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Infer difficulty from help content
   */
  private inferDifficulty(content: string): 'beginner' | 'intermediate' | 'advanced' {
    const lower = content.toLowerCase();
    
    if (lower.includes('wizard') || lower.includes('god') || lower.includes('admin')) {
      return 'advanced';
    }
    if (lower.includes('builder') || lower.includes('complex') || lower.includes('advanced')) {
      return 'intermediate';
    }
    return 'beginner';
  }

  /**
   * Infer category from topic and content
   */
  private inferCategory(topic: string, content: string): string {
    const lower = topic.toLowerCase() + ' ' + content.toLowerCase();
    
    if (lower.includes('mail') || lower.includes('message')) return 'communication';
    if (lower.includes('channel') || lower.includes('chat')) return 'communication';
    if (lower.includes('create') || lower.includes('dig')) return 'creation';
    if (lower.includes('lock') || lower.includes('permission')) return 'security';
    if (lower.includes('function') || lower.includes('()')) return 'function';
    if (topic.startsWith('@')) return 'command';
    if (topic.startsWith('&')) return 'function';
    if (topic.startsWith('+')) return 'softcode';
    
    return 'utility';
  }

  /**
   * Infer pattern category
   */
  private inferPatternCategory(topic: string, content: string): 'command' | 'function' | 'trigger' | 'attribute' | 'utility' {
    if (topic.startsWith('@')) return 'command';
    if (topic.startsWith('&')) return 'function';
    if (content.toLowerCase().includes('trigger')) return 'trigger';
    if (content.toLowerCase().includes('attribute')) return 'attribute';
    return 'utility';
  }

  /**
   * Extract tags from topic, content, and aliases
   */
  private extractTags(topic: string, content: string, aliases: string[]): string[] {
    const tags = new Set<string>();
    
    // Add topic as tag
    tags.add(topic.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    // Add aliases as tags
    for (const alias of aliases) {
      tags.add(alias.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
    
    // Extract tags from content
    const lower = content.toLowerCase();
    if (lower.includes('mail')) tags.add('mail');
    if (lower.includes('channel')) tags.add('channel');
    if (lower.includes('lock')) tags.add('lock');
    if (lower.includes('permission')) tags.add('permission');
    if (lower.includes('wizard')) tags.add('wizard');
    if (lower.includes('builder')) tags.add('builder');
    
    return Array.from(tags).slice(0, 10);
  }

  /**
   * Extract related concepts
   */
  private extractConcepts(content: string): string[] {
    const concepts = new Set<string>();
    const lower = content.toLowerCase();
    
    if (lower.includes('lock')) concepts.add('permissions');
    if (lower.includes('mail')) concepts.add('communication');
    if (lower.includes('channel')) concepts.add('communication');
    if (lower.includes('create')) concepts.add('object-creation');
    if (lower.includes('function')) concepts.add('functions');
    if (lower.includes('command')) concepts.add('commands');
    
    return Array.from(concepts);
  }

  /**
   * Extract template from help content
   */
  private extractTemplate(content: string): string {
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('syntax:') || line.toLowerCase().includes('usage:')) {
        const nextLine = lines[lines.indexOf(line) + 1];
        if (nextLine && nextLine.trim()) {
          return nextLine.trim();
        }
      }
    }
    
    return content.split('\n')[0] || '';
  }

  /**
   * Extract parameters from help content
   */
  private extractParameters(content: string): Array<{name: string; type: string; description: string; required: boolean}> {
    const params: Array<{name: string; type: string; description: string; required: boolean}> = [];
    
    // Look for parameter descriptions in angle brackets
    const paramMatches = content.match(/<[^>]+>/g);
    if (paramMatches) {
      for (const match of paramMatches) {
        const paramName = match.slice(1, -1);
        params.push({
          name: paramName,
          type: 'string',
          description: `Parameter: ${paramName}`,
          required: true
        });
      }
    }
    
    return params;
  }

  /**
   * Infer security level
   */
  private inferSecurityLevel(_topic: string, content: string): 'public' | 'player' | 'builder' | 'wizard' | 'god' {
    const lower = content.toLowerCase();
    
    if (lower.includes('god') || lower.includes('shutdown')) return 'god';
    if (lower.includes('wizard') || lower.includes('admin')) return 'wizard';
    if (lower.includes('builder') || lower.includes('create') || lower.includes('dig')) return 'builder';
    
    return 'public';
  }
}