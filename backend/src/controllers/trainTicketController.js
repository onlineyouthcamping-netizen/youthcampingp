const { prisma } = require('../lib/prisma');
const { Prisma } = require('@prisma/client');
const { logBookingActivity } = require('../utils/bookingActivityLogger');
const ticketCountCache = new Map();

// Helper to check ownership of booking for sales role
const checkBookingOwnership = async (bookingId, user) => {
  if (['superadmin', 'admin', 'operations', 'BOOKING_VERIFIER'].includes(user.role)) {
    return true;
  }
  if (user.role === 'sales') {
    const booking = await prisma.booking.findFirst({
      where: { bookingId, tenantId: user.tenantId }
    });
    if (!booking) return false;
    return booking.salesAdminId === user.id;
  }
  return false;
};

// Helper to check ownership of ticket for sales role
const checkTicketOwnership = async (ticketId, user) => {
  if (['superadmin', 'admin', 'operations', 'BOOKING_VERIFIER'].includes(user.role)) {
    return true;
  }
  if (user.role === 'sales') {
    const ticket = await prisma.trainTicket.findFirst({
      where: { id: ticketId, tenantId: user.tenantId },
      include: { booking: true }
    });
    if (!ticket) return false;
    return ticket.booking.salesAdminId === user.id;
  }
  return false;
};

// Helper to log ticket history
const logHistory = async (ticketId, action, req, extra = {}) => {
  const ticket = await prisma.trainTicket.findUnique({
    where: { id: ticketId },
    include: { booking: true }
  });
  await prisma.trainTicketHistory.create({
    data: {
      ticketId,
      action,
      fromStatus: extra.fromStatus || null,
      toStatus: extra.toStatus || ticket?.ticketStatus || null,
      fromApproval: extra.fromApproval || null,
      toApproval: extra.toApproval || ticket?.approvalStatus || null,
      notes: extra.notes || null,
      performedById: req.user.id
    }
  });

  if (ticket) {
    let details = `Train ticket for ${ticket.travelerName || 'unknown'}: ${action}`;
    if (extra.notes) details += ` (${extra.notes})`;
    await logBookingActivity({
      bookingId: ticket.booking?.id || ticket.bookingId,
      action: 'TRAIN_TICKET',
      details,
      performedByAdminId: req.user.id
    });
  }
};

/**
 * GET /api/train-tickets/booking/:bookingId
 */
exports.getTicketsByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const isOwner = await checkBookingOwnership(bookingId, req.user);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this booking' });
    }

    const tickets = await prisma.trainTicket.findMany({
      where: { bookingId, tenantId: req.user.tenantId },
      orderBy: { createdAt: 'asc' }
    });

    return res.json({ success: true, data: tickets });
  } catch (err) {
    console.error('getTicketsByBooking error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
  }
};

/**
 * GET /api/train-tickets/:ticketId/history
 * Loaded only when the existing ticket History control is opened.
 */
exports.getTicketHistory = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const isOwner = await checkTicketOwnership(ticketId, req.user);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this ticket' });
    }

    const history = await prisma.trainTicketHistory.findMany({
      where: { ticketId },
      select: {
        id: true,
        action: true,
        fromStatus: true,
        toStatus: true,
        fromApproval: true,
        toApproval: true,
        notes: true,
        createdAt: true,
        performedBy: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return res.json({ success: true, data: history });
  } catch (err) {
    console.error('getTicketHistory error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch ticket history' });
  }
};

/**
 * POST /api/train-tickets/booking/:bookingId
 */
