const express = require("express");
const router = express.Router();
const { authenticate, requirePermission } = require("../middleware/auth");
const {
  getSopTemplates,
  getSopByTrip,
  createSopTemplate,
  createSopVersion,
  activateSopVersion,
  createTaskTemplate,
  updateTaskTemplate,
  deleteTaskTemplate,
  previewSopSchedule,
  applySopToDeparture,
  recalculateDepartureTaskDates,
} = require("../controllers/opsSopController");

router.use(authenticate);

// SOP Template Routes
router.get("/", requirePermission("ops.view"), getSopTemplates);
router.get("/by-trip/:tripId", requirePermission("ops.view"), getSopByTrip);
router.post("/", requirePermission("ops.manage"), createSopTemplate);

// Version Routes
router.post("/:templateId/versions", requirePermission("ops.manage"), createSopVersion);
router.patch("/versions/:versionId/activate", requirePermission("ops.manage"), activateSopVersion);

// Task Template Routes
router.post("/versions/:versionId/tasks", requirePermission("ops.manage"), createTaskTemplate);
router.put("/tasks/:taskId", requirePermission("ops.manage"), updateTaskTemplate);
router.delete("/tasks/:taskId", requirePermission("ops.manage"), deleteTaskTemplate);

// Engine Routes
router.post("/preview-schedule", requirePermission("ops.view"), previewSopSchedule);
router.post("/apply-to-departure", requirePermission("ops.manage"), applySopToDeparture);
router.post("/recalculate-dates", requirePermission("ops.manage"), recalculateDepartureTaskDates);

module.exports = router;
