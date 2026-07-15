/**
 * YouthCamping Backend App Definition
 */

require('./lib/env');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const { apiNoStore } = require('./middleware/noStore');

// 1. App initialization
const app = express();
app.set('trust proxy', 1);

// CORS Config
const cors = require('cors');
const allowedOrigins = [
  'https://youthcamping.online',
  'https://www.youthcamping.online',
  'https://admin.youthcamping.online'
];

const addOrigins = (val) => {
  if (!val) return;
  // Support comma-separated or space-separated lists of URLs
  const origins = val.split(/[\s,]+/).map(o => o.trim().replace(/\/$/, '')).filter(Boolean);
  origins.forEach(origin => {
    if (!allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  });
};

addOrigins(process.env.ALLOWED_ORIGINS);
addOrigins(process.env.CORS_ALLOWED_ORIGINS);
addOrigins(process.env.FRONTEND_URL);
addOrigins(process.env.CLIENT_URL);
addOrigins(process.env.ADMIN_URL);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.replace(/\/$/, '').toLowerCase();
    
    // Check if origin is explicitly allowed or belongs to youthcamping.online or vercel
    const isAllowed = allowedOrigins.map(o => o.toLowerCase()).includes(normalizedOrigin) || 
                      normalizedOrigin.endsWith('.vercel.app') || 
                      normalizedOrigin.includes('.vercel.app') ||
                      normalizedOrigin.endsWith('.youthcamping.online') ||
                      normalizedOrigin === 'https://youthcamping.online' ||
                      normalizedOrigin === 'https://admin.youthcamping.online';

    if (isAllowed) {
      return callback(null, true);
    }
    if (/^https?:\/\/localhost(:\d+)?$/i.test(normalizedOrigin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/i.test(normalizedOrigin)) {
      return callback(null, true);
    }
    
    console.warn(`[CORS REJECTED] Origin: ${origin}`);
    callback(null, false);
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Transactional, authenticated, and user-specific API responses must never be
// cached. Only the explicitly allowlisted Phase 1 public GETs are exempt.
app.use('/api', require('./middleware/metrics'));
app.use('/api', apiNoStore);

// Health Check (Before all other routes)
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

// 2. Security & Middleware
app.use(helmet({ 
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false 
}));
app.use(compression());
app.use(express.json({ limit: '15mb' }));
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('common'));
} else {
  app.use(morgan('dev'));
}

// Rate Limiting
const rateLimit = require('express-rate-limit');

const isTestEnv = process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true';

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 99999 : 3000,
  message: { error: 'Too many requests, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 99999 : 200,
  message: { error: 'Too many requests, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', globalLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/users/login', authLimiter);

// 3. Import & Mount Routes
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/trips', require('./routes/tripRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/booking-links', require('./routes/bookingLinkRoutes'));
app.use('/api/inquiries', require('./routes/inquiryRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/quotations', require('./routes/quotationRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/blogs', require('./routes/blogRoutes'));
app.use('/api/marketing', require('./routes/marketingRoutes'));
app.use('/api/emails', require('./routes/emailRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/attractions', require('./routes/attractionRoutes'));
app.use('/api/seo', require('./routes/seoRoutes'));
app.use('/api/booking-forms', require('./routes/bookingFormRoutes'));
app.use('/api/dynamic-forms', require('./routes/dynamicFormRoutes'));
app.use('/api/page-builder', require('./routes/pageBuilderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/theme', require('./routes/themeRoutes'));
app.use('/api/design', require('./routes/designRoutes'));
app.use('/api/booking-verifications', require('./routes/bookingVerificationRoutes'));
app.use('/api/train-tickets', require('./routes/trainTicketRoutes'));
app.use('/api/train-ticket-templates', require('./routes/trainTicketTemplateRoutes'));
app.use('/api/accounting', require('./routes/accountingRoutes'));
app.use('/api/ops', require('./routes/opsRoutes'));
app.use('/api/ops/payments', require('./routes/paymentRoutes'));
app.use('/api/ops/tasks-docs-comm', require('./routes/opsTasksDocsCommRoutes'));
app.use('/api/knowledge', require('./routes/knowledgeRoutes'));
app.use('/api/travel-desk', require('./routes/travelDeskRoutes'));
app.use('/api/package-builder', require('./routes/packageBuilderRoutes'));
app.use('/api/erp', require('./routes/erpRoutes'));
app.use('/api/tickets', require('./routes/ticketApprovalRoutes'));

const { protect: protectAnalytics } = require('./middleware/auth');
const { getBookingLinksAnalytics } = require('./controllers/bookingLinkController');
app.get('/api/analytics', protectAnalytics, getBookingLinksAnalytics);



// Serve Static Files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Revalidation Proxy
app.post('/api/revalidate', (req, res) => {
  console.log(`♻️ [REVALIDATE] Requested for path: ${req.body.path || 'all'}`);
  res.json({ success: true, message: 'Revalidation request received' });
});

// 4. Global Error Handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// 5. 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

module.exports = app;
