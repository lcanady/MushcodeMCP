import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ServerConfig {
  server: {
    name: string;
    version: string;
    description: string;
    port?: number;
    host?: string;
  };
  knowledge: {
    dataPath: string;
    cacheEnabled: boolean;
    cacheSize: number;
    lazyLoading: boolean;
  };
  performance: {
    responseTimeoutMs: number;
    maxConcurrentRequests: number;
    enableMetrics: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableFileLogging: boolean;
    logFilePath?: string;
  };
  security: {
    enableInputValidation: boolean;
    maxInputLength: number;
    enableRateLimiting: boolean;
    rateLimit?: {
      windowMs: number;
      maxRequests: number;
    };
  };
  tools: {
    enabled: string[];
    disabled: string[];
    defaultServerType: string;
    supportedServerTypes: string[];
  };
}

const DEFAULT_CONFIG: ServerConfig = {
  server: {
    name: 'mushcode-mcp-server',
    version: '1.0.0',
    description: 'A specialized Model Context Protocol server for MUSHCODE development assistance',
  },
  knowledge: {
    dataPath: './data/knowledge',
    cacheEnabled: true,
    cacheSize: 1000,
    lazyLoading: true,
  },
  performance: {
    responseTimeoutMs: 5000,
    maxConcurrentRequests: 10,
    enableMetrics: false,
  },
  logging: {
    level: 'info',
    enableFileLogging: false,
  },
  security: {
    enableInputValidation: true,
    maxInputLength: 10000,
    enableRateLimiting: false,
  },
  tools: {
    enabled: [
      'generate_mushcode',
      'validate_mushcode',
      'optimize_mushcode',
      'explain_mushcode',
      'get_examples',
      'format_mushcode',
      'compress_mushcode'
    ],
    disabled: [],
    defaultServerType: 'PennMUSH',
    supportedServerTypes: ['PennMUSH', 'TinyMUSH', 'RhostMUSH', 'TinyMUX'],
  },
};

export class ConfigManager {
  private config: ServerConfig;
  private configPath: string | undefined;

  constructor(configPath?: string) {
    this.configPath = configPath;
    this.config = this.loadConfig();
  }

  private loadConfig(): ServerConfig {
    let config = { ...DEFAULT_CONFIG };

    // Try to load from specified path or default locations
    const configPaths = [
      this.configPath,
      process.env['MUSHCODE_CONFIG_PATH'],
      './mushcode-mcp.config.json',
      join(process.cwd(), 'mushcode-mcp.config.json'),
      join(__dirname, '../../mushcode-mcp.config.json'),
    ].filter(Boolean) as string[];

    for (const path of configPaths) {
      if (existsSync(path)) {
        try {
          const fileContent = readFileSync(path, 'utf-8');
          const userConfig = JSON.parse(fileContent);
          config = this.mergeConfig(config, userConfig);
          console.log(`Loaded configuration from: ${path}`);
          break;
        } catch (error) {
          console.warn(`Failed to load config from ${path}:`, error);
          // If this was the explicitly requested config path, throw the error
          if (path === this.configPath) {
            throw error;
          }
        }
      }
    }

    // Override with environment variables
    config = this.applyEnvironmentOverrides(config);

    return config;
  }

  private mergeConfig(base: ServerConfig, override: Partial<ServerConfig>): ServerConfig {
    const merged = { ...base };

    for (const [key, value] of Object.entries(override)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        merged[key as keyof ServerConfig] = {
          ...merged[key as keyof ServerConfig],
          ...value,
        } as any;
      } else {
        merged[key as keyof ServerConfig] = value as any;
      }
    }

