const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.get("/", notificationController.getNotifications);
router.post("/test", notificationController.sendTestNotification);
router.put("/read-all", notificationController.markAllAsRead);
router.delete("/clear-all", notificationController.clearAll);
router.put("/:id/read", notificationController.markAsRead);

module.exports = router;
