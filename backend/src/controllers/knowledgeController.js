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
    const sections = await prisma.knowledgeSection.findMany({
      where: { tripId },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      data: sections
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

