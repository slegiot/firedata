export { createLogger, withCorrelationId } from './logger.js';
export type { Logger, LoggerOptions } from './logger.js';
export { Counter, Histogram, MetricsRegistry } from './metrics.js';
export { createServiceMetrics } from './service-metrics.js';
export type { ServiceMetrics } from './service-metrics.js';
export { instrumentFastify } from './fastify.js';
