/**
 * Simple performance monitoring utilities
 */

export interface SimpleMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
}

export class SimplePerformanceMonitor {
  private static instance: SimplePerformanceMonitor;
  private metrics: SimpleMetric[] = [];
  private maxMetrics = 1000;

  private constructor() {}

  static getInstance(): SimplePerformanceMonitor {
    if (!SimplePerformanceMonitor.instance) {
      SimplePerformanceMonitor.instance = new SimplePerformanceMonitor();
    }
    return SimplePerformanceMonitor.instance;
  }

  recordMetric(operation: string, duration: number, success: boolean = true): void {
    const metric: SimpleMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      success
    };

    this.metrics.push(metric);

    // Rotate if needed
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  startTimer(operation: string): () => void {
    const startTime = Date.now();
    return (success: boolean = true) => {
      const duration = Date.now() - startTime;
      this.recordMetric(operation, duration, success);
    };
  }

  getMetrics(operation?: string): SimpleMetric[] {
    if (operation) {
      return this.metrics.filter(m => m.operation === operation);
    }
    return [...this.metrics];
  }

  getAverageResponseTime(operation?: string): number {
    const relevantMetrics = this.getMetrics(operation);
    if (relevantMetrics.length === 0) return 0;
    
    const total = relevantMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / relevantMetrics.length;
  }

  getSlowOperations(threshold: number = 5000): Array<{operation: string; avgDuration: number}> {
    const operationStats = new Map<string, number[]>();
    
    for (const metric of this.metrics) {
      if (!operationStats.has(metric.operation)) {
        operationStats.set(metric.operation, []);
      }
      operationStats.get(metric.operation)!.push(metric.duration);
    }

    const slowOps: Array<{operation: string; avgDuration: number}> = [];
    
    for (const [operation, durations] of operationStats) {
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      if (avgDuration > threshold) {
        slowOps.push({ operation, avgDuration });
      }
    }

    return slowOps.sort((a, b) => b.avgDuration - a.avgDuration);
  }

  clear(): void {
    this.metrics = [];
  }
}

// Global instance
export const simplePerformanceMonitor = SimplePerformanceMonitor.getInstance();