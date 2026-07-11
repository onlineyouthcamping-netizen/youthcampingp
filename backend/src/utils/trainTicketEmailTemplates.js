/**
 * trainTicketEmailTemplates.js
 * Reusable email template builders for train ticket operations.
 * Uses existing email infrastructure; does NOT send directly.
 * PNR is excluded from customer-facing templates by default.
 */

const WAITLIST_DISCLAIMER =
  "If your ticket is waitlisted or RAC and does not get confirmed, YouthCamping is not responsible for railway confirmation. Please contact our team for available support and next steps.";

/**
 * train_ticket_approved
 * Customer email after ticket is approved.
 */
function buildApprovedEmail({ booking, ticket, template } = {}) {
  const disclaimer =
    ticket &&
    (ticket.ticketStatus === "WAITLISTED" || ticket.ticketStatus === "RAC")
      ? `\n\n${template?.waitlistDisclaimer || WAITLIST_DISCLAIMER}`
      : "";

  const envUrl = process.env.PUBLIC_SITE_URL || process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL;
  let publicBase = "https://youthcamping.in";
  if (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0) {
    let url = envUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    publicBase = url.replace(/\/+$/, "");
  }

  return {
    subject: `Your Train Ticket is Confirmed – ${booking?.tripName || "YouthCamping Trip"}`,
    html: `
<p>Dear ${booking?.fullName || booking?.name || "Traveler"},</p>
<p>Your train ticket for the trip <strong>${booking?.tripName || ""}</strong> has been confirmed.</p>
<table style="border-collapse:collapse;width:100%;font-size:14px">
  <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Journey Date</td><td style="padding:6px 12px">${ticket?.journeyDate ? new Date(ticket.journeyDate).toDateString() : "–"}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Train</td><td style="padding:6px 12px">${[ticket?.trainName, ticket?.trainNumber].filter(Boolean).join(" / ") || "–"}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">From</td><td style="padding:6px 12px">${ticket?.sourceStation || "–"}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">To</td><td style="padding:6px 12px">${ticket?.destinationStation || "–"}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Ticket Status</td><td style="padding:6px 12px">${ticket?.ticketStatus || "–"}</td></tr>
</table>
${disclaimer}
<p>For any queries, please contact our support team.</p>
<p>Team YouthCamping</p>
<hr style="border:0;border-top:1px solid #eee;margin:20px 0;" />
<p style="font-size:12px;color:#666;text-align:center;">
  <a href="${publicBase}/terms-and-conditions" style="color:#666;text-decoration:underline;">Terms &amp; Conditions</a> | <a href="${publicBase}/cancellation-policy" style="color:#666;text-decoration:underline;">Cancellation Policy</a>
</p>
`.trim(),
    text: `Your ticket for ${booking?.tripName} is confirmed.\nJourney: ${ticket?.journeyDate ? new Date(ticket.journeyDate).toDateString() : "–"}\nTrain: ${[ticket?.trainName, ticket?.trainNumber].filter(Boolean).join(" / ") || "–"}\nFrom: ${ticket?.sourceStation || "–"} To: ${ticket?.destinationStation || "–"}\nStatus: ${ticket?.ticketStatus || "–"}${disclaimer ? "\n\n" + (template?.waitlistDisclaimer || WAITLIST_DISCLAIMER) : ""}`,
  };
}

/**
 * train_ticket_status_update
 * Operational notification when ticket status changes.
 */
function buildStatusUpdateEmail({ booking, ticket, oldStatus, newStatus } = {}) {
  return {
    subject: `Train Ticket Status Updated – ${booking?.tripName || "YouthCamping"}`,
    html: `
<p>Train ticket status for <strong>${ticket?.travelerName || "Traveler"}</strong> (Booking: ${booking?.bookingId || ""}) has been updated.</p>
<p>Status changed from <strong>${oldStatus || "–"}</strong> to <strong>${newStatus || "–"}</strong>.</p>
<p>Please log in to the admin panel for details.</p>
`.trim(),
    text: `Ticket status for ${ticket?.travelerName} (${booking?.bookingId}) changed: ${oldStatus} → ${newStatus}`,
  };
}

/**
 * train_ticket_pending_reminder
 * Internal ops/sales alert – booking older than 2 days with PENDING ticket.
 * Do NOT include PNR.
 */
function buildPendingReminderEmail({ booking, tickets = [] } = {}) {
  const count = tickets.length;
  return {
    subject: `⚠ Action Required: ${count} Pending Train Ticket${count !== 1 ? "s" : ""} – ${booking?.tripName || "YouthCamping"}`,
    html: `
<p>This is an automated reminder for Booking <strong>${booking?.bookingId || "–"}</strong>.</p>
<p>The booking was created more than 2 days ago and has <strong>${count} ticket${count !== 1 ? "s" : ""}</strong> still in PENDING status.</p>
<p>Traveler(s): ${tickets.map((t) => t.travelerName).join(", ")}</p>
<p>Please action these tickets in the Admin Panel → Train Tickets section.</p>
`.trim(),
    text: `REMINDER: Booking ${booking?.bookingId} has ${count} pending ticket(s) (${tickets.map((t) => t.travelerName).join(", ")}). Please action them in the admin panel.`,
  };
}

/**
 * train_ticket_urgent_alert
 * Urgent internal alert – departure within 10 days, tickets still unconfirmed.
 * Do NOT include PNR.
 */
function buildUrgentAlertEmail({ booking, tickets = [], departure } = {}) {
  const count = tickets.length;
  const depStr = departure ? new Date(departure).toDateString() : "soon";
  return {
    subject: `🚨 URGENT: Unconfirmed Train Ticket${count !== 1 ? "s" : ""} – Departure ${depStr}`,
    html: `
<p><strong>URGENT ACTION REQUIRED</strong></p>
<p>Booking <strong>${booking?.bookingId || "–"}</strong> has <strong>${count} unconfirmed ticket${count !== 1 ? "s" : ""}</strong> with departure on <strong>${depStr}</strong>.</p>
<p>Traveler(s): ${tickets.map((t) => `${t.travelerName} (${t.ticketStatus})`).join(", ")}</p>
<p>Please immediately log in to the Admin Panel → Train Tickets and update these tickets.</p>
`.trim(),
    text: `URGENT: Booking ${booking?.bookingId} has ${count} unconfirmed ticket(s) departing ${depStr}. Please action immediately.`,
  };
}

module.exports = {
  WAITLIST_DISCLAIMER,
  buildApprovedEmail,
  buildStatusUpdateEmail,
  buildPendingReminderEmail,
  buildUrgentAlertEmail,
};
