/**
 * accountingAlertJob.js
 * Callable server-side alert scan functions for manual payments.
 */

const { prisma } = require('../lib/prisma');

function getSendEmail() {
  try {
    const { sendEmail } = require('../utils/email');
    return sendEmail;
  } catch (_) {
    return async (opts) => {
      console.log('[AccountingAlertJob][DRY-RUN] Would send email:', opts?.subject);
    };
  }
}

/**
 * Helper to sum approved accounting collections for a booking
 */
async function getBookingPaymentsSum(bookingId) {
  const approvedEntries = await prisma.accountingEntry.findMany({
    where: { bookingId, status: 'APPROVED' },
    select: { amount: true }
  });
  return approvedEntries.reduce((sum, entry) => sum + entry.amount, 0);
}

/**
 * scanPostDepartureWarnings
 * Flags any booking that departed with unpaid balances and sends warning to Admin.
 */
async function scanPostDepartureWarnings(tenantId = 'default') {
  const sendEmail = getSendEmail();
  const now = new Date();

  // Find bookings where departureDate is in the past
  const bookings = await prisma.booking.findMany({
    where: {
      tenantId,
      departureDate: { lt: now },
      status: { notIn: ['cancelled', 'rejected'] }
    },
    select: {
      id: true,
      bookingId: true,
      name: true,
      fullName: true,
      email: true,
      tripName: true,
      departureDate: true,
      totalAmount: true,
      adjustedPrice: true
    }
  });

  for (const b of bookings) {
    const totalDue = b.adjustedPrice ?? b.totalAmount;
    const collected = await getBookingPaymentsSum(b.bookingId);

    if (collected < totalDue) {
      // Check dedupe
      const dedupeKey = b.bookingId;
      const alreadySent = await prisma.accountingAlertDedupe.findUnique({
        where: { alertType_bookingId: { alertType: 'POST_DEPARTURE_WARNING', bookingId: dedupeKey } }
      });

      if (!alreadySent) {
        // Send email to Admin
        await sendEmail({
          to: 'admin@youthcamping.online',
          subject: `⚠️ [Accounting Alert] Booking ${b.bookingId} Departed with Unpaid Balance`,
          html: `
            <h3>Booking Unpaid Balance Alert</h3>
            <p><strong>Booking ID:</strong> ${b.bookingId}</p>
            <p><strong>Customer Name:</strong> ${b.fullName || b.name}</p>
            <p><strong>Trip Name:</strong> ${b.tripName}</p>
            <p><strong>Departure Date:</strong> ${b.departureDate.toDateString()}</p>
            <p><strong>Total Amount:</strong> ₹${totalDue}</p>
            <p><strong>Collected Amount:</strong> ₹${collected}</p>
            <p><strong>Remaining Balance:</strong> ₹${totalDue - collected}</p>
            <p>Please audit this booking and verify the payment status.</p>
          `
        });

        // Save dedupe record
        await prisma.accountingAlertDedupe.create({
          data: { alertType: 'POST_DEPARTURE_WARNING', bookingId: dedupeKey }
        });
      }
    }
  }
}

/**
 * scan7DayUnpaidReminders
 * Sends automatic payment reminder exactly 7 days before departure.
 */
