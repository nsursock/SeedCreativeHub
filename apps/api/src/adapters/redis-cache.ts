import { Redis } from "ioredis";
import { env } from "../env.js";
import type { Cache } from "./cache.js";

/** Redis used for sessions + rate limits only (not product cache/queues). */
export class RedisCache implements Cache {
  constructor(private readonly redis: Redis) {}

  get(key: string) {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) await this.redis.set(key, value, "EX", ttlSeconds);
    else await this.redis.set(key, value);
  }

  async del(key: string) {
    await this.redis.del(key);
  }

  async incr(key: string, ttlSeconds?: number) {
    const n = await this.redis.incr(key);
    if (n === 1 && ttlSeconds) await this.redis.expire(key, ttlSeconds);
    return n;
  }
}

export function createRedis(): Redis {
  return new Redis(env.redisUrl, { maxRetriesPerRequest: 2, lazyConnect: true });
}

export function createCache(redis: Redis): Cache {
  return new RedisCache(redis);
}
