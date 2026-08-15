const { prisma } = require("../lib/prisma");
const { logAction } = require("../utils/auditLogger");

/**
 * GET /api/finance/tickets/search
 * Multi-criteria search across PNR, booking ID, passenger name, provider, and journey date.
 */
async function searchTickets(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const { pnr, query, bookingId, type, status, page = 1, limit = 25 } = req.query;

    const where = { tenantId };
    if (pnr) {
      where.pnr = { contains: pnr.trim(), mode: "insensitive" };
    }
    if (bookingId) {
      where.OR = [{ bookingId }, { booking: { bookingId } }];
    }
    if (type && type !== "ALL") {
      where.type = type;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (query) {
      where.OR = [
        { pnr: { contains: query.trim(), mode: "insensitive" } },
        { ticketNumber: { contains: query.trim(), mode: "insensitive" } },
        { provider: { contains: query.trim(), mode: "insensitive" } },
        { source: { contains: query.trim(), mode: "insensitive" } },
        { destination: { contains: query.trim(), mode: "insensitive" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          booking: {
            select: {
              bookingId: true,
              fullName: true,
              name: true,
              phone: true,
              tripName: true,
              departureDate: true,
            },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          verifiedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (error) {
    console.error("❌ Error searching tickets:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to search tickets" });
  }
}

/**
 * POST /api/finance/tickets
 * Ingest or record a ticket in the Finance Repository.
 */
async function createTicket(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const createdById = req.user?.id || req.admin?.id;
    const {
      bookingId,
      type = "TRAIN",
      pnr,
      ticketNumber,
      passengers,
      documentUrl,
      provider,
      journeyDate,
      arrivalDate,
      source,
      destination,
      cost = 0,
      packageAllowance,
      notes,
      confirmationEmail,
    } = req.body;

    let linkedBookingId = null;
    if (bookingId) {
      const booking = await prisma.booking.findFirst({
        where: {
          OR: [{ id: bookingId }, { bookingId }],
          tenantId,
        },
      });
      if (booking) linkedBookingId = booking.bookingId;
    }

    const numCost = Number(cost) || 0;
    const numAllowance = packageAllowance ? Number(packageAllowance) : null;
    const margin = numAllowance !== null ? numAllowance - numCost : null;

    const ticket = await prisma.ticket.create({
      data: {
        tenantId,
        bookingId: linkedBookingId,
        type,
        pnr: pnr ? pnr.trim() : null,
        ticketNumber: ticketNumber ? ticketNumber.trim() : null,
        passengers: passengers || null,
        documentUrl: documentUrl || null,
        provider: provider || "IRCTC",
        journeyDate: journeyDate ? new Date(journeyDate) : null,
        arrivalDate: arrivalDate ? new Date(arrivalDate) : null,
        source: source || null,
        destination: destination || null,
        cost: numCost,
        packageAllowance: numAllowance,
        ticketingMargin: margin,
        status: "PENDING_VERIFICATION",
        notes: notes || null,
        confirmationEmail: confirmationEmail || null,
        createdById,
      },
    });

    await logAction({
      tenantId,
      actorUserId: createdById,
      bookingId: linkedBookingId,
      action: "CREATE",
      entityType: "TICKET",
      entityId: ticket.id,
      changeSummary: `Ingested ${ticket.type} ticket PNR: ${ticket.pnr || "N/A"} (Cost: ₹${ticket.cost})`,
      newValue: ticket,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      changedBy: req.admin?.name || req.user?.name || "Staff",
    });

    return res.status(201).json({
      success: true,
      message: "Ticket recorded in Finance Repository",
      data: ticket,
    });
  } catch (error) {
    console.error("❌ Error creating ticket:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create ticket" });
  }
}

/**
 * PATCH /api/finance/tickets/:id/verify
 * Finance Controller verifies actual ticket cost and allowance margins.
 */
async function verifyTicket(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const verifiedById = req.user?.id || req.admin?.id;
    const { id } = req.params;
    const { cost, packageAllowance, notes } = req.body;

    const existing = await prisma.ticket.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    const updatedCost = cost !== undefined ? Number(cost) : existing.cost;
    const updatedAllowance = packageAllowance !== undefined ? Number(packageAllowance) : existing.packageAllowance;
    const margin = updatedAllowance !== null ? updatedAllowance - updatedCost : null;

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        cost: updatedCost,
        packageAllowance: updatedAllowance,
        ticketingMargin: margin,
        status: "VERIFIED",
        verifiedById,
        verifiedAt: new Date(),
        notes: notes !== undefined ? notes : existing.notes,
      },
    });

    await logAction({
      tenantId,
      actorUserId: verifiedById,
      bookingId: existing.bookingId,
      action: "VERIFY",
      entityType: "TICKET",
      entityId: id,
      changeSummary: `Verified ticket #${id} PNR: ${existing.pnr || "—"}. Cost: ₹${updatedCost}, Margin: ₹${margin ?? "N/A"}`,
      beforeData: existing,
      afterData: updated,
      oldValue: existing,
      newValue: updated,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      changedBy: req.admin?.name || req.user?.name || "Finance Controller",
    });

    return res.json({
      success: true,
      message: "Ticket financially verified",
      data: updated,
    });
  } catch (error) {
    console.error("❌ Error verifying ticket:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to verify ticket" });
  }
}

