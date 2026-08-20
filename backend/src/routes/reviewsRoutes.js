/**
 * Reviews Route Handler (canonical public homepage)
 * - GET /api/reviews
 *
 * Migrated from backend/routes/reviews.js — behavior preserved.
 */

const express = require("express");
const router = express.Router();
const { prisma, queryWithTimeout } = require("../utils/database");
const {
  validatePagination,
  validateBooleanParam,
} = require("../utils/validators");

router.get("/", async (req, res, next) => {
  try {
    const paginationVal = validatePagination(req.query);
    if (!paginationVal.valid) {
      return res.status(400).json({
        status: "error",
        message: paginationVal.error,
        code: "BAD_REQUEST",
        statusCode: 400,
      });
    }

    const limit = req.query.limit !== undefined ? paginationVal.limit : 3;

    const featuredVal = validateBooleanParam(req.query.featured, "featured");
    if (!featuredVal.valid) {
      return res.status(400).json({
        status: "error",
        message: featuredVal.error,
        code: "BAD_REQUEST",
        statusCode: 400,
      });
    }

    const where = {};
    if (featuredVal.value !== undefined) {
      where.featured = featuredVal.value;
    } else {
      where.featured = true;
    }

    const fetchReviews = prisma.reviewItem.findMany({
      where,
      include: {
        trip: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: limit,
    });

    const reviews = await queryWithTimeout(fetchReviews, 3000);

    const formattedData = reviews.map((r) => ({
      id: isNaN(Number(r.id)) ? r.id : Number(r.id),
      author: r.author,
      avatar: r.avatar || "",
      trip: r.tripName || r.trip?.title || "YouthCamping Trip",
      tripSlug: r.tripSlug || r.trip?.slug || "youthcamping-trip",
      date: r.date,
      rating: r.rating,
      text: r.text,
      images: r.images || [],
    }));

    return res.status(200).json({
      status: "success",
      data: formattedData,
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
      message: "Failed to fetch reviews",
      code: "SERVER_ERROR",
      statusCode: 500,
    });
  }
});

module.exports = router;