exports.createTicket = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const isOwner = await checkBookingOwnership(bookingId, req.user);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this booking' });
    }

    const {
      travelerName, passengerReference, pnr, trainName, trainNumber,
      journeyDate, sourceStation, destinationStation, coach, seatNumber,
      berthType, ticketAmount, amountMode, internalNote, ticketBookingPerson
    } = req.body;

    if (!travelerName) {
      return res.status(400).json({ success: false, message: 'Traveler name is required' });
    }

    const ticket = await prisma.trainTicket.create({
      data: {
        tenantId: req.user.tenantId,
        bookingId,
        travelerName,
        passengerReference: passengerReference || null,
        pnr: pnr || null,
        trainName: trainName || null,
        trainNumber: trainNumber || null,
        journeyDate: journeyDate ? new Date(journeyDate) : null,
        sourceStation: sourceStation || null,
        destinationStation: destinationStation || null,
        coach: coach || null,
        seatNumber: seatNumber || null,
        berthType: berthType || null,
        ticketStatus: 'PENDING',
        approvalStatus: 'DRAFT',
        isLocked: false,
        ticketAmount: new Prisma.Decimal(ticketAmount || 0),
        amountMode: amountMode || null,
        refundAmount: new Prisma.Decimal(0),
        internalNote: internalNote || null,
        ticketBookingPerson: ticketBookingPerson || null
      }
    });

    await logHistory(ticket.id, 'CREATE', req);

    return res.status(201).json({ success: true, data: ticket, message: 'Ticket created successfully' });
  } catch (err) {
    console.error('createTicket error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create ticket' });
  }
};

/**
 * POST /api/train-tickets/booking/:bookingId/auto-generate
 * Auto-generates departure + return tickets for all passengers in a booking.
 * Reads passenger name/age/gender from booking.passengers JSON.
 * Reads train details from active templates matched to the booking's trip + departureDate.
 * Sales person only needs to fill PNR and status afterwards.
 */
exports.autoGenerateTickets = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const isOwner = await checkBookingOwnership(bookingId, req.user);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this booking' });
    }

    // Fetch the booking with passengers
    const booking = await prisma.booking.findFirst({
      where: { bookingId, tenantId: req.user.tenantId }
    });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Parse passengers list
    let passengers = [];
    if (booking.passengers && Array.isArray(booking.passengers)) {
      passengers = booking.passengers;
    } else {
      // Fallback to main booker
      passengers = [{
        name: booking.fullName || booking.name,
        age: booking.age,
        gender: booking.gender
      }];
    }

    if (passengers.length === 0) {
      return res.status(400).json({ success: false, message: 'No passengers found in this booking' });
    }

    // Check for already-existing tickets to avoid duplicates
    const existingTickets = await prisma.trainTicket.findMany({
      where: { bookingId, tenantId: req.user.tenantId },
      select: { travelerName: true, sourceStation: true, destinationStation: true }
    });
    const existingKey = (name, src, dst) => `${(name || '').trim().toLowerCase()}|${(src || '').toLowerCase()}|${(dst || '').toLowerCase()}`;
    const existingSet = new Set(existingTickets.map(t => existingKey(t.travelerName, t.sourceStation, t.destinationStation)));

    // Fetch active templates for this trip
    const templates = await prisma.trainTemplate.findMany({
      where: {
        tenantId: req.user.tenantId,
        isActive: true,
        ...(booking.tripId ? { tripId: booking.tripId } : {})
      },
      orderBy: { createdAt: 'asc' }
    });

    // Separate departure / return templates
    // Convention: if there are exactly 2 templates, first = departure, second = return
    // If there are more, use all of them. If zero, create tickets without train details.
    const createdTickets = [];
    const skippedCount = { value: 0 };

    for (const passenger of passengers) {
      const pName = (passenger.name || passenger.fullName || '').trim();
      if (!pName) continue;

      const pAge = passenger.age ? String(passenger.age) : null;
      const pGender = passenger.gender || null;
      const passengerRef = pAge && pGender ? `${pGender}, Age ${pAge}` : (pAge ? `Age ${pAge}` : (pGender || null));

      if (templates.length === 0) {
        // No templates — create 2 blank tickets (departure + return)
        for (const direction of ['DEPARTURE', 'RETURN']) {
          const key = existingKey(pName, direction === 'DEPARTURE' ? 'Departure' : 'Return', '');
          if (existingSet.has(key)) { skippedCount.value++; continue; }

          const ticket = await prisma.trainTicket.create({
            data: {
              tenantId: req.user.tenantId,
              bookingId,
              travelerName: pName,
              passengerReference: passengerRef,
              internalNote: `${direction} ticket — auto-generated`,
              ticketStatus: 'PENDING',
              approvalStatus: 'DRAFT',
              isLocked: false,
              ticketAmount: new Prisma.Decimal(0),
              refundAmount: new Prisma.Decimal(0),
            }
          });
          await logHistory(ticket.id, 'CREATE', req, { notes: `Auto-generated ${direction.toLowerCase()} ticket` });
          createdTickets.push(ticket);
          existingSet.add(key);
        }
      } else {
        // Create one ticket per template per passenger
        for (const tmpl of templates) {
          const key = existingKey(pName, tmpl.source, tmpl.destination);
          if (existingSet.has(key)) { skippedCount.value++; continue; }

          const ticket = await prisma.trainTicket.create({
            data: {
              tenantId: req.user.tenantId,
              bookingId,
              travelerName: pName,
              passengerReference: passengerRef,
              trainName: tmpl.trainName || null,
              trainNumber: tmpl.trainNumber || null,
              journeyDate: tmpl.journeyDate || null,
              sourceStation: tmpl.source || null,
              destinationStation: tmpl.destination || null,
              coach: tmpl.defaultCoach || null,
              berthType: tmpl.defaultClass || null,
              templateId: tmpl.id,
              ticketStatus: 'PENDING',
              approvalStatus: 'DRAFT',
              isLocked: false,
              ticketAmount: new Prisma.Decimal(0),
              refundAmount: new Prisma.Decimal(0),
              internalNote: `Auto-generated from template: ${tmpl.trainName || tmpl.trainNumber || 'Unknown'}`,
            }
          });
          await logHistory(ticket.id, 'CREATE', req, { notes: `Auto-generated from template ${tmpl.trainName || tmpl.trainNumber}` });
          createdTickets.push(ticket);
          existingSet.add(key);
        }
      }
    }

    return res.status(201).json({
      success: true,
      data: createdTickets,
      message: `${createdTickets.length} ticket(s) auto-generated` + (skippedCount.value > 0 ? ` (${skippedCount.value} duplicate(s) skipped)` : '')
    });
  } catch (err) {
    console.error('autoGenerateTickets error:', err);
    return res.status(500).json({ success: false, message: 'Failed to auto-generate tickets' });
  }
};

