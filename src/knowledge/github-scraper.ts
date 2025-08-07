/**
 * GitHub repository scraper for MUSHCODE content
 * Scrapes MUSHCODE files from GitHub repositories to enhance the knowledge base
 */

import { MushcodeKnowledgeBase } from './base.js';
import { MushcodePattern, CodeExample } from '../types/knowledge.js';
import { logger } from '../utils/logger.js';

export interface GitHubRepo {
  owner: string;
  name: string;
  branch?: string;
  description?: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  content: string;
  size: number;
  sha: string;
}

export class GitHubScraper {
  private knowledgeBase: MushcodeKnowledgeBase;
  private baseUrl = 'https://api.github.com';
  private token: string | undefined;

  constructor(knowledgeBase: MushcodeKnowledgeBase, token?: string) {
    this.knowledgeBase = knowledgeBase;
    this.token = token;
  }

  /**
   * Get headers for GitHub API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MUSHCODE-MCP-Server/1.0.0'
    };

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    return headers;
  }

  /**
   * Scrape MUSHCODE content from GitHub repositories
   */
  async scrapeRepositories(repos: GitHubRepo[]): Promise<void> {
    logger.info(`Starting GitHub scraping for ${repos.length} repositories`, {
      operation: 'github_scrape_start',
      repoCount: repos.length
    });

    for (const repo of repos) {
      try {
        await this.scrapeRepository(repo);
      } catch (error) {
        logger.error(`Failed to scrape repository ${repo.owner}/${repo.name}`, error as Error, {
          operation: 'github_scrape_repo_error',
          repo: `${repo.owner}/${repo.name}`
        });
      }
    }

    logger.info('GitHub scraping completed', {
      operation: 'github_scrape_complete'
    });
  }

  /**
   * Scrape a single GitHub repository
   */
  private async scrapeRepository(repo: GitHubRepo): Promise<void> {
    logger.info(`Scraping repository: ${repo.owner}/${repo.name}`, {
      operation: 'github_scrape_repo',
      repo: `${repo.owner}/${repo.name}`
    });

    try {
      // Get repository contents
      const files = await this.getRepositoryFiles(repo);
      
      // Filter for MUSHCODE files
      const mushcodeFiles = files.filter(file => this.isMushcodeFile(file));
      
      logger.info(`Found ${mushcodeFiles.length} MUSHCODE files in ${repo.owner}/${repo.name}`, {
        operation: 'github_files_found',
        fileCount: mushcodeFiles.length
      });

      // Process each MUSHCODE file
      for (const file of mushcodeFiles) {
        try {
          await this.processFile(file, repo);
        } catch (error) {
          logger.warn(`Failed to process file ${file.path}`, {
            operation: 'github_file_process_error',
            file: file.path,
            error: (error as Error).message
          });
        }
      }

    } catch (error) {
      logger.error(`Repository scraping failed for ${repo.owner}/${repo.name}`, error as Error);
      throw error;
    }
  }

