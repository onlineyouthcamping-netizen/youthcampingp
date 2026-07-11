const { prisma } = require('../lib/prisma');

// ── TAB 2: TICKETING (SOPs & Links) ──
exports.getTicketing = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const [sops, links] = await Promise.all([
      prisma.ticketingSop.findMany({
        where: { tripId },
        include: { items: true, _count: { select: { items: true } } },
        orderBy: { category: 'asc' }
      }),
      prisma.ticketingLink.findMany({
        where: { tripId },
        orderBy: { createdAt: 'asc' }
      })
    ]);
    res.json({ success: true, data: { sops, links } });
  } catch (e) { next(e); }
};

exports.createTicketingSop = async (req, res, next) => {
  try {
    const { tripId, category, title, description, items } = req.body;
    const sop = await prisma.ticketingSop.create({
      data: {
        tripId,
        category,
        title,
        description,
        items: items ? {
          create: items.map(item => ({ title: item.title, content: item.content }))
        } : undefined
      },
      include: { items: true }
    });
    res.json({ success: true, data: sop });
  } catch (e) { next(e); }
};

exports.updateTicketingSop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, title, description, items } = req.body;
    
    // Simple sync items: delete existing, insert new
    if (items) {
      await prisma.ticketingSopItem.deleteMany({ where: { sopId: id } });
    }

    const sop = await prisma.ticketingSop.update({
      where: { id },
      data: {
        category,
        title,
        description,
        items: items ? {
          create: items.map(item => ({ title: item.title, content: item.content }))
        } : undefined
      },
      include: { items: true }
    });
    res.json({ success: true, data: sop });
  } catch (e) { next(e); }
};

exports.deleteTicketingSop = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.ticketingSop.delete({ where: { id } });
    res.json({ success: true, message: 'Ticketing SOP deleted successfully' });
  } catch (e) { next(e); }
};

exports.createTicketingLink = async (req, res, next) => {
  try {
    const { tripId, label, val, icon, linkUrl } = req.body;
    const link = await prisma.ticketingLink.create({
      data: { tripId, label, val, icon, linkUrl }
    });
    res.json({ success: true, data: link });
  } catch (e) { next(e); }
};

exports.updateTicketingLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label, val, icon, linkUrl } = req.body;
    const link = await prisma.ticketingLink.update({
      where: { id },
      data: { label, val, icon, linkUrl }
    });
    res.json({ success: true, data: link });
  } catch (e) { next(e); }
};

exports.deleteTicketingLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.ticketingLink.delete({ where: { id } });
    res.json({ success: true, message: 'Ticketing Quick Link deleted successfully' });
  } catch (e) { next(e); }
};


// ── TAB 3: ITINERARY (Variants, Days, Route Maps, Inclusions, Exclusions, Notes) ──
exports.getItineraries = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const itineraries = await prisma.itinerary.findMany({
      where: { tripId },
      include: {
        days: { orderBy: { dayNumber: 'asc' } },
        routeMaps: true,
        inclusions: true,
        exclusions: true,
        notes: true
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }]
    });
    res.json({ success: true, data: itineraries });
  } catch (e) { next(e); }
};

exports.createItinerary = async (req, res, next) => {
  try {
    const { tripId, name, isDefault, version, days, routeMaps, inclusions, exclusions, notes } = req.body;
    
    if (isDefault) {
      // Set all other itineraries for this trip to not default
      await prisma.itinerary.updateMany({
        where: { tripId },
        data: { isDefault: false }
      });
    }

    const itinerary = await prisma.itinerary.create({
      data: {
        tripId,
        name,
        isDefault: !!isDefault,
        version: version || 1,
        days: days ? { create: days } : undefined,
        routeMaps: routeMaps ? { create: routeMaps } : undefined,
        inclusions: inclusions ? { create: inclusions } : undefined,
        exclusions: exclusions ? { create: exclusions } : undefined,
        notes: notes ? { create: notes } : undefined
      },
      include: {
        days: { orderBy: { dayNumber: 'asc' } },
        routeMaps: true,
        inclusions: true,
        exclusions: true,
        notes: true
      }
    });
    res.json({ success: true, data: itinerary });
  } catch (e) { next(e); }
};

