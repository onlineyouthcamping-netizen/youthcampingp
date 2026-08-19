const express = require("express");
const router = express.Router();

// Existing Control Center Controllers
const {
  getControlCenterStats,
  getCashSubmissionsQueue,
  getIncomingPaymentsQueue,
  getVendorPaymentsQueue,
  getTicketingVerificationQueue,
  getDiscrepanciesQueue,
  getAuditLog,
  verifyCashSubmission,
  verifyIncomingPayment,
  verifyVendorPayment,
  verifyTicketingPrice,
  getDeparturesQueue,
  getExpensesQueue,
  verifyDeparturePayment,
  verifyExpense,
  createExpense,
  assignIncomingPayment,
  getStationCashQueue,
  batchVerifyStationCash,
  getTripWiseVendorAccounts,
} = require("../controllers/financeController");

// New Sub-module Controllers
const {
  createRefundRequest,
  getRefunds,
  approveRefund,
  rejectRefund,
} = require("../controllers/refundController");

const {
  getCreditNoteDetails,
  applyCreditNote,
  getActiveCreditNotes,
} = require("../controllers/creditController");

const {
  createCoupon,
  getCoupons,
  updateCoupon,
  validateCoupon,
} = require("../controllers/couponController");

const {
  searchTickets,
  createTicket,
  verifyTicket,
  getLinkedBookings,
  bulkUploadTickets,
} = require("../controllers/financeTicketController");

const {
  createService,
  updateService,
  getBookingServices,
} = require("../controllers/serviceRegistryController");

const {
  createTask,
  getTasks,
  updateTaskStatus,
  addTaskComment,
  getTaskDashboard,
} = require("../controllers/taskAllotmentController");

const {
  getAuditLogs,
  getTrailByEntity,
} = require("../controllers/auditController");

const {
  getTripPnL,
  snapshotTripPnL,
} = require("../controllers/tripAccountingController");

const { authenticate, requirePermission } = require("../middleware/auth");

router.use(authenticate);

// ─────────────────────────────────────────────────────────────
// 1. CONTROL CENTER STATS & VERIFICATION QUEUES (Existing)
// ─────────────────────────────────────────────────────────────

router.get(
  "/control-center/stats",
  requirePermission(["accounting.view", "finance.control_center.view"]),
  getControlCenterStats
);

router.get(
  "/control-center/cash-queue",
  requirePermission(["accounting.view", "finance.cash.verify"]),
  getCashSubmissionsQueue
);

router.get(
  "/control-center/incoming-queue",
  requirePermission(["accounting.view", "finance.incoming.verify"]),
  getIncomingPaymentsQueue
);

router.get(
  "/control-center/departures-queue",
  requirePermission(["accounting.view", "finance.outgoing.verify"]),
  getDeparturesQueue
);

router.get(
  "/control-center/vendor-queue",
  requirePermission(["accounting.view", "finance.outgoing.verify"]),
  getVendorPaymentsQueue
);

router.get(
  "/control-center/tripwise-vendor-accounts",
  requirePermission(["accounting.view", "finance.outgoing.verify"]),
  getTripWiseVendorAccounts
);

router.get(
  "/control-center/ticketing-queue",
  requirePermission(["accounting.view", "finance.tickets.verify"]),
  getTicketingVerificationQueue
);

router.get(
  "/control-center/expenses-queue",
  requirePermission(["accounting.view", "finance.outgoing.verify"]),
  getExpensesQueue
);

router.get(
  "/control-center/discrepancies-queue",
  requirePermission(["accounting.view", "finance.discrepancy.manage"]),
  getDiscrepanciesQueue
);

router.get(
  "/control-center/audit-log",
  requirePermission(["accounting.view", "audit_logs.view"]),
  getAuditLog
);

router.post(
  "/control-center/cash/:id/action",
  requirePermission(["accounting.approve", "finance.cash.approve"]),
  verifyCashSubmission
);

router.get(
  "/control-center/station-cash-queue",
  requirePermission(["accounting.view", "finance.cash.verify", "station_payments.view"]),
  getStationCashQueue
);

router.post(
  "/control-center/station-cash/batch-verify",
  requirePermission(["accounting.approve", "finance.cash.approve", "station_payments.reconcile"]),
  batchVerifyStationCash
);

router.post(
  "/control-center/incoming/:id/action",
  requirePermission(["accounting.approve", "finance.incoming.approve"]),
  verifyIncomingPayment
);

router.post(
  "/control-center/incoming/:id/assign",
  requirePermission(["accounting.approve", "finance.incoming.approve", "finance.control_center.view"]),
  assignIncomingPayment
);

