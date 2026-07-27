const express = require('express');
const router = express.Router();
const prismaImport = require('../lib/prisma');
const prisma = prismaImport.prisma || prismaImport.default || prismaImport;

router.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
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
