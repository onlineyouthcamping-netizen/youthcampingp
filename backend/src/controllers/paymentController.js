const { prisma } = require("../lib/prisma");
const { PAYMENT_STATUS } = require("../utils/paymentStatus");
const { resolveTenantId } = require("../utils/tenantContext");

function normalizeDepartureDateIndia(dateInput) {
  if (!dateInput) return null;
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const directDate = new Date(`${dateInput}T00:00:00.000Z`);
    if (!isNaN(directDate.getTime())) return directDate;
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
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
    res
      .status(400)
      .json({ success: false, message: "departureDate is required" });
    return null;
  }

  const departureDate = normalizeDepartureDateIndia(rawDate);
  if (!departureDate || isNaN(departureDate.getTime())) {
    res
      .status(400)
      .json({ success: false, message: "Invalid departureDate format" });
    return null;
  }

  const tenantId = req.user?.tenantId || "default";
  let tripId = rawTripId;
  if (rawTripId) {
    const trip = await prisma.trip.findFirst({
      where: {
        tenantId,
        OR: [{ id: rawTripId }, { slug: rawTripId }, { shortName: rawTripId }],
      },
      select: { id: true },
    });
    if (trip) tripId = trip.id;
  }

  const where = { tenantId, tripId, departureDate };

  let bookingWhere = {
    tenantId,
    tripId,
    status: { notIn: ["cancelled", "rejected"] },
  };
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
        id: true,
        bookingId: true,
        name: true,
        fullName: true,
        phone: true,
        mobile: true,
        email: true,
        numberOfTravelers: true,
        totalAmount: true,
        advancePaid: true,
        remainingAmount: true,
        paymentStatus: true,
        passengers: true,
        createdAt: true,
      },
    });

    const bookingIds = bookings.map((b) => b.bookingId);

    // Fetch all recorded transaction receipts
    const receipts = await prisma.opsClientPayment.findMany({
      where: {
        bookingId: { in: bookingIds },
      },
      include: {
        collectionAccount: {
          select: {
            id: true,
            accountName: true,
            accountHolderName: true,
            accountType: true,
            bankName: true,
            upiId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      data: {
        bookings,
        receipts,
      },
    });
  } catch (err) {
    console.error("getClientPayments error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch client payments" });
  }
};

exports.addClientPayment = async (req, res) => {
  try {
    const { bookingId: paramBookingId } = req.params;
    const {
      amount,
      paymentMode,
      collectionAccountId,
      transactionId,
      paymentDate,
      proofUrl,
      status,
      remarks,
    } = req.body;
    const tenantId = resolveTenantId(req);

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id: paramBookingId }, { bookingId: paramBookingId }],
      },
    });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    const targetBookingId = booking.bookingId || booking.id;

    // Resolve or fallback to default active collection account
    let targetAccountId = collectionAccountId || null;
    if (!targetAccountId) {
      if (paymentMode && String(paymentMode).toUpperCase().includes("CASH")) {
        const cashAcc = await prisma.paymentReceivingAccount.findFirst({
          where: {
            tenantId,
            isActive: true,
            OR: [{ accountType: "CASH" }, { accountName: { contains: "Cash", mode: "insensitive" } }],
          },
        });
        targetAccountId = cashAcc?.id || null;
      } else if (!paymentMode || String(paymentMode).toUpperCase().includes("UPI")) {
        const upiAcc = await prisma.paymentReceivingAccount.findFirst({
          where: {
            tenantId,
            isActive: true,
            OR: [
              { accountName: { contains: "Nikul", mode: "insensitive" } },
              { upiId: { contains: "nikul", mode: "insensitive" } },
              { accountType: "INDIVIDUAL" },
              { accountType: "UPI" },
            ],
          },
        });
        targetAccountId = upiAcc?.id || null;
      }
      if (!targetAccountId) {
        const defaultAcc = await prisma.paymentReceivingAccount.findFirst({
          where: { tenantId, isActive: true },
          orderBy: { createdAt: "asc" },
        });
        targetAccountId = defaultAcc?.id || null;
      }
    }

    const receipt = await prisma.opsClientPayment.create({
      data: {
        tenantId,
        bookingId: targetBookingId,
        amount: parseFloat(amount) || 0,
        paymentMode,
        collectionAccountId: targetAccountId,
        transactionId,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        proofUrl,
        status: status || "Verified",
        collectedBy: req.user?.name || req.user?.email || "Staff",
        recordedByUserId: req.user?.id || null,
        remarks,
      },
      include: {
        collectionAccount: {
          select: { id: true, accountName: true, accountHolderName: true, accountType: true },
        },
      },
    });

    // Automatically recalculate booking advancePaid and remainingAmount if status is Verified
    const allVerified = await prisma.opsClientPayment.findMany({
      where: { bookingId: targetBookingId, status: "Verified" },
    });
    const totalVerified = allVerified.reduce((s, r) => s + r.amount, 0);
    const remaining = Math.max(0, booking.totalAmount - totalVerified);

    const updateData = {
      advancePaid: totalVerified,
      remainingAmount: remaining,
      paymentStatus:
        remaining === 0 && totalVerified > 0
          ? PAYMENT_STATUS.PAID
          : totalVerified > 0
            ? PAYMENT_STATUS.PARTIAL
            : PAYMENT_STATUS.UNPAID,
      payment_status:
        remaining === 0 && totalVerified > 0
          ? "paid"
          : totalVerified > 0
            ? "partial"
            : "unpaid",
    };

    // Auto-confirm booking if not already confirmed or cancelled upon receiving verified payment
    if (booking.status !== "confirmed" && booking.status !== "cancelled" && totalVerified > 0) {
      updateData.status = "confirmed";
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: updateData,
    });

    // Auto-sync into AccountingEntry for full accounting ledger visibility
    if (receipt.status === "Verified") {
      try {
        const rawMode = String(paymentMode || "UPI").toUpperCase();
        const normalizedMode = rawMode.includes("CASH")
          ? "CASH"
          : rawMode.includes("BANK") || rawMode.includes("NEFT") || rawMode.includes("IMPS")
            ? "BANK_TRANSFER"
            : "UPI";

        await prisma.accountingEntry.create({
          data: {
            tenantId,
            bookingId: targetBookingId,
            amount: parseFloat(amount) || 0,
            paymentMode: normalizedMode,
            collectionAccountId: targetAccountId,
            referenceNumber: transactionId || `PAY-${receipt.id}`,
            notes: remarks || "Recorded via Booking Workspace",
            status: "APPROVED",
            salespersonId: req.user?.id || booking.salesAdminId,
            actionedById: req.user?.id,
          },
        });
      } catch (entryErr) {
        console.warn("AccountingEntry auto-sync skipped:", entryErr.message);
      }
    }

    // Auto-log confirmation email if booking just became confirmed
    if (updateData.status === "confirmed" && booking.status !== "confirmed") {
      try {
        const templates = require("../lib/email");
        if (templates && templates.confirmation) {
          const templateData = templates.confirmation(updatedBooking);
          await prisma.emailLog.create({
            data: {
              tenantId,
              bookingId: updatedBooking.bookingId || updatedBooking.id,
              recipientEmail: updatedBooking.email || "",
              subject: templateData.subject,
              body: templateData.html,
              status: "SENT",
              sentAt: new Date(),
              metadata: { type: "confirmation", autoTriggeredOnPayment: true },
            },
          });
        }
      } catch (emailErr) {
        console.error("Auto email log on payment error:", emailErr);
      }
    }

    return res.json({ success: true, data: receipt });
  } catch (err) {
    console.error("addClientPayment error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to record client payment" });
  }
};

