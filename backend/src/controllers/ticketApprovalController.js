const { prisma } = require('../lib/prisma');
const { logBookingActivity } = require('../utils/bookingActivityLogger');

const APPROVER_ROLES = ['superadmin', 'admin', 'operations', 'BOOKING_VERIFIER'];
const ALLOWED_TICKET_TYPES = ['train', 'flight', 'bus'];

function canApprove(role) {
  return APPROVER_ROLES.includes(role);
}

const checkBookingAccess = async (bookingId, user) => {
  if (APPROVER_ROLES.includes(user.role)) return true;
  if (user.role === 'sales') {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId: user.tenantId }
    });
    if (!booking) return false;
    return booking.salesAdminId === user.id;
  }
  return false;
};

/**
 * POST /api/tickets/:bookingId/generate
 * Creates a TicketApproval row in "pending" status.
 */
exports.generateTicket = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { ticketType, ticketNumber, ticketFileUrl } = req.body;

    if (!ticketType || !ALLOWED_TICKET_TYPES.includes(ticketType)) {
      return res.status(400).json({ success: false, message: `ticketType must be one of: ${ALLOWED_TICKET_TYPES.join(', ')}` });
    }

    const canAccess = await checkBookingAccess(bookingId, req.user);
    if (!canAccess) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have access to this booking' });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if there's already a pending approval for this booking
    const existing = await prisma.ticketApproval.findFirst({
      where: { bookingId, status: 'pending' }
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A pending ticket approval already exists for this booking' });
    }

    const approval = await prisma.ticketApproval.create({
      data: {
        bookingId,
        ticketType,
        status: 'pending',
        ticketNumber: ticketNumber || null,
        ticketFileUrl: ticketFileUrl || null,
        requestedBy: req.user.id,
      },
      include: {
        booking: true,
        requestedByAdmin: { select: { id: true, name: true, role: true } }
      }
    });

    // Update booking trainTicketStatus if applicable
    await prisma.booking.update({
      where: { id: bookingId },
      data: { trainTicketStatus: 'PENDING' }
    });

    await logBookingActivity({
      bookingId,
      action: 'TICKET_GENERATED',
      details: `Ticket (${ticketType}) generated for approval by ${req.user.id}`,
      performedByAdminId: req.user.id
    });

    return res.status(201).json({ success: true, data: approval, message: 'Ticket generated and pending approval' });
  } catch (err) {
    console.error('generateTicket error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate ticket' });
  }
};

/**
 * GET /api/tickets/approvals
 * Returns ticket approvals with optional status filter.
 */