/**
 * PATCH /api/train-tickets/:ticketId
 */
exports.updateTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const isOwner = await checkTicketOwnership(ticketId, req.user);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this ticket' });
    }

    const ticket = await prisma.trainTicket.findUnique({
      where: { id: ticketId, tenantId: req.user.tenantId }
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (ticket.isLocked) {
      return res.status(400).json({ success: false, message: 'Locked: Approved tickets cannot be edited' });
    }

    const {
      travelerName, passengerReference, pnr, trainName, trainNumber,
      journeyDate, sourceStation, destinationStation, coach, seatNumber,
      berthType, ticketAmount, amountMode, internalNote, ticketBookingPerson,
      ticketStatus
    } = req.body;

    const updateData = {};
    if (travelerName !== undefined) updateData.travelerName = travelerName;
    if (passengerReference !== undefined) updateData.passengerReference = passengerReference;
    if (pnr !== undefined) updateData.pnr = pnr;
    if (trainName !== undefined) updateData.trainName = trainName;
    if (trainNumber !== undefined) updateData.trainNumber = trainNumber;
    if (journeyDate !== undefined) updateData.journeyDate = journeyDate ? new Date(journeyDate) : null;
    if (sourceStation !== undefined) updateData.sourceStation = sourceStation;
    if (destinationStation !== undefined) updateData.destinationStation = destinationStation;
    if (coach !== undefined) updateData.coach = coach;
    if (seatNumber !== undefined) updateData.seatNumber = seatNumber;
    if (berthType !== undefined) updateData.berthType = berthType;
    if (ticketAmount !== undefined) updateData.ticketAmount = new Prisma.Decimal(ticketAmount || 0);
    if (amountMode !== undefined) updateData.amountMode = amountMode;
    if (internalNote !== undefined) updateData.internalNote = internalNote;
    if (ticketBookingPerson !== undefined) updateData.ticketBookingPerson = ticketBookingPerson;
    if (ticketStatus !== undefined) updateData.ticketStatus = ticketStatus;

    const updated = await prisma.trainTicket.update({
      where: { id: ticketId },
      data: updateData
    });

    await logHistory(ticketId, 'EDIT', req, {
      fromStatus: ticket.ticketStatus,
      toStatus: updated.ticketStatus
    });

    return res.json({ success: true, data: updated, message: 'Ticket updated successfully' });
  } catch (err) {
    console.error('updateTicket error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update ticket' });
  }
};

