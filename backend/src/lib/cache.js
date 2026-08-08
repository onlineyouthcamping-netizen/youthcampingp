/**
 * Optional Redis cache adapter.
 * Fails open if Redis is not installed, not configured, or unreachable.
 */
let redisClient = null;
let isConnected = false;

if (process.env.REDIS_URL) {
  try {
    // Dynamic import to avoid crash if ioredis package is not installed
    const Redis = require("ioredis");
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 1000, // Quick fail
    });

    redisClient.on("connect", () => {
      isConnected = true;
      console.log("✅ Redis cache connected");
    });

    redisClient.on("error", (err) => {
      isConnected = false;
      console.warn("⚠️ Redis cache offline:", err.message);
    });
  } catch (err) {
    console.warn(
      "⚠️ ioredis package not found or failed to initialize. Cache disabled.",
    );
  }
}

const inMemoryCache = new Map();

// Periodic cleanup of expired keys every 60s
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of inMemoryCache.entries()) {
    if (entry.expiresAt <= now) {
      inMemoryCache.delete(key);
    }
  }
}, 60000).unref();

module.exports = {
  get: async (key) => {
    if (isConnected && redisClient) {
      try {
        return await redisClient.get(key);
      } catch (err) {
        console.warn("Cache read failed (fail-open):", err.message);
      }
    }
    const entry = inMemoryCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      inMemoryCache.delete(key);
      return null;
    }
    return entry.value;
  },

  set: async (key, value, ttlSeconds = 60) => {
    const stringVal =
      typeof value === "string" ? value : JSON.stringify(value);
    if (isConnected && redisClient) {
      try {
        await redisClient.set(key, stringVal, "EX", ttlSeconds);
        return true;
      } catch (err) {
        console.warn("Cache write failed (fail-open):", err.message);
      }
    }
    inMemoryCache.set(key, {
      value: stringVal,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return true;
  },

  del: async (key) => {
    if (isConnected && redisClient) {
      try {
        await redisClient.del(key);
      } catch (err) {}
    }
    inMemoryCache.delete(key);
    return true;
  },
};
