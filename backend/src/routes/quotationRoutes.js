const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { authenticate, requirePermission } = require('../middleware/auth');

// @desc    Get all quotations
// @route   GET /api/quotations
router.get('/', authenticate, requirePermission('quotations.view'), async (req, res, next) => {
  try {
    const { search } = req.query;

    // 1. Pagination parameters parse
    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 25;
    if (limit > 100) limit = 100;
    const skip = (page - 1) * limit;

    const where = { tenantId: req.user.tenantId };

    // Ownership gating for sales role
    if (req.user?.role === 'sales') {
      where.salesAdminId = req.user.id;
    }

    // Search query map
    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } }
      ];
    }

    // 2. Database query parallel execution
    const [totalCount, quotations] = await Promise.all([
      prisma.quotation.count({ where }),
      prisma.quotation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const formatted = quotations.map(q => {
      const d = (typeof q.data === 'object' && q.data) ? q.data : {};
      const jwt = require('jsonwebtoken');
      const shareToken = jwt.sign({ quotationId: q.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
      return {
        id: q.id,
        title: q.title,
        slug: q.slug,
        status: q.status,
        clientName: q.clientName,
        totalAmount: q.totalAmount,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
        // Extract only the compact fields used by the list view/table, avoiding full itinerary/pricing breakdown data JSON
        customerName: d.customerName || q.clientName,
        destination: d.destination,
        finalPrice: d.finalPrice || q.totalAmount,
        expiresAt: d.expiresAt,
        shareToken
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      data: formatted,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Get single quotation by ID or Slug
router.get('/:idOrSlug', async (req, res, next) => {
  const { idOrSlug } = req.params;

  if (req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
}, async (req, res, next) => {
  const { idOrSlug } = req.params;
  const { token } = req.query;
  try {
    const where = {
      OR: [ { id: idOrSlug }, { slug: idOrSlug }, { title: idOrSlug } ]
    };

    const quotation = await prisma.quotation.findFirst({
      where
    });

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    let isAuthorized = false;

    if (req.user) {
      // Check sales ownership
      if (req.user.role === 'sales' && quotation.salesAdminId !== req.user.id) {
        return res.status(404).json({ success: false, message: 'Quotation not found' });
      }
      isAuthorized = true;
    } else {
      // Public check
      if (quotation.status === 'draft') {
        return res.status(401).json({ success: false, message: 'Authentication required to view draft quotations' });
      }

      if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
      }

      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.quotationId === quotation.id) {
          isAuthorized = true;
        }
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ success: false, message: 'This quotation link has expired' });
        }
        return res.status(401).json({ success: false, message: 'Invalid or expired share token' });
      }
    }

    if (!isAuthorized) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const jwt = require('jsonwebtoken');
    const shareToken = jwt.sign({ quotationId: quotation.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    let responseData = {
      ...(typeof quotation.data === 'object' ? quotation.data : {}),
      id: quotation.id,
      title: quotation.title,
      slug: quotation.slug,
      status: quotation.status,
      clientName: quotation.clientName,
      totalAmount: quotation.totalAmount,
      shareToken
    };

    if (!req.user) {
      // Strip internal/private customer fields
      delete responseData.customerPhone;
      delete responseData.customerMobile;
      delete responseData.customerEmail;
      delete responseData.internalNotes;
      delete responseData.salesAdminId;
      delete responseData.tenantId;
    }

    res.json({
      success: true,
      data: responseData
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Create or Update quotation
// @route   POST /api/quotations
router.post('/', authenticate, requirePermission('quotations.create'), async (req, res, next) => {
  try {
    const body = req.body;
    const id = body.id;

    // Recalculate quotation line items and totals server-side
    let lineItems = body.lineItems || [];
    let subtotal = 0;
    
    // Calculate each line item's total amount
    lineItems = lineItems.map(item => {
      const rate = Number(item.rate || 0);
      const qty = Number(item.qty || item.quantity || 1);
      const total = rate * qty;
      subtotal += total;
      return {
        ...item,
        rate,
        qty,
        total
      };
    });

    const discount = Number(body.discount || 0);
    const discountType = body.discountType || 'fixed';
    let discountAmount = 0;
    if (discount > 0) {
      if (discountType === 'percentage') {
        discountAmount = (subtotal * discount) / 100;
      } else {
        discountAmount = discount;
      }
    }

    const serviceCharge = Number(body.serviceCharge || 0);
    const priceAfterDiscount = subtotal - discountAmount + serviceCharge;

    const gstRate = Number(body.gstRate !== undefined ? body.gstRate : 5);
    const gstAmount = (priceAfterDiscount * gstRate) / 100;
    const totalAmount = priceAfterDiscount + gstAmount;

    // Mutate body and final properties to keep database in sync
    body.lineItems = lineItems;
    body.subtotal = subtotal;
    body.discountAmount = discountAmount;
    body.gstAmount = gstAmount;
    body.totalAmount = totalAmount;
    body.finalPrice = totalAmount;

    const finalTitle = body.title || body.tripTitle || 'Untitled Quote';
    const finalClient = body.clientName || body.customerName || 'Guest';
    const finalAmount = totalAmount;
    const finalStatus = body.status || 'Draft';
    const finalSlug = body.slug || (finalTitle.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 7));

    let quotation;
    const existing = id ? await prisma.quotation.findFirst({ where: { id, tenantId: req.user.tenantId } }) : null;

    if (existing) {
      // Validate sales ownership before editing
      if (req.user?.role === 'sales' && existing.salesAdminId !== req.user.id) {
        return res.status(404).json({ success: false, message: 'Quotation not found' });
      }
      if (req.user?.role === 'sales' && body.salesAdminId !== undefined && body.salesAdminId !== existing.salesAdminId) {
        return res.status(403).json({ success: false, message: 'Sales users cannot modify quotation ownership' });
      }

      quotation = await prisma.quotation.update({
        where: { id },
        data: {
          title: finalTitle,
          slug: finalSlug,
          clientName: finalClient,
          totalAmount: finalAmount,
          status: finalStatus,
          data: body
        }
      });
    } else {
      // Creation: Resolve salesAdminId
      let salesAdminId = null;
      if (req.user?.role === 'sales') {
        salesAdminId = req.user.id;
      } else if (body.salesAdminId) {
        salesAdminId = body.salesAdminId;
      }

      quotation = await prisma.quotation.create({
        data: {
          id: id || undefined,
          title: finalTitle,
          slug: finalSlug,
          clientName: finalClient,
          totalAmount: finalAmount,
          status: finalStatus,
          data: body,
          salesAdminId,
          tenantId: req.user?.tenantId || 'default'
        }
      });
    }

    const jwt = require('jsonwebtoken');
    const shareToken = jwt.sign({ quotationId: quotation.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      data: {
        ...(typeof quotation.data === 'object' ? quotation.data : {}),
        id: quotation.id,
        title: quotation.title,
        slug: quotation.slug,
        status: quotation.status,
        clientName: quotation.clientName,
        totalAmount: quotation.totalAmount,
        shareToken
      }
    });
  } catch (err) {
    console.error('❌ Quotation Save Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to save quotation',
      error: err.message
    });
  }
});

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
router.delete('/:id', authenticate, requirePermission('quotations.edit'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.quotation.findFirst({ where: { id, tenantId: req.user.tenantId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    if (req.user?.role === 'sales' && existing.salesAdminId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    await prisma.quotation.delete({
      where: { id }
    });
    res.json({ success: true, message: 'Quotation deleted' });
  } catch (err) {
    next(err);
  }
});

// @desc    Extend quotation validity
// @route   PATCH /api/quotations/:id/extend
router.patch('/:id/extend', authenticate, requirePermission('quotations.edit'), async (req, res, next) => {
  try {
    const { hours } = req.body;
    const { id } = req.params;

    const quotation = await prisma.quotation.findFirst({ where: { id, tenantId: req.user.tenantId } });
    if (!quotation) return res.status(404).json({ success: false, message: 'Not found' });

    if (req.user?.role === 'sales' && quotation.salesAdminId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    const currentData = quotation.data || {};
    const newExpiry = new Date(new Date().getTime() + (hours || 48) * 60 * 60 * 1000);

    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        data: { ...currentData, expiresAt: newExpiry }
      }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
