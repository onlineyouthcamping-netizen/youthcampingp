const { prisma } = require('../lib/prisma');
const { extractTextPageByPage } = require('../utils/documentParser');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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


// Helper to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// ── TAB 5: DOCUMENTS ──
exports.getDocuments = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const docs = await prisma.tripDocument.findMany({
      where: { tripId },
      orderBy: [{ version: 'desc' }, { dateAdded: 'desc' }]
    });

    // Compute category summary counts
    const summary = {};
    docs.forEach(d => {
      summary[d.category] = (summary[d.category] || 0) + 1;
    });

    res.json({ success: true, data: docs, summary });
  } catch (e) { next(e); }
};

exports.uploadDocuments = async (req, res, next) => {
  try {
    const { tripId, category, visibility, validFrom, validUntil } = req.body;
    const files = req.files || (req.file ? [req.file] : []);
    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const uploadedDocs = [];

    for (const file of files) {
      const fileName = file.originalname;
      const title = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
      
      // Determine version: if a doc with same name & tripId exists, increment version
      const existingDocs = await prisma.tripDocument.findMany({
        where: { tripId, name: fileName }
      });
      const nextVersion = existingDocs.length > 0 ? Math.max(...existingDocs.map(d => d.version)) + 1 : 1;

      // Create doc in DRAFT status
      const doc = await prisma.tripDocument.create({
        data: {
          tripId,
          name: fileName,
          category: category || 'Trip Documents',
          fileType: file.mimetype || 'application/octet-stream',
          size: formatBytes(file.size),
          addedBy: req.user.role || 'admin',
          fileUrl: `/uploads/${Date.now()}-${fileName}`, // mock upload URL
          title: title,
          version: nextVersion,
          visibility: visibility || 'internal',
          validFrom: validFrom ? new Date(validFrom) : null,
          validUntil: validUntil ? new Date(validUntil) : null,
          status: 'DRAFT',
          uploadedBy: req.user.id || 'system'
        }
      });

      // Extract page-by-page content
      const pages = await extractTextPageByPage(file.buffer, file.mimetype, fileName);

      // Save each page as a KnowledgeItem in DRAFT status
      for (const p of pages) {
        // Automatic category mapping
        let targetCategory = 'Trip Overview';
        const txt = p.text.toLowerCase();
        if (txt.includes('faq') || txt.includes('question') || txt.includes('answer')) targetCategory = 'Customer FAQs';
        else if (txt.includes('sales') || txt.includes('pitch') || txt.includes('usp')) targetCategory = 'Sales Guide';
        else if (txt.includes('include') || txt.includes('exclude')) targetCategory = 'Inclusions & Exclusions';
        else if (txt.includes('ticket') || txt.includes('train') || txt.includes('flight')) targetCategory = 'Ticketing Info';
        else if (txt.includes('visa') || txt.includes('entry') || txt.includes('passport')) targetCategory = 'Visa & Entry';
        else if (txt.includes('weather') || txt.includes('food') || txt.includes('culture')) targetCategory = 'Destination Guide';
        else if (txt.includes('pack') || txt.includes('clothes') || txt.includes('carry')) targetCategory = 'Packing Guide';
        else if (txt.includes('sop') || txt.includes('process') || txt.includes('workflow')) targetCategory = 'SOPs & Processes';
        else if (txt.includes('emergency') || txt.includes('hospital') || txt.includes('rescue')) targetCategory = 'Emergency Center';
        else if (txt.includes('price') || txt.includes('policy') || txt.includes('refund')) targetCategory = 'Pricing & Policy';
        else if (txt.includes('learning') || txt.includes('feedback') || txt.includes('past')) targetCategory = 'Past Learnings';

        await prisma.knowledgeItem.create({
          data: {
            tripId,
            documentId: doc.id,
            sourceDocName: fileName,
            pageNumber: p.pageNumber,
            title: `${title} - Page ${p.pageNumber}`,
            content: p.text || 'Empty page content',
            category: targetCategory,
            version: nextVersion,
            status: 'DRAFT'
          }
        });
      }

      uploadedDocs.push(doc);
    }

    res.json({ success: true, data: uploadedDocs });
  } catch (e) { next(e); }
};

