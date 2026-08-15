const { prisma } = require("../lib/prisma");

const resolveTenantId = (req) => {
  return req.headers["x-tenant-id"] || req.user?.tenantId || "default";
};

// Seed/ensure initial default accounts if none exist
const ensureDefaultAccounts = async (tenantId, adminId) => {
  try {
    const count = await prisma.paymentReceivingAccount.count({
      where: { tenantId },
    });

    if (count === 0) {
      await prisma.paymentReceivingAccount.createMany({
        data: [
          {
            tenantId,
            accountName: "YouthCamping Company Account",
            accountHolderName: "Youth Camping Adventures Pvt Ltd",
            accountType: "COMPANY",
            ownershipType: "COMPANY",
            paymentMethods: ["UPI", "BANK_TRANSFER", "CARD", "OTHER"],
            bankName: "HDFC Bank",
            accountNumber: "50200084920192",
            maskedAccountNumber: "XXXX0192",
            ifsc: "HDFC0001234",
            upiId: "youthcamping@hdfcbank",
            description: "Official YouthCamping primary collection account",
            isApproved: true,
            isActive: true,
            createdByAdminId: adminId || null,
          },
          {
            tenantId,
            accountName: "Nikulbhai Patel Account",
            accountHolderName: "Nikulbhai Patel",
            accountType: "INDIVIDUAL",
            ownershipType: "INDIVIDUAL",
            paymentMethods: ["UPI", "BANK_TRANSFER"],
            bankName: "State Bank of India",
            accountNumber: "38920192841",
            maskedAccountNumber: "XXXX2841",
            ifsc: "SBIN0004821",
            upiId: "nikulbhai@upi",
            description: "Individual external collection account",
            isApproved: true,
            isActive: true,
            createdByAdminId: adminId || null,
          },
          {
            tenantId,
            accountName: "Cash Collection Account",
            accountHolderName: "YouthCamping Cash Desk",
            accountType: "CASH",
            ownershipType: "COMPANY",
            paymentMethods: ["CASH"],
            description: "Physical cash collection and venue register",
            isApproved: true,
            isActive: true,
            createdByAdminId: adminId || null,
          },
        ],
      });
    }
  } catch (e) {
    console.warn("ensureDefaultAccounts error:", e.message);
  }
};

/**
 * GET /api/payments/accounts
 * List all collection accounts with live computed balances
 */
exports.getAccounts = async (req, res) => {
  try {
    const tenantId = resolveTenantId(req);
    const { activeOnly } = req.query;

    await ensureDefaultAccounts(tenantId, req.user?.id);

    const where = { tenantId };
    if (activeOnly === "true") {
      where.isActive = true;
    }

    const accounts = await prisma.paymentReceivingAccount.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Compute live balance aggregates per account
    const accountIds = accounts.map((a) => a.id);

    const [clientPayments, stationPayments, submissions] = await Promise.all([
      prisma.opsClientPayment.findMany({
        where: {
          tenantId,
          collectionAccountId: { in: accountIds },
          status: { not: "Rejected" },
        },
        select: { collectionAccountId: true, amount: true, createdAt: true },
      }),
      prisma.stationPaymentCollection.findMany({
        where: {
          tenantId,
          receivingAccountId: { in: accountIds },
          isReversed: false,
        },
        select: { receivingAccountId: true, amount: true, createdAt: true },
      }),
      prisma.collectionAccountSubmission.findMany({
        where: {
          tenantId,
          accountId: { in: accountIds },
        },
        select: { accountId: true, amount: true, createdAt: true },
      }),
    ]);

    const collectedMap = {};
    const submittedMap = {};
    const lastActivityMap = {};

    clientPayments.forEach((p) => {
      if (!p.collectionAccountId) return;
      collectedMap[p.collectionAccountId] =
        (collectedMap[p.collectionAccountId] || 0) + (Number(p.amount) || 0);
      const cur = lastActivityMap[p.collectionAccountId];
      if (!cur || p.createdAt > cur) lastActivityMap[p.collectionAccountId] = p.createdAt;
    });

    stationPayments.forEach((p) => {
      if (!p.receivingAccountId) return;
      collectedMap[p.receivingAccountId] =
        (collectedMap[p.receivingAccountId] || 0) + (Number(p.amount) || 0);
      const cur = lastActivityMap[p.receivingAccountId];
      if (!cur || p.createdAt > cur) lastActivityMap[p.receivingAccountId] = p.createdAt;
    });

    submissions.forEach((s) => {
      if (!s.accountId) return;
      submittedMap[s.accountId] =
        (submittedMap[s.accountId] || 0) + (Number(s.amount) || 0);
      const cur = lastActivityMap[s.accountId];
      if (!cur || s.createdAt > cur) lastActivityMap[s.accountId] = s.createdAt;
    });

    const enriched = accounts.map((acc) => {
      const totalCollected = collectedMap[acc.id] || 0;
      const totalSubmitted = submittedMap[acc.id] || 0;
      const pending = Math.max(0, totalCollected - totalSubmitted);

      return {
        ...acc,
        totalCollected,
        totalSubmitted,
        pending,
        status: pending <= 0 ? "SETTLED" : "PENDING",
        lastActivity: lastActivityMap[acc.id] || acc.createdAt,
      };
    });

    const summary = {
      totalCollected: enriched.reduce((s, a) => s + a.totalCollected, 0),
      totalSubmitted: enriched.reduce((s, a) => s + a.totalSubmitted, 0),
      totalPending: enriched.reduce((s, a) => s + a.pending, 0),
    };

    return res.json({
      success: true,
      data: enriched,
      summary,
    });
  } catch (err) {
    console.error("getAccounts error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch collection accounts" });
  }
};

