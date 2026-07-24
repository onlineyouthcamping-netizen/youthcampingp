const express = require('express');
const router = express.Router({ mergeParams: true });
const { prisma } = require('../lib/prisma');
const { authenticate, requirePermission } = require('../middleware/auth');

/**
 * 1. GET /api/trips/:tripId/sops
 * Fetch all SOPs for trip
 * Query params: category (filter), status
 * Return: { success: true, data: { sops: [], total }, message: '' }
 */
router.get('/:tripId/sops', authenticate, requirePermission('view_trip'), async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { category, status } = req.query;

    const where = { tripId };
    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }

    const [sops, total] = await Promise.all([
      prisma.tripSOP.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, name: true, email: true, avatarUrl: true }
          }
        }
      }),
      prisma.tripSOP.count({ where })
    ]);

    return res.json({
      success: true,
      data: { sops, total },
      message: 'SOPs fetched successfully'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 2. POST /api/trips/:tripId/sops
 * Create new SOP
 * Body: { title, description, category, steps: [{ step_number, title, details }], status }
 * Status default: 'draft'
 * Auto-log to TripActivityLog
 * Return: created SOP with id
 */
router.post('/:tripId/sops', authenticate, requirePermission('edit_trip'), async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { title, description, category = 'other', steps = [], status = 'draft' } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const sop = await prisma.tripSOP.create({
      data: {
        tripId,
        title,
        description,
        category,
        steps: Array.isArray(steps) ? steps : [],
        version: 1,
        status,
        createdBy: req.user.id
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        }
      }
    });

    // Auto-log to TripActivityLog
    await prisma.tripActivityLog.create({
      data: {
        tripId,
        action: 'create',
        section: 'sops',
        itemId: sop.id,
        changes: { title, category, stepCount: Array.isArray(steps) ? steps.length : 0 },
        performedBy: req.user.id
      }
    });

    return res.status(201).json({
      success: true,
      data: sop,
      message: 'SOP created successfully'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. PUT /api/trips/:tripId/sops/:sopId
 * Update SOP
 * Body: { title, description, category, steps, status }
 * Increment version + 1
 * Auto-log changes
 * Return: updated SOP
 */
router.put('/:tripId/sops/:sopId', authenticate, requirePermission('edit_trip'), async (req, res, next) => {
  try {
    const { tripId, sopId } = req.params;
    const { title, description, category, steps, status } = req.body;

    const existing = await prisma.tripSOP.findUnique({
      where: { id: sopId }
    });

    if (!existing || existing.tripId !== tripId) {
      return res.status(404).json({ success: false, message: 'SOP not found' });
    }

    const updatedSop = await prisma.tripSOP.update({
      where: { id: sopId },
      data: {
        title: title !== undefined ? title : existing.title,
        description: description !== undefined ? description : existing.description,
        category: category !== undefined ? category : existing.category,
        steps: steps !== undefined ? steps : existing.steps,
        status: status !== undefined ? status : existing.status,
        version: existing.version + 1
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        }
      }
    });

    // Auto-log to TripActivityLog
    await prisma.tripActivityLog.create({
      data: {
        tripId,
        action: 'edit',
        section: 'sops',
        itemId: sopId,
        changes: {
          before: { title: existing.title, category: existing.category, version: existing.version },
          after: { title: updatedSop.title, category: updatedSop.category, version: updatedSop.version }
        },
        performedBy: req.user.id
      }
    });

    return res.json({
      success: true,
      data: updatedSop,
      message: 'SOP updated successfully'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 4. DELETE /api/trips/:tripId/sops/:sopId
 * Delete SOP
 * Auto-log
 */
router.delete('/:tripId/sops/:sopId', authenticate, requirePermission('edit_trip'), async (req, res, next) => {
  try {
    const { tripId, sopId } = req.params;

    const existing = await prisma.tripSOP.findUnique({
      where: { id: sopId }
    });

    if (!existing || existing.tripId !== tripId) {
      return res.status(404).json({ success: false, message: 'SOP not found' });
    }

    await prisma.tripSOP.delete({
      where: { id: sopId }
    });

    // Auto-log to TripActivityLog
    await prisma.tripActivityLog.create({
      data: {
        tripId,
        action: 'delete',
        section: 'sops',
        itemId: sopId,
        changes: { title: existing.title, category: existing.category },
        performedBy: req.user.id
      }
    });

    return res.json({
      success: true,
      data: null,
      message: 'SOP deleted successfully'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
