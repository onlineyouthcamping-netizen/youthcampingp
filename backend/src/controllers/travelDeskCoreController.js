const { prisma } = require('../lib/prisma');
const { hasPermission } = require('../config/permissions');

// Helper for RBAC
const checkManageAccess = (role) => {
  if (!hasPermission(role, 'trips.edit') && !hasPermission(role, 'ops.manage')) {
    throw new Error('403:Forbidden');
  }
};

const checkPublishAccess = (role) => {
  if (!hasPermission(role, 'trips.publish')) {
    throw new Error('403:Forbidden');
  }
};

// Helper to calculate readiness
const calculateReadiness = async (workspaceId, tripId) => {
  const sections = [
    { name: 'Trip Overview', weight: 15 },
    { name: 'Sales Guide', weight: 15 },
    { name: 'Customer FAQs', weight: 10 },
    { name: 'Inclusions & Exclusions', weight: 10 },
    { name: 'Ticketing Information', weight: 10 },
    { name: 'Itinerary', weight: 10 },
    { name: 'SOPs & Processes', weight: 10 },
    { name: 'Emergency Center', weight: 10 },
    { name: 'Vendor Links', weight: 5 },
    { name: 'Documents', weight: 5 }
  ];

  let score = 0;

  // 1. Check Master data (Trip Overview, Itinerary)
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (trip) {
    if (trip.description || trip.shortName || trip.location) score += 15; // Trip Overview
    if (trip.itinerary || trip.itineraryVersions) score += 10; // Master itinerary (basic check)
  }

  // 2. Check internal articles
  const categories = await prisma.travelDeskCategory.findMany({
    where: { workspaceId },
    include: { articles: { where: { status: 'PUBLISHED' } } }
  });

  categories.forEach(cat => {
    const publishedCount = cat.articles.length;
    if (publishedCount > 0) {
      if (cat.name === 'Sales Guide') score += 15;
      if (cat.name === 'Customer FAQs') score += 10;
      if (cat.name === 'Inclusions & Exclusions') score += 10;
      if (cat.name === 'Ticketing Information') score += 10;
      if (cat.name === 'SOPs & Processes') score += 10;
      if (cat.name === 'Emergency Center') score += 10;
    }
  });

  // 3. Check Vendors
  const vendorLinks = await prisma.travelDeskVendorLink.count({
    where: { workspaceId, status: 'ACTIVE' }
  });
  if (vendorLinks > 0) score += 5;

  // 4. Check Documents (legacy or new approach)
  const docs = await prisma.tripDocument.count({
    where: { tripId, status: 'PUBLISHED' } // legacy structure check
  });
  if (docs > 0) score += 5;

  await prisma.travelDeskWorkspace.update({
    where: { id: workspaceId },
    data: { readinessScore: score }
  });

  return score;
};

// ── AUDIT LOGGING ──
exports.createAuditLog = async (workspaceId, entityType, entityId, action, oldValue, newValue, performedById) => {
  await prisma.travelDeskAuditLog.create({
    data: {
      workspaceId,
      entityType,
      entityId,
      action,
      oldValue: oldValue ? oldValue : undefined,
      newValue: newValue ? newValue : undefined,
      performedById
    }
  });
};

// ── GET /travel-desk/trips ──
exports.getTravelDeskTrips = async (req, res, next) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { isActive: true },
      select: {
        id: true, title: true, shortName: true, location: true, category: true, tripType: true,
        travelDeskWorkspace: { select: { id: true, readinessScore: true, status: true } }
      },
      orderBy: { order: 'asc' }
    });
    res.json({ success: true, data: trips });
  } catch (e) {
    next(e);
  }
};

