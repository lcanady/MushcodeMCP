import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { writeFileSync, unlinkSync, existsSync } from 'fs';

describe('Server Startup Tests', () => {
  let serverProcess: ChildProcess | null = null;
  const testConfigPath = join(process.cwd(), 'test-config.json');

  beforeEach(() => {
    // Clean up any existing test config
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
  });

  afterEach(async () => {
    // Clean up server process
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      serverProcess = null;
    }

    // Clean up test config
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
  });

  test('should start server with default configuration', async () => {
    const startupPromise = new Promise<boolean>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 10000);

      serverProcess = spawn('node', ['dist/server/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let output = '';
      serverProcess.stdout?.on('data', (data) => {
        output += data.toString();
        if (output.includes('Starting mushcode-mcp-server')) {
          clearTimeout(timeout);
          resolve(true);
        }
      });

      serverProcess.stderr?.on('data', (data) => {
        const error = data.toString();
        if (error.includes('Error') || error.includes('Failed')) {
          clearTimeout(timeout);
          reject(new Error(`Server startup error: ${error}`));
        }
      });

      serverProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    await expect(startupPromise).resolves.toBe(true);
  }, 15000);

  test('should start server with custom configuration', async () => {
    const testConfig = {
      server: {
        name: 'test-mushcode-server',
        version: '1.0.0-test',
        description: 'Test server instance'
      },
      logging: {
        level: 'debug',
        enableFileLogging: false
      },
      tools: {
        enabled: ['generate_mushcode', 'validate_mushcode'],
        disabled: [],
        defaultServerType: 'TinyMUSH',
        supportedServerTypes: ['TinyMUSH', 'PennMUSH']
      }
    };

    writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));

    const startupPromise = new Promise<boolean>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 10000);

      serverProcess = spawn('node', ['dist/server/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { 
          ...process.env, 
          NODE_ENV: 'test',
          MUSHCODE_CONFIG_PATH: testConfigPath
        }
      });

      let output = '';
      serverProcess.stdout?.on('data', (data) => {
        output += data.toString();
        if (output.includes('Starting test-mushcode-server')) {
          clearTimeout(timeout);
          resolve(true);
        }
      });

      serverProcess.stderr?.on('data', (data) => {
        const error = data.toString();
        if (error.includes('Error') || error.includes('Failed')) {
          clearTimeout(timeout);
          reject(new Error(`Server startup error: ${error}`));
        }
      });

      serverProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    await expect(startupPromise).resolves.toBe(true);
  }, 15000);

  test('should fail with invalid configuration', async () => {
    const invalidConfig = {
      server: {
        name: '', // Invalid: empty name
        version: '1.0.0'
      },
      performance: {
        responseTimeoutMs: -1000 // Invalid: negative timeout
      }
    };

    writeFileSync(testConfigPath, JSON.stringify(invalidConfig, null, 2));

    const startupPromise = new Promise<boolean>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Expected server to fail startup'));
      }, 5000);

      serverProcess = spawn('node', ['dist/server/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { 
          ...process.env, 
          NODE_ENV: 'test',
          MUSHCODE_CONFIG_PATH: testConfigPath
        }
      });

      serverProcess.stderr?.on('data', (data) => {
        const error = data.toString();
        if (error.includes('Configuration validation failed')) {
          clearTimeout(timeout);
          resolve(true);
        }
      });

      serverProcess.on('exit', (code) => {
        if (code !== 0) {
          clearTimeout(timeout);
          resolve(true);
        }
      });
    });

    await expect(startupPromise).resolves.toBe(true);
  }, 10000);

  test('should handle environment variable overrides', async () => {
    const startupPromise = new Promise<boolean>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 10000);

      serverProcess = spawn('node', ['dist/server/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { 
          ...process.env, 
          NODE_ENV: 'test',
          MUSHCODE_SERVER_NAME: 'env-override-server',
          MUSHCODE_LOG_LEVEL: 'debug',
          MUSHCODE_DEFAULT_SERVER_TYPE: 'RhostMUSH'
        }
      });

      let output = '';
      serverProcess.stdout?.on('data', (data) => {
        output += data.toString();
        if (output.includes('Starting env-override-server')) {
          clearTimeout(timeout);
          resolve(true);
        }
      });

      serverProcess.stderr?.on('data', (data) => {
        const error = data.toString();
        if (error.includes('Error') || error.includes('Failed')) {
          clearTimeout(timeout);
          reject(new Error(`Server startup error: ${error}`));
        }
      });

      serverProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    await expect(startupPromise).resolves.toBe(true);
  }, 15000);

  test('should handle graceful shutdown on SIGTERM', async () => {
    const startupPromise = new Promise<boolean>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 10000);

      serverProcess = spawn('node', ['dist/server/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });

      serverProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Starting mushcode-mcp-server')) {
          clearTimeout(timeout);
          resolve(true);
        }
      });

      serverProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    await startupPromise;

    const shutdownPromise = new Promise<number | null>((resolve) => {
      serverProcess!.on('exit', (code) => {
        resolve(code);
      });

      // Send SIGTERM
      serverProcess!.kill('SIGTERM');
    });

    const exitCode = await shutdownPromise;
    expect([0, null]).toContain(exitCode); // null is acceptable for graceful shutdown
  }, 20000);

  test('should validate configuration before starting', async () => {
    const configWithErrors = {
      server: {
        name: 'test-server',
        version: '1.0.0'
      },
      performance: {
        responseTimeoutMs: 500, // Too low
        maxConcurrentRequests: 0 // Invalid
      },
      tools: {
        enabled: ['generate_mushcode'],
        defaultServerType: 'InvalidServer', // Not in supported types
        supportedServerTypes: ['PennMUSH']
      }
    };

    writeFileSync(testConfigPath, JSON.stringify(configWithErrors, null, 2));

    const validationPromise = new Promise<string[]>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Validation timeout'));
      }, 5000);

      serverProcess = spawn('node', ['dist/server/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { 
          ...process.env, 
          NODE_ENV: 'test',
          MUSHCODE_CONFIG_PATH: testConfigPath
        }
      });

      let errorOutput = '';
      serverProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      serverProcess.on('exit', (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          const errors = errorOutput.split('\n').filter(line => line.includes('  - '));
          resolve(errors);
        } else {
          reject(new Error('Expected validation to fail'));
        }
      });
    });

    const errors = await validationPromise;
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(error => error.includes('Response timeout must be at least 1000ms'))).toBe(true);
    expect(errors.some(error => error.includes('Max concurrent requests must be at least 1'))).toBe(true);
    expect(errors.some(error => error.includes('Default server type'))).toBe(true);
  }, 10000);
});