exports.verifyClientPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; // Verified, Rejected, Refunded

    const receipt = await prisma.opsClientPayment.findUnique({
      where: { id },
    });

    if (!receipt) {
      return res
        .status(404)
        .json({ success: false, message: "Payment record not found" });
    }

    const updated = await prisma.opsClientPayment.update({
      where: { id },
      data: {
        status,
        remarks: remarks || receipt.remarks,
      },
    });

    // Update booking totals
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ bookingId: receipt.bookingId }, { id: receipt.bookingId }],
      },
    });

    if (booking) {
      const allVerified = await prisma.opsClientPayment.findMany({
        where: { bookingId: receipt.bookingId, status: "Verified" },
      });
      const totalVerified = allVerified.reduce((s, r) => s + r.amount, 0);
      const remaining = Math.max(0, booking.totalAmount - totalVerified);

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          advancePaid: totalVerified,
          remainingAmount: remaining,
          paymentStatus:
            remaining === 0 && totalVerified > 0
              ? PAYMENT_STATUS.PAID
              : totalVerified > 0
                ? PAYMENT_STATUS.PARTIAL
                : PAYMENT_STATUS.UNPAID,
          payment_status:
            remaining === 0 && totalVerified > 0
              ? "paid"
              : totalVerified > 0
                ? "partial"
                : "unpaid",
        },
      });
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("verifyClientPayment error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to verify client payment" });
  }
};

exports.getBookingPayments = async (req, res) => {
  try {
    const { bookingId: paramBookingId } = req.params;
    const tenantId = req.user?.tenantId || "default";

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id: paramBookingId }, { bookingId: paramBookingId }],
      },
    });

    const possibleBookingIds = booking
      ? Array.from(new Set([booking.id, booking.bookingId].filter(Boolean)))
      : [paramBookingId];

    // Query standard Payment records
    const standardPayments = await prisma.payment.findMany({
      where: { bookingId: { in: possibleBookingIds }, tenantId },
      orderBy: { createdAt: "desc" },
    });

    // Query operations client receipts (manual uploads)
    const clientReceipts = await prisma.opsClientPayment.findMany({
      where: { bookingId: { in: possibleBookingIds }, tenantId },
      include: {
        collectionAccount: {
          select: { id: true, accountName: true, accountHolderName: true, accountType: true },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    // Merge both sources together cleanly
    const allPayments = [
      ...standardPayments.map((p) => ({
        id: p.id,
        amount: p.amount,
        paymentMode: p.paymentMode || "Online",
        collectionAccountId: null,
        collectionAccount: null,
        notes: p.transactionId
          ? `Txn ID: ${p.transactionId}`
          : "Booking payment",
        status: p.status || "success",
        createdAt: p.createdAt,
      })),
      ...clientReceipts.map((r) => ({
        id: r.id,
        amount: r.amount,
        paymentMode: r.paymentMode,
        collectionAccountId: r.collectionAccountId || null,
        collectionAccount: r.collectionAccount || null,
        notes: r.remarks || "Manual Payment",
        status:
          r.status === "Verified"
            ? "success"
            : r.status === "Rejected"
              ? "failed"
              : "pending",
        createdAt: r.paymentDate,
      })),
    ];

    // Compute basic totals
    const successfulPayments = allPayments.filter(
      (p) => p.status === "success",
    );
    const totalPaid = successfulPayments.reduce((sum, p) => sum + p.amount, 0);

    return res.json({
      success: true,
      data: allPayments,
      summary: {
        totalPaid,
        paymentsCount: allPayments.length,
      },
    });
  } catch (err) {
    console.error("getBookingPayments error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to retrieve booking payments" });
  }
};

// ── VENDOR PAYMENTS ──
exports.getVendorPayments = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res);
    if (!ctx) return;

    const vendorPayments = await prisma.opsVendorPayment.findMany({
      where: ctx.where,
      include: {
        collectionAccount: {
          select: {
            id: true,
            accountName: true,
            accountHolderName: true,
            accountType: true,
            bankName: true,
            upiId: true,
            accountNumber: true,
            maskedAccountNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: vendorPayments });
  } catch (err) {
    console.error("getVendorPayments error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch vendor payments" });
  }
};

