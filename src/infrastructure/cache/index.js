// src/infrastructure/cache/index.js
import Redis from "ioredis";
import { logger } from "../logger/index.js";

const DEFAULT_TTL = parseInt(process.env.REDIS_TTL || "3600");

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    const redisUrl =
      "redis://default:NceSpfmSLLclHNiTGdkojyHZTAPNYFnZ@redis.railway.internal:6379";

    if (!redisUrl) {
      logger.warn("REDIS_URL not set - caching disabled");
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        enableReadyCheck: true,
        connectTimeout: 10000,
        retryStrategy: (times) => {
          if (times > 5) {
            logger.warn("Redis retry limit reached - caching disabled");
            return null; // stop retrying
          }
          return Math.min(times * 200, 2000);
        },
      });

      this.client.on("connect", () => {
        this.isConnected = true;
        logger.info("✅ Redis connected");
      });

      this.client.on("ready", () => {
        this.isConnected = true;
      });

      this.client.on("error", (err) => {
        this.isConnected = false;
        logger.warn({ err: err.message }, "Redis error - caching disabled");
      });

      this.client.on("close", () => {
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (err) {
      logger.warn(
        { err: err.message },
        "Redis connection failed - caching disabled",
      );
      this.isConnected = false;
    }
  }

  async get(key) {
    if (!this.isConnected) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key, value, ttl = DEFAULT_TTL) {
    if (!this.isConnected) return;
    try {
      if (ttl) {
        await this.client.set(key, value, "EX", ttl);
      } else {
        await this.client.set(key, value);
      }
    } catch {
      // Cache failure is non-critical
    }
  }

  async getJson(key) {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async setJson(key, value, ttl = DEFAULT_TTL) {
    await this.set(key, JSON.stringify(value), ttl);
  }

  async del(...keys) {
    if (!this.isConnected) return;
    try {
      await this.client.del(...keys);
    } catch {}
  }

  async delPattern(pattern) {
    if (!this.isConnected) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.debug({ pattern, count: keys.length }, "Cache keys invalidated");
      }
    } catch {}
  }

  async wrap(key, fetcher, ttl = DEFAULT_TTL) {
    const cached = await this.getJson(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.setJson(key, value, ttl);
    return value;
  }

  async incr(key, ttl = DEFAULT_TTL) {
    if (!this.isConnected) return 0;
    try {
      const count = await this.client.incr(key);
      if (count === 1) await this.client.expire(key, ttl);
      return count;
    } catch {
      return 0;
    }
  }
}

export const cache = new CacheService();

export async function connectRedis() {
  await cache.connect();
}
