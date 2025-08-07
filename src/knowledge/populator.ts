/**
 * Knowledge base populator for mushcode.com content
 */

import { MushcodeKnowledgeBase } from './base.js';
import { MushcodeScraper } from './scraper.js';
import { KnowledgeBasePersistence } from './persistence.js';
import {
  MushcodePattern,
  CodeExample,
  SecurityRule,
  ServerDialect,
  LearningPath
} from '../types/knowledge.js';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { GitHubScraper, GitHubRepo } from './github-scraper.js';
import { HelpFileProcessor } from './help-processor.js';

/**
 * Populates knowledge base with data from mushcode.com
 */
export class MushcodePopulator {
  private persistence: KnowledgeBasePersistence;

  constructor(private knowledgeBase: MushcodeKnowledgeBase) {
    this.persistence = new KnowledgeBasePersistence();
  }

  /**
   * Populate the knowledge base with initial data from mushcode.com
   */
  async populateFromMushcodeCom(): Promise<void> {
    console.log('Starting knowledge base population from mushcode.com...');
    
    // Add basic server dialects
    this.addServerDialects();
    
    // Add security rules
    this.addSecurityRules();
    
    // Add basic patterns
    this.addBasicPatterns();
    
    // Load templates
    await this.loadTemplates();
    
    // Add code examples
    this.addCodeExamples();
    
    // Add learning paths
    this.addLearningPaths();
    
    console.log('Knowledge base population completed.');
    console.log(`Stats: ${JSON.stringify(this.knowledgeBase.getStats(), null, 2)}`);
  }

  /**
   * Populate the knowledge base by scraping the entire mushcode.com site
   */
  async populateFromEntireSite(): Promise<void> {
    console.log('Starting comprehensive population from entire mushcode.com site...');
    
    // Add foundational data first
    this.addServerDialects();
    this.addSecurityRules();
    this.addLearningPaths();
    
    // Now scrape the entire site
    const scraper = new MushcodeScraper(this.knowledgeBase);
    await scraper.scrapeEntireSite();
    
    // Save to JSON files
    await this.persistence.save(this.knowledgeBase);
    
    console.log('Comprehensive site population completed.');
    console.log(`Final stats: ${JSON.stringify(this.knowledgeBase.getStats(), null, 2)}`);
  }

  /**
   * Load existing knowledge base from JSON files
   */
  async loadFromFiles(): Promise<MushcodeKnowledgeBase> {
    return await this.persistence.load();
  }

  /**
   * Check if saved knowledge base exists
   */
  async hasSavedData(): Promise<boolean> {
    return await this.persistence.exists();
  }

  /**
   * Get information about saved knowledge base
   */
  async getSavedInfo() {
    return await this.persistence.getInfo();
  }

  /**
   * Save current knowledge base to files
   */
  async saveToFiles(): Promise<void> {
    await this.persistence.save(this.knowledgeBase);
  }