exports.getAllRecordedVendorPayments = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || "default";

    // 1. Fetch direct recorded OpsVendorPayment entries
    const [vendorPayments, bookings, companyAcc] = await Promise.all([
      prisma.opsVendorPayment.findMany({
        where: { tenantId },
        include: {
          collectionAccount: {
            select: {
              id: true,
              accountName: true,
              accountHolderName: true,
              accountType: true,
              bankName: true,
              upiId: true,
              accountNumber: true,
              maskedAccountNumber: true,
            },
          },
          trip: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.findMany({
        where: { tenantId },
        select: { tripId: true, departureDate: true, status: true },
      }),
      prisma.paymentReceivingAccount.findFirst({
        where: { tenantId, accountType: "COMPANY" },
        select: {
          id: true,
          accountName: true,
          accountHolderName: true,
          accountType: true,
          bankName: true,
        },
      }),
    ]);

    // 2. Determine active departure dates with passenger bookings
    const activeDepDates = Array.from(
      new Set(
        bookings
          .filter((b) => b.departureDate)
          .map((b) => new Date(b.departureDate).toISOString())
      )
    ).map((dStr) => new Date(dStr));

    // 3. Fetch operational allocations for active departures with bookings
    const [hotels, fleets, guides] = await Promise.all([
      activeDepDates.length > 0
        ? prisma.opsHotelBooking.findMany({
            where: {
              tenantId,
              departureDate: { in: activeDepDates },
              totalAmount: { gt: 0 },
              hotelName: { not: "NO_STAY" },
            },
            include: {
              trip: {
                select: { id: true, title: true, slug: true },
              },
            },
            orderBy: { departureDate: "asc" },
          })
        : [],
      activeDepDates.length > 0
        ? prisma.opsTransportFleet.findMany({
            where: {
              tenantId,
              departureDate: { in: activeDepDates },
              totalAmount: { gt: 0 },
            },
            include: {
              trip: {
                select: { id: true, title: true, slug: true },
              },
            },
            orderBy: { departureDate: "asc" },
          })
        : [],
      activeDepDates.length > 0
        ? prisma.opsGuidePayment.findMany({
            where: {
              tenantId,
              departureDate: { in: activeDepDates },
              agreedAmount: { gt: 0 },
            },
            include: {
              trip: {
                select: { id: true, title: true, slug: true },
              },
            },
            orderBy: { departureDate: "asc" },
          })
        : [],
    ]);

    // Group and aggregate hotel allocations per vendor per departure
    const groupedHotels = {};
    hotels.forEach((h) => {
      const dStr = h.departureDate ? new Date(h.departureDate).toISOString().substring(0, 10) : "N/A";
      const vName = (h.hotelName || "").trim();
      const key = `${vName.toLowerCase()}_${h.tripId}_${dStr}`;

      // Deduplicate: if an explicit OpsVendorPayment exists for this vendor + trip + departure, skip duplicate
      const alreadyInVendorPayments = vendorPayments.some((vp) => {
        const vpDate = vp.departureDate ? new Date(vp.departureDate).toISOString().substring(0, 10) : "";
        return (
          vp.tripId === h.tripId &&
          vpDate === dStr &&
          vp.vendorName?.toLowerCase().trim() === vName.toLowerCase()
        );
      });
      if (alreadyInVendorPayments) return;

      if (!groupedHotels[key]) {
        groupedHotels[key] = {
          id: `hb-${h.id}`,
          tenantId: h.tenantId,
          tripId: h.tripId,
          departureDate: h.departureDate,
          vendorName: vName,
          category: "Hotels",
          serviceDescription: `${h.roomType || "Hotel"} Stay (${h.location || "Local"})`,
          agreedAmount: 0,
          advancePaid: 0,
          collectionAccount: companyAcc,
          trip: h.trip,
          createdAt: h.createdAt,
        };
      }
      groupedHotels[key].agreedAmount += Number(h.totalAmount || 0);
      groupedHotels[key].advancePaid += Number(h.advancePaid || 0);
    });

    const mappedHotels = Object.values(groupedHotels).map((h) => {
      const remaining = Math.max(0, h.agreedAmount - h.advancePaid);
      const isPaid = h.advancePaid >= h.agreedAmount && h.agreedAmount > 0;

      return {
        ...h,
        remainingPayable: remaining,
        paymentDate: h.departureDate || h.createdAt,
        paymentMode: "BANK_TRANSFER",
        status: isPaid ? "Paid" : h.advancePaid > 0 ? "Advance Paid" : "Pending Approval",
        approvalStatus: isPaid ? "APPROVED_FOUNDER" : "PENDING",
        requiresFounderApproval: remaining > 50000,
        invoiceProof: null,
      };
    });

    const mappedFleets = fleets
      .filter((f) => {
        const dStr = f.departureDate ? new Date(f.departureDate).toISOString().substring(0, 10) : "N/A";
        const vName = (f.vendorName || f.driverName || "Transport Fleet").trim();
        const alreadyInVendorPayments = vendorPayments.some((vp) => {
          const vpDate = vp.departureDate ? new Date(vp.departureDate).toISOString().substring(0, 10) : "";
          return (
            vp.tripId === f.tripId &&
            vpDate === dStr &&
            vp.vendorName?.toLowerCase().trim() === vName.toLowerCase()
          );
        });
        return !alreadyInVendorPayments;
      })
      .map((f) => {
        const agreed = Number(f.totalAmount || 0);
        const advance = Number(f.advancePaid || 0);
        const remaining = Math.max(0, agreed - advance);
        const isPaid = advance >= agreed && agreed > 0;

        return {
          id: `fl-${f.id}`,
          tenantId: f.tenantId,
          tripId: f.tripId,
          departureDate: f.departureDate,
          vendorName: (f.vendorName || f.driverName || "Transport Fleet").trim(),
          category: "Transport",
          serviceDescription: `${f.vehicleType || "Fleet"} (${f.vehicleNumber || "Route Fleet"})`,
          agreedAmount: agreed,
          advancePaid: advance,
          remainingPayable: remaining,
          paymentDate: f.departureDate || f.createdAt,
          paymentMode: "BANK_TRANSFER",
          status: isPaid ? "Paid" : advance > 0 ? "Advance Paid" : "Pending Approval",
          approvalStatus: isPaid ? "APPROVED_FOUNDER" : "PENDING",
          requiresFounderApproval: remaining > 50000,
          collectionAccount: companyAcc,
          trip: f.trip,
          invoiceProof: null,
          createdAt: f.createdAt,
        };
      });

    const mappedGuides = guides
      .filter((g) => {
        const dStr = g.departureDate ? new Date(g.departureDate).toISOString().substring(0, 10) : "N/A";
        const vName = (g.guideName || "Lead Guide").trim();
        const alreadyInVendorPayments = vendorPayments.some((vp) => {
          const vpDate = vp.departureDate ? new Date(vp.departureDate).toISOString().substring(0, 10) : "";
          return (
            vp.tripId === g.tripId &&
            vpDate === dStr &&
            vp.vendorName?.toLowerCase().trim() === vName.toLowerCase()
          );
        });
        return !alreadyInVendorPayments;
      })
      .map((g) => {
        const agreed = Number(g.agreedAmount || 0);
        const advance = Number(g.advancePaid || 0);
        const remaining = Math.max(0, agreed - advance);
        const isPaid = g.paymentStatus === "PAID" || (advance >= agreed && agreed > 0);

        return {
          id: `gp-${g.id}`,
          tenantId: g.tenantId,
          tripId: g.tripId,
          departureDate: g.departureDate,
          vendorName: (g.guideName || "Lead Guide").trim(),
          category: "Guides",
          serviceDescription: `${g.assignmentType || "Trip Leader"} (${g.daysWorked || 1} Days)`,
          agreedAmount: agreed,
          advancePaid: advance,
          remainingPayable: remaining,
          paymentDate: g.departureDate || g.createdAt,
          paymentMode: "BANK_TRANSFER",
          status: isPaid ? "Paid" : advance > 0 ? "Advance Paid" : "Pending Approval",
          approvalStatus: isPaid ? "APPROVED_FOUNDER" : "PENDING",
          requiresFounderApproval: remaining > 50000,
          collectionAccount: companyAcc,
          trip: g.trip,
          invoiceProof: null,
          createdAt: g.createdAt,
        };
      });

    const allVendorDisbursements = [
      ...vendorPayments,
      ...mappedHotels,
      ...mappedFleets,
      ...mappedGuides,
    ];

    return res.json({ success: true, data: allVendorDisbursements });
  } catch (err) {
    console.error("getAllRecordedVendorPayments error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch vendor payments" });
  }
};

