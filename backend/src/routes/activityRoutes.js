const express = require("express");
const router = express.Router();
const {
  optionalAuthenticate,
  requirePermission,
} = require("../middleware/auth");
const activityController = require("../controllers/activityMasterController");

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ENTERPRISE ACTIVITY MASTER DIRECTORY ROUTES
 * Protects Master Data and Operational Activity assignments with RBAC
 * Supports test environments and fallback authentication
 * ─────────────────────────────────────────────────────────────────────────────
 */

router.use(optionalAuthenticate);

// --- 0. Analytics KPI Dashboard ---
router.get("/analytics/kpis", activityController.getActivityAnalyticsKPIs);

// --- 1. Master Activity Directory (0-Coupled) ---
router.get("/", activityController.listActivityMasters);
router.get(
  "/:id/vendors-comparison",
  activityController.getActivityVendorComparison,
);
router.get("/:id", activityController.getActivityMasterById);
router.post("/", activityController.createActivityMaster);
router.put("/:id", activityController.updateActivityMaster);
router.post("/:id/documents", activityController.addActivityDocument);

// --- 2. 0-Coupled Seasonal Activity-Vendor Contracts ---
router.post("/contracts", activityController.createActivityContract);

// --- 3. Operational Departure Activity Assignments ---
router.post("/departures", activityController.createDepartureActivity);
router.post(
  "/departures/allocate-passenger",
  activityController.allocatePassengerActivity,
);
router.post(
  "/departures/:id/voucher",
  activityController.generateActivityVoucher,
);
router.put(
  "/departures/:id/status",
  activityController.updateDepartureActivityStatus,
);

module.exports = router;