exports.duplicateItinerary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orig = await prisma.itinerary.findUnique({
      where: { id },
      include: {
        days: true,
        routeMaps: true,
        inclusions: true,
        exclusions: true,
        notes: true
      }
    });

    if (!orig) return res.status(404).json({ success: false, message: 'Original itinerary not found' });

    // Check version count to increment
    const count = await prisma.itinerary.count({ where: { tripId: orig.tripId, name: orig.name } });

    const duplicated = await prisma.itinerary.create({
      data: {
        tripId: orig.tripId,
        name: `${orig.name} (Copy)`,
        isDefault: false,
        version: count + 1,
        days: {
          create: orig.days.map(d => ({
            dayNumber: d.dayNumber,
            dayDate: d.dayDate,
            plan: d.plan,
            stay: d.stay,
            meals: d.meals,
            transport: d.transport,
            distance: d.distance
          }))
        },
        routeMaps: {
          create: orig.routeMaps.map(rm => ({
            mapUrl: rm.mapUrl,
            description: rm.description
          }))
        },
        inclusions: {
          create: orig.inclusions.map(inc => ({
            text: inc.text
          }))
        },
        exclusions: {
          create: orig.exclusions.map(exc => ({
            text: exc.text
          }))
        },
        notes: {
          create: orig.notes.map(n => ({
            title: n.title,
            body: n.body
          }))
        }
      },
      include: {
        days: { orderBy: { dayNumber: 'asc' } },
        routeMaps: true,
        inclusions: true,
        exclusions: true,
        notes: true
      }
    });

    res.json({ success: true, data: duplicated });
  } catch (e) { next(e); }
};

exports.updateItinerary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, isDefault, version, days, routeMaps, inclusions, exclusions, notes } = req.body;

    const current = await prisma.itinerary.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ success: false, message: 'Itinerary not found' });

    if (isDefault && !current.isDefault) {
      await prisma.itinerary.updateMany({
        where: { tripId: current.tripId },
        data: { isDefault: false }
      });
    }

    // Replace children to simplify update logic
    if (days) {
      await prisma.itineraryDay.deleteMany({ where: { itineraryId: id } });
    }
    if (routeMaps) {
      await prisma.itineraryRouteMap.deleteMany({ where: { itineraryId: id } });
    }
    if (inclusions) {
      await prisma.itineraryInclusion.deleteMany({ where: { itineraryId: id } });
    }
    if (exclusions) {
      await prisma.itineraryExclusion.deleteMany({ where: { itineraryId: id } });
    }
    if (notes) {
      await prisma.itineraryNote.deleteMany({ where: { itineraryId: id } });
    }

    const updated = await prisma.itinerary.update({
      where: { id },
      data: {
        name,
        isDefault: isDefault !== undefined ? !!isDefault : undefined,
        version: version || undefined,
        days: days ? { create: days } : undefined,
        routeMaps: routeMaps ? { create: routeMaps } : undefined,
        inclusions: inclusions ? { create: inclusions } : undefined,
        exclusions: exclusions ? { create: exclusions } : undefined,
        notes: notes ? { create: notes } : undefined
      },
      include: {
        days: { orderBy: { dayNumber: 'asc' } },
        routeMaps: true,
        inclusions: true,
        exclusions: true,
        notes: true
      }
    });

    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
};

exports.deleteItinerary = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.itinerary.delete({ where: { id } });
    res.json({ success: true, message: 'Itinerary deleted successfully' });
  } catch (e) { next(e); }
};

exports.setDefaultItinerary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const it = await prisma.itinerary.findUnique({ where: { id } });
    if (!it) return res.status(404).json({ success: false, message: 'Itinerary not found' });

    await prisma.itinerary.updateMany({
      where: { tripId: it.tripId },
      data: { isDefault: false }
    });

    const updated = await prisma.itinerary.update({
      where: { id },
      data: { isDefault: true }
    });

    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
};


