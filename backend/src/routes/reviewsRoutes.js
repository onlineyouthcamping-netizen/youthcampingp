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

    // Fetch from primary Review table (CMS)
    const primaryReviews = await prisma.review.findMany({
      where: {
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    if (primaryReviews && primaryReviews.length > 0) {
      const formattedData = primaryReviews.map((r) => ({
        id: r.id,
        author: r.userName,
        name: r.userName,
        userName: r.userName,
        avatar: r.userImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300",
        userImage: r.userImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300",
        trip: r.tripName || "YouthCamping Trip",
        tripName: r.tripName || "YouthCamping Trip",
        badge: r.tripType || "Joined Group Trip",
        tripType: r.tripType || "Joined Group Trip",
        city: r.city,
        date: r.createdAt ? new Date(r.createdAt).toISOString().substring(0, 10) : "",
        createdAt: r.createdAt,
        rating: r.rating || 5,
        text: r.comment,
        comment: r.comment,
        images: r.photos || [],
        photos: r.photos || [],
      }));

      return res.status(200).json({
        status: "success",
        data: formattedData,
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
      name: r.author,
      userName: r.author,
      avatar: r.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300",
      userImage: r.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300",
      trip: r.tripName || r.trip?.title || "YouthCamping Trip",
      tripName: r.tripName || r.trip?.title || "YouthCamping Trip",
      tripSlug: r.tripSlug || r.trip?.slug || "youthcamping-trip",
      date: r.date,
      rating: r.rating || 5,
      text: r.text,
      comment: r.text,
      images: r.images || [],
      photos: r.images || [],
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
