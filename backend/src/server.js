/**
 * YouthCamping Backend Server
 * Launches the Express application and manages core startup connections.
 */

require('./lib/env');
const app = require('./app');
const { prisma } = require('./lib/prisma');
const { makeShutdownHandler } = require('./utils/shutdownHandler');

console.log('--- 🚀 YOUTHCAMPING BACKEND (PRISMA STABLE) STARTING UP ---');

// Validate production environment variables
// Critical environment variables required for startup
const CRITICAL_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET'];
const missingCritical = CRITICAL_ENV_VARS.filter(varName => !process.env[varName]);
if (missingCritical.length > 0) {
  console.error('\x1b[31m%s\x1b[0m', '🛑 FATAL STARTUP FAILURE: Missing critical environment variables:');
  missingCritical.forEach(v => console.error('\x1b[31m%s\x1b[0m', `   - ${v}`));
  process.exit(1);
}

const OPTIONAL_ENV_VARS = ['BREVO_API_KEY', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingOptional = OPTIONAL_ENV_VARS.filter(v => !process.env[v]);
if (missingOptional.length > 0) {
  console.warn('\x1b[33m%s\x1b[0m', `⚠️ WARNING: Missing optional environment variables: ${missingOptional.join(', ')}`);
}

const PORT = process.env.PORT || 5000;
let server;

// Construct the shutdown coordinator wrapper
const handleShutdown = (signal, exitCode, error = null) => {
  const handler = makeShutdownHandler(server, prisma);
  handler(signal, exitCode, error);
};

// Global exception/rejection and terminal signal listeners
process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT EXCEPTION]', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

process.on('SIGTERM', () => {
  handleShutdown('SIGTERM', 0);
});

process.on('SIGINT', () => {
  handleShutdown('SIGINT', 0);
});

async function startServer() {
  try {
    console.log('⏳ Connecting to Database...');
    try {
      await Promise.race([
        prisma.$connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB connection timeout (15s)')), 15000))
      ]);
      console.log('✅ Connected to PostgreSQL Database');
    } catch (dbErr) {
      console.error('⚠️ Database connection warning during startup:', dbErr.message);
    }

    server = app.listen(PORT, () => {
      console.log(`🚀 SERVER RUNNING ON PRIMARY PORT ${PORT}`);
    });
    server.on('error', (err) => {
      console.error(`⚠️ Primary port ${PORT} error:`, err.message);
    });

    // Listen on auxiliary ports (5000, 3000, 5001) so Nginx proxies on any port work seamlessly
    const auxPorts = [5000, 3000, 5001].filter(p => p !== Number(PORT));
    auxPorts.forEach(p => {
      try {
        const auxServer = app.listen(p, () => {
          console.log(`🚀 SERVER ALSO LISTENING ON AUXILIARY PORT ${p}`);
        });
        auxServer.on('error', () => {
          // Port already occupied or unavailable
        });
      } catch (e) {
        // ignore
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