exports.reviewDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, approvalDetails } = req.body; // DRAFT, UNDER_REVIEW, APPROVED, PUBLISHED, ARCHIVED
    
    const doc = await prisma.tripDocument.findUnique({ where: { id } });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    // Role checks
    const userRole = req.user.role;
    if (status === 'PUBLISHED' || status === 'APPROVED' || status === 'ARCHIVED') {
      if (userRole !== 'superadmin' && userRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Insufficient permission to approve/publish/archive documents' });
      }
    }

    // Update document status
    const updatedDoc = await prisma.tripDocument.update({
      where: { id },
      data: {
        status,
        approvalDetails: approvalDetails || undefined
      }
    });

    // Cascade status to knowledge items
    await prisma.knowledgeItem.updateMany({
      where: { documentId: id },
      data: {
        status: status === 'PUBLISHED' ? 'PUBLISHED' : (status === 'APPROVED' ? 'APPROVED' : 'DRAFT')
      }
    });

    // If publishing, archive older versions of same document title
    if (status === 'PUBLISHED') {
      const olderVersions = await prisma.tripDocument.findMany({
        where: {
          tripId: doc.tripId,
          name: doc.name,
          version: { lt: doc.version },
          status: 'PUBLISHED'
        }
      });

      for (const oldDoc of olderVersions) {
        await prisma.tripDocument.update({
          where: { id: oldDoc.id },
          data: { status: 'ARCHIVED' }
        });
        await prisma.knowledgeItem.updateMany({
          where: { documentId: oldDoc.id },
          data: { status: 'ARCHIVED' }
        });
      }
    }

    res.json({ success: true, data: updatedDoc });
  } catch (e) { next(e); }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can delete documents' });
    }
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


// ── KNOWLEDGE ITEMS ──
exports.getKnowledgeItems = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { category, search, status } = req.query;

    const where = { tripId };
    if (category) where.category = category;
    if (status) {
      where.status = status;
    } else {
      if (req.user.role === 'sales') {
        where.status = { in: ['APPROVED', 'PUBLISHED'] };
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const items = await prisma.knowledgeItem.findMany({
      where,
      orderBy: { pageNumber: 'asc' }
    });

    res.json({ success: true, data: items });
  } catch (e) { next(e); }
};

exports.updateKnowledgeItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, category, status } = req.body;

    if (req.user.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Salespeople have read-only access to knowledge content' });
    }

    const updated = await prisma.knowledgeItem.update({
      where: { id },
      data: { title, content, category, status }
    });

    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
};


// ── TRAVEL AI ──
exports.travelAiChat = async (req, res, next) => {
  try {
    const { tripId, message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    // Fetch approved/published knowledge items for this trip
    const items = await prisma.knowledgeItem.findMany({
      where: {
        tripId,
        status: { in: ['APPROVED', 'PUBLISHED'] }
      }
    });

    if (items.length === 0) {
      return res.json({
        success: true,
        answer: "I couldn't find any approved knowledge documents for this trip yet. Would you like to escalate this question to Senior Sales, Product, Operations or Ticketing?",
        answerUnavailable: true
      });
    }

    // Format context
    let contextText = '';
    items.forEach(item => {
      contextText += `Document: ${item.sourceDocName}, Page: ${item.pageNumber}\nCategory: ${item.category}\nContent:\n${item.content}\n==================\n`;
    });

    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ success: false, message: 'GEMINI_API_KEY not configured' });

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `You are Travel AI, an internal assistant for our travel guides and sales team.
Answer the user's question using ONLY the provided knowledge items context.
For every detail or statement you provide in your answer, you MUST append its source document and page number in brackets, for example: [SOP Guide, p. 2].
Strict Rules:
1. Never invent or assume any information that is not explicitly written in the context.
2. If the answer to the question cannot be determined from the context, respond exactly with: "ANSWER_UNAVAILABLE: I could not find information about this."
3. Do not include any greeting or conversational filler if you cannot answer.

Context:
${contextText}
`;

    const result = await model.generateContent(`${systemPrompt}\nUser Question: ${message}`);
    const text = result.response.text().trim();

    if (text.includes('ANSWER_UNAVAILABLE')) {
      return res.json({
        success: true,
        answer: "I couldn't find details in the approved documents for this trip. You can escalate this question using the button below.",
        answerUnavailable: true
      });
    }

    res.json({ success: true, answer: text });
  } catch (e) { next(e); }
};


// ── ESCALATED QUESTIONS ──
exports.getEscalatedQuestions = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const questions = await prisma.travelQuestion.findMany({
      where: { tripId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: questions });
  } catch (e) { next(e); }
};

exports.createEscalatedQuestion = async (req, res, next) => {
  try {
    const { tripId, question, escalatedTo } = req.body;
    const newQ = await prisma.travelQuestion.create({
      data: {
        tripId,
        question,
        escalatedTo: escalatedTo || 'Product',
        createdBy: req.user.role || 'sales',
        createdById: req.user.id,
        status: 'OPEN'
      }
    });
    res.json({ success: true, data: newQ });
  } catch (e) { next(e); }
};

