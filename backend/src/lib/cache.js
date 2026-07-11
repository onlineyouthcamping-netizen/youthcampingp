/**
 * Optional Redis cache adapter.
 * Fails open if Redis is not installed, not configured, or unreachable.
 */
let redisClient = null;
let isConnected = false;

if (process.env.REDIS_URL) {
  try {
    // Dynamic import to avoid crash if ioredis package is not installed
    const Redis = require('ioredis');
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 1000, // Quick fail
    });
    
    redisClient.on('connect', () => {
      isConnected = true;
      console.log('✅ Redis cache connected');
    });
    
    redisClient.on('error', (err) => {
      isConnected = false;
      console.warn('⚠️ Redis cache offline:', err.message);
    });
  } catch (err) {
    console.warn('⚠️ ioredis package not found or failed to initialize. Cache disabled.');
  }
}

module.exports = {
  get: async (key) => {
    if (!isConnected || !redisClient) return null;
    try {
      return await redisClient.get(key);
    } catch (err) {
      console.warn('Cache read failed (fail-open):', err.message);
      return null;
    }
  },

  set: async (key, value, ttlSeconds = 60) => {
    if (!isConnected || !redisClient) return false;
    try {
      const stringVal = typeof value === 'string' ? value : JSON.stringify(value);
      await redisClient.set(key, stringVal, 'EX', ttlSeconds);
      return true;
    } catch (err) {
      console.warn('Cache write failed (fail-open):', err.message);
      return false;
    }
  },

  del: async (key) => {
    if (!isConnected || !redisClient) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (err) {
      console.warn('Cache delete failed (fail-open):', err.message);
      return false;
    }
  }
};