/**
 * POST /api/payments/accounts
 * Create a new collection account
 */
exports.createAccount = async (req, res) => {
  try {
    const tenantId = resolveTenantId(req);
    const {
      accountName,
      accountHolderName,
      accountType,
      ownershipType,
      paymentMethods,
      bankName,
      accountNumber,
      ifsc,
      upiId,
      description,
      isActive,
    } = req.body;

    if (!accountName || !accountName.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Account name is required" });
    }

    const maskedAccountNumber = accountNumber
      ? `XXXX${accountNumber.slice(-4)}`
      : null;

    const normalizedType = String(accountType || "COMPANY").toUpperCase();
    const validTypes = ["COMPANY", "INDIVIDUAL", "BANK", "UPI", "CASH", "CARD", "OTHER"];
    const finalType = validTypes.includes(normalizedType) ? normalizedType : "COMPANY";

    const account = await prisma.paymentReceivingAccount.create({
      data: {
        tenantId,
        accountName: accountName.trim(),
        accountHolderName: (accountHolderName || accountName).trim(),
        accountType: finalType,
        ownershipType: ownershipType || "COMPANY",
        paymentMethods: Array.isArray(paymentMethods) && paymentMethods.length > 0
          ? paymentMethods
          : ["UPI", "BANK_TRANSFER"],
        bankName: bankName?.trim() || null,
        accountNumber: accountNumber?.trim() || null,
        maskedAccountNumber,
        ifsc: ifsc?.trim() || null,
        upiId: upiId?.trim() || null,
        description: description?.trim() || null,
        isApproved: true,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        createdByAdminId: req.user?.id || null,
      },
    });

    return res.status(201).json({
      success: true,
      data: account,
      message: "Collection account created successfully",
    });
  } catch (err) {
    console.error("createAccount error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create collection account" });
  }
};

/**
 * PUT /api/payments/accounts/:id
 * Update an existing collection account
 */