async function resolveTargetAccountId(tenantId, paymentMode, collectionAccountId) {
  if (
    collectionAccountId &&
    collectionAccountId !== "__someone_else__" &&
    collectionAccountId !== "__trek_leader__" &&
    collectionAccountId !== "__driver__" &&
    collectionAccountId !== "__founder_personal__"
  ) {
    return collectionAccountId;
  }
  const mode = String(paymentMode || "").toUpperCase();
  if (mode.includes("CASH")) {
    const cashAcc = await prisma.paymentReceivingAccount.findFirst({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { accountType: "CASH" },
          { accountName: { contains: "Cash", mode: "insensitive" } },
        ],
      },
    });
    if (cashAcc) return cashAcc.id;
  } else if (mode.includes("UPI") || mode.includes("BANK") || mode.includes("NEFT")) {
    const defaultAcc = await prisma.paymentReceivingAccount.findFirst({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { accountType: "COMPANY" },
          { accountType: "INDIVIDUAL" },
          { accountName: { contains: "Nikul", mode: "insensitive" } },
        ],
      },
    });
    if (defaultAcc) return defaultAcc.id;
  }
  return null;
}

async function syncOperationalVendorRecord(tenantId, tripId, depDate, vendorName, category, agreed, advance, targetId) {
  try {
    const remaining = Math.max(0, (agreed || 0) - (advance || 0));
    const catLower = (category || "").toLowerCase();

    // 1. Hotel booking sync
    if (catLower.includes("hotel") || catLower.includes("stay") || catLower.includes("camp")) {
      const hotelWhere = { tenantId };
      if (tripId && tripId !== "default") hotelWhere.tripId = tripId;
      if (depDate) hotelWhere.departureDate = depDate;

      if (targetId && (targetId.startsWith("hb-") || targetId.length === 24 || targetId.length === 25)) {
        const rawId = targetId.startsWith("hb-") ? targetId.replace("hb-", "") : targetId;
        await prisma.opsHotelBooking.updateMany({
          where: { id: rawId },
          data: { advancePaid: advance, balanceAmount: remaining },
        });
      }
      if (vendorName) {
        await prisma.opsHotelBooking.updateMany({
          where: { ...hotelWhere, hotelName: { equals: vendorName.trim(), mode: "insensitive" } },
          data: { advancePaid: advance, balanceAmount: remaining },
        });
      }
    }

    // 2. Transport fleet sync
    if (catLower.includes("transport") || catLower.includes("fleet") || catLower.includes("cab") || catLower.includes("bus")) {
      const fleetWhere = { tenantId };
      if (tripId && tripId !== "default") fleetWhere.tripId = tripId;
      if (depDate) fleetWhere.departureDate = depDate;

      if (targetId && (targetId.startsWith("fl-") || targetId.length === 24 || targetId.length === 25)) {
        const rawId = targetId.startsWith("fl-") ? targetId.replace("fl-", "") : targetId;
        await prisma.opsTransportFleet.updateMany({
          where: { id: rawId },
          data: { advancePaid: advance, balanceAmount: remaining },
        });
      }
      if (vendorName) {
        await prisma.opsTransportFleet.updateMany({
          where: {
            ...fleetWhere,
            OR: [
              { vendorName: { equals: vendorName.trim(), mode: "insensitive" } },
              { driverName: { equals: vendorName.trim(), mode: "insensitive" } },
              { notes: { contains: vendorName.trim(), mode: "insensitive" } },
            ],
          },
          data: { advancePaid: advance, balanceAmount: remaining },
        });
      }
    }

    // 3. Guide payment sync
    if (catLower.includes("guide") || catLower.includes("leader")) {
      const guideWhere = { tenantId };
      if (tripId && tripId !== "default") guideWhere.tripId = tripId;
      if (depDate) guideWhere.departureDate = depDate;
      const statusLabel = advance >= agreed && agreed > 0 ? "PAID" : advance > 0 ? "PARTIAL" : "PENDING";

      if (targetId && (targetId.startsWith("gp-") || targetId.length === 24 || targetId.length === 25)) {
        const rawId = targetId.startsWith("gp-") ? targetId.replace("gp-", "") : targetId;
        await prisma.opsGuidePayment.updateMany({
          where: { id: rawId },
          data: { advancePaid: advance, balanceAmount: remaining, paymentStatus: statusLabel },
        });
      }
      if (vendorName) {
        await prisma.opsGuidePayment.updateMany({
          where: { ...guideWhere, guideName: { equals: vendorName.trim(), mode: "insensitive" } },
          data: { advancePaid: advance, balanceAmount: remaining, paymentStatus: statusLabel },
        });
      }
    }

    // 4. Departure Activity sync
    if (catLower.includes("activit")) {
      const actWhere = { tenantId };
      if (tripId && tripId !== "default") actWhere.tripId = tripId;
      if (depDate) actWhere.departureDate = depDate;

      if (targetId && (targetId.startsWith("act-") || targetId.length === 24 || targetId.length === 25)) {
        const rawId = targetId.startsWith("act-vendor-") ? targetId.replace("act-vendor-", "") : targetId;
        await prisma.opsDepartureActivity.updateMany({
          where: { id: rawId },
          data: { actualCost: advance },
        });
      }
      if (vendorName) {
        await prisma.opsDepartureActivity.updateMany({
          where: {
            ...actWhere,
            OR: [
              { vendorName: { equals: vendorName.trim(), mode: "insensitive" } },
              { name: { equals: vendorName.trim(), mode: "insensitive" } },
            ],
          },
          data: { actualCost: advance },
        });
      }
    }
  } catch (syncErr) {
    console.warn("syncOperationalVendorRecord warning:", syncErr.message);
  }
}

