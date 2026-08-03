/**
 * Destinations Route Handler
 * - GET /api/destinations
 */

const express = require('express');
const router = express.Router();
const { prisma, queryWithTimeout } = require('../utils/database');

/**
 * GET /api/destinations
 * Fetch popular destinations carousel (top 5 ordered by order ASC)
 */
router.get('/', async (req, res, next) => {
  try {
    const fetchDestinations = prisma.destination.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        order: true,
      },
      orderBy: { order: 'asc' },
      take: 5,
    });

    const destinations = await queryWithTimeout(fetchDestinations, 3000);

    return res.status(200).json({
      status: 'success',
      data: destinations,
    });
  } catch (error) {
    if (error.code === 'TIMEOUT') {
      return res.status(408).json({
        status: 'error',
        message: 'Request timed out after 3 seconds',
        code: 'REQUEST_TIMEOUT',
        statusCode: 408,
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch destinations',
      code: 'SERVER_ERROR',
      statusCode: 500,
    });
  }
});

module.exports = router;
