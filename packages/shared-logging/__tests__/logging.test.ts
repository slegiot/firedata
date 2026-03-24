import { describe, it, expect, beforeEach } from 'vitest';
import {
  createLogger,
  withCorrelationId,
  Counter,
  Histogram,
  MetricsRegistry,
  createServiceMetrics,
} from '../src/index.js';

describe('Logger', () => {
  it('creates a pino logger with service name', () => {
    const logger = createLogger({ service: 'test-service', level: 'silent' });
    expect(logger).toBeDefined();
    expect(logger.info).toBeTypeOf('function');
    expect(logger.error).toBeTypeOf('function');
  });

  it('creates a child logger with correlation ID', () => {
    const logger = createLogger({ service: 'test-service', level: 'silent' });
    const child = withCorrelationId(logger, 'corr-123');
    expect(child).toBeDefined();
    expect(child.info).toBeTypeOf('function');
  });
});

describe('Counter', () => {
  let counter: Counter;

  beforeEach(() => {
    counter = new Counter('test_total', 'Test counter');
  });

  it('increments with default value', () => {
    counter.inc({ route: '/test' });
    counter.inc({ route: '/test' });

    const output = counter.serialize();
    expect(output).toContain('test_total{route="/test"} 2');
  });

  it('increments with custom value', () => {
    counter.inc({ route: '/api' }, 5);

    const output = counter.serialize();
    expect(output).toContain('test_total{route="/api"} 5');
  });

  it('tracks separate label sets', () => {
    counter.inc({ method: 'GET' });
    counter.inc({ method: 'POST' });

    const output = counter.serialize();
    expect(output).toContain('method="GET"');
    expect(output).toContain('method="POST"');
  });

  it('serializes with HELP and TYPE', () => {
    counter.inc();
    const output = counter.serialize();

    expect(output).toContain('# HELP test_total Test counter');
    expect(output).toContain('# TYPE test_total counter');
  });

  it('resets all entries', () => {
    counter.inc({ route: '/a' }, 10);
    counter.reset();
    counter.inc({ route: '/a' });

    expect(counter.serialize()).toContain('test_total{route="/a"} 1');
  });
});

describe('Histogram', () => {
  let histogram: Histogram;

  beforeEach(() => {
    histogram = new Histogram('test_duration_seconds', 'Test histogram');
  });

  it('records observations', () => {
    histogram.observe({ route: '/test' }, 0.05);
    histogram.observe({ route: '/test' }, 0.15);

    const output = histogram.serialize();
    expect(output).toContain('test_duration_seconds_count{route="/test"} 2');
    expect(output).toContain('test_duration_seconds_sum{route="/test"}');
  });

  it('fills buckets correctly (cumulative)', () => {
    histogram.observe({}, 0.01);

    const output = histogram.serialize();
    // Prometheus histograms are cumulative — 0.01 fits in 0.01 and above
    expect(output).toContain('le="0.01"} 1');
    // Cumulative: 0.025 bucket counts all <= 0.025, but only 1 observation
    expect(output).toContain('le="+Inf"} 1');
    expect(output).toContain('test_duration_seconds_count 1');
  });

  it('startTimer returns valid duration', async () => {
    const end = histogram.startTimer({ route: '/timer' });

    // Small delay
    await new Promise((r) => setTimeout(r, 10));
    const duration = end();

    expect(duration).toBeGreaterThan(0);
    expect(duration).toBeLessThan(1); // Should be well under 1s

    const output = histogram.serialize();
    expect(output).toContain('test_duration_seconds_count{route="/timer"} 1');
  });

  it('serializes with HELP and TYPE', () => {
    histogram.observe({}, 0.1);
    const output = histogram.serialize();

    expect(output).toContain('# HELP test_duration_seconds Test histogram');
    expect(output).toContain('# TYPE test_duration_seconds histogram');
  });
});

describe('MetricsRegistry', () => {
  it('serializes all registered metrics', () => {
    const registry = new MetricsRegistry();
    const counter = registry.register(new Counter('req_total', 'Requests'));
    const histogram = registry.register(new Histogram('latency', 'Latency'));

    counter.inc({ method: 'GET' });
    histogram.observe({ route: '/' }, 0.5);

    const output = registry.serialize();
    expect(output).toContain('req_total');
    expect(output).toContain('latency');
  });
});

describe('createServiceMetrics', () => {
  it('creates standard metrics for a service', () => {
    const m = createServiceMetrics('my-service');

    expect(m.httpRequestCount).toBeInstanceOf(Counter);
    expect(m.httpRequestDuration).toBeInstanceOf(Histogram);
    expect(m.workerJobCount).toBeInstanceOf(Counter);
    expect(m.workerJobDuration).toBeInstanceOf(Histogram);
    expect(m.workerJobErrors).toBeInstanceOf(Counter);
  });

  it('uses sanitized service name in metric names', () => {
    const m = createServiceMetrics('my-service');
    m.httpRequestCount.inc({ method: 'GET', route: '/', status: '200' });

    const output = m.registry.serialize();
    expect(output).toContain('my_service_http_requests_total');
    expect(output).toContain('my_service_http_request_duration_seconds');
    expect(output).toContain('my_service_worker_jobs_total');
  });
});
