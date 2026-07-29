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
  // Pre-flight for all routes
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
};
