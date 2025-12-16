
import { logError } from './errorLogger';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: any;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private readonly SLOW_OPERATION_THRESHOLD = 1000; // 1 second

  // Start tracking a performance metric
  startMetric(name: string, metadata?: any) {
    this.metrics.set(name, {
      name,
      startTime: Date.now(),
      metadata,
    });
    console.log(`⏱️  Performance: Started tracking "${name}"`);
  }

  // End tracking a performance metric
  endMetric(name: string) {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`⚠️  Performance: Metric "${name}" not found`);
      return;
    }

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;

    console.log(`⏱️  Performance: "${name}" took ${metric.duration}ms`);

    // Warn if operation was slow
    if (metric.duration > this.SLOW_OPERATION_THRESHOLD) {
      console.warn(`🐌 Performance: "${name}" was slow (${metric.duration}ms)`);
      logError(
        new Error(`Slow operation: ${name}`),
        {
          component: 'PerformanceMonitor',
          action: name,
          additionalData: { duration: metric.duration, ...metric.metadata },
        }
      );
    }

    return metric;
  }

  // Get all metrics
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  // Get metric by name
  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  // Clear all metrics
  clearMetrics() {
    this.metrics.clear();
  }

  // Measure async function execution time
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: any
  ): Promise<T> {
    this.startMetric(name, metadata);
    try {
      const result = await fn();
      this.endMetric(name);
      return result;
    } catch (error) {
      this.endMetric(name);
      throw error;
    }
  }

  // Measure sync function execution time
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: any
  ): T {
    this.startMetric(name, metadata);
    try {
      const result = fn();
      this.endMetric(name);
      return result;
    } catch (error) {
      this.endMetric(name);
      throw error;
    }
  }

  // Get performance summary
  getSummary(): {
    totalOperations: number;
    averageDuration: number;
    slowOperations: number;
    fastestOperation?: PerformanceMetric;
    slowestOperation?: PerformanceMetric;
  } {
    const metrics = this.getAllMetrics().filter(m => m.duration !== undefined);
    
    if (metrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowOperations: 0,
      };
    }

    const totalDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageDuration = totalDuration / metrics.length;
    const slowOperations = metrics.filter(m => (m.duration || 0) > this.SLOW_OPERATION_THRESHOLD).length;
    
    const sortedMetrics = [...metrics].sort((a, b) => (a.duration || 0) - (b.duration || 0));
    const fastestOperation = sortedMetrics[0];
    const slowestOperation = sortedMetrics[sortedMetrics.length - 1];

    return {
      totalOperations: metrics.length,
      averageDuration,
      slowOperations,
      fastestOperation,
      slowestOperation,
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();