/**
 * POST /api/train-tickets/:ticketId/submit
 */
exports.submitTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const isOwner = await checkTicketOwnership(ticketId, req.user);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const ticket = await prisma.trainTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (ticket.isLocked) {
      return res.status(400).json({ success: false, message: 'Locked: Approved tickets cannot be submitted' });
    }

    const updated = await prisma.trainTicket.update({
      where: { id: ticketId },
      data: {
        approvalStatus: 'SUBMITTED',
        submittedByAdminId: req.user.id
      }
    });

    await logHistory(ticketId, 'SUBMIT', req, {
      fromApproval: ticket.approvalStatus,
      toApproval: 'SUBMITTED'
    });

    return res.json({ success: true, data: updated, message: 'Ticket submitted for approval' });
  } catch (err) {
    console.error('submitTicket error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit ticket' });
  }
};

/**
 * POST /api/train-tickets/:ticketId/approve
 */
exports.approveTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const isOwner = await checkTicketOwnership(ticketId, req.user);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Sales cannot approve
    if (req.user.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Forbidden: Sales role cannot approve tickets' });
    }

    const ticket = await prisma.trainTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Submitter cannot approve own ticket
    if (ticket.submittedByAdminId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Double Approver Violation: Submitter cannot approve their own ticket' });
    }

    const updated = await prisma.trainTicket.update({
      where: { id: ticketId },
      data: {
        approvalStatus: 'APPROVED',
        isLocked: true
      }
    });

    await logHistory(ticketId, 'APPROVE', req, {
      fromApproval: ticket.approvalStatus,
      toApproval: 'APPROVED'
    });

    return res.json({ success: true, data: updated, message: 'Ticket approved and locked' });
  } catch (err) {
    console.error('approveTicket error:', err);
    return res.status(500).json({ success: false, message: 'Failed to approve ticket' });
  }
};

/**
 * POST /api/train-tickets/:ticketId/reject
 */
exports.rejectTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const isOwner = await checkTicketOwnership(ticketId, req.user);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Sales cannot reject
    if (req.user.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Forbidden: Sales role cannot reject tickets' });
    }

    const ticket = await prisma.trainTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Submitter cannot reject own ticket
    if (ticket.submittedByAdminId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Double Approver Violation: Submitter cannot reject their own ticket' });
    }

    const updated = await prisma.trainTicket.update({
      where: { id: ticketId },
      data: {
        approvalStatus: 'REJECTED'
      }
    });

    await logHistory(ticketId, 'REJECT', req, {
      fromApproval: ticket.approvalStatus,
      toApproval: 'REJECTED',
      notes: req.body.notes || null
    });

    return res.json({ success: true, data: updated, message: 'Ticket rejected' });
  } catch (err) {
    console.error('rejectTicket error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reject ticket' });
  }
};

/**
 * POST /api/train-tickets/:ticketId/reopen
 */
exports.reopenTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Reopen requires a mandatory reason' });
    }

    const isOwner = await checkTicketOwnership(ticketId, req.user);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Sales cannot reopen
    if (req.user.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Forbidden: Sales role cannot reopen tickets' });
    }

    const ticket = await prisma.trainTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const updated = await prisma.trainTicket.update({
      where: { id: ticketId },
      data: {
        approvalStatus: 'REOPENED',
        isLocked: false,
        reopenReason: reason
      }
    });

    await logHistory(ticketId, 'REOPEN', req, {
      fromApproval: ticket.approvalStatus,
      toApproval: 'REOPENED',
      notes: reason
    });

    return res.json({ success: true, data: updated, message: 'Ticket reopened successfully' });
  } catch (err) {
    console.error('reopenTicket error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reopen ticket' });
  }
};

/**
 * POST /api/train-tickets/:ticketId/cancel
 */
