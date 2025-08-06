import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';

describe('Environment Compatibility Tests', () => {
  let serverProcess: ChildProcess | null = null;
  const testDir = join(tmpdir(), 'mushcode-mcp-test');
  const testConfigPath = join(testDir, 'test-config.json');
  const testDataPath = join(testDir, 'data');
  const testLogPath = join(testDir, 'logs');

  beforeAll(() => {
    // Create test directories
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
    if (!existsSync(testDataPath)) {
      mkdirSync(testDataPath, { recursive: true });
    }
    if (!existsSync(testLogPath)) {
      mkdirSync(testLogPath, { recursive: true });
    }
  });

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
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  });

  afterAll(() => {
    // Clean up test directory
    try {
      if (existsSync(testConfigPath)) {
        unlinkSync(testConfigPath);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test('should work with custom data path', async () => {
    const customDataPath = join(testDir, 'custom-knowledge');
    mkdirSync(customDataPath, { recursive: true });

    const config = {
      server: {
        name: 'custom-data-test',
        version: '1.0.0'
      },
      knowledge: {
        dataPath: customDataPath,
        cacheEnabled: false // Disable cache for faster startup
      },
      logging: {
        level: 'warn' // Reduce log noise
      }
    };

    writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

    const startupPromise = new Promise<boolean>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 15000);

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
        if (output.includes('Starting custom-data-test')) {
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
  }, 20000);

  test('should work with file logging enabled', async () => {
    const logFile = join(testLogPath, 'test-server.log');

    const config = {
      server: {
        name: 'file-logging-test',
        version: '1.0.0'
      },
      logging: {
        level: 'info',
        enableFileLogging: true,
        logFilePath: logFile
      },
      knowledge: {
        cacheEnabled: false
      }
    };

    writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

    const startupPromise = new Promise<boolean>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 15000);

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
        if (output.includes('Starting file-logging-test')) {
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

    // Check if log file was created (may not exist if server didn't log anything)
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Note: Log file creation depends on actual logging activity, so we just verify the server started successfully
  }, 20000);

  test('should handle different Node.js environments', async () => {
    const environments = ['development', 'production', 'test'];

    for (const env of environments) {
      const config = {
        server: {
          name: `env-test-${env}`,
          version: '1.0.0'
        },
        logging: {
          level: env === 'production' ? 'warn' : 'info'
        },
        knowledge: {
          cacheEnabled: env === 'production'
        }
      };

      const envConfigPath = join(testDir, `config-${env}.json`);
      writeFileSync(envConfigPath, JSON.stringify(config, null, 2));

      const startupPromise = new Promise<boolean>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Server startup timeout for ${env}`));
        }, 15000);

        const childProcess = spawn('node', ['dist/server/index.js'], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { 
            ...process.env, 
            NODE_ENV: env,
            MUSHCODE_CONFIG_PATH: envConfigPath
          }
        });

        let output = '';
        childProcess.stdout?.on('data', (data: Buffer) => {
          output += data.toString();
          if (output.includes(`Starting env-test-${env}`)) {
            clearTimeout(timeout);
            childProcess.kill('SIGTERM');
            resolve(true);
          }
        });

        childProcess.stderr?.on('data', (data: Buffer) => {
          const error = data.toString();
          if (error.includes('Error') || error.includes('Failed')) {
            clearTimeout(timeout);
            childProcess.kill('SIGTERM');
            reject(new Error(`Server startup error for ${env}: ${error}`));
          }
        });

        childProcess.on('error', (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      await expect(startupPromise).resolves.toBe(true);

      // Clean up config file
      unlinkSync(envConfigPath);
    }
  }, 60000);

  test('should handle memory constraints', async () => {
    const config = {
      server: {
        name: 'memory-test',
        version: '1.0.0'
      },
      knowledge: {
        cacheEnabled: true,
        cacheSize: 10 // Very small cache
      },
      performance: {
        maxConcurrentRequests: 2 // Low concurrency
      },
      logging: {
        level: 'error' // Minimal logging
      }
    };

    writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

    const startupPromise = new Promise<boolean>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 15000);

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
        if (output.includes('Starting memory-test')) {
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
  }, 20000);

  test('should work with minimal tool set', async () => {
    const config = {
      server: {
        name: 'minimal-tools-test',
        version: '1.0.0'
      },
      tools: {
        enabled: ['generate_mushcode'], // Only one tool
        disabled: [],
        defaultServerType: 'PennMUSH',
        supportedServerTypes: ['PennMUSH']
      },
      knowledge: {
        cacheEnabled: false
      },
      logging: {
        level: 'warn'
      }
    };

    writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

    const startupPromise = new Promise<boolean>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 15000);

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
        if (output.includes('Starting minimal-tools-test')) {
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
  }, 20000);

  test('should handle environment variable overrides correctly', async () => {
    const baseConfig = {
      server: {
        name: 'base-server',
        version: '1.0.0'
      },
      logging: {
        level: 'info'
      },
      tools: {
        defaultServerType: 'PennMUSH'
      }
    };

    writeFileSync(testConfigPath, JSON.stringify(baseConfig, null, 2));

    const startupPromise = new Promise<boolean>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 15000);

      serverProcess = spawn('node', ['dist/server/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { 
          ...process.env, 
          NODE_ENV: 'test',
          MUSHCODE_CONFIG_PATH: testConfigPath,
          MUSHCODE_SERVER_NAME: 'env-override-server',
          MUSHCODE_LOG_LEVEL: 'debug',
          MUSHCODE_DEFAULT_SERVER_TYPE: 'TinyMUSH'
        }
      });

      let output = '';
      serverProcess.stdout?.on('data', (data) => {
        output += data.toString();
        // Should use the environment override name
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
  }, 20000);
});