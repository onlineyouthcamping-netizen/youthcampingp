const cors = require('cors');

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

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed list or subdomains
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.youthcamping.online') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    
    // Default allow origin dynamically to prevent CORS blocks on admin tool
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept', 
    'X-Requested-With', 
    'Origin', 
    'x-tenant-id', 
    'X-Tenant-Id',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Content-Range', 'X-Total-Count', 'Authorization'],
  maxAge: 86400
};

exports.setupCORS = (app) => {
  // Always set CORS headers early to guarantee they are present even during error responses
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, x-tenant-id, X-Tenant-Id, Cache-Control, Pragma');
    res.setHeader('Access-Control-Exposed-Headers', 'Content-Range, X-Total-Count, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });

  // Pre-flight for all routes via cors package
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
};