exports.cancelTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { reason, refundAmount } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Cancel requires a cancellation reason' });
    }

    const isOwner = await checkTicketOwnership(ticketId, req.user);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const ticket = await prisma.trainTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Cancelled ticket is never deleted
    const updated = await prisma.trainTicket.update({
      where: { id: ticketId },
      data: {
        ticketStatus: 'CANCELLED',
        cancellationReason: reason,
        refundAmount: new Prisma.Decimal(refundAmount !== undefined ? refundAmount : 0)
      }
    });

    await logHistory(ticketId, 'CANCEL', req, {
      fromStatus: ticket.ticketStatus,
      toStatus: 'CANCELLED',
      notes: reason
    });

    return res.json({ success: true, data: updated, message: 'Ticket cancelled successfully' });
  } catch (err) {
    console.error('cancelTicket error:', err);
    return res.status(500).json({ success: false, message: 'Failed to cancel ticket' });
  }
};

/**
 * POST /api/train-tickets/:ticketId/rebook
 */
exports.rebookTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const isOwner = await checkTicketOwnership(ticketId, req.user);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const oldTicket = await prisma.trainTicket.findUnique({ where: { id: ticketId } });
    if (!oldTicket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Rebook creates a new ticket row
    const newTicket = await prisma.trainTicket.create({
      data: {
        tenantId: req.user.tenantId,
        bookingId: oldTicket.bookingId,
        travelerName: oldTicket.travelerName,
        passengerReference: oldTicket.passengerReference,
        pnr: null, // Reset details for rebooking
        trainName: oldTicket.trainName,
        trainNumber: oldTicket.trainNumber,
        journeyDate: oldTicket.journeyDate,
        sourceStation: oldTicket.sourceStation,
        destinationStation: oldTicket.destinationStation,
        coach: null,
        seatNumber: null,
        berthType: null,
        ticketStatus: 'PENDING',
        approvalStatus: 'DRAFT',
        isLocked: false,
        ticketAmount: oldTicket.ticketAmount,
        amountMode: oldTicket.amountMode,
        refundAmount: new Prisma.Decimal(0),
        supersedesTicketId: oldTicket.id
      }
    });

    // Link old ticket to new ticket
    await prisma.trainTicket.update({
      where: { id: oldTicket.id },
      data: {
        supersededByTicketId: newTicket.id
      }
    });

    await logHistory(oldTicket.id, 'REBOOKED', req, { notes: `Superseded by ticket: ${newTicket.id}` });
    await logHistory(newTicket.id, 'CREATE', req, { notes: `Supersedes ticket: ${oldTicket.id}` });

    return res.status(201).json({
      success: true,
      data: {
        oldTicketId: oldTicket.id,
        newTicket
      },
      message: 'Ticket rebooked successfully'
    });
  } catch (err) {
    console.error('rebookTicket error:', err);
    return res.status(500).json({ success: false, message: 'Failed to rebook ticket' });
  }
};

/**
 * POST /api/train-tickets/bulk-update
 */
