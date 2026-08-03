/**
 * Database Utility Wrapper using Prisma Client
 */

const { prisma } = require('../src/lib/prisma');

/**
 * Execute database queries with error handling & performance logging
 */
async function queryWithTimeout(queryPromise, timeoutMs = 3000) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`Query timeout after ${timeoutMs}ms`);
      err.code = 'TIMEOUT';
      reject(err);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([queryPromise, timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  prisma,
  queryWithTimeout,
};
