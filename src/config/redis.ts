import Redis from 'redis';
import config from './index';

let redisClient: Redis.RedisClient | null = null;

export async function getRedisClient(): Promise<Redis.RedisClient> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  try {
    const client = Redis.createClient({
      url: config.redis.url,
      db: config.redis.db,
    });

    client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    client.on('connect', () => {
      console.log('Redis connected successfully');
    });

    await client.connect();
    redisClient = client;
    return redisClient;
  } catch (error) {
    console.error('Redis connection failed:', error);
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis disconnected');
  }
}

export function getRedisClientSync(): Redis.RedisClient | null {
  return redisClient;
}