async function scan7DayUnpaidReminders(tenantId = 'default') {
  const sendEmail = getSendEmail();
  const now = new Date();
  
  // Define 7 days window (6.5 to 7.5 days from now)
  const startRange = new Date(now.getTime() + 6.5 * 24 * 60 * 60 * 1000);
  const endRange = new Date(now.getTime() + 7.5 * 24 * 60 * 60 * 1000);

  const bookings = await prisma.booking.findMany({
    where: {
      tenantId,
      departureDate: { gte: startRange, lte: endRange },
      status: { notIn: ['cancelled', 'rejected'] }
    },
    select: {
      id: true,
      bookingId: true,
      name: true,
      fullName: true,
      email: true,
      tripName: true,
      departureDate: true,
      totalAmount: true,
      adjustedPrice: true
    }
  });

  for (const b of bookings) {
    if (!b.email) continue;
    const totalDue = b.adjustedPrice ?? b.totalAmount;
    const collected = await getBookingPaymentsSum(b.bookingId);

    if (collected < totalDue) {
      const dedupeKey = b.bookingId;
      const alreadySent = await prisma.accountingAlertDedupe.findUnique({
        where: { alertType_bookingId: { alertType: 'UNPAID_BALANCE_7D', bookingId: dedupeKey } }
      });

      if (!alreadySent) {
        // Send email to Customer
        await sendEmail({
          to: b.email,
          subject: `🔔 Payment Reminder: Your upcoming trip for ${b.tripName}`,
          html: `
            <h3>Hello ${b.fullName || b.name},</h3>
            <p>This is a friendly reminder that your trip <strong>${b.tripName}</strong> is departing soon on ${b.departureDate.toDateString()}.</p>
            <p><strong>Total Amount:</strong> ₹${totalDue}</p>
            <p><strong>Collected Amount:</strong> ₹${collected}</p>
            <p><strong>Remaining Balance:</strong> ₹${totalDue - collected}</p>
            <p>Please make the remaining payment using manual methods (UPI, Bank Transfer, or Cash) to confirm your reservation.</p>
            <p>Thank you for choosing YouthCamping!</p>
          `
        });

        // Save dedupe record
        await prisma.accountingAlertDedupe.create({
          data: { alertType: 'UNPAID_BALANCE_7D', bookingId: dedupeKey }
        });
      }
    }
  }
}

/**
 * scan3DayDepartureAlerts
 * Auto-flags bookings where full payment is not received 3 days before departure and notifies Admin.
 */
async function scan3DayDepartureAlerts(tenantId = 'default') {
  const sendEmail = getSendEmail();
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3.5 * 24 * 60 * 60 * 1000);

  // Find bookings departing within next 3 days
  const bookings = await prisma.booking.findMany({
    where: {
      tenantId,
      departureDate: { gte: now, lte: threeDaysFromNow },
      status: { notIn: ['cancelled', 'rejected'] }
    },
    select: {
      id: true,
      bookingId: true,
      name: true,
      fullName: true,
      email: true,
      tripName: true,
      departureDate: true,
      totalAmount: true,
      adjustedPrice: true
    }
  });

  for (const b of bookings) {
    const totalDue = b.adjustedPrice ?? b.totalAmount;
    const collected = await getBookingPaymentsSum(b.bookingId);

    if (collected < totalDue) {
      const dedupeKey = b.bookingId;
      const alreadySent = await prisma.accountingAlertDedupe.findUnique({
        where: { alertType_bookingId: { alertType: 'INCOMPLETE_3D', bookingId: dedupeKey } }
      });

      if (!alreadySent) {
        // Send email to Admin
        await sendEmail({
          to: 'admin@youthcamping.online',
          subject: `🚨 [Accounting Warning] Unpaid Balance 3 Days before Departure: ${b.bookingId}`,
          html: `
            <h3>Urgent Incomplete Payment Alert</h3>
            <p><strong>Booking ID:</strong> ${b.bookingId}</p>
            <p><strong>Customer Name:</strong> ${b.fullName || b.name}</p>
            <p><strong>Trip Name:</strong> ${b.tripName}</p>
            <p><strong>Departure Date:</strong> ${b.departureDate.toDateString()}</p>
            <p><strong>Total Amount:</strong> ₹${totalDue}</p>
            <p><strong>Collected Amount:</strong> ₹${collected}</p>
            <p><strong>Remaining Balance:</strong> ₹${totalDue - collected}</p>
            <p>Action is required to secure collections before trip departure.</p>
          `
        });

        // Save dedupe record
        await prisma.accountingAlertDedupe.create({
          data: { alertType: 'INCOMPLETE_3D', bookingId: dedupeKey }
        });
      }
    }
  }
}

module.exports = {
  scanPostDepartureWarnings,
  scan7DayUnpaidReminders,
  scan3DayDepartureAlerts
};