exports.createVendorPayment = async (req, res) => {
  try {
    const { tripId: rawTripId } = req.params;
    const {
      departureDate,
      vendorName,
      category = "Hotels",
      serviceDescription,
      agreedAmount,
      advancePaid,
      paymentDate,
      paymentMode,
      collectionAccountId,
      transactionId,
      invoiceProof,
      status,
      remarks,
    } = req.body;
    const tenantId = req.user?.tenantId || "default";

    // Resolve trip ID if slug or shortName was passed
    let tripId = rawTripId;
    if (rawTripId) {
      const trip = await prisma.trip.findFirst({
        where: {
          tenantId,
          OR: [{ id: rawTripId }, { slug: rawTripId }, { shortName: rawTripId }],
        },
        select: { id: true },
      });
      if (trip) tripId = trip.id;
    }

    const depDate = normalizeDepartureDateIndia(departureDate);
    const agreed = parseFloat(agreedAmount) || 0;
    const advance = parseFloat(advancePaid) || 0;
    const remaining = Math.max(0, agreed - advance);

    const targetAccountId = await resolveTargetAccountId(tenantId, paymentMode, collectionAccountId);

    // Check if an existing OpsVendorPayment matches this trip + departureDate + vendorName
    let payment = null;
    if (depDate && vendorName) {
      payment = await prisma.opsVendorPayment.findFirst({
        where: {
          tenantId,
          tripId,
          departureDate: depDate,
          vendorName: { equals: vendorName.trim(), mode: "insensitive" },
        },
      });
    }

    if (payment) {
      payment = await prisma.opsVendorPayment.update({
        where: { id: payment.id },
        data: {
          vendorName: vendorName ? vendorName.trim() : payment.vendorName,
          category: category || payment.category,
          serviceDescription: serviceDescription !== undefined ? serviceDescription : payment.serviceDescription,
          agreedAmount: agreed > 0 ? agreed : payment.agreedAmount,
          advancePaid: advance,
          remainingPayable: remaining,
          paymentDate: paymentDate ? new Date(paymentDate) : payment.paymentDate,
          paymentMode: paymentMode || payment.paymentMode,
          collectionAccountId: targetAccountId !== undefined ? targetAccountId : payment.collectionAccountId,
          transactionId: transactionId || payment.transactionId,
          invoiceProof: invoiceProof !== undefined ? invoiceProof : payment.invoiceProof,
          status: status || (advance >= agreed && agreed > 0 ? "Paid" : advance > 0 ? "Advance Paid" : "Pending"),
          remarks: remarks !== undefined ? remarks : payment.remarks,
        },
        include: {
          collectionAccount: true,
        },
      });
    } else {
      payment = await prisma.opsVendorPayment.create({
        data: {
          tenantId,
          tripId,
          departureDate: depDate || new Date(),
          vendorName: vendorName ? vendorName.trim() : "Vendor Partner",
          category: category || "Hotels",
          serviceDescription: serviceDescription || "Trip Service Invoice",
          agreedAmount: agreed,
          advancePaid: advance,
          remainingPayable: remaining,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          paymentMode: paymentMode || "BANK_TRANSFER",
          collectionAccountId: targetAccountId,
          transactionId: transactionId || `TXN-${Date.now()}`,
          invoiceProof: invoiceProof || "",
          invoiceFileUrl: invoiceProof || "",
          advanceProofUrl: invoiceProof || "",
          status: status || (advance >= agreed && agreed > 0 ? "Paid" : advance > 0 ? "Advance Paid" : "Pending"),
          paidBy: req.user?.name || req.user?.email || "Operations",
          remarks: remarks || "",
        },
        include: {
          collectionAccount: true,
        },
      });
    }

    // Sync with operational models (Hotels, Transport, Guides, Activities)
    await syncOperationalVendorRecord(tenantId, tripId, depDate, vendorName, category, agreed, advance, null);

    return res.json({ success: true, data: payment });
  } catch (err) {
    console.error("createVendorPayment error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create vendor payment" });
  }
};