// ── POST /travel-desk/workspaces/feed ──
exports.feedWorkspaces = async (req, res, next) => {
  try {
    const { tripIds } = req.body;
    if (!tripIds || !Array.isArray(tripIds)) {
      return res.status(400).json({ success: false, message: 'tripIds array is required' });
    }
    
    checkManageAccess(req.user.role);

    const results = [];
    for (const tripId of tripIds) {
      const existing = await prisma.travelDeskWorkspace.findUnique({ where: { tripId } });
      if (existing) {
        results.push({ tripId, status: 'existing', workspace: existing });
        continue;
      }

      const workspace = await prisma.$transaction(async (tx) => {
        const newWorkspace = await tx.travelDeskWorkspace.create({
          data: {
            tripId,
            status: 'ACTIVE',
            createdById: req.user.id,
            updatedById: req.user.id,
            readinessScore: 0
          }
        });

        const defaultCategories = [
          'Trip Overview', 'Sales Guide', 'Customer FAQs', 'Inclusions & Exclusions', 
          'Ticketing Info', 'Visa & Entry', 'Destination Guide', 'Packing Guide', 
          'SOPs & Processes', 'Emergency Center', 'Pricing & Policy', 'Past Learnings'
        ];

        for (const [i, cat] of defaultCategories.entries()) {
          await tx.travelDeskCategory.create({
            data: {
              workspaceId: newWorkspace.id,
              name: cat,
              slug: cat.toLowerCase().replace(/\s+/g, '-'),
              sortOrder: i,
              isRequired: true,
              isActive: true
            }
          });
        }

        await tx.travelDeskAuditLog.create({
          data: {
            workspaceId: newWorkspace.id,
            entityType: 'WORKSPACE',
            entityId: newWorkspace.id,
            action: 'CREATE',
            performedById: req.user.id
          }
        });

        return newWorkspace;
      });

      results.push({ tripId, status: 'created', workspace });
    }

    res.json({ success: true, data: results });
  } catch (e) {
    if (e.message && e.message.startsWith('403')) return res.status(403).json({ success: false, message: 'Forbidden' });
    next(e);
  }
};

// ── GET /travel-desk/workspaces/:tripId ──
exports.getWorkspace = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    let workspace = await prisma.travelDeskWorkspace.findUnique({
      where: { tripId },
      include: {
        categories: { 
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { articles: true } }
          }
        }
      }
    });
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
    
    // Recalculate readiness on load because external trip master data might have changed
    await calculateReadiness(workspace.id, tripId);
    
    // Refetch to get updated score
    workspace = await prisma.travelDeskWorkspace.findUnique({
      where: { tripId },
      include: {
        categories: { 
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { articles: true } }
          }
        }
      }
    });

    res.json({ success: true, data: workspace });
  } catch (e) {
    next(e);
  }
};

// ── GET /travel-desk/:tripId/overview ──
exports.getTripOverview = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true, title: true, shortName: true, location: true,
        price: true, duration: true, description: true, category: true,
        heroImage: true, variants: true, inclusions: true, exclusions: true,
        difficulty: true, departureCity: true, pickupCities: true,
        ageLimit: true, ageGroup: true, maxAltitude: true, tripType: true,
        startEnd: true
      }
    });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    res.json({ success: true, data: trip });
  } catch (e) {
    next(e);
  }
};

// ── GET /travel-desk/:tripId/itinerary ──
exports.getOfficialItinerary = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    // Always fetch from master Trip module
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { itinerary: true, itineraryVersions: true, inclusions: true, exclusions: true }
    });
    
    if (!trip || (!trip.itinerary && !trip.itineraryVersions)) {
      return res.status(404).json({ success: false, message: 'No master itinerary found for this trip.' });
    }
    
    res.json({ success: true, data: trip });
  } catch (e) {
    next(e);
  }
};

// ── GET /travel-desk/:tripId/departures ──
exports.getDepartures = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    // Aggregate departures dynamically from bookings
    const bookings = await prisma.booking.findMany({
      where: { tripId, departureDate: { not: null } },
      select: { departureDate: true, status: true, numberOfTravelers: true, trainTicketStatus: true }
    });

    const departuresMap = {};
    bookings.forEach(b => {
      // Validate date strictly as YYYY-MM-DD to avoid timezone bugs
      if (!b.departureDate) return;
      const d = b.departureDate;
      const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      
      if (!departuresMap[dateStr]) {
        departuresMap[dateStr] = { departureDate: dateStr, confirmedPassengers: 0, pendingPassengers: 0, bookingsCount: 0 };
      }
      
      departuresMap[dateStr].bookingsCount += 1;
      if (b.status === 'confirmed' || b.status === 'completed') {
        departuresMap[dateStr].confirmedPassengers += (b.numberOfTravelers || 1);
      } else {
        departuresMap[dateStr].pendingPassengers += (b.numberOfTravelers || 1);
      }
    });

    const departuresList = Object.values(departuresMap).sort((a, b) => a.departureDate.localeCompare(b.departureDate));
    
    res.json({ success: true, data: departuresList });
  } catch (e) {
    next(e);
  }
};