  /**
   * Add server dialect definitions
   */
  private addServerDialects(): void {
    const pennmush: ServerDialect = {
      name: 'PennMUSH',
      version: '1.8.8',
      description: 'PennMUSH is a popular MUSH server with extensive softcode capabilities',
      syntaxVariations: [
        {
          ruleId: 'penn-switch',
          description: 'PennMUSH switch() function syntax',
          pattern: 'switch\\(([^,]+),([^,]+),([^)]+)\\)',
          serverSpecific: true,
          examples: {
            before: 'switch(condition, case1, action1, case2, action2)',
            after: 'switch(condition, case1, action1, case2, action2, default)'
          }
        }
      ],
      uniqueFeatures: [
        {
          name: 'Regexp Functions',
          description: 'Advanced regular expression support',
          syntax: 'regedit(string, pattern, replacement)',
          availability: ['1.8.0+'],
          examples: ['regedit(Hello World, l+, X)']
        }
      ],
      securityModel: {
        permissionLevels: ['guest', 'player', 'builder', 'wizard', 'god'],
        defaultLevel: 'player',
        escalationRules: [],
        restrictedFunctions: ['@shutdown', '@restart', '@dump']
      },
      functionLibrary: [
        {
          name: 'switch',
          description: 'Conditional branching function',
          syntax: 'switch(expression, case1, action1, [case2, action2, ...], [default])',
          parameters: [
            {
              name: 'expression',
              type: 'string',
              description: 'Expression to evaluate',
              required: true
            },
            {
              name: 'case',
              type: 'string',
              description: 'Case to match against',
              required: true
            }
          ],
          returnType: 'string',
          permissions: ['public'],
          examples: ['switch(%0, hello, Hi there!, goodbye, See you later!, I don\'t understand.)']
        }
      ],
      commonPatterns: [],
      limitations: ['Limited to 8192 character function returns'],
      documentation: {
        url: 'https://pennmush.org',
        version: '1.8.8',
        lastUpdated: new Date('2023-01-01')
      }
    };

    const tinymush: ServerDialect = {
      name: 'TinyMUSH',
      version: '3.3',
      description: 'TinyMUSH is a classic MUSH server implementation',
      syntaxVariations: [],
      uniqueFeatures: [
        {
          name: 'Zones',
          description: 'Hierarchical object organization',
          syntax: '@zone object=zone',
          availability: ['3.0+'],
          examples: ['@zone #123=#100']
        }
      ],
      securityModel: {
        permissionLevels: ['guest', 'player', 'builder', 'wizard', 'god'],
        defaultLevel: 'player',
        escalationRules: [],
        restrictedFunctions: ['@shutdown', '@restart']
      },
      functionLibrary: [],
      commonPatterns: [],
      limitations: [],
      documentation: {
        url: 'http://tinymush.org',
        version: '3.3'
      }
    };

    const rhostmush: ServerDialect = {
      name: 'RhostMUSH',
      version: '4.0',
      description: 'RhostMUSH is an advanced MUSH server with enhanced features',
      syntaxVariations: [],
      uniqueFeatures: [
        {
          name: 'Enhanced Security',
          description: 'Advanced security and sandboxing features',
          syntax: '@security object=level',
          availability: ['4.0+'],
          examples: ['@security #123=high']
        }
      ],
      securityModel: {
        permissionLevels: ['guest', 'player', 'builder', 'wizard', 'immortal', 'god'],
        defaultLevel: 'player',
        escalationRules: [],
        restrictedFunctions: ['@shutdown', '@restart', '@dump']
      },
      functionLibrary: [],
      commonPatterns: [],
      limitations: [],
      documentation: {
        url: 'http://rhostmush.org',
        version: '4.0'
      }
    };

    const tinymux: ServerDialect = {
      name: 'TinyMUX',
      version: '2.12',
      description: 'TinyMUX is a high-performance MUSH server implementation',
      syntaxVariations: [],
      uniqueFeatures: [
        {
          name: 'Performance Optimizations',
          description: 'Optimized for high player counts and performance',
          syntax: '@performance',
          availability: ['2.0+'],
          examples: ['@performance stats']
        }
      ],
      securityModel: {
        permissionLevels: ['guest', 'player', 'builder', 'wizard', 'god'],
        defaultLevel: 'player',
        escalationRules: [],
        restrictedFunctions: ['@shutdown', '@restart']
      },
      functionLibrary: [],
      commonPatterns: [],
      limitations: [],
      documentation: {
        url: 'http://tinymux.org',
        version: '2.12'
      }
    };

    const mux: ServerDialect = {
      name: 'MUX',
      version: '2.12',
      description: 'MUX is another name for TinyMUX server',
      syntaxVariations: [],
      uniqueFeatures: [
        {
          name: 'Compatibility Mode',
          description: 'Compatible with TinyMUX features',
          syntax: '@compat',
          availability: ['2.0+'],
          examples: ['@compat tinymux']
        }
      ],
      securityModel: {
        permissionLevels: ['guest', 'player', 'builder', 'wizard', 'god'],
        defaultLevel: 'player',
        escalationRules: [],
        restrictedFunctions: ['@shutdown', '@restart']
      },
      functionLibrary: [],
      commonPatterns: [],
      limitations: [],
      documentation: {
        url: 'http://tinymux.org',
        version: '2.12'
      }
    };

    this.knowledgeBase.addDialect(pennmush);
    this.knowledgeBase.addDialect(tinymush);
    this.knowledgeBase.addDialect(rhostmush);
    this.knowledgeBase.addDialect(tinymux);
    this.knowledgeBase.addDialect(mux);
  }