exports.updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = resolveTenantId(req);
    const {
      accountName,
      accountHolderName,
      accountType,
      ownershipType,
      paymentMethods,
      bankName,
      accountNumber,
      ifsc,
      upiId,
      description,
      isActive,
    } = req.body;

    const existing = await prisma.paymentReceivingAccount.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Collection account not found" });
    }

    const maskedAccountNumber = accountNumber
      ? `XXXX${accountNumber.slice(-4)}`
      : existing.maskedAccountNumber;

    const updated = await prisma.paymentReceivingAccount.update({
      where: { id },
      data: {
        accountName: accountName !== undefined ? accountName.trim() : existing.accountName,
        accountHolderName:
          accountHolderName !== undefined
            ? accountHolderName.trim()
            : existing.accountHolderName,
        accountType: accountType !== undefined ? accountType : existing.accountType,
        ownershipType: ownershipType !== undefined ? ownershipType : existing.ownershipType,
        paymentMethods:
          paymentMethods !== undefined ? paymentMethods : existing.paymentMethods,
        bankName: bankName !== undefined ? bankName?.trim() || null : existing.bankName,
        accountNumber:
          accountNumber !== undefined ? accountNumber?.trim() || null : existing.accountNumber,
        maskedAccountNumber,
        ifsc: ifsc !== undefined ? ifsc?.trim() || null : existing.ifsc,
        upiId: upiId !== undefined ? upiId?.trim() || null : existing.upiId,
        description:
          description !== undefined ? description?.trim() || null : existing.description,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      },
    });

    return res.json({
      success: true,
      data: updated,
      message: "Collection account updated successfully",
    });
  } catch (err) {
    console.error("updateAccount error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update collection account" });
  }
};

/**
 * DELETE /api/payments/accounts/:id
 * Deactivate or delete collection account
 */
exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = resolveTenantId(req);

    // Soft delete by deactivating so historical records are never orphaned
    const updated = await prisma.paymentReceivingAccount.update({
      where: { id },
      data: { isActive: false },
    });

    return res.json({
      success: true,
      data: updated,
      message: "Collection account deactivated successfully",
    });
  } catch (err) {
    console.error("deleteAccount error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete collection account" });
  }
};

/**
 * GET /api/payments/accounts/:id/ledger
 * Fetch full chronological ledger of payments and submissions for an account
 */
exports.getAccountLedger = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = resolveTenantId(req);

    const account = await prisma.paymentReceivingAccount.findFirst({
      where: { id, tenantId },
    });

    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Collection account not found" });
    }

    const [clientPayments, stationPayments, submissions] = await Promise.all([
      prisma.opsClientPayment.findMany({
        where: { collectionAccountId: id, tenantId },
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
              email: true,
              tripName: true,
              tripId: true,
              departureDate: true,
              totalAmount: true,
              advancePaid: true,
              remainingAmount: true,
            },
          },
        },
      }),
      prisma.stationPaymentCollection.findMany({
        where: { receivingAccountId: id, tenantId, isReversed: false },
        orderBy: { createdAt: "desc" },
        include: {
          collectedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.collectionAccountSubmission.findMany({
        where: { accountId: id, tenantId },
        orderBy: { createdAt: "desc" },
        include: {
          recordedBy: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    const totalCollected =
      clientPayments
        .filter((p) => p.status !== "Rejected")
        .reduce((s, p) => s + (Number(p.amount) || 0), 0) +
      stationPayments
        .filter((p) => !p.isReversed)
        .reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const totalSubmitted = submissions.reduce(
      (s, sub) => s + (Number(sub.amount) || 0),
      0,
    );

    const pending = Math.max(0, totalCollected - totalSubmitted);

    return res.json({
      success: true,
      data: {
        account,
        clientPayments,
        stationPayments,
        submissions,
        metrics: {
          totalCollected,
          totalSubmitted,
          pending,
          status: pending <= 0 ? "SETTLED" : "PENDING",
        },
      },
    });
  } catch (err) {
    console.error("getAccountLedger error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch account ledger" });
  }
};

/**
 * POST /api/payments/accounts/:id/submit
 * Record a fund transfer/submission from a collection account
 */
exports.recordAccountSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = resolveTenantId(req);
    const { amount, paymentMode, referenceNumber, notes } = req.body;

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Valid submission amount is required" });
    }

    const account = await prisma.paymentReceivingAccount.findFirst({
      where: { id, tenantId },
    });

    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Collection account not found" });
    }

    const submission = await prisma.collectionAccountSubmission.create({
      data: {
        tenantId,
        accountId: id,
        amount: amt,
        paymentMode: paymentMode || "BANK_TRANSFER",
        referenceNumber: referenceNumber || null,
        notes: notes || null,
        recordedByAdminId: req.user?.id,
      },
      include: {
        account: { select: { id: true, accountName: true, accountHolderName: true } },
        recordedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(201).json({
      success: true,
      data: submission,
      message: "Transfer/submission recorded successfully",
    });
  } catch (err) {
    console.error("recordAccountSubmission error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to record submission" });
  }
};
