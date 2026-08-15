const express = require("express");
const router = express.Router();
const {
  getEntries,
  getEntryHistory,
  createEntry,
  approveEntry,
  rejectEntry,
  getReports,
  getPersonalCollections,
  getPersonCollectionDetails,
  recordEmployeeSubmission,
} = require("../controllers/accountingController");
const { authenticate, requirePermission } = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);

// CRUD routes
router.get("/entries", requirePermission(["accounting.view", "payments.view"]), getEntries);
router.get(
  "/entries/:id/history",
  requirePermission(["accounting.view", "payments.view"]),
  getEntryHistory,
);
router.post("/entries", requirePermission(["accounting.submit", "payments.view"]), createEntry);
router.post(
  "/entries/:id/approve",
  requirePermission("accounting.approve"),
  approveEntry,
);
router.post(
  "/entries/:id/reject",
  requirePermission("accounting.approve"),
  rejectEntry,
);

// Analytics & Reports
router.get("/reports", requirePermission("accounting.view"), getReports);

// Personal Collections / Collection Accounts
router.get(
  "/personal-collections",
  requirePermission("accounting.view"),
  getPersonalCollections,
);
router.get(
  "/collection-accounts",
  requirePermission("accounting.view"),
  getPersonalCollections,
);
router.get(
  "/personal-collections/:adminId",
  requirePermission("accounting.view"),
  getPersonCollectionDetails,
);
router.get(
  "/collection-accounts/:adminId",
  requirePermission("accounting.view"),
  getPersonCollectionDetails,
);
router.post(
  "/personal-collections/submit",
  requirePermission("accounting.submit"),
  recordEmployeeSubmission,
);
router.post(
  "/collection-accounts/submit",
  requirePermission("accounting.submit"),
  recordEmployeeSubmission,
);

module.exports = router;
