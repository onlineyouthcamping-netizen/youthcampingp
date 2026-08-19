const { prisma } = require("../lib/prisma");

// Get all notifications for the authenticated user
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        tenantId: req.user.tenantId,
        userId: req.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

// Mark a single notification as read
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read for the authenticated user
exports.markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: {
        tenantId: req.user.tenantId,
        userId: req.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
