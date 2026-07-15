const { prisma } = require('../lib/prisma');
const { normalizeDepartureDateIndia } = require('./opsController');

// Helper to construct departure filter
async function parseDepartureFilter(req, res, requireDepartureDate = true) {
  const { tripId: rawTripId } = req.params;
  const rawDate = req.query.departureDate || req.body.departureDate;

  if (requireDepartureDate && !rawDate) {
    res.status(400).json({ success: false, message: 'departureDate is required for departure operations' });
    return null;
  }

  const departureDate = normalizeDepartureDateIndia(rawDate);
  if (requireDepartureDate && (!departureDate || isNaN(departureDate.getTime()))) {
    res.status(400).json({ success: false, message: 'Invalid departureDate format' });
    return null;
  }

  const tenantId = req.user?.tenantId || 'default';

  if (!rawTripId || rawTripId === 'undefined') {
    res.status(400).json({ success: false, message: 'tripId is required and must be valid' });
    return null;
  }

  let tripId = rawTripId;
  if (rawTripId) {
    const trip = await prisma.trip.findFirst({
      where: {
        tenantId,
        OR: [
          { id: rawTripId },
          { slug: rawTripId },
          { shortName: rawTripId }
        ]
      },
      select: { id: true }
    });
    if (trip) tripId = trip.id;
  }

  const where = { tenantId, tripId };
  if (departureDate) where.departureDate = departureDate;

  return { tenantId, tripId, departureDate, where };
}

// ── TASKS ENDPOINTS ──
exports.getChecklistTasks = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    const tasks = await prisma.opsTripChecklist.findMany({
      where: ctx.where,
      orderBy: { id: 'asc' }
    });

    return res.json({ success: true, data: tasks });
  } catch (err) {
    console.error('getChecklistTasks error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
};

exports.createChecklistTask = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    const { taskName, stage, notes, assignedTo, priority, dueDate, status, remarks } = req.body;
    if (!taskName || !stage) {
      return res.status(400).json({ success: false, message: 'taskName and stage are required' });
    }

    const task = await prisma.opsTripChecklist.create({
      data: {
        tenantId: ctx.tenantId,
        tripId: ctx.tripId,
        departureDate: ctx.departureDate,
        stage,
        taskName,
        notes: notes || null,
        assignedTo: assignedTo || null,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'Pending',
        remarks: remarks || null,
        isCompleted: status === 'Completed'
      }
    });

    return res.status(201).json({ success: true, data: task });
  } catch (err) {
    console.error('createChecklistTask error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create task' });
  }
};

exports.updateChecklistTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { taskName, stage, notes, assignedTo, priority, dueDate, status, remarks, isCompleted } = req.body;

    const existing = await prisma.opsTripChecklist.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const completed = isCompleted !== undefined ? isCompleted : (status === 'Completed');

    const task = await prisma.opsTripChecklist.update({
      where: { id },
      data: {
        taskName: taskName !== undefined ? taskName : undefined,
        stage: stage !== undefined ? stage : undefined,
        notes: notes !== undefined ? notes : undefined,
        assignedTo: assignedTo !== undefined ? assignedTo : undefined,
        priority: priority !== undefined ? priority : undefined,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
        status: status !== undefined ? status : undefined,
        remarks: remarks !== undefined ? remarks : undefined,
        isCompleted: completed,
        completedAt: completed ? new Date() : null,
        completedById: completed ? (req.user?.id || null) : null
      }
    });

    return res.json({ success: true, data: task });
  } catch (err) {
    console.error('updateChecklistTask error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update task' });
  }
};

exports.deleteChecklistTask = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.opsTripChecklist.delete({ where: { id } });
    return res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    console.error('deleteChecklistTask error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
};

// ── DOCUMENTS ENDPOINTS ──
exports.getOpsDocuments = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    const docs = await prisma.opsDocument.findMany({
      where: ctx.where,
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: docs });
  } catch (err) {
    console.error('getOpsDocuments error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
};

exports.createOpsDocument = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    const { category, originalFileName, fileUrl, fileSize, remarks } = req.body;
    if (!category || !originalFileName || !fileUrl) {
      return res.status(400).json({ success: false, message: 'category, originalFileName, and fileUrl are required' });
    }

    const doc = await prisma.opsDocument.create({
      data: {
        tenantId: ctx.tenantId,
        tripId: ctx.tripId,
        departureDate: ctx.departureDate,
        category,
        uploadedById: req.user.id,
        originalFileName,
        fileUrl,
        fileSize: Number(fileSize) || 0,
        remarks: remarks || null,
        verificationStatus: 'Pending'
      }
    });

    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error('createOpsDocument error:', err);
    return res.status(500).json({ success: false, message: 'Failed to save document' });
  }
};

