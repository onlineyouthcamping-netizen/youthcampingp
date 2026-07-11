/**
 * trainTicketAlertJob.js
 * Callable server-side alert scan functions.
 *
 * Rules:
 * - Do NOT configure a production cron here.
 * - Do NOT use browser timers.
 * - These functions are called from routes/scheduled jobs externally.
 * - All deduplication uses TrainTicketAlertEvent with unique (alertType, dedupeKey).
 * - PNR is never included in outbound email content.
 * - WhatsApp provider is NOT integrated; only email flow is used.
 */

const { prisma } = require('../lib/prisma');
const {
  buildPendingReminderEmail,
  buildUrgentAlertEmail,
} = require('./trainTicketEmailTemplates');

/**
 * Resolve the existing sendEmail utility if available.
 * Falls back to a no-op logger so job never throws on missing mailer.
 */
function getSendEmail() {
  try {
    const { sendEmail } = require('../utils/email');
    return sendEmail;
  } catch (_) {
    return async (opts) => {
      console.log('[AlertJob][DRY-RUN] Would send email:', opts?.subject);
    };
  }
}

/**
 * scanPending2DayAlerts
 * Finds bookings older than 2 days that still have at least one PENDING ticket.
 * Creates a TrainTicketAlertEvent record (deduped) and queues an email via
 * existing email infrastructure.
 *
 * @param {string} tenantId
 */
async function scanPending2DayAlerts(tenantId = 'default') {
  const sendEmail = getSendEmail();
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  const pendingTickets = await prisma.trainTicket.findMany({
    where: {
      tenantId,
      ticketStatus: 'PENDING',
      createdAt: { lte: twoDaysAgo },
    },
    include: {
      booking: {
        select: {
          bookingId: true,
          name: true,
          fullName: true,
          tripName: true,
          salesAdminId: true,
          departureDate: true,
        },
      },
    },
  });

  // Group by booking
  const byBooking = {};
  for (const t of pendingTickets) {
    const bid = t.bookingId;
    if (!byBooking[bid]) byBooking[bid] = { booking: t.booking, tickets: [] };
    byBooking[bid].tickets.push(t);
  }

  let alertsCreated = 0;

  for (const [bookingId, { booking, tickets }] of Object.entries(byBooking)) {
    const dedupeKey = `PENDING_2D:${bookingId}`;

    // Check dedupe
    const existing = await prisma.trainTicketAlertEvent.findUnique({
      where: { alertType_dedupeKey: { alertType: 'PENDING_2D', dedupeKey } },
    });
    if (existing) continue;

    // Create dedupe record first (before email to avoid partial state)
    await prisma.trainTicketAlertEvent.create({
      data: {
        tenantId,
        bookingId,
        alertType: 'PENDING_2D',
        dedupeKey,
        channel: 'EMAIL',
        sentAt: now,
        metadata: { ticketCount: tickets.length, ticketIds: tickets.map((t) => t.id) },
      },
    });

    // Also create legacy TrainTicketAlert for backward-compat query in getAlerts
    await prisma.trainTicketAlert.upsert({
      where: { alertType_dedupeKey: { alertType: 'PENDING_2_DAYS', dedupeKey: bookingId } },
      create: {
        tenantId,
        alertType: 'PENDING_2_DAYS',
        dedupeKey: bookingId,
        bookingId,
        ticketId: tickets[0]?.id,
      },
      update: {},
    });

    // Build email (no PNR in content)
    const emailContent = buildPendingReminderEmail({ booking, tickets });

    // Notify salesAdminId if present
    if (booking?.salesAdminId) {
      const salesAdmin = await prisma.admin.findUnique({
        where: { id: booking.salesAdminId },
        select: { email: true, name: true },
      });
      if (salesAdmin?.email) {
        await sendEmail({ to: salesAdmin.email, ...emailContent }).catch((err) =>
          console.error('[AlertJob][PENDING_2D] Email send failed:', err?.message)
        );
      }
    }

    alertsCreated++;
    console.log(`[AlertJob] PENDING_2D alert created for booking ${bookingId}`);
  }

  return { type: 'PENDING_2D', alertsCreated };
}