    return merged;
  }

  private applyEnvironmentOverrides(config: ServerConfig): ServerConfig {
    const envConfig = { ...config };

    // Server configuration
    if (process.env['MUSHCODE_SERVER_NAME']) {
      envConfig.server.name = process.env['MUSHCODE_SERVER_NAME'];
    }
    if (process.env['MUSHCODE_SERVER_PORT']) {
      envConfig.server.port = parseInt(process.env['MUSHCODE_SERVER_PORT'], 10);
    }
    if (process.env['MUSHCODE_SERVER_HOST']) {
      envConfig.server.host = process.env['MUSHCODE_SERVER_HOST'];
    }

    // Knowledge base configuration
    if (process.env['MUSHCODE_DATA_PATH']) {
      envConfig.knowledge.dataPath = process.env['MUSHCODE_DATA_PATH'];
    }
    if (process.env['MUSHCODE_CACHE_ENABLED']) {
      envConfig.knowledge.cacheEnabled = process.env['MUSHCODE_CACHE_ENABLED'] === 'true';
    }

    // Performance configuration
    if (process.env['MUSHCODE_RESPONSE_TIMEOUT']) {
      envConfig.performance.responseTimeoutMs = parseInt(process.env['MUSHCODE_RESPONSE_TIMEOUT'], 10);
    }
    if (process.env['MUSHCODE_MAX_CONCURRENT']) {
      envConfig.performance.maxConcurrentRequests = parseInt(process.env['MUSHCODE_MAX_CONCURRENT'], 10);
    }

    // Logging configuration
    if (process.env['MUSHCODE_LOG_LEVEL']) {
      envConfig.logging.level = process.env['MUSHCODE_LOG_LEVEL'] as any;
    }
    if (process.env['MUSHCODE_LOG_FILE']) {
      envConfig.logging.enableFileLogging = true;
      envConfig.logging.logFilePath = process.env['MUSHCODE_LOG_FILE'];
    }

    // Security configuration
    if (process.env['MUSHCODE_MAX_INPUT_LENGTH']) {
      envConfig.security.maxInputLength = parseInt(process.env['MUSHCODE_MAX_INPUT_LENGTH'], 10);
    }

    // Tools configuration
    if (process.env['MUSHCODE_DEFAULT_SERVER_TYPE']) {
      envConfig.tools.defaultServerType = process.env['MUSHCODE_DEFAULT_SERVER_TYPE'];
    }

    return envConfig;
  }

  public getConfig(): ServerConfig {
    return { ...this.config };
  }

  public get<K extends keyof ServerConfig>(section: K): ServerConfig[K] {
    return this.config[section];
  }

  public reload(): void {
    this.config = this.loadConfig();
  }

  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate server configuration
    if (!this.config.server.name || this.config.server.name.trim() === '') {
      errors.push('Server name cannot be empty');
    }

    if (this.config.server.port && (this.config.server.port < 1 || this.config.server.port > 65535)) {
      errors.push('Server port must be between 1 and 65535');
    }

    // Validate performance configuration
    if (this.config.performance.responseTimeoutMs < 1000) {
      errors.push('Response timeout must be at least 1000ms');
    }

    if (this.config.performance.maxConcurrentRequests < 1) {
      errors.push('Max concurrent requests must be at least 1');
    }

    // Validate knowledge base configuration
    if (this.config.knowledge.cacheSize < 1) {
      errors.push('Cache size must be at least 1');
    }

    // Validate security configuration
    if (this.config.security.maxInputLength < 100) {
      errors.push('Max input length must be at least 100 characters');
    }

    // Validate tools configuration
    if (!this.config.tools.supportedServerTypes.includes(this.config.tools.defaultServerType)) {
      errors.push(`Default server type '${this.config.tools.defaultServerType}' is not in supported server types`);
    }

    // Validate logging configuration
    const validLogLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLogLevels.includes(this.config.logging.level)) {
      errors.push(`Invalid log level '${this.config.logging.level}'. Must be one of: ${validLogLevels.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Global configuration instance
let globalConfig: ConfigManager | null = null;

export function getConfig(configPath?: string): ConfigManager {
  if (!globalConfig) {
    globalConfig = new ConfigManager(configPath);
  }
  return globalConfig;
}

export function reloadConfig(): void {
  if (globalConfig) {
    globalConfig.reload();
  }
}