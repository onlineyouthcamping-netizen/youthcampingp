require('./env');
const { PrismaClient } = require('@prisma/client');
const { AsyncLocalStorage } = require('async_hooks');

const requestStorage = new AsyncLocalStorage();
let dbUrl = process.env.DATABASE_URL;

if (process.env.NODE_ENV === 'test') {
  if (!process.env.TEST_DATABASE_URL) {
    console.error('FATAL: NODE_ENV is test but TEST_DATABASE_URL is not set.');
    process.exit(1);
  }
  if (process.env.TEST_DATABASE_URL === process.env.DATABASE_URL && process.env.DATABASE_URL) {
    console.error('FATAL: TEST_DATABASE_URL must not match DATABASE_URL to prevent production data corruption.');
    process.exit(1);
  }
  dbUrl = process.env.TEST_DATABASE_URL;
}

const prisma = global.prisma || new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  },
  log: ['error']
});

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

if (process.env.ENABLE_PERFORMANCE_METRICS === 'true') {
  prisma.$use(async (params, next) => {
    const start = Date.now();
    const result = await next(params);
    const duration = Date.now() - start;
    const store = requestStorage.getStore();
    if (store) {
      store.db = (store.db || 0) + duration;
    }
    if (duration > 500) {
      console.warn(`[SLOW DATABASE QUERY] Model: ${params.model || 'Unknown'}, Action: ${params.action}, Duration: ${duration}ms`);
    }
    return result;
  });
}

async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
  } catch (e) {
    console.error('Error disconnecting Prisma:', e);
  }
}

module.exports = { prisma, requestStorage, disconnectPrisma };
