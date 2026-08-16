const express = require("express");
const router = express.Router();
const { authenticate, requirePermission } = require("../middleware/auth");
const {
  getClientPayments,
  addClientPayment,
  verifyClientPayment,
  getVendorPayments,
  getAllRecordedVendorPayments,
  createVendorPayment,
  updateVendorPayment,
  deleteVendorPayment,
  getPaymentsDashboardStats,
  getBookingPayments,
  getAllVendorPayablesQueue,
} = require("../controllers/paymentController");
const collectionAccountController = require("../controllers/collectionAccountController");

router.use(authenticate);

// Collection Accounts Routes
router.get("/accounts", collectionAccountController.getAccounts);
router.post("/accounts", collectionAccountController.createAccount);
router.put("/accounts/:id", collectionAccountController.updateAccount);
router.delete("/accounts/:id", collectionAccountController.deleteAccount);
router.get("/accounts/:id/ledger", collectionAccountController.getAccountLedger);
router.post("/accounts/:id/submit", collectionAccountController.recordAccountSubmission);

// Global Payables Queue & Recorded Payments
router.get("/vendor-payables-queue", requirePermission("ops.view"), getAllVendorPayablesQueue);
router.get("/vendor-payments", requirePermission("ops.view"), getAllRecordedVendorPayments);

// Client Receivables Routes
router.get("/client/:tripId", requirePermission("ops.view"), getClientPayments);
router.post(
  "/client/add/:bookingId",
  requirePermission("ops.manage"),
  addClientPayment,
);
router.patch(
  "/client/verify/:id",
  requirePermission("ops.manage"),
  verifyClientPayment,
);
router.get("/booking/:bookingId", getBookingPayments);

// Vendor Payables Routes
router.get("/vendor/:tripId", requirePermission("ops.view"), getVendorPayments);
router.post(
  "/vendor/:tripId",
  requirePermission("ops.manage"),
  createVendorPayment,
);
router.put(
  "/vendor/:tripId/:id",
  requirePermission("ops.manage"),
  updateVendorPayment,
);
router.delete(
  "/vendor/:id",
  requirePermission("ops.manage"),
  deleteVendorPayment,
);

// Financial Dashboard stats
router.get(
  "/dashboard/:tripId",
  requirePermission("ops.view"),
  getPaymentsDashboardStats,
);

module.exports = router;