exports.bulkUpdateTickets = async (req, res) => {
  try {
    const { ticketIds = [], status, trainNumber, journeyDate, pnr, coach, seatNumber, berthType, notes } = req.body;

    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({ success: false, message: 'ticketIds is required and must not be empty' });
    }

    const uniqueTicketIds = [...new Set(ticketIds)];
    const eligibleWhere = {
      id: { in: uniqueTicketIds },
      tenantId: req.user.tenantId,
      isLocked: false
    };
    if (req.user.role === 'sales') {
      eligibleWhere.booking = { salesAdminId: req.user.id };
    } else if (!['superadmin', 'admin', 'operations', 'BOOKING_VERIFIER'].includes(req.user.role)) {
      return res.json({ success: true, data: { updatedCount: 0, tickets: [] }, message: '0 tickets updated successfully' });
    }

    const eligibleTickets = await prisma.trainTicket.findMany({
      where: eligibleWhere,
      select: { id: true, ticketStatus: true, approvalStatus: true, bookingId: true, travelerName: true }
    });
    const eligibleIds = eligibleTickets.map((ticket) => ticket.id);

    const updateData = {};
    if (status !== undefined) updateData.ticketStatus = status;
    if (trainNumber !== undefined) updateData.trainNumber = trainNumber;
    if (journeyDate !== undefined) updateData.journeyDate = journeyDate ? new Date(journeyDate) : null;
    if (pnr !== undefined) updateData.pnr = pnr;
    if (coach !== undefined) updateData.coach = coach;
    if (seatNumber !== undefined) updateData.seatNumber = seatNumber;
    if (berthType !== undefined) updateData.berthType = berthType;

    let updatedTickets = [];
    if (eligibleIds.length > 0) {
      updatedTickets = await prisma.$transaction(async (tx) => {
        await tx.trainTicket.updateMany({ where: { id: { in: eligibleIds } }, data: updateData });
        await tx.trainTicketHistory.createMany({
          data: eligibleTickets.map((ticket) => ({
            ticketId: ticket.id,
            action: 'BULK_UPDATE',
            fromStatus: ticket.ticketStatus,
            toStatus: status || ticket.ticketStatus,
            toApproval: ticket.approvalStatus,
            notes: notes || 'Bulk updated fields',
            performedById: req.user.id
          }))
        });
        return tx.trainTicket.findMany({ where: { id: { in: eligibleIds } } });
      });

      // Log to Booking Activity Log
      const bookingsAffected = [...new Set(eligibleTickets.map((t) => t.bookingId))];
      const dbBookings = await prisma.booking.findMany({
        where: { bookingId: { in: bookingsAffected }, tenantId: req.user.tenantId },
        select: { id: true, bookingId: true }
      });
      const bMap = new Map(dbBookings.map(b => [b.bookingId, b.id]));

      for (const bId of bookingsAffected) {
        const tNames = eligibleTickets.filter((t) => t.bookingId === bId).map((t) => t.travelerName).join(', ');
        const cuid = bMap.get(bId);
        if (cuid) {
          await logBookingActivity({
            bookingId: cuid,
            action: 'TRAIN_TICKET',
            details: `Bulk updated train tickets for passengers: ${tNames} (${notes || 'Bulk updated fields'})`,
            performedByAdminId: req.user.id
          });
        }
      }

      const inputOrder = new Map(uniqueTicketIds.map((id, index) => [id, index]));
      updatedTickets.sort((a, b) => inputOrder.get(a.id) - inputOrder.get(b.id));
    }

    return res.json({
      success: true,
      data: {
        updatedCount: updatedTickets.length,
        tickets: updatedTickets
      },
      message: `${updatedTickets.length} tickets updated successfully`
    });
  } catch (err) {
    console.error('bulkUpdateTickets error:', err);
    return res.status(500).json({ success: false, message: 'Failed to bulk update tickets' });
  }
};

/**
 * GET /api/train-tickets/approvals
 */
