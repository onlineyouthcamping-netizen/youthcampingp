/**
 * Trips Route Handlers
 * - GET /api/trips
 * - GET /api/trips/:id
 */

const express = require('express');
const router = express.Router();
const { prisma, queryWithTimeout } = require('../utils/database');
const { validatePagination, validateMonth } = require('../utils/validators');

/**
 * GET /api/trips
 * Fetch all trips for homepage with optional filters (month, page, limit, search)
 */
router.get('/', async (req, res, next) => {
  try {
    // 1. Validate pagination
    const paginationVal = validatePagination(req.query);
    if (!paginationVal.valid) {
      return res.status(400).json({
        status: 'error',
        message: paginationVal.error,
        code: 'BAD_REQUEST',
        statusCode: 400,
      });
    }

    const { page, limit } = paginationVal;
    const offset = (page - 1) * limit;

    // 2. Validate month filter
    const monthVal = validateMonth(req.query.month);
    if (!monthVal.valid) {
      return res.status(400).json({
        status: 'error',
        message: monthVal.error,
        code: 'BAD_REQUEST',
        statusCode: 400,
      });
    }
    const monthFilter = monthVal.month;

    // 3. Search query filter
    const search = req.query.search ? req.query.search.trim() : null;

    // Build Prisma query condition
    const where = {};

    if (monthFilter) {
      where.OR = [
        { month: { equals: monthFilter, mode: 'insensitive' } },
        { details: { departureMonth: { has: monthFilter } } }
      ];
    }

    if (search) {
      where.AND = (where.AND || []).concat({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    // Execute queries with timeout
    const fetchTripsTask = prisma.apiTrip.findMany({
      where,
      select: {
        id: true,
        title: true,
        location: true,
        image: true,
        durationNights: true,
        durationDays: true,
        difficulty: true,
        slug: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    const countTask = prisma.apiTrip.count({ where });

    const [trips, total] = await queryWithTimeout(Promise.all([fetchTripsTask, countTask]), 3000);

    const formattedData = trips.map((t) => ({
      id: t.id,
      title: t.title,
      location: t.location,
      image: t.image,
      duration: `${String(t.durationNights).padStart(2, '0')} N / ${String(t.durationDays).padStart(2, '0')} D`,
      difficulty: t.difficulty,
      slug: t.slug,
    }));

    return res.status(200).json({
      status: 'success',
      data: formattedData,
      pagination: {
        total,
        page,
        limit,
        hasMore: offset + trips.length < total,
      },
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
      message: 'Failed to fetch trips',
      code: 'SERVER_ERROR',
      statusCode: 500,
    });
  }
});

/**
 * GET /api/trips/:id
 * Fetch complete trip detail page
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Trip ID parameter is required',
        code: 'BAD_REQUEST',
        statusCode: 400,
      });
    }

    const tripTask = prisma.apiTrip.findFirst({
      where: {
        OR: [{ id: id }, { slug: id }],
      },
      include: {
        details: true,
        travelModes: true,
        roomSharing: true,
        itinerary: { orderBy: { day: 'asc' } },
        inclusions: true,
        exclusions: true,
        stays: true,
        highlights: true,
        reviews: { orderBy: { date: 'desc' } },
        faqs: true,
      },
    });

    const trip = await queryWithTimeout(tripTask, 3000);

    if (!trip) {
      return res.status(404).json({
        status: 'error',
        message: 'Trip not found',
        code: 'NOT_FOUND',
        statusCode: 404,
      });
    }

    // Calculate rating & stats
    const reviews = trip.reviews || [];
    const reviewCount = reviews.length;
    const averageRating = reviewCount > 0
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
      : 5.0;

    // Parse departure data
    const departureMonths = trip.details?.departureMonth || [];
    const departureDates = trip.details?.departureDates || {};

    const formattedResponse = {
      status: 'success',
      data: {
        id: trip.id,
        title: trip.title,
        subtitle: trip.subtitle || 'Backpacking Trip',
        location: trip.location,
        image: trip.image,
        galleryImages: trip.galleryImages || [],
        duration: {
          nights: trip.durationNights,
          days: trip.durationDays,
        },
        difficulty: trip.difficulty,
        ageGroup: trip.ageGroup || '12-35 years',
        maxAltitude: trip.maxAltitude || '10,000 ft',
        price: {
          base: trip.price,
          currency: trip.currency || 'INR',
        },
        description: trip.description,
        travelModes: (trip.travelModes || []).map((m) => ({
          id: m.id,
          name: m.name,
          price: m.price,
          included: m.included,
          description: m.description || '',
        })),
        roomSharing: (trip.roomSharing || []).map((r) => ({
          id: r.id,
          type: r.type,
          price: r.price,
          base: r.base,
          description: r.description || '',
        })),
        itinerary: (trip.itinerary || []).map((item) => ({
          day: item.day,
          title: item.title,
          description: item.description,
          location: item.location || '',
          activities: item.activities || [],
        })),
        inclusions: (trip.inclusions || []).map((inc) => ({
          id: inc.id,
          text: inc.text,
          icon: inc.icon || 'check',
        })),
        exclusions: (trip.exclusions || []).map((exc) => ({
          id: exc.id,
          text: exc.text,
          icon: exc.icon || 'cross',
        })),
        stays: (trip.stays || []).map((s) => ({
          id: s.id,
          name: s.name,
          location: s.location,
          image: s.image || '',
          nights: s.nights,
          amenities: s.amenities || [],
          tags: s.tags || [],
        })),
        highlights: (trip.highlights || []).map((h) => ({
          id: h.id,
          image: h.image,
          title: h.title,
        })),
        reviews: reviews.map((rev) => ({
          id: rev.id,
          author: rev.author,
          avatar: rev.avatar || '',
          date: rev.date,
          rating: rev.rating,
          text: rev.text,
          images: rev.images || [],
        })),
        faqs: (trip.faqs || []).map((f) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
        })),
        departureMonths,
        departureDates,
        averageRating,
        reviewCount,
      },
    };

    return res.status(200).json(formattedResponse);
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
      message: 'Failed to fetch trip details',
      code: 'SERVER_ERROR',
      statusCode: 500,
    });
  }
});

module.exports = router;
