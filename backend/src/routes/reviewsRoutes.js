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
    const limit = req.query.limit !== undefined ? Number(req.query.limit) : undefined;
    const featuredVal = validateBooleanParam(req.query.featured, "featured");

    const where = {};
    if (req.query.featured !== undefined && featuredVal.valid && featuredVal.value !== undefined) {
      where.isFeatured = featuredVal.value;
    }

    // Fetch from primary Review table (CMS)
    const primaryReviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    if (primaryReviews && primaryReviews.length > 0) {
      const formattedData = primaryReviews.map((r) => ({
        id: r.id,
        _id: r.id,
        author: r.userName,
        name: r.userName,
        userName: r.userName,
        avatar: r.userImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300",
        userImage: r.userImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300",
        trip: r.tripName || "YouthCamping Trip",
        tripName: r.tripName || "YouthCamping Trip",
        tripId: r.tripId || "",
        badge: r.tripType || "Joined Group Trip",
        tripType: r.tripType || "Joined Group Trip",
        city: r.city || "",
        date: r.createdAt ? new Date(r.createdAt).toISOString().substring(0, 10) : "",
        createdAt: r.createdAt,
        rating: r.rating || 5,
        text: r.comment,
        comment: r.comment,
        isFeatured: r.isFeatured !== false,
        isActive: r.isActive !== false,
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

// GET Single Review by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return res.status(404).json({
        status: "error",
        message: "Review not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: review,
    });
  } catch (error) {
    console.error("GET /api/reviews/:id error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch review",
    });
  }
});

// CREATE Review
router.post("/", async (req, res) => {
  try {
    const {
      userName,
      author,
      name,
      comment,
      text,
      userImage,
      avatar,
      city,
      tripName,
      tripType,
      rating,
      isFeatured,
      photos,
      images,
      tripId,
      isActive,
    } = req.body;

    const finalName = userName || author || name;
    const finalComment = comment || text;

    if (!finalName || !finalComment) {
      return res.status(400).json({
        status: "error",
        message: "Author name and review comment are required",
      });
    }

    const created = await prisma.review.create({
      data: {
        userName: finalName,
        comment: finalComment,
        userImage: userImage || avatar || null,
        city: city || null,
        tripName: tripName || null,
        tripType: tripType || "Joined Group Trip",
        rating: rating !== undefined ? Number(rating) : 5,
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : true,
        photos: photos || images || [],
        tripId: tripId || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return res.status(201).json({
      status: "success",
      data: created,
    });
  } catch (error) {
    console.error("POST /api/reviews error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to create review",
    });
  }
});

// UPDATE Review
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      userName,
      author,
      name,
      comment,
      text,
      userImage,
      avatar,
      city,
      tripName,
      tripType,
      rating,
      isFeatured,
      photos,
      images,
      tripId,
      isActive,
    } = req.body;

    const data = {};
    if (userName || author || name) data.userName = userName || author || name;
    if (comment !== undefined || text !== undefined) data.comment = comment || text;
    if (userImage !== undefined || avatar !== undefined) data.userImage = userImage || avatar;
    if (city !== undefined) data.city = city;
    if (tripName !== undefined) data.tripName = tripName;
    if (tripType !== undefined) data.tripType = tripType;
    if (rating !== undefined) data.rating = Number(rating);
    if (isFeatured !== undefined) data.isFeatured = Boolean(isFeatured);
    if (photos !== undefined || images !== undefined) data.photos = photos || images;
    if (tripId !== undefined) data.tripId = tripId;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.review.update({
      where: { id },
      data,
    });

    return res.status(200).json({
      status: "success",
      data: updated,
    });
  } catch (error) {
    console.error("PUT /api/reviews/:id error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to update review",
    });
  }
});

// DELETE Review
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.review.delete({
      where: { id },
    });

    return res.status(200).json({
      status: "success",
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/reviews/:id error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to delete review",
    });
  }
});

module.exports = router;
