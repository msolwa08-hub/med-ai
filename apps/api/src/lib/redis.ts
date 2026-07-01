import { Redis } from 'ioredis';
import { config } from '../config.js';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redisClient.on('error', (err: Error) => {
      console.error('[Redis] Connection error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected');
    });

    redisClient.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...');
    });
  }

  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

// Cache helpers
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  const value = await redis.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = 300
): Promise<void> {
  const redis = getRedisClient();
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

export async function cacheDel(key: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(key);
}

// Session management for AI conversations
export async function setConversation(
  consultationId: string,
  messages: unknown[],
  ttlSeconds = 3600 // 1 hour
): Promise<void> {
  await cacheSet(`ai:conversation:${consultationId}`, messages, ttlSeconds);
}

export async function getConversation(
  consultationId: string
): Promise<unknown[] | null> {
  return cacheGet<unknown[]>(`ai:conversation:${consultationId}`);
}

export async function deleteConversation(consultationId: string): Promise<void> {
  await cacheDel(`ai:conversation:${consultationId}`);
}

// Blacklisted tokens (logout)
export async function blacklistToken(
  token: string,
  ttlSeconds: number
): Promise<void> {
  const redis = getRedisClient();
  await redis.setex(`blacklist:${token}`, ttlSeconds, '1');
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const redis = getRedisClient();
  const exists = await redis.exists(`blacklist:${token}`);
  return exists === 1;
}

export { redisClient };
export default getRedisClient;
