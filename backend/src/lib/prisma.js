require("./env");
const { PrismaClient } = require("@prisma/client");
const { AsyncLocalStorage } = require("async_hooks");

const requestStorage = new AsyncLocalStorage();
let dbUrl = process.env.DATABASE_URL || "";
if (dbUrl && !dbUrl.includes("connection_limit=")) {
  dbUrl +=
    (dbUrl.includes("?") ? "&" : "?") + "connection_limit=5&pool_timeout=10";
}

if (process.env.NODE_ENV === "test") {
  if (process.env.TEST_DATABASE_URL) {
    dbUrl = process.env.TEST_DATABASE_URL;
  } else if (process.env.ALLOW_PRODUCTION_DATABASE === "true") {
    dbUrl = process.env.DATABASE_URL;
  } else {
    console.error("FATAL: NODE_ENV is test but TEST_DATABASE_URL is not set.");
    process.exit(1);
  }
}

const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const pool = new Pool({ connectionString: dbUrl, max: 10 });
const adapter = new PrismaPg(pool);

const prisma =
  global.prisma ||
  new PrismaClient({
    adapter,
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

if (process.env.ENABLE_PERFORMANCE_METRICS === "true") {
  prisma.$use(async (params, next) => {
    const start = Date.now();
    const result = await next(params);
    const duration = Date.now() - start;
    const store = requestStorage.getStore();
    if (store) {
      store.db = (store.db || 0) + duration;
    }
    if (duration > 500) {
      console.warn(
        `[SLOW DATABASE QUERY] Model: ${params.model || "Unknown"}, Action: ${params.action}, Duration: ${duration}ms`,
      );
    }
    return result;
  });
}

async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
  } catch (e) {
    console.error("Error disconnecting Prisma:", e);
  }
}

module.exports = { prisma, requestStorage, disconnectPrisma };
