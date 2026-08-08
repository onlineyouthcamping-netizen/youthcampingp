const { prisma } = require("../lib/prisma");

exports.getLedgerEntries = async (req, res, next) => {
  try {
    const entries = await prisma.generalLedgerEntry.findMany({
      orderBy: { date: "desc" },
      include: {
        vendor: { select: { id: true, name: true, vendorCode: true } }
      }
    });

    // Calculate running balances or summary
    const totalCredit = entries.filter(e => e.type === "CREDIT").reduce((sum, e) => sum + e.amount, 0);
    const totalDebit = entries.filter(e => e.type === "DEBIT").reduce((sum, e) => sum + e.amount, 0);

    res.json({
      success: true,
      data: entries,
      summary: {
        totalCredit,
        totalDebit,
        balance: totalCredit - totalDebit
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.createLedgerEntry = async (req, res, next) => {
  try {
    const {
      vendorId,
      date,
      type, // CREDIT | DEBIT
      amount,
      description,
      referenceId
    } = req.body;

    const entry = await prisma.generalLedgerEntry.create({
      data: {
        vendorId,
        date: date ? new Date(date) : new Date(),
        type,
        amount: Number(amount),
        description,
        referenceId
      },
      include: {
        vendor: { select: { id: true, name: true, vendorCode: true } }
      }
    });

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};
