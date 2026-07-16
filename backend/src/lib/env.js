/**
 * Environment Variables Loader & Safety Guard
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const rootDir = path.resolve(__dirname, '../../');
const envLocalPath = path.join(rootDir, '.env.local');
const envPath = path.join(rootDir, '.env');

// Determine NODE_ENV — NEVER default to 'development' on an unset env var.
// If NODE_ENV is not explicitly set, treat it as production to avoid blocking
// VPS/CI/CD environments that don't set NODE_ENV explicitly.
const rawNodeEnv = process.env.NODE_ENV;
const nodeEnv = rawNodeEnv ? rawNodeEnv.toLowerCase().trim() : 'production';

const LOCAL_DATABASE_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '[::1]',
  '::1',
  'host.docker.internal'
]);

const parseDatabaseHost = (value) => {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch (_error) {
    return null;
  }
};

const failStartup = (message) => {
  console.error('\x1b[31m%s\x1b[0m', '🛑 FATAL SECURITY VIOLATION:');
  console.error('\x1b[31m%s\x1b[0m', `   ${message}`);
  process.exit(1);
};

if (nodeEnv === 'development' || nodeEnv === 'test') {
  // Local development/test requires .env.local
  if (!fs.existsSync(envLocalPath)) {
    console.error('\x1b[31m%s\x1b[0m', '🛑 FATAL SECURITY VIOLATION:');
    console.error('\x1b[31m%s\x1b[0m', '   Refusing to start local development because .env.local is missing. Create an isolated local database configuration before running the backend.');
    process.exit(1);
  }
  const origEnv = process.env.NODE_ENV;
  // Load .env.local only (do not fall back to .env)
  dotenv.config({ path: envLocalPath, override: true });
  if (origEnv === 'test') {
    process.env.NODE_ENV = 'test';
  }
} else {
  const origEnv = process.env.NODE_ENV;
  // Production (or other environments) loads .env if it exists
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    if (origEnv === 'test') {
      process.env.NODE_ENV = 'test';
    }
  }
}

if (nodeEnv === 'test') {
  String(process.env.ISOLATED_TEST_DATABASE_HOSTS || '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)
    .forEach((host) => LOCAL_DATABASE_HOSTS.add(host));
}

// Every database URL is classified before Prisma can initialize. Development
// and tests are local/isolated only. Remote production access requires an
// explicit server-side opt-in in addition to NODE_ENV=production.
for (const variableName of ['DATABASE_URL', 'DIRECT_URL']) {
  const value = String(process.env[variableName] || '').trim();
  const host = parseDatabaseHost(value);

  if (!host) {
    console.log(`[DEBUG env.js] ${variableName} raw value is:`, JSON.stringify(value));
    failStartup(`${variableName} is missing or invalid.`);
  }

  const isLocalOrIsolated = LOCAL_DATABASE_HOSTS.has(host);
  console.log(`[DEBUG env.js] variableName: ${variableName}, configured: ${Boolean(value)}, host: ${host}, nodeEnv: ${nodeEnv}, isLocalOrIsolated: ${isLocalOrIsolated}`);
  if ((nodeEnv === 'development' || nodeEnv === 'test') && !isLocalOrIsolated && process.env.ALLOW_PRODUCTION_DATABASE !== 'true') {
    failStartup(`Refusing to start local development because ${variableName} is not an approved local database host.`);
  }

  if (!isLocalOrIsolated) {
    if (process.env.ALLOW_PRODUCTION_DATABASE !== 'true') {
      failStartup(`Remote database access through ${variableName} requires ALLOW_PRODUCTION_DATABASE=true.`);
    }
  }
}

if (nodeEnv === 'production') {
  const jwtSecret = String(process.env.JWT_SECRET || '').trim();
  const insecureSecretPattern = /(change.?me|placeholder|development|example|default|admin@|jwt.?secret|^secret$)/i;

  if (jwtSecret.length < 32 || insecureSecretPattern.test(jwtSecret)) {
    failStartup('JWT_SECRET must be present, at least 32 characters, and must not use a placeholder or insecure default.');
  }
}

module.exports = {
  nodeEnv,
  isApprovedLocalDatabaseHost: (host) => LOCAL_DATABASE_HOSTS.has(String(host || '').toLowerCase())
};
