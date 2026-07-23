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
  app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.youthcamping.online'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

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
