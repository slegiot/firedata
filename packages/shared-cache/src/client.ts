import Redis from 'ioredis';

export type TtlStrategy = 'SHORT' | 'MEDIUM' | 'LONG' | 'DAILY';

const TTL_SECONDS: Record<TtlStrategy, number> = {
  SHORT: 30,
  MEDIUM: 300,
  LONG: 3600,
  DAILY: 86400,
};

export class CacheClient {
  private redis: Redis;

  constructor(url: string) {
    this.redis = new Redis(url, { maxRetriesPerRequest: 3 });
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  }

  async set<T>(key: string, value: T, strategy: TtlStrategy = 'MEDIUM'): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', TTL_SECONDS[strategy]);
  }

  async invalidate(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  getRedis(): Redis {
    return this.redis;
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
