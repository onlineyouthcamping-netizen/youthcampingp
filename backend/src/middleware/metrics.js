const { requestStorage } = require('../lib/prisma');

/**
 * Performance metrics middleware for logging request timing and size.
 * Safe to run in production, opt-in only.
 */
module.exports = (req, res, next) => {
  const start = Date.now();
  req._reqStart = start;
  req._timings = { auth: 0, db: 0 };

  // Intercept writeHead to set Server-Timing before headers are sent
  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    const appDur = Date.now() - start;
    const authDur = req._timings?.auth || 0;
    const dbDur = req._timings?.db || 0;
    const handlerDur = Math.max(0, appDur - authDur - dbDur);

    if (process.env.ENABLE_PERFORMANCE_METRICS === 'true') {
      res.setHeader('Server-Timing', `auth;dur=${authDur}, db;dur=${dbDur}, handler;dur=${handlerDur}, app;dur=${appDur}`);
    } else {
      res.setHeader('Server-Timing', `app;dur=${appDur}`);
    }
    return originalWriteHead.apply(this, args);
  };

  res.on('finish', () => {
    if (process.env.ENABLE_PERFORMANCE_METRICS === 'true') {
      const duration = Date.now() - start;
      const contentLength = res.get('Content-Length') || 0;
      let routePattern = 'unknown';
      if (req.route) {
        routePattern = req.baseUrl ? `${req.baseUrl}${req.route.path}` : req.route.path;
      } else {
        routePattern = req.baseUrl || '/api/unmatched';
      }
      
      const logMsg = `[METRICS] Method: ${req.method}, Path: ${routePattern}, Status: ${res.statusCode}, Duration: ${duration}ms, Size: ${contentLength} bytes`;
      
      if (duration > 1000) {
        console.warn(`[SLOW REQUEST] ${logMsg}`);
      } else {
        console.log(logMsg);
      }
    }
  });

  if (requestStorage && typeof requestStorage.run === 'function') {
    requestStorage.run(req._timings, () => {
      next();
    });
  } else {
    next();
  }
};