exports.getApprovalsQueue = async (req, res) => {
  const start = Date.now();
  try {
    const authStart = Date.now();
    const role = req.user.role;
    const userId = req.user.id;
    const authDuration = Date.now() - authStart;

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = [25, 50, 100].includes(requestedLimit) ? requestedLimit : 25;
    const where = {
      tenantId: req.user.tenantId,
      approvalStatus: req.query.approvalStatus && req.query.approvalStatus !== 'ALL'
        ? req.query.approvalStatus
        : 'SUBMITTED'
    };

    if (req.query.ticketStatus && req.query.ticketStatus !== 'ALL') {
      where.ticketStatus = req.query.ticketStatus;
    }
    if (req.query.urgent === 'true') {
      where.journeyDate = { gte: new Date(), lte: new Date(Date.now() + 10 * 86400000) };
      where.ticketStatus = { in: ['PENDING', 'WAITLISTED', 'RAC'] };
    }
    if (req.query.search) {
      where.OR = [
        { travelerName: { contains: req.query.search, mode: 'insensitive' } },
        { trainName: { contains: req.query.search, mode: 'insensitive' } },
        { trainNumber: { contains: req.query.search, mode: 'insensitive' } },
        { booking: { bookingId: { contains: req.query.search, mode: 'insensitive' } } },
        { booking: { tripName: { contains: req.query.search, mode: 'insensitive' } } },
      ];
    }

    // Sales can only view their own booking tickets
    if (role === 'sales') {
      where.booking = { salesAdminId: userId };
    }

    const cacheKey = `ticket_count_${JSON.stringify(where)}`;
    let totalPromise;
    const cachedCount = ticketCountCache.get(cacheKey);
    if (cachedCount && Date.now() < cachedCount.expiresAt) {
      totalPromise = Promise.resolve(cachedCount.count);
    } else {
      totalPromise = prisma.trainTicket.count({ where }).then(c => {
        ticketCountCache.set(cacheKey, { count: c, expiresAt: Date.now() + 30000 });
        return c;
      });
    }

    const queryStart = Date.now();
    const [totalCount, tickets] = await Promise.all([
      totalPromise,
      prisma.trainTicket.findMany({
        where,
        select: {
          id: true,
          travelerName: true,
          ticketStatus: true,
          approvalStatus: true,
          trainName: true,
          trainNumber: true,
          journeyDate: true,
          sourceStation: true,
          destinationStation: true,
          submittedByAdminId: true,
          updatedAt: true,
          createdAt: true,
          booking: {
            select: {
              bookingId: true,
              name: true,
              fullName: true,
              tripName: true,
              salesAdminId: true
            }
          },
          submittedBy: { select: { id: true, name: true } }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),
    ]);
    const queryDuration = Date.now() - queryStart;

    const resBody = {
      success: true,
      data: tickets,
      pagination: { page, limit, totalCount, totalPages: Math.max(1, Math.ceil(totalCount / limit)) },
    };

    if (process.env.ENABLE_PERFORMANCE_METRICS === 'true') {
      const duration = Date.now() - start;
      const payloadBytes = Buffer.byteLength(JSON.stringify(resBody));
      console.log(`[METRICS] getApprovalsQueue - Total: ${duration}ms, Auth: ${authDuration}ms, Query: ${queryDuration}ms, Rows: ${tickets.length}, Payload: ${payloadBytes} bytes`);
    }

    return res.json(resBody);
  } catch (err) {
    console.error('getApprovalsQueue error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch approvals queue' });
  }
};

/**
 * GET /api/train-tickets/alerts
 */
exports.getAlerts = async (req, res) => {
  try {
    // Run alert scanner logic before serving
    await runAlertScanner(req.user.tenantId);

    const where = { tenantId: req.user.tenantId };
    if (req.user.role === 'sales') {
      where.bookingId = {
        in: await prisma.booking.findMany({
          where: { salesAdminId: req.user.id },
          select: { bookingId: true }
        }).then(list => list.map(b => b.bookingId))
      };
    }

    const alerts = await prisma.trainTicketAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: alerts });
  } catch (err) {
    console.error('getAlerts error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
  }
};
// Alert scanner logic
async function runAlertScanner(tenantId) {
  try {
    const now = new Date();

    // 1. Pending for 2 days
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const pendingTickets = await prisma.trainTicket.findMany({
      where: {
        tenantId,
        ticketStatus: 'PENDING',
        createdAt: { lte: twoDaysAgo }
      },
      include: { booking: true }
    });

    for (const ticket of pendingTickets) {
      const dedupeKey = `${ticket.id}`;
      // Check if dedupe record already exists
      const existing = await prisma.trainTicketAlert.findUnique({
        where: {
          alertType_dedupeKey: {
            alertType: 'PENDING_2_DAYS',
            dedupeKey
          }
        }
      });

      if (!existing) {
        await prisma.trainTicketAlert.create({
          data: {
            tenantId,
            alertType: 'PENDING_2_DAYS',
            dedupeKey,
            bookingId: ticket.bookingId,
            ticketId: ticket.id
          }
        });
        console.log(`Alert created: PENDING_2_DAYS for ticket ${ticket.id}`);
      }
    }

    // 2. Urgent within 10 days
    const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const urgentTickets = await prisma.trainTicket.findMany({
      where: {
        tenantId,
        ticketStatus: { in: ['PENDING', 'WAITLISTED', 'RAC'] },
        journeyDate: { gte: now, lte: tenDaysFromNow }
      }
    });

    for (const ticket of urgentTickets) {
      const dedupeKey = `${ticket.id}`;
      const existing = await prisma.trainTicketAlert.findUnique({
        where: {
          alertType_dedupeKey: {
            alertType: 'URGENT_10_DAYS',
            dedupeKey
          }
        }
      });

      if (!existing) {
        await prisma.trainTicketAlert.create({
          data: {
            tenantId,
            alertType: 'URGENT_10_DAYS',
            dedupeKey,
            bookingId: ticket.bookingId,
            ticketId: ticket.id
          }
        });
        console.log(`Alert created: URGENT_10_DAYS for ticket ${ticket.id}`);
      }
    }
  } catch (err) {
    console.error('runAlertScanner error:', err);
  }
}