/**
 * scanUrgent10DayAlerts
 * Finds bookings with departure within 10 days that still have PENDING/WAITLISTED/RAC tickets.
 * Creates a TrainTicketAlertEvent record (deduped) and queues an email.
 *
 * @param {string} tenantId
 */
async function scanUrgent10DayAlerts(tenantId = 'default') {
  const sendEmail = getSendEmail();
  const now = new Date();
  const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  const urgentTickets = await prisma.trainTicket.findMany({
    where: {
      tenantId,
      ticketStatus: { in: ['PENDING', 'WAITLISTED', 'RAC'] },
      journeyDate: { gte: now, lte: tenDaysFromNow },
    },
    include: {
      booking: {
        select: {
          bookingId: true,
          name: true,
          fullName: true,
          tripName: true,
          salesAdminId: true,
          departureDate: true,
        },
      },
    },
  });

  const byBooking = {};
  for (const t of urgentTickets) {
    const bid = t.bookingId;
    if (!byBooking[bid]) byBooking[bid] = { booking: t.booking, tickets: [] };
    byBooking[bid].tickets.push(t);
  }

  let alertsCreated = 0;

  for (const [bookingId, { booking, tickets }] of Object.entries(byBooking)) {
    const dedupeKey = `DEPARTURE_10D:${bookingId}`;

    const existing = await prisma.trainTicketAlertEvent.findUnique({
      where: { alertType_dedupeKey: { alertType: 'DEPARTURE_10D_URGENT', dedupeKey } },
    });
    if (existing) continue;

    await prisma.trainTicketAlertEvent.create({
      data: {
        tenantId,
        bookingId,
        alertType: 'DEPARTURE_10D_URGENT',
        dedupeKey,
        channel: 'EMAIL',
        sentAt: now,
        metadata: { ticketCount: tickets.length, ticketIds: tickets.map((t) => t.id) },
      },
    });

    // Legacy compat
    await prisma.trainTicketAlert.upsert({
      where: { alertType_dedupeKey: { alertType: 'URGENT_10_DAYS', dedupeKey: bookingId } },
      create: {
        tenantId,
        alertType: 'URGENT_10_DAYS',
        dedupeKey: bookingId,
        bookingId,
        ticketId: tickets[0]?.id,
      },
      update: {},
    });

    const departure = booking?.departureDate || tickets[0]?.journeyDate;
    const emailContent = buildUrgentAlertEmail({ booking, tickets, departure });

    if (booking?.salesAdminId) {
      const salesAdmin = await prisma.admin.findUnique({
        where: { id: booking.salesAdminId },
        select: { email: true, name: true },
      });
      if (salesAdmin?.email) {
        await sendEmail({ to: salesAdmin.email, ...emailContent }).catch((err) =>
          console.error('[AlertJob][URGENT_10D] Email send failed:', err?.message)
        );
      }
    }

    alertsCreated++;
    console.log(`[AlertJob] DEPARTURE_10D_URGENT alert created for booking ${bookingId}`);
  }

  return { type: 'DEPARTURE_10D_URGENT', alertsCreated };
}

/**
 * runAllAlertScans
 * Callable entry point: runs both alert scans for a given tenant.
 * Safe to call from a scheduler, an API route, or a management script.
 *
 * @param {string} tenantId
 */
async function runAllAlertScans(tenantId = 'default') {
  const results = await Promise.allSettled([
    scanPending2DayAlerts(tenantId),
    scanUrgent10DayAlerts(tenantId),
  ]);

  return results.map((r) =>
    r.status === 'fulfilled' ? r.value : { error: r.reason?.message }
  );
}

module.exports = {
  scanPending2DayAlerts,
  scanUrgent10DayAlerts,
  runAllAlertScans,
};
