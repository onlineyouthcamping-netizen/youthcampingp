require('./env');
const { PrismaClient } = require('@prisma/client');
const { AsyncLocalStorage } = require('async_hooks');

const requestStorage = new AsyncLocalStorage();
const prisma = global.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
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
