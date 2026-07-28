const express = require('express');
const router = express.Router();
const prismaImport = require('../lib/prisma');
const prisma = prismaImport.prisma || prismaImport.default || prismaImport;

router.get('/health', async (req, res) => {
  const mem = process.memoryUsage();
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    node: process.version,
    memory: {
      rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
    },
    checks: { database: 'PENDING' }
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'UP';
    return res.status(200).json(health);
  } catch (err) {
    health.status = 'ERROR';
    health.checks.database = 'DOWN';
    health.error = err.message;
    return res.status(503).json(health);
  }
});

module.exports = router;