  /**
   * Get all files from a GitHub repository
   */
  private async getRepositoryFiles(repo: GitHubRepo): Promise<GitHubFile[]> {
    const branch = repo.branch || 'main';
    const url = `${this.baseUrl}/repos/${repo.owner}/${repo.name}/git/trees/${branch}?recursive=1`;
    
    try {
      const response = await fetch(url, {
        headers: this.getHeaders()
      });
      if (!response.ok) {
        if (response.status === 429 || response.status === 403) {
          // Rate limited - wait and retry
          logger.warn('GitHub API rate limited, waiting 60 seconds before retry', {
            operation: 'github_rate_limit',
            repo: `${repo.owner}/${repo.name}`
          });
          await new Promise(resolve => setTimeout(resolve, 60000));
          return this.getRepositoryFiles(repo);
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as { tree: Array<{ type: string; path: string; size?: number; sha: string }> };
      const files: GitHubFile[] = [];

      // Get file contents for each file
      for (const item of data.tree) {
        if (item.type === 'blob' && this.isMushcodeFile({ name: item.path })) {
          try {
            const content = await this.getFileContent(repo, item.path);
            files.push({
              name: item.path.split('/').pop() || item.path,
              path: item.path,
              content,
              size: item.size || 0,
              sha: item.sha
            });
          } catch (error) {
            logger.warn(`Failed to get content for ${item.path}`, {
              operation: 'github_file_content_error',
              path: item.path
            });
          }
        }
      }

      return files;
    } catch (error) {
      logger.error(`Failed to get repository files for ${repo.owner}/${repo.name}`, error as Error);
      throw error;
    }
  }

  /**
   * Get content of a specific file from GitHub
   */
  private async getFileContent(repo: GitHubRepo, path: string): Promise<string> {
    const url = `${this.baseUrl}/repos/${repo.owner}/${repo.name}/contents/${path}`;
    
    // Add small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      if (response.status === 429 || response.status === 403) {
        // Rate limited - wait and retry
        logger.warn(`Rate limited getting file ${path}, waiting 60 seconds`, {
          operation: 'github_file_rate_limit',
          path
        });
        await new Promise(resolve => setTimeout(resolve, 60000));
        return this.getFileContent(repo, path);
      }
      throw new Error(`Failed to get file content: ${response.status}`);
    }

    const data = await response.json() as { encoding: string; content: string };
    
    // Decode base64 content
    if (data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    
    return data.content;
  }

  /**
   * Check if a file is a MUSHCODE file
   */
  private isMushcodeFile(file: { name: string; path?: string }): boolean {
    const mushcodeExtensions = ['.mush', '.mu', '.mushcode', '.softcode', '.txt'];
    const mushcodeKeywords = ['mushcode', 'softcode', 'mush', 'command', 'function', 'trigger'];
    
    const fileName = file.name.toLowerCase();
    const filePath = (file.path || '').toLowerCase();
    
    // Check file extension
    if (mushcodeExtensions.some(ext => fileName.endsWith(ext))) {
      return true;
    }
    
    // Check for MUSHCODE keywords in filename or path
    if (mushcodeKeywords.some(keyword => fileName.includes(keyword) || filePath.includes(keyword))) {
      return true;
    }
    
    return false;
  }

  /**
   * Process a MUSHCODE file and extract patterns/examples
   */
  private async processFile(file: GitHubFile, repo: GitHubRepo): Promise<void> {
    logger.debug(`Processing file: ${file.path}`, {
      operation: 'github_process_file',
      file: file.path,
      size: file.size
    });

    try {
      // Extract patterns and examples from the file content
      const patterns = this.extractPatterns(file, repo);
      const examples = this.extractExamples(file, repo);

      // Add to knowledge base
      for (const pattern of patterns) {
        this.knowledgeBase.addPattern(pattern);
      }

      for (const example of examples) {
        this.knowledgeBase.addExample(example);
      }

      logger.debug(`Extracted ${patterns.length} patterns and ${examples.length} examples from ${file.path}`, {
        operation: 'github_file_processed',
        patterns: patterns.length,
        examples: examples.length
      });

    } catch (error) {
      logger.error(`Failed to process file ${file.path}`, error as Error);
      throw error;
    }
  }

  /**
   * Extract MUSHCODE patterns from file content
   */
  private extractPatterns(file: GitHubFile, repo: GitHubRepo): MushcodePattern[] {
    const patterns: MushcodePattern[] = [];
    const content = file.content;
    
    // Look for function definitions
    const functionMatches = content.match(/^&[A-Z_][A-Z0-9_]*\s+[^=]+=(.+)$/gm);
    if (functionMatches) {
      for (const match of functionMatches) {
        const pattern = this.createPatternFromFunction(match, file, repo);
        if (pattern) {
          patterns.push(pattern);
        }
      }
    }

    // Look for command definitions
    const commandMatches = content.match(/^\$[^:]+:(.+)$/gm);
    if (commandMatches) {
      for (const match of commandMatches) {
        const pattern = this.createPatternFromCommand(match, file, repo);
        if (pattern) {
          patterns.push(pattern);
        }
      }
    }

    return patterns;
  }

  /**
   * Extract code examples from file content
   */
  private extractExamples(file: GitHubFile, repo: GitHubRepo): CodeExample[] {
    const examples: CodeExample[] = [];
    
    // Create a general example from the entire file if it's small enough
    if (file.content.length < 2000 && file.content.trim().length > 0) {
      const example: CodeExample = {
        id: `github-${repo.owner}-${repo.name}-${file.path.replace(/[^a-zA-Z0-9]/g, '-')}`,
        title: `${file.name} from ${repo.owner}/${repo.name}`,
        description: `MUSHCODE example from ${file.path} in ${repo.owner}/${repo.name}`,
        category: this.inferCategory(file.content),
        difficulty: this.inferDifficulty(file.content),
        serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX'],
        code: file.content.trim(),
        tags: this.extractTags(file.content, file.path),
        explanation: `This code example was extracted from ${file.path} in the ${repo.owner}/${repo.name} repository.`,
        relatedConcepts: this.extractConcepts(file.content),
        learningObjectives: [
          'Understand real-world MUSHCODE implementation',
          'Learn from community examples',
          'Practice with tested code patterns'
        ]
      };
      
      examples.push(example);
    }

    return examples;
  }

  /**
   * Create a pattern from a function definition
   */
  private createPatternFromFunction(functionCode: string, file: GitHubFile, repo: GitHubRepo): MushcodePattern | null {
    const match = functionCode.match(/^&([A-Z_][A-Z0-9_]*)\s+([^=]+)=(.+)$/);
    if (!match) return null;

    const [, functionName, , code] = match;
    if (!functionName || !code) return null;
    
    return {
      id: `github-func-${repo.owner}-${repo.name}-${functionName.toLowerCase()}`,
      name: `${functionName} Function`,
      description: `Function ${functionName} from ${repo.owner}/${repo.name}`,
      category: 'function',
      difficulty: this.inferDifficulty(code),
      serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX'],
      codeTemplate: functionCode,
      parameters: this.extractParameters(code),
      tags: this.extractTags(code, file.path),
      relatedPatterns: [],
      examples: [functionCode],
      securityLevel: this.inferSecurityLevel(code),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Create a pattern from a command definition
   */
  private createPatternFromCommand(commandCode: string, file: GitHubFile, repo: GitHubRepo): MushcodePattern | null {
    const match = commandCode.match(/^\$([^:]+):(.+)$/);
    if (!match) return null;

    const [, trigger, code] = match;
    if (!trigger || !code) return null;
    
    return {
      id: `github-cmd-${repo.owner}-${repo.name}-${trigger.replace(/[^a-zA-Z0-9]/g, '-')}`,
      name: `${trigger} Command`,
      description: `Command trigger "${trigger}" from ${repo.owner}/${repo.name}`,
      category: 'command',
      difficulty: this.inferDifficulty(code),
      serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX'],
      codeTemplate: commandCode,
      parameters: this.extractParameters(code),
      tags: this.extractTags(code, file.path),
      relatedPatterns: [],
      examples: [commandCode],
      securityLevel: this.inferSecurityLevel(code),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Infer the category of code based on content
   */
  private inferCategory(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('$') && lowerContent.includes(':')) return 'command';
    if (lowerContent.includes('&') && lowerContent.includes('=')) return 'function';
    if (lowerContent.includes('@trigger') || lowerContent.includes('@listen')) return 'trigger';
    if (lowerContent.includes('@create') || lowerContent.includes('@dig')) return 'creation';
    if (lowerContent.includes('switch(') || lowerContent.includes('if(')) return 'conditional';
    
    return 'utility';
  }

  /**
   * Infer difficulty based on code complexity
   */
  private inferDifficulty(content: string): 'beginner' | 'intermediate' | 'advanced' {
    const complexity = this.calculateComplexity(content);
    
    if (complexity < 3) return 'beginner';
    if (complexity < 7) return 'intermediate';
    return 'advanced';
  }

  /**
   * Calculate code complexity score
   */
  private calculateComplexity(content: string): number {
    let score = 0;
    
    // Count nested structures
    score += (content.match(/\[/g) || []).length * 0.5;
    score += (content.match(/switch\(/g) || []).length * 2;
    score += (content.match(/if\(/g) || []).length * 1;
    score += (content.match(/iter\(/g) || []).length * 2;
    score += (content.match(/setq\(/g) || []).length * 1;
    
    return Math.min(score, 10);
  }

  /**
   * Infer security level based on code content
   */
  private inferSecurityLevel(content: string): 'public' | 'player' | 'builder' | 'wizard' | 'god' {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('@shutdown') || lowerContent.includes('@restart')) return 'god';
    if (lowerContent.includes('@force') || lowerContent.includes('@tel')) return 'wizard';
    if (lowerContent.includes('@create') || lowerContent.includes('@dig')) return 'builder';
    
    return 'public';
  }

  /**
   * Extract parameters from code
   */
  private extractParameters(content: string): Array<{name: string; type: string; description: string; required: boolean}> {
    const params: Array<{name: string; type: string; description: string; required: boolean}> = [];
    
    // Look for %0, %1, etc.
    const paramMatches = content.match(/%[0-9]/g);
    if (paramMatches) {
      const uniqueParams = [...new Set(paramMatches)];
      for (const param of uniqueParams) {
        params.push({
          name: param,
          type: 'string',
          description: `Parameter ${param}`,
          required: true
        });
      }
    }
    
    return params;
  }

  /**
   * Extract tags from content and file path
   */
  private extractTags(content: string, filePath: string): string[] {
    const tags = new Set<string>();
    
    // Add tags based on file path
    const pathParts = filePath.toLowerCase().split('/');
    for (const part of pathParts) {
      if (part.length > 2 && part !== 'mushcode') {
        tags.add(part.replace(/[^a-zA-Z0-9]/g, ''));
      }
    }
    
    // Add tags based on content
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('switch(')) tags.add('switch');
    if (lowerContent.includes('iter(')) tags.add('iteration');
    if (lowerContent.includes('setq(')) tags.add('variables');
    if (lowerContent.includes('@create')) tags.add('creation');
    if (lowerContent.includes('@force')) tags.add('admin');
    
    return Array.from(tags).slice(0, 10); // Limit to 10 tags
  }

  /**
   * Extract related concepts from content
   */
  private extractConcepts(content: string): string[] {
    const concepts = new Set<string>();
    
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('switch(')) concepts.add('conditional-logic');
    if (lowerContent.includes('iter(')) concepts.add('iteration');
    if (lowerContent.includes('setq(')) concepts.add('variable-management');
    if (lowerContent.includes('@create')) concepts.add('object-creation');
    if (lowerContent.includes('pemit')) concepts.add('messaging');
    if (lowerContent.includes('lock')) concepts.add('permissions');
    
    return Array.from(concepts);
  }
}