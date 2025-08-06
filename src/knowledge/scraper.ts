/**
 * Web scraper for mushcode.com to build comprehensive knowledge base
 */

import { MushcodeKnowledgeBase } from './base.js';
import {
  MushcodePattern,
  CodeExample,
  Parameter
} from '../types/knowledge.js';

interface ScrapedFile {
  title: string;
  url: string;
  category: string;
  content: string;
  type: 'code' | 'class' | 'manual';
}

interface CategoryInfo {
  name: string;
  url: string;
  files: string[];
}

/**
 * Comprehensive scraper for mushcode.com
 */
export class MushcodeScraper {
  private baseUrl = 'https://mushcode.com';
  private scrapedFiles: ScrapedFile[] = [];
  private categories: CategoryInfo[] = [];

  constructor(private knowledgeBase: MushcodeKnowledgeBase) {}

  /**
   * Scrape the entire mushcode.com site
   */
  async scrapeEntireSite(): Promise<void> {
    console.log('Starting comprehensive scrape of mushcode.com...');
    
    try {
      // First, discover all categories
      await this.discoverCategories();
      
      // Then scrape each category
      for (const category of this.categories) {
        console.log(`Scraping category: ${category.name}`);
        await this.scrapeCategory(category);
        
        // Add delay to be respectful to the server
        await this.delay(1000);
      }
      
      // Process all scraped content
      await this.processScrapedContent();
      
      console.log(`Scraping completed. Processed ${this.scrapedFiles.length} files.`);
      console.log(`Final stats: ${JSON.stringify(this.knowledgeBase.getStats(), null, 2)}`);
      
    } catch (error) {
      console.error('Error during scraping:', error);
      throw error;
    }
  }

  /**
   * Discover all categories from the main page
   */
  private async discoverCategories(): Promise<void> {
    console.log('Discovering categories...');
    
    const codeCategories = [
      'Administration',
      'Building', 
      'Bulletin-Board',
      'Combat',
      'Dynamic-Space',
      'Fonts',
      'Functions',
      'Games',
      'Globals',
      'Mail-Systems',
      'Other',
      'Schedulers',
      'Time',
      'Vehicles',
      'Vendors',
      'Weather-Systems'
    ];

    const classCategories = [
      'Administration',
      'Building',
      'Globals',
      'Hardcode',
      'Other',
      'Softcode'
    ];

    // Add code categories
    for (const category of codeCategories) {
      this.categories.push({
        name: category,
        url: `${this.baseUrl}/Category/${category}`,
        files: []
      });
    }

    // Add class categories (with different base path)
    for (const category of classCategories) {
      this.categories.push({
        name: `${category}-Classes`,
        url: `${this.baseUrl}/Category/${category}`,
        files: []
      });
    }

    console.log(`Discovered ${this.categories.length} categories`);
  }

  /**
   * Scrape a specific category
   */
  private async scrapeCategory(category: CategoryInfo): Promise<void> {
    try {
      const response = await fetch(category.url);
      if (!response.ok) {
        console.warn(`Failed to fetch category ${category.name}: ${response.status}`);
        return;
      }

      const content = await response.text();
      const fileLinks = this.extractFileLinks(content);
      
      console.log(`Found ${fileLinks.length} files in ${category.name}`);
      
      // Scrape each file in the category
      for (const fileLink of fileLinks) {
        try {
          await this.scrapeFile(fileLink, category.name);
          await this.delay(500); // Be respectful to the server
        } catch (error) {
          console.warn(`Failed to scrape file ${fileLink}:`, error);
        }
      }
      
    } catch (error) {
      console.error(`Error scraping category ${category.name}:`, error);
    }
  }

