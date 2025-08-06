#!/usr/bin/env node

/**
 * Comprehensive knowledge base population script
 * Populates the MUSHCODE MCP server knowledge base with extensive reference data
 */

import { MushcodeKnowledgeBase } from '../src/knowledge/base.js';
import { KnowledgeBasePersistence } from '../src/knowledge/persistence.js';
import {
  MushcodePattern,
  CodeExample,
  SecurityRule,
  ServerDialect,
  LearningPath
} from '../src/types/knowledge.js';

class ComprehensiveKnowledgePopulator {
  private knowledgeBase: MushcodeKnowledgeBase;
  private persistence: KnowledgeBasePersistence;

  constructor() {
    this.knowledgeBase = new MushcodeKnowledgeBase();
    this.persistence = new KnowledgeBasePersistence();
  }

  async populate(): Promise<void> {
    console.log('Starting comprehensive knowledge base population...');

    // Add comprehensive server dialects
    this.addComprehensiveServerDialects();
    
    // Add extensive security rules
    this.addComprehensiveSecurityRules();
    
    // Add comprehensive MUSHCODE patterns
    this.addComprehensiveMushcodePatterns();
    
    // Add extensive code examples
    this.addComprehensiveCodeExamples();
    
    // Add detailed learning paths
    this.addComprehensiveLearningPaths();
    
    // Save to files
    await this.persistence.save(this.knowledgeBase);
    
    console.log('Comprehensive knowledge base population completed!');
    console.log(`Final stats: ${JSON.stringify(this.knowledgeBase.getStats(), null, 2)}`);
  }