router.post(
  "/control-center/departures/:id/action",
  requirePermission(["accounting.approve", "finance.outgoing.approve"]),
  verifyDeparturePayment
);

router.post(
  "/control-center/vendor/:id/action",
  requirePermission(["accounting.approve", "finance.outgoing.approve"]),
  verifyVendorPayment
);

router.post(
  "/control-center/ticketing/:id/action",
  requirePermission(["accounting.approve", "finance.tickets.approve"]),
  verifyTicketingPrice
);

router.post(
  "/control-center/expenses",
  requirePermission(["accounting.approve", "finance.outgoing.approve"]),
  createExpense
);

router.post(
  "/control-center/expenses/:id/action",
  requirePermission(["accounting.approve", "finance.outgoing.approve"]),
  verifyExpense
);

// ─────────────────────────────────────────────────────────────
// 2. REFUNDS & CREDIT NOTES
// ─────────────────────────────────────────────────────────────

router.post(
  "/refunds",
  requirePermission(["finance.refund.create", "accounting.submit", "bookings.financial_edit", "bookings.refund"]),
  createRefundRequest
);

router.get(
  "/refunds",
  requirePermission(["finance.refund.view", "accounting.view", "finance.control_center.view"]),
  getRefunds
);

router.patch(
  "/refunds/:id/approve",
  requirePermission(["finance.refund.approve", "accounting.approve", "finance.control_center.view"]),
  approveRefund
);

router.patch(
  "/refunds/:id/reject",
  requirePermission(["finance.refund.approve", "accounting.approve", "finance.control_center.view"]),
  rejectRefund
);

router.get(
  "/credits/active",
  requirePermission(["finance.credit.view", "accounting.view", "finance.refund.view"]),
  getActiveCreditNotes
);

router.get(
  "/credits/:refundId",
  requirePermission(["finance.credit.view", "accounting.view", "finance.refund.view"]),
  getCreditNoteDetails
);

router.patch(
  "/credits/:refundId/apply",
  requirePermission(["finance.credit.apply", "accounting.submit", "bookings.financial_edit"]),
  applyCreditNote
);

// ─────────────────────────────────────────────────────────────
// 3. COUPONS & DISCOUNTS
// ─────────────────────────────────────────────────────────────

router.post(
  "/coupons",
  requirePermission(["finance.coupons.manage", "accounting.submit", "settings.edit"]),
  createCoupon
);

router.get(
  "/coupons",
  requirePermission(["finance.coupons.view", "accounting.view", "bookings.view"]),
  getCoupons
);

router.patch(
  "/coupons/:id",
  requirePermission(["finance.coupons.manage", "accounting.submit", "settings.edit"]),
  updateCoupon
);

// Authoritative validation (publicly accessible to authenticated sales / booking staff)
router.post(
  "/coupons/:code/validate",
  validateCoupon
);

// ─────────────────────────────────────────────────────────────
// 4. TICKET REPOSITORY & AUDIT
// ─────────────────────────────────────────────────────────────

router.get(
  "/tickets/search",
  requirePermission(["finance.ticketing.view", "tickets.view", "accounting.view"]),
  searchTickets
);

router.post(
  "/tickets",
  requirePermission(["finance.ticketing.create", "tickets.create", "accounting.submit"]),
  createTicket
);

router.post(
  "/tickets/bulk-upload",
  requirePermission(["finance.ticketing.bulk", "tickets.bulk", "accounting.submit"]),
  bulkUploadTickets
);

router.get(
  "/tickets/:id/linked-bookings",
  requirePermission(["finance.ticketing.view", "tickets.view", "bookings.view"]),
  getLinkedBookings
);

router.patch(
  "/tickets/:id/verify",
  requirePermission(["finance.ticketing.verify", "tickets.approve", "accounting.approve"]),
  verifyTicket
);

// ─────────────────────────────────────────────────────────────
// 5. SERVICE REGISTRY
// ─────────────────────────────────────────────────────────────

router.post(
  "/services",
  requirePermission(["finance.services.manage", "accounting.submit", "operations.edit"]),
  createService
);

router.patch(
  "/services/:id",
  requirePermission(["finance.services.manage", "finance.services.verify", "accounting.approve"]),
  updateService
);

router.get(
  "/bookings/:id/services",
  requirePermission(["finance.services.view", "bookings.view", "accounting.view"]),
  getBookingServices
);

// ─────────────────────────────────────────────────────────────
// 6. TASK ALLOTMENT & WORKLOAD
// ─────────────────────────────────────────────────────────────

router.post(
  "/tasks",
  requirePermission(["finance.tasks.manage", "operations.edit", "bookings.edit"]),
  createTask
);