// ── TAB 4: TRIP SOPs ──
exports.getSops = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const sops = await prisma.tripSop.findMany({
      where: { tripId },
      include: { items: true, _count: { select: { items: true } } },
      orderBy: { category: 'asc' }
    });
    res.json({ success: true, data: sops });
  } catch (e) { next(e); }
};

exports.createSop = async (req, res, next) => {
  try {
    const { tripId, title, description, category, icon, items } = req.body;
    const sop = await prisma.tripSop.create({
      data: {
        tripId,
        title,
        description,
        category,
        icon,
        items: items ? {
          create: items.map(item => ({ title: item.title, content: item.content }))
        } : undefined
      },
      include: { items: true }
    });
    res.json({ success: true, data: sop });
  } catch (e) { next(e); }
};

exports.updateSop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, icon, items } = req.body;

    if (items) {
      await prisma.tripSopItem.deleteMany({ where: { sopId: id } });
    }

    const sop = await prisma.tripSop.update({
      where: { id },
      data: {
        title,
        description,
        category,
        icon,
        items: items ? {
          create: items.map(item => ({ title: item.title, content: item.content }))
        } : undefined
      },
      include: { items: true }
    });
    res.json({ success: true, data: sop });
  } catch (e) { next(e); }
};

exports.deleteSop = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.tripSop.delete({ where: { id } });
    res.json({ success: true, message: 'SOP deleted successfully' });
  } catch (e) { next(e); }
};


// ── TAB 5: DOCUMENTS ──
exports.getDocuments = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const docs = await prisma.tripDocument.findMany({
      where: { tripId },
      orderBy: { dateAdded: 'desc' }
    });
    // Compute category summary counts
    const summary = {};
    docs.forEach(d => { summary[d.category] = (summary[d.category] || 0) + 1; });
    res.json({ success: true, data: docs, summary });
  } catch (e) { next(e); }
};

exports.createDocument = async (req, res, next) => {
  try {
    const { tripId, name, category, fileType, size, addedBy, fileUrl } = req.body;
    const doc = await prisma.tripDocument.create({
      data: { tripId, name, category, fileType, size, addedBy, fileUrl }
    });
    res.json({ success: true, data: doc });
  } catch (e) { next(e); }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.tripDocument.delete({ where: { id } });
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (e) { next(e); }
};


// ── TAB 7: GALLERY ──
exports.getGallery = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const images = await prisma.tripGallery.findMany({
      where: { tripId },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ success: true, data: images });
  } catch (e) { next(e); }
};

exports.createGalleryItem = async (req, res, next) => {
  try {
    const { tripId, title, imageUrl } = req.body;
    const item = await prisma.tripGallery.create({
      data: { tripId, title, imageUrl }
    });
    res.json({ success: true, data: item });
  } catch (e) { next(e); }
};

exports.deleteGalleryItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.tripGallery.delete({ where: { id } });
    res.json({ success: true, message: 'Gallery item deleted successfully' });
  } catch (e) { next(e); }
};


// ── TAB 8: NOTES & UPDATES ──
exports.getNotes = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const notes = await prisma.tripNote.findMany({
      where: { tripId },
      orderBy: { createdAt: 'desc' }
    });
    const summary = {};
    notes.forEach(n => { summary[n.category] = (summary[n.category] || 0) + 1; });
    res.json({ success: true, data: notes, summary });
  } catch (e) { next(e); }
};

exports.createNote = async (req, res, next) => {
  try {
    const { tripId, title, content, category, linkUrl } = req.body;
    const note = await prisma.tripNote.create({
      data: { tripId, title, content, category, linkUrl }
    });
    res.json({ success: true, data: note });
  } catch (e) { next(e); }
};

exports.updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, category, linkUrl } = req.body;
    const note = await prisma.tripNote.update({
      where: { id },
      data: { title, content, category, linkUrl }
    });
    res.json({ success: true, data: note });
  } catch (e) { next(e); }
};

exports.deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.tripNote.delete({ where: { id } });
    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (e) { next(e); }
};