  /**
   * Extract file links from category page HTML
   */
  private extractFileLinks(html: string): string[] {
    const links: string[] = [];
    
    // Look for links to /File/ pages
    const fileRegex = /href="(\/File\/[^"]+)"/g;
    let match;
    
    while ((match = fileRegex.exec(html)) !== null) {
      const link = match[1];
      if (link && !links.includes(link)) {
        links.push(link);
      }
    }
    
    return links;
  }

  /**
   * Scrape an individual file
   */
  private async scrapeFile(filePath: string, category: string): Promise<void> {
    const url = `${this.baseUrl}${filePath}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to fetch file ${url}: ${response.status}`);
        return;
      }

      const content = await response.text();
      const title = this.extractTitle(filePath);
      
      // Determine file type based on category or content
      const type = this.determineFileType(category, content);
      
      this.scrapedFiles.push({
        title,
        url,
        category,
        content,
        type
      });
      
      console.log(`Scraped: ${title}`);
      
    } catch (error) {
      console.error(`Error scraping file ${url}:`, error);
    }
  }

  /**
   * Extract title from file path
   */
  private extractTitle(filePath: string): string {
    const parts = filePath.split('/');
    const filename = parts[parts.length - 1];
    return filename ? filename.replace(/-/g, ' ').replace(/%20/g, ' ') : 'Unknown';
  }

  /**
   * Determine file type based on category and content
   */
  private determineFileType(category: string, content: string): 'code' | 'class' | 'manual' {
    if (category.includes('Classes') || content.includes('class log') || content.includes('tutorial')) {
      return 'class';
    }
    if (content.includes('manual') || content.includes('documentation')) {
      return 'manual';
    }
    return 'code';
  }

  /**
   * Process all scraped content and add to knowledge base
   */
  private async processScrapedContent(): Promise<void> {
    console.log('Processing scraped content...');
    
    for (const file of this.scrapedFiles) {
      try {
        if (file.type === 'code') {
          await this.processCodeFile(file);
        } else if (file.type === 'class') {
          await this.processClassFile(file);
        }
        // Skip manuals for now as they're typically large text files
      } catch (error) {
        console.warn(`Error processing file ${file.title}:`, error);
      }
    }
  }

  /**
   * Process a code file and extract patterns/examples
   */
  private async processCodeFile(file: ScrapedFile): Promise<void> {
    const mushcode = this.extractMushcode(file.content);
    if (!mushcode) return;

    // Create a pattern from the code
    const pattern = this.createPatternFromCode(file, mushcode);
    if (pattern) {
      this.knowledgeBase.addPattern(pattern);
    }

    // Create an example from the code
    const example = this.createExampleFromCode(file, mushcode);
    if (example) {
      this.knowledgeBase.addExample(example);
    }
  }

  /**
   * Process a class file and extract educational content
   */
  private async processClassFile(file: ScrapedFile): Promise<void> {
    // Class files are typically educational content
    const example = this.createExampleFromClass(file);
    if (example) {
      this.knowledgeBase.addExample(example);
    }
  }

  /**
   * Extract MUSHCODE from file content
   */
  private extractMushcode(content: string): string | null {
    // Look for common MUSHCODE patterns
    const mushcodePatterns = [
      /@\w+/,           // Commands starting with @
      /&\w+/,           // Attributes starting with &
      /\$[^:]+:/,       // Command patterns with $
      /switch\(/,       // Function calls
      /u\(/,            // Function calls
      /%[0-9]/          // Variables
    ];

    // Check if content contains MUSHCODE
    const hasMushcode = mushcodePatterns.some(pattern => pattern.test(content));
    if (!hasMushcode) return null;

    // Extract code blocks (simple heuristic)
    const lines = content.split('\n');
    const codeLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('@') || 
          trimmed.startsWith('&') || 
          trimmed.startsWith('$') ||
          trimmed.includes('switch(') ||
          trimmed.includes('u(')) {
        codeLines.push(trimmed);
      }
    }

    return codeLines.length > 0 ? codeLines.join('\n') : null;
  }

  /**
   * Create a pattern from code file
   */
  private createPatternFromCode(file: ScrapedFile, mushcode: string): MushcodePattern | null {
    try {
      const id = this.generateId(file.title);
      const category = this.mapCategoryToPatternCategory(file.category);
      const difficulty = this.inferDifficulty(mushcode);
      const serverCompatibility = this.inferServerCompatibility(mushcode);
      
      // Extract parameters from the code
      const parameters = this.extractParameters(mushcode);
      
      // Create template by replacing specific values with placeholders
      const template = this.createTemplate(mushcode);

      return {
        id,
        name: file.title,
        description: `MUSHCODE pattern extracted from ${file.title}`,
        category,
        codeTemplate: template,
        parameters,
        serverCompatibility,
        securityLevel: this.inferSecurityLevel(mushcode),
        examples: [mushcode],
        relatedPatterns: [],
        tags: this.extractTags(file.title, file.category, mushcode),
        difficulty,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.warn(`Error creating pattern from ${file.title}:`, error);
      return null;
    }
  }

  /**
   * Create an example from code file
   */
  private createExampleFromCode(file: ScrapedFile, mushcode: string): CodeExample | null {
    try {
      const id = this.generateId(`${file.title}-example`);
      
      return {
        id,
        title: file.title,
        description: `Code example from mushcode.com: ${file.title}`,
        code: mushcode,
        explanation: this.generateExplanation(mushcode),
        difficulty: this.inferDifficulty(mushcode),
        category: this.mapCategoryToExampleCategory(file.category),
        tags: this.extractTags(file.title, file.category, mushcode),
        serverCompatibility: this.inferServerCompatibility(mushcode),
        relatedConcepts: this.extractConcepts(mushcode),
        learningObjectives: this.generateLearningObjectives(mushcode),
        source: {
          url: file.url,
          author: 'MUSHCode.com Community'
        }
      };
    } catch (error) {
      console.warn(`Error creating example from ${file.title}:`, error);
      return null;
    }
  }

  /**
   * Create an example from class file
   */
  private createExampleFromClass(file: ScrapedFile): CodeExample | null {
    try {
      const id = this.generateId(`${file.title}-class`);
      
      return {
        id,
        title: `${file.title} (Class)`,
        description: `Educational content from mushcode.com: ${file.title}`,
        code: file.content.substring(0, 2000), // Limit length
        explanation: 'Educational class content covering MUSHCODE concepts and techniques',
        difficulty: 'intermediate',
        category: 'education',
        tags: ['class', 'tutorial', 'education'],
        serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
        relatedConcepts: ['education', 'tutorial'],
        learningObjectives: ['Understand MUSHCODE concepts', 'Learn best practices'],
        source: {
          url: file.url,
          author: 'MUSHCode.com Community'
        }
      };
    } catch (error) {
      console.warn(`Error creating class example from ${file.title}:`, error);
      return null;
    }
  }

  /**
   * Helper methods for processing
   */
  private generateId(title: string): string {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  private mapCategoryToPatternCategory(category: string): 'command' | 'function' | 'trigger' | 'attribute' | 'utility' {
    const categoryMap: Record<string, 'command' | 'function' | 'trigger' | 'attribute' | 'utility'> = {
      'Functions': 'function',
      'Building': 'command',
      'Administration': 'command',
      'Combat': 'trigger',
      'Games': 'utility',
      'Globals': 'attribute'
    };
    
    return categoryMap[category] || 'utility';
  }

  private mapCategoryToExampleCategory(category: string): string {
    return category.toLowerCase().replace('-', '_');
  }

  private inferDifficulty(code: string): 'beginner' | 'intermediate' | 'advanced' {
    const complexityIndicators = [
      /regedit\(/,      // Regular expressions
      /sql\(/,          // SQL queries  
      /iter\(/,         // Iteration
      /setq\(/,         // Variable setting
      /switch\([^)]*,[^)]*,[^)]*,/  // Complex switch statements
    ];

    const complexityScore = complexityIndicators.reduce((score, pattern) => {
      return score + (pattern.test(code) ? 1 : 0);
    }, 0);

    if (complexityScore >= 3) return 'advanced';
    if (complexityScore >= 1) return 'intermediate';
    return 'beginner';
  }

  private inferServerCompatibility(_code: string): string[] {
    const servers = ['PennMUSH', 'TinyMUSH', 'RhostMUSH'];
    
    // For now, assume most code works on all servers
    // In a more sophisticated version, we'd analyze specific functions
    return servers;
  }

  private inferSecurityLevel(code: string): 'public' | 'player' | 'builder' | 'wizard' | 'god' {
    if (code.includes('@shutdown') || code.includes('@restart')) return 'god';
    if (code.includes('@create') || code.includes('@dig')) return 'builder';
    return 'public';
  }

  private extractParameters(code: string): Parameter[] {
    const parameters: Parameter[] = [];
    
    // Look for %0, %1, etc.
    const paramMatches = code.match(/%[0-9]/g);
    if (paramMatches) {
      const uniqueParams = [...new Set(paramMatches)];
      uniqueParams.forEach((param) => {
        parameters.push({
          name: `param${param.substring(1)}`,
          type: 'string',
          description: `Parameter ${param}`,
          required: true
        });
      });
    }

    return parameters;
  }

  private createTemplate(code: string): string {
    // Replace specific values with template placeholders
    let template = code;
    
    // Replace quoted strings with placeholders
    template = template.replace(/"[^"]*"/g, '{{description}}');
    
    // Replace numbers with placeholders where appropriate
    template = template.replace(/=\d+/g, '={{value}}');
    
    return template;
  }

  private extractTags(title: string, category: string, code: string): string[] {
    const tags = new Set<string>();
    
    // Add category as tag
    tags.add(category.toLowerCase());
    
    // Extract tags from title
    const titleWords = title.toLowerCase().split(/\s+/);
    titleWords.forEach(word => {
      if (word.length > 2) tags.add(word);
    });
    
    // Extract tags from code patterns
    if (code.includes('@create')) tags.add('creation');
    if (code.includes('switch(')) tags.add('conditional');
    if (code.includes('u(')) tags.add('function');
    if (code.includes('&')) tags.add('attribute');
    
    return Array.from(tags).slice(0, 10); // Limit to 10 tags
  }

  private generateExplanation(code: string): string {
    const lines = code.split('\n');
    const firstLine = lines[0];
    
    if (firstLine?.startsWith('@create')) {
      return 'This code creates a new object and sets up its basic properties and attributes.';
    } else if (firstLine?.startsWith('&')) {
      return 'This code defines attributes and functions that can be called by other code.';
    } else if (firstLine?.startsWith('$')) {
      return 'This code defines a command that players can use to interact with the object.';
    }
    
    return 'This MUSHCODE example demonstrates common programming patterns and techniques.';
  }

  private extractConcepts(code: string): string[] {
    const concepts: string[] = [];
    
    if (code.includes('@create')) concepts.push('object-creation');
    if (code.includes('switch(')) concepts.push('conditionals');
    if (code.includes('u(')) concepts.push('functions');
    if (code.includes('&')) concepts.push('attributes');
    if (code.includes('$')) concepts.push('commands');
    if (code.includes('%')) concepts.push('variables');
    
    return concepts;
  }

  private generateLearningObjectives(code: string): string[] {
    const objectives: string[] = [];
    
    if (code.includes('@create')) {
      objectives.push('Learn object creation syntax');
    }
    if (code.includes('switch(')) {
      objectives.push('Understand conditional logic');
    }
    if (code.includes('&')) {
      objectives.push('Master attribute definition');
    }
    if (code.includes('$')) {
      objectives.push('Create interactive commands');
    }
    
    if (objectives.length === 0) {
      objectives.push('Understand MUSHCODE syntax and patterns');
    }
    
    return objectives;
  }

  /**
   * Add delay between requests
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}