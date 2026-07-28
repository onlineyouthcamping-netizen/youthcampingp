/**
 * Request Timeout Middleware
 * Enforces a 30s hard timeout on all API requests.
 * Returns 408 if the handler doesn't complete within the limit.
 */
const REQUEST_TIMEOUT_MS = 30_000;

const requestTimeout = (req, res, next) => {
  // Skip health check — it should always respond fast
  if (req.path === '/api/health' || req.path === '/health') {
    return next();
  }

  const timer = setTimeout(() => {
    if (!res.headersSent) {
      console.warn(`⏱️ [TIMEOUT] ${req.method} ${req.originalUrl} exceeded ${REQUEST_TIMEOUT_MS}ms`);
      res.status(408).json({
        success: false,
        message: 'Request timed out',
        timeout: REQUEST_TIMEOUT_MS,
      });
    }
  }, REQUEST_TIMEOUT_MS);

  // Clean up timer when response finishes normally
  const originalEnd = res.end;
  res.end = function (...args) {
    clearTimeout(timer);
    return originalEnd.apply(this, args);
  };

  next();
};

module.exports = requestTimeout;