/**
 * Train Templates Management CRUD
 */
exports.getTemplates = async (req, res) => {
  try {
    const templates = await prisma.trainTemplate.findMany({
      where: { tenantId: req.user.tenantId },
      include: { trip: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: templates });
  } catch (err) {
    console.error('getTemplates error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch templates' });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const {
      tripId, tripTitle, departureDate, trainName, trainNumber,
      source, destination, defaultClass, defaultCoach, journeyDate,
      boardingPoint, droppingPoint, waitlistDisclaimer, isActive
    } = req.body;

    const template = await prisma.trainTemplate.create({
      data: {
        tenantId: req.user.tenantId,
        tripId: tripId || null,
        tripTitle: tripTitle || null,
        departureDate: departureDate ? new Date(departureDate) : null,
        trainName: trainName || null,
        trainNumber: trainNumber || null,
        source: source || null,
        destination: destination || null,
        defaultClass: defaultClass || null,
        defaultCoach: defaultCoach || null,
        journeyDate: journeyDate ? new Date(journeyDate) : null,
        boardingPoint: boardingPoint || null,
        droppingPoint: droppingPoint || null,
        waitlistDisclaimer: waitlistDisclaimer || null,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return res.status(201).json({ success: true, data: template, message: 'Template created successfully' });
  } catch (err) {
    console.error('createTemplate error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create template' });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tripId, tripTitle, departureDate, trainName, trainNumber,
      source, destination, defaultClass, defaultCoach, journeyDate,
      boardingPoint, droppingPoint, waitlistDisclaimer, isActive
    } = req.body;

    const template = await prisma.trainTemplate.findFirst({
      where: { id, tenantId: req.user.tenantId }
    });

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const updated = await prisma.trainTemplate.update({
      where: { id },
      data: {
        tripId: tripId !== undefined ? tripId : template.tripId,
        tripTitle: tripTitle !== undefined ? tripTitle : template.tripTitle,
        departureDate: departureDate !== undefined ? (departureDate ? new Date(departureDate) : null) : template.departureDate,
        trainName: trainName !== undefined ? trainName : template.trainName,
        trainNumber: trainNumber !== undefined ? trainNumber : template.trainNumber,
        source: source !== undefined ? source : template.source,
        destination: destination !== undefined ? destination : template.destination,
        defaultClass: defaultClass !== undefined ? defaultClass : template.defaultClass,
        defaultCoach: defaultCoach !== undefined ? defaultCoach : template.defaultCoach,
        journeyDate: journeyDate !== undefined ? (journeyDate ? new Date(journeyDate) : null) : template.journeyDate,
        boardingPoint: boardingPoint !== undefined ? boardingPoint : template.boardingPoint,
        droppingPoint: droppingPoint !== undefined ? droppingPoint : template.droppingPoint,
        waitlistDisclaimer: waitlistDisclaimer !== undefined ? waitlistDisclaimer : template.waitlistDisclaimer,
        isActive: isActive !== undefined ? isActive : template.isActive
      }
    });

    return res.json({ success: true, data: updated, message: 'Template updated successfully' });
  } catch (err) {
    console.error('updateTemplate error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update template' });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await prisma.trainTemplate.findFirst({
      where: { id, tenantId: req.user.tenantId }
    });

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    await prisma.trainTemplate.delete({ where: { id } });

    return res.json({ success: true, message: 'Template deleted successfully' });
  } catch (err) {
    console.error('deleteTemplate error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete template' });
  }
};
