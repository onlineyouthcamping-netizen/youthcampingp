/**
 * Logging & Response Time Middleware
 * Logs method, path, query, timestamp, and sets X-Response-Time header
 */

function loggingMiddleware(req, res, next) {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const timeMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    const logLine = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl || req.url} - ${res.statusCode} (${timeMs}ms)`;
    if (res.statusCode >= 400) {
      console.error(`⚠️ ${logLine}`);
    } else {
      console.log(`ℹ️ ${logLine}`);
    }
  });

  // Calculate response time before headers are sent so header can be set
  const originalSend = res.send;
  res.send = function (...args) {
    const diff = process.hrtime(start);
    const timeMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${timeMs}ms`);
    }
    return originalSend.apply(this, args);
  };

  next();
}

module.exports = loggingMiddleware;
