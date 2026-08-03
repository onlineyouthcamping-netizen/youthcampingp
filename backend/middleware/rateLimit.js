/**
 * Rate Limiting Middleware
 * 100 requests per minute per IP
 */

const rateLimit = require('express-rate-limit');

const isTestEnv = process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true';

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 60 * 1000, // 1 minute
  max: isTestEnv ? 10000 : 100, // 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
    });
  },
});

module.exports = apiLimiter;