// ── GET /travel-desk/:tripId/vendors ──
exports.getVendors = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const workspace = await prisma.travelDeskWorkspace.findUnique({ where: { tripId } });
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });

    const links = await prisma.travelDeskVendorLink.findMany({
      where: { workspaceId: workspace.id },
      include: { vendor: true }
    });
    
    res.json({ success: true, data: links });
  } catch (e) {
    next(e);
  }
};

// ── POST /travel-desk/:tripId/vendors/link ──
exports.linkVendor = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { vendorId, departureDate, relationshipType, negotiatedRate, validFrom, validUntil, internalNotes, isPreferred } = req.body;
    
    checkManageAccess(req.user.role);

    const workspace = await prisma.travelDeskWorkspace.findUnique({ where: { tripId } });
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });

    // Validate date strictly as YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (departureDate && !dateRegex.test(departureDate)) {
       return res.status(400).json({ success: false, message: 'departureDate must be YYYY-MM-DD' });
    }

    const existing = await prisma.travelDeskVendorLink.findFirst({
      where: { workspaceId: workspace.id, vendorId, departureDate: departureDate || null }
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Vendor already linked for this departure/trip' });
    }

    const link = await prisma.travelDeskVendorLink.create({
      data: {
        workspaceId: workspace.id,
        vendorId,
        departureDate: departureDate || null,
        relationshipType,
        negotiatedRate,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        internalNotes,
        isPreferred: !!isPreferred
      }
    });

    await exports.createAuditLog(workspace.id, 'VENDOR_LINK', link.id, 'CREATE', null, link, req.user.id);
    await calculateReadiness(workspace.id, tripId);

    res.json({ success: true, data: link });
  } catch (e) {
    if (e.message && e.message.startsWith('403')) return res.status(403).json({ success: false, message: 'Forbidden' });
    next(e);
  }
};

// ── DELETE /travel-desk/:tripId/vendors/:linkId ──
exports.unlinkVendor = async (req, res, next) => {
  try {
    const { tripId, linkId } = req.params;
    checkManageAccess(req.user.role);

    const workspace = await prisma.travelDeskWorkspace.findUnique({ where: { tripId } });
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });

    const link = await prisma.travelDeskVendorLink.findUnique({ where: { id: linkId } });
    if (!link) return res.status(404).json({ success: false, message: 'Vendor link not found' });

    await prisma.travelDeskVendorLink.delete({ where: { id: linkId } });
    await exports.createAuditLog(workspace.id, 'VENDOR_LINK', linkId, 'DELETE', link, null, req.user.id);
    await calculateReadiness(workspace.id, tripId);

    res.json({ success: true, message: 'Vendor link deleted' });
  } catch (e) {
    if (e.message && e.message.startsWith('403')) return res.status(403).json({ success: false, message: 'Forbidden' });
    next(e);
  }
};

// ── ARTICLE CRUD ──
exports.getArticles = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const workspace = await prisma.travelDeskWorkspace.findUnique({ where: { tripId } });
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });

    let statusFilter = undefined;
    if (!['superadmin', 'admin', 'operations', 'sales', 'finance', 'ticketing'].includes(req.user.role)) {
       statusFilter = 'PUBLISHED';
    }

    const articles = await prisma.travelDeskArticle.findMany({
      where: { 
        workspaceId: workspace.id,
        ...(statusFilter && { status: statusFilter }),
        ...(statusFilter === 'PUBLISHED' && {
          OR: [
             { expiresAt: null },
             { expiresAt: { gt: new Date() } }
          ]
        })
      },
      include: { category: true }
    });

    res.json({ success: true, data: articles });
  } catch (e) {
    next(e);
  }
};

