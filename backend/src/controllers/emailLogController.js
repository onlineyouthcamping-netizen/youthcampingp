const { prisma } = require("../lib/prisma");

exports.getBookingLogs = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || "default";
    const { bookingId } = req.params;

    const booking = await prisma.booking.findFirst({
      where: {
        tenantId,
        OR: [{ id: bookingId }, { bookingId: bookingId }],
      },
    });

    if (!booking) {
      return res.json({ success: true, data: [] });
    }

    const [logs, legacyLogs] = await Promise.all([
      prisma.emailLog.findMany({
        where: {
          tenantId,
          OR: [{ bookingId: booking.id }, { bookingId: booking.bookingId }],
        },
        include: {
          sender: {
            select: { name: true, email: true },
          },
        },
        orderBy: { sentAt: "desc" },
      }),
      prisma.bookingEmailLog.findMany({
        where: {
          OR: [{ bookingId: booking.id }, { bookingId: booking.bookingId }],
        },
        orderBy: { sentAt: "desc" },
      }),
    ]);

    const mappedLegacyLogs = legacyLogs.map((l) => {
      let bodyText = "";
      if (l.metadata && typeof l.metadata === "object") {
        bodyText = l.metadata.body || JSON.stringify(l.metadata, null, 2);
      } else if (typeof l.metadata === "string") {
        bodyText = l.metadata;
      }
      return {
        id: l.id,
        recipient: l.recipient,
        subject: l.subject || `Booking Notification (${l.type})`,
        body: bodyText || `Email Type: ${l.type}`,
        templateName: l.type ? l.type.replace(/_/g, " ").toUpperCase() : "Booking Confirmation",
        status: (l.status || "success").toUpperCase(),
        error: l.error || undefined,
        isTest: false,
        ccCount: 0,
        bccCount: 0,
        sentAt: l.sentAt || new Date().toISOString(),
        sender: {
          name: "System / Automated",
          email: "system@youthcamping.online",
        },
      };
    });

    const combinedLogs = [...logs, ...mappedLegacyLogs].sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
    );

    res.json({ success: true, data: combinedLogs });
  } catch (err) {
    next(err);
  }
};

exports.getInquiryLogs = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || "default";
    const { inquiryId } = req.params;

    const inquiry = await prisma.inquiry.findFirst({
      where: { id: inquiryId, tenantId },
    });

    if (!inquiry) {
      return res
        .status(404)
        .json({ success: false, message: "Inquiry not found" });
    }

    if (req.user.role === "sales" && inquiry.salesAdminId !== req.user.id) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Forbidden: Scoped ownership violation",
        });
    }

    const logs = await prisma.emailLog.findMany({
      where: { inquiryId, tenantId },
      include: {
        sender: {
          select: { name: true, email: true },
        },
      },
      orderBy: { sentAt: "desc" },
    });

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

exports.getTicketLogs = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || "default";
    const { trainTicketId } = req.params;

    const ticket = await prisma.trainTicket.findFirst({
      where: { id: trainTicketId, tenantId },
      include: {
        booking: true,
      },
    });

    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Train ticket not found" });
    }

    if (
      req.user.role === "sales" &&
      ticket.booking.salesAdminId !== req.user.id
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Forbidden: Scoped ownership violation",
        });
    }

    const logs = await prisma.emailLog.findMany({
      where: { trainTicketId, tenantId },
      include: {
        sender: {
          select: { name: true, email: true },
        },
      },
      orderBy: { sentAt: "desc" },
    });

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};
