#!/usr/bin/env node
/**
 * Script to enhance the knowledge base with additional MUSHCODE patterns and examples
 * This script adds more comprehensive patterns extracted from mushcode.com examples
 */
import { MushcodeKnowledgeBase } from '../src/knowledge/base.js';
import { KnowledgeBasePersistence } from '../src/knowledge/persistence.js';
class KnowledgeBaseEnhancer {
    knowledgeBase;
    persistence;
    constructor() {
        this.knowledgeBase = new MushcodeKnowledgeBase();
        this.persistence = new KnowledgeBasePersistence();
    }
    async enhance() {
        console.log('🚀 Starting knowledge base enhancement...');
        // Load existing knowledge base
        this.knowledgeBase = await this.persistence.load();
        console.log(`📊 Current stats: ${JSON.stringify(this.knowledgeBase.getStats(), null, 2)}`);
        // Add enhanced patterns
        this.addEnhancedPatterns();
        // Add more comprehensive examples
        this.addComprehensiveExamples();
        // Add advanced security rules
        this.addAdvancedSecurityRules();
        // Enhance server dialects
        this.enhanceServerDialects();
        // Add advanced learning paths
        this.addAdvancedLearningPaths();
        // Save enhanced knowledge base
        await this.persistence.save(this.knowledgeBase);
        console.log('✅ Knowledge base enhancement completed!');
        console.log(`📊 Final stats: ${JSON.stringify(this.knowledgeBase.getStats(), null, 2)}`);
    }
    /**
     * Add enhanced MUSHCODE patterns
     */
    addEnhancedPatterns() {
        const patterns = [
            {
                id: 'advanced-switch-pattern',
                name: 'Advanced Switch with Wildcards',
                description: 'Complex switch pattern with wildcard matching and default cases',
                category: 'function',
                codeTemplate: 'switch(%{expression}, %{pattern1}, %{action1}, *%{wildcard}*, %{wildcard_action}, %{default})',
                parameters: [
                    {
                        name: 'expression',
                        type: 'string',
                        description: 'Expression to evaluate',
                        required: true
                    },
                    {
                        name: 'pattern1',
                        type: 'string',
                        description: 'Exact match pattern',
                        required: true
                    },
                    {
                        name: 'action1',
                        type: 'string',
                        description: 'Action for exact match',
                        required: true
                    },
                    {
                        name: 'wildcard',
                        type: 'string',
                        description: 'Wildcard pattern (without asterisks)',
                        required: true
                    },
                    {
                        name: 'wildcard_action',
                        type: 'string',
                        description: 'Action for wildcard match',
                        required: true
                    },
                    {
                        name: 'default',
                        type: 'string',
                        description: 'Default action if no matches',
                        required: false,
                        defaultValue: 'No match found.'
                    }
                ],
                serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
                securityLevel: 'public',
                examples: [
                    'switch(%0, hello, Hi!, *good*, Good to see you!, *bad*, Sorry to hear that!, I don\'t understand.)',
                    'switch(time(), morning, Good morning!, *night*, Good evening!, Hello there!)'
                ],
                relatedPatterns: ['function-with-validation'],
                tags: ['switch', 'wildcards', 'pattern-matching', 'conditional'],
                difficulty: 'intermediate',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'recursive-function-pattern',
                name: 'Recursive Function Template',
                description: 'Safe recursive function pattern with termination conditions',
                category: 'function',
                codeTemplate: '&FUN.%{FUNCTION_NAME} %{OBJECT}=[switch(%{termination_condition}, 1, %{base_case}, [%{recursive_logic}][u(me/fun.%{function_name}, %{modified_input})])]',
                parameters: [
                    {
                        name: 'function_name',
                        type: 'string',
                        description: 'Name of the recursive function',
                        required: true
                    },
                    {
                        name: 'termination_condition',
                        type: 'string',
                        description: 'Condition to stop recursion',
                        required: true
                    },
                    {
                        name: 'base_case',
                        type: 'string',
                        description: 'Value to return when recursion ends',
                        required: true
                    },
                    {
                        name: 'recursive_logic',
                        type: 'string',
                        description: 'Logic to execute before recursive call',
                        required: true
                    },
                    {
                        name: 'modified_input',
                        type: 'string',
                        description: 'Modified input for next recursive call',
                        required: true
                    }
                ],
                serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
                securityLevel: 'builder',
                examples: [
                    '&FUN.COUNTDOWN me=[switch(lte(%0,0), 1, Done!, [%0 ][u(me/fun.countdown, dec(%0))])]',
                    '&FUN.FACTORIAL me=[switch(lte(%0,1), 1, 1, mul(%0, u(me/fun.factorial, dec(%0))))]'
                ],
                relatedPatterns: ['function-with-validation'],
                tags: ['recursion', 'functions', 'loops', 'mathematical'],
                difficulty: 'advanced',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'attribute-inheritance-pattern',
                name: 'Attribute Inheritance System',
                description: 'Pattern for creating inheritable attributes with fallback values',
                category: 'attribute',
                codeTemplate: '&%{ATTRIBUTE_NAME} %{OBJECT}=[if(hasattr(me, %{attribute_name}), get(me/%{attribute_name}), if(hasattr(parent(me), %{attribute_name}), get(parent(me)/%{attribute_name}), %{default_value}))]',
                parameters: [
                    {
                        name: 'attribute_name',
                        type: 'string',
                        description: 'Name of the inheritable attribute',
                        required: true
                    },
                    {
                        name: 'default_value',
                        type: 'string',
                        description: 'Default value if attribute not found',
                        required: true
                    }
                ],
                serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
                securityLevel: 'builder',
                examples: [
                    '&GET_COLOR me=[if(hasattr(me, color), get(me/color), if(hasattr(parent(me), color), get(parent(me)/color), white))]',
                    '&GET_DESCRIPTION me=[if(hasattr(me, description), get(me/description), if(hasattr(parent(me), description), get(parent(me)/description), A nondescript object.))]'
                ],
                relatedPatterns: ['data-storage-attribute'],
                tags: ['inheritance', 'attributes', 'parent', 'fallback'],
                difficulty: 'intermediate',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'event-trigger-pattern',
                name: 'Event Trigger System',
                description: 'Pattern for creating event-driven triggers with parameter passing',
                category: 'trigger',
                codeTemplate: '&A%{TRIGGER_TYPE} %{OBJECT}=@trigger me/TR.%{EVENT_NAME}=%{parameters}; &TR.%{EVENT_NAME} %{OBJECT}=%{trigger_logic}',
                parameters: [
                    {
                        name: 'trigger_type',
                        type: 'string',
                        description: 'Type of trigger (CONNECT, DISCONNECT, etc.)',
                        required: true
                    },
                    {
                        name: 'event_name',
                        type: 'string',
                        description: 'Name of the event handler',
                        required: true
                    },
                    {
                        name: 'parameters',
                        type: 'string',
                        description: 'Parameters to pass to the trigger',
                        required: false,
                        defaultValue: '%#'
                    },
                    {
                        name: 'trigger_logic',
                        type: 'string',
                        description: 'Logic to execute when triggered',
                        required: true
                    }
                ],
                serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
                securityLevel: 'builder',
                examples: [
                    '&ACONNECT me=@trigger me/TR.PLAYER_CONNECT=%#; &TR.PLAYER_CONNECT me=@pemit %0=Welcome, [name(%0)]!',
                    '&ADISCONNECT me=@trigger me/TR.PLAYER_DISCONNECT=%#; &TR.PLAYER_DISCONNECT me=@log [name(%0)] has disconnected.'
                ],
                relatedPatterns: ['basic-command'],
                tags: ['triggers', 'events', 'automation', 'player-actions'],
                difficulty: 'intermediate',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'data-validation-pattern',
                name: 'Comprehensive Data Validation',
                description: 'Pattern for validating and sanitizing user input with multiple checks',
                category: 'utility',
                codeTemplate: '&VALIDATE_%{DATA_TYPE} %{OBJECT}=[switch(1, not(strlen(%0)), #-1 ERROR: Empty input, %{length_check}, #-1 ERROR: Invalid length, %{format_check}, #-1 ERROR: Invalid format, %{content_check}, #-1 ERROR: Invalid content, %0)]',
                parameters: [
                    {
                        name: 'data_type',
                        type: 'string',
                        description: 'Type of data being validated',
                        required: true
                    },
                    {
                        name: 'length_check',
                        type: 'string',
                        description: 'Length validation condition',
                        required: true
                    },
                    {
                        name: 'format_check',
                        type: 'string',
                        description: 'Format validation condition',
                        required: true
                    },
                    {
                        name: 'content_check',
                        type: 'string',
                        description: 'Content validation condition',
                        required: true
                    }
                ],
                serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
                securityLevel: 'public',
                examples: [
                    '&VALIDATE_NAME me=[switch(1, not(strlen(%0)), #-1 ERROR: Empty name, gt(strlen(%0), 20), #-1 ERROR: Name too long, not(isalpha(left(%0,1))), #-1 ERROR: Must start with letter, not(strmatch(%0, *[!@#$%^&*()]*)), #-1 ERROR: Invalid characters, %0)]',
                    '&VALIDATE_NUMBER me=[switch(1, not(strlen(%0)), #-1 ERROR: Empty input, not(isnum(%0)), #-1 ERROR: Not a number, lt(%0, 0), #-1 ERROR: Must be positive, gt(%0, 1000), #-1 ERROR: Too large, %0)]'
                ],
                relatedPatterns: ['function-with-validation'],
                tags: ['validation', 'input', 'security', 'sanitization'],
                difficulty: 'intermediate',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        patterns.forEach(pattern => this.knowledgeBase.addPattern(pattern));
        console.log(`✅ Added ${patterns.length} enhanced patterns`);
    }
    /**
     * Add comprehensive code examples
     */
    addComprehensiveExamples() {
        const examples = [
            {
                id: 'advanced-room-system',
                title: 'Advanced Room System with Weather',
                description: 'A comprehensive room system with dynamic weather, time-based descriptions, and environmental effects',
                code: `@create Advanced Room System
@set Advanced Room System = LINK_OK ENTER_OK NO_COMMAND

&DESCRIBE Advanced Room System=[u(me/get_base_desc)][u(me/get_weather_desc)][u(me/get_time_desc)]

&GET_BASE_DESC Advanced Room System=[get(me/base_description)]
&BASE_DESCRIPTION Advanced Room System=A spacious room with tall windows overlooking the landscape.

&GET_WEATHER_DESC Advanced Room System=[switch(get(me/weather), sunny, %r%rBright sunlight streams through the windows., rainy, %r%rRain patters against the windows., cloudy, %r%rGray clouds are visible through the windows., stormy, %r%rLightning flashes outside the windows.)]

&GET_TIME_DESC Advanced Room System=[switch(1, and(gte(extract(time(),1,1,:),6), lt(extract(time(),1,1,:),12)), %r%rMorning light fills the room., and(gte(extract(time(),1,1,:),12), lt(extract(time(),1,1,:),18)), %r%rAfternoon sun warms the room., and(gte(extract(time(),1,1,:),18), lt(extract(time(),1,1,:),22)), %r%rEvening shadows lengthen across the floor., %r%rNight has fallen, and the room is lit by artificial light.)]

&WEATHER Advanced Room System=sunny

&CMD_WEATHER Advanced Room System=$weather *:@switch haspower(%#, Builder)=0, {@pemit %#=Permission denied.}, {&weather me=%0; @pemit %#=Weather set to %0.; @oemit %#=[name(%#)] changes the weather.}

&CRON_HOURLY Advanced Room System=@switch rand(4)=0, {&weather me=[extract(sunny rainy cloudy stormy, rand(4), 1)]; @remit me=The weather begins to change.}`,
                explanation: 'This advanced room system demonstrates dynamic content generation based on environmental factors. It combines base descriptions with weather and time-based additions, includes admin commands for weather control, and uses cron triggers for automatic weather changes.',
                difficulty: 'advanced',
                category: 'building',
                tags: ['rooms', 'dynamic', 'weather', 'time', 'environmental', 'cron', 'advanced'],
                serverCompatibility: ['PennMUSH', 'TinyMUSH'],
                relatedConcepts: ['room-systems', 'dynamic-descriptions', 'environmental-simulation', 'time-based-content'],
                learningObjectives: [
                    'Understand dynamic content generation',
                    'Learn environmental simulation techniques',
                    'Master time-based conditional logic',
                    'Implement automated system changes'
                ],
                source: {
                    url: 'https://mushcode.com',
                    author: 'Advanced MUSHCODE Examples'
                }
            },
            {
                id: 'player-statistics-system',
                title: 'Player Statistics and Progression System',
                description: 'A comprehensive player statistics system with experience points, levels, and skill progression',
                code: `@create Player Stats System
@set Player Stats System = WIZARD SAFE

&INIT_PLAYER Player Stats System=&experience %0=0; &level %0=1; &skill_points %0=0; &skills %0=; @pemit %0=Character statistics initialized.

&GET_EXPERIENCE Player Stats System=[get(%0/experience)]
&GET_LEVEL Player Stats System=[get(%0/level)]
&GET_SKILL_POINTS Player Stats System=[get(%0/skill_points)]

&ADD_EXPERIENCE Player Stats System=[setq(0, add(u(me/get_experience, %0), %1))][set(%0, experience:%q0)][setq(1, u(me/calculate_level, %q0))][if(neq(%q1, u(me/get_level, %0)), u(me/level_up, %0, %q1))][%q0]

&CALCULATE_LEVEL Player Stats System=[switch(1, lt(%0, 100), 1, lt(%0, 300), 2, lt(%0, 600), 3, lt(%0, 1000), 4, lt(%0, 1500), 5, add(5, fdiv(sub(%0, 1500), 500)))]

&LEVEL_UP Player Stats System=[setq(0, sub(%1, u(me/get_level, %0)))][set(%0, level:%1)][set(%0, skill_points:add(u(me/get_skill_points, %0), mul(%q0, 3)))][pemit(%0, ansi(hy, LEVEL UP! You are now level %1 and gained [mul(%q0, 3)] skill points!))]

&CMD_STATS Player Stats System=$+stats *:@switch pmatch(%0)=#-1, {@pemit %#=Player not found.}, #-2, {@pemit %#=Ambiguous player name.}, {[setq(0, pmatch(%0))][pemit %#, ansi(hc, === Statistics for [name(%q0)] ===)%r[ljust(Level:, 15)][u(me/get_level, %q0)]%r[ljust(Experience:, 15)][u(me/get_experience, %q0)]%r[ljust(Skill Points:, 15)][u(me/get_skill_points, %q0)]%r[ljust(Skills:, 15)][get(%q0/skills)]]}

&CMD_ADDXP Player Stats System=$+addxp *=*:@switch haspower(%#, Wizard)=0, {@pemit %#=Permission denied.}, {[setq(0, pmatch(%0))][switch(%q0, #-1, {@pemit %#=Player not found.}, #-2, {@pemit %#=Ambiguous player name.}, {[setq(1, u(me/add_experience, %q0, %1))][pemit %#, Added %1 experience to [name(%q0)]. New total: %q1][pemit(%q0, You gained %1 experience points!)})]}`,
                explanation: 'This system provides a complete player progression framework with experience points, automatic leveling, and skill point allocation. It includes validation, administrative commands, and player feedback systems.',
                difficulty: 'advanced',
                category: 'systems',
                tags: ['player', 'statistics', 'progression', 'experience', 'levels', 'skills', 'rpg'],
                serverCompatibility: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
                relatedConcepts: ['player-management', 'game-mechanics', 'progression-systems', 'data-storage'],
                learningObjectives: [
                    'Design comprehensive player data systems',
                    'Implement automatic progression mechanics',
                    'Create administrative management tools',
                    'Handle complex data relationships'
                ],
                source: {
                    url: 'https://mushcode.com',
                    author: 'RPG Systems Examples'
                }
            },
            {
                id: 'communication-channel-system',
                title: 'Advanced Communication Channel System',
                description: 'A sophisticated channel system with permissions, logging, and moderation features',
                code: `@create Channel System
@set Channel System = WIZARD SAFE

&CHANNELS Channel System=ooc:public ic:public staff:wizard newbie:public

&CMD_ADDCHANNEL Channel System=$+addchannel *=*:@switch haspower(%#, Wizard)=0, {@pemit %#=Permission denied.}, {[setq(0, get(me/channels))][set(me, channels:[%q0] %0:%1)][pemit %#, Channel %0 added with permission level %1.]}

&CMD_CHANNEL Channel System=$+%0 *:@switch member(extract(get(me/channels), 1), %0)=0, {@pemit %#=No such channel.}, {[setq(0, extract(grab(get(me/channels), %0:*), 2, :))][switch(1, strmatch(%q0, public), u(me/send_message, %0, %#, %1), strmatch(%q0, wizard), if(haspower(%#, Wizard), u(me/send_message, %0, %#, %1), pemit(%#, Permission denied.)), pemit(%#, Unknown permission level.))]}

&SEND_MESSAGE Channel System=[setq(0, lwho())][setq(1, filter(me/can_hear_channel, %q0, , %0))][iter(%q1, pemit(##, ansi(hc, [%0]) ansi(hy, [name(%1)]:) %2))][u(me/log_message, %0, %1, %2)]

&CAN_HEAR_CHANNEL Channel System=[setq(0, extract(grab(get(me/channels), %3:*), 2, :))][switch(1, strmatch(%q0, public), 1, strmatch(%q0, wizard), haspower(%0, Wizard), 0)]

&LOG_MESSAGE Channel System=[setq(0, convsecs())][setq(1, get(me/log_%1))][set(me, log_%1:[%q1][if(strlen(%q1), |)]%q0:%2:%3)]

&CMD_CHANLOG Channel System=$+chanlog *:@switch haspower(%#, Wizard)=0, {@pemit %#=Permission denied.}, {[setq(0, get(me/log_%0))][switch(strlen(%q0), 0, {@pemit %#=No log entries for channel %0.}, {[pemit %#, ansi(hc, === Log for channel %0 ===)][iter(%q0, [setq(1, extract(##, 1, :))][setq(2, extract(##, 2, :))][setq(3, extract(##, 3, :))][pemit %#, [ljust(convsecs(%q1), 20)] [ljust(%q2, 15)] %q3], |)]})]}`,
                explanation: 'This advanced channel system provides multiple communication channels with different permission levels, comprehensive logging, and administrative tools for channel management and moderation.',
                difficulty: 'advanced',
                category: 'communication',
                tags: ['channels', 'communication', 'permissions', 'logging', 'moderation', 'admin'],
                serverCompatibility: ['PennMUSH', 'TinyMUSH'],
                relatedConcepts: ['communication-systems', 'permission-management', 'logging-systems', 'user-interaction'],
                learningObjectives: [
                    'Build complex communication systems',
                    'Implement permission-based access control',
                    'Create comprehensive logging mechanisms',
                    'Design administrative management interfaces'
                ],
                source: {
                    url: 'https://mushcode.com',
                    author: 'Communication Systems Examples'
                }
            }
        ];
        examples.forEach(example => this.knowledgeBase.addExample(example));
        console.log(`✅ Added ${examples.length} comprehensive examples`);
    }
    /**
     * Add advanced security rules
     */
    addAdvancedSecurityRules() {
        const rules = [
            {
                ruleId: 'SEC-006',
                name: 'Unrestricted Object Creation',
                description: 'Commands that create objects without proper quota or permission checks',
                severity: 'medium',
                category: 'permission',
                pattern: '@create\\s+[^;]*(?!.*haspower|.*controls|.*quota)',
                recommendation: 'Always check user permissions and quota before allowing object creation',
                examples: {
                    vulnerable: '$create *:@create %0',
                    secure: '$create *:@switch [haspower(%#, Builder)]=1, {@switch [gte(get(%#/quota), 1)]=1, {@create %0; @set %#=quota:[sub(get(%#/quota), 1)]}, {Not enough quota.}}, {Permission denied.}',
                    explanation: 'Object creation should verify both permissions and available quota to prevent resource abuse.'
                },
                affectedServers: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
                cweId: 'CWE-862',
                references: ['https://mushcode.com/security/object-creation']
            },
            {
                ruleId: 'SEC-007',
                name: 'Command Injection via @trigger',
                description: 'Using @trigger with unsanitized user input that could execute arbitrary commands',
                severity: 'high',
                category: 'injection',
                pattern: '@trigger\\s+[^=]*=%[0-9]',
                recommendation: 'Sanitize all user input before using in @trigger commands',
                examples: {
                    vulnerable: '@trigger me/process=%0',
                    secure: '@trigger me/process=[secure(%0)]',
                    explanation: 'User input in @trigger can be exploited to execute unintended commands. Always sanitize input.'
                },
                affectedServers: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
                cweId: 'CWE-77',
                references: []
            },
            {
                ruleId: 'SEC-008',
                name: 'Information Disclosure via Error Messages',
                description: 'Error messages that reveal sensitive system information',
                severity: 'low',
                category: 'data',
                pattern: '#-1\\s+[^:]*:\\s*[^,]*,\\s*%[0-9]',
                recommendation: 'Use generic error messages that don\'t reveal system internals',
                examples: {
                    vulnerable: '#-1 DATABASE ERROR: Invalid dbref %0, check permissions',
                    secure: '#-1 ERROR: Invalid input provided',
                    explanation: 'Error messages should not reveal internal system details that could aid attackers.'
                },
                affectedServers: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
                cweId: 'CWE-209',
                references: []
            },
            {
                ruleId: 'SEC-009',
                name: 'Unsafe Regular Expression Usage',
                description: 'Regular expressions that could cause ReDoS (Regular Expression Denial of Service)',
                severity: 'medium',
                category: 'resource',
                pattern: 're(match|edit|grep)\\([^,]*\\([^)]*\\+[^)]*\\*[^)]*\\)',
                recommendation: 'Avoid complex regex patterns with nested quantifiers that can cause exponential backtracking',
                examples: {
                    vulnerable: 'regedit(%0, (a+)+b, replacement)',
                    secure: 'regedit(%0, a+b, replacement)',
                    explanation: 'Nested quantifiers in regex can cause catastrophic backtracking, leading to DoS conditions.'
                },
                affectedServers: ['PennMUSH'],
                cweId: 'CWE-1333',
                references: ['https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS']
            },
            {
                ruleId: 'SEC-010',
                name: 'Privilege Escalation via Parent Objects',
                description: 'Setting parent objects without proper permission validation',
                severity: 'high',
                category: 'permission',
                pattern: '@parent\\s+[^=]*=\\s*[^;]*(?!.*controls|.*haspower)',
                recommendation: 'Always verify permissions before allowing parent object changes',
                examples: {
                    vulnerable: '$setparent *=*:@parent %0=%1',
                    secure: '$setparent *=*:@switch [controls(%#, %0)]=1, {@switch [controls(%#, %1)]=1, {@parent %0=%1}, {You don\'t control the target parent.}}, {You don\'t control the object.}',
                    explanation: 'Parent object changes can grant unintended permissions. Always verify control of both objects.'
                },
                affectedServers: ['PennMUSH', 'TinyMUSH', 'RhostMUSH'],
                cweId: 'CWE-269',
                references: []
            }
        ];
        rules.forEach(rule => this.knowledgeBase.addSecurityRule(rule));
        console.log(`✅ Added ${rules.length} advanced security rules`);
    }
    /**
     * Enhance server dialects with more detailed information
     */
    enhanceServerDialects() {
        // Enhance PennMUSH dialect
        const pennmush = this.knowledgeBase.getDialect('PennMUSH');
        if (pennmush) {
            pennmush.uniqueFeatures.push({
                name: 'Attribute Trees',
                description: 'Hierarchical attribute organization with wildcards',
                syntax: '@set object=attribute`branch:value',
                availability: ['1.8.0+'],
                examples: ['@set me=skill`combat`sword:5', '@set me=skill`magic`fire:3']
            }, {
                name: 'JSON Functions',
                description: 'Built-in JSON parsing and manipulation',
                syntax: 'json_query(json_string, path)',
                availability: ['1.8.8+'],
                examples: ['json_query({"name":"John","age":30}, $.name)', 'json_set({}, $.level, 5)']
            });
            pennmush.functionLibrary.push({
                name: 'iter',
                description: 'Iterate over a list and execute code for each element',
                syntax: 'iter(list, code, [input_separator], [output_separator])',
                parameters: [
                    {
                        name: 'list',
                        type: 'string',
                        description: 'List of items to iterate over',
                        required: true
                    },
                    {
                        name: 'code',
                        type: 'string',
                        description: 'Code to execute for each item (## represents current item)',
                        required: true
                    }
                ],
                returnType: 'string',
                permissions: ['public'],
                examples: ['iter(1 2 3 4, [##]^2 = [mul(##, ##)])']
            });
        }
        // Enhance TinyMUSH dialect
        const tinymush = this.knowledgeBase.getDialect('TinyMUSH');
        if (tinymush) {
            tinymush.uniqueFeatures.push({
                name: 'Quota System',
                description: 'Built-in object quota management',
                syntax: '@quota player=amount',
                availability: ['3.0+'],
                examples: ['@quota player=50', '@quota/set player=100']
            });
        }
        console.log('✅ Enhanced server dialect information');
    }
    /**
     * Add advanced learning paths
     */
    addAdvancedLearningPaths() {
        const paths = [
            {
                id: 'advanced-systems-design',
                name: 'Advanced Systems Design',
                description: 'Learn to design and implement complex, interconnected MUSHCODE systems',
                difficulty: 'advanced',
                estimatedTime: '15-20 hours',
                prerequisites: ['MUSHCODE Fundamentals', 'Intermediate Function Development', 'Basic system administration'],
                steps: [
                    {
                        stepNumber: 1,
                        title: 'System Architecture Planning',
                        description: 'Learn to design scalable and maintainable system architectures',
                        exampleIds: ['advanced-room-system'],
                        objectives: [
                            'Understand modular system design principles',
                            'Learn to plan data flow and dependencies',
                            'Design for scalability and maintenance',
                            'Create system documentation standards'
                        ]
                    },
                    {
                        stepNumber: 2,
                        title: 'Player Management Systems',
                        description: 'Build comprehensive player data and progression systems',
                        exampleIds: ['player-statistics-system'],
                        objectives: [
                            'Design player data storage systems',
                            'Implement progression mechanics',
                            'Create administrative interfaces',
                            'Handle data validation and integrity'
                        ]
                    },
                    {
                        stepNumber: 3,
                        title: 'Communication and Social Systems',
                        description: 'Develop advanced communication and interaction systems',
                        exampleIds: ['communication-channel-system'],
                        objectives: [
                            'Build permission-based communication systems',
                            'Implement logging and moderation tools',
                            'Create user-friendly interfaces',
                            'Design for community management'
                        ]
                    }
                ],
                resources: [
                    {
                        type: 'documentation',
                        title: 'Advanced MUSHCODE Patterns',
                        url: 'https://mushcode.com/Category/Advanced',
                        description: 'Collection of advanced system design patterns'
                    },
                    {
                        type: 'tutorial',
                        title: 'System Architecture Best Practices',
                        url: 'https://mushcode.com/Tutorial/Architecture',
                        description: 'Guide to designing maintainable MUSHCODE systems'
                    }
                ]
            },
            {
                id: 'security-hardening',
                name: 'MUSHCODE Security Hardening',
                description: 'Master security best practices and vulnerability prevention in MUSHCODE',
                difficulty: 'advanced',
                estimatedTime: '8-12 hours',
                prerequisites: ['MUSHCODE Fundamentals', 'Understanding of common security concepts'],
                steps: [
                    {
                        stepNumber: 1,
                        title: 'Input Validation and Sanitization',
                        description: 'Learn comprehensive input validation techniques',
                        exampleIds: [],
                        exercises: [
                            'Implement robust input validation functions',
                            'Create sanitization utilities for different data types',
                            'Build error handling that doesn\'t leak information'
                        ],
                        objectives: [
                            'Understand common input validation vulnerabilities',
                            'Implement comprehensive validation patterns',
                            'Create reusable sanitization functions',
                            'Design secure error handling'
                        ]
                    },
                    {
                        stepNumber: 2,
                        title: 'Permission and Access Control',
                        description: 'Master permission systems and access control patterns',
                        exampleIds: [],
                        objectives: [
                            'Design robust permission checking systems',
                            'Implement role-based access control',
                            'Prevent privilege escalation attacks',
                            'Create audit trails for sensitive operations'
                        ]
                    },
                    {
                        stepNumber: 3,
                        title: 'Security Code Review',
                        description: 'Learn to identify and fix security vulnerabilities in existing code',
                        exampleIds: [],
                        exercises: [
                            'Review code samples for security issues',
                            'Fix identified vulnerabilities',
                            'Create security checklists for code review'
                        ],
                        objectives: [
                            'Identify common MUSHCODE vulnerabilities',
                            'Perform systematic security code reviews',
                            'Remediate security issues effectively',
                            'Establish secure coding standards'
                        ]
                    }
                ],
                resources: [
                    {
                        type: 'reference',
                        title: 'MUSHCODE Security Guide',
                        url: 'https://mushcode.com/Security',
                        description: 'Comprehensive security reference for MUSHCODE developers'
                    },
                    {
                        type: 'reference',
                        title: 'Security Review Checklist',
                        url: 'https://mushcode.com/Security/Checklist',
                        description: 'Systematic checklist for security code reviews'
                    }
                ]
            }
        ];
        paths.forEach(path => this.knowledgeBase.addLearningPath(path));
        console.log(`✅ Added ${paths.length} advanced learning paths`);
    }
}
// Main execution
async function main() {
    const enhancer = new KnowledgeBaseEnhancer();
    await enhancer.enhance();
}
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}
export { KnowledgeBaseEnhancer };
//# sourceMappingURL=enhance-knowledge-base.js.map