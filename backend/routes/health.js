/**
 * Health Check Monitoring Endpoint
 * - GET /health
 * - GET /api/health
 */

const express = require('express');
const router = express.Router();

router.get(['/health', '/'], (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.status(200).json({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
