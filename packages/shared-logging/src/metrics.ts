/**
 * Prometheus-format metrics collector.
 *
 * Lightweight in-process metrics — no external dependency.
 * Exposes counters, histograms, and a /metrics endpoint handler.
 */

export interface MetricLabels {
  [key: string]: string;
}

// ── Counter ───────────────────────────────────────────────────

interface CounterEntry {
  labels: MetricLabels;
  value: number;
}

export class Counter {
  readonly name: string;
  readonly help: string;
  private entries: CounterEntry[] = [];

  constructor(name: string, help: string) {
    this.name = name;
    this.help = help;
  }

  inc(labels: MetricLabels = {}, value = 1): void {
    const existing = this.entries.find((e) => labelsMatch(e.labels, labels));
    if (existing) {
      existing.value += value;
    } else {
      this.entries.push({ labels, value });
    }
  }

  serialize(): string {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} counter`];
    for (const entry of this.entries) {
      lines.push(`${this.name}${serializeLabels(entry.labels)} ${entry.value}`);
    }
    return lines.join('\n');
  }

  reset(): void {
    this.entries = [];
  }
}

// ── Histogram ─────────────────────────────────────────────────

interface HistogramEntry {
  labels: MetricLabels;
  sum: number;
  count: number;
  buckets: Map<number, number>;
}

const DEFAULT_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

export class Histogram {
  readonly name: string;
  readonly help: string;
  private buckets: number[];
  private entries: HistogramEntry[] = [];

  constructor(name: string, help: string, buckets?: number[]) {
    this.name = name;
    this.help = help;
    this.buckets = buckets || DEFAULT_BUCKETS;
  }

  observe(labels: MetricLabels, value: number): void {
    let entry = this.entries.find((e) => labelsMatch(e.labels, labels));
    if (!entry) {
      const bucketMap = new Map<number, number>();
      for (const b of this.buckets) bucketMap.set(b, 0);
      entry = { labels, sum: 0, count: 0, buckets: bucketMap };
      this.entries.push(entry);
    }
    entry.sum += value;
    entry.count++;
    // Only increment the specific bucket boundaries (non-cumulative storage)
    for (const b of this.buckets) {
      if (value <= b) {
        entry.buckets.set(b, (entry.buckets.get(b) || 0) + 1);
        break; // Only the first (smallest) matching bucket
      }
    }
  }

  /** Start a timer, returns a function that when called records the duration. */
  startTimer(labels: MetricLabels = {}): () => number {
    const start = performance.now();
    return () => {
      const durationSec = (performance.now() - start) / 1000;
      this.observe(labels, durationSec);
      return durationSec;
    };
  }

  serialize(): string {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} histogram`];
    for (const entry of this.entries) {
      let cumulativeCount = 0;
      for (const b of this.buckets) {
        cumulativeCount += entry.buckets.get(b) || 0;
        lines.push(`${this.name}_bucket${serializeLabels({ ...entry.labels, le: String(b) })} ${cumulativeCount}`);
      }
      lines.push(`${this.name}_bucket${serializeLabels({ ...entry.labels, le: '+Inf' })} ${entry.count}`);
      lines.push(`${this.name}_sum${serializeLabels(entry.labels)} ${entry.sum}`);
      lines.push(`${this.name}_count${serializeLabels(entry.labels)} ${entry.count}`);
    }
    return lines.join('\n');
  }

  reset(): void {
    this.entries = [];
  }
}

// ── Metrics Registry ──────────────────────────────────────────

export class MetricsRegistry {
  private metrics: Array<Counter | Histogram> = [];

  register<T extends Counter | Histogram>(metric: T): T {
    this.metrics.push(metric);
    return metric;
  }

  /** Serialize all metrics in Prometheus exposition format. */
  serialize(): string {
    return this.metrics.map((m) => m.serialize()).join('\n\n') + '\n';
  }
}

// ── Helpers ───────────────────────────────────────────────────

function labelsMatch(a: MetricLabels, b: MetricLabels): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => a[k] === b[k]);
}

function serializeLabels(labels: MetricLabels): string {
  const entries = Object.entries(labels);
  if (entries.length === 0) return '';
  return `{${entries.map(([k, v]) => `${k}="${v}"`).join(',')}}`;
}