exports.updateVendorPayment = async (req, res) => {
  try {
    const { id, tripId: rawTripId } = req.params;
    const {
      departureDate,
      vendorName,
      category,
      serviceDescription,
      agreedAmount,
      advancePaid,
      paymentDate,
      paymentMode,
      collectionAccountId,
      transactionId,
      invoiceProof,
      status,
      remarks,
    } = req.body;
    const tenantId = req.user?.tenantId || "default";

    // Resolve trip ID if slug or shortName was passed
    let tripId = rawTripId;
    if (rawTripId) {
      const trip = await prisma.trip.findFirst({
        where: {
          tenantId,
          OR: [{ id: rawTripId }, { slug: rawTripId }, { shortName: rawTripId }],
        },
        select: { id: true },
      });
      if (trip) tripId = trip.id;
    }

    const depDate = departureDate ? normalizeDepartureDateIndia(departureDate) : null;
    const agreed = agreedAmount !== undefined ? parseFloat(agreedAmount) || 0 : undefined;
    const advance = advancePaid !== undefined ? parseFloat(advancePaid) || 0 : undefined;
    const targetAccountId = await resolveTargetAccountId(tenantId, paymentMode, collectionAccountId);

    let existing = null;
    // 1. Try finding by ID directly in OpsVendorPayment
    if (
      id &&
      !id.startsWith("hb-") &&
      !id.startsWith("fl-") &&
      !id.startsWith("gp-") &&
      !id.startsWith("auto-") &&
      !id.startsWith("act-vendor-") &&
      !id.startsWith("VND-")
    ) {
      existing = await prisma.opsVendorPayment.findUnique({
        where: { id },
      });
    }

    // 2. If not found by ID, look up by tripId, departureDate, vendorName
    if (!existing && vendorName) {
      const searchWhere = {
        tenantId,
        vendorName: { equals: vendorName.trim(), mode: "insensitive" },
      };
      if (tripId) searchWhere.tripId = tripId;
      if (depDate) searchWhere.departureDate = depDate;

      existing = await prisma.opsVendorPayment.findFirst({
        where: searchWhere,
      });
    }

    let updated = null;
    if (existing) {
      const finalAgreed = agreed !== undefined ? agreed : existing.agreedAmount;
      const finalAdvance = advance !== undefined ? advance : existing.advancePaid;
      const remaining = Math.max(0, finalAgreed - finalAdvance);
      const computedStatus =
        status !== undefined
          ? status
          : finalAdvance >= finalAgreed && finalAgreed > 0
            ? "Paid"
            : finalAdvance > 0
              ? "Advance Paid"
              : "Pending";

      updated = await prisma.opsVendorPayment.update({
        where: { id: existing.id },
        data: {
          vendorName: vendorName || existing.vendorName,
          category: category || existing.category,
          serviceDescription:
            serviceDescription !== undefined
              ? serviceDescription
              : existing.serviceDescription,
          agreedAmount: finalAgreed,
          advancePaid: finalAdvance,
          remainingPayable: remaining,
          paymentDate: paymentDate ? new Date(paymentDate) : existing.paymentDate,
          paymentMode:
            paymentMode !== undefined ? paymentMode : existing.paymentMode,
          collectionAccountId:
            targetAccountId !== undefined
              ? targetAccountId
              : existing.collectionAccountId,
          transactionId:
            transactionId !== undefined ? transactionId : existing.transactionId,
          invoiceProof:
            invoiceProof !== undefined ? invoiceProof : existing.invoiceProof,
          invoiceFileUrl:
            invoiceProof !== undefined ? invoiceProof : existing.invoiceFileUrl,
          advanceProofUrl:
            invoiceProof !== undefined ? invoiceProof : existing.advanceProofUrl,
          status: computedStatus,
          remarks: remarks !== undefined ? remarks : existing.remarks,
        },
        include: {
          collectionAccount: true,
        },
      });

      await syncOperationalVendorRecord(
        tenantId,
        tripId || existing.tripId,
        depDate || existing.departureDate,
        vendorName || existing.vendorName,
        category || existing.category,
        finalAgreed,
        finalAdvance,
        id,
      );
    } else {
      // Create new OpsVendorPayment record if it didn't exist
      const finalAgreed = agreed || 0;
      const finalAdvance = advance || 0;
      const remaining = Math.max(0, finalAgreed - finalAdvance);
      const computedStatus =
        status ||
        (finalAdvance >= finalAgreed && finalAgreed > 0
          ? "Paid"
          : finalAdvance > 0
            ? "Advance Paid"
            : "Pending");

      updated = await prisma.opsVendorPayment.create({
        data: {
          tenantId,
          tripId: tripId || "default",
          departureDate: depDate || new Date(),
          vendorName: vendorName ? vendorName.trim() : "Vendor Partner",
          category: category || "Hotels",
          serviceDescription: serviceDescription || "Operational Service",
          agreedAmount: finalAgreed,
          advancePaid: finalAdvance,
          remainingPayable: remaining,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          paymentMode: paymentMode || "BANK_TRANSFER",
          collectionAccountId: targetAccountId,
          transactionId: transactionId || `TXN-${Date.now()}`,
          invoiceProof: invoiceProof || "",
          invoiceFileUrl: invoiceProof || "",
          advanceProofUrl: invoiceProof || "",
          status: computedStatus,
          paidBy: req.user?.name || req.user?.email || "Operations",
          remarks: remarks || "",
        },
        include: {
          collectionAccount: true,
        },
      });

      await syncOperationalVendorRecord(
        tenantId,
        tripId || "default",
        depDate,
        vendorName,
        category,
        finalAgreed,
        finalAdvance,
        id,
      );
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("updateVendorPayment error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update vendor payment" });
  }
};

exports.verifyVendorPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const existing = await prisma.opsVendorPayment.findUnique({
      where: { id },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor payment record not found" });
    }

    const updated = await prisma.opsVendorPayment.update({
      where: { id },
      data: {
        status: status || "Paid",
        remarks: remarks || existing.remarks,
      },
    });

    return res.json({
      success: true,
      data: updated,
      message: "Vendor payment status updated",
    });
  } catch (err) {
    console.error("verifyVendorPayment error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to verify vendor payment" });
  }
};