/**
 * GET /api/finance/tickets/:id/linked-bookings
 * Get all booking details linked to a ticket.
 */
async function getLinkedBookings(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const { id } = req.params;

    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [{ id }, { pnr: id }],
        tenantId,
      },
      include: {
        booking: {
          include: {
            tripRef: true,
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    return res.json({
      success: true,
      data: {
        ticket,
        booking: ticket.booking,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching linked bookings for ticket:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch linked bookings" });
  }
}

/**
 * POST /api/finance/tickets/bulk-upload
 * Bulk upload ticket records with validation, duplicate detection, and unmatched record reporting.
 */
async function bulkUploadTickets(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const createdById = req.user?.id || req.admin?.id;
    const { tickets = [] } = req.body;

    if (!Array.isArray(tickets) || tickets.length === 0) {
      return res.status(400).json({ success: false, message: "A non-empty 'tickets' array is required" });
    }

    const ingested = [];
    const duplicates = [];
    const unmatched = [];

    // Pre-fetch all known bookings for quick lookup
    const allBookings = await prisma.booking.findMany({
      where: { tenantId },
      select: { id: true, bookingId: true, fullName: true, phone: true },
    });
    const bookingMap = new Map();
    allBookings.forEach((b) => {
      bookingMap.set(b.bookingId, b);
      bookingMap.set(b.id, b);
    });

    for (const [index, item] of tickets.entries()) {
      const pnr = item.pnr ? String(item.pnr).trim() : null;
      const bookingId = item.bookingId ? String(item.bookingId).trim() : null;
      const type = item.type || "TRAIN";
      const cost = Number(item.cost) || 0;

      // Check if booking is provided and valid
      let matchedBookingId = null;
      if (bookingId) {
        const matched = bookingMap.get(bookingId);
        if (matched) {
          matchedBookingId = matched.bookingId;
        } else {
          unmatched.push({
            row: index + 1,
            pnr,
            bookingId,
            reason: `Booking ID '${bookingId}' does not exist in the system`,
          });
          continue;
        }
      }

      // Check for duplicate PNR in database
      if (pnr) {
        const dup = await prisma.ticket.findFirst({
          where: { tenantId, pnr, bookingId: matchedBookingId },
        });
        if (dup) {
          duplicates.push({
            row: index + 1,
            pnr,
            bookingId: matchedBookingId,
            reason: `Ticket with PNR ${pnr} already exists for this booking`,
          });
          continue;
        }
      }

      // Ingest ticket
      const created = await prisma.ticket.create({
        data: {
          tenantId,
          bookingId: matchedBookingId,
          type,
          pnr,
          ticketNumber: item.ticketNumber ? String(item.ticketNumber).trim() : null,
          passengers: item.passengers || null,
          documentUrl: item.documentUrl || null,
          provider: item.provider || "IRCTC",
          journeyDate: item.journeyDate ? new Date(item.journeyDate) : null,
          source: item.source || null,
          destination: item.destination || null,
          cost,
          packageAllowance: item.packageAllowance ? Number(item.packageAllowance) : null,
          status: "PENDING_VERIFICATION",
          notes: item.notes || "Bulk imported",
          createdById,
        },
      });

      ingested.push(created);
    }

    await logAction({
      tenantId,
      actorUserId: createdById,
      action: "CREATE",
      entityType: "TICKET",
      changeSummary: `Bulk uploaded ${ingested.length} tickets (${duplicates.length} duplicates skipped, ${unmatched.length} unmatched rows)`,
      newValue: { count: ingested.length },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      changedBy: req.admin?.name || req.user?.name || "Staff",
    });

    return res.json({
      success: true,
      message: `Bulk upload completed: ${ingested.length} ingested, ${duplicates.length} duplicates, ${unmatched.length} unmatched`,
      data: {
        ingestedCount: ingested.length,
        duplicateCount: duplicates.length,
        unmatchedCount: unmatched.length,
        ingested,
        duplicates,
        unmatched,
      },
    });
  } catch (error) {
    console.error("❌ Error in bulk upload tickets:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to process bulk ticket upload" });
  }
}

module.exports = {
  searchTickets,
  createTicket,
  verifyTicket,
  getLinkedBookings,
  bulkUploadTickets,
};
