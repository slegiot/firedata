/**
 * Pre-built service metrics.
 *
 * Standard metrics that every service should expose.
 */
import { Counter, Histogram, MetricsRegistry } from './metrics.js';

export interface ServiceMetrics {
  registry: MetricsRegistry;
  httpRequestCount: Counter;
  httpRequestDuration: Histogram;
  workerJobCount: Counter;
  workerJobDuration: Histogram;
  workerJobErrors: Counter;
}

export function createServiceMetrics(serviceName: string): ServiceMetrics {
  const registry = new MetricsRegistry();

  const httpRequestCount = registry.register(
    new Counter(
      `${serviceName.replace(/-/g, '_')}_http_requests_total`,
      `Total HTTP requests for ${serviceName}`,
    ),
  );

  const httpRequestDuration = registry.register(
    new Histogram(
      `${serviceName.replace(/-/g, '_')}_http_request_duration_seconds`,
      `HTTP request duration in seconds for ${serviceName}`,
    ),
  );

  const workerJobCount = registry.register(
    new Counter(
      `${serviceName.replace(/-/g, '_')}_worker_jobs_total`,
      `Total worker jobs for ${serviceName}`,
    ),
  );

  const workerJobDuration = registry.register(
    new Histogram(
      `${serviceName.replace(/-/g, '_')}_worker_job_duration_seconds`,
      `Worker job duration in seconds for ${serviceName}`,
    ),
  );

  const workerJobErrors = registry.register(
    new Counter(
      `${serviceName.replace(/-/g, '_')}_worker_job_errors_total`,
      `Total worker job errors for ${serviceName}`,
    ),
  );

  return {
    registry,
    httpRequestCount,
    httpRequestDuration,
    workerJobCount,
    workerJobDuration,
    workerJobErrors,
  };
}
