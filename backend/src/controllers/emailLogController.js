const { prisma } = require('../lib/prisma');

exports.getBookingLogs = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || 'default';
    const { bookingId } = req.params;

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (req.user.role === 'sales' && booking.salesAdminId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: Scoped ownership violation' });
    }

    const logs = await prisma.emailLog.findMany({
      where: { bookingId, tenantId },
      include: {
        sender: {
          select: { name: true, email: true }
        }
      },
      orderBy: { sentAt: 'desc' }
    });

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

exports.getInquiryLogs = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || 'default';
    const { inquiryId } = req.params;

    const inquiry = await prisma.inquiry.findFirst({
      where: { id: inquiryId, tenantId }
    });

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    if (req.user.role === 'sales' && inquiry.salesAdminId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: Scoped ownership violation' });
    }

    const logs = await prisma.emailLog.findMany({
      where: { inquiryId, tenantId },
      include: {
        sender: {
          select: { name: true, email: true }
        }
      },
      orderBy: { sentAt: 'desc' }
    });

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

exports.getTicketLogs = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || 'default';
    const { trainTicketId } = req.params;

    const ticket = await prisma.trainTicket.findFirst({
      where: { id: trainTicketId, tenantId },
      include: {
        booking: true
      }
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Train ticket not found' });
    }

    if (req.user.role === 'sales' && ticket.booking.salesAdminId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: Scoped ownership violation' });
    }

    const logs = await prisma.emailLog.findMany({
      where: { trainTicketId, tenantId },
      include: {
        sender: {
          select: { name: true, email: true }
        }
      },
      orderBy: { sentAt: 'desc' }
    });

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};