exports.getFinanceVerificationQueue = async (req, res) => {
  try {
    const tenantId = resolveTenantId(req);

    const [
      pendingClientPayments,
      pendingStationPayments,
      pendingVendorPayments,
      pendingTrainTickets,
    ] = await Promise.all([
      prisma.opsClientPayment.findMany({
        where: {
          tenantId,
          status: {
            in: [
              "Pending Verification",
              "Pending Approval",
              "PENDING",
              "Pending",
            ],
          },
        },
        orderBy: { createdAt: "desc" },
        include: {
          booking: {
            select: {
              id: true,
              bookingId: true,
              fullName: true,
              name: true,
              phone: true,
              mobile: true,
              tripName: true,
              departureDate: true,
              totalAmount: true,
            },
          },
          collectionAccount: {
            select: {
              id: true,
              accountName: true,
              accountType: true,
              bankName: true,
            },
          },
        },
      }),
      prisma.stationPaymentCollection.findMany({
        where: {
          tenantId,
          isReversed: false,
          OR: [
            { upiVerificationStatus: "PENDING_VERIFICATION" },
            { paymentMode: "UPI", upiVerificationStatus: { not: "VERIFIED" } },
            { paymentMode: "CASH", verifiedAt: null, collectionStatus: "COLLECTED" },
          ],
        },
        orderBy: { createdAt: "desc" },
        include: {
          booking: {
            select: {
              id: true,
              bookingId: true,
              fullName: true,
              name: true,
              phone: true,
              tripName: true,
            },
          },
          collectedBy: { select: { id: true, name: true, email: true } },
          receivingAccount: {
            select: { id: true, accountName: true, accountType: true },
          },
        },
      }),
      prisma.opsVendorPayment.findMany({
        where: {
          tenantId,
          OR: [
            { approvalStatus: { in: ["PENDING", "REVIEWED_FINANCE_CONTROLLER"] } },
            {
              status: {
                in: [
                  "Pending Approval",
                  "Pending Verification",
                  "PENDING",
                  "Pending",
                  "Not Paid",
                  "Advance Paid",
                ],
              },
            },
          ],
          approvalStatus: { notIn: ["APPROVED_FOUNDER", "REJECTED"] },
        },
        orderBy: { createdAt: "desc" },
        include: {
          trip: { select: { id: true, title: true, slug: true } },
          collectionAccount: {
            select: {
              id: true,
              accountName: true,
              accountType: true,
              bankName: true,
            },
          },
        },
      }),
      prisma.trainTicket.findMany({
        where: {
          tenantId,
          ticketStatus: { not: "CANCELLED" },
          ticketAmount: { gt: 0 },
          OR: [
            { financeStatus: { in: ["PENDING_VERIFICATION", "PENDING"] } },
            { financeStatus: null },
          ],
        },
        orderBy: { createdAt: "desc" },
        include: {
          booking: {
            select: {
              id: true,
              bookingId: true,
              fullName: true,
              name: true,
              phone: true,
              tripName: true,
              tripId: true,
              departureDate: true,
              tripRef: {
                select: {
                  id: true,
                  title: true,
                  shortName: true,
                  slug: true,
                  trainTicketTemplate: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        pendingClientPayments,
        pendingStationPayments,
        pendingVendorPayments,
        pendingTrainTickets,
        totalPendingCount:
          pendingClientPayments.length +
          pendingStationPayments.length +
          pendingVendorPayments.length +
          pendingTrainTickets.length,
      },
    });
  } catch (err) {
    console.error("getFinanceVerificationQueue error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch verification queue" });
  }
};

exports.getRiyaSummary = async (req, res) => {
  try {
    const tenantId = resolveTenantId(req);

    // 1. Find Riya account
    let riyaAccount = await prisma.paymentReceivingAccount.findFirst({
      where: {
        tenantId,
        accountName: { contains: "Riya", mode: "insensitive" },
      },
    });

    if (!riyaAccount) {
      riyaAccount = await prisma.paymentReceivingAccount.create({
        data: {
          tenantId,
          accountName: "Riya Train Portal Account",
          accountHolderName: "Riya Travel & Tours (India) Pvt Ltd",
          accountType: "OTHER",
          ownershipType: "PARTNER",
          paymentMethods: ["BANK_TRANSFER", "UPI"],
          description:
            "Authoritative Riya train ticketing wallet for IRCTC/train bookings",
          isApproved: true,
          isActive: true,
        },
      });
    }

    // 2. Fetch all recharges / inward transfers into Riya account
    const recharges = await prisma.collectionAccountSubmission.findMany({
      where: { tenantId, accountId: riyaAccount.id },
      orderBy: { createdAt: "desc" },
      include: {
        recordedBy: { select: { id: true, name: true, email: true } },
      },
    });

    const totalRechargeAmount = recharges.reduce(
      (sum, r) => sum + (Number(r.amount) || 0),
      0,
    );

    // 3. Fetch all train tickets issued
    const tickets = await prisma.trainTicket.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          select: {
            id: true,
            bookingId: true,
            fullName: true,
            name: true,
            phone: true,
            tripName: true,
            tripId: true,
            departureDate: true,
            tripRef: {
              select: { id: true, title: true, shortName: true, slug: true },
            },
          },
        },
      },
    });

    const activeTickets = tickets.filter((t) => t.ticketStatus !== "CANCELLED");
    const totalTicketsIssuedCount = activeTickets.length;
    const totalTicketCostConsumed = activeTickets.reduce(
      (sum, t) => sum + (Number(t.ticketAmount) || 0),
      0,
    );

    const totalRefunds = tickets.reduce(
      (sum, t) => sum + (Number(t.refundAmount) || 0),
      0,
    );

    const availableRiyaBalance =
      totalRechargeAmount - totalTicketCostConsumed + totalRefunds;

    return res.json({
      success: true,
      data: {
        account: riyaAccount,
        totalRechargeAmount,
        totalTicketsIssuedCount,
        totalTicketCostConsumed,
        totalRefunds,
        availableRiyaBalance,
        recharges,
        tickets,
      },
    });
  } catch (err) {
    console.error("getRiyaSummary error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch Riya wallet summary" });
  }
};

exports.deleteVendorPayment = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.opsVendorPayment.delete({
      where: { id },
    });
    return res.json({ success: true, message: "Vendor payment deleted" });
  } catch (err) {
    console.error("deleteVendorPayment error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete vendor payment" });
  }
};

