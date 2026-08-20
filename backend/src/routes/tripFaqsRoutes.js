/**
 * Trip-scoped reviews & FAQs (canonical)
 * - GET /api/trips/:id/reviews
 * - GET /api/trips/:id/faqs
 *
 * Migrated from backend/routes/faqs.js — behavior preserved.
 * Mounted on /api/trips after tripRoutes.js (same order as before).
 */

const express = require("express");
const router = express.Router({ mergeParams: true });
const { prisma, queryWithTimeout } = require("../utils/database");
const { validatePagination } = require("../utils/validators");

router.get("/:id/reviews", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Trip ID parameter is required",
        code: "BAD_REQUEST",
        statusCode: 400,
      });
    }

    const paginationVal = validatePagination(req.query);
    if (!paginationVal.valid) {
      return res.status(400).json({
        status: "error",
        message: paginationVal.error,
        code: "BAD_REQUEST",
        statusCode: 400,
      });
    }

    const page = paginationVal.page;
    const limit = req.query.limit !== undefined ? paginationVal.limit : 5;
    const offset = (page - 1) * limit;

    const trip = await prisma.apiTrip.findFirst({
      where: { OR: [{ id: id }, { slug: id }] },
      select: { id: true },
    });

    const targetTripId = trip ? trip.id : id;

    const where = { tripId: targetTripId };

    const fetchReviewsTask = prisma.reviewItem.findMany({
      where,
      select: {
        id: true,
        author: true,
        avatar: true,
        date: true,
        rating: true,
        text: true,
        images: true,
      },
      orderBy: { date: "desc" },
      skip: offset,
      take: limit,
    });

    const countTask = prisma.reviewItem.count({ where });
    const aggregateTask = prisma.reviewItem.aggregate({
      where,
      _avg: { rating: true },
    });

    const [reviews, total, aggregateResult] = await queryWithTimeout(
      Promise.all([fetchReviewsTask, countTask, aggregateTask]),
      3000,
    );

    const avgRatingRaw = aggregateResult._avg.rating;
    const averageRating = avgRatingRaw ? Number(avgRatingRaw.toFixed(1)) : 5.0;

    const formattedReviews = reviews.map((r) => ({
      id: isNaN(Number(r.id)) ? r.id : Number(r.id),
      author: r.author,
      avatar: r.avatar || "",
      date: r.date,
      rating: r.rating,
      text: r.text,
      images: r.images || [],
    }));

    return res.status(200).json({
      status: "success",
      data: formattedReviews,
      pagination: {
        total,
        page,
        limit,
        hasMore: offset + reviews.length < total,
      },
      stats: {
        averageRating,
        totalReviews: total,
      },
    });
  } catch (error) {
    if (error.code === "TIMEOUT") {
      return res.status(408).json({
        status: "error",
        message: "Request timed out after 3 seconds",
        code: "REQUEST_TIMEOUT",
        statusCode: 408,
      });
    }
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch trip reviews",
      code: "SERVER_ERROR",
      statusCode: 500,
    });
  }
});

router.get("/:id/faqs", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Trip ID parameter is required",
        code: "BAD_REQUEST",
        statusCode: 400,
      });
    }

    const trip = await prisma.apiTrip.findFirst({
      where: { OR: [{ id: id }, { slug: id }] },
      select: { id: true },
    });

    const targetTripId = trip ? trip.id : id;

    const fetchFaqs = prisma.faq.findMany({
      where: { tripId: targetTripId },
      select: {
        id: true,
        question: true,
        answer: true,
      },
      orderBy: { id: "asc" },
    });

    const faqs = await queryWithTimeout(fetchFaqs, 3000);

    return res.status(200).json({
      status: "success",
      data: faqs,
    });
  } catch (error) {
    if (error.code === "TIMEOUT") {
      return res.status(408).json({
        status: "error",
        message: "Request timed out after 3 seconds",
        code: "REQUEST_TIMEOUT",
        statusCode: 408,
      });
    }
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch FAQs",
      code: "SERVER_ERROR",
      statusCode: 500,
    });
  }
});

module.exports = router;
