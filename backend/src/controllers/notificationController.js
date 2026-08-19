const { prisma } = require("../lib/prisma");

// Helper to create a notification easily from anywhere in backend
exports.createNotification = async ({
  tenantId = "default",
  userId,
  title,
  message,
  link = null,
}) => {
  try {
    if (!userId) {
      const admins = await prisma.admin.findMany({
        where: { tenantId, status: "ACTIVE" },
        select: { id: true },
      });
      if (admins.length > 0) {
        return await prisma.notification.createMany({
          data: admins.map((a) => ({
            tenantId,
            userId: a.id,
            title,
            message,
            link,
          })),
        });
      }
      return null;
    }

    return await prisma.notification.create({
      data: {
        tenantId,
        userId,
        title,
        message,
        link,
      },
    });
  } catch (err) {
    console.error("createNotification error:", err);
    return null;
  }
};

// Get all notifications for authenticated user
exports.getNotifications = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || "default";
    const userId = req.user?.id;

    // 1. Fetch user-specific notifications from DB
    const dbNotifications = await prisma.notification.findMany({
      where: {
        tenantId,
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 40,
    });

    // 2. Fetch pending operational items to synthesize live alerts
    const liveAlerts = [];

    // Check pending cash submissions (model may not exist in all tenants)
    const pendingCash = prisma.cashRegisterSubmission
      ? await prisma.cashRegisterSubmission.findMany({
          where: { tenantId, status: "PENDING" },
          include: { salesperson: { select: { name: true } }, booking: { select: { bookingId: true } } },
          take: 5,
          orderBy: { createdAt: "desc" },
        }).catch(() => [])
      : [];

    pendingCash.forEach((c) => {
      liveAlerts.push({
        id: `live-cash-${c.id}`,
        title: "💰 Cash Verification Required",
        message: `₹${Number(c.amount || 0).toLocaleString("en-IN")} submitted by ${c.salesperson?.name || "Sales"} for Booking ${c.booking?.bookingId || c.bookingId || "—"}`,
        link: "/admin/approval-center/incoming",
        type: "PAYMENT",
        isRead: false,
        createdAt: c.createdAt,
      });
    });

    // Check pending train tickets
    const pendingTickets = await prisma.trainTicketRequest.findMany({
      where: { tenantId, status: { in: ["PENDING", "UNDER_REVIEW"] } },
      include: { booking: { select: { bookingId: true, name: true } } },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    pendingTickets.forEach((t) => {
      liveAlerts.push({
        id: `live-ticket-${t.id}`,
        title: "🎫 Train Ticket Queue",
        message: `${t.numberOfPassengers || 1} Pax for ${t.booking?.name || t.trainNumber || "Booking"} awaiting PNR assignment`,
        link: "/admin/travel-desk/train-tickets",
        type: "TICKETING",
        isRead: false,
        createdAt: t.createdAt,
      });
    });

    // Merge and sort
    const all = [...dbNotifications, ...liveAlerts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json(all);
  } catch (error) {
    next(error);
  }
};

// Mark a single notification as read
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id.startsWith("live-")) {
      // Dynamic live alert, return success
      return res.json({ success: true, id, isRead: true });
    }

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

// Create a test notification for the current user
exports.sendTestNotification = async (req, res, next) => {
  try {
    const notif = await prisma.notification.create({
      data: {
        tenantId: req.user.tenantId || "default",
        userId: req.user.id,
        title: "🔔 Test Notification Chime",
        message: "Your YouthCamping OS notification bell is working perfectly in real-time!",
        link: "/admin/dashboard",
      },
    });
    res.json({ success: true, data: notif });
  } catch (error) {
    next(error);
  }
};

// Clear all notifications
exports.clearAll = async (req, res, next) => {
  try {
    await prisma.notification.deleteMany({
      where: {
        tenantId: req.user.tenantId,
        userId: req.user.id,
      },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