// ── FINANCIAL DASHBOARD STATS ──
exports.getPaymentsDashboardStats = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res);
    if (!ctx) return;

    // Fetch Client Totals — include advancePaid so outstanding is correct
    // even before opsClientPayment receipts are manually logged
    const bookings = await prisma.booking.findMany({
      where: ctx.bookingWhere,
      select: {
        bookingId: true,
        totalAmount: true,
        advancePaid: true,
        remainingAmount: true,
      },
    });

    const totalClientRevenue = bookings.reduce(
      (s, b) => s + (b.totalAmount || 0),
      0,
    );

    const bookingIds = bookings.map((b) => b.bookingId);
    const clientPayments = await prisma.opsClientPayment.findMany({
      where: {
        bookingId: { in: bookingIds },
        status: "Verified",
      },
      select: {
        amount: true,
        bookingId: true,
      },
    });

    // Build a map of opsClientPayment sums per booking
    const receiptSumByBooking = {};
    clientPayments.forEach((p) => {
      receiptSumByBooking[p.bookingId] =
        (receiptSumByBooking[p.bookingId] || 0) + p.amount;
    });

    // For each booking, use the higher of: advancePaid OR sum of verified receipts
    // This ensures outstanding is correct whether the team uses manual receipt logging or not
    let clientAmountReceived = 0;
    let clientOutstandingBalance = 0;
    bookings.forEach((b) => {
      const advancePaid = b.advancePaid || 0;
      const receiptSum = receiptSumByBooking[b.bookingId] || 0;
      const effectivePaid = Math.max(advancePaid, receiptSum);
      const outstanding =
        b.remainingAmount !== undefined && b.remainingAmount !== null
          ? b.remainingAmount
          : Math.max(0, (b.totalAmount || 0) - effectivePaid);
      clientAmountReceived += effectivePaid;
      clientOutstandingBalance += outstanding;
    });

    // Fetch Vendor Totals
    const vendorPayments = await prisma.opsVendorPayment.findMany({
      where: ctx.where,
      select: {
        agreedAmount: true,
        advancePaid: true,
        remainingPayable: true,
      },
    });

    const totalVendorPayable = vendorPayments.reduce(
      (s, v) => s + v.agreedAmount,
      0,
    );
    const vendorAmountPaid = vendorPayments.reduce(
      (s, v) => s + v.advancePaid,
      0,
    );
    const vendorOutstandingBalance = vendorPayments.reduce(
      (s, v) => s + v.remainingPayable,
      0,
    );

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
        actualProfit: actProfit,
      },
    });
  } catch (err) {
    console.error("getPaymentsDashboardStats error:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to compute payment dashboard stats",
      });
  }
};

exports.getAllVendorPayablesQueue = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || "default";

    // 1. Fetch all hotel bookings
    const hotelBookings = await prisma.opsHotelBooking.findMany({
      where: { tenantId },
      include: { trip: { select: { id: true, title: true, slug: true } } },
    });

    // 2. Fetch all transport fleet
    const transportFleet = await prisma.opsTransportFleet.findMany({
      where: { tenantId },
      include: {
        vendor: { select: { id: true, name: true, type: true } },
        trip: { select: { id: true, title: true, slug: true } },
      },
    });

    // 3. Fetch all recorded vendor payments
    const opsPayments = await prisma.opsVendorPayment.findMany({
      where: { tenantId },
    });

    // Aggregate by (vendorName, tripId, category)
    const queueMap = new Map();

    hotelBookings.forEach((h) => {
      const vName = (h.hotelName || "Hotel Vendor").trim();
      const tripTitle = h.trip?.title || "Spiti Valley Road Trip";
      const tripCode = h.tripId || "SPT-1";
      const key = `${vName.toLowerCase()}_HOTEL_${h.tripId}`;

      const total = Number(h.totalAmount || 0);
      const paid = Number(h.advancePaid || 0);
      const bal = Number(h.balanceAmount ?? (total - paid));

      if (queueMap.has(key)) {
        const existing = queueMap.get(key);
        existing.totalAmount += total;
        existing.paidAmount += paid;
        existing.balanceAmount += bal;
      } else {
        queueMap.set(key, {
          id: h.id,
          vendorId: { name: vName, type: "HOTELS" },
          vendorName: vName,
          category: "HOTELS",
          tripName: tripTitle,
          tripCode: tripCode,
          tripId: h.tripId,
          totalAmount: total,
          paidAmount: paid,
          balanceAmount: bal,
          dueDate: h.checkIn ? h.checkIn.toISOString().split("T")[0] : null,
          paymentStatus: paid >= total && total > 0 ? "paid" : paid > 0 ? "partial" : "pending",
        });
      }
    });

    transportFleet.forEach((t) => {
      const vName = (t.vendor?.name || t.notes || t.driverName || "Transport Vendor").trim();
      const tripTitle = t.trip?.title || "Spiti Valley Road Trip";
      const tripCode = t.tripId || "SPT-1";
      const key = `${vName.toLowerCase()}_TRANSPORT_${t.tripId}`;

      const total = Number(t.totalAmount || 0);
      const paid = Number(t.advancePaid || 0);
      const bal = Number(t.balanceAmount ?? (total - paid));

      if (queueMap.has(key)) {
        const existing = queueMap.get(key);
        existing.totalAmount += total;
        existing.paidAmount += paid;
        existing.balanceAmount += bal;
      } else {
        queueMap.set(key, {
          id: t.id,
          vendorId: { name: vName, type: "TRANSPORT" },
          vendorName: vName,
          category: "TRANSPORT",
          tripName: tripTitle,
          tripCode: tripCode,
          tripId: t.tripId,
          totalAmount: total,
          paidAmount: paid,
          balanceAmount: bal,
          dueDate: t.departureDate ? t.departureDate.toISOString().split("T")[0] : null,
          paymentStatus: paid >= total && total > 0 ? "paid" : paid > 0 ? "partial" : "pending",
        });
      }
    });

    opsPayments.forEach((p) => {
      const vName = (p.vendorName || "Vendor").trim();
      const cat = (p.category || "OTHER").toUpperCase();
      const key = `${vName.toLowerCase()}_${cat}_${p.tripId}`;

      const total = Number(p.agreedAmount || 0);
      const paid = Number(p.advancePaid || 0);
      const bal = Number(p.remainingPayable ?? (total - paid));

      if (!queueMap.has(key)) {
        queueMap.set(key, {
          id: p.id,
          vendorId: { name: vName, type: cat },
          vendorName: vName,
          category: cat,
          tripName: "Spiti Valley Road Trip",
          tripCode: "SPT-1",
          tripId: p.tripId,
          totalAmount: total,
          paidAmount: paid,
          balanceAmount: bal,
          dueDate: p.paymentDate ? p.paymentDate.toISOString().split("T")[0] : null,
          paymentStatus: paid >= total && total > 0 ? "paid" : paid > 0 ? "partial" : "pending",
        });
      }
    });

    const result = Array.from(queueMap.values());
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("getAllVendorPayablesQueue error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.syncOperationalVendorRecord = syncOperationalVendorRecord;

