const { prisma } = require('../lib/prisma');
const { logAction } = require('../utils/auditLogger');

/**
 * Recalculates paidAmount and status based on Prisma
 */
async function syncBookingFromPayments(bookingId, tenantId) {
  const payments = await prisma.payment.findMany({
    where: { bookingId, tenantId }
  });
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, tenantId }
  });
  if (!booking) return;

  const totalAmount = booking.totalAmount || 0;
  let paymentStatus = 'unpaid';
  if (totalPaid >= totalAmount && totalAmount > 0) {
    paymentStatus = 'paid';
  } else if (totalPaid > 0) {
    paymentStatus = 'partial';
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      advancePaid: totalPaid,
      paymentStatus,
      remainingAmount: totalAmount - totalPaid
    }
  });
}

/**
 * @desc    Add payment
 * @route   POST /api/payments
 * @access  Private/Admin
 */
exports.addPayment = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { bookingId, amount, paymentMode } = req.body;

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId }
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Sales ownership check
    if (req.user?.role === 'sales' && booking.salesAdminId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount: Number(amount),
        paymentMode,
        tenantId
      }
    });

    await syncBookingFromPayments(bookingId, tenantId);

    await logAction({
      tenantId,
      actorUserId: req.user.id,
      action: 'payment_update',
      entityType: 'payment',
      entityId: payment.id,
      afterData: payment,
      ipAddress: req.ip || null
    });

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get payments for a booking
 * @route   GET /api/payments/booking/:bookingId
 * @access  Private/Admin
 */
exports.getPaymentsByBooking = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const booking = await prisma.booking.findFirst({
      where: { id: req.params.bookingId, tenantId }
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    if (req.user?.role === 'sales' && booking.salesAdminId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const payments = await prisma.payment.findMany({
      where: { bookingId: req.params.bookingId, tenantId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all payments (tenantId scoped)
 * @route   GET /api/payments
 */
exports.getAllPayments = async (req, res, next) => {
  try {
    const where = { tenantId: req.user.tenantId };
    
    if (req.user?.role === 'sales') {
      const salesBookings = await prisma.booking.findMany({
        where: { salesAdminId: req.user.id, tenantId: req.user.tenantId },
        select: { id: true }
      });
      const bookingIds = salesBookings.map(b => b.id);
      where.bookingId = { in: bookingIds };
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete payment
 * @route   DELETE /api/payments/:id
 */
exports.deletePayment = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const payment = await prisma.payment.findFirst({
      where: { id: req.params.id, tenantId }
    });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    // Validate ownership before delete
    const booking = await prisma.booking.findFirst({
      where: { id: payment.bookingId, tenantId }
    });
    if (booking && req.user?.role === 'sales' && booking.salesAdminId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    await prisma.payment.delete({
      where: { id: req.params.id }
    });

    await syncBookingFromPayments(payment.bookingId, tenantId);

    await logAction({
      tenantId,
      actorUserId: req.user.id,
      action: 'payment_delete',
      entityType: 'payment',
      entityId: req.params.id,
      beforeData: payment,
      ipAddress: req.ip || null
    });

    res.json({ success: true, message: 'Payment deleted and booking synced' });
  } catch (error) {
    next(error);
  }
};
