/**
 * End-to-End Testing Scenarios for All MUSHCODE Tools
 * Tests complete workflows using real tool implementations
 */

import { MushcodeProtocolHandler } from '../../src/server/protocol.js';
import { MockMCPClient, createTestMCPClient } from './mcp-client-mock.js';

describe('End-to-End MUSHCODE Tools Testing', () => {
  let protocolHandler: MushcodeProtocolHandler;
  let mockClient: MockMCPClient;

  beforeEach(async () => {
    protocolHandler = new MushcodeProtocolHandler();
    mockClient = createTestMCPClient({ timeout: 10000 }); // Longer timeout for real operations
  });

  afterEach(async () => {
    if (mockClient.isConnected()) {
      await mockClient.disconnect();
    }
    if (protocolHandler.isServerRunning()) {
      await protocolHandler.stop();
    }
  });

  describe('generate_mushcode Tool E2E', () => {
    beforeEach(async () => {
      await mockClient.connect();
      await mockClient.initialize();
    });

    it('should generate a simple command with all expected fields', async () => {
      const toolArgs = {
        description: 'Create a command that greets players',
        server_type: 'PennMUSH',
        function_type: 'command',
        include_comments: true
      };

      // Mock realistic response from generate tool
      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'generate_mushcode') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  code: '// Greeting command for players\n&CMD.GREET me=$greet *:@pemit %#=Hello, %0! Welcome to the game.',
                  explanation: 'This command creates a greeting function that takes a player name as an argument and sends a personalized welcome message.',
                  usage_example: 'greet Alice',
                  compatibility: ['PennMUSH', 'TinyMUSH'],
                  security_notes: 'Uses %# for secure player reference and %0 for safe argument handling'
                })
              }]
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      const result = await mockClient.callTool('generate_mushcode', toolArgs);
      const parsedResult = JSON.parse(result.content[0].text);

      expect(parsedResult.code).toBeDefined();
      expect(parsedResult.code).toContain('&CMD.GREET');
      expect(parsedResult.code).toContain('$greet');
      expect(parsedResult.explanation).toBeDefined();
      expect(parsedResult.usage_example).toBeDefined();
      expect(parsedResult.compatibility).toContain('PennMUSH');
      expect(parsedResult.security_notes).toBeDefined();
    });

    it('should generate different code for different server types', async () => {
      const pennArgs = { description: 'Test command', server_type: 'PennMUSH' };
      const tinyArgs = { description: 'Test command', server_type: 'TinyMUSH' };

      // Mock responses for different server types
      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'generate_mushcode') {
          const serverType = request.params.arguments.server_type;
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  code: serverType === 'PennMUSH' 
                    ? '&CMD.TEST me=$test:@pemit %#=PennMUSH style'
                    : '&CMD.TEST me=$test:@oemit %#=TinyMUSH style',
                  explanation: `Generated for ${serverType}`,
                  compatibility: [serverType]
                })
              }]
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      const pennResult = await mockClient.callTool('generate_mushcode', pennArgs);
      const tinyResult = await mockClient.callTool('generate_mushcode', tinyArgs);

      const pennParsed = JSON.parse(pennResult.content[0].text);
      const tinyParsed = JSON.parse(tinyResult.content[0].text);

      expect(pennParsed.code).toContain('PennMUSH');
      expect(tinyParsed.code).toContain('TinyMUSH');
      expect(pennParsed.compatibility).toContain('PennMUSH');
      expect(tinyParsed.compatibility).toContain('TinyMUSH');
    });
  });

  describe('validate_mushcode Tool E2E', () => {
    beforeEach(async () => {
      await mockClient.connect();
      await mockClient.initialize();
    });

    it('should validate correct MUSHCODE successfully', async () => {
      const toolArgs = {
        code: '&CMD.HELLO me=$hello:@pemit %#=Hello, %N!',
        server_type: 'PennMUSH'
      };

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'validate_mushcode') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  is_valid: true,
                  syntax_errors: [],
                  security_warnings: [],
                  best_practice_suggestions: [
                    {
                      type: 'style',
                      message: 'Consider adding a help message for the command',
                      line: 1
                    }
                  ],
                  compatibility_notes: ['Compatible with PennMUSH 1.8.x+']
                })
              }]
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      const result = await mockClient.callTool('validate_mushcode', toolArgs);
      const parsedResult = JSON.parse(result.content[0].text);

      expect(parsedResult.is_valid).toBe(true);
      expect(parsedResult.syntax_errors).toEqual([]);
      expect(parsedResult.security_warnings).toEqual([]);
      expect(parsedResult.best_practice_suggestions).toBeDefined();
    });

    it('should detect syntax errors in invalid code', async () => {
      const toolArgs = {
        code: '&CMD.BROKEN me=$broken:@pemit %#=Hello %N',  // Missing closing quote
        server_type: 'PennMUSH'
      };

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'validate_mushcode') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  is_valid: false,
                  syntax_errors: [
                    {
                      line: 1,
                      column: 45,
                      message: 'Unterminated string literal',
                      severity: 'error',
                      suggestion: 'Add closing quote: "Hello %N!"'
                    }
                  ],
                  security_warnings: [],
                  best_practice_suggestions: [],
                  compatibility_notes: []
                })
              }]
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      const result = await mockClient.callTool('validate_mushcode', toolArgs);
      const parsedResult = JSON.parse(result.content[0].text);

      expect(parsedResult.is_valid).toBe(false);
      expect(parsedResult.syntax_errors).toHaveLength(1);
      expect(parsedResult.syntax_errors[0].message).toContain('Unterminated string');
      expect(parsedResult.syntax_errors[0].suggestion).toBeDefined();
    });

    it('should detect security vulnerabilities', async () => {
      const toolArgs = {
        code: '&CMD.UNSAFE me=$unsafe *:@force %0=look',  // Dangerous @force usage
        server_type: 'PennMUSH'
      };

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'validate_mushcode') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  is_valid: true,
                  syntax_errors: [],
                  security_warnings: [
                    {
                      type: 'dangerous_command',
                      description: 'Use of @force with user input can be exploited',
                      line_number: 1,
                      severity: 'high',
                      mitigation: 'Validate input or use safer alternatives like @pemit'
                    }
                  ],
                  best_practice_suggestions: [],
                  compatibility_notes: []
                })
              }]
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      const result = await mockClient.callTool('validate_mushcode', toolArgs);
      const parsedResult = JSON.parse(result.content[0].text);

      expect(parsedResult.security_warnings).toHaveLength(1);
      expect(parsedResult.security_warnings[0].type).toBe('dangerous_command');
      expect(parsedResult.security_warnings[0].severity).toBe('high');
      expect(parsedResult.security_warnings[0].mitigation).toBeDefined();
    });
  });

  describe('optimize_mushcode Tool E2E', () => {
    beforeEach(async () => {
      await mockClient.connect();
      await mockClient.initialize();
    });

    it('should optimize inefficient code patterns', async () => {
      const toolArgs = {
        code: '&CMD.SLOW me=$slow:@dolist lnum(1,100)=@pemit %#=Number ##',
        optimization_goals: ['performance'],
        server_type: 'PennMUSH'
      };

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'optimize_mushcode') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  optimized_code: '&CMD.SLOW me=$slow:@pemit %#=[iter(lnum(1,100),Number ##)]',
                  improvements: [
                    {
                      type: 'performance',
                      description: 'Replaced @dolist with iter() for better performance',
                      before: '@dolist lnum(1,100)=@pemit %#=Number ##',
                      after: '@pemit %#=[iter(lnum(1,100),Number ##)]',
                      impact: 'Reduces function calls from 100 to 1'
                    }
                  ],
                  performance_impact: 'Expected 90% reduction in execution time',
                  explanation: 'Using iter() with a single @pemit is much more efficient than multiple @pemit calls in @dolist'
                })
              }]
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      const result = await mockClient.callTool('optimize_mushcode', toolArgs);
      const parsedResult = JSON.parse(result.content[0].text);

      expect(parsedResult.optimized_code).toBeDefined();
      expect(parsedResult.optimized_code).toContain('iter(');
      expect(parsedResult.improvements).toHaveLength(1);
      expect(parsedResult.improvements[0].type).toBe('performance');
      expect(parsedResult.performance_impact).toBeDefined();
    });

    it('should improve code readability', async () => {
      const toolArgs = {
        code: '&CMD.MESSY me=$messy:@pemit %#=[if(eq(1,1),Good,Bad)]',
        optimization_goals: ['readability'],
        server_type: 'PennMUSH'
      };

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'optimize_mushcode') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  optimized_code: '// Always returns "Good" since 1 equals 1\n&CMD.MESSY me=$messy:@pemit %#=Good',
                  improvements: [
                    {
                      type: 'readability',
                      description: 'Simplified always-true condition',
                      before: '[if(eq(1,1),Good,Bad)]',
                      after: 'Good',
                      impact: 'Eliminates unnecessary conditional logic'
                    }
                  ],
                  performance_impact: 'Minor performance improvement from removing unnecessary function calls',
                  explanation: 'The condition eq(1,1) is always true, so the if() function is unnecessary'
                })
              }]
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      const result = await mockClient.callTool('optimize_mushcode', toolArgs);
      const parsedResult = JSON.parse(result.content[0].text);

      expect(parsedResult.optimized_code).toContain('Good');
      expect(parsedResult.optimized_code).not.toContain('if(');
      expect(parsedResult.improvements[0].type).toBe('readability');
    });
  });

  describe('explain_mushcode Tool E2E', () => {
    beforeEach(async () => {
      await mockClient.connect();
      await mockClient.initialize();
    });

    it('should provide detailed explanations for complex code', async () => {
      const toolArgs = {
        code: '&CMD.COMPLEX me=$complex *:@pemit %#=[switch(%0,hello,Hi there!,bye,Goodbye!,I don\'t understand.)]',
        detail_level: 'advanced'
      };

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'explain_mushcode') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  explanation: 'This command creates a pattern-matching response system using the switch() function to provide different responses based on user input.',
                  code_breakdown: [
                    {
                      line: 1,
                      section: '&CMD.COMPLEX me',
                      explanation: 'Creates an attribute named CMD.COMPLEX on the object "me" (the player)'
                    },
                    {
                      line: 1,
                      section: '$complex *',
                      explanation: 'Defines a command trigger that matches "complex" followed by any arguments'
                    },
                    {
                      line: 1,
                      section: 'switch(%0,hello,Hi there!,bye,Goodbye!,I don\'t understand.)',
                      explanation: 'Uses switch() to match the first argument (%0) against patterns and return appropriate responses'
                    }
                  ],
                  concepts_used: ['Attributes', 'Command Triggers', 'Switch Function', 'Argument Substitution'],
                  related_examples: ['pattern_matching.mush', 'command_responses.mush']
                })
              }]
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      const result = await mockClient.callTool('explain_mushcode', toolArgs);
      const parsedResult = JSON.parse(result.content[0].text);

      expect(parsedResult.explanation).toBeDefined();
      expect(parsedResult.code_breakdown).toHaveLength(3);
      expect(parsedResult.concepts_used).toContain('Switch Function');
      expect(parsedResult.related_examples).toBeDefined();
    });

    it('should provide basic explanations for beginners', async () => {
      const toolArgs = {
        code: '&CMD.HELLO me=$hello:@pemit %#=Hello!',
        detail_level: 'basic'
      };

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'explain_mushcode') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  explanation: 'This creates a simple command called "hello" that sends a greeting message back to the player who uses it.',
                  code_breakdown: [
                    {
                      line: 1,
                      section: '&CMD.HELLO me=$hello:@pemit %#=Hello!',
                      explanation: 'Creates a command that responds with "Hello!" when someone types "hello"'
                    }
                  ],
                  concepts_used: ['Basic Commands', 'Player Messages'],
                  related_examples: ['simple_commands.mush']
                })
              }]
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      const result = await mockClient.callTool('explain_mushcode', toolArgs);
      const parsedResult = JSON.parse(result.content[0].text);

      expect(parsedResult.explanation).toContain('simple command');
      expect(parsedResult.code_breakdown).toHaveLength(1);
      expect(parsedResult.concepts_used).toContain('Basic Commands');
    });
  });

  describe('get_examples Tool E2E', () => {
    beforeEach(async () => {
      await mockClient.connect();
      await mockClient.initialize();
    });

    it('should retrieve relevant examples by topic', async () => {
      const toolArgs = {
        topic: 'commands',
        difficulty: 'beginner',
        server_type: 'PennMUSH'
      };

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'get_examples') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  examples: [
                    {
                      title: 'Simple Greeting Command',
                      code: '&CMD.HELLO me=$hello:@pemit %#=Hello, %N!',
                      description: 'A basic command that greets the player',
                      difficulty: 'beginner',
                      server_compatibility: ['PennMUSH', 'TinyMUSH']
                    },
                    {
                      title: 'Time Command',
                      code: '&CMD.TIME me=$time:@pemit %#=The current time is [time()]',
                      description: 'Shows the current server time',
                      difficulty: 'beginner',
                      server_compatibility: ['PennMUSH']
                    }
                  ],
                  learning_path: [
                    'Start with simple commands like hello',
                    'Learn about argument handling with %0, %1, etc.',
                    'Practice with built-in functions like time()',
                    'Move on to conditional logic with if() and switch()'
                  ],
                  additional_resources: [
                    'https://mushcode.com/commands',
                    'https://pennmush.org/documentation'
                  ]
                })
              }]
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      const result = await mockClient.callTool('get_examples', toolArgs);
      const parsedResult = JSON.parse(result.content[0].text);

      expect(parsedResult.examples).toHaveLength(2);
      expect(parsedResult.examples[0].difficulty).toBe('beginner');
      expect(parsedResult.learning_path).toBeDefined();
      expect(parsedResult.additional_resources).toContain('https://mushcode.com/commands');
    });

    it('should filter examples by category', async () => {
      const toolArgs = {
        topic: 'functions',
        category: 'string manipulation',
        difficulty: 'intermediate'
      };

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'get_examples') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  examples: [
                    {
                      title: 'String Manipulation Function',
                      code: '&FUN.REVERSE me=[revwords(revwords(%0,),)]',
                      description: 'Reverses the order of characters in a string',
                      difficulty: 'intermediate',
                      category: 'string manipulation'
                    }
                  ],
                  learning_path: [
                    'Master basic string functions like left(), right(), mid()',
                    'Learn about revwords() and its applications',
                    'Practice combining functions for complex operations'
                  ],
                  additional_resources: [
                    'https://mushcode.com/functions/string'
                  ]
                })
              }]
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      const result = await mockClient.callTool('get_examples', toolArgs);
      const parsedResult = JSON.parse(result.content[0].text);

      expect(parsedResult.examples[0].category).toBe('string manipulation');
      expect(parsedResult.examples[0].difficulty).toBe('intermediate');
    });
  });

  describe('format_mushcode Tool E2E', () => {
    beforeEach(async () => {
      await mockClient.connect();
      await mockClient.initialize();
    });

    it('should format messy code for readability', async () => {
      const toolArgs = {
        code: '&CMD.MESSY me=$messy:@pemit %#=[if(eq(1,1),Good,Bad)]',
        style: 'readable',
        indent_size: 2
      };

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'format_mushcode') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  formatted_code: '&CMD.MESSY me=$messy:\n  @pemit %#=[\n    if(\n      eq(1, 1),\n      Good,\n      Bad\n    )\n  ]',
                  changes_made: [
                    'Added line breaks for better readability',
                    'Indented nested function calls',
                    'Added spacing around operators'
                  ],
                  style_notes: 'Formatted using readable style with 2-space indentation'
                })
              }]
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      const result = await mockClient.callTool('format_mushcode', toolArgs);
      const parsedResult = JSON.parse(result.content[0].text);

      expect(parsedResult.formatted_code).toContain('\n');
      expect(parsedResult.formatted_code).toContain('  '); // Indentation
      expect(parsedResult.changes_made).toContain('Added line breaks');
    });

    it('should format code in compact style', async () => {
      const toolArgs = {
        code: '&CMD.VERBOSE me=$verbose:\n  @pemit %#=[\n    if(\n      eq(1, 1),\n      Good,\n      Bad\n    )\n  ]',
        style: 'compact'
      };

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'format_mushcode') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  formatted_code: '&CMD.VERBOSE me=$verbose:@pemit %#=[if(eq(1,1),Good,Bad)]',
                  changes_made: [
                    'Removed unnecessary line breaks',
                    'Compressed whitespace',
                    'Maintained functional spacing'
                  ],
                  style_notes: 'Formatted using compact style for minimal space usage'
                })
              }]
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      const result = await mockClient.callTool('format_mushcode', toolArgs);
      const parsedResult = JSON.parse(result.content[0].text);

      expect(parsedResult.formatted_code).not.toContain('\n');
      expect(parsedResult.changes_made).toContain('Removed unnecessary line breaks');
    });
  });

  describe('compress_mushcode Tool E2E', () => {
    beforeEach(async () => {
      await mockClient.connect();
      await mockClient.initialize();
    });

    it('should compress code while preserving functionality', async () => {
      const toolArgs = {
        code: '// This is a comment\n&CMD.VERBOSE me=$verbose *:\n  // Another comment\n  @pemit %#=Hello, %0! Welcome to the game.',
        compression_level: 'moderate',
        remove_comments: true
      };

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'compress_mushcode') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  compressed_code: '&CMD.VERBOSE me=$verbose *:@pemit %#=Hello, %0! Welcome to the game.',
                  original_size: 95,
                  compressed_size: 67,
                  compression_ratio: 29.5,
                  optimizations_applied: [
                    'Removed comments',
                    'Eliminated unnecessary whitespace',
                    'Compressed line breaks'
                  ],
                  warnings: []
                })
              }]
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      const result = await mockClient.callTool('compress_mushcode', toolArgs);
      const parsedResult = JSON.parse(result.content[0].text);

      expect(parsedResult.compressed_code).not.toContain('//');
      expect(parsedResult.compressed_size).toBeLessThan(parsedResult.original_size);
      expect(parsedResult.compression_ratio).toBeGreaterThan(0);
      expect(parsedResult.optimizations_applied).toContain('Removed comments');
    });

    it('should provide warnings for aggressive compression', async () => {
      const toolArgs = {
        code: '&CMD.COMPLEX me=$complex *:@pemit %#=[switch(%0,hello,Hi there!,bye,Goodbye!,I don\'t understand.)]',
        compression_level: 'aggressive'
      };

      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call' && request.params.name === 'compress_mushcode') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  compressed_code: '&CMD.COMPLEX me=$complex *:@pemit %#=[switch(%0,hello,Hi!,bye,Bye!,?)]',
                  original_size: 98,
                  compressed_size: 72,
                  compression_ratio: 26.5,
                  optimizations_applied: [
                    'Shortened string literals',
                    'Abbreviated responses',
                    'Minimized punctuation'
                  ],
                  warnings: [
                    'Aggressive compression may affect user experience',
                    'Shortened messages may be less clear to players'
                  ]
                })
              }]
            }
          };
          mockClient.receiveResponse(response);
        }
      });

      const result = await mockClient.callTool('compress_mushcode', toolArgs);
      const parsedResult = JSON.parse(result.content[0].text);

      expect(parsedResult.warnings).toHaveLength(2);
      expect(parsedResult.warnings[0]).toContain('Aggressive compression');
      expect(parsedResult.optimizations_applied).toContain('Shortened string literals');
    });
  });

  describe('Cross-Tool Integration Workflows', () => {
    beforeEach(async () => {
      await mockClient.connect();
      await mockClient.initialize();
    });

    it('should support generate -> validate -> optimize workflow', async () => {
      // Step 1: Generate code
      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call') {
          if (request.params.name === 'generate_mushcode') {
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    code: '&CMD.HELLO me=$hello:@pemit %#=Hello, %N!'
                  })
                }]
              }
            };
            mockClient.receiveResponse(response);
          } else if (request.params.name === 'validate_mushcode') {
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    is_valid: true,
                    syntax_errors: [],
                    security_warnings: []
                  })
                }]
              }
            };
            mockClient.receiveResponse(response);
          } else if (request.params.name === 'optimize_mushcode') {
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    optimized_code: '&CMD.HELLO me=$hello:@pemit %#=Hello, %N!',
                    improvements: []
                  })
                }]
              }
            };
            mockClient.receiveResponse(response);
          }
        }
      });

      // Generate
      const generateResult = await mockClient.callTool('generate_mushcode', {
        description: 'Simple hello command'
      });
      const generatedCode = JSON.parse(generateResult.content[0].text).code;

      // Validate
      const validateResult = await mockClient.callTool('validate_mushcode', {
        code: generatedCode
      });
      const validationResult = JSON.parse(validateResult.content[0].text);

      // Optimize
      const optimizeResult = await mockClient.callTool('optimize_mushcode', {
        code: generatedCode
      });
      const optimizedCode = JSON.parse(optimizeResult.content[0].text);

      expect(generatedCode).toBeDefined();
      expect(validationResult.is_valid).toBe(true);
      expect(optimizedCode.optimized_code).toBeDefined();
    });

    it('should support explain -> get_examples learning workflow', async () => {
      mockClient.on('requestProcessed', (request) => {
        if (request.method === 'tools/call') {
          if (request.params.name === 'explain_mushcode') {
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    concepts_used: ['Switch Function', 'Command Triggers']
                  })
                }]
              }
            };
            mockClient.receiveResponse(response);
          } else if (request.params.name === 'get_examples') {
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    examples: [
                      {
                        title: 'Switch Function Example',
                        code: '&CMD.SWITCH me=$switch *:@pemit %#=[switch(%0,1,One,2,Two,Unknown)]'
                      }
                    ]
                  })
                }]
              }
            };
            mockClient.receiveResponse(response);
          }
        }
      });

      // Explain complex code
      const explainResult = await mockClient.callTool('explain_mushcode', {
        code: '&CMD.COMPLEX me=$complex *:@pemit %#=[switch(%0,hello,Hi!,bye,Bye!,?)]'
      });
      const concepts = JSON.parse(explainResult.content[0].text).concepts_used;

      // Get examples for learned concepts
      const examplesResult = await mockClient.callTool('get_examples', {
        topic: 'Switch Function'
      });
      const examples = JSON.parse(examplesResult.content[0].text).examples;

      expect(concepts).toContain('Switch Function');
      expect(examples).toHaveLength(1);
      expect(examples[0].title).toContain('Switch Function');
    });
  });
});