  /**
   * Add security rules for common vulnerabilities
   */
  private addSecurityRules(): void {
    const rules: SecurityRule[] = [
      {
        ruleId: 'SEC-001',
        name: 'Unsafe Eval Usage',
        description: 'Detects potentially unsafe eval() function usage with user input',
        severity: 'high',
        category: 'injection',
        pattern: '\\beval\\s*\\(\\s*%[0-9]',
        recommendation: 'Use switch() or other conditional functions instead of eval() with user input',
        examples: {
          vulnerable: 'eval(%0)',
          secure: 'switch(%0, case1, action1, case2, action2, default)',
          explanation: 'eval() with user input can execute arbitrary code. Use switch() for safe conditional logic.'
        },
        affectedServers: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
        cweId: 'CWE-94',
        references: ['https://mushcode.com/security/eval-risks']
      },
      {
        ruleId: 'SEC-002',
        name: 'Missing Permission Check',
        description: 'Administrative commands without proper permission validation',
        severity: 'medium',
        category: 'permission',
        pattern: '@(create|destroy|chown|set)\\s+[^;]*(?!.*haspower|.*controls|.*wizard)',
        recommendation: 'Add permission checks before administrative operations',
        examples: {
          vulnerable: '@create %0=%1',
          secure: '@switch [haspower(%#, Builder)]=1, {@create %0=%1}, {You need Builder powers.}',
          explanation: 'Always verify user permissions before executing administrative commands.'
        },
        affectedServers: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
        references: []
      },
      {
        ruleId: 'SEC-003',
        name: 'SQL Injection Risk',
        description: 'SQL queries with unsanitized user input',
        severity: 'critical',
        category: 'injection',
        pattern: 'sql\\s*\\([^)]*%[0-9]',
        recommendation: 'Always sanitize user input before SQL queries',
        examples: {
          vulnerable: 'sql(SELECT * FROM users WHERE name=\'%0\')',
          secure: 'sql(SELECT * FROM users WHERE name=\'[escape(%0)]\')',
          explanation: 'User input in SQL queries can lead to SQL injection attacks. Always escape input.'
        },
        affectedServers: ['PennMUSH', 'TinyMUSH'],
        cweId: 'CWE-89',
        references: []
      }
    ];

    rules.forEach(rule => this.knowledgeBase.addSecurityRule(rule));
  }

