/**
 * Explicit CORS Configuration Middleware
 */
const allowedOrigins = [
  'https://admin.youthcamping.online',
  'https://youthcamping.online',
  'https://www.youthcamping.online',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://ycadmin.vercel.app'
];

exports.setupCORS = (app) => {
  // 1. Explicit preflight handler for OPTIONS requests
  app.options('*', (req, res) => {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, x-tenant-id, X-Tenant-Id, *');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  });

  // 2. Global middleware for all incoming API routes
  app.use((req, res, next) => {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, x-tenant-id, X-Tenant-Id, *');
    res.setHeader('Access-Control-Expose-Headers', '*');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    next();
  });
};