exports.answerEscalatedQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answer, status } = req.body; // ANSWERED, PUBLISHED_AS_FAQ, CLOSED, KNOWLEDGE_UPDATE_REQUIRED

    if (req.user.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Salespeople cannot answer escalated questions' });
    }

    const currentQ = await prisma.travelQuestion.findUnique({ where: { id } });
    if (!currentQ) return res.status(404).json({ success: false, message: 'Question not found' });

    const updated = await prisma.travelQuestion.update({
      where: { id },
      data: {
        answer,
        status,
        assignedToId: req.user.id,
        assignedToName: req.user.role || 'admin'
      }
    });

    if (status === 'PUBLISHED_AS_FAQ') {
      await prisma.knowledgeItem.create({
        data: {
          tripId: currentQ.tripId,
          sourceDocName: 'Escalated Questions FAQ',
          pageNumber: 1,
          title: `FAQ: ${currentQ.question.substring(0, 45)}...`,
          content: `Question: ${currentQ.question}\nAnswer: ${answer}`,
          category: 'Customer FAQs',
          status: 'PUBLISHED'
        }
      });
    }

    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
};


// ── TRIP NOTICES & UPDATES ACKS ──
exports.acknowledgeNotice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userName = req.user.role || 'sales';

    const ack = await prisma.tripNoticeAck.upsert({
      where: {
        noticeId_userId: {
          noticeId: id,
          userId
        }
      },
      update: {},
      create: {
        noticeId: id,
        userId,
        userName
      }
    });

    res.json({ success: true, data: ack });
  } catch (e) { next(e); }
};

exports.getNoticeAcks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const acks = await prisma.tripNoticeAck.findMany({
      where: { noticeId: id },
      orderBy: { ackedAt: 'desc' }
    });
    res.json({ success: true, data: acks });
  } catch (e) { next(e); }
};


// ── INQUIRY, QUOTATION, BOOKING CREATIONS ──
exports.createSalesRecord = async (req, res, next) => {
  try {
    const { type, tripId, departureDate, joiningCity, price, passengerName, passengerPhone, passengerEmail } = req.body;
    const salesAdminId = req.user.id;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    let record;
    if (type === 'inquiry') {
      record = await prisma.inquiry.create({
        data: {
          name: passengerName,
          phone: passengerPhone || '0000000000',
          email: passengerEmail,
          tripId: tripId,
          tripTitle: trip.title,
          status: 'new',
          salesAdminId,
          adminNotes: `Created via Travel Desk. Preferred departure: ${departureDate || 'N/A'}`
        }
      });
    } else if (type === 'quotation') {
      record = await prisma.quotation.create({
        data: {
          title: `Quote for ${passengerName} - ${trip.title}`,
          clientName: passengerName,
          totalAmount: parseFloat(price) || trip.price,
          status: 'draft',
          salesAdminId,
          data: {
            tripId,
            joiningCity,
            departureDate
          }
        }
      });
    } else if (type === 'booking') {
      const bookingId = `BK-${Date.now().toString().slice(-6)}`;
      record = await prisma.booking.create({
        data: {
          bookingId,
          tripId,
          tripName: trip.title,
          status: 'pending',
          name: passengerName,
          phone: passengerPhone || '0000000000',
          email: passengerEmail,
          amount: parseFloat(price) || trip.price,
          totalAmount: parseFloat(price) || trip.price,
          remainingAmount: parseFloat(price) || trip.price,
          salesAdminId,
          departureDate: departureDate ? new Date(departureDate) : null,
          pickupCity: joiningCity
        }
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid sales record type' });
    }

    res.json({ success: true, data: record });
  } catch (e) { next(e); }
};

exports.bulkCreateTrips = async (req, res, next) => {
  try {
    const list = req.body.trips || [
      "Manali Kasol Amritsar Summer",
      "Manali Kasol Amritsar Winter",
      "Kashmir",
      "Kerala",
      "Spiti Valley Summer",
      "Winter Spiti"
    ];

    const results = [];
    for (const title of list) {
      const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const trip = await prisma.trip.upsert({
        where: { slug },
        update: {
          title,
          price: 15000,
          duration: "6 Days / 5 Nights",
          description: `${title} travel program and details.`,
          location: title,
          status: "published",
          isActive: true
        },
        create: {
          title,
          slug,
          price: 15000,
          duration: "6 Days / 5 Nights",
          description: `${title} travel program and details.`,
          location: title,
          status: "published",
          isActive: true
        }
      });
      results.push(trip);
    }

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    next(error);
  }
};

