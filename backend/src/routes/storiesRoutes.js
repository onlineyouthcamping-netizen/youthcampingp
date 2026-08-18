/**
 * Stories Route Handler (canonical)
 * - GET /api/stories
 *
 * Migrated from backend/routes/stories.js — behavior preserved.
 */

const express = require("express");
const router = express.Router();
const { prisma, queryWithTimeout } = require("../../utils/database");
const {
  validatePagination,
  validateBooleanParam,
} = require("../../utils/validators");

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

    const page = paginationVal.page;
    const limit = req.query.limit !== undefined ? paginationVal.limit : 3;
    const offset = (page - 1) * limit;

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
    }

    const fetchStories = prisma.story.findMany({
      where,
      select: {
        id: true,
        title: true,
        author: true,
        avatar: true,
        readTime: true,
        image: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: "desc" },
      skip: offset,
      take: limit,
    });

    const stories = await queryWithTimeout(fetchStories, 3000);

    const formattedData = stories.map((s) => ({
      id: isNaN(Number(s.id)) ? s.id : Number(s.id),
      title: s.title,
      author: s.author,
      avatar: s.avatar || "",
      readTime: s.readTime,
      image: s.image,
      slug: s.slug,
      excerpt: s.excerpt,
      publishedAt: s.publishedAt,
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
      message: "Failed to fetch stories",
      code: "SERVER_ERROR",
      statusCode: 500,
    });
  }
});

module.exports = router;