exports.verifyOpsDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const doc = await prisma.opsDocument.update({
      where: { id },
      data: {
        verificationStatus: status,
        remarks: remarks !== undefined ? remarks : undefined
      }
    });

    return res.json({ success: true, data: doc });
  } catch (err) {
    console.error('verifyOpsDocument error:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify document' });
  }
};

exports.deleteOpsDocument = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.opsDocument.delete({ where: { id } });
    return res.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    console.error('deleteOpsDocument error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
};

// ── COMMUNICATION ENDPOINTS ──
exports.getOpsMessages = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    const messages = await prisma.opsMessage.findMany({
      where: ctx.where,
      orderBy: { createdAt: 'asc' }
    });

    return res.json({ success: true, data: messages });
  } catch (err) {
    console.error('getOpsMessages error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

exports.createOpsMessage = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    const { messageType, content, attachments, recipients } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'content is required' });
    }

    const message = await prisma.opsMessage.create({
      data: {
        tenantId: ctx.tenantId,
        tripId: ctx.tripId,
        departureDate: ctx.departureDate,
        senderType: 'STAFF',
        senderId: req.user.id,
        senderName: req.user.name || 'Operations Staff',
        messageType: messageType || 'GROUP',
        content,
        attachments: attachments || null,
        recipients: recipients || null
      }
    });

    return res.status(201).json({ success: true, data: message });
  } catch (err) {
    console.error('createOpsMessage error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

// ── REPORTS ENDPOINT ──
exports.getOpsReportData = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    // A. Passengers List
    const startOfDay = new Date(ctx.departureDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(ctx.departureDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        tenantId: ctx.tenantId,
        tripId: ctx.tripId,
        departureDate: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['cancelled', 'rejected'] }
      },
      orderBy: { createdAt: 'asc' }
    });

    // B. Client Receivables
    const clientPayments = await prisma.opsClientPayment.findMany({
      where: {
        tenantId: ctx.tenantId,
        booking: {
          tripId: ctx.tripId,
          departureDate: { gte: startOfDay, lte: endOfDay }
        }
      },
      orderBy: { paymentDate: 'asc' }
    });

    // C. Vendor Payments
    const vendorPayments = await prisma.opsVendorPayment.findMany({
      where: {
        tenantId: ctx.tenantId,
        tripId: ctx.tripId,
        departureDate: ctx.departureDate
      },
      orderBy: { createdAt: 'asc' }
    });

    // D. Itineraries & Hotels & Transport
    const itineraries = await prisma.opsDayItinerary.findMany({
      where: ctx.where,
      orderBy: { dayTitle: 'asc' }
    });

    const hotels = await prisma.opsHotelBooking.findMany({
      where: ctx.where,
      orderBy: { createdAt: 'asc' }
    });

    const transports = await prisma.opsTransportFleet.findMany({
      where: ctx.where,
      orderBy: { createdAt: 'asc' }
    });

    const guides = await prisma.opsGuidePayment.findMany({
      where: ctx.where,
      orderBy: { createdAt: 'asc' }
    });

    const activities = await prisma.opsActivity.findMany({
      where: ctx.where,
      orderBy: { dayNumber: 'asc' }
    });

    const docs = await prisma.opsDocument.findMany({
      where: ctx.where,
      orderBy: { createdAt: 'asc' }
    });

    const tasks = await prisma.opsTripChecklist.findMany({
      where: ctx.where,
      orderBy: { id: 'asc' }
    });

    return res.json({
      success: true,
      data: {
        bookings,
        clientPayments,
        vendorPayments,
        itineraries,
        hotels,
        transports,
        guides,
        activities,
        docs,
        tasks
      }
    });
  } catch (err) {
    console.error('getOpsReportData error:', err);
    return res.status(500).json({ success: false, message: 'Failed to compile report data' });
  }
};
