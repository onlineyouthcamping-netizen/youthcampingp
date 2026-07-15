const { prisma } = require('../lib/prisma');

function normalizeDepartureDateIndia(dateInput) {
  if (!dateInput) return null;
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const directDate = new Date(`${dateInput}T00:00:00.000Z`);
    if (!isNaN(directDate.getTime())) return directDate;
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const indiaDateStr = formatter.format(d);
    return new Date(`${indiaDateStr}T00:00:00.000Z`);
  } catch {
    return d;
  }
}

async function parseDepartureFilter(req, res) {
  const { tripId: rawTripId } = req.params;
  const rawDate = req.query.departureDate || req.body.departureDate;

  if (!rawDate) {
    res.status(400).json({ success: false, message: 'departureDate is required' });
    return null;
  }

  const departureDate = normalizeDepartureDateIndia(rawDate);
  if (!departureDate || isNaN(departureDate.getTime())) {
    res.status(400).json({ success: false, message: 'Invalid departureDate format' });
    return null;
  }

  const tenantId = req.user?.tenantId || 'default';
  let tripId = rawTripId;
  if (rawTripId) {
    const trip = await prisma.trip.findFirst({
      where: {
        tenantId,
        OR: [
          { id: rawTripId },
          { slug: rawTripId },
          { shortName: rawTripId }
        ]
      },
      select: { id: true }
    });
    if (trip) tripId = trip.id;
  }

  const where = { tenantId, tripId, departureDate };

  let bookingWhere = { tenantId, tripId, status: { notIn: ['cancelled', 'rejected'] } };
  const startOfDay = new Date(departureDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(departureDate);
  endOfDay.setUTCHours(23, 59, 59, 999);
  bookingWhere.departureDate = { gte: startOfDay, lte: endOfDay };

  return { tenantId, tripId, departureDate, where, bookingWhere };
}

// ── CLIENT RECEIPTS / RECEIVABLES ──
exports.getClientPayments = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res);
    if (!ctx) return;

    // Fetch all bookings for this departure
    const bookings = await prisma.booking.findMany({
      where: ctx.bookingWhere,
      select: {
        bookingId: true,
        name: true,
        totalAmount: true,
        advancePaid: true,
        remainingAmount: true,
        paymentStatus: true,
        passengers: true
      }
    });

    const bookingIds = bookings.map(b => b.bookingId);

    // Fetch all recorded transaction receipts
    const receipts = await prisma.opsClientPayment.findMany({
      where: {
        bookingId: { in: bookingIds }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: {
        bookings,
        receipts
      }
    });
  } catch (err) {
    console.error('getClientPayments error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch client payments' });
  }
};

exports.addClientPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amount, paymentMode, transactionId, paymentDate, proofUrl, status, remarks } = req.body;
    const tenantId = req.user?.tenantId || 'default';

    const booking = await prisma.booking.findUnique({
      where: { bookingId }
    });

    if (!booking) {
      return res.status(444).json({ success: false, message: 'Booking not found' });
    }

    const receipt = await prisma.opsClientPayment.create({
      data: {
        tenantId,
        bookingId,
        amount: parseFloat(amount) || 0,
        paymentMode,
        transactionId,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        proofUrl,
        status: status || 'Pending Verification',
        collectedBy: req.user?.name || req.user?.email || 'Staff',
        remarks
      }
    });

    // Automatically recalculate booking advancePaid and remainingAmount if status is Verified
    if (receipt.status === 'Verified') {
      const allVerified = await prisma.opsClientPayment.findMany({
        where: { bookingId, status: 'Verified' }
      });
      const totalVerified = allVerified.reduce((s, r) => s + r.amount, 0);
      const remaining = Math.max(0, booking.totalAmount - totalVerified);
      
      await prisma.booking.update({
        where: { bookingId },
        data: {
          advancePaid: totalVerified,
          remainingAmount: remaining,
          paymentStatus: remaining === 0 ? 'Paid' : totalVerified > 0 ? 'Partially Paid' : 'Unpaid'
        }
      });
    }

    return res.json({ success: true, data: receipt });
  } catch (err) {
    console.error('addClientPayment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record client payment' });
  }
};

exports.verifyClientPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; // Verified, Rejected, Refunded

    const receipt = await prisma.opsClientPayment.findUnique({
      where: { id }
    });

    if (!receipt) {
      return res.status(444).json({ success: false, message: 'Payment record not found' });
    }

    const updated = await prisma.opsClientPayment.update({
      where: { id },
      data: {
        status,
        remarks: remarks || receipt.remarks
      }
    });

    // Update booking totals
    const booking = await prisma.booking.findUnique({
      where: { bookingId: receipt.bookingId }
    });

    if (booking) {
      const allVerified = await prisma.opsClientPayment.findMany({
        where: { bookingId: receipt.bookingId, status: 'Verified' }
      });
      const totalVerified = allVerified.reduce((s, r) => s + r.amount, 0);
      const remaining = Math.max(0, booking.totalAmount - totalVerified);

      await prisma.booking.update({
        where: { bookingId: receipt.bookingId },
        data: {
          advancePaid: totalVerified,
          remainingAmount: remaining,
          paymentStatus: remaining === 0 ? 'Paid' : totalVerified > 0 ? 'Partially Paid' : 'Unpaid'
        }
      });
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('verifyClientPayment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify client payment' });
  }
};

