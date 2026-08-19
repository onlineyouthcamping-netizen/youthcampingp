const cors = require("cors");

/**
 * Explicit CORS Configuration Middleware
 *
 * Allowed origins come from the ALLOWED_ORIGINS environment variable
 * (comma-separated). When not set, defaults to the production domains plus
 * localhost for development. The blanket "allow everything" fallback has been
 * removed: unknown origins are rejected in production.
 */

const DEFAULT_ALLOWED_ORIGINS = [
  "https://youthcamping.online",
  "https://www.youthcamping.online",
  "https://admin.youthcamping.online",
  "https://ycadmin.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:8081",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:8081",
];

const getAllowedOrigins = () => {
  const envOrigins = (process.env.ALLOWED_ORIGINS || "").trim();
  if (envOrigins) {
    const list = envOrigins
      .split(",")
      .map((o) => o.trim())
      .filter((o) => o.length > 0);
    return Array.from(new Set([...list, ...DEFAULT_ALLOWED_ORIGINS]));
  }
  return DEFAULT_ALLOWED_ORIGINS;
};

const DEV_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:8081",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:8081",
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const allowed = getAllowedOrigins();

    if (allowed.includes(origin) || /^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    // Subdomains of the primary domain
    if (origin.endsWith(".youthcamping.online")) {
      return callback(null, true);
    }

    console.warn(`[CORS] Blocked origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "X-Requested-With",
  ],
  maxAge: 86400, // 24 hours preflight cache in browser
};

const setupCORS = (app) => {
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
};

module.exports = setupCORS;
module.exports.setupCORS = setupCORS;
module.exports.getAllowedOrigins = getAllowedOrigins;
