/**
 * Health Check Monitoring Endpoint
 * - GET /api/health
 */

const express = require('express');
const router = express.Router();
const { prisma } = require('../utils/database');

router.get('/health', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (error) {
    dbStatus = 'unhealthy';
    console.error('Health check DB error:', error.message);
  }

  const statusCode = dbStatus === 'healthy' ? 200 : 500;

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  return res.status(statusCode).json({
    status: dbStatus === 'healthy' ? 'success' : 'error',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    services: {
      api: 'healthy',
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
    },
    responseTimeMs: Date.now() - startTime,
  });
});

module.exports = router;
