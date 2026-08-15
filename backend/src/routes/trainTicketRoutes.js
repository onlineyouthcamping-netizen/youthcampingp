const express = require("express");
const router = express.Router();
const {
  getTicketsByBooking,
  getTicketHistory,
  createTicket,
  autoGenerateTickets,
  updateTicket,
  submitTicket,
  approveTicket,
  rejectTicket,
  reopenTicket,
  cancelTicket,
  rebookTicket,
  recordRefund,
  getFinanceSummary,
  bulkUpdateTickets,
  getApprovalsQueue,
  getAlerts,
  getTemplates,
  getEffectiveTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  archiveTemplate,
  restoreTemplate,
} = require("../controllers/trainTicketController");
const { authenticate, requirePermission } = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);

// Finance & Analytics Summary
router.get(
  "/finance-summary",
  requirePermission("tickets.view"),
  getFinanceSummary,
);

// Approvals & Alerts (specific routes before parameterized ones)
router.get("/approvals", requirePermission("tickets.view"), getApprovalsQueue);
router.get("/alerts", requirePermission("tickets.alerts.view"), getAlerts);

// Train Templates
router.get(
  "/templates/effective",
  requirePermission("tickets.view"),
  getEffectiveTemplates,
);
router.get("/templates", requirePermission("tickets.view"), getTemplates);
router.post(
  "/templates",
  requirePermission("tickets.templates.manage"),
  createTemplate,
);
router.put(
  "/templates/:id",
  requirePermission("tickets.templates.manage"),
  updateTemplate,
);
router.patch(
  "/templates/:id",
  requirePermission("tickets.templates.manage"),
  updateTemplate,
);
router.delete(
  "/templates/:id",
  requirePermission("tickets.templates.manage"),
  deleteTemplate,
);
router.post(
  "/templates/:id/archive",
  requirePermission("tickets.templates.manage"),
  archiveTemplate,
);
router.post(
  "/templates/:id/restore",
  requirePermission("tickets.templates.manage"),
  restoreTemplate,
);

// Booking-level ticket operations
router.get(
  "/booking/:bookingId",
  requirePermission("tickets.view"),
  getTicketsByBooking,
);
router.post(
  "/booking/:bookingId",
  requirePermission("tickets.create"),
  createTicket,
);
router.post(
  "/booking/:bookingId/auto-generate",
  requirePermission("tickets.create"),
  autoGenerateTickets,
);

// Bulk Update
router.post(
  "/bulk-update",
  requirePermission("tickets.bulk"),
  bulkUpdateTickets,
);

// Ticket-level operations
router.get(
  "/:ticketId/history",
  requirePermission("tickets.view"),
  getTicketHistory,
);
router.put("/:ticketId", requirePermission("tickets.edit"), updateTicket);
router.patch("/:ticketId", requirePermission("tickets.edit"), updateTicket);
router.post(
  "/:ticketId/submit",
  requirePermission("tickets.submit"),
  submitTicket,
);
router.post(
  "/:ticketId/approve",
  requirePermission("tickets.approve"),
  approveTicket,
);
router.post(
  "/:ticketId/reject",
  requirePermission("tickets.approve"),
  rejectTicket,
);
router.post(
  "/:ticketId/reopen",
  requirePermission("tickets.reopen"),
  reopenTicket,
);
router.post(
  "/:ticketId/cancel",
  requirePermission("tickets.edit"),
  cancelTicket,
);
router.post(
  "/:ticketId/rebook",
  requirePermission("tickets.create"),
  rebookTicket,
);
router.post(
  "/:ticketId/record-refund",
  requirePermission("tickets.edit"),
  recordRefund,
);

module.exports = router;
