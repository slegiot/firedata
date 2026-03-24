/**
 * Response envelope: normalizes all gateway responses.
 *
 * Format: { data: ..., meta: { source, cached, fetched_at } }
 */

export interface EnvelopeMeta {
  source: string;
  cached: boolean;
  fetched_at: string;
}

export interface Envelope<T = unknown> {
  data: T;
  meta: EnvelopeMeta;
}

export function wrapResponse<T>(
  data: T,
  source: string,
  cached = false,
): Envelope<T> {
  return {
    data,
    meta: {
      source,
      cached,
      fetched_at: new Date().toISOString(),
    },
  };
}
