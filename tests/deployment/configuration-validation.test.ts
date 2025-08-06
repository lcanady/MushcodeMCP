import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('Configuration Validation Tests', () => {
  const testConfigPath = join(process.cwd(), 'validation-test-config.json');

  beforeEach(() => {
    // Clean up any existing test config
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
  });

  afterEach(() => {
    // Clean up test config
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
  });

  test('should validate valid configuration successfully', async () => {
    const validConfig = {
      server: {
        name: 'test-server',
        version: '1.0.0',
        description: 'Test server'
      },
      knowledge: {
        dataPath: './data/knowledge',
        cacheEnabled: true,
        cacheSize: 500,
        lazyLoading: true
      },
      performance: {
        responseTimeoutMs: 3000,
        maxConcurrentRequests: 5,
        enableMetrics: false
      },
      logging: {
        level: 'info',
        enableFileLogging: false
      },
      security: {
        enableInputValidation: true,
        maxInputLength: 5000,
        enableRateLimiting: false
      },
      tools: {
        enabled: ['generate_mushcode', 'validate_mushcode'],
        disabled: [],
        defaultServerType: 'PennMUSH',
        supportedServerTypes: ['PennMUSH', 'TinyMUSH']
      }
    };

    writeFileSync(testConfigPath, JSON.stringify(validConfig, null, 2));

    const validationResult = await runConfigValidation(testConfigPath);
    expect(validationResult.success).toBe(true);
    expect(validationResult.output).toContain('✅ Configuration is valid');
  });

  test('should detect invalid server configuration', async () => {
    const invalidConfig = {
      server: {
        name: '', // Invalid: empty name
        version: '1.0.0'
      }
    };

    writeFileSync(testConfigPath, JSON.stringify(invalidConfig, null, 2));

    const validationResult = await runConfigValidation(testConfigPath);
    expect(validationResult.success).toBe(false);
    expect(validationResult.output).toContain('Server name cannot be empty');
  });

  test('should detect invalid performance configuration', async () => {
    const invalidConfig = {
      server: {
        name: 'test-server',
        version: '1.0.0'
      },
      performance: {
        responseTimeoutMs: 500, // Too low
        maxConcurrentRequests: 0 // Invalid
      }
    };

    writeFileSync(testConfigPath, JSON.stringify(invalidConfig, null, 2));

    const validationResult = await runConfigValidation(testConfigPath);
    expect(validationResult.success).toBe(false);
    expect(validationResult.output).toContain('Response timeout must be at least 1000ms');
    expect(validationResult.output).toContain('Max concurrent requests must be at least 1');
  });

  test('should detect invalid cache configuration', async () => {
    const invalidConfig = {
      server: {
        name: 'test-server',
        version: '1.0.0'
      },
      knowledge: {
        cacheSize: 0 // Invalid
      }
    };

    writeFileSync(testConfigPath, JSON.stringify(invalidConfig, null, 2));

    const validationResult = await runConfigValidation(testConfigPath);
    expect(validationResult.success).toBe(false);
    expect(validationResult.output).toContain('Cache size must be at least 1');
  });

  test('should detect invalid security configuration', async () => {
    const invalidConfig = {
      server: {
        name: 'test-server',
        version: '1.0.0'
      },
      security: {
        maxInputLength: 50 // Too low
      }
    };

    writeFileSync(testConfigPath, JSON.stringify(invalidConfig, null, 2));

    const validationResult = await runConfigValidation(testConfigPath);
    expect(validationResult.success).toBe(false);
    expect(validationResult.output).toContain('Max input length must be at least 100 characters');
  });

  test('should detect invalid tools configuration', async () => {
    const invalidConfig = {
      server: {
        name: 'test-server',
        version: '1.0.0'
      },
      tools: {
        enabled: ['generate_mushcode'],
        defaultServerType: 'InvalidServer',
        supportedServerTypes: ['PennMUSH', 'TinyMUSH']
      }
    };

    writeFileSync(testConfigPath, JSON.stringify(invalidConfig, null, 2));

    const validationResult = await runConfigValidation(testConfigPath);
    expect(validationResult.success).toBe(false);
    expect(validationResult.output).toContain('Default server type \'InvalidServer\' is not in supported server types');
  });

  test('should detect invalid logging configuration', async () => {
    const invalidConfig = {
      server: {
        name: 'test-server',
        version: '1.0.0'
      },
      logging: {
        level: 'invalid-level'
      }
    };

    writeFileSync(testConfigPath, JSON.stringify(invalidConfig, null, 2));

    const validationResult = await runConfigValidation(testConfigPath);
    expect(validationResult.success).toBe(false);
    expect(validationResult.output).toContain('Invalid log level \'invalid-level\'');
  });

  test('should handle malformed JSON configuration', async () => {
    const malformedJson = '{ "server": { "name": "test", "version": "1.0.0" } // invalid comment';
    writeFileSync(testConfigPath, malformedJson);

    const validationResult = await runConfigValidation(testConfigPath);
    expect(validationResult.success).toBe(false);
    expect(validationResult.output).toContain('Error');
  });

  test('should handle missing configuration file', async () => {
    const nonExistentPath = join(process.cwd(), 'non-existent-config.json');
    
    const validationResult = await runConfigValidation(nonExistentPath);
    // Should use default configuration when file doesn't exist
    expect(validationResult.success).toBe(true);
  });

  test('should show configuration summary for valid config', async () => {
    const validConfig = {
      server: {
        name: 'summary-test-server',
        version: '2.0.0',
        description: 'Test server for summary'
      },
      tools: {
        enabled: ['generate_mushcode', 'validate_mushcode', 'optimize_mushcode'],
        defaultServerType: 'TinyMUSH'
      },
      logging: {
        level: 'debug'
      },
      performance: {
        responseTimeoutMs: 8000
      }
    };

    writeFileSync(testConfigPath, JSON.stringify(validConfig, null, 2));

    const validationResult = await runConfigValidation(testConfigPath);
    expect(validationResult.success).toBe(true);
    expect(validationResult.output).toContain('Configuration summary:');
    expect(validationResult.output).toContain('Server: summary-test-server v2.0.0');
    expect(validationResult.output).toContain('Tools enabled: 3');
    expect(validationResult.output).toContain('Default server type: TinyMUSH');
    expect(validationResult.output).toContain('Log level: debug');
    expect(validationResult.output).toContain('Response timeout: 8000ms');
  });

  async function runConfigValidation(configPath: string): Promise<{ success: boolean; output: string }> {
    return new Promise((resolve) => {
      const process = spawn('node', ['dist/scripts/validate-config.js', configPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      process.stdout?.on('data', (data) => {
        output += data.toString();
      });

      process.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        resolve({
          success: code === 0,
          output: output + errorOutput
        });
      });
    });
  }
});