exports.getApprovals = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const ticketType = req.query.ticketType;
    const search = req.query.search;

    const where = { tenantId: req.user.tenantId };

    if (status !== 'all') where.status = status;
    if (ticketType) where.ticketType = ticketType;
    if (search) {
      where.OR = [
        { booking: { bookingId: { contains: search, mode: 'insensitive' } } },
        { booking: { tripName: { contains: search, mode: 'insensitive' } } },
        { booking: { name: { contains: search, mode: 'insensitive' } } },
        { booking: { fullName: { contains: search, mode: 'insensitive' } } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (req.user.role === 'sales') {
      where.booking = { salesAdminId: req.user.id };
    }

    // For TicketApproval, tenantId isn't on the model, so filter via booking relation
    const approvalWhere = { status: where.status };
    if (ticketType) approvalWhere.ticketType = ticketType;
    if (search) {
      approvalWhere.OR = [
        { booking: { bookingId: { contains: search, mode: 'insensitive' } } },
        { booking: { tripName: { contains: search, mode: 'insensitive' } } },
        { booking: { name: { contains: search, mode: 'insensitive' } } },
        { booking: { fullName: { contains: search, mode: 'insensitive' } } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (req.user.role === 'sales') {
      approvalWhere.booking = { salesAdminId: req.user.id };
    }

    const [totalCount, approvals] = await Promise.all([
      prisma.ticketApproval.count({ where: approvalWhere }),
      prisma.ticketApproval.findMany({
        where: approvalWhere,
        include: {
          booking: {
            select: {
              id: true,
              bookingId: true,
              name: true,
              fullName: true,
              tripName: true,
              departureDate: true,
              phone: true,
              email: true,
              numberOfTravelers: true,
              totalAmount: true,
              paymentStatus: true,
              salesAdminId: true,
            }
          },
          requestedByAdmin: { select: { id: true, name: true, role: true } },
          reviewedByAdmin: { select: { id: true, name: true, role: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return res.json({
      success: true,
      data: approvals,
      pagination: { page, limit, totalCount, totalPages: Math.max(1, Math.ceil(totalCount / limit)) }
    });
  } catch (err) {
    console.error('getApprovals error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch approvals' });
  }
};

/**
 * GET /api/tickets/approvals/stats
 * Returns pending count, approved today, rejected today.
 */
exports.getApprovalStats = async (req, res) => {
  try {
    const whereBase = {};
    if (req.user.role === 'sales') {
      whereBase.booking = { salesAdminId: req.user.id };
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [pendingCount, approvedToday, rejectedToday] = await Promise.all([
      prisma.ticketApproval.count({ where: { ...whereBase, status: 'pending' } }),
      prisma.ticketApproval.count({
        where: { ...whereBase, status: 'approved', reviewedAt: { gte: todayStart, lte: todayEnd } }
      }),
      prisma.ticketApproval.count({
        where: { ...whereBase, status: 'rejected', reviewedAt: { gte: todayStart, lte: todayEnd } }
      }),
    ]);

    return res.json({ success: true, data: { pendingCount, approvedToday, rejectedToday } });
  } catch (err) {
    console.error('getApprovalStats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

/**
 * GET /api/tickets/approvals/:id
 */
exports.getApprovalDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const approval = await prisma.ticketApproval.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            tripRef: { select: { id: true, title: true, slug: true } }
          }
        },
        requestedByAdmin: { select: { id: true, name: true, role: true } },
        reviewedByAdmin: { select: { id: true, name: true, role: true } },
      }
    });

    if (!approval) {
      return res.status(404).json({ success: false, message: 'Approval not found' });
    }

    return res.json({ success: true, data: approval });
  } catch (err) {
    console.error('getApprovalDetail error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch approval detail' });
  }
};

/**
 * POST /api/tickets/approvals/:id/approve
 */
exports.approveTicket = async (req, res) => {
  try {
    const { id } = req.params;

    if (!canApprove(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have approval rights' });
    }

    const approval = await prisma.ticketApproval.findUnique({
      where: { id },
      include: { booking: true }
    });

    if (!approval) {
      return res.status(404).json({ success: false, message: 'Approval not found' });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({ success: false, message: `This approval is already ${approval.status}` });
    }

    // Submitter cannot approve own ticket
    if (approval.requestedBy === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot approve your own ticket request' });
    }

    const updated = await prisma.ticketApproval.update({
      where: { id },
      data: {
        status: 'approved',
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      },
      include: {
        booking: true,
        requestedByAdmin: { select: { id: true, name: true } },
        reviewedByAdmin: { select: { id: true, name: true } },
      }
    });

    // Update booking ticket status to ISSUED
    await prisma.booking.update({
      where: { id: approval.bookingId },
      data: { trainTicketStatus: 'ISSUED' }
    });

    await logBookingActivity({
      bookingId: approval.bookingId,
      action: 'TICKET_APPROVED',
      details: `Ticket (${approval.ticketType}) approved by ${req.user.id}`,
      performedByAdminId: req.user.id
    });

    return res.json({ success: true, data: updated, message: 'Ticket approved' });
  } catch (err) {
    console.error('approveTicket error:', err);
    return res.status(500).json({ success: false, message: 'Failed to approve ticket' });
  }
};

/**
 * POST /api/tickets/approvals/:id/reject
 */
exports.rejectTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionNote } = req.body;

    if (!canApprove(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have approval rights' });
    }

    if (!rejectionNote || !rejectionNote.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection note is required' });
    }

    const approval = await prisma.ticketApproval.findUnique({
      where: { id },
      include: { booking: true }
    });

    if (!approval) {
      return res.status(404).json({ success: false, message: 'Approval not found' });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({ success: false, message: `This approval is already ${approval.status}` });
    }

    // Submitter cannot reject own ticket
    if (approval.requestedBy === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot reject your own ticket request' });
    }

    const updated = await prisma.ticketApproval.update({
      where: { id },
      data: {
        status: 'rejected',
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        rejectionNote,
      },
      include: {
        booking: true,
        requestedByAdmin: { select: { id: true, name: true } },
        reviewedByAdmin: { select: { id: true, name: true } },
      }
    });

    await logBookingActivity({
      bookingId: approval.bookingId,
      action: 'TICKET_REJECTED',
      details: `Ticket (${approval.ticketType}) rejected by ${req.user.id}: ${rejectionNote}`,
      performedByAdminId: req.user.id
    });

    return res.json({ success: true, data: updated, message: 'Ticket rejected' });
  } catch (err) {
    console.error('rejectTicket error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reject ticket' });
  }
};

/**
 * GET /api/tickets/approvals/pending-count
 * Lightweight endpoint for the dashboard widget.
 */
exports.getPendingCount = async (req, res) => {
  try {
    const where = { status: 'pending' };
    if (req.user.role === 'sales') {
      where.booking = { salesAdminId: req.user.id };
    }
    const count = await prisma.ticketApproval.count({ where });
    return res.json({ success: true, data: { pendingCount: count } });
  } catch (err) {
    console.error('getPendingCount error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get pending count' });
  }
};