  /**
   * Add basic MUSHCODE patterns
   */
  private addBasicPatterns(): void {
    const patterns: MushcodePattern[] = [
      {
        id: 'create-object',
        name: 'Create Object',
        description: 'Creates a new object with name and description',
        category: 'command',
        codeTemplate: '@create {{name}}={{description}}',
        parameters: [
          {
            name: 'name',
            type: 'string',
            description: 'Name of the object to create',
            required: true
          },
          {
            name: 'description',
            type: 'string',
            description: 'Description of the object',
            required: false
          }
        ],
        serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX'],
        securityLevel: 'builder',
        examples: [
          '@create sword=A sharp blade',
          '@create magic ring=A ring that glows with mystical energy'
        ],
        relatedPatterns: ['set-description', 'set-attribute'],
        tags: ['creation', 'object', 'building'],
        difficulty: 'beginner',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'switch-function',
        name: 'Switch Function',
        description: 'Conditional branching based on expression matching',
        category: 'function',
        codeTemplate: 'switch({{expression}}, {{case1}}, {{action1}}, {{default}})',
        parameters: [
          {
            name: 'expression',
            type: 'string',
            description: 'Expression to evaluate and match',
            required: true
          },
          {
            name: 'case1',
            type: 'string',
            description: 'Case value to match against',
            required: true
          },
          {
            name: 'action1',
            type: 'string',
            description: 'Action to take if case matches',
            required: true
          },
          {
            name: 'default',
            type: 'string',
            description: 'Default action if no cases match',
            required: false
          }
        ],
        serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX'],
        securityLevel: 'public',
        examples: [
          'switch(%0, hello, Hi there!, goodbye, Bye!, I don\'t understand.)',
          'switch(time(), morning, Good morning!, evening, Good evening!, Hello!)'
        ],
        relatedPatterns: ['if-function', 'case-function'],
        tags: ['conditional', 'branching', 'logic'],
        difficulty: 'beginner',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'comma-function',
        name: 'Comma Formatting Function',
        description: 'Formats numbers with comma separators for readability',
        category: 'function',
        codeTemplate: '&FUNCTION-COMMA {{object}}=switch(1, and(or(strmatch(%0,-\\*), strmatch(%0,+\\*)), isnum(%0)), [left(%0,1)][u(me/u-comma, before(trim(abs(%0)), .))][switch(abs(%0), \\*.\\*, .[after(trim(abs(%0)), .)])], isnum(%0), [u(me/u-comma, before(trim(%0), .))][switch(%0, \\*.\\*, .[after(trim(%0), .)])], #-1 FUNCTION COMMA EXPECTS A NUMBER)',
        parameters: [
          {
            name: 'number',
            type: 'number',
            description: 'Number to format with commas',
            required: true,
            validation: '^-?\\d+(\\.\\d+)?$'
          }
        ],
        serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX'],
        securityLevel: 'public',
        examples: [
          'u(comma-obj/function-comma, 1234) -> 1,234',
          'u(comma-obj/function-comma, -51234.56) -> -51,234.56'
        ],
        relatedPatterns: ['number-formatting', 'display-functions'],
        tags: ['formatting', 'numbers', 'display', 'utility'],
        difficulty: 'intermediate',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'room-parent',
        name: 'Standard Room Parent',
        description: 'A comprehensive room parent with formatting and display features',
        category: 'attribute',
        codeTemplate: `@create {{name}}
@lock/Basic {{name}}==me
@set {{name}} = LINK_OK HALT NO_COMMAND
&CONFORMAT {{name}}=if(%0,[ljust(Players:,30)]Objects:[setq(0,filter(IsPlayer,%0))][setq(1,filter(IsThing,%0))][iter(lnum(max(words(%q0),words(%q1))),%r[if(first(%q0),[ljust([ansi(y,name(first(%q0)))][u(Do_Flags,first(%q0))],30)][setq(0,rest(%q0))],space(30))][if(first(%q1),[u(Thing,first(%q1))][setq(1,rest(%q1))])])])
@EXITFORMAT {{name}}=if(%0,Obvious exits:%r[iter(%0,[ansi(g,name(##))] [ansi(hg,<[first(rest(fullname(##),;),;)]>)],,%b%b%b)])`,
        parameters: [
          {
            name: 'name',
            type: 'string',
            description: 'Name of the room parent object',
            required: true
          }
        ],
        serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX'],
        securityLevel: 'builder',
        examples: [
          '@create Standard Room Parent',
          '@parent #123=Standard Room Parent'
        ],
        relatedPatterns: ['room-formatting', 'exit-formatting'],
        tags: ['building', 'rooms', 'parent', 'formatting'],
        difficulty: 'advanced',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    patterns.forEach(pattern => this.knowledgeBase.addPattern(pattern));
  }

  /**
   * Add code examples from mushcode.com
   */
  private addCodeExamples(): void {
    const examples: CodeExample[] = [
      {
        id: 'basic-object-creation',
        title: 'Basic Object Creation',
        description: 'Demonstrates how to create simple objects in MUSHCODE',
        code: `@create sword=A sharp blade
@desc sword=This is a very sharp sword that gleams in the light.
@set sword=!NO_COMMAND`,
        explanation: 'This example shows the basic steps to create an object: use @create to make it, @desc to set its description, and @set to configure its properties.',
        difficulty: 'beginner',
        category: 'creation',
        tags: ['object', 'creation', 'basic', '@create', '@desc'],
        serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX'],
        relatedConcepts: ['objects', 'descriptions', 'flags'],
        learningObjectives: [
          'Understand basic object creation syntax',
          'Learn how to set object descriptions',
          'Know how to set basic object flags'
        ],
        source: {
          url: 'https://mushcode.com',
          author: 'MUSHCode.com Community'
        }
      },
      {
        id: 'switch-conditional',
        title: 'Switch Function for Conditionals',
        description: 'Using switch() for conditional logic in MUSHCODE',
        code: `&CMD-GREET object=$greet *:@pemit %#=switch(%0, 
  hello, Hi there %n!, 
  goodbye, See you later %n!, 
  hi, Hello %n!, 
  I'm not sure what you mean by '%0'.)`,
        explanation: 'The switch() function evaluates an expression and matches it against multiple cases, executing the corresponding action. It\'s safer than eval() for user input.',
        difficulty: 'beginner',
        category: 'conditional',
        tags: ['switch', 'conditional', 'logic', 'commands'],
        serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX'],
        relatedConcepts: ['conditionals', 'user-input', 'commands'],
        learningObjectives: [
          'Understand switch() function syntax',
          'Learn conditional programming patterns',
          'Practice safe user input handling'
        ]
      },
      {
        id: 'comma-formatting',
        title: 'Number Formatting with Commas',
        description: 'Format large numbers with comma separators for better readability',
        code: `@create Comma Function
&U-COMMA Comma Function=switch(1, gt(strlen(%0), 3), [u(u-comma, left(%0, sub(strlen(%0), 3)))],[right(%0, 3)], neq(strlen(%0), 0), %0)
&FUNCTION-COMMA Comma Function=switch(1, and(or(strmatch(%0,-*), strmatch(%0,+*)), isnum(%0)), [left(%0,1)][u(me/u-comma, before(trim(abs(%0)), .))][switch(abs(%0), *.*, .[after(trim(abs(%0)), .)])], isnum(%0), [u(me/u-comma, before(trim(%0), .))][switch(%0, *.*, .[after(trim(%0), .)])], #-1 FUNCTION COMMA EXPECTS A NUMBER)
&CMD-COMMATEST Comma Function=$commatest *:@pemit %#=Formatted with commas, %0 would be [u(me/function-comma,%0)]`,
        explanation: 'This function recursively adds commas to numbers for better readability. It handles negative numbers, decimals, and validates input.',
        difficulty: 'intermediate',
        category: 'utility',
        tags: ['formatting', 'numbers', 'recursion', 'utility'],
        serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX'],
        relatedConcepts: ['recursion', 'string-manipulation', 'number-formatting'],
        learningObjectives: [
          'Understand recursive function design',
          'Learn string manipulation techniques',
          'Practice input validation'
        ],
        source: {
          url: 'https://mushcode.com/File/Comma-Function',
          author: 'FiranMUX Community'
        }
      },
      {
        id: 'room-parent-setup',
        title: 'Standard Room Parent Implementation',
        description: 'A comprehensive room parent with custom formatting',
        code: `@create Standard Room Parent
@lock/Basic Standard Room Parent==me
@set Standard Room Parent = LINK_OK HALT NO_COMMAND
&CONFORMAT Standard Room Parent=if(%0,[ljust(Players:,30)]Objects:[setq(0,filter(IsPlayer,%0))][setq(1,filter(IsThing,%0))][iter(lnum(max(words(%q0),words(%q1))),%r[if(first(%q0),[ljust([ansi(y,name(first(%q0)))][u(Do_Flags,first(%q0))],30)][setq(0,rest(%q0))],space(30))][if(first(%q1),[u(Thing,first(%q1))][setq(1,rest(%q1))])])])
@EXITFORMAT Standard Room Parent=if(%0,Obvious exits:%r[iter(%0,[ansi(g,name(##))] [ansi(hg,<[first(rest(fullname(##),;),;)]>)],,%b%b%b)])
@NAMEFORMAT Standard Room Parent=[ansi(h,if(zone(me), [[name(zone(me))]] )[name(me)])][if(or(controls(%#, me), hasflag(%#, Royalty), haspower(%#, See_All), orflags(me,VJLAd)), (%![flags(me)]))]`,
        explanation: 'This room parent provides standardized formatting for room contents, exits, and names. It includes permission-based flag display and organized content listing.',
        difficulty: 'advanced',
        category: 'building',
        tags: ['rooms', 'parent', 'formatting', 'building', 'advanced'],
        serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX', 'MUX'],
        relatedConcepts: ['room-parents', 'formatting', 'permissions', 'inheritance'],
        learningObjectives: [
          'Understand parent object concepts',
          'Learn advanced formatting techniques',
          'Practice permission-based display logic'
        ],
        source: {
          url: 'https://mushcode.com/File/Standard-Room-Parent',
          author: 'MUSHCode.com Community'
        }
      }
    ];

    examples.forEach(example => this.knowledgeBase.addExample(example));
  }

  /**
   * Load templates from JSON file
   */
  private async loadTemplates(): Promise<void> {
    try {
      const templatesPath = join(process.cwd(), 'data', 'knowledge', 'templates.json');
      const templatesData = await readFile(templatesPath, 'utf-8');
      const templates: MushcodePattern[] = JSON.parse(templatesData);
      
      templates.forEach(template => {
        // Convert date strings back to Date objects
        template.createdAt = new Date(template.createdAt);
        template.updatedAt = new Date(template.updatedAt);
        this.knowledgeBase.addPattern(template);
      });
      
      console.log(`Loaded ${templates.length} templates from templates.json`);
    } catch (error) {
      console.warn('Could not load templates:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Add learning paths for progressive skill development
   */
  private addLearningPaths(): void {
    const paths: LearningPath[] = [
      {
        id: 'mushcode-basics',
        name: 'MUSHCODE Fundamentals',
        description: 'Learn the essential concepts and syntax of MUSHCODE programming',
        difficulty: 'beginner',
        estimatedTime: '4-6 hours',
        prerequisites: ['Basic understanding of MUD/MUSH concepts'],
        steps: [
          {
            stepNumber: 1,
            title: 'Object Creation and Management',
            description: 'Learn to create and manage basic objects',
            exampleIds: ['basic-object-creation'],
            objectives: [
              'Create objects using @create',
              'Set object descriptions with @desc',
              'Understand basic object flags'
            ]
          },
          {
            stepNumber: 2,
            title: 'Conditional Logic with Switch',
            description: 'Master conditional programming with switch()',
            exampleIds: ['switch-conditional'],
            objectives: [
              'Understand switch() function syntax',
              'Implement conditional logic safely',
              'Handle user input properly'
            ]
          },
          {
            stepNumber: 3,
            title: 'Building Room Environments',
            description: 'Create and customize room environments',
            exampleIds: ['room-parent-setup'],
            objectives: [
              'Understand room parent concepts',
              'Implement custom room formatting',
              'Learn inheritance patterns'
            ]
          }
        ],
        resources: [
          {
            type: 'documentation',
            title: 'MUSHCode.com Archive',
            url: 'https://mushcode.com',
            description: 'Comprehensive archive of MUSHCODE examples and tutorials'
          },
          {
            type: 'reference',
            title: 'PennMUSH Function Reference',
            url: 'https://pennmush.org/help',
            description: 'Official PennMUSH function documentation'
          }
        ]
      },
      {
        id: 'advanced-functions',
        name: 'Advanced Function Development',
        description: 'Master complex function creation and optimization techniques',
        difficulty: 'intermediate',
        estimatedTime: '6-8 hours',
        prerequisites: ['MUSHCODE Fundamentals', 'Basic programming concepts'],
        steps: [
          {
            stepNumber: 1,
            title: 'Utility Function Design',
            description: 'Create reusable utility functions',
            exampleIds: ['comma-formatting'],
            objectives: [
              'Design recursive functions',
              'Implement input validation',
              'Create reusable utilities'
            ]
          },
          {
            stepNumber: 2,
            title: 'Security Best Practices',
            description: 'Learn secure coding practices',
            exampleIds: [],
            exercises: [
              'Identify security vulnerabilities in code samples',
              'Implement proper permission checking',
              'Sanitize user input effectively'
            ],
            objectives: [
              'Understand common security risks',
              'Implement permission-based access',
              'Validate and sanitize input'
            ]
          }
        ],
        resources: [
          {
            type: 'tutorial',
            title: 'Advanced MUSHCODE Techniques',
            url: 'https://mushcode.com/Category/Functions',
            description: 'Collection of advanced function examples'
          }
        ]
      }
    ];

    paths.forEach(path => this.knowledgeBase.addLearningPath(path));
  }

  /**
   * Populate knowledge base from local help files
   */
  async populateFromHelpFiles(): Promise<void> {
    console.log('Starting help file population...');
    
    const processor = new HelpFileProcessor(this.knowledgeBase);
    
    try {
      await processor.processHelpFiles();
      console.log('Help file population completed.');
      console.log(`Stats: ${JSON.stringify(this.knowledgeBase.getStats(), null, 2)}`);
    } catch (error) {
      console.warn('Help file processing failed, continuing with existing data:', (error as Error).message);
    }
  }

  /**
   * Populate from GitHub repositories
   */
  async populateFromGitHub(): Promise<void> {
    console.log('Starting GitHub repository population...');
    
    // Get GitHub token from environment variable
    const githubToken = process.env['GITHUB_TOKEN'];
    if (!githubToken) {
      console.log('⚠️  No GITHUB_TOKEN found - using unauthenticated requests (limited to 60/hour)');
    } else {
      console.log('✅ Using GitHub token for authenticated requests (5000/hour limit)');
    }
    
    const scraper = new GitHubScraper(this.knowledgeBase, githubToken);
    
    const repositories: GitHubRepo[] = [
      {
        owner: 'thenomain',
        name: 'GMCCG',
        description: 'Game Master\'s Creative Coding Guide - MUSHCODE examples and utilities'
      },
      {
        owner: 'thenomain',
        name: 'Mu--Support-Systems',
        description: 'MU* Support Systems - Comprehensive MUSHCODE support systems'
      },
      {
        owner: 'thenomain',
        name: 'liberation_sandbox',
        description: 'Liberation MUSH sandbox - Additional MUSHCODE examples and systems'
      }
    ];

    try {
      await scraper.scrapeRepositories(repositories);
      console.log('GitHub repository population completed.');
      console.log(`Stats: ${JSON.stringify(this.knowledgeBase.getStats(), null, 2)}`);
    } catch (error) {
      console.warn('GitHub scraping failed, continuing with existing data:', (error as Error).message);
    }
  }
}