  /**
   * Add comprehensive server dialect definitions
   */
  private addComprehensiveServerDialects(): void {
    const dialects: ServerDialect[] = [
      {
        name: 'PennMUSH',
        version: '1.8.8',
        description: 'PennMUSH is the most popular and feature-rich MUSH server with extensive softcode capabilities and active development',
        syntaxVariations: [
          {
            ruleId: 'penn-switch',
            description: 'PennMUSH switch() function with enhanced pattern matching',
            pattern: 'switch\\(([^,]+),([^,]+),([^)]+)\\)',
            serverSpecific: true,
            examples: {
              before: 'switch(condition, case1, action1, case2, action2)',
              after: 'switch(condition, case1, action1, case2, action2, default)'
            }
          },
          {
            ruleId: 'penn-regex',
            description: 'PennMUSH regular expression functions',
            pattern: 're(match|edit|grep)\\(',
            serverSpecific: true,
            examples: {
              before: 'Basic pattern matching',
              after: 'regedit(string, pattern, replacement, flags)'
            }
          }
        ],
        uniqueFeatures: [
          {
            name: 'Regular Expressions',
            description: 'Full Perl-compatible regular expression support',
            syntax: 'regedit(string, pattern, replacement, flags)',
            availability: ['1.8.0+'],
            examples: [
              'regedit(Hello World, l+, X)',
              'rematch(test@example.com, ^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$)'
            ]
          },
          {
            name: 'SQL Support',
            description: 'Built-in SQL database connectivity',
            syntax: 'sql(query, delimiter)',
            availability: ['1.8.0+'],
            examples: [
              'sql(SELECT name FROM players WHERE level > 10)',
              'sql(INSERT INTO logs VALUES (\'[name(%#)]\', \'[secs()]\', \'%0\'))'
            ]
          }
        ],
        securityModel: {
          permissionLevels: ['guest', 'player', 'builder', 'wizard', 'god'],
          defaultLevel: 'player',
          escalationRules: [
            'Builders can create objects and rooms',
            'Wizards can modify any object',
            'God has unrestricted access'
          ],
          restrictedFunctions: [
            '@shutdown', '@restart', '@dump', '@pcreate', '@destroy',
            'sql', 'lwho', 'lplayers', '@boot', '@toad'
          ]
        },
        functionLibrary: [
          {
            name: 'switch',
            description: 'Conditional branching function with pattern matching',
            syntax: 'switch(expression, case1, action1, [case2, action2, ...], [default])',
            parameters: [
              {
                name: 'expression',
                type: 'string',
                description: 'Expression to evaluate and match against cases',
                required: true
              },
              {
                name: 'case',
                type: 'string',
                description: 'Pattern to match (supports wildcards)',
                required: true
              }
            ],
            returnType: 'string',
            permissions: ['public'],
            examples: [
              'switch(%0, hello, Hi there!, *bye*, See you later!, I don\'t understand.)'
            ]
          }
        ],
        commonPatterns: [
          'Use of %q registers for temporary storage',
          'Attribute-based function definitions with &FUNCTION-NAME'
        ],
        limitations: [
          'Function returns limited to 8192 characters',
          'Maximum recursion depth of 50'
        ],
        documentation: {
          url: 'https://pennmush.org',
          version: '1.8.8',
          lastUpdated: new Date('2023-01-01')
        }
      },
      {
        name: 'TinyMUSH',
        version: '3.3',
        description: 'TinyMUSH is a classic MUSH server implementation focusing on stability and traditional MUSH features',
        syntaxVariations: [],
        uniqueFeatures: [
          {
            name: 'Zones',
            description: 'Hierarchical object organization system',
            syntax: '@zone object=zone_object',
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
          version: '3.3',
          lastUpdated: new Date('2020-01-01')
        }
      },
      {
        name: 'RhostMUSH',
        version: '4.0',
        description: 'RhostMUSH is an advanced MUSH server with extensive customization options',
        syntaxVariations: [],
        uniqueFeatures: [
          {
            name: 'Extended Functions',
            description: 'Enhanced versions of standard functions',
            syntax: 'x<function_name>(arguments)',
            availability: ['4.0+'],
            examples: ['xget(object/attribute, default_value)']
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
          url: 'http://www.rhostmush.org',
          version: '4.0',
          lastUpdated: new Date('2022-01-01')
        }
      }
    ];

    dialects.forEach(dialect => this.knowledgeBase.addDialect(dialect));
    console.log(`Added ${dialects.length} comprehensive server dialects`);
  }
 /**
   * Add comprehensive security rules
   */
  private addComprehensiveSecurityRules(): void {
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
      },
      {
        ruleId: 'SEC-004',
        name: 'Unvalidated User Input in Commands',
        description: 'Command handlers that don\'t validate user input parameters',
        severity: 'medium',
        category: 'validation',
        pattern: '\\$[^:]+:\\s*@\\w+\\s+%[0-9]',
        recommendation: 'Always validate user input in command handlers',
        examples: {
          vulnerable: '$test *:@create %0',
          secure: '$test *:@switch [isname(%0)]=1, {@create %0}, {Invalid name.}',
          explanation: 'User input should be validated before use in commands to prevent abuse.'
        },
        affectedServers: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
        references: []
      },
      {
        ruleId: 'SEC-005',
        name: 'Hardcoded Database References',
        description: 'Code that relies on hardcoded database reference numbers',
        severity: 'low',
        category: 'maintainability',
        pattern: '#\\d{1,5}(?!\\s*\\])',
        recommendation: 'Use named references or configuration attributes instead of hardcoded dbrefs',
        examples: {
          vulnerable: '@tel %# = #100',
          secure: '@tel %# = [v(HOME_ROOM)]',
          explanation: 'Hardcoded dbrefs break when databases are rebuilt. Use named references.'
        },
        affectedServers: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
        references: []
      }
    ];

    rules.forEach(rule => this.knowledgeBase.addSecurityRule(rule));
    console.log(`Added ${rules.length} comprehensive security rules`);
  }  
/**
   * Add comprehensive MUSHCODE patterns
   */
  private addComprehensiveMushcodePatterns(): void {
    const patterns: MushcodePattern[] = [
      {
        id: 'basic-command',
        name: 'Basic Command',
        description: 'A simple command that responds to user input',
        category: 'command',
        codeTemplate: '&CMD.%{COMMAND_NAME} %{OBJECT}=$+%{command_name} *:@pemit %#=%{response_message}',
        parameters: [
          {
            name: 'command_name',
            type: 'string',
            description: 'Name of the command',
            required: true
          },
          {
            name: 'response_message',
            type: 'string', 
            description: 'Message to display to user',
            required: true
          }
        ],
        serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
        securityLevel: 'public',
        examples: [
          '&CMD.HELLO me=$+hello *:@pemit %#=Hello, %0!'
        ],
        relatedPatterns: [],
        tags: ['basic', 'command', 'user-input'],
        difficulty: 'beginner',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'function-with-validation',
        name: 'Function with Input Validation',
        description: 'A function that validates input parameters before processing',
        category: 'function',
        codeTemplate: '&FUN.%{FUNCTION_NAME} %{OBJECT}=[switch(words(%0),0,#-1 ERROR: No input provided,gt(words(%0),5),#-1 ERROR: Too many parameters,%{function_body})]',
        parameters: [
          {
            name: 'function_name',
            type: 'string',
            description: 'Name of the function',
            required: true
          },
          {
            name: 'function_body',
            type: 'string',
            description: 'Main function logic',
            required: true
          }
        ],
        serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
        securityLevel: 'public',
        examples: [
          '&FUN.ADDNUMS me=[switch(words(%0),0,#-1 ERROR: No input provided,gt(words(%0),2),#-1 ERROR: Too many parameters,add(first(%0),last(%0)))]'
        ],
        relatedPatterns: [],
        tags: ['function', 'validation', 'error-handling'],
        difficulty: 'intermediate',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'secure-admin-command',
        name: 'Secure Admin Command',
        description: 'An administrative command with permission checking',
        category: 'command',
        codeTemplate: '&CMD.%{COMMAND_NAME} %{OBJECT}=$+%{command_name} *:@switch orflags(%#,Ww)=0,{@pemit %#=Permission denied.},{%{admin_action}}',
        parameters: [
          {
            name: 'command_name',
            type: 'string',
            description: 'Name of the admin command',
            required: true
          },
          {
            name: 'admin_action',
            type: 'string',
            description: 'Action to perform with admin privileges',
            required: true
          }
        ],
        serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
        securityLevel: 'wizard',
        examples: [
          '&CMD.SHUTDOWN me=$+shutdown *:@switch orflags(%#,Ww)=0,{@pemit %#=Permission denied.},{@shutdown %0}'
        ],
        relatedPatterns: [],
        tags: ['admin', 'security', 'permissions'],
        difficulty: 'advanced',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'data-storage-attribute',
        name: 'Data Storage Attribute',
        description: 'An attribute for storing and retrieving structured data',
        category: 'attribute',
        codeTemplate: '&DATA.%{DATA_NAME} %{OBJECT}=%{initial_value}\n&FUN.GET_%{DATA_NAME} %{OBJECT}=[get(me/DATA.%{DATA_NAME})]\n&FUN.SET_%{DATA_NAME} %{OBJECT}=[set(me,DATA.%{DATA_NAME}:%0)]',
        parameters: [
          {
            name: 'data_name',
            type: 'string',
            description: 'Name of the data attribute',
            required: true
          },
          {
            name: 'initial_value',
            type: 'string',
            description: 'Initial value for the data',
            required: false,
            defaultValue: ''
          }
        ],
        serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
        securityLevel: 'builder',
        examples: [
          '&DATA.SCORES me=\n&FUN.GET_SCORES me=[get(me/DATA.SCORES)]\n&FUN.SET_SCORES me=[set(me,DATA.SCORES:%0)]'
        ],
        relatedPatterns: [],
        tags: ['data', 'storage', 'attribute'],
        difficulty: 'beginner',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    patterns.forEach(pattern => this.knowledgeBase.addPattern(pattern));
    console.log(`Added ${patterns.length} comprehensive MUSHCODE patterns`);
  }

  /**
   * Add comprehensive code examples
   */
  private addComprehensiveCodeExamples(): void {
    const examples: CodeExample[] = [
      {
        id: 'basic-object-creation',
        title: 'Basic Object Creation',
        description: 'Demonstrates how to create simple objects in MUSHCODE',
        code: `@create sword=A sharp blade
@desc sword=This is a very sharp sword that gleams in the light.
@set sword=!NO_COMMAND
@lock sword==me`,
        explanation: 'This example shows the basic steps to create an object: use @create to make it, @desc to set its description, @set to configure its properties, and @lock to control access.',
        difficulty: 'beginner',
        category: 'creation',
        tags: ['object', 'creation', 'basic', '@create', '@desc', '@set', '@lock'],
        serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
        relatedConcepts: ['objects', 'descriptions', 'flags', 'locks'],
        learningObjectives: [
          'Understand basic object creation syntax',
          'Learn how to set object descriptions',
          'Know how to set basic object flags',
          'Understand basic locking mechanisms'
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
  *morning*, Good morning %n!,
  *evening*, Good evening %n!,
  I'm not sure what you mean by '%0'.)`,
        explanation: 'The switch() function evaluates an expression and matches it against multiple cases, executing the corresponding action. It supports wildcard matching with * and is safer than eval() for user input.',
        difficulty: 'beginner',
        category: 'conditional',
        tags: ['switch', 'conditional', 'logic', 'commands', 'wildcards'],
        serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
        relatedConcepts: ['conditionals', 'user-input', 'commands', 'pattern-matching'],
        learningObjectives: [
          'Understand switch() function syntax',
          'Learn conditional programming patterns',
          'Practice safe user input handling',
          'Master wildcard pattern matching'
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
        explanation: 'This function recursively adds commas to numbers for better readability. It handles negative numbers, decimals, and validates input. The recursive u-comma function processes the number in chunks of three digits.',
        difficulty: 'intermediate',
        category: 'utility',
        tags: ['formatting', 'numbers', 'recursion', 'utility', 'validation'],
        serverCompatibility: ['PennMUSH', 'TinyMUSH'],
        relatedConcepts: ['recursion', 'string-manipulation', 'number-formatting', 'input-validation'],
        learningObjectives: [
          'Understand recursive function design',
          'Learn string manipulation techniques',
          'Practice input validation',
          'Master number formatting patterns'
        ],
        source: {
          url: 'https://mushcode.com/File/Comma-Function',
          author: 'FiranMUX Community'
        }
      }
    ];

    examples.forEach(example => this.knowledgeBase.addExample(example));
    console.log(`Added ${examples.length} comprehensive code examples`);
  }
 /**
   * Add comprehensive learning paths
   */
  private addComprehensiveLearningPaths(): void {
    const paths: LearningPath[] = [
      {
        id: 'mushcode-basics',
        name: 'MUSHCODE Fundamentals',
        description: 'Learn the essential concepts and syntax of MUSHCODE programming from the ground up',
        difficulty: 'beginner',
        estimatedTime: '8-12 hours',
        prerequisites: ['Basic understanding of MUD/MUSH concepts', 'Familiarity with text-based interfaces'],
        steps: [
          {
            stepNumber: 1,
            title: 'Understanding Objects and Attributes',
            description: 'Learn the fundamental building blocks of MUSHCODE',
            exampleIds: ['basic-object-creation'],
            objectives: [
              'Create objects using @create command',
              'Set object descriptions with @desc',
              'Understand basic object flags and their purposes',
              'Learn about attribute storage and retrieval'
            ]
          },
          {
            stepNumber: 2,
            title: 'Conditional Logic and Flow Control',
            description: 'Master conditional programming with switch() and other control structures',
            exampleIds: ['switch-conditional'],
            objectives: [
              'Understand switch() function syntax and use cases',
              'Implement safe conditional logic patterns',
              'Handle user input validation properly',
              'Learn wildcard pattern matching techniques'
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
        id: 'intermediate-programming',
        name: 'Intermediate MUSHCODE Programming',
        description: 'Advance your skills with complex functions, data management, and system design',
        difficulty: 'intermediate',
        estimatedTime: '12-16 hours',
        prerequisites: ['MUSHCODE Fundamentals', 'Basic programming concepts'],
        steps: [
          {
            stepNumber: 1,
            title: 'Advanced Function Design',
            description: 'Create sophisticated utility functions with proper error handling',
            exampleIds: ['comma-formatting'],
            objectives: [
              'Design recursive functions safely',
              'Implement comprehensive input validation',
              'Create reusable utility libraries',
              'Handle edge cases and error conditions'
            ]
          }
        ],
        resources: [
          {
            type: 'tutorial',
            title: 'Advanced MUSHCODE Techniques',
            url: 'https://mushcode.com/Category/Functions',
            description: 'Collection of advanced function examples and patterns'
          }
        ]
      }
    ];

    paths.forEach(path => this.knowledgeBase.addLearningPath(path));
    console.log(`Added ${paths.length} comprehensive learning paths`);
  }
}

// Main execution
async function main() {
  const populator = new ComprehensiveKnowledgePopulator();
  await populator.populate();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ComprehensiveKnowledgePopulator };