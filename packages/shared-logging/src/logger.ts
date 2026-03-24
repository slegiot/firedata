/**
 * Structured logger using pino.
 *
 * Creates service-scoped loggers with correlation ID support.
 */
import pino from 'pino';

export interface LoggerOptions {
  service: string;
  level?: string;
  pretty?: boolean;
}

/**
 * Create a structured pino logger for a service.
 */
export function createLogger(opts: LoggerOptions): pino.Logger {
  const level = opts.level || process.env.LOG_LEVEL || 'info';
  const isPretty = opts.pretty ?? process.env.NODE_ENV !== 'production';

  return pino({
    name: opts.service,
    level,
    ...(isPretty
      ? {
          transport: {
            target: 'pino/file',
            options: { destination: 1 }, // stdout
          },
        }
      : {}),
    base: {
      service: opts.service,
      env: process.env.NODE_ENV || 'development',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label: string) {
        return { level: label };
      },
    },
    redact: {
      paths: ['req.headers.authorization', 'req.headers["x-api-key"]'],
      censor: '[REDACTED]',
    },
  });
}

/**
 * Create a child logger with a correlation ID.
 */
export function withCorrelationId(
  logger: pino.Logger,
  correlationId: string,
): pino.Logger {
  return logger.child({ correlationId });
}

export type Logger = pino.Logger;
