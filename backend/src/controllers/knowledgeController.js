const { prisma } = require('../lib/prisma');

/**
 * Get the last-expanded sidebar module state for the user
 * GET /api/knowledge/nav-state
 */
exports.getNavState = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const state = await prisma.userNavState.findUnique({
      where: { userId }
    });

    res.json({
      success: true,
      data: state ? state.expandedModule : null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save the last-expanded sidebar module state for the user
 * POST /api/knowledge/nav-state
 */
exports.saveNavState = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { expandedModule } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const state = await prisma.userNavState.upsert({
      where: { userId },
      update: { expandedModule },
      create: { userId, expandedModule }
    });

    res.json({
      success: true,
      data: state.expandedModule
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get knowledge base sections for a trip
 * GET /api/knowledge/sections/:tripId
 */
exports.getSections = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    // Get count of published/approved items for each category
    const counts = await prisma.knowledgeItem.groupBy({
      by: ['category'],
      where: {
        tripId,
        status: { in: ['APPROVED', 'PUBLISHED'] }
      },
      _count: {
        _all: true
      }
    });

    // Build map
    const countsMap = {};
    counts.forEach(c => {
      countsMap[c.category.toLowerCase().replace(/\s/g, "")] = c._count._all;
    });

    const sectionsMeta = [
      { tabKey: "Overview", title: "Trip Overview", description: "Key highlights, route, best time, difficulty & more" },
      { tabKey: "Sales Guide", title: "Sales Guide", description: "How to sell, USPs, objections & answers" },
      { tabKey: "Customer FAQs", title: "Customer FAQs", description: "All customer questions & answers" },
      { tabKey: "Inclusions & Exclusions", title: "Inclusions & Exclusions", description: "What's included / not included" },
      { tabKey: "Ticketing SOPs", title: "Ticketing Info", description: "Train, flight, bus, cab SOPs & rules" },
      { tabKey: "Visa & Entry", title: "Visa & Entry", description: "Visa process, docs, requirements" },
      { tabKey: "Destination Guide", title: "Destination Guide", description: "Weather, food, culture, local info" },
      { tabKey: "Packing Guide", title: "Packing Guide", description: "What to carry, checklist, tips" },
      { tabKey: "Operational SOPs", title: "SOPs & Processes", description: "Operational SOPs & workflows" },
      { tabKey: "Emergency Center", title: "Emergency Center", description: "What to do in emergencies" },
      { tabKey: "Pricing & Policies", title: "Pricing & Policy", description: "Price sheet, cancellation, refund" },
      { tabKey: "Past Learnings", title: "Past Learnings", description: "Lessons, feedback & improvements" }
    ];

    const data = sectionsMeta.map(meta => {
      const cleanKey = meta.tabKey.toLowerCase().replace(/\s/g, "");
      return {
        id: cleanKey,
        tripId,
        tabKey: meta.tabKey,
        title: meta.title,
        description: meta.description,
        itemCount: countsMap[cleanKey] || 0
      };
    });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get critical notices for a trip
 * GET /api/knowledge/notices/:tripId
 */
exports.getNotices = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const notices = await prisma.tripNotice.findMany({
      where: { tripId },
      orderBy: { createdAt: 'desc' },
      take: 2 // get most recent 1-2 notices
    });

    res.json({
      success: true,
      data: notices
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Global search across Trips, Knowledge Sections, Notices, and Vendors
 * GET /api/knowledge/search
 */
exports.searchKnowledge = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.json({ success: true, data: { trips: [], sections: [], notices: [], vendors: [] } });
    }

    const [trips, sections, notices, vendors] = await Promise.all([
      prisma.trip.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { location: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 5
      }),
      prisma.knowledgeSection.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 5
      }),
      prisma.tripNotice.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { body: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 5
      }),
      prisma.vendor.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { type: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 5
      })
    ]);

    res.json({
      success: true,
      data: {
        trips,
        sections,
        notices,
        vendors
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create or update knowledge base section
 * POST /api/knowledge/sections
 */
exports.upsertSection = async (req, res, next) => {
  try {
    const { tripId, tabKey, title, description, itemCount } = req.body;
    
    const existing = await prisma.knowledgeSection.findFirst({
      where: { tripId, tabKey }
    });

    let section;
    if (existing) {
      section = await prisma.knowledgeSection.update({
        where: { id: existing.id },
        data: { title, description, itemCount: Number(itemCount) }
      });
    } else {
      section = await prisma.knowledgeSection.create({
        data: { tripId, tabKey, title, description, itemCount: Number(itemCount) }
      });
    }

    res.json({
      success: true,
      data: section
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a trip notice
 * POST /api/knowledge/notices
 */
exports.createNotice = async (req, res, next) => {
  try {
    const { tripId, title, body } = req.body;
    
    const notice = await prisma.tripNotice.create({
      data: { tripId, title, body }
    });

    res.json({
      success: true,
      data: notice
    });
  } catch (error) {
    next(error);
  }
};