// ── VENDOR PAYMENTS ──
exports.getVendorPayments = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res);
    if (!ctx) return;

    const vendorPayments = await prisma.opsVendorPayment.findMany({
      where: ctx.where,
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: vendorPayments });
  } catch (err) {
    console.error('getVendorPayments error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch vendor payments' });
  }
};

exports.createVendorPayment = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { departureDate, vendorName, category, serviceDescription, agreedAmount, advancePaid, paymentDate, paymentMode, transactionId, invoiceProof, status, remarks } = req.body;
    const tenantId = req.user?.tenantId || 'default';

    const depDate = normalizeDepartureDateIndia(departureDate);
    const agreed = parseFloat(agreedAmount) || 0;
    const advance = parseFloat(advancePaid) || 0;
    const remaining = Math.max(0, agreed - advance);

    const payment = await prisma.opsVendorPayment.create({
      data: {
        tenantId,
        tripId,
        departureDate: depDate,
        vendorName,
        category,
        serviceDescription,
        agreedAmount: agreed,
        advancePaid: advance,
        remainingPayable: remaining,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        paymentMode,
        transactionId,
        invoiceProof,
        status: status || 'Not Paid',
        paidBy: req.user?.name || req.user?.email || 'Operations',
        remarks
      }
    });

    return res.json({ success: true, data: payment });
  } catch (err) {
    console.error('createVendorPayment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create vendor payment' });
  }
};

exports.updateVendorPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { vendorName, category, serviceDescription, agreedAmount, advancePaid, paymentDate, paymentMode, transactionId, invoiceProof, status, remarks } = req.body;

    const existing = await prisma.opsVendorPayment.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(444).json({ success: false, message: 'Vendor payment not found' });
    }

    const agreed = agreedAmount !== undefined ? parseFloat(agreedAmount) : existing.agreedAmount;
    const advance = advancePaid !== undefined ? parseFloat(advancePaid) : existing.advancePaid;
    const remaining = Math.max(0, agreed - advance);

    const updated = await prisma.opsVendorPayment.update({
      where: { id },
      data: {
        vendorName: vendorName || existing.vendorName,
        category: category || existing.category,
        serviceDescription: serviceDescription !== undefined ? serviceDescription : existing.serviceDescription,
        agreedAmount: agreed,
        advancePaid: advance,
        remainingPayable: remaining,
        paymentDate: paymentDate ? new Date(paymentDate) : existing.paymentDate,
        paymentMode: paymentMode !== undefined ? paymentMode : existing.paymentMode,
        transactionId: transactionId !== undefined ? transactionId : existing.transactionId,
        invoiceProof: invoiceProof !== undefined ? invoiceProof : existing.invoiceProof,
        status: status || existing.status,
        remarks: remarks !== undefined ? remarks : existing.remarks
      }
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('updateVendorPayment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update vendor payment' });
  }
};

exports.deleteVendorPayment = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.opsVendorPayment.delete({
      where: { id }
    });
    return res.json({ success: true, message: 'Vendor payment deleted' });
  } catch (err) {
    console.error('deleteVendorPayment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete vendor payment' });
  }
};

// ── FINANCIAL DASHBOARD STATS ──
exports.getPaymentsDashboardStats = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res);
    if (!ctx) return;

    // Fetch Client Totals
    const bookings = await prisma.booking.findMany({
      where: ctx.bookingWhere,
      select: {
        bookingId: true,
        totalAmount: true
      }
    });

    const totalClientRevenue = bookings.reduce((s, b) => s + (b.totalAmount || 0), 0);

    const bookingIds = bookings.map(b => b.bookingId);
    const clientPayments = await prisma.opsClientPayment.findMany({
      where: {
        bookingId: { in: bookingIds },
        status: 'Verified'
      },
      select: {
        amount: true
      }
    });

    const clientAmountReceived = clientPayments.reduce((s, p) => s + p.amount, 0);
    const clientOutstandingBalance = Math.max(0, totalClientRevenue - clientAmountReceived);

    // Fetch Vendor Totals
    const vendorPayments = await prisma.opsVendorPayment.findMany({
      where: ctx.where,
      select: {
        agreedAmount: true,
        advancePaid: true,
        remainingPayable: true
      }
    });

    const totalVendorPayable = vendorPayments.reduce((s, v) => s + v.agreedAmount, 0);
    const vendorAmountPaid = vendorPayments.reduce((s, v) => s + v.advancePaid, 0);
    const vendorOutstandingBalance = vendorPayments.reduce((s, v) => s + v.remainingPayable, 0);

    // Profits
    const estProfit = totalClientRevenue - totalVendorPayable;
    const actProfit = clientAmountReceived - vendorAmountPaid;

    return res.json({
      success: true,
      data: {
        totalClientRevenue,
        clientAmountReceived,
        clientOutstandingBalance,
        totalVendorPayable,
        vendorAmountPaid,
        vendorOutstandingBalance,
        estimatedProfit: estProfit,
        actualProfit: actProfit
      }
    });
  } catch (err) {
    console.error('getPaymentsDashboardStats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to compute payment dashboard stats' });
  }
};
