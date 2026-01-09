type Operation = 'scrub' | 'audit' | 'fmv' | 'lookup' | 'sync';
interface MetricEntry {
  duration: number;
  timestamp: number;
}
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Record<Operation, MetricEntry[]> = {
    scrub: [],
    audit: [],
    fmv: [],
    lookup: [],
    sync: [],
  };
  private readonly windowSize = 20;
  private constructor() {}
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  async track<T>(op: Operation, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.record(op, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.record(op, duration);
      throw error;
    }
  }
  private record(op: Operation, duration: number) {
    this.metrics[op].push({ duration, timestamp: Date.now() });
    if (this.metrics[op].length > this.windowSize) {
      this.metrics[op].shift();
    }
  }
  getMetrics(op: Operation) {
    const entries = this.metrics[op];
    if (entries.length === 0) return { avg: 0, p95: 0 };
    const sorted = [...entries].map(e => e.duration).sort((a, b) => a - b);
    const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95 = sorted[p95Index];
    return { avg, p95 };
  }
  getAllAverages(): Record<string, number> {
    const result: Record<string, number> = {};
    (Object.keys(this.metrics) as Operation[]).forEach(op => {
      const m = this.getMetrics(op);
      result[op] = m.avg;
    });
    return result;
  }
}
export const perfMonitor = PerformanceMonitor.getInstance();