exports.createArticle = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { categoryId, title, summary, content, visibility, effectiveFrom, expiresAt } = req.body;
    
    checkManageAccess(req.user.role);
    
    const workspace = await prisma.travelDeskWorkspace.findUnique({ where: { tripId } });
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });

    const article = await prisma.travelDeskArticle.create({
      data: {
        workspaceId: workspace.id,
        categoryId,
        title,
        summary,
        content,
        visibility: visibility || 'INTERNAL',
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: req.user.id,
        updatedById: req.user.id
      }
    });

    await exports.createAuditLog(workspace.id, 'ARTICLE', article.id, 'CREATE', null, { title }, req.user.id);
    
    res.json({ success: true, data: article });
  } catch (e) {
    if (e.message && e.message.startsWith('403')) return res.status(403).json({ success: false, message: 'Forbidden' });
    next(e);
  }
};

exports.updateArticle = async (req, res, next) => {
  try {
    const { tripId, articleId } = req.params;
    checkManageAccess(req.user.role);

    const oldArticle = await prisma.travelDeskArticle.findUnique({ where: { id: articleId } });
    if (!oldArticle) return res.status(404).json({ success: false, message: 'Article not found' });

    const updated = await prisma.travelDeskArticle.update({
      where: { id: articleId },
      data: {
        ...req.body,
        updatedById: req.user.id,
        updatedAt: new Date()
      }
    });

    await exports.createAuditLog(updated.workspaceId, 'ARTICLE', articleId, 'UPDATE', { title: oldArticle.title }, { title: updated.title }, req.user.id);
    await calculateReadiness(updated.workspaceId, tripId);

    res.json({ success: true, data: updated });
  } catch (e) {
    if (e.message && e.message.startsWith('403')) return res.status(403).json({ success: false, message: 'Forbidden' });
    next(e);
  }
};

exports.approveArticle = async (req, res, next) => {
  try {
    const { tripId, articleId } = req.params;
    checkPublishAccess(req.user.role);

    const updated = await prisma.travelDeskArticle.update({
      where: { id: articleId },
      data: { status: 'APPROVED', approvedById: req.user.id, updatedById: req.user.id }
    });

    await exports.createAuditLog(updated.workspaceId, 'ARTICLE', articleId, 'APPROVE', null, { status: 'APPROVED' }, req.user.id);
    
    res.json({ success: true, data: updated });
  } catch (e) {
    if (e.message && e.message.startsWith('403')) return res.status(403).json({ success: false, message: 'Forbidden' });
    next(e);
  }
};

exports.publishArticle = async (req, res, next) => {
  try {
    const { tripId, articleId } = req.params;
    checkPublishAccess(req.user.role);

    const updated = await prisma.travelDeskArticle.update({
      where: { id: articleId },
      data: { status: 'PUBLISHED', publishedById: req.user.id, updatedById: req.user.id }
    });

    await exports.createAuditLog(updated.workspaceId, 'ARTICLE', articleId, 'PUBLISH', null, { status: 'PUBLISHED' }, req.user.id);
    await calculateReadiness(updated.workspaceId, tripId);

    res.json({ success: true, data: updated });
  } catch (e) {
    if (e.message && e.message.startsWith('403')) return res.status(403).json({ success: false, message: 'Forbidden' });
    next(e);
  }
};

exports.archiveArticle = async (req, res, next) => {
  try {
    const { tripId, articleId } = req.params;
    checkPublishAccess(req.user.role);

    const updated = await prisma.travelDeskArticle.update({
      where: { id: articleId },
      data: { status: 'ARCHIVED', updatedById: req.user.id }
    });

    await exports.createAuditLog(updated.workspaceId, 'ARTICLE', articleId, 'ARCHIVE', null, { status: 'ARCHIVED' }, req.user.id);
    await calculateReadiness(updated.workspaceId, tripId);

    res.json({ success: true, data: updated });
  } catch (e) {
    if (e.message && e.message.startsWith('403')) return res.status(403).json({ success: false, message: 'Forbidden' });
    next(e);
  }
};

exports.getReadiness = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const workspace = await prisma.travelDeskWorkspace.findUnique({ where: { tripId } });
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
    
    const score = await calculateReadiness(workspace.id, tripId);
    res.json({ success: true, data: { readinessScore: score } });
  } catch (e) {
    next(e);
  }
};
