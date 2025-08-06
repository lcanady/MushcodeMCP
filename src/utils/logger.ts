/**
 * Comprehensive logging system for MUSHCODE MCP Server
 * Provides structured logging with different levels and contexts
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogContext {
  toolName?: string;
  operation?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  serverType?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  performance?: {
    duration: number;
    operation: string;
  };
}

/**
 * Logger class with structured logging capabilities
 */
export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logEntries: LogEntry[] = [];
  private maxLogEntries: number = 1000;

  private constructor() {
    // Set log level from environment variable
    const envLogLevel = process.env['MUSHCODE_LOG_LEVEL']?.toLowerCase();
    switch (envLogLevel) {
      case 'debug':
        this.logLevel = LogLevel.DEBUG;
        break;
      case 'info':
        this.logLevel = LogLevel.INFO;
        break;
      case 'warn':
        this.logLevel = LogLevel.WARN;
        break;
      case 'error':
        this.logLevel = LogLevel.ERROR;
        break;
      case 'fatal':
        this.logLevel = LogLevel.FATAL;
        break;
      default:
        this.logLevel = LogLevel.INFO;
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set the minimum log level
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Get current log level
   */
  public getLogLevel(): LogLevel {
    return this.logLevel;
  }

  /**
   * Log a debug message
   */
  public debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log an info message
   */
  public info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an error message
   */
  public error(message: string, error?: Error, context?: LogContext): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      ...(context && { context })
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        ...(error.stack && { stack: error.stack }),
        ...((error as any).code && { code: (error as any).code })
      };
    }

    this.addLogEntry(logEntry);
  }

  /**
   * Log a fatal error message
   */
  public fatal(message: string, error?: Error, context?: LogContext): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.FATAL,
      message,
      ...(context && { context })
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        ...(error.stack && { stack: error.stack }),
        ...((error as any).code && { code: (error as any).code })
      };
    }

    this.addLogEntry(logEntry);
  }

  /**
   * Log performance metrics
   */
  public performance(operation: string, duration: number, context?: LogContext): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message: `Performance: ${operation} completed in ${duration}ms`,
      ...(context && { context }),
      performance: {
        duration,
        operation
      }
    };

    this.addLogEntry(logEntry);
  }

  /**
   * Create a performance timer
   */
  public startTimer(operation: string, context?: LogContext): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.performance(operation, duration, context);
    };
  }

  /**
   * Get recent log entries
   */
  public getRecentLogs(count: number = 100): LogEntry[] {
    return this.logEntries.slice(-count);
  }

  /**
   * Get logs by level
   */
  public getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logEntries.filter(entry => entry.level === level);
  }

  /**
   * Clear all log entries
   */
  public clearLogs(): void {
    this.logEntries = [];
  }

  /**
   * Get log statistics
   */
  public getLogStats(): Record<string, number> {
    const stats: Record<string, number> = {
      total: this.logEntries.length,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      fatal: 0
    };

    for (const entry of this.logEntries) {
      switch (entry.level) {
        case LogLevel.DEBUG:
          stats['debug'] = (stats['debug'] || 0) + 1;
          break;
        case LogLevel.INFO:
          stats['info'] = (stats['info'] || 0) + 1;
          break;
        case LogLevel.WARN:
          stats['warn'] = (stats['warn'] || 0) + 1;
          break;
        case LogLevel.ERROR:
          stats['error'] = (stats['error'] || 0) + 1;
          break;
        case LogLevel.FATAL:
          stats['fatal'] = (stats['fatal'] || 0) + 1;
          break;
      }
    }

    return stats;
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (level < this.logLevel) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context })
    };

    this.addLogEntry(logEntry);
  }

  /**
   * Add log entry and manage log rotation
   */
  private addLogEntry(entry: LogEntry): void {
    this.logEntries.push(entry);

    // Rotate logs if we exceed max entries
    if (this.logEntries.length > this.maxLogEntries) {
      this.logEntries = this.logEntries.slice(-this.maxLogEntries);
    }

    // Output to console in development
    if (process.env['NODE_ENV'] !== 'production') {
      this.outputToConsole(entry);
    }
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const contextStr = entry.context ? ` [${JSON.stringify(entry.context)}]` : '';
    const errorStr = entry.error ? ` Error: ${entry.error.message}` : '';
    const perfStr = entry.performance ? ` (${entry.performance.duration}ms)` : '';
    
    const logMessage = `[${entry.timestamp}] ${levelName}: ${entry.message}${contextStr}${errorStr}${perfStr}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logMessage);
        if (entry.error?.stack) {
          console.error(entry.error.stack);
        }
        break;
    }
  }
}

/**
 * Global logger instance
 */
export const logger = Logger.getInstance();

/**
 * Decorator for logging method calls
 */
export function logMethodCall(target: any, propertyName: string, descriptor: PropertyDescriptor): void {
  const method = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const className = target.constructor.name;
    const methodName = propertyName;
    const context: LogContext = {
      operation: `${className}.${methodName}`
    };

    logger.debug(`Calling ${className}.${methodName}`, context);
    const timer = logger.startTimer(`${className}.${methodName}`, context);

    try {
      const result = method.apply(this, args);
      
      // Handle async methods
      if (result && typeof result.then === 'function') {
        return result
          .then((value: any) => {
            timer();
            logger.debug(`${className}.${methodName} completed successfully`, context);
            return value;
          })
          .catch((error: any) => {
            timer();
            logger.error(`${className}.${methodName} failed`, error, context);
            throw error;
          });
      }

      timer();
      logger.debug(`${className}.${methodName} completed successfully`, context);
      return result;
    } catch (error) {
      timer();
      logger.error(`${className}.${methodName} failed`, error as Error, context);
      throw error;
    }
  };
}