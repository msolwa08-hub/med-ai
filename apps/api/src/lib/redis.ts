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

// Blacklisted tokens (logout).
//
// Degradation contract: Redis is optional infrastructure. When REDIS_URL is
// not configured (e.g. the beta-server marketplace deploy), or Redis is down,
// the revocation list degrades to a no-op: logout stops actively revoking
// tokens (they still expire via JWT exp) and authentication proceeds. The
// previous behaviour — throwing into authenticate()'s catch — turned a Redis
// outage into a 100% 401 outage for every authenticated route.
const revocationListAvailable = () => !!process.env.REDIS_URL;

export async function blacklistToken(
  token: string,
  ttlSeconds: number
): Promise<void> {
  if (!revocationListAvailable()) return;
  try {
    const redis = getRedisClient();
    await redis.setex(`blacklist:${token}`, ttlSeconds, '1');
  } catch (err) {
    console.warn(
      '[Redis] blacklistToken failed — token will expire via JWT exp only:',
      err instanceof Error ? err.message : err
    );
  }
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  if (!revocationListAvailable()) return false;
  try {
    const redis = getRedisClient();
    const exists = await redis.exists(`blacklist:${token}`);
    return exists === 1;
  } catch (err) {
    console.warn(
      '[Redis] isTokenBlacklisted failed — treating token as not revoked:',
      err instanceof Error ? err.message : err
    );
    return false;
  }
}

export { redisClient };
export default getRedisClient;