router.get(
  "/tasks/dashboard",
  requirePermission(["finance.tasks.view", "dashboard.view", "operations.view"]),
  getTaskDashboard
);

router.get(
  "/tasks",
  requirePermission(["finance.tasks.view", "operations.view", "dashboard.view"]),
  getTasks
);

router.patch(
  "/tasks/:id/status",
  requirePermission(["finance.tasks.manage", "operations.edit"]),
  updateTaskStatus
);

router.post(
  "/tasks/:id/comments",
  requirePermission(["finance.tasks.view", "finance.tasks.comment", "operations.view"]),
  addTaskComment
);

// ─────────────────────────────────────────────────────────────
// 7. AUDIT TRAIL & REPORTS
// ─────────────────────────────────────────────────────────────

router.get(
  "/audit",
  requirePermission(["finance.audit.view", "audit_logs.view", "accounting.view"]),
  getAuditLogs
);

router.get(
  "/audit/reports/trail-by-entity",
  requirePermission(["finance.audit.export", "audit_logs.view", "reports.export"]),
  getTrailByEntity
);

// ─────────────────────────────────────────────────────────────
// 8. TRIP ACCOUNTING & P&L
// ─────────────────────────────────────────────────────────────

router.get(
  "/trip-accounting/:tripId",
  requirePermission(["finance.accounting.view", "accounting.view", "reports.view"]),
  getTripPnL
);

router.post(
  "/trip-accounting/snapshot",
  requirePermission(["finance.accounting.manage", "accounting.approve"]),
  snapshotTripPnL
);

// ─────────────────────────────────────────────────────────────
// 9. FINANCE APPROVAL WORKFLOW & AUDIT TRAIL
// ─────────────────────────────────────────────────────────────
const {
  reviewCollectionFC,
  approveCollectionFounder,
  rejectCollection,
  uploadCollectionProof,
  getCollectionDetailsWithAudit,
  getVendorPaymentDetailsWithAudit,
  reviewVendorPaymentFC,
  approveVendorPaymentFounder,
  rejectVendorPayment,
  getPendingApprovals,
  getMonthlyReconciliation,
} = require("../controllers/financeApprovalController");

// Collections 2-Tier Approval
router.patch(
  "/collections/:paymentId/review-fc",
  requirePermission(["finance.collections.review", "finance.incoming.verify", "accounting.approve", "finance.control_center.view"]),
  reviewCollectionFC
);
router.patch(
  "/collections/:paymentId/approve-founder",
  requirePermission(["finance.collections.approve_founder", "finance.incoming.approve"]),
  approveCollectionFounder
);
router.patch(
  "/collections/:paymentId/reject",
  requirePermission(["finance.collections.reject", "finance.incoming.reject", "accounting.approve"]),
  rejectCollection
);
router.post(
  "/collections/:paymentId/upload-proof",
  requirePermission(["finance.proof.upload", "finance.collections.review", "accounting.approve", "ops.manage"]),
  uploadCollectionProof
);
router.get(
  "/collections/:paymentId",
  requirePermission(["finance.payments.view", "accounting.view", "finance.audit.view", "finance.control_center.view"]),
  getCollectionDetailsWithAudit
);

// Vendor Payouts Approval
router.get(
  "/vendor-payments/:paymentId",
  requirePermission(["finance.payments.view", "accounting.view", "finance.audit.view", "finance.control_center.view", "finance.outgoing.verify"]),
  getVendorPaymentDetailsWithAudit
);
router.patch(
  "/vendor-payments/:paymentId/review-fc",
  requirePermission(["finance.vendor.review", "finance.outgoing.verify", "accounting.approve"]),
  reviewVendorPaymentFC
);
router.patch(
  "/vendor-payments/:paymentId/approve-founder",
  requirePermission(["finance.vendor.approve_founder", "finance.outgoing.approve"]),
  approveVendorPaymentFounder
);
router.patch(
  "/vendor-payments/:paymentId/reject",
  requirePermission(["finance.vendor.reject", "finance.outgoing.reject", "accounting.approve"]),
  rejectVendorPayment
);

// Pending Queue & Monthly Reconciliation Report
router.get(
  "/approvals/pending",
  requirePermission(["finance.incoming.verify", "finance.control_center.view", "accounting.view", "finance.payments.view"]),
  getPendingApprovals
);
router.get(
  "/reconciliation/monthly/:year/:month",
  requirePermission(["finance.reconciliation.view", "finance.accounting.view", "accounting.view", "reports.view"]),
  getMonthlyReconciliation
);

module.exports = router;

