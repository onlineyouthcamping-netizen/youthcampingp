const passwordChangeStore = new Map();
const apiKeyGenStore = new Map();

// Helper to clean up old rate limit records (older than 24h)
const DAY_MS = 24 * 60 * 60 * 1000;

function cleanStore(store) {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now - record.resetTime > DAY_MS) {
      store.delete(key);
    }
  }
}

/**
 * Rate limiter for password changes (max 3 per 24h per user)
 */
exports.passwordChangeLimiter = (req, res, next) => {
  const userId = req.user?.id || req.ip;
  const now = Date.now();
  cleanStore(passwordChangeStore);

  let record = passwordChangeStore.get(userId);
  if (!record || now - record.resetTime > DAY_MS) {
    record = { count: 1, resetTime: now };
    passwordChangeStore.set(userId, record);
    return next();
  }

  if (record.count >= 3) {
    return res.status(429).json({
      success: false,
      message:
        "Too many password change attempts. Maximum 3 attempts per 24 hours allowed.",
    });
  }

  record.count += 1;
  passwordChangeStore.set(userId, record);
  next();
};

/**
 * Rate limiter for API key generation (max 5 per 24h per user)
 */
exports.apiKeyGenerationLimiter = (req, res, next) => {
  const userId = req.user?.id || req.ip;
  const now = Date.now();
  cleanStore(apiKeyGenStore);

  let record = apiKeyGenStore.get(userId);
  if (!record || now - record.resetTime > DAY_MS) {
    record = { count: 1, resetTime: now };
    apiKeyGenStore.set(userId, record);
    return next();
  }

  if (record.count >= 5) {
    return res.status(429).json({
      success: false,
      message:
        "Too many API key generation requests. Maximum 5 keys per 24 hours allowed.",
    });
  }

  record.count += 1;
  apiKeyGenStore.set(userId, record);
  next();
};
