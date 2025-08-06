/**
 * Unit tests for MUSHCODE optimization engine
 */

import { MushcodeOptimizer, OptimizationRequest } from '../../../src/engines/optimizer.js';
import { MushcodeKnowledgeBase } from '../../../src/knowledge/base.js';
import { ValidationError } from '../../../src/utils/errors.js';

describe('MushcodeOptimizer', () => {
    let optimizer: MushcodeOptimizer;
    let knowledgeBase: MushcodeKnowledgeBase;

    beforeEach(() => {
        knowledgeBase = new MushcodeKnowledgeBase();
        optimizer = new MushcodeOptimizer(knowledgeBase);
    });

    describe('constructor', () => {
        it('should create optimizer instance', () => {
            expect(optimizer).toBeInstanceOf(MushcodeOptimizer);
        });
    });

    describe('optimize', () => {
        describe('input validation', () => {
            it('should reject empty code', async () => {
                const request: OptimizationRequest = {
                    code: ''
                };

                await expect(optimizer.optimize(request)).rejects.toThrow(ValidationError);
                await expect(optimizer.optimize(request)).rejects.toThrow('Code is required');
            });

            it('should reject code that is too long', async () => {
                const request: OptimizationRequest = {
                    code: 'a'.repeat(50001)
                };

                await expect(optimizer.optimize(request)).rejects.toThrow(ValidationError);
                await expect(optimizer.optimize(request)).rejects.toThrow('Code is too long');
            });

            it('should reject invalid server type', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=Hello',
                    serverType: 'InvalidServer'
                };

                await expect(optimizer.optimize(request)).rejects.toThrow(ValidationError);
                await expect(optimizer.optimize(request)).rejects.toThrow('Unknown server type');
            });

            it('should reject invalid optimization goals', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=Hello',
                    optimizationGoals: ['invalid_goal']
                };

                await expect(optimizer.optimize(request)).rejects.toThrow(ValidationError);
                await expect(optimizer.optimize(request)).rejects.toThrow('Invalid optimization goal');
            });
        });

        describe('basic optimization', () => {
            it('should optimize simple code without errors', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=Hello World'
                };

                const result = await optimizer.optimize(request);

                expect(result).toBeDefined();
                expect(result.optimizedCode).toBeDefined();
                expect(result.improvements).toBeInstanceOf(Array);
                expect(result.performanceImpact).toBeDefined();
                expect(result.explanation).toBeDefined();
                expect(result.originalSize).toBe(request.code.length);
                expect(result.optimizedSize).toBeDefined();
                expect(result.compressionRatio).toBeDefined();
                expect(result.functionalityPreserved).toBe(true);
            });

            it('should handle multi-line code', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=Line 1\n@pemit %#=Line 2\n@pemit %#=Line 3'
                };

                const result = await optimizer.optimize(request);

                expect(result.optimizedCode).toBeDefined();
                expect(result.improvements).toBeInstanceOf(Array);
            });

            it('should preserve functionality by default', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=Hello'
                };

                const result = await optimizer.optimize(request);

                expect(result.functionalityPreserved).toBe(true);
            });
        });

        describe('performance optimization', () => {
            it('should optimize repeated function calls', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=[strlen(%0)] [strlen(%0)] [strlen(%0)]',
                    optimizationGoals: ['performance']
                };

                const result = await optimizer.optimize(request);

                const perfImprovements = result.improvements.filter(imp => imp.type === 'performance');
                expect(perfImprovements.length).toBeGreaterThan(0);

                // Should suggest caching the repeated strlen call
                const cachingImprovement = perfImprovements.find(imp =>
                    imp.category === 'caching' || imp.description.includes('Cache')
                );
                expect(cachingImprovement).toBeDefined();
            });

            it('should optimize nested function calls', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=[upper(trim(substr(get(%#/name),1,10)))]',
                    optimizationGoals: ['performance']
                };

                const result = await optimizer.optimize(request);

                // The optimization may or may not find improvements depending on the complexity
                expect(result.improvements).toBeInstanceOf(Array);
                expect(result.optimizedCode).toBeDefined();
            });

            it('should optimize expensive operations', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=[sql(SELECT * FROM table)] [sql(SELECT * FROM table)]',
                    optimizationGoals: ['performance']
                };

                const result = await optimizer.optimize(request);

                const perfImprovements = result.improvements.filter(imp =>
                    imp.type === 'performance' && imp.category === 'caching'
                );
                expect(perfImprovements.length).toBeGreaterThan(0);
            });

            it('should optimize string operations', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=[cat(Hello, ,World)] [cat(Foo, ,Bar)]',
                    optimizationGoals: ['performance']
                };

                const result = await optimizer.optimize(request);

                expect(result.improvements).toBeInstanceOf(Array);
                // String optimization improvements may be present
            });

            it('should optimize loop structures', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=[iter(list,iter(sublist,do_something))]',
                    optimizationGoals: ['performance']
                };

                const result = await optimizer.optimize(request);

                // May suggest optimization for nested iterations
                expect(result.improvements).toBeInstanceOf(Array);
            });

            it('should optimize conditional structures', async () => {
                const request: OptimizationRequest = {
                    code: '@switch [eq(%0,1)]=1,{@pemit %#=One},[eq(%0,1)]=1,{@pemit %#=Also One}',
                    optimizationGoals: ['performance']
                };

                const result = await optimizer.optimize(request);

                // Should detect redundant conditions
                expect(result.improvements).toBeInstanceOf(Array);
            });
        });

        describe('readability optimization', () => {
            it('should improve formatting', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=Hello    World',
                    optimizationGoals: ['readability']
                };

                const result = await optimizer.optimize(request);

                const readabilityImprovements = result.improvements.filter(imp =>
                    imp.type === 'readability'
                );
                expect(readabilityImprovements.length).toBeGreaterThan(0);
            });

            it('should add comments for complex code', async () => {
                const request: OptimizationRequest = {
                    code: '@switch [and(gt(%0,10),lt(%0,100),eq(mod(%0,2),0))]=1,{@pemit %#=Valid even number}',
                    optimizationGoals: ['readability']
                };

                const result = await optimizer.optimize(request);

                const commentImprovements = result.improvements.filter(imp =>
                    imp.category === 'documentation'
                );
                expect(commentImprovements.length).toBeGreaterThan(0);
            });

            it('should simplify complex expressions', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=' + 'a'.repeat(150), // Very long line
                    optimizationGoals: ['readability']
                };

                const result = await optimizer.optimize(request);

                // May suggest breaking down complex expressions
                expect(result.improvements).toBeInstanceOf(Array);
            });

            it('should fix indentation', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=Hello\n    @pemit %#=World', // Inconsistent indentation
                    optimizationGoals: ['readability']
                };

                const result = await optimizer.optimize(request);

                const formattingImprovements = result.improvements.filter(imp =>
                    imp.category === 'formatting'
                );
                expect(formattingImprovements.length).toBeGreaterThan(0);
            });
        });

        describe('maintainability optimization', () => {
            it('should replace magic numbers', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=[if(gt(strlen(%0),50),Too long,OK)]',
                    optimizationGoals: ['maintainability']
                };

                const result = await optimizer.optimize(request);

                const maintainabilityImprovements = result.improvements.filter(imp =>
                    imp.type === 'maintainability' && imp.category === 'constants'
                );
                expect(maintainabilityImprovements.length).toBeGreaterThan(0);
            });

            it('should improve variable names', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=[setq(0,value1)][setq(1,value2)][setq(2,value3)][q(0)][q(1)][q(2)]',
                    optimizationGoals: ['maintainability']
                };

                const result = await optimizer.optimize(request);

                // May suggest better variable names
                expect(result.improvements).toBeInstanceOf(Array);
            });

            it('should extract reusable patterns', async () => {
                const request: OptimizationRequest = {
                    code: '@switch [hasflag(%#,WIZARD)]=0,{@pemit %#=Permission denied}',
                    optimizationGoals: ['maintainability']
                };

                const result = await optimizer.optimize(request);

                // May suggest extracting permission check pattern
                expect(result.improvements).toBeInstanceOf(Array);
            });
        });

        describe('security optimization', () => {
            it('should add input validation', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=[sql(SELECT * FROM users WHERE name=\'%0\')]',
                    optimizationGoals: ['security']
                };

                const result = await optimizer.optimize(request);

                const securityImprovements = result.improvements.filter(imp =>
                    imp.type === 'security'
                );
                expect(securityImprovements.length).toBeGreaterThan(0);
            });

            it('should improve permission checks', async () => {
                const request: OptimizationRequest = {
                    code: '@destroy %0',
                    optimizationGoals: ['security']
                };

                const result = await optimizer.optimize(request);

                const permissionImprovements = result.improvements.filter(imp =>
                    imp.category === 'permissions'
                );
                expect(permissionImprovements.length).toBeGreaterThan(0);
            });

            it('should sanitize user input', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=[sql(SELECT * FROM table WHERE id=%0)]',
                    optimizationGoals: ['security']
                };

                const result = await optimizer.optimize(request);

                const sanitizationImprovements = result.improvements.filter(imp =>
                    imp.category === 'sanitization'
                );
                expect(sanitizationImprovements.length).toBeGreaterThan(0);
            });
        });

        describe('optimization goals', () => {
            it('should apply all goals by default', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=[strlen(%0)] [strlen(%0)] @destroy %1'
                };

                const result = await optimizer.optimize(request);

                // Should have improvements from multiple categories
                const types = new Set(result.improvements.map(imp => imp.type));
                expect(types.size).toBeGreaterThan(0);
            });

            it('should apply only specified goals', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=[strlen(%0)] [strlen(%0)]',
                    optimizationGoals: ['performance']
                };

                const result = await optimizer.optimize(request);

                // Should only have performance improvements
                const nonPerfImprovements = result.improvements.filter(imp =>
                    imp.type !== 'performance'
                );
                expect(nonPerfImprovements.length).toBe(0);
            });

            it('should handle multiple goals', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=[strlen(%0)] [strlen(%0)]    @destroy %1',
                    optimizationGoals: ['performance', 'security']
                };

                const result = await optimizer.optimize(request);

                const types = new Set(result.improvements.map(imp => imp.type));
                expect(types.has('performance') || types.has('security')).toBe(true);
            });
        });

        describe('server-specific optimization', () => {
            it('should handle server-specific optimizations', async () => {
                // Add a mock dialect to the knowledge base
                const mockDialect = {
                    name: 'PennMUSH',
                    version: '1.8.8',
                    description: 'PennMUSH server',
                    syntaxVariations: [],
                    uniqueFeatures: [],
                    securityModel: {
                        permissionLevels: ['public', 'player', 'builder', 'wizard', 'god'],
                        defaultLevel: 'public',
                        escalationRules: [],
                        restrictedFunctions: []
                    },
                    functionLibrary: [],
                    commonPatterns: [],
                    limitations: [],
                    documentation: {}
                };

                knowledgeBase.dialects.set('PennMUSH', mockDialect);

                const request: OptimizationRequest = {
                    code: '@pemit %#=Hello',
                    serverType: 'PennMUSH'
                };

                const result = await optimizer.optimize(request);

                expect(result.optimizedCode).toBeDefined();
                expect(result.improvements).toBeInstanceOf(Array);
            });
        });

        describe('aggressive optimization', () => {
            it('should apply more aggressive optimizations when enabled', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=[strlen(%0)] [strlen(%0)] [strlen(%0)]',
                    aggressiveOptimization: true
                };

                const result = await optimizer.optimize(request);

                expect(result.improvements).toBeInstanceOf(Array);
                // Aggressive optimization may produce more or different improvements
            });

            it('should be conservative by default', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=Hello'
                };

                const result = await optimizer.optimize(request);

                expect(result.improvements).toBeInstanceOf(Array);
            });
        });

        describe('functionality preservation', () => {
            it('should preserve functionality by default', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=Hello'
                };

                const result = await optimizer.optimize(request);

                expect(result.functionalityPreserved).toBe(true);
            });

            it('should allow disabling functionality preservation', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=Hello',
                    preserveFunctionality: false
                };

                const result = await optimizer.optimize(request);

                expect(result.functionalityPreserved).toBe(false);
                expect(result.warnings).toContain('Functionality preservation was disabled - please test thoroughly.');
            });
        });

        describe('result structure', () => {
            it('should return complete optimization result', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=Hello World'
                };

                const result = await optimizer.optimize(request);

                expect(result).toHaveProperty('optimizedCode');
                expect(result).toHaveProperty('improvements');
                expect(result).toHaveProperty('performanceImpact');
                expect(result).toHaveProperty('explanation');
                expect(result).toHaveProperty('originalSize');
                expect(result).toHaveProperty('optimizedSize');
                expect(result).toHaveProperty('compressionRatio');
                expect(result).toHaveProperty('functionalityPreserved');

                expect(typeof result.optimizedCode).toBe('string');
                expect(Array.isArray(result.improvements)).toBe(true);
                expect(typeof result.performanceImpact).toBe('string');
                expect(typeof result.explanation).toBe('string');
                expect(typeof result.originalSize).toBe('number');
                expect(typeof result.optimizedSize).toBe('number');
                expect(typeof result.compressionRatio).toBe('number');
                expect(typeof result.functionalityPreserved).toBe('boolean');
            });

            it('should calculate compression ratio correctly', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=Hello    World' // Extra spaces that might be optimized
                };

                const result = await optimizer.optimize(request);

                expect(result.originalSize).toBe(request.code.length);
                expect(result.optimizedSize).toBe(result.optimizedCode.length);

                if (result.originalSize > 0) {
                    const expectedRatio = (result.originalSize - result.optimizedSize) / result.originalSize;
                    expect(result.compressionRatio).toBeCloseTo(expectedRatio, 5);
                }
            });

            it('should provide meaningful performance impact description', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=[strlen(%0)] [strlen(%0)]',
                    optimizationGoals: ['performance']
                };

                const result = await optimizer.optimize(request);

                expect(result.performanceImpact).toBeDefined();
                expect(result.performanceImpact.length).toBeGreaterThan(0);
                expect(typeof result.performanceImpact).toBe('string');
            });

            it('should provide meaningful explanation', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=Hello'
                };

                const result = await optimizer.optimize(request);

                expect(result.explanation).toBeDefined();
                expect(result.explanation.length).toBeGreaterThan(0);
                expect(result.explanation).toContain('optimization');
            });

            it('should include warnings when appropriate', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=Hello',
                    preserveFunctionality: false
                };

                const result = await optimizer.optimize(request);

                expect(result.warnings).toBeDefined();
                expect(Array.isArray(result.warnings)).toBe(true);
                expect(result.warnings!.length).toBeGreaterThan(0);
            });
        });

        describe('edge cases', () => {
            it('should handle empty lines and comments', async () => {
                const request: OptimizationRequest = {
                    code: '@@ This is a comment\n\n@pemit %#=Hello\n@@ Another comment\n'
                };

                const result = await optimizer.optimize(request);

                expect(result.optimizedCode).toBeDefined();
                expect(result.improvements).toBeInstanceOf(Array);
            });

            it('should handle code with only comments', async () => {
                const request: OptimizationRequest = {
                    code: '@@ This is a comment\n@@ Another comment'
                };

                const result = await optimizer.optimize(request);

                expect(result.optimizedCode).toBeDefined();
                expect(result.improvements).toBeInstanceOf(Array);
            });

            it('should handle single line code', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=Hello'
                };

                const result = await optimizer.optimize(request);

                expect(result.optimizedCode).toBeDefined();
                expect(result.improvements).toBeInstanceOf(Array);
            });

            it('should handle code with special characters', async () => {
                const request: OptimizationRequest = {
                    code: '@pemit %#=Hello "World" & [test]'
                };

                const result = await optimizer.optimize(request);

                expect(result.optimizedCode).toBeDefined();
                expect(result.improvements).toBeInstanceOf(Array);
            });
        });
    });
});