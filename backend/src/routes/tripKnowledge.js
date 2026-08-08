const express = require("express");
const router = express.Router({ mergeParams: true });
const { prisma } = require("../lib/prisma");
const { authenticate, requirePermission } = require("../middleware/auth");

/**
 * 5. GET /api/trips/:tripId/knowledge/search?q=query
 * Full-text search across title + body
 * Search Postgres using raw query or ILIKE
 * Return: { success: true, data: { results: [], count }, message: '' }
 * Note: Placed BEFORE /:section or /:id to prevent route param collision
 */
router.get(
  "/:tripId/knowledge/search",
  authenticate,
  requirePermission("view_trip"),
  async (req, res, next) => {
    try {
      const { tripId } = req.params;
      const { q } = req.query;

      if (!q || typeof q !== "string" || !q.trim()) {
        return res.json({
          success: true,
          data: { results: [], count: 0 },
          message: "Search query is empty",
        });
      }

      const searchTerm = q.trim();
      let results = [];
      try {
        results = await prisma.$queryRaw`
        SELECT * FROM "TripKnowledge"
        WHERE "tripId" = ${tripId}
        AND (
          to_tsvector('english', "title" || ' ' || "body") @@ plainto_tsquery('english', ${searchTerm})
          OR "title" ILIKE ${"%" + searchTerm + "%"}
          OR "body" ILIKE ${"%" + searchTerm + "%"}
        )
        ORDER BY "createdAt" DESC
      `;
      } catch (rawErr) {
        results = await prisma.tripKnowledge.findMany({
          where: {
            tripId,
            OR: [
              { title: { contains: searchTerm, mode: "insensitive" } },
              { body: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
          orderBy: { createdAt: "desc" },
          include: {
            author: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        });
      }

      return res.json({
        success: true,
        data: {
          results,
          count: results.length,
        },
        message: "Search completed successfully",
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * 6. GET /api/trips/:tripId/activity
 * Fetch activity log for this trip
 * Query params: section (filter), action (filter), limit, offset
 * Join with Admin table to get actor names
 * Return: { success: true, data: { activities: [], total }, message: '' }
 * Note: Placed before /:section to avoid route collision
 */
router.get(
  "/:tripId/activity",
  authenticate,
  requirePermission("view_trip"),
  async (req, res, next) => {
    try {
      const { tripId } = req.params;
      const { section, action, limit = 50, offset = 0 } = req.query;

      const where = { tripId };
      if (section) {
        where.section = section;
      }
      if (action) {
        where.action = action;
      }

      const take = parseInt(limit, 10) || 50;
      const skip = parseInt(offset, 10) || 0;

      const [activities, total] = await Promise.all([
        prisma.tripActivityLog.findMany({
          where,
          take,
          skip,
          orderBy: { createdAt: "desc" },
          include: {
            actor: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        }),
        prisma.tripActivityLog.count({ where }),
      ]);

      return res.json({
        success: true,
        data: { activities, total },
        message: "Activity log fetched successfully",
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * 1. GET /api/trips/:tripId/knowledge/:section
 * Fetch all items for section
 * Query params: status (draft/published), sort (created_at/-created_at)
 * Return: { success: true, data: { items: [], total: count }, message: '' }
 */
router.get(
  "/:tripId/knowledge/:section",
  authenticate,
  requirePermission("view_trip"),
  async (req, res, next) => {
    try {
      const { tripId, section } = req.params;
      const { status, sort } = req.query;

      const where = { tripId, section };
      if (status) {
        where.status = status;
      }

      let orderBy = { createdAt: "desc" };
      if (sort === "created_at") {
        orderBy = { createdAt: "asc" };
      } else if (sort === "-created_at") {
        orderBy = { createdAt: "desc" };
      }

      const [items, total] = await Promise.all([
        prisma.tripKnowledge.findMany({
          where,
          orderBy,
          include: {
            author: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        }),
        prisma.tripKnowledge.count({ where }),
      ]);

      return res.json({
        success: true,
        data: { items, total },
        message: "Knowledge items fetched successfully",
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * 2. POST /api/trips/:tripId/knowledge/:section
 * Create new knowledge item
 * Body: { title, body, contentType, data, status }
 * Auto-create TripActivityLog entry
 * Return: created item with id
 */
router.post(
  "/:tripId/knowledge/:section",
  authenticate,
  requirePermission("edit_trip"),
  async (req, res, next) => {
    try {
      const { tripId, section } = req.params;
      const { title, body, contentType, data, status } = req.body;

      if (!title || !body) {
        return res
          .status(400)
          .json({ success: false, message: "Title and body are required" });
      }

      const createdItem = await prisma.tripKnowledge.create({
        data: {
          tripId,
          section,
          contentType: contentType || "text",
          title,
          body,
          data: data || null,
          status: status || "draft",
          version: 1,
          createdBy: req.user.id,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      // Auto-create TripActivityLog entry
      await prisma.tripActivityLog.create({
        data: {
          tripId,
          action: "create",
          section,
          itemId: createdItem.id,
          changes: {
            title,
            contentType: createdItem.contentType,
            status: createdItem.status,
          },
          performedBy: req.user.id,
        },
      });

      return res.status(201).json({
        success: true,
        data: createdItem,
        message: "Knowledge item created successfully",
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * 3. PUT /api/trips/:tripId/knowledge/:id
 * Update knowledge item
 * Body: { title, body, contentType, data, status }
 * Increment version + 1
 * Auto-log to TripActivityLog with changes diff
 * Return: updated item
 */
router.put(
  "/:tripId/knowledge/item/:id",
  authenticate,
  requirePermission("edit_trip"),
  async (req, res, next) => {
    try {
      const { tripId, id } = req.params;
      const { title, body, contentType, data, status } = req.body;

      const existing = await prisma.tripKnowledge.findUnique({
        where: { id },
      });

      if (!existing || existing.tripId !== tripId) {
        return res
          .status(404)
          .json({ success: false, message: "Knowledge item not found" });
      }

      const updatedItem = await prisma.tripKnowledge.update({
        where: { id },
        data: {
          title: title !== undefined ? title : existing.title,
          body: body !== undefined ? body : existing.body,
          contentType:
            contentType !== undefined ? contentType : existing.contentType,
          data: data !== undefined ? data : existing.data,
          status: status !== undefined ? status : existing.status,
          version: existing.version + 1,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      // Auto-log to TripActivityLog with changes diff
      await prisma.tripActivityLog.create({
        data: {
          tripId,
          action: "edit",
          section: existing.section,
          itemId: id,
          changes: {
            before: {
              title: existing.title,
              body: existing.body,
              status: existing.status,
              version: existing.version,
            },
            after: {
              title: updatedItem.title,
              body: updatedItem.body,
              status: updatedItem.status,
              version: updatedItem.version,
            },
          },
          performedBy: req.user.id,
        },
      });

      return res.json({
        success: true,
        data: updatedItem,
        message: "Knowledge item updated successfully",
      });
    } catch (err) {
      next(err);
    }
  },
);

// Also support PUT /api/trips/:tripId/knowledge/:id directly
router.put(
  "/:tripId/knowledge/:id",
  authenticate,
  requirePermission("edit_trip"),
  async (req, res, next) => {
    try {
      const { tripId, id } = req.params;
      const { title, body, contentType, data, status } = req.body;

      const existing = await prisma.tripKnowledge.findUnique({
        where: { id },
      });

      if (!existing || existing.tripId !== tripId) {
        return res
          .status(404)
          .json({ success: false, message: "Knowledge item not found" });
      }

      const updatedItem = await prisma.tripKnowledge.update({
        where: { id },
        data: {
          title: title !== undefined ? title : existing.title,
          body: body !== undefined ? body : existing.body,
          contentType:
            contentType !== undefined ? contentType : existing.contentType,
          data: data !== undefined ? data : existing.data,
          status: status !== undefined ? status : existing.status,
          version: existing.version + 1,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      // Auto-log to TripActivityLog with changes diff
      await prisma.tripActivityLog.create({
        data: {
          tripId,
          action: "edit",
          section: existing.section,
          itemId: id,
          changes: {
            before: {
              title: existing.title,
              body: existing.body,
              status: existing.status,
              version: existing.version,
            },
            after: {
              title: updatedItem.title,
              body: updatedItem.body,
              status: updatedItem.status,
              version: updatedItem.version,
            },
          },
          performedBy: req.user.id,
        },
      });

      return res.json({
        success: true,
        data: updatedItem,
        message: "Knowledge item updated successfully",
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * 4. DELETE /api/trips/:tripId/knowledge/:id
 * Hard delete
 * Auto-log deletion to TripActivityLog
 * Return: { success: true, message: '' }
 */
router.delete(
  "/:tripId/knowledge/:id",
  authenticate,
  requirePermission("edit_trip"),
  async (req, res, next) => {
    try {
      const { tripId, id } = req.params;

      const existing = await prisma.tripKnowledge.findUnique({
        where: { id },
      });

      if (!existing || existing.tripId !== tripId) {
        return res
          .status(404)
          .json({ success: false, message: "Knowledge item not found" });
      }

      await prisma.tripKnowledge.delete({
        where: { id },
      });

      // Auto-log deletion to TripActivityLog
      await prisma.tripActivityLog.create({
        data: {
          tripId,
          action: "delete",
          section: existing.section,
          itemId: id,
          changes: { title: existing.title, section: existing.section },
          performedBy: req.user.id,
        },
      });

      return res.json({
        success: true,
        data: null,
        message: "Knowledge item deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
