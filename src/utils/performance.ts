/**
 * Performance monitoring and metrics collection
 * Tracks response times, operation counts, and system performance
 */

import { logger } from './logger.js';

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  metadata?: Record<string, any>;
}

export interface PerformanceStats {
  operation: string;
  count: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  recentDurations: number[];
  p95Duration: number;
  p99Duration: number;
}

export interface SystemMetrics {
  memoryUsage: NodeJS.MemoryUsage;
  uptime: number;
  timestamp: number;
}

/**
 * Performance monitor for tracking operation metrics
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number = 10000;
  private alertThresholds = new Map<string, number>();
  private systemMetricsHistory: SystemMetrics[] = [];
  private maxSystemMetrics: number = 1000;

  private constructor() {
    // Set default alert thresholds (in milliseconds)
    this.alertThresholds.set('generate_mushcode', 5000);
    this.alertThresholds.set('validate_mushcode', 3000);
    this.alertThresholds.set('optimize_mushcode', 4000);
    this.alertThresholds.set('explain_mushcode', 3000);
    this.alertThresholds.set('get_examples', 2000);
    this.alertThresholds.set('format_mushcode', 1000);
    this.alertThresholds.set('compress_mushcode', 2000);
    this.alertThresholds.set('knowledge_search', 1000);
    this.alertThresholds.set('pattern_match', 500);

    // Start system metrics collection
    this.startSystemMetricsCollection();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Record a performance metric
   */
  recordMetric(operation: string, duration: number, success: boolean = true, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      success,
      ...(metadata && { metadata })
    };

    this.metrics.push(metric);

    // Rotate metrics if we exceed max
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Check for performance alerts
    this.checkPerformanceAlert(operation, duration);

    logger.performance(operation, duration, {
      operation: 'performance_record',
      success,
      ...metadata
    });
  }

  /**
   * Start a performance timer
   */
  startTimer(operation: string, metadata?: Record<string, any>): (success?: boolean) => void {
    const startTime = Date.now();
    
    return (success: boolean = true) => {
      const duration = Date.now() - startTime;
      this.recordMetric(operation, duration, success, metadata);
    };
  }

  /**
   * Get performance statistics for an operation
   */
  getOperationStats(operation: string, timeWindowMs?: number): PerformanceStats | undefined {
    const cutoffTime = timeWindowMs ? Date.now() - timeWindowMs : 0;
    const operationMetrics = this.metrics.filter(m => 
      m.operation === operation && m.timestamp >= cutoffTime
    );

    if (operationMetrics.length === 0) {
      return undefined;
    }

    const durations = operationMetrics.map(m => m.duration).sort((a, b) => a - b);
    const successfulOps = operationMetrics.filter(m => m.success).length;

    return {
      operation,
      count: operationMetrics.length,
      totalDuration: durations.reduce((sum, d) => sum + d, 0),
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: durations[0] || 0,
      maxDuration: durations[durations.length - 1] || 0,
      successRate: successfulOps / operationMetrics.length,
      recentDurations: durations.slice(-10), // Last 10 operations
      p95Duration: this.calculatePercentile(durations, 0.95),
      p99Duration: this.calculatePercentile(durations, 0.99)
    };
  }

  /**
   * Get statistics for all operations
   */
  getAllOperationStats(timeWindowMs?: number): PerformanceStats[] {
    const operations = [...new Set(this.metrics.map(m => m.operation))];
    return operations
      .map(op => this.getOperationStats(op, timeWindowMs))
      .filter(Boolean) as PerformanceStats[];
  }

  /**
   * Get operations that are performing poorly
   */
  getSlowOperations(thresholdMs?: number): Array<{operation: string; stats: PerformanceStats}> {
    const allStats = this.getAllOperationStats();
    const slowOps: Array<{operation: string; stats: PerformanceStats}> = [];

    for (const stats of allStats) {
      const threshold = thresholdMs || this.alertThresholds.get(stats.operation) || 5000;
      if (stats.averageDuration > threshold || stats.p95Duration > threshold * 1.5) {
        slowOps.push({ operation: stats.operation, stats });
      }
    }

    return slowOps.sort((a, b) => b.stats.averageDuration - a.stats.averageDuration);
  }

  /**
   * Set alert threshold for an operation
   */
  setAlertThreshold(operation: string, thresholdMs: number): void {
    this.alertThresholds.set(operation, thresholdMs);
    logger.info(`Set performance alert threshold for ${operation}: ${thresholdMs}ms`, {
      operation: 'performance_threshold_set'
    });
  }

  /**
   * Get current system metrics
   */
  getCurrentSystemMetrics(): SystemMetrics {
    return {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: Date.now()
    };
  }

  /**
   * Get system metrics history
   */
  getSystemMetricsHistory(count: number = 100): SystemMetrics[] {
    return this.systemMetricsHistory.slice(-count);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(timeWindowMs: number = 3600000): { // 1 hour default
    operations: PerformanceStats[];
    systemMetrics: SystemMetrics;
    alerts: Array<{operation: string; issue: string; value: number; threshold: number}>;
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
  } {
    const operations = this.getAllOperationStats(timeWindowMs);
    const currentMetrics = this.getCurrentSystemMetrics();
    const slowOps = this.getSlowOperations();
    
    const cutoffTime = Date.now() - timeWindowMs;
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoffTime);
    const totalRequests = recentMetrics.length;
    const averageResponseTime = totalRequests > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests 
      : 0;
    const errorRate = totalRequests > 0 
      ? recentMetrics.filter(m => !m.success).length / totalRequests 
      : 0;

    const alerts = slowOps.map(({ operation, stats }) => ({
      operation,
      issue: 'High response time',
      value: stats.averageDuration,
      threshold: this.alertThresholds.get(operation) || 5000
    }));

    return {
      operations,
      systemMetrics: currentMetrics,
      alerts,
      totalRequests,
      averageResponseTime,
      errorRate
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    const previousCount = this.metrics.length;
    this.metrics = [];
    this.systemMetricsHistory = [];
    
    logger.info(`Cleared ${previousCount} performance metrics`, {
      operation: 'performance_clear'
    });
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(timeWindowMs?: number): {
    metrics: PerformanceMetric[];
    systemMetrics: SystemMetrics[];
    exportTime: number;
  } {
    const cutoffTime = timeWindowMs ? Date.now() - timeWindowMs : 0;
    const filteredMetrics = this.metrics.filter(m => m.timestamp >= cutoffTime);
    const filteredSystemMetrics = this.systemMetricsHistory.filter(m => m.timestamp >= cutoffTime);

    return {
      metrics: filteredMetrics,
      systemMetrics: filteredSystemMetrics,
      exportTime: Date.now()
    };
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))] || 0;
  }

  /**
   * Check if operation duration exceeds alert threshold
   */
  private checkPerformanceAlert(operation: string, duration: number): void {
    const threshold = this.alertThresholds.get(operation);
    if (threshold && duration > threshold) {
      logger.warn(`Performance alert: ${operation} took ${duration}ms (threshold: ${threshold}ms)`, {
        operation: 'performance_alert',
        duration,
        threshold,
        operationName: operation
      });
    }
  }

  /**
   * Start collecting system metrics periodically
   */
  private startSystemMetricsCollection(): void {
    const collectMetrics = () => {
      const metrics = this.getCurrentSystemMetrics();
      this.systemMetricsHistory.push(metrics);

      // Rotate system metrics if we exceed max
      if (this.systemMetricsHistory.length > this.maxSystemMetrics) {
        this.systemMetricsHistory = this.systemMetricsHistory.slice(-this.maxSystemMetrics);
      }
    };

    // Collect metrics every 30 seconds
    setInterval(collectMetrics, 30000);
    
    // Collect initial metrics
    collectMetrics();
  }
}

/**
 * Decorator for automatic performance monitoring
 */
export function monitorPerformance(operation?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const operationName = operation || `${target.constructor.name}.${propertyName}`;

    descriptor.value = function (...args: any[]) {
      const monitor = PerformanceMonitor.getInstance();
      const timer = monitor.startTimer(operationName, {
        className: target.constructor.name,
        methodName: propertyName
      });

      try {
        const result = method.apply(this, args);
        
        // Handle async methods
        if (result && typeof result.then === 'function') {
          return result
            .then((value: any) => {
              timer();
              return value;
            })
            .catch((error: any) => {
              timer(false);
              throw error;
            });
        }

        timer();
        return result;
      } catch (error) {
        timer(false);
        throw error;
      }
    };
  };
}

// Global performance monitor instance
export const performanceMonitor = PerformanceMonitor.